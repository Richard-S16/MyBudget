"use server";

import { eq, and, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
  monthlyPlans,
  allocationRules,
  income,
  expenses,
  type CategoryType,
} from "@/lib/db/schema";
import { BUCKET_TYPES, bucketLabels } from "@/lib/buckets";

export interface BucketSummary {
  type: CategoryType;
  label: string;
  percentage: number;
  planned: number;
  actual: number;
  difference: number;
}

export interface MonthlyPlanWithBuckets {
  plan: typeof monthlyPlans.$inferSelect;
  expectedIncome: number;
  receivedIncome: number;
  buckets: BucketSummary[];
  totalPlanned: number;
  totalActual: number;
}

export async function getOrCreateMonthlyPlan(
  userId: string,
  yearMonth: string
) {
  const existing = await db.query.monthlyPlans.findFirst({
    where: (table, { and }) =>
      and(eq(table.userId, userId), eq(table.yearMonth, yearMonth)),
  });

  if (existing) return existing;

  const [plan] = await db
    .insert(monthlyPlans)
    .values({ userId, yearMonth })
    .returning();

  return plan;
}

export async function getMonthlyPlanWithBuckets(
  userId: string,
  yearMonth: string
): Promise<MonthlyPlanWithBuckets> {
  const plan = await getOrCreateMonthlyPlan(userId, yearMonth);

  const incomeResult = await db
    .select({
      expected: sql<number>`coalesce(sum(${income.amount}), 0)`,
      received: sql<number>`coalesce(sum(case when ${income.status} = 'received' then ${income.amount} else 0 end), 0)`,
    })
    .from(income)
    .where(eq(income.monthlyPlanId, plan.id));

  const expectedIncome = Number(incomeResult[0]?.expected ?? 0);
  const receivedIncome = Number(incomeResult[0]?.received ?? 0);

  const allocationRows = await db
    .select()
    .from(allocationRules)
    .where(eq(allocationRules.monthlyPlanId, plan.id));

  const expenseRows = await db.query.expenses.findMany({
    where: eq(expenses.monthlyPlanId, plan.id),
    with: { category: true },
  });

  const actualByType = BUCKET_TYPES.reduce<Record<CategoryType, number>>(
    (acc, type) => {
      acc[type] = 0;
      return acc;
    },
    {} as Record<CategoryType, number>
  );

  for (const item of expenseRows) {
    const type = item.category?.type;
    if (type) actualByType[type] += Number(item.amount);
  }

  const percentageByType: Record<CategoryType, number> = {
    fixed_expenses: 0,
    investments: 0,
    donations: 0,
    free_spending: 0,
  };
  for (const row of allocationRows) {
    percentageByType[row.type] = row.percentage;
  }

  const buckets: BucketSummary[] = BUCKET_TYPES.map((type) => {
    const percentage = percentageByType[type];
    const planned = Math.round(expectedIncome * (percentage / 100) * 100) / 100;
    const actual = actualByType[type];
    return {
      type,
      label: bucketLabels[type],
      percentage,
      planned,
      actual,
      difference: actual - planned,
    };
  });

  return {
    plan,
    expectedIncome,
    receivedIncome,
    buckets,
    totalPlanned: buckets.reduce((sum, b) => sum + b.planned, 0),
    totalActual: buckets.reduce((sum, b) => sum + b.actual, 0),
  };
}

export async function updateMonthlyPlanNotes(
  monthlyPlanId: string,
  formData: FormData
) {
  const notes = String(formData.get("notes") ?? "").trim();

  await db
    .update(monthlyPlans)
    .set({ notes: notes || null })
    .where(eq(monthlyPlans.id, monthlyPlanId));

  revalidatePath("/dashboard/plan");
  revalidatePath("/dashboard");
}

export async function updateAllocations(
  monthlyPlanId: string,
  formData: FormData
) {
  const entries = BUCKET_TYPES.map((type) => {
    const raw = Number(formData.get(type));
    const percentage = Number.isNaN(raw)
      ? 0
      : Math.max(0, Math.min(100, Math.round(raw)));
    return { type, percentage };
  });

  const total = entries.reduce((sum, e) => sum + e.percentage, 0);
  if (total > 100) {
    throw new Error("Total allocation cannot exceed 100%");
  }

  for (const { type, percentage } of entries) {
    const [updated] = await db
      .update(allocationRules)
      .set({ percentage })
      .where(
        and(
          eq(allocationRules.monthlyPlanId, monthlyPlanId),
          eq(allocationRules.type, type)
        )
      )
      .returning();

    if (!updated) {
      await db
        .insert(allocationRules)
        .values({ monthlyPlanId, type, percentage });
    }
  }

  revalidatePath("/dashboard/plan");
  revalidatePath("/dashboard");
}

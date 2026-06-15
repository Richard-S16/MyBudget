"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { income } from "@/lib/db/schema";

export async function getIncomeByMonth(userId: string, yearMonth: string) {
  const plan = await db.query.monthlyPlans.findFirst({
    where: (table, { and }) =>
      and(eq(table.userId, userId), eq(table.yearMonth, yearMonth)),
    with: {
      income: {
        orderBy: (income, { desc }) => [desc(income.expectedDate), desc(income.createdAt)],
      },
    },
  });

  return plan?.income ?? [];
}

export async function createIncome(monthlyPlanId: string, formData: FormData) {
  const description = String(formData.get("description") ?? "").trim();
  const amount = Number(formData.get("amount"));
  const status = String(formData.get("status") ?? "expected") as "expected" | "received";
  const expectedDateRaw = String(formData.get("expectedDate") ?? "");
  const receivedAtRaw = String(formData.get("receivedAt") ?? "");

  if (!description) throw new Error("Description required");
  if (Number.isNaN(amount) || amount <= 0) throw new Error("Amount must be positive");

  const expectedDate = expectedDateRaw ? new Date(expectedDateRaw) : undefined;
  const receivedAt = receivedAtRaw ? new Date(receivedAtRaw) : undefined;

  const [record] = await db
    .insert(income)
    .values({
      monthlyPlanId,
      description,
      amount: amount.toFixed(2),
      status,
      expectedDate,
      receivedAt,
    })
    .returning();

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/income");
  return record;
}

export async function updateIncome(incomeId: string, formData: FormData) {
  const description = String(formData.get("description") ?? "").trim();
  const amount = Number(formData.get("amount"));
  const status = String(formData.get("status") ?? "expected") as "expected" | "received";
  const expectedDateRaw = String(formData.get("expectedDate") ?? "");
  const receivedAtRaw = String(formData.get("receivedAt") ?? "");

  if (!description) throw new Error("Description required");
  if (Number.isNaN(amount) || amount <= 0) throw new Error("Amount must be positive");

  const expectedDate = expectedDateRaw ? new Date(expectedDateRaw) : null;
  const receivedAt = receivedAtRaw ? new Date(receivedAtRaw) : null;

  const [record] = await db
    .update(income)
    .set({
      description,
      amount: amount.toFixed(2),
      status,
      expectedDate,
      receivedAt,
    })
    .where(eq(income.id, incomeId))
    .returning();

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/income");
  return record;
}

export async function deleteIncome(incomeId: string) {
  await db.delete(income).where(eq(income.id, incomeId));
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/income");
}

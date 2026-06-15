"use server";

import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { expenses, income } from "@/lib/db/schema";

export async function getMonthSummary(userId: string, yearMonth: string) {
  const plan = await db.query.monthlyPlans.findFirst({
    where: (table, { and }) =>
      and(eq(table.userId, userId), eq(table.yearMonth, yearMonth)),
  });

  if (!plan) {
    return {
      expectedIncome: 0,
      receivedIncome: 0,
      totalExpenses: 0,
    };
  }

  const incomeResult = await db
    .select({
      expected: sql<number>`coalesce(sum(${income.amount}), 0)`,
      received: sql<number>`coalesce(sum(case when ${income.status} = 'received' then ${income.amount} else 0 end), 0)`,
    })
    .from(income)
    .where(eq(income.monthlyPlanId, plan.id));

  const expenseResult = await db
    .select({
      total: sql<number>`coalesce(sum(${expenses.amount}), 0)`,
    })
    .from(expenses)
    .where(eq(expenses.monthlyPlanId, plan.id));

  return {
    expectedIncome: Number(incomeResult[0]?.expected ?? 0),
    receivedIncome: Number(incomeResult[0]?.received ?? 0),
    totalExpenses: Number(expenseResult[0]?.total ?? 0),
  };
}

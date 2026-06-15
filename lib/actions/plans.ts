"use server";

import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { monthlyPlans } from "@/lib/db/schema";

export async function getOrCreateMonthlyPlan(userId: string, yearMonth: string) {
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

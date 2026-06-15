"use server";

import { getMonthlyPlanWithBuckets, type BucketSummary } from "@/lib/actions/plans";

export interface MonthSummary {
  expectedIncome: number;
  receivedIncome: number;
  totalExpenses: number;
  totalPlanned: number;
  buckets: BucketSummary[];
  upcomingObligations: number;
}

export async function getMonthSummary(
  userId: string,
  yearMonth: string
): Promise<MonthSummary> {
  const plan = await getMonthlyPlanWithBuckets(userId, yearMonth);

  return {
    expectedIncome: plan.expectedIncome,
    receivedIncome: plan.receivedIncome,
    totalExpenses: plan.totalActual,
    totalPlanned: plan.totalPlanned,
    buckets: plan.buckets,
    upcomingObligations: 0,
  };
}

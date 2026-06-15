"use server";

import { getMonthlyPlanWithBuckets, type BucketSummary } from "@/lib/actions/plans";
import { getMonthlyRecurringTotal } from "@/lib/actions/recurring";
import { getActiveInstallmentTotal } from "@/lib/actions/installments";

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

  const [recurringTotal, installmentTotal] = await Promise.all([
    getMonthlyRecurringTotal(userId, yearMonth),
    getActiveInstallmentTotal(userId),
  ]);

  return {
    expectedIncome: plan.expectedIncome,
    receivedIncome: plan.receivedIncome,
    totalExpenses: plan.totalActual,
    totalPlanned: plan.totalPlanned,
    buckets: plan.buckets,
    upcomingObligations: recurringTotal + installmentTotal,
  };
}

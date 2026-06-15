"use server";

import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  getCurrentYearMonth,
  addMonths,
  parseYearMonth,
  toYearMonth,
} from "@/lib/date";
import { getRecurringExpenses } from "@/lib/actions/recurring";
import { getInstallments } from "@/lib/actions/installments";
import {
  isRecurringDueInMonth,
  getRecurringDateInMonth,
} from "@/lib/recurring";

export interface CashFlowIncomeEntry {
  id: string;
  description: string;
  amount: number;
  expectedDate: Date | null;
}

export interface CashFlowObligation {
  description: string;
  amount: number;
  type: "recurring" | "installment";
  day: number;
}

export interface CashFlowEvent {
  yearMonth: string;
  expectedIncome: number;
  obligations: number;
  net: number;
  runningBalance: number;
  income: CashFlowIncomeEntry[];
  obligationsDetails: CashFlowObligation[];
}

export interface CashFlowTimeline {
  currentBalance: number;
  months: number;
  monthsLabel: string;
  startingBalance: number;
  events: CashFlowEvent[];
  totalExpectedIncome: number;
  totalObligations: number;
  lowestBalance: { value: number; yearMonth: string } | null;
}

function monthDiff(a: string, b: string): number {
  const start = parseYearMonth(a);
  const end = parseYearMonth(b);
  return (
    (end.getFullYear() - start.getFullYear()) * 12 +
    (end.getMonth() - start.getMonth())
  );
}

function clampDayToMonth(day: number, yearMonth: string): number {
  const date = parseYearMonth(yearMonth);
  const lastDay = new Date(
    date.getFullYear(),
    date.getMonth() + 1,
    0
  ).getDate();
  return Math.min(Math.max(day, 1), lastDay);
}

async function getIncomeSnapshot(userId: string, yearMonth: string) {
  const plan = await db.query.monthlyPlans.findFirst({
    where: (table, { and }) =>
      and(eq(table.userId, userId), eq(table.yearMonth, yearMonth)),
    with: {
      income: {
        orderBy: (income, { desc }) => [
          desc(income.expectedDate),
          desc(income.createdAt),
        ],
      },
    },
  });

  return (
    plan?.income.map((item) => ({
      id: item.id,
      description: item.description,
      amount: Number(item.amount),
      expectedDate: item.expectedDate,
    })) ?? []
  );
}

export async function getCashFlowTimeline(
  userId: string,
  currentBalance: number,
  months: number
): Promise<CashFlowTimeline> {
  const safeMonths = Math.max(1, Math.min(months, 24));
  const safeBalance = Number.isNaN(currentBalance) ? 0 : currentBalance;

  const startMonth = getCurrentYearMonth();
  const horizon = Array.from({ length: safeMonths }, (_, i) =>
    addMonths(startMonth, i)
  );

  const [recurringList, installmentsList, fallbackIncome] = await Promise.all([
    getRecurringExpenses(userId),
    getInstallments(userId),
    getIncomeSnapshot(userId, startMonth),
  ]);

  const events: CashFlowEvent[] = [];
  let runningBalance = safeBalance;
  let totalExpectedIncome = 0;
  let totalObligations = 0;
  let lowestBalance: { value: number; yearMonth: string } | null = null;

  for (const yearMonth of horizon) {
    const monthIncome = await getIncomeSnapshot(userId, yearMonth);
    const incomeEntries =
      monthIncome.length > 0 ? monthIncome : fallbackIncome;

    const expectedIncome = incomeEntries.reduce(
      (sum, item) => sum + item.amount,
      0
    );

    const obligationsDetails: CashFlowObligation[] = [];

    for (const item of recurringList) {
      if (!item.active) continue;
      if (!isRecurringDueInMonth(item, yearMonth)) continue;

      const dueDate = getRecurringDateInMonth(item, yearMonth);
      obligationsDetails.push({
        description: item.description,
        amount: Number(item.amount),
        type: "recurring",
        day: dueDate.getDate(),
      });
    }

    for (const item of installmentsList) {
      if (!item.active) continue;

      const startYM = toYearMonth(item.startDate);
      if (yearMonth < startYM) continue;

      const monthsFromStart = monthDiff(startYM, yearMonth);
      const firstDueIndex = item.currentInstallment - 1;

      if (
        monthsFromStart >= firstDueIndex &&
        monthsFromStart < item.totalInstallments
      ) {
        const startDate =
          typeof item.startDate === "string"
            ? new Date(item.startDate)
            : item.startDate;
        obligationsDetails.push({
          description: `${item.description} installment`,
          amount: Number(item.installmentAmount),
          type: "installment",
          day: clampDayToMonth(startDate.getDate(), yearMonth),
        });
      }
    }

    obligationsDetails.sort((a, b) => a.day - b.day);

    const obligations = obligationsDetails.reduce(
      (sum, item) => sum + item.amount,
      0
    );

    const net = expectedIncome - obligations;
    runningBalance += net;

    totalExpectedIncome += expectedIncome;
    totalObligations += obligations;

    if (
      !lowestBalance ||
      runningBalance < lowestBalance.value ||
      (runningBalance === lowestBalance.value &&
        yearMonth < lowestBalance.yearMonth)
    ) {
      lowestBalance = { value: runningBalance, yearMonth };
    }

    events.push({
      yearMonth,
      expectedIncome,
      obligations,
      net,
      runningBalance,
      income: incomeEntries,
      obligationsDetails,
    });
  }

  return {
    currentBalance: safeBalance,
    months: safeMonths,
    monthsLabel: `${safeMonths} month${safeMonths === 1 ? "" : "s"}`,
    startingBalance: safeBalance,
    events,
    totalExpectedIncome,
    totalObligations,
    lowestBalance,
  };
}

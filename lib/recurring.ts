import { parseYearMonth } from "@/lib/date";

export type Frequency = "monthly" | "quarterly" | "annual";

export const frequencyLabels: Record<Frequency, string> = {
  monthly: "Monthly",
  quarterly: "Quarterly",
  annual: "Annual",
};

export function isRecurringDueInMonth(
  item: {
    startDate: Date | string | null;
    frequency: Frequency;
  },
  yearMonth: string
): boolean {
  if (!item.startDate) return true;

  const start =
    typeof item.startDate === "string" ? new Date(item.startDate) : item.startDate;
  const target = parseYearMonth(yearMonth);

  if (
    target.getFullYear() < start.getFullYear() ||
    (target.getFullYear() === start.getFullYear() &&
      target.getMonth() < start.getMonth())
  ) {
    return false;
  }

  if (item.frequency === "monthly") return true;
  if (item.frequency === "quarterly") {
    const monthsDiff =
      (target.getFullYear() - start.getFullYear()) * 12 +
      (target.getMonth() - start.getMonth());
    return monthsDiff % 3 === 0;
  }
  return target.getMonth() === start.getMonth();
}

export function getRecurringDateInMonth(
  item: { startDate: Date | string | null; dayOfMonth: number },
  yearMonth: string
): Date {
  const target = parseYearMonth(yearMonth);
  const lastDay = new Date(
    target.getFullYear(),
    target.getMonth() + 1,
    0
  ).getDate();
  const day = Math.min(Math.max(item.dayOfMonth, 1), lastDay);
  return new Date(target.getFullYear(), target.getMonth(), day);
}

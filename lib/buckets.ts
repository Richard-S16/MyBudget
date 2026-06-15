import type { CategoryType } from "@/lib/db/schema";

export const BUCKET_TYPES: CategoryType[] = [
  "fixed_expenses",
  "investments",
  "donations",
  "free_spending",
];

export const bucketLabels: Record<CategoryType, string> = {
  fixed_expenses: "Fixed Expenses",
  investments: "Investments",
  donations: "Donations",
  free_spending: "Free Spending",
};

export const bucketShortLabels: Record<CategoryType, string> = {
  fixed_expenses: "Fixed",
  investments: "Invest",
  donations: "Donate",
  free_spending: "Free",
};

export const bucketColors: Record<CategoryType, string> = {
  fixed_expenses: "bg-emerald-600",
  investments: "bg-amber-500",
  donations: "bg-rose-500",
  free_spending: "bg-violet-500",
};

export const bucketGradients: Record<CategoryType, string> = {
  fixed_expenses: "from-emerald-600 to-teal-500",
  investments: "from-amber-500 to-yellow-400",
  donations: "from-rose-500 to-pink-500",
  free_spending: "from-violet-500 to-indigo-400",
};

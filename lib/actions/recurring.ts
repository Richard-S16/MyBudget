"use server";

import { eq, and, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { recurringExpenses, expenses } from "@/lib/db/schema";
import {
  isRecurringDueInMonth,
  getRecurringDateInMonth,
  type Frequency,
} from "@/lib/recurring";

export async function getRecurringExpenses(userId: string) {
  return db.query.recurringExpenses.findMany({
    where: eq(recurringExpenses.userId, userId),
    with: { category: true },
    orderBy: [desc(recurringExpenses.active), recurringExpenses.description],
  });
}

export async function getMonthlyRecurringTotal(userId: string, yearMonth: string) {
  const items = await getRecurringExpenses(userId);
  return items
    .filter((item) => item.active && isRecurringDueInMonth(item, yearMonth))
    .reduce((sum, item) => sum + Number(item.amount), 0);
}

export async function syncRecurringExpenses(
  userId: string,
  monthlyPlanId: string,
  yearMonth: string
) {
  const items = await getRecurringExpenses(userId);
  const dueItems = items.filter(
    (item) => item.active && isRecurringDueInMonth(item, yearMonth)
  );

  if (dueItems.length === 0) return;

  await db.insert(expenses).values(
    dueItems.map((item) => ({
      monthlyPlanId,
      categoryId: item.categoryId,
      description: item.description,
      amount: item.amount,
      date: getRecurringDateInMonth(item, yearMonth),
    }))
  );
}

export async function createRecurringExpense(userId: string, formData: FormData) {
  const description = String(formData.get("description") ?? "").trim();
  const amount = Number(formData.get("amount"));
  const frequency = String(formData.get("frequency") ?? "monthly") as Frequency;
  const categoryId = String(formData.get("categoryId") ?? "");
  const dayOfMonth = Number(formData.get("dayOfMonth"));
  const startDateRaw = String(formData.get("startDate") ?? "");
  const active = formData.get("active") === "on";

  if (!description) throw new Error("Description required");
  if (Number.isNaN(amount) || amount <= 0) throw new Error("Amount must be positive");
  if (!["monthly", "quarterly", "annual"].includes(frequency)) {
    throw new Error("Invalid frequency");
  }

  const [record] = await db
    .insert(recurringExpenses)
    .values({
      userId,
      description,
      amount: amount.toFixed(2),
      frequency,
      categoryId: categoryId || null,
      dayOfMonth: Number.isNaN(dayOfMonth) || dayOfMonth < 1 ? 1 : dayOfMonth,
      startDate: startDateRaw ? new Date(startDateRaw) : new Date(),
      active,
    })
    .returning();

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/recurring");
  return record;
}

export async function updateRecurringExpense(
  userId: string,
  recurringId: string,
  formData: FormData
) {
  const description = String(formData.get("description") ?? "").trim();
  const amount = Number(formData.get("amount"));
  const frequency = String(formData.get("frequency") ?? "monthly") as Frequency;
  const categoryId = String(formData.get("categoryId") ?? "");
  const dayOfMonth = Number(formData.get("dayOfMonth"));
  const startDateRaw = String(formData.get("startDate") ?? "");
  const active = formData.get("active") === "on";

  if (!description) throw new Error("Description required");
  if (Number.isNaN(amount) || amount <= 0) throw new Error("Amount must be positive");

  const [record] = await db
    .update(recurringExpenses)
    .set({
      description,
      amount: amount.toFixed(2),
      frequency,
      categoryId: categoryId || null,
      dayOfMonth: Number.isNaN(dayOfMonth) || dayOfMonth < 1 ? 1 : dayOfMonth,
      startDate: startDateRaw ? new Date(startDateRaw) : new Date(),
      active,
    })
    .where(
      and(eq(recurringExpenses.id, recurringId), eq(recurringExpenses.userId, userId))
    )
    .returning();

  if (!record) throw new Error("Recurring expense not found");

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/recurring");
  return record;
}

export async function deleteRecurringExpense(userId: string, recurringId: string) {
  await db
    .delete(recurringExpenses)
    .where(
      and(eq(recurringExpenses.id, recurringId), eq(recurringExpenses.userId, userId))
    );

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/recurring");
}

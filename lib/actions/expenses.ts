"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { expenses } from "@/lib/db/schema";

export async function getExpensesByMonth(userId: string, yearMonth: string) {
  const plan = await db.query.monthlyPlans.findFirst({
    where: (table, { and }) =>
      and(eq(table.userId, userId), eq(table.yearMonth, yearMonth)),
    with: {
      expenses: {
        with: { category: true },
        orderBy: (expenses, { desc }) => [desc(expenses.date), desc(expenses.createdAt)],
      },
    },
  });

  return plan?.expenses ?? [];
}

export async function createExpense(monthlyPlanId: string, formData: FormData) {
  const description = String(formData.get("description") ?? "").trim();
  const amount = Number(formData.get("amount"));
  const categoryId = String(formData.get("categoryId") ?? "");
  const dateRaw = String(formData.get("date") ?? "");

  if (!description) throw new Error("Description required");
  if (Number.isNaN(amount) || amount <= 0) throw new Error("Amount must be positive");

  const [record] = await db
    .insert(expenses)
    .values({
      monthlyPlanId,
      description,
      amount: amount.toFixed(2),
      categoryId: categoryId || null,
      date: dateRaw ? new Date(dateRaw) : new Date(),
    })
    .returning();

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/expenses");
  return record;
}

export async function updateExpense(expenseId: string, formData: FormData) {
  const description = String(formData.get("description") ?? "").trim();
  const amount = Number(formData.get("amount"));
  const categoryId = String(formData.get("categoryId") ?? "");
  const dateRaw = String(formData.get("date") ?? "");

  if (!description) throw new Error("Description required");
  if (Number.isNaN(amount) || amount <= 0) throw new Error("Amount must be positive");

  const [record] = await db
    .update(expenses)
    .set({
      description,
      amount: amount.toFixed(2),
      categoryId: categoryId || null,
      date: dateRaw ? new Date(dateRaw) : new Date(),
    })
    .where(eq(expenses.id, expenseId))
    .returning();

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/expenses");
  return record;
}

export async function deleteExpense(expenseId: string) {
  await db.delete(expenses).where(eq(expenses.id, expenseId));
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/expenses");
}

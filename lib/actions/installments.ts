"use server";

import { eq, and, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { installments } from "@/lib/db/schema";

export async function getInstallments(userId: string) {
  return db.query.installments.findMany({
    where: eq(installments.userId, userId),
    orderBy: [desc(installments.active), installments.description],
  });
}

export async function getActiveInstallmentTotal(userId: string) {
  const items = await getInstallments(userId);
  return items
    .filter((item) => item.active)
    .reduce((sum, item) => sum + Number(item.installmentAmount), 0);
}

export async function createInstallment(userId: string, formData: FormData) {
  const description = String(formData.get("description") ?? "").trim();
  const totalInstallments = Number(formData.get("totalInstallments"));
  const installmentAmount = Number(formData.get("installmentAmount"));
  const currentInstallment = Number(formData.get("currentInstallment"));
  const startDateRaw = String(formData.get("startDate") ?? "");
  const active = formData.get("active") === "on";

  if (!description) throw new Error("Description required");
  if (Number.isNaN(totalInstallments) || totalInstallments < 1) {
    throw new Error("Total installments must be at least 1");
  }
  if (Number.isNaN(installmentAmount) || installmentAmount <= 0) {
    throw new Error("Installment amount must be positive");
  }

  const current = Number.isNaN(currentInstallment) || currentInstallment < 1
    ? 1
    : Math.min(currentInstallment, totalInstallments);
  const remaining = totalInstallments - current + 1;
  const remainingBalance = Number((remaining * installmentAmount).toFixed(2));

  const [record] = await db
    .insert(installments)
    .values({
      userId,
      description,
      totalInstallments,
      currentInstallment: current,
      installmentAmount: installmentAmount.toFixed(2),
      remainingBalance: remainingBalance.toFixed(2),
      startDate: startDateRaw ? new Date(startDateRaw) : new Date(),
      active,
    })
    .returning();

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/installments");
  return record;
}

export async function updateInstallment(
  userId: string,
  installmentId: string,
  formData: FormData
) {
  const description = String(formData.get("description") ?? "").trim();
  const totalInstallments = Number(formData.get("totalInstallments"));
  const installmentAmount = Number(formData.get("installmentAmount"));
  const currentInstallment = Number(formData.get("currentInstallment"));
  const remainingBalance = Number(formData.get("remainingBalance"));
  const startDateRaw = String(formData.get("startDate") ?? "");
  const active = formData.get("active") === "on";

  if (!description) throw new Error("Description required");
  if (Number.isNaN(totalInstallments) || totalInstallments < 1) {
    throw new Error("Total installments must be at least 1");
  }
  if (Number.isNaN(installmentAmount) || installmentAmount <= 0) {
    throw new Error("Installment amount must be positive");
  }

  const current = Number.isNaN(currentInstallment)
    ? 1
    : Math.max(1, Math.min(currentInstallment, totalInstallments));

  const balance = Number.isNaN(remainingBalance)
    ? Math.max(0, (totalInstallments - current + 1) * installmentAmount)
    : remainingBalance;

  const [record] = await db
    .update(installments)
    .set({
      description,
      totalInstallments,
      currentInstallment: current,
      installmentAmount: installmentAmount.toFixed(2),
      remainingBalance: Number(balance.toFixed(2)).toFixed(2),
      startDate: startDateRaw ? new Date(startDateRaw) : new Date(),
      active,
    })
    .where(
      and(eq(installments.id, installmentId), eq(installments.userId, userId))
    )
    .returning();

  if (!record) throw new Error("Installment not found");

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/installments");
  return record;
}

export async function advanceInstallment(userId: string, installmentId: string) {
  const item = await db.query.installments.findFirst({
    where: and(eq(installments.id, installmentId), eq(installments.userId, userId)),
  });

  if (!item) throw new Error("Installment not found");
  if (!item.active) throw new Error("Installment is already paid off");

  const nextCurrent = item.currentInstallment + 1;
  const newBalance = Math.max(
    0,
    Number(item.remainingBalance) - Number(item.installmentAmount)
  );
  const isComplete = nextCurrent > item.totalInstallments;

  const [record] = await db
    .update(installments)
    .set({
      currentInstallment: isComplete ? item.totalInstallments : nextCurrent,
      remainingBalance: isComplete ? "0" : newBalance.toFixed(2),
      active: !isComplete,
    })
    .where(eq(installments.id, installmentId))
    .returning();

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/installments");
  return record;
}

export async function deleteInstallment(userId: string, installmentId: string) {
  await db
    .delete(installments)
    .where(and(eq(installments.id, installmentId), eq(installments.userId, userId)));

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/installments");
}

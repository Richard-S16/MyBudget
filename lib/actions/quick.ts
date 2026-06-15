"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { monthlyPlans } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getCurrentYearMonth, toDateInputValue } from "@/lib/date";
import { ensureDefaultCategories } from "@/lib/actions/categories";
import { createExpense } from "@/lib/actions/expenses";
import { createIncome } from "@/lib/actions/income";

async function getOrCreatePlan(userId: string, yearMonth: string) {
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

export async function quickCreateEntry(formData: FormData) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  const entryType = String(formData.get("entryType") ?? "expense");
  const description = String(formData.get("description") ?? "").trim();
  const amount = Number(formData.get("amount"));

  if (!description) {
    return { success: false, error: "Description required" };
  }
  if (Number.isNaN(amount) || amount <= 0) {
    return { success: false, error: "Amount must be positive" };
  }

  try {
    const yearMonth = getCurrentYearMonth();
    const plan = await getOrCreatePlan(session.user.id, yearMonth);
    await ensureDefaultCategories(session.user.id);

    if (entryType === "income") {
      const expectedDateRaw = String(formData.get("expectedDate") ?? "");
      if (!expectedDateRaw) {
        formData.set("expectedDate", toDateInputValue(new Date()));
      }
      if (!formData.get("status")) {
        formData.set("status", "expected");
      }
      await createIncome(plan.id, formData);
    } else {
      const dateRaw = String(formData.get("date") ?? "");
      if (!dateRaw) {
        formData.set("date", toDateInputValue(new Date()));
      }
      await createExpense(plan.id, formData);
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/quick");
    return { success: true };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}

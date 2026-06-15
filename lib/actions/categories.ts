"use server";

import { eq, desc, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { categories, type CategoryType } from "@/lib/db/schema";

const DEFAULT_CATEGORIES: { name: string; type: CategoryType }[] = [
  { name: "Housing", type: "fixed_expenses" },
  { name: "Utilities", type: "fixed_expenses" },
  { name: "Investments", type: "investments" },
  { name: "Donations", type: "donations" },
  { name: "Fun Money", type: "free_spending" },
];

export async function getCategories(userId: string) {
  return db.query.categories.findMany({
    where: eq(categories.userId, userId),
    orderBy: [desc(categories.sortOrder), categories.name],
  });
}

export async function ensureDefaultCategories(userId: string) {
  const existing = await db.query.categories.findMany({
    where: eq(categories.userId, userId),
  });

  if (existing.length > 0) return existing;

  const seeded = DEFAULT_CATEGORIES.map((c) => ({
    userId,
    name: c.name,
    type: c.type,
  }));

  await db.insert(categories).values(seeded);

  return getCategories(userId);
}

export async function createCategory(
  userId: string,
  formData: FormData
) {
  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "") as CategoryType;

  if (!name) throw new Error("Category name required");
  if (!["fixed_expenses", "investments", "donations", "free_spending"].includes(type)) {
    throw new Error("Invalid category type");
  }

  const [category] = await db
    .insert(categories)
    .values({ userId, name, type })
    .returning();

  revalidatePath("/dashboard/expenses");
  revalidatePath("/dashboard/categories");
  return category;
}

export async function updateCategory(
  userId: string,
  categoryId: string,
  formData: FormData
) {
  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "") as CategoryType;

  if (!name) throw new Error("Category name required");

  const [category] = await db
    .update(categories)
    .set({ name, type })
    .where(and(eq(categories.id, categoryId), eq(categories.userId, userId)))
    .returning();

  revalidatePath("/dashboard/expenses");
  revalidatePath("/dashboard/categories");
  return category;
}

export async function deleteCategory(userId: string, categoryId: string) {
  await db
    .delete(categories)
    .where(and(eq(categories.id, categoryId), eq(categories.userId, userId)));

  revalidatePath("/dashboard/expenses");
  revalidatePath("/dashboard/categories");
}

"use client";

import { useActionState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toDateInputValue } from "@/lib/date";
import type { InferSelectModel } from "drizzle-orm";
import type { categories, expenses } from "@/lib/db/schema";

type Expense = InferSelectModel<typeof expenses> & {
  category?: InferSelectModel<typeof categories> | null;
};
type Category = InferSelectModel<typeof categories>;

interface ExpenseFormProps {
  expense?: Expense;
  categories: Category[];
  onAction: (formData: FormData) => Promise<{ success: boolean; error?: string }>;
  onClose: () => void;
}

export function ExpenseForm({
  expense,
  categories,
  onAction,
  onClose,
}: ExpenseFormProps) {
  async function handleSubmit(
    _prev: { success: boolean; error?: string },
    formData: FormData
  ) {
    return onAction(formData);
  }

  const [state, action, pending] = useActionState(handleSubmit, {
    success: false,
  });

  useEffect(() => {
    if (state.success) onClose();
  }, [state, onClose]);

  const grouped = categories.reduce<Record<string, Category[]>>((acc, cat) => {
    acc[cat.type] = acc[cat.type] ? [...acc[cat.type], cat] : [cat];
    return acc;
  }, {});

  const typeLabels: Record<string, string> = {
    fixed_expenses: "Fixed expenses",
    investments: "Investments",
    donations: "Donations",
    free_spending: "Free spending",
  };

  return (
    <form action={action} className="grid gap-4">
      {state.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}
      <input type="hidden" name="id" value={expense?.id} />
      <div className="grid gap-2">
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          name="description"
          defaultValue={expense?.description}
          placeholder="Grocery, fuel, rent..."
          required
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="amount">Amount</Label>
        <Input
          id="amount"
          name="amount"
          type="number"
          step="0.01"
          min="0.01"
          defaultValue={expense ? Number(expense.amount) : ""}
          placeholder="0,00"
          required
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="categoryId">Category</Label>
        <select
          id="categoryId"
          name="categoryId"
          defaultValue={expense?.categoryId ?? ""}
          className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
        >
          <option value="">Uncategorized</option>
          {Object.entries(grouped).map(([type, cats]) => (
            <optgroup key={type} label={typeLabels[type] ?? type}>
              {cats.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="date">Date</Label>
        <Input
          id="date"
          name="date"
          type="date"
          defaultValue={toDateInputValue(expense?.date ?? new Date())}
          required
        />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : expense ? "Save expense" : "Add expense"}
        </Button>
      </div>
    </form>
  );
}

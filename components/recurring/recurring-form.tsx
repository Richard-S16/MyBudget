"use client";

import { useActionState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toDateInputValue } from "@/lib/date";
import { frequencyLabels, type Frequency } from "@/lib/recurring";
import type { InferSelectModel } from "drizzle-orm";
import type { categories, recurringExpenses } from "@/lib/db/schema";

type Recurring = InferSelectModel<typeof recurringExpenses> & {
  category?: InferSelectModel<typeof categories> | null;
};
type Category = InferSelectModel<typeof categories>;

interface RecurringFormProps {
  recurring?: Recurring;
  categories: Category[];
  onAction: (formData: FormData) => Promise<{ success: boolean; error?: string }>;
  onClose: () => void;
}

const frequencies: Frequency[] = ["monthly", "quarterly", "annual"];

export function RecurringForm({
  recurring,
  categories,
  onAction,
  onClose,
}: RecurringFormProps) {
  async function handleSubmit(
    _prev: { success: boolean; error?: string },
    formData: FormData
  ) {
    return onAction(formData);
  }

  const [state, action, pending] = useActionState(handleSubmit, { success: false });

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
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <input type="hidden" name="id" value={recurring?.id} />
      <div className="grid gap-2">
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          name="description"
          defaultValue={recurring?.description}
          placeholder="Internet, gym, streaming..."
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
          defaultValue={recurring ? Number(recurring.amount) : ""}
          placeholder="0,00"
          required
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="frequency">Frequency</Label>
        <select
          id="frequency"
          name="frequency"
          defaultValue={recurring?.frequency ?? "monthly"}
          className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
        >
          {frequencies.map((freq) => (
            <option key={freq} value={freq}>
              {frequencyLabels[freq]}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="categoryId">Category</Label>
        <select
          id="categoryId"
          name="categoryId"
          defaultValue={recurring?.categoryId ?? ""}
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
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="startDate">Start date</Label>
          <Input
            id="startDate"
            name="startDate"
            type="date"
            defaultValue={toDateInputValue(recurring?.startDate ?? new Date())}
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="dayOfMonth">Due day</Label>
          <Input
            id="dayOfMonth"
            name="dayOfMonth"
            type="number"
            min="1"
            max="31"
            defaultValue={recurring?.dayOfMonth ?? 1}
            required
          />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="active"
          defaultChecked={recurring ? recurring.active : true}
          className="h-4 w-4 rounded border-input"
        />
        Active
      </label>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : recurring ? "Save recurring" : "Add recurring"}
        </Button>
      </div>
    </form>
  );
}

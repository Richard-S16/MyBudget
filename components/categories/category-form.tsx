"use client";

import { useActionState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { InferSelectModel } from "drizzle-orm";
import type { categories } from "@/lib/db/schema";

type Category = InferSelectModel<typeof categories>;

const typeLabels: Record<string, string> = {
  fixed_expenses: "Fixed expenses",
  investments: "Investments",
  donations: "Donations",
  free_spending: "Free spending",
};

interface CategoryFormProps {
  category?: Category;
  onAction: (formData: FormData) => Promise<{ success: boolean; error?: string }>;
  onClose: () => void;
}

export function CategoryForm({ category, onAction, onClose }: CategoryFormProps) {
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

  return (
    <form action={action} className="grid gap-4">
      {state.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}
      <input type="hidden" name="id" value={category?.id} />
      <div className="grid gap-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          name="name"
          defaultValue={category?.name}
          placeholder="Rent, gym, streaming..."
          required
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="type">Type</Label>
        <select
          id="type"
          name="type"
          defaultValue={category?.type ?? "fixed_expenses"}
          className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
        >
          {Object.entries(typeLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : category ? "Save category" : "Add category"}
        </Button>
      </div>
    </form>
  );
}

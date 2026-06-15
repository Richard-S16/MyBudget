"use client";

import { useActionState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toDateInputValue } from "@/lib/date";
import type { InferSelectModel } from "drizzle-orm";
import type { income } from "@/lib/db/schema";

type Income = InferSelectModel<typeof income>;

interface IncomeFormProps {
  income?: Income;
  onAction: (formData: FormData) => Promise<{ success: boolean; error?: string }>;
  onClose: () => void;
}

export function IncomeForm({ income: item, onAction, onClose }: IncomeFormProps) {
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
      <input type="hidden" name="id" value={item?.id} />
      <div className="grid gap-2">
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          name="description"
          defaultValue={item?.description}
          placeholder="Salary, bonus..."
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
          defaultValue={item ? Number(item.amount) : ""}
          placeholder="0,00"
          required
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="status">Status</Label>
        <select
          id="status"
          name="status"
          defaultValue={item?.status ?? "expected"}
          className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
        >
          <option value="expected">Expected</option>
          <option value="received">Received</option>
        </select>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="expectedDate">Expected date</Label>
        <Input
          id="expectedDate"
          name="expectedDate"
          type="date"
          defaultValue={toDateInputValue(item?.expectedDate)}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="receivedAt">Received at</Label>
        <Input
          id="receivedAt"
          name="receivedAt"
          type="date"
          defaultValue={toDateInputValue(item?.receivedAt)}
        />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : item ? "Save income" : "Add income"}
        </Button>
      </div>
    </form>
  );
}

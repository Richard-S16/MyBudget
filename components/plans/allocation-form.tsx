"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { formatBRL } from "@/lib/money";
import { BUCKET_TYPES, bucketLabels, bucketGradients, bucketColors } from "@/lib/buckets";
import type { CategoryType } from "@/lib/db/schema";

interface AllocationFormProps {
  expectedIncome: number;
  percentages: Record<CategoryType, number>;
  onAction: (formData: FormData) => Promise<{ success: boolean; error?: string }>;
}

export function AllocationForm({
  expectedIncome,
  percentages,
  onAction,
}: AllocationFormProps) {
  const [values, setValues] = useState<Record<CategoryType, string>>(() => {
    return Object.fromEntries(
      BUCKET_TYPES.map((type) => [type, String(percentages[type] ?? 0)])
    ) as Record<CategoryType, string>;
  });

  async function handleSubmit(
    _prev: { success: boolean; error?: string } | null,
    formData: FormData
  ) {
    return onAction(formData);
  }

  const [state, action, pending] = useActionState(handleSubmit, null);

  const numericValues: Record<CategoryType, number> = Object.fromEntries(
    BUCKET_TYPES.map((type) => {
      const raw = Number(values[type]);
      return [type, Number.isNaN(raw) ? 0 : Math.max(0, Math.min(100, raw))];
    })
  ) as Record<CategoryType, number>;

  const total = BUCKET_TYPES.reduce((sum, type) => sum + numericValues[type], 0);
  const overBudget = total > 100;

  return (
    <form action={action} className="space-y-6">
      {state?.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}
      {overBudget && (
        <p className="text-sm text-destructive">
          Total allocation is {total}%. It cannot exceed 100%.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {BUCKET_TYPES.map((type) => {
          const percentage = numericValues[type];
          const planned = Math.round(expectedIncome * (percentage / 100) * 100) / 100;

          return (
            <Card
              key={type}
              className="overflow-hidden transition-shadow focus-within:shadow-md"
            >
              <div
                className={`h-1.5 bg-gradient-to-r ${bucketGradients[type]}`}
              />
              <CardContent className="pt-5">
                <div className="flex items-center justify-between">
                  <Label htmlFor={type} className="font-heading">
                    {bucketLabels[type]}
                  </Label>
                  <span className="font-mono text-sm text-muted-foreground">
                    {formatBRL(planned)}
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <Input
                    id={type}
                    name={type}
                    type="number"
                    min={0}
                    max={100}
                    step={1}
                    value={values[type]}
                    onChange={(e) =>
                      setValues((prev) => ({ ...prev, [type]: e.target.value }))
                    }
                    className="w-20 text-right"
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full bg-gradient-to-r ${bucketGradients[type]} transition-all duration-500`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="rounded-xl border bg-card p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-heading text-sm font-medium">Total allocated</p>
            <p className="text-xs text-muted-foreground">
              {total}% of expected income
              {total < 100 && (
                <span className="ml-1 text-foreground">
                  ({100 - total}% unallocated)
                </span>
              )}
            </p>
          </div>
          <div className="w-full sm:w-64">
            <div className="flex h-3 overflow-hidden rounded-full bg-muted">
              {BUCKET_TYPES.map((type) => (
                <div
                  key={type}
                  className={`h-full ${bucketColors[type]} transition-all duration-500`}
                  style={{ width: `${numericValues[type]}%` }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={pending || overBudget}>
          {pending ? "Saving..." : "Save allocation"}
        </Button>
      </div>
    </form>
  );
}

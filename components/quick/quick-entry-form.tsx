"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Banknote, TrendingUp, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toDateInputValue } from "@/lib/date";
import { bucketColors } from "@/lib/buckets";
import type { InferSelectModel } from "drizzle-orm";
import type { categories } from "@/lib/db/schema";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Category = InferSelectModel<typeof categories>;

interface QuickEntryFormProps {
  categories: Category[];
  onAction: (formData: FormData) => Promise<{ success: boolean; error?: string }>;
}

const expenseSuggestions = [
  "Grocery",
  "Fuel",
  "Dining",
  "Coffee",
  "Transport",
  "Internet",
  "Rent",
];

const incomeSuggestions = ["Salary", "Freelance", "Bonus", "Refund", "Gift"];

export function QuickEntryForm({ categories, onAction }: QuickEntryFormProps) {
  const router = useRouter();
  const [mode, setMode] = useState<"expense" | "income">("expense");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [description, setDescription] = useState("");
  const today = toDateInputValue(new Date());

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
    if (state.success) {
      router.push("/dashboard");
    }
  }, [state, router]);

  const suggestions = mode === "expense" ? expenseSuggestions : incomeSuggestions;

  return (
    <form action={action} className="flex min-h-full flex-col">
      <input type="hidden" name="entryType" value={mode} />

      <header className="sticky top-0 z-10 border-b bg-background/95 px-4 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center justify-between">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <div className="flex rounded-lg border bg-muted p-1">
            <button
              type="button"
              onClick={() => setMode("expense")}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                mode === "expense"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Banknote className="h-4 w-4" />
              Expense
            </button>
            <button
              type="button"
              onClick={() => setMode("income")}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                mode === "income"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <TrendingUp className="h-4 w-4" />
              Income
            </button>
          </div>
          <span className="w-10" />
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 py-6">
        {state.error && (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {state.error}
          </p>
        )}

        <section className="space-y-2">
          <Label htmlFor="amount" className="text-center block text-muted-foreground">
            Amount
          </Label>
          <div className="relative">
            <span className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 text-2xl font-medium text-muted-foreground">
              R$
            </span>
            <Input
              id="amount"
              name="amount"
              type="number"
              step="0.01"
              min="0.01"
              inputMode="decimal"
              placeholder="0,00"
              autoFocus
              required
              className="border-0 border-b border-input bg-transparent pl-10 text-center text-5xl font-mono font-medium shadow-none focus-visible:ring-0 focus-visible:border-primary h-auto py-4"
            />
          </div>
        </section>

        <section className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            name="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={mode === "expense" ? "What did you buy?" : "Where is it from?"}
            required
            className="h-12 text-base"
          />
          <div className="flex flex-wrap gap-2 pt-1">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setDescription(s)}
                className="rounded-full border bg-background px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
              >
                {s}
              </button>
            ))}
          </div>
        </section>

        {mode === "expense" && (
          <section className="space-y-2">
            <Label>Category</Label>
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
              <button
                type="button"
                onClick={() => setSelectedCategory("")}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                  selectedCategory === ""
                    ? "border-primary bg-primary/10 text-foreground"
                    : "bg-background text-muted-foreground hover:border-muted-foreground"
                )}
              >
                <Wallet className="h-4 w-4" />
                Uncategorized
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={cn(
                    "flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                    selectedCategory === cat.id
                      ? "border-primary bg-primary/10 text-foreground"
                      : "bg-background text-muted-foreground hover:border-muted-foreground"
                  )}
                >
                  <span
                    className={cn(
                      "h-2.5 w-2.5 rounded-full",
                      bucketColors[cat.type]
                    )}
                  />
                  {cat.name}
                </button>
              ))}
            </div>
            <input type="hidden" name="categoryId" value={selectedCategory} />
          </section>
        )}

        {mode === "income" && (
          <section className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <div className="grid grid-cols-2 gap-2">
              <label
                className={cn(
                  "flex cursor-pointer items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium transition-colors",
                  "has-[:checked]:border-primary has-[:checked]:bg-primary/10"
                )}
              >
                <input
                  type="radio"
                  name="status"
                  value="expected"
                  defaultChecked
                  className="sr-only"
                />
                Expected
              </label>
              <label
                className={cn(
                  "flex cursor-pointer items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium transition-colors",
                  "has-[:checked]:border-primary has-[:checked]:bg-primary/10"
                )}
              >
                <input
                  type="radio"
                  name="status"
                  value="received"
                  className="sr-only"
                />
                Received
              </label>
            </div>
            <input type="hidden" name="expectedDate" value={today} />
          </section>
        )}

        <section className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <Input
            id="date"
            name={mode === "income" ? "expectedDate" : "date"}
            type="date"
            defaultValue={today}
            required
            className="h-12 text-base"
          />
        </section>

        <div className="mt-auto pt-4">
          <Button
            type="submit"
            disabled={pending}
            className="h-14 w-full text-lg"
          >
            {pending ? "Saving..." : mode === "expense" ? "Save expense" : "Save income"}
          </Button>
        </div>
      </div>
    </form>
  );
}

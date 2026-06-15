"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ExpenseForm } from "./expense-form";
import type { InferSelectModel } from "drizzle-orm";
import type { categories, expenses } from "@/lib/db/schema";

type Expense = InferSelectModel<typeof expenses> & {
  category?: InferSelectModel<typeof categories> | null;
};
type Category = InferSelectModel<typeof categories>;

interface ExpenseDialogProps {
  expense?: Expense;
  categories: Category[];
  onAction: (formData: FormData) => Promise<{ success: boolean; error?: string }>;
  trigger?: React.ReactElement;
}

export function ExpenseDialog({
  expense,
  categories,
  onAction,
  trigger,
}: ExpenseDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          trigger ?? (
            <Button size="sm" variant={expense ? "ghost" : "default"}>
              {expense ? "Edit" : "Add expense"}
            </Button>
          )
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{expense ? "Edit expense" : "Add expense"}</DialogTitle>
          <DialogDescription>
            {expense
              ? "Update this expense entry."
              : "Record money that left your account."}
          </DialogDescription>
        </DialogHeader>
        <ExpenseForm
          expense={expense}
          categories={categories}
          onAction={onAction}
          onClose={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

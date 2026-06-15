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
import { RecurringForm } from "./recurring-form";
import type { InferSelectModel } from "drizzle-orm";
import type { categories, recurringExpenses } from "@/lib/db/schema";

type Recurring = InferSelectModel<typeof recurringExpenses> & {
  category?: InferSelectModel<typeof categories> | null;
};
type Category = InferSelectModel<typeof categories>;

interface RecurringDialogProps {
  recurring?: Recurring;
  categories: Category[];
  onAction: (formData: FormData) => Promise<{ success: boolean; error?: string }>;
  trigger?: React.ReactElement;
}

export function RecurringDialog({
  recurring,
  categories,
  onAction,
  trigger,
}: RecurringDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          trigger ?? (
            <Button size="sm" variant={recurring ? "ghost" : "default"}>
              {recurring ? "Edit" : "Add recurring"}
            </Button>
          )
        }
      />
      {open && (
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{recurring ? "Edit recurring" : "Add recurring"}</DialogTitle>
            <DialogDescription>
              {recurring
                ? "Update this recurring obligation."
                : "Track a bill that repeats automatically."}
            </DialogDescription>
          </DialogHeader>
          <RecurringForm
            recurring={recurring}
            categories={categories}
            onAction={onAction}
            onClose={() => setOpen(false)}
          />
        </DialogContent>
      )}
    </Dialog>
  );
}

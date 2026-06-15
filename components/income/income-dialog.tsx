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
import { IncomeForm } from "./income-form";
import type { InferSelectModel } from "drizzle-orm";
import type { income } from "@/lib/db/schema";

type Income = InferSelectModel<typeof income>;

interface IncomeDialogProps {
  income?: Income;
  onAction: (formData: FormData) => Promise<{ success: boolean; error?: string }>;
  trigger?: React.ReactElement;
}

export function IncomeDialog({
  income,
  onAction,
  trigger,
}: IncomeDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          trigger ?? (
            <Button size="sm" variant={income ? "ghost" : "default"}>
              {income ? "Edit" : "Add income"}
            </Button>
          )
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{income ? "Edit income" : "Add income"}</DialogTitle>
          <DialogDescription>
            {income
              ? "Update this income entry."
              : "Record an expected or received income source."}
          </DialogDescription>
        </DialogHeader>
        <IncomeForm income={income} onAction={onAction} onClose={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

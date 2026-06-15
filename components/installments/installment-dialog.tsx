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
import { InstallmentForm } from "./installment-form";
import type { InferSelectModel } from "drizzle-orm";
import type { installments } from "@/lib/db/schema";

type Installment = InferSelectModel<typeof installments>;

interface InstallmentDialogProps {
  installment?: Installment;
  onAction: (formData: FormData) => Promise<{ success: boolean; error?: string }>;
  trigger?: React.ReactElement;
}

export function InstallmentDialog({
  installment,
  onAction,
  trigger,
}: InstallmentDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          trigger ?? (
            <Button size="sm" variant={installment ? "ghost" : "default"}>
              {installment ? "Edit" : "Add installment"}
            </Button>
          )
        }
      />
      {open && (
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {installment ? "Edit installment" : "Add installment"}
            </DialogTitle>
            <DialogDescription>
              {installment
                ? "Update this payment obligation."
                : "Track a purchase split into multiple payments."}
            </DialogDescription>
          </DialogHeader>
          <InstallmentForm
            installment={installment}
            onAction={onAction}
            onClose={() => setOpen(false)}
          />
        </DialogContent>
      )}
    </Dialog>
  );
}

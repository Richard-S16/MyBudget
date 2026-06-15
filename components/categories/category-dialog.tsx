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
import { CategoryForm } from "./category-form";
import type { InferSelectModel } from "drizzle-orm";
import type { categories } from "@/lib/db/schema";

type Category = InferSelectModel<typeof categories>;

interface CategoryDialogProps {
  category?: Category;
  onAction: (formData: FormData) => Promise<{ success: boolean; error?: string }>;
  trigger?: React.ReactElement;
}

export function CategoryDialog({
  category,
  onAction,
  trigger,
}: CategoryDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          trigger ?? (
            <Button size="sm" variant={category ? "ghost" : "default"}>
              {category ? "Edit" : "Add category"}
            </Button>
          )
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {category ? "Edit category" : "Add category"}
          </DialogTitle>
          <DialogDescription>
            Categories group your expenses into money buckets.
          </DialogDescription>
        </DialogHeader>
        <CategoryForm
          category={category}
          onAction={onAction}
          onClose={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

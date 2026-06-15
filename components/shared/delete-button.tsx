"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface DeleteButtonProps {
  id: string;
  action: (formData: FormData) => Promise<void>;
  label?: string;
}

export function DeleteButton({ id, action, label }: DeleteButtonProps) {
  async function handleSubmit(_prev: unknown, formData: FormData) {
    await action(formData);
  }

  const [, submitAction, pending] = useActionState(handleSubmit, null);

  return (
    <form action={submitAction}>
      <input type="hidden" name="id" value={id} />
      <Button
        type="submit"
        variant="ghost"
        size="icon-xs"
        disabled={pending}
        onClick={(e) => {
          if (!confirm(`Delete ${label || "this item"}?`)) {
            e.preventDefault();
          }
        }}
        aria-label="Delete"
      >
        <Trash2 className="size-4 text-destructive" />
      </Button>
    </form>
  );
}

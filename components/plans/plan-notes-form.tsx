"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface PlanNotesFormProps {
  notes: string | null;
  onAction: (formData: FormData) => Promise<{ success: boolean; error?: string }>;
}

export function PlanNotesForm({ notes, onAction }: PlanNotesFormProps) {
  async function handleSubmit(
    _prev: { success: boolean; error?: string } | null,
    formData: FormData
  ) {
    return onAction(formData);
  }

  const [state, action, pending] = useActionState(handleSubmit, null);

  return (
    <form action={action} className="grid gap-4">
      {state?.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}
      <div className="grid gap-2">
        <Label htmlFor="notes">Plan notes</Label>
        <Textarea
          id="notes"
          name="notes"
          defaultValue={notes ?? ""}
          placeholder="What are the priorities or reminders for this month?"
          rows={4}
        />
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : "Save notes"}
        </Button>
      </div>
    </form>
  );
}

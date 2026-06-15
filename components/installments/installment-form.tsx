"use client";

import { useActionState, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toDateInputValue } from "@/lib/date";
import type { InferSelectModel } from "drizzle-orm";
import type { installments } from "@/lib/db/schema";

type Installment = InferSelectModel<typeof installments>;

interface InstallmentFormProps {
  installment?: Installment;
  onAction: (formData: FormData) => Promise<{ success: boolean; error?: string }>;
  onClose: () => void;
}

function computeRemainingBalance(total: number, current: number, amount: number) {
  if (Number.isNaN(total) || Number.isNaN(current) || Number.isNaN(amount))
    return 0;
  const safeCurrent = Math.max(1, Math.min(current, total));
  return Number(Math.max(0, (total - safeCurrent + 1) * amount).toFixed(2));
}

export function InstallmentForm({
  installment,
  onAction,
  onClose,
}: InstallmentFormProps) {
  const initialTotal = installment ? Number(installment.totalInstallments) : 12;
  const initialCurrent = installment ? Number(installment.currentInstallment) : 1;
  const initialAmount = installment ? Number(installment.installmentAmount) : 0;
  const initialBalance = installment
    ? Number(installment.remainingBalance)
    : 0;

  const [total, setTotal] = useState(initialTotal);
  const [current, setCurrent] = useState(initialCurrent);
  const [amount, setAmount] = useState(initialAmount);
  const [remainingBalance, setRemainingBalance] = useState(
    installment ? initialBalance : computeRemainingBalance(initialTotal, initialCurrent, 0)
  );
  const [manualBalance, setManualBalance] = useState(false);

  function updateBalance(nextTotal: number, nextCurrent: number, nextAmount: number) {
    if (!manualBalance) {
      setRemainingBalance(computeRemainingBalance(nextTotal, nextCurrent, nextAmount));
    }
  }

  async function handleSubmit(
    _prev: { success: boolean; error?: string },
    formData: FormData
  ) {
    return onAction(formData);
  }

  const [state, action, pending] = useActionState(handleSubmit, { success: false });

  useEffect(() => {
    if (state.success) onClose();
  }, [state, onClose]);

  return (
    <form action={action} className="grid gap-4">
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <input type="hidden" name="id" value={installment?.id} />
      <div className="grid gap-2">
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          name="description"
          defaultValue={installment?.description}
          placeholder="Xbox, course, furniture..."
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="totalInstallments">Total installments</Label>
          <Input
            id="totalInstallments"
            name="totalInstallments"
            type="number"
            min="1"
            defaultValue={initialTotal}
            onChange={(e) => {
              const value = Number(e.target.value);
              setTotal(value);
              updateBalance(value, current, amount);
            }}
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="currentInstallment">Current installment</Label>
          <Input
            id="currentInstallment"
            name="currentInstallment"
            type="number"
            min="1"
            defaultValue={initialCurrent}
            onChange={(e) => {
              const value = Number(e.target.value);
              setCurrent(value);
              updateBalance(total, value, amount);
            }}
            required
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="installmentAmount">Installment amount</Label>
          <Input
            id="installmentAmount"
            name="installmentAmount"
            type="number"
            step="0.01"
            min="0.01"
            defaultValue={installment ? initialAmount : ""}
            onChange={(e) => {
              const value = Number(e.target.value);
              setAmount(value);
              updateBalance(total, current, value);
            }}
            placeholder="0,00"
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="remainingBalance">Remaining balance</Label>
          <Input
            id="remainingBalance"
            name="remainingBalance"
            type="number"
            step="0.01"
            min="0"
            value={remainingBalance}
            onChange={(e) => {
              setManualBalance(true);
              setRemainingBalance(Number(e.target.value));
            }}
            required
          />
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="startDate">Start date</Label>
        <Input
          id="startDate"
          name="startDate"
          type="date"
          defaultValue={toDateInputValue(installment?.startDate ?? new Date())}
          required
        />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="active"
          defaultChecked={installment ? installment.active : true}
          className="h-4 w-4 rounded border-input"
        />
        Active
      </label>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : installment ? "Save installment" : "Add installment"}
        </Button>
      </div>
    </form>
  );
}

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import {
  advanceInstallment,
  createInstallment,
  deleteInstallment,
  getInstallments,
  updateInstallment,
} from "@/lib/actions/installments";
import { formatBRL } from "@/lib/money";
import { InstallmentDialog } from "@/components/installments/installment-dialog";
import { DeleteButton } from "@/components/shared/delete-button";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Landmark, Check } from "lucide-react";

export default async function InstallmentsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/");

  const userId = session.user.id;
  const installmentsList = await getInstallments(userId);

  async function createAction(formData: FormData) {
    "use server";
    try {
      await createInstallment(userId, formData);
      return { success: true };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  }

  async function updateAction(formData: FormData) {
    "use server";
    const id = String(formData.get("id") ?? "");
    if (!id) return { success: false, error: "Missing id" };
    try {
      await updateInstallment(userId, id, formData);
      return { success: true };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  }

  async function payAction(formData: FormData) {
    "use server";
    const id = String(formData.get("id") ?? "");
    if (!id) throw new Error("Missing id");
    await advanceInstallment(userId, id);
  }

  async function deleteAction(formData: FormData) {
    "use server";
    const id = String(formData.get("id") ?? "");
    if (!id) throw new Error("Missing id");
    await deleteInstallment(userId, id);
  }

  const activeItems = installmentsList.filter((item) => item.active);
  const totalRemaining = activeItems.reduce(
    (sum, item) => sum + Number(item.remainingBalance),
    0
  );
  const monthlyTotal = activeItems.reduce(
    (sum, item) => sum + Number(item.installmentAmount),
    0
  );

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            Installments
          </h1>
          <p className="text-muted-foreground">
            Future payment obligations and what is still owed.
          </p>
        </div>
        <InstallmentDialog onAction={createAction} />
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active installments</CardDescription>
            <CardTitle className="font-mono text-2xl">
              {activeItems.length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {installmentsList.length - activeItems.length} paid off
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Monthly installment total</CardDescription>
            <CardTitle className="font-mono text-2xl">
              {formatBRL(monthlyTotal)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Due this month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Remaining liability</CardDescription>
            <CardTitle className="font-mono text-2xl text-primary">
              {formatBRL(totalRemaining)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Total still owed</p>
          </CardContent>
        </Card>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Landmark className="h-5 w-5 text-primary" />
              Installment obligations
            </CardTitle>
            <CardDescription>
              Click the checkmark to record a paid installment and advance
              automatically.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {installmentsList.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
                <Landmark className="mb-3 h-8 w-8 text-muted-foreground/60" />
                <p className="text-sm font-medium">No installments yet</p>
                <p className="text-xs text-muted-foreground">
                  Track split purchases like electronics, courses or furniture.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead className="text-right">Installment</TableHead>
                    <TableHead className="text-right">Remaining</TableHead>
                    <TableHead className="w-24"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {installmentsList.map((item) => {
                    const progress =
                      item.totalInstallments > 0
                        ? (item.currentInstallment / item.totalInstallments) * 100
                        : 0;
                    return (
                      <TableRow
                        key={item.id}
                        className={item.active ? "" : "opacity-60"}
                      >
                        <TableCell className="font-medium">
                          {item.description}
                          {!item.active && (
                            <Badge variant="secondary" className="ml-2">
                              Paid
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="w-full min-w-[6rem]">
                            <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                              <span>
                                {item.currentInstallment} / {item.totalInstallments}
                              </span>
                              <span>{Math.round(progress)}%</span>
                            </div>
                            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                              <div
                                className="h-full bg-gradient-to-r from-primary to-emerald-400"
                                style={{ width: `${Math.min(progress, 100)}%` }}
                              />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatBRL(item.installmentAmount)}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatBRL(item.remainingBalance)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            {item.active && (
                              <form action={payAction}>
                                <input type="hidden" name="id" value={item.id} />
                                <Button
                                  type="submit"
                                  variant="ghost"
                                  size="icon-xs"
                                  title="Pay installment"
                                >
                                  <Check className="size-4 text-primary" />
                                </Button>
                              </form>
                            )}
                            <InstallmentDialog
                              installment={item}
                              onAction={updateAction}
                              trigger={
                                <button className="inline-flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground">
                                  <span className="sr-only">Edit</span>
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="14"
                                    height="14"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                                  </svg>
                                </button>
                              }
                            />
                            <DeleteButton
                              id={item.id}
                              action={deleteAction}
                              label={item.description}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-10 text-center">
            <Landmark className="mb-3 h-8 w-8 text-muted-foreground/60" />
            <p className="text-sm font-medium">Focus on what is left to pay</p>
            <p className="max-w-sm text-xs text-muted-foreground">
              Remaining balance matters more than the original purchase price.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

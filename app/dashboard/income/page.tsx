import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getOrCreateMonthlyPlan } from "@/lib/actions/plans";
import {
  createIncome,
  deleteIncome,
  getIncomeByMonth,
  updateIncome,
} from "@/lib/actions/income";
import { getCurrentYearMonth, formatYearMonth } from "@/lib/date";
import { formatBRL } from "@/lib/money";
import { IncomeDialog } from "@/components/income/income-dialog";
import { DeleteButton } from "@/components/shared/delete-button";
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
import { Wallet } from "lucide-react";

export default async function IncomePage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/");

  const userId = session.user.id;
  const yearMonth = getCurrentYearMonth();
  const plan = await getOrCreateMonthlyPlan(userId, yearMonth);
  const incomeList = await getIncomeByMonth(userId, yearMonth);

  async function createAction(formData: FormData) {
    "use server";
    try {
      await createIncome(plan.id, formData);
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
      await updateIncome(id, formData);
      return { success: true };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  }

  async function deleteAction(formData: FormData) {
    "use server";
    const id = String(formData.get("id") ?? "");
    if (!id) throw new Error("Missing id");
    await deleteIncome(id);
  }

  const totalExpected = incomeList.reduce(
    (sum, item) => sum + Number(item.amount),
    0
  );
  const totalReceived = incomeList
    .filter((item) => item.status === "received")
    .reduce((sum, item) => sum + Number(item.amount), 0);

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            Income
          </h1>
          <p className="text-muted-foreground">
            {formatYearMonth(yearMonth)} — money coming in
          </p>
        </div>
        <IncomeDialog onAction={createAction} />
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Expected</CardDescription>
            <CardTitle className="font-mono text-2xl">
              {formatBRL(totalExpected)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {incomeList.length} source{incomeList.length !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Received</CardDescription>
            <CardTitle className="font-mono text-2xl text-primary">
              {formatBRL(totalReceived)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Already in your account
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Remaining</CardDescription>
            <CardTitle className="font-mono text-2xl">
              {formatBRL(totalExpected - totalReceived)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Still expected</p>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            Income entries
          </CardTitle>
          <CardDescription>
            Expected and received income for this month.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {incomeList.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
              <Wallet className="mb-3 h-8 w-8 text-muted-foreground/60" />
              <p className="text-sm font-medium">No income recorded yet</p>
              <p className="text-xs text-muted-foreground">
                Add your salary, bonus or other income sources.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Expected date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {incomeList.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {item.description}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          item.status === "received" ? "default" : "secondary"
                        }
                      >
                        {item.status === "received" ? "Received" : "Expected"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {item.expectedDate
                        ? new Date(item.expectedDate).toLocaleDateString(
                            "pt-BR"
                          )
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatBRL(item.amount)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <IncomeDialog
                          income={item}
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
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

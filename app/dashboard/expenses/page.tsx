import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getOrCreateMonthlyPlan } from "@/lib/actions/plans";
import {
  createExpense,
  deleteExpense,
  getExpensesByMonth,
  updateExpense,
} from "@/lib/actions/expenses";
import { ensureDefaultCategories } from "@/lib/actions/categories";
import { getCurrentYearMonth, formatYearMonth } from "@/lib/date";
import { formatBRL } from "@/lib/money";
import { cn } from "@/lib/utils";
import { ExpenseDialog } from "@/components/expenses/expense-dialog";
import { DeleteButton } from "@/components/shared/delete-button";
import { buttonVariants } from "@/components/ui/button";
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
import { Receipt } from "lucide-react";
import Link from "next/link";

export default async function ExpensesPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/");

  const userId = session.user.id;
  const yearMonth = getCurrentYearMonth();
  const plan = await getOrCreateMonthlyPlan(userId, yearMonth);
  const categoriesList = await ensureDefaultCategories(userId);
  const expenseList = await getExpensesByMonth(userId, yearMonth);

  async function createAction(formData: FormData) {
    "use server";
    try {
      await createExpense(plan.id, formData);
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
      await updateExpense(id, formData);
      return { success: true };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  }

  async function deleteAction(formData: FormData) {
    "use server";
    const id = String(formData.get("id") ?? "");
    if (!id) throw new Error("Missing id");
    await deleteExpense(id);
  }

  const totalExpenses = expenseList.reduce(
    (sum, item) => sum + Number(item.amount),
    0
  );

  const typeLabels: Record<string, string> = {
    fixed_expenses: "Fixed",
    investments: "Investments",
    donations: "Donations",
    free_spending: "Free",
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            Expenses
          </h1>
          <p className="text-muted-foreground">
            {formatYearMonth(yearMonth)} — money going out
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/categories"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Manage categories
          </Link>
          <ExpenseDialog categories={categoriesList} onAction={createAction} />
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total spent</CardDescription>
            <CardTitle className="font-mono text-2xl text-destructive">
              {formatBRL(totalExpenses)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {expenseList.length} expense{expenseList.length !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Fixed expenses</CardDescription>
            <CardTitle className="font-mono text-2xl">
              {formatBRL(
                expenseList
                  .filter(
                    (item) => item.category?.type === "fixed_expenses"
                  )
                  .reduce((sum, item) => sum + Number(item.amount), 0)
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Housing, utilities, bills
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Free spending</CardDescription>
            <CardTitle className="font-mono text-2xl">
              {formatBRL(
                expenseList
                  .filter(
                    (item) => item.category?.type === "free_spending"
                  )
                  .reduce((sum, item) => sum + Number(item.amount), 0)
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Discretionary</p>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            Expense entries
          </CardTitle>
          <CardDescription>
            All expenses recorded for this month.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {expenseList.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
              <Receipt className="mb-3 h-8 w-8 text-muted-foreground/60" />
              <p className="text-sm font-medium">No expenses recorded yet</p>
              <p className="text-xs text-muted-foreground">
                Start tracking where your money goes.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenseList.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {item.description}
                    </TableCell>
                    <TableCell>
                      {item.category ? (
                        <Badge variant="outline">
                          {typeLabels[item.category.type] ?? item.category.type}
                          {" — "}
                          {item.category.name}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          Uncategorized
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(item.date).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatBRL(item.amount)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <ExpenseDialog
                          expense={item}
                          categories={categoriesList}
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
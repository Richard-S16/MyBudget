import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import {
  createRecurringExpense,
  deleteRecurringExpense,
  getRecurringExpenses,
  updateRecurringExpense,
} from "@/lib/actions/recurring";
import { ensureDefaultCategories } from "@/lib/actions/categories";
import { getCurrentYearMonth, formatYearMonth } from "@/lib/date";
import { formatBRL } from "@/lib/money";
import { isRecurringDueInMonth, frequencyLabels } from "@/lib/recurring";
import { RecurringDialog } from "@/components/recurring/recurring-dialog";
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
import { Repeat } from "lucide-react";

export default async function RecurringPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/");

  const userId = session.user.id;
  const yearMonth = getCurrentYearMonth();
  const recurringList = await getRecurringExpenses(userId);
  const categoriesList = await ensureDefaultCategories(userId);

  async function createAction(formData: FormData) {
    "use server";
    try {
      await createRecurringExpense(userId, formData);
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
      await updateRecurringExpense(userId, id, formData);
      return { success: true };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  }

  async function deleteAction(formData: FormData) {
    "use server";
    const id = String(formData.get("id") ?? "");
    if (!id) throw new Error("Missing id");
    await deleteRecurringExpense(userId, id);
  }

  const activeItems = recurringList.filter((item) => item.active);
  const dueThisMonth = activeItems.filter((item) =>
    isRecurringDueInMonth(item, yearMonth)
  );
  const monthlyTotal = dueThisMonth.reduce(
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
            Recurring
          </h1>
          <p className="text-muted-foreground">
            Bills and subscriptions that repeat automatically.
          </p>
        </div>
        <RecurringDialog categories={categoriesList} onAction={createAction} />
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active recurring</CardDescription>
            <CardTitle className="font-mono text-2xl">
              {activeItems.length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {formatYearMonth(yearMonth)} obligations
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Due this month</CardDescription>
            <CardTitle className="font-mono text-2xl">
              {dueThisMonth.length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {recurringList.length - activeItems.length} paused
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Monthly total</CardDescription>
            <CardTitle className="font-mono text-2xl">
              {formatBRL(monthlyTotal)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Based on active items due
            </p>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Repeat className="h-5 w-5 text-primary" />
            Recurring expenses
          </CardTitle>
          <CardDescription>
            These are automatically added to each month&apos;s expenses when the
            month starts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recurringList.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
              <Repeat className="mb-3 h-8 w-8 text-muted-foreground/60" />
              <p className="text-sm font-medium">No recurring expenses yet</p>
              <p className="text-xs text-muted-foreground">
                Add subscriptions, bills and other repeating obligations.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recurringList.map((item) => {
                  const dueThisMonthFlag = isRecurringDueInMonth(item, yearMonth);
                  return (
                    <TableRow
                      key={item.id}
                      className={item.active ? "" : "opacity-60"}
                    >
                      <TableCell className="font-medium">
                        {item.description}
                        {!item.active && (
                          <Badge variant="secondary" className="ml-2">
                            Paused
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{frequencyLabels[item.frequency]}</TableCell>
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
                        Day {item.dayOfMonth}
                        {item.active && dueThisMonthFlag && (
                          <Badge variant="default" className="ml-2">
                            Due
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatBRL(item.amount)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <RecurringDialog
                            recurring={item}
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
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

import { headers } from "next/headers";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getMonthSummary } from "@/lib/actions/dashboard";
import { getCurrentYearMonth, formatYearMonth } from "@/lib/date";
import { formatBRL } from "@/lib/money";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const firstName = session?.user?.name?.split(" ")[0] ?? "there";
  const userId = session?.user?.id;

  const yearMonth = getCurrentYearMonth();
  const summary = userId
    ? await getMonthSummary(userId, yearMonth)
    : { expectedIncome: 0, receivedIncome: 0, totalExpenses: 0 };

  const availableCash = summary.expectedIncome - summary.totalExpenses;

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header className="space-y-2">
        <h1 className="font-heading text-4xl font-semibold tracking-tight">
          Hello, {firstName}
        </h1>
        <p className="text-lg text-muted-foreground">
          {formatYearMonth(yearMonth)} — your financial picture at a glance.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Expected Income</CardDescription>
            <CardTitle className="font-mono text-2xl">
              {formatBRL(summary.expectedIncome)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {summary.expectedIncome > 0
                ? "Money planned to arrive"
                : "No income recorded yet"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Money Allocated</CardDescription>
            <CardTitle className="font-mono text-2xl">
              {formatBRL(summary.totalExpenses)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Recorded expenses this month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Upcoming Obligations</CardDescription>
            <CardTitle className="font-mono text-2xl">R$ 0,00</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Recurring & installments come in Phase 4
            </p>
          </CardContent>
        </Card>
        <Card className="border-primary/50">
          <CardHeader className="pb-2">
            <CardDescription>Available Cash</CardDescription>
            <CardTitle
              className={`font-mono text-2xl ${
                availableCash >= 0 ? "text-primary" : "text-destructive"
              }`}
            >
              {formatBRL(availableCash)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Income minus obligations
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Money In</CardTitle>
              <CardDescription>Expected vs received income</CardDescription>
            </div>
            <Link
              href="/dashboard/income"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              Manage income
            </Link>
          </CardHeader>
          <CardContent className="h-48">
            <div className="flex h-full flex-col items-center justify-center gap-2 rounded-md bg-muted text-sm text-muted-foreground">
              <span className="font-mono text-2xl text-foreground">
                {formatBRL(summary.receivedIncome)}
              </span>
              <span>received of {formatBRL(summary.expectedIncome)}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Money Allocated</CardTitle>
              <CardDescription>Planned vs actual by bucket</CardDescription>
            </div>
            <Link
              href="/dashboard/expenses"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              Manage expenses
            </Link>
          </CardHeader>
          <CardContent className="h-48">
            <div className="flex h-full flex-col items-center justify-center gap-2 rounded-md bg-muted text-sm text-muted-foreground">
              <span className="font-mono text-2xl text-foreground">
                {formatBRL(summary.totalExpenses)}
              </span>
              <span>spent this month</span>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

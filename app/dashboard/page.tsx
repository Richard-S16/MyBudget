import { headers } from "next/headers";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getMonthSummary } from "@/lib/actions/dashboard";
import { getRecurringExpenses } from "@/lib/actions/recurring";
import { getInstallments } from "@/lib/actions/installments";
import { isRecurringDueInMonth, frequencyLabels } from "@/lib/recurring";
import { getCurrentYearMonth, formatYearMonth } from "@/lib/date";
import { formatBRL } from "@/lib/money";
import { cn } from "@/lib/utils";
import { bucketLabels, bucketGradients } from "@/lib/buckets";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Repeat, Landmark } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const firstName = session?.user?.name?.split(" ")[0] ?? "there";
  const userId = session?.user?.id;

  const yearMonth = getCurrentYearMonth();
  const [summary, recurringList, installmentsList] = userId
    ? await Promise.all([
        getMonthSummary(userId, yearMonth),
        getRecurringExpenses(userId),
        getInstallments(userId),
      ])
    : [
        {
          expectedIncome: 0,
          receivedIncome: 0,
          totalExpenses: 0,
          totalPlanned: 0,
          buckets: [],
          upcomingObligations: 0,
        },
        [],
        [],
      ];

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
              {summary.totalPlanned > 0
                ? `${formatBRL(summary.totalPlanned)} planned`
                : "No allocation plan yet"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Upcoming Obligations</CardDescription>
            <CardTitle className="font-mono text-2xl">
              {formatBRL(summary.upcomingObligations)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Recurring & installments this month
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
              Expected income minus recorded expenses
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
              href="/dashboard/plan"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              Edit plan
            </Link>
          </CardHeader>
          <CardContent>
            {summary.buckets.length === 0 || summary.totalPlanned === 0 ? (
              <div className="flex h-48 flex-col items-center justify-center gap-2 rounded-md bg-muted text-sm text-muted-foreground">
                <span className="font-mono text-2xl text-foreground">
                  {formatBRL(summary.totalExpenses)}
                </span>
                <span>spent this month</span>
                <span className="text-xs">Open Monthly Plan to allocate.</span>
              </div>
            ) : (
              <div className="space-y-4">
                {summary.buckets.map((bucket) => {
                  const plannedWidth =
                    summary.expectedIncome > 0
                      ? (bucket.planned / summary.expectedIncome) * 100
                      : 0;
                  const actualWidth =
                    summary.expectedIncome > 0
                      ? (bucket.actual / summary.expectedIncome) * 100
                      : 0;

                  return (
                    <div key={bucket.type} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div
                            className={`h-2.5 w-2.5 rounded-full bg-gradient-to-r ${bucketGradients[bucket.type]}`}
                          />
                          <span className="font-medium">
                            {bucketLabels[bucket.type]}
                          </span>
                        </div>
                        <span
                          className={`font-mono text-xs ${
                            bucket.difference > 0
                              ? "text-destructive"
                              : bucket.difference < 0
                                ? "text-primary"
                                : "text-muted-foreground"
                          }`}
                        >
                          {formatBRL(bucket.actual)} /{" "}
                          {formatBRL(bucket.planned)}
                        </span>
                      </div>
                      <div className="relative h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className={`absolute left-0 top-0 h-full bg-gradient-to-r ${bucketGradients[bucket.type]} opacity-25`}
                          style={{ width: `${Math.min(plannedWidth, 100)}%` }}
                        />
                        <div
                          className={`absolute left-0 top-0 h-full bg-gradient-to-r ${bucketGradients[bucket.type]}`}
                          style={{ width: `${Math.min(actualWidth, 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Obligations</CardTitle>
            <CardDescription>
              Recurring bills and installments coming up this month.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {summary.upcomingObligations === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
                <Repeat className="mb-3 h-8 w-8 text-muted-foreground/60" />
                <p className="text-sm font-medium">No upcoming obligations</p>
                <p className="text-xs text-muted-foreground">
                  Add recurring expenses and installments to see future
                  commitments.
                </p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-3">
                  <h3 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Repeat className="h-4 w-4" />
                    Recurring due in {formatYearMonth(yearMonth)}
                  </h3>
                  <ul className="space-y-2">
                    {recurringList
                      .filter(
                        (item) => item.active && isRecurringDueInMonth(item, yearMonth)
                      )
                      .map((item) => (
                        <li
                          key={item.id}
                          className="flex items-center justify-between rounded-lg border bg-card p-3"
                        >
                          <div>
                            <p className="font-medium">{item.description}</p>
                            <p className="text-xs text-muted-foreground">
                              {frequencyLabels[item.frequency]} · Day{" "}
                              {item.dayOfMonth}
                            </p>
                          </div>
                          <span className="font-mono font-medium">
                            {formatBRL(item.amount)}
                          </span>
                        </li>
                      ))}
                  </ul>
                </div>
                <div className="space-y-3">
                  <h3 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Landmark className="h-4 w-4" />
                    Active installments
                  </h3>
                  <ul className="space-y-2">
                    {installmentsList
                      .filter((item) => item.active)
                      .map((item) => {
                        const progress =
                          item.totalInstallments > 0
                            ? (item.currentInstallment / item.totalInstallments) *
                              100
                            : 0;
                        return (
                          <li
                            key={item.id}
                            className="rounded-lg border bg-card p-3"
                          >
                            <div className="flex items-center justify-between">
                              <p className="font-medium">{item.description}</p>
                              <Badge variant="outline">
                                {item.currentInstallment} / {item.totalInstallments}
                              </Badge>
                            </div>
                            <div className="mt-2 flex items-center justify-between text-sm">
                              <span className="font-mono">
                                {formatBRL(item.installmentAmount)} / mo
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {formatBRL(item.remainingBalance)} left
                              </span>
                            </div>
                            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                              <div
                                className="h-full bg-gradient-to-r from-primary to-emerald-400"
                                style={{ width: `${Math.min(progress, 100)}%` }}
                              />
                            </div>
                          </li>
                        );
                      })}
                  </ul>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { auth } from "@/lib/auth";
import { getMonthlyPlanWithBuckets, updateMonthlyPlanNotes, updateAllocations } from "@/lib/actions/plans";
import { ensureDefaultCategories } from "@/lib/actions/categories";
import { getCurrentYearMonth, formatYearMonth, addMonths } from "@/lib/date";
import { formatBRL } from "@/lib/money";
import { cn } from "@/lib/utils";
import { AllocationForm } from "@/components/plans/allocation-form";
import { PlanNotesForm } from "@/components/plans/plan-notes-form";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { bucketLabels, bucketGradients } from "@/lib/buckets";
import type { CategoryType } from "@/lib/db/schema";

interface PlanPageProps {
  searchParams: Promise<{ month?: string }>;
}

function isValidYearMonth(value: string): boolean {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

export default async function PlanPage({ searchParams }: PlanPageProps) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/");

  const params = await searchParams;
  const yearMonth =
    params.month && isValidYearMonth(params.month)
      ? params.month
      : getCurrentYearMonth();

  const userId = session.user.id;
  const plan = await getMonthlyPlanWithBuckets(userId, yearMonth);
  await ensureDefaultCategories(userId);

  async function saveNotesAction(formData: FormData) {
    "use server";
    try {
      await updateMonthlyPlanNotes(plan.plan.id, formData);
      return { success: true };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  }

  async function saveAllocationsAction(formData: FormData) {
    "use server";
    try {
      await updateAllocations(plan.plan.id, formData);
      return { success: true };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  }

  const percentages = plan.buckets.reduce<Record<CategoryType, number>>(
    (acc, bucket) => {
      acc[bucket.type] = bucket.percentage;
      return acc;
    },
    {
      fixed_expenses: 0,
      investments: 0,
      donations: 0,
      free_spending: 0,
    }
  );

  const previousMonth = addMonths(yearMonth, -1);
  const nextMonth = addMonths(yearMonth, 1);
  const unallocated = Math.max(0, plan.expectedIncome - plan.totalPlanned);

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            Monthly Plan
          </h1>
          <p className="text-muted-foreground">
            Decide where your money should go.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard/plan?month=${previousMonth}`}
            className={cn(
              buttonVariants({ variant: "outline", size: "icon" }),
              "h-9 w-9"
            )}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Previous month</span>
          </Link>
          <div className="flex min-w-[10rem] items-center justify-center gap-2 rounded-lg border bg-card px-4 py-2 font-heading text-sm font-medium">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            {formatYearMonth(yearMonth)}
          </div>
          <Link
            href={`/dashboard/plan?month=${nextMonth}`}
            className={cn(
              buttonVariants({ variant: "outline", size: "icon" }),
              "h-9 w-9"
            )}
          >
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Next month</span>
          </Link>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Expected Income</CardDescription>
            <CardTitle className="font-mono text-2xl">
              {formatBRL(plan.expectedIncome)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Money planned to arrive
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Planned</CardDescription>
            <CardTitle className="font-mono text-2xl">
              {formatBRL(plan.totalPlanned)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {plan.expectedIncome > 0
                ? `${Math.round((plan.totalPlanned / plan.expectedIncome) * 100)}% allocated`
                : "No income yet"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Actual</CardDescription>
            <CardTitle className="font-mono text-2xl">
              {formatBRL(plan.totalActual)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Money already spent</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Unallocated</CardDescription>
            <CardTitle
              className={`font-mono text-2xl ${
                unallocated >= 0 ? "text-primary" : "text-destructive"
              }`}
            >
              {formatBRL(unallocated)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Income not assigned to a bucket
            </p>
          </CardContent>
        </Card>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Money Buckets</CardTitle>
            <CardDescription>
              Set the percentage of expected income for each bucket.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AllocationForm
              expectedIncome={plan.expectedIncome}
              percentages={percentages}
              onAction={saveAllocationsAction}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Plan Notes</CardTitle>
            <CardDescription>
              Capture intentions, reminders or constraints.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PlanNotesForm
              notes={plan.plan.notes}
              onAction={saveNotesAction}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Planned vs Actual</CardTitle>
          <CardDescription>
            Compare your plan against real spending.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {plan.buckets.map((bucket) => {
            const width =
              plan.expectedIncome > 0
                ? (bucket.planned / plan.expectedIncome) * 100
                : 0;
            const actualWidth =
              plan.expectedIncome > 0
                ? (bucket.actual / plan.expectedIncome) * 100
                : 0;

            return (
              <div
                key={bucket.type}
                className="rounded-xl border bg-card p-4 transition-shadow hover:shadow-sm"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-3 w-3 rounded-full bg-gradient-to-r ${bucketGradients[bucket.type]}`}
                    />
                    <h3 className="font-heading font-medium">
                      {bucketLabels[bucket.type]}
                    </h3>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Planned</p>
                      <p className="font-mono">{formatBRL(bucket.planned)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Actual</p>
                      <p className="font-mono">{formatBRL(bucket.actual)}</p>
                    </div>
                    <div className="min-w-[5rem] text-right">
                      <p className="text-xs text-muted-foreground">Difference</p>
                      <p
                        className={`font-mono font-medium ${
                          bucket.difference > 0
                            ? "text-destructive"
                            : bucket.difference < 0
                              ? "text-primary"
                              : "text-muted-foreground"
                        }`}
                      >
                        {formatBRL(bucket.difference)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-4 space-y-1">
                  <div className="relative h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className={`absolute left-0 top-0 h-full bg-gradient-to-r ${bucketGradients[bucket.type]} opacity-30`}
                      style={{ width: `${Math.min(width, 100)}%` }}
                    />
                    <div
                      className={`absolute left-0 top-0 h-full bg-gradient-to-r ${bucketGradients[bucket.type]}`}
                      style={{ width: `${Math.min(actualWidth, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{bucket.percentage}% planned</span>
                    <span>
                      {plan.expectedIncome > 0
                        ? `${Math.round((bucket.actual / plan.expectedIncome) * 100)}% actual`
                        : "0% actual"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

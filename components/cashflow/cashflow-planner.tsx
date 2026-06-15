"use client";

import { useActionState } from "react";
import {
  getCashFlowTimeline,
  type CashFlowTimeline,
} from "@/lib/actions/cashflow";
import { formatBRL } from "@/lib/money";
import { formatYearMonth } from "@/lib/date";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Waves,
  ArrowUpCircle,
  ArrowDownCircle,
  TrendingDown,
  Wallet,
  CalendarDays,
  Repeat,
  Landmark,
} from "lucide-react";

interface CashFlowPlannerProps {
  userId: string;
  initialData: CashFlowTimeline;
}

export function CashFlowPlanner({ userId, initialData }: CashFlowPlannerProps) {
  const [timeline, formAction, pending] = useActionState(
    async (_prev: CashFlowTimeline, formData: FormData) => {
      const balance = Number(formData.get("currentBalance"));
      const months = Number(formData.get("months"));
      return getCashFlowTimeline(userId, balance, months);
    },
    initialData
  );

  const lastEvent = timeline.events[timeline.events.length - 1];
  const endingBalance = lastEvent ? lastEvent.runningBalance : timeline.startingBalance;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header className="space-y-2">
        <h1 className="font-heading text-4xl font-semibold tracking-tight">
          Cash Flow
        </h1>
        <p className="text-lg text-muted-foreground">
          See how your money moves over the coming months.
        </p>
      </header>

      <Card className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <CardHeader className="relative">
          <CardTitle className="flex items-center gap-2">
            <Waves className="h-5 w-5 text-primary" />
            Starting point
          </CardTitle>
          <CardDescription>
            Set your current bank balance and how far ahead you want to look.
          </CardDescription>
        </CardHeader>
        <CardContent className="relative">
          <form
            action={formAction}
            className="flex flex-col gap-4 sm:flex-row sm:items-end"
          >
            <div className="grid flex-1 gap-2">
              <label
                htmlFor="currentBalance"
                className="text-sm font-medium text-muted-foreground"
              >
                Current balance
              </label>
              <Input
                id="currentBalance"
                name="currentBalance"
                type="number"
                step="0.01"
                defaultValue={timeline.currentBalance}
                placeholder="0,00"
                className="font-mono"
              />
            </div>
            <div className="grid w-full gap-2 sm:w-48">
              <label
                htmlFor="months"
                className="text-sm font-medium text-muted-foreground"
              >
                Look ahead
              </label>
              <select
                id="months"
                name="months"
                defaultValue={timeline.months}
                className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value={3}>3 months</option>
                <option value={6}>6 months</option>
                <option value={12}>12 months</option>
              </select>
            </div>
            <Button type="submit" disabled={pending} className="shrink-0">
              {pending ? "Flowing..." : "Update projection"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          label="Starting balance"
          value={timeline.startingBalance}
          icon={<Wallet className="h-4 w-4" />}
          tone="neutral"
        />
        <SummaryCard
          label="Expected income"
          value={timeline.totalExpectedIncome}
          icon={<ArrowUpCircle className="h-4 w-4" />}
          tone="positive"
        />
        <SummaryCard
          label="Upcoming obligations"
          value={timeline.totalObligations}
          icon={<ArrowDownCircle className="h-4 w-4" />}
          tone="negative"
        />
        <SummaryCard
          label="Projected ending balance"
          value={endingBalance}
          icon={<CalendarDays className="h-4 w-4" />}
          tone={endingBalance >= 0 ? "positive" : "negative"}
        />
      </section>

      {timeline.lowestBalance && timeline.lowestBalance.value < 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-destructive">
          <TrendingDown className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-medium">Low point ahead</p>
            <p className="text-sm opacity-90">
              The projection hits {formatBRL(timeline.lowestBalance.value)} in{" "}
              {formatYearMonth(timeline.lowestBalance.yearMonth)}. Check your
              obligations or expected income.
            </p>
          </div>
        </div>
      )}

      <section>
        <h2 className="font-heading text-2xl font-semibold tracking-tight">
          Timeline
        </h2>
        <p className="mb-6 text-muted-foreground">
          {timeline.monthsLabel} of expected income versus obligations.
        </p>

        <div className="relative">
          <div className="absolute top-8 left-0 right-0 hidden h-1 rounded-full bg-gradient-to-r from-primary/30 via-accent/30 to-primary/30 md:block" />
          <div className="flex snap-x gap-4 overflow-x-auto pb-6 md:pb-8">
            {timeline.events.map((event, index) => (
              <MonthCard
                key={event.yearMonth}
                event={event}
                index={index}
                isFirst={index === 0}
                isLast={index === timeline.events.length - 1}
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  tone: "neutral" | "positive" | "negative";
}) {
  const toneClass =
    tone === "positive"
      ? "text-emerald-600"
      : tone === "negative"
      ? "text-destructive"
      : "text-foreground";

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription className="flex items-center gap-2">
          {icon}
          {label}
        </CardDescription>
        <CardTitle className={cn("font-mono text-2xl", toneClass)}>
          {formatBRL(value)}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground">Across the projection</p>
      </CardContent>
    </Card>
  );
}

function MonthCard({
  event,
  index,
}: {
  event: CashFlowTimeline["events"][number];
  index: number;
  isFirst: boolean;
  isLast: boolean;
}) {
  const positive = event.runningBalance >= 0;
  const netPositive = event.net >= 0;

  return (
    <div
      className="animate-fade-in-up relative w-[280px] shrink-0 snap-start md:w-[260px]"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="flex justify-center md:hidden">
        <div className="h-4 w-4 rounded-full border-2 border-background bg-primary ring-2 ring-primary/20" />
      </div>

      <Card
        className={cn(
          "relative overflow-hidden transition-shadow hover:shadow-lg",
          positive ? "border-primary/20" : "border-destructive/30"
        )}
      >
        <div
          className={cn(
            "absolute inset-x-0 top-0 h-1",
            positive
              ? "bg-gradient-to-r from-emerald-500 to-primary"
              : "bg-gradient-to-r from-destructive to-rose-400"
          )}
        />
        <CardHeader className="pb-2">
          <CardDescription className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            {formatYearMonth(event.yearMonth)}
          </CardDescription>
          <CardTitle
            className={cn(
              "font-mono text-3xl",
              positive ? "text-foreground" : "text-destructive"
            )}
          >
            {formatBRL(event.runningBalance)}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 text-emerald-600">
                <ArrowUpCircle className="h-4 w-4" />
                Income
              </span>
              <span className="font-mono font-medium">
                {formatBRL(event.expectedIncome)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 text-destructive">
                <ArrowDownCircle className="h-4 w-4" />
                Obligations
              </span>
              <span className="font-mono font-medium">
                {formatBRL(event.obligations)}
              </span>
            </div>
            <div className="flex items-center justify-between border-t pt-2 text-sm">
              <span
                className={cn(
                  "font-medium",
                  netPositive ? "text-emerald-600" : "text-destructive"
                )}
              >
                Net
              </span>
              <span
                className={cn(
                  "font-mono font-medium",
                  netPositive ? "text-emerald-600" : "text-destructive"
                )}
              >
                {netPositive ? "+" : ""}
                {formatBRL(event.net)}
              </span>
            </div>
          </div>

          {event.obligationsDetails.length > 0 && (
            <div className="space-y-2 rounded-lg bg-muted/50 p-3">
              <p className="text-xs font-medium text-muted-foreground">
                Upcoming
              </p>
              <ul className="space-y-2">
                {event.obligationsDetails.slice(0, 4).map((item, i) => (
                  <li
                    key={`${item.description}-${i}`}
                    className="flex items-start justify-between gap-2 text-xs"
                  >
                    <span className="flex items-center gap-1.5">
                      {item.type === "recurring" ? (
                        <Repeat className="h-3 w-3 text-muted-foreground" />
                      ) : (
                        <Landmark className="h-3 w-3 text-muted-foreground" />
                      )}
                      <span className="line-clamp-1">{item.description}</span>
                    </span>
                    <span className="shrink-0 font-mono">
                      {formatBRL(item.amount)}
                    </span>
                  </li>
                ))}
                {event.obligationsDetails.length > 4 && (
                  <li className="text-xs text-muted-foreground">
                    +{event.obligationsDetails.length - 4} more
                  </li>
                )}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

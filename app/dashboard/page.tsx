import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const firstName = session?.user?.name?.split(" ")[0] ?? "there";

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header className="space-y-2">
        <h1 className="font-heading text-4xl font-semibold tracking-tight">
          Hello, {firstName}
        </h1>
        <p className="text-lg text-muted-foreground">
          Here is your financial picture for this month.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Expected Income</CardDescription>
            <CardTitle className="font-mono text-2xl">R$ 0,00</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">No income recorded yet</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Money Allocated</CardDescription>
            <CardTitle className="font-mono text-2xl">R$ 0,00</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Set up your monthly plan
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
              Recurring & installments
            </p>
          </CardContent>
        </Card>
        <Card className="border-primary/50">
          <CardHeader className="pb-2">
            <CardDescription>Available Cash</CardDescription>
            <CardTitle className="font-mono text-2xl text-primary">
              R$ 0,00
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
          <CardHeader>
            <CardTitle>Money In</CardTitle>
            <CardDescription>Expected vs received income</CardDescription>
          </CardHeader>
          <CardContent className="h-48">
            <div className="flex h-full items-center justify-center rounded-md bg-muted text-sm text-muted-foreground">
              Income chart coming in Phase 2
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Money Allocated</CardTitle>
            <CardDescription>Planned vs actual by bucket</CardDescription>
          </CardHeader>
          <CardContent className="h-48">
            <div className="flex h-full items-center justify-center rounded-md bg-muted text-sm text-muted-foreground">
              Allocation chart coming in Phase 3
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SignInButton } from "@/components/auth/sign-in-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Calendar, Eye, PiggyBank, ShieldCheck } from "lucide-react";

export default async function HomePage() {
  let session;
  try {
    session = await auth.api.getSession({ headers: await headers() });
  } catch {
    session = null;
  }

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden bg-background">
      {/* Decorative background shapes */}
      <div className="pointer-events-none absolute -left-32 top-0 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-[32rem] w-[32rem] rounded-full bg-accent/10 blur-3xl" />

      <main className="relative z-10 flex flex-1 flex-col">
        {/* Hero */}
        <section className="flex flex-1 flex-col items-center justify-center px-6 py-20 text-center md:py-32">
          <div className="mb-6 inline-flex items-center rounded-full border bg-card px-4 py-1.5 text-sm font-medium text-muted-foreground shadow-sm">
            Phase 1 — Foundation live
          </div>
          <h1 className="max-w-3xl font-heading text-5xl font-semibold leading-[1.05] tracking-tight md:text-7xl">
            Plan money before{" "}
            <span className="italic text-primary">it leaves.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground md:text-xl">
            MyBudget replaces your finance spreadsheet with a fast, opinionated
            cash-flow system built around monthly planning and intentional
            allocation.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
            <SignInButton />
            <p className="text-sm text-muted-foreground">
              Google sign-in only. No passwords.
            </p>
          </div>
        </section>

        {/* Feature grid */}
        <section className="mx-auto w-full max-w-6xl px-6 pb-24">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-card/80 backdrop-blur">
              <CardHeader className="pb-2">
                <Calendar className="mb-2 h-6 w-6 text-primary" />
                <CardTitle className="font-heading text-lg">
                  Monthly planning
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Think in months, not endless transaction history.
                </CardDescription>
              </CardContent>
            </Card>
            <Card className="bg-card/80 backdrop-blur">
              <CardHeader className="pb-2">
                <PiggyBank className="mb-2 h-6 w-6 text-primary" />
                <CardTitle className="font-heading text-lg">
                  Money buckets
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Allocate income intentionally before spending it.
                </CardDescription>
              </CardContent>
            </Card>
            <Card className="bg-card/80 backdrop-blur">
              <CardHeader className="pb-2">
                <Eye className="mb-2 h-6 w-6 text-primary" />
                <CardTitle className="font-heading text-lg">
                  Future obligations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Track installments and recurring bills at a glance.
                </CardDescription>
              </CardContent>
            </Card>
            <Card className="bg-card/80 backdrop-blur">
              <CardHeader className="pb-2">
                <ShieldCheck className="mb-2 h-6 w-6 text-primary" />
                <CardTitle className="font-heading text-lg">
                  Available cash
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Know how much money is actually free to spend.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
    </div>
  );
}

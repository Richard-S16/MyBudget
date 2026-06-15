import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getCashFlowTimeline } from "@/lib/actions/cashflow";
import { CashFlowPlanner } from "@/components/cashflow/cashflow-planner";

export default async function CashFlowPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/");

  const initialData = await getCashFlowTimeline(session.user.id, 0, 6);

  return <CashFlowPlanner userId={session.user.id} initialData={initialData} />;
}

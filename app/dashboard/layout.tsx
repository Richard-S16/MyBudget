import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AppShell } from "@/components/layout/app-shell";
import { BiometricGate } from "@/components/auth/biometric-gate";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let session;
  try {
    session = await auth.api.getSession({
      headers: await headers(),
    });
  } catch {
    session = null;
  }

  if (!session?.user) {
    redirect("/");
  }

  return (
    <BiometricGate>
      <AppShell user={session.user}>{children}</AppShell>
    </BiometricGate>
  );
}

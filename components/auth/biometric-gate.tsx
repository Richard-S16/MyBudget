"use client";

import { useEffect, useState } from "react";
import { Fingerprint } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBiometric } from "@/hooks/use-biometric";

export function BiometricGate({ children }: { children: React.ReactNode }) {
  const { available, checking, authenticate } = useBiometric();
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    if (!available || unlocked) return;
    authenticate().then((ok) => {
      if (ok) setUnlocked(true);
    });
  }, [available, unlocked, authenticate]);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!available || unlocked) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
        <Fingerprint className="h-10 w-10 text-primary" />
      </div>
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold">Locked</h1>
        <p className="text-sm text-muted-foreground">
          Use your biometrics to unlock MyBudget.
        </p>
      </div>
      <Button
        onClick={async () => {
          const ok = await authenticate();
          if (ok) setUnlocked(true);
        }}
        className="h-12 px-6"
      >
        <Fingerprint className="mr-2 h-5 w-5" />
        Unlock
      </Button>
    </div>
  );
}

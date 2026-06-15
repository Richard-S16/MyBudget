"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

export function SignInButton() {
  const [isLoading, setIsLoading] = useState(false);

  async function handleSignIn() {
    setIsLoading(true);
    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: "/dashboard",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Button
      onClick={handleSignIn}
      disabled={isLoading}
      size="lg"
      className="rounded-full px-8"
    >
      {isLoading ? "Connecting..." : "Sign in with Google"}
    </Button>
  );
}

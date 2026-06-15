"use client";

import { useCallback, useEffect, useState } from "react";

interface BiometricPlugin {
  isAvailable: () => Promise<{ isAvailable: boolean }>;
  verifyIdentity: (options: {
    reason?: string;
    title?: string;
    subtitle?: string;
    description?: string;
  }) => Promise<void>;
}

export function useBiometric() {
  const [available, setAvailable] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function check() {
      try {
        const mod = await import("capacitor-native-biometric");
        const plugin = (mod.NativeBiometric ?? mod.default) as BiometricPlugin | undefined;
        if (!plugin) {
          if (mounted) setAvailable(false);
          return;
        }
        const result = await plugin.isAvailable();
        if (mounted) setAvailable(result.isAvailable);
      } catch {
        if (mounted) setAvailable(false);
      } finally {
        if (mounted) setChecking(false);
      }
    }

    check();
    return () => {
      mounted = false;
    };
  }, []);

  const authenticate = useCallback(async (reason = "Unlock MyBudget") => {
    try {
      const mod = await import("capacitor-native-biometric");
      const plugin = (mod.NativeBiometric ?? mod.default) as BiometricPlugin | undefined;
      if (!plugin) return false;
      const availableResult = await plugin.isAvailable();
      if (!availableResult.isAvailable) return false;
      await plugin.verifyIdentity({
        reason,
        title: "MyBudget",
        subtitle: "Biometric authentication",
        description: "Confirm your identity to continue",
      });
      return true;
    } catch {
      return false;
    }
  }, []);

  return { available, checking, authenticate };
}

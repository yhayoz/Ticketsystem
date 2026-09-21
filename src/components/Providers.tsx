"use client";

import { Suspense } from "react";
import { AuthProvider } from "@/components/auth/AuthProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-sm text-[var(--muted)]">
          Loading…
        </div>
      }
    >
      <AuthProvider>{children}</AuthProvider>
    </Suspense>
  );
}

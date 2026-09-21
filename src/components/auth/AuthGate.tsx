"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading, configured } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!configured || loading) {
      return;
    }
    if (!user) {
      const next = encodeURIComponent(pathname || "/inbox");
      router.replace(`/login?next=${next}`);
    }
  }, [configured, loading, pathname, router, user]);

  if (!configured) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-[var(--muted)]">
        Checking session…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-[var(--muted)]">
        Redirecting to login…
      </div>
    );
  }

  return <>{children}</>;
}

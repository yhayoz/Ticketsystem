"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/inbox";
  const { signIn, signUp, configured, user, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"in" | "up">("in");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && configured && user) {
      router.replace(nextPath);
    }
  }, [configured, loading, nextPath, router, user]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      if (mode === "in") {
        await signIn(email, password);
      } else {
        await signUp(email, password);
      }
      router.replace(nextPath);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md space-y-5 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-sm">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
            Ticketsystem
          </p>
          <h1 className="mt-1 text-xl font-semibold">
            {mode === "in" ? "Sign in" : "Create account"}
          </h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Firebase Auth email/password. Roles come from custom claims
            (admin, agent, viewer).
          </p>
        </div>

        {!configured ? (
          <div className="space-y-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
            <p>
              Firebase client env vars are not set. You can still open the
              stubbed inbox and detail layout.
            </p>
            <Link href="/inbox" className="btn-primary inline-flex">
              Continue to inbox preview
            </Link>
          </div>
        ) : null}

        <form onSubmit={onSubmit} className="space-y-3">
          <label className="flex flex-col gap-1 text-xs text-[var(--muted)]">
            Email
            <input
              className="field"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={!configured || submitting}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-[var(--muted)]">
            Password
            <input
              className="field"
              type="password"
              autoComplete={mode === "in" ? "current-password" : "new-password"}
              required
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={!configured || submitting}
            />
          </label>
          {error ? <p className="text-sm text-red-700">{error}</p> : null}
          <button
            type="submit"
            className="btn-primary w-full"
            disabled={!configured || submitting}
          >
            {submitting
              ? "Please wait…"
              : mode === "in"
                ? "Sign in"
                : "Create account"}
          </button>
        </form>

        <button
          type="button"
          className="text-sm text-[var(--accent)] hover:underline"
          onClick={() => setMode(mode === "in" ? "up" : "in")}
        >
          {mode === "in"
            ? "Need an account? Create one"
            : "Already registered? Sign in"}
        </button>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-sm text-[var(--muted)]">
          Loading…
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

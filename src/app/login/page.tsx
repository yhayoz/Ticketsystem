"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";

export default function LoginPage() {
  const router = useRouter();
  const { signIn, signUp, configured, user, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"in" | "up">("in");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && configured && user) {
      router.replace("/inbox");
    }
  }, [configured, loading, router, user]);

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
      router.replace("/inbox");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Anmeldung fehlgeschlagen.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <p className="text-sm font-semibold tracking-tight">Ticketsystem</p>
          <h1 className="mt-2 text-xl font-semibold">
            {mode === "in" ? "Anmelden" : "Konto erstellen"}
          </h1>
        </div>

        {!configured ? (
          <div className="space-y-3">
            <p className="text-center text-sm text-[var(--muted)]">
              Firebase ist nicht konfiguriert. Die Inbox-Vorschau ist trotzdem
              verfügbar.
            </p>
            <Link href="/inbox" className="btn-primary w-full">
              Zur Inbox
            </Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-3">
            <label className="flex flex-col gap-1 text-xs text-[var(--muted)]">
              E-Mail
              <input
                className="field"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={submitting}
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-[var(--muted)]">
              Passwort
              <input
                className="field"
                type="password"
                autoComplete={mode === "in" ? "current-password" : "new-password"}
                required
                minLength={6}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={submitting}
              />
            </label>
            {error ? <p className="text-sm text-red-700">{error}</p> : null}
            <button type="submit" className="btn-primary w-full" disabled={submitting}>
              {submitting
                ? "Bitte warten…"
                : mode === "in"
                  ? "Anmelden"
                  : "Konto erstellen"}
            </button>
          </form>
        )}

        {configured ? (
          <button
            type="button"
            className="mx-auto block text-sm text-[var(--muted)] hover:text-[var(--accent)]"
            onClick={() => setMode(mode === "in" ? "up" : "in")}
          >
            {mode === "in"
              ? "Noch kein Konto? Konto erstellen"
              : "Bereits registriert? Anmelden"}
          </button>
        ) : null}
      </div>
    </div>
  );
}

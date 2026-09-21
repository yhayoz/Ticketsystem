"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { roleLabel } from "@/lib/format";
import { withPreviewRole } from "@/lib/preview-role";
import { canUseWriteChrome } from "@/lib/roles";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, role, configured, signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const canCreate = canUseWriteChrome(role, configured);

  async function onSignOut() {
    await signOut();
    router.push("/login");
  }

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <header className="border-b border-[var(--line)] bg-[var(--surface)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-6">
            <Link href={withPreviewRole("/inbox", role, configured)} className="text-sm font-semibold tracking-tight">
              Ticketsystem
            </Link>
            <nav className="flex items-center gap-3 text-sm">
              <NavLink href={withPreviewRole("/inbox", role, configured)} active={pathname === "/inbox"}>
                Inbox
              </NavLink>
              {canCreate ? (
                <NavLink
                  href={withPreviewRole("/tickets/new", role, configured)}
                  active={pathname === "/tickets/new"}
                >
                  Neues Ticket
                </NavLink>
              ) : null}
            </nav>
          </div>
          <div className="flex items-center gap-3 text-xs text-[var(--muted)]">
            {configured && user ? (
              <>
                <span>
                  {user.email} · {roleLabel(role)}
                </span>
                <button
                  type="button"
                  onClick={onSignOut}
                  className="rounded-md border border-[var(--line)] px-2 py-1 text-[var(--ink)] hover:bg-[var(--bg)]"
                >
                  Sign out
                </button>
              </>
            ) : (
              <span>
                Preview mode · {roleLabel(role)}
              </span>
            )}
          </div>
        </div>
      </header>
      {!configured ? (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-sm text-amber-950">
          Copy <code className="font-mono">.env.example</code> to{" "}
          <code className="font-mono">.env.local</code> and add Firebase keys to
          enable auth and Firestore. Preview-Rolle:{" "}
          <Link
            href={`${pathname}?role=agent`}
            className={role === "agent" ? "font-medium underline" : "underline"}
          >
            Agent
          </Link>
          {" · "}
          <Link
            href={`${pathname}?role=viewer`}
            className={role === "viewer" ? "font-medium underline" : "underline"}
          >
            Viewer
          </Link>
        </div>
      ) : null}
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={
        active
          ? "font-medium text-[var(--accent)]"
          : "text-[var(--muted)] hover:text-[var(--ink)]"
      }
    >
      {children}
    </Link>
  );
}

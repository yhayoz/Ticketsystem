"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TicketFiltersBar } from "@/components/tickets/TicketFilters";
import { TicketList } from "@/components/tickets/TicketList";
import { useAuth } from "@/components/auth/AuthProvider";
import { listMembers, listAssignableMembers } from "@/lib/members";
import { PREVIEW_TICKET } from "@/lib/preview-data";
import { listTickets } from "@/lib/tickets";
import type { Member, Ticket, TicketFilters } from "@/types";

export default function InboxPage() {
  const { configured } = useAuth();
  const [filters, setFilters] = useState<TicketFilters>({
    status: "all",
    assigneeId: "all",
  });
  const [tickets, setTickets] = useState<Ticket[]>(
    configured ? [] : [PREVIEW_TICKET],
  );
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(configured);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!configured) {
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const [nextTickets, nextMembers] = await Promise.all([
          listTickets(filters),
          listMembers(),
        ]);
        if (cancelled) {
          return;
        }
        setTickets(nextTickets);
        setMembers(listAssignableMembers(nextMembers));
        setError(null);
        setLoading(false);
      } catch (err) {
        if (cancelled) {
          return;
        }
        setError(err instanceof Error ? err.message : "Failed to load tickets.");
        setTickets([]);
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [configured, filters]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Inbox</h1>
          <p className="text-sm text-[var(--muted)]">
            Tickets sorted by last update. Filter by status and assignee.
          </p>
        </div>
        <Link href="/tickets/new" className="btn-primary">
          New ticket
        </Link>
      </div>

      <TicketFiltersBar
        filters={filters}
        members={members}
        onChange={setFilters}
      />

      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      {loading ? (
        <p className="text-sm text-[var(--muted)]">Loading tickets…</p>
      ) : (
        <TicketList
          tickets={tickets}
          members={members}
          emptyHint={
            configured
              ? "No tickets yet. Create one to get started."
              : "Connect Firebase to load live tickets. A preview row is shown below."
          }
        />
      )}

      {!configured ? (
        <p className="text-xs text-[var(--muted)]">
          Layout preview uses a sample ticket. Open{" "}
          <Link href="/tickets/preview" className="text-[var(--accent)] hover:underline">
            /tickets/preview
          </Link>{" "}
          for the detail view.
        </p>
      ) : null}
    </div>
  );
}

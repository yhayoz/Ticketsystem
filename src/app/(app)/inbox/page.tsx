"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { TicketFiltersBar } from "@/components/tickets/TicketFilters";
import { TicketList } from "@/components/tickets/TicketList";
import { useAuth } from "@/components/auth/AuthProvider";
import { listMembers, listAssignableMembers } from "@/lib/members";
import { PREVIEW_TICKETS } from "@/lib/preview-data";
import { withPreviewRole } from "@/lib/preview-role";
import { canUseWriteChrome } from "@/lib/roles";
import { listTickets, matchesTitleQuery } from "@/lib/tickets";
import type { Member, Ticket, TicketFilters } from "@/types";

export default function InboxPage() {
  const { configured, role } = useAuth();
  const canCreate = canUseWriteChrome(role, configured);
  const [filters, setFilters] = useState<TicketFilters>({
    status: "all",
    assigneeId: "all",
    title: "",
  });
  const [tickets, setTickets] = useState<Ticket[]>(
    configured ? [] : PREVIEW_TICKETS,
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
          listTickets({
            status: filters.status,
            assigneeId: filters.assigneeId,
          }),
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
  }, [configured, filters.assigneeId, filters.status]);

  const visibleTickets = useMemo(
    () => tickets.filter((ticket) => matchesTitleQuery(ticket, filters.title)),
    [filters.title, tickets],
  );

  const hasActiveFilters =
    (filters.status ?? "all") !== "all" ||
    (filters.assigneeId ?? "all") !== "all" ||
    Boolean(filters.title?.trim());

  const emptyHint =
    tickets.length === 0 && !hasActiveFilters
      ? "Noch keine Tickets."
      : "Keine Tickets passen zu diesen Filtern.";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Inbox</h1>
          <p className="text-sm text-[var(--muted)]">
            Sorted by last update. Filter by status, assignee, and title.
          </p>
        </div>
        {canCreate ? (
          <Link href={withPreviewRole("/tickets/new", role, configured)} className="btn-primary">
            Neues Ticket
          </Link>
        ) : null}
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
          tickets={visibleTickets}
          members={members}
          emptyHint={emptyHint}
          ticketHref={(id) => withPreviewRole(`/tickets/${id}`, role, configured)}
          emptyAction={
            canCreate ? (
              <Link href={withPreviewRole("/tickets/new", role, configured)} className="btn-primary">
                Neues Ticket
              </Link>
            ) : null
          }
        />
      )}

      {!configured ? (
        <p className="text-xs text-[var(--muted)]">
          Layout preview uses a sample ticket. Open{" "}
          <Link href={withPreviewRole("/tickets/preview", role, configured)} className="text-[var(--accent)] hover:underline">
            /tickets/preview
          </Link>{" "}
          for the detail view.
        </p>
      ) : null}
    </div>
  );
}

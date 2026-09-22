import type { ReactNode } from "react";
import Link from "next/link";
import type { Member, Ticket } from "@/types";
import { TicketBadges } from "@/components/tickets/Badges";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDateTime, formatRelativeTime } from "@/lib/format";

type TicketListProps = {
  tickets: Ticket[];
  members: Member[];
  emptyHint?: string;
  emptyAction?: ReactNode;
  ticketHref?: (id: string) => string;
};

export function TicketList({
  tickets,
  members,
  emptyHint,
  emptyAction,
  ticketHref = (id) => `/tickets/${id}`,
}: TicketListProps) {
  const names = new Map(members.map((member) => [member.id, member.displayName]));

  if (tickets.length === 0) {
    return (
      <EmptyState
        message={emptyHint ?? "Noch keine Tickets."}
        action={emptyAction}
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--surface)]">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-[var(--line)] bg-[var(--bg)] text-xs uppercase tracking-wide text-[var(--muted)]">
          <tr>
            <th className="px-4 py-2 font-medium">Title</th>
            <th className="px-4 py-2 font-medium">Assignee</th>
            <th className="px-4 py-2 font-medium">Updated</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((ticket) => (
            <tr key={ticket.id} className="border-b border-[var(--line)] last:border-0">
              <td className="px-4 py-3">
                <div className="flex flex-col gap-1.5">
                  <Link
                    href={ticketHref(ticket.id)}
                    className="font-medium text-[var(--ink)] hover:text-[var(--accent)]"
                  >
                    {ticket.title || "Untitled"}
                  </Link>
                  <TicketBadges status={ticket.status} priority={ticket.priority} />
                </div>
              </td>
              <td className="px-4 py-3 text-[var(--muted)]">
                {ticket.assigneeId
                  ? names.get(ticket.assigneeId) ?? ticket.assigneeId
                  : "Unassigned"}
              </td>
              <td className="px-4 py-3 text-[var(--muted)]">
                <time dateTime={ticket.updatedAt.toISOString()} title={formatDateTime(ticket.updatedAt)}>
                  {formatRelativeTime(ticket.updatedAt)}
                </time>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

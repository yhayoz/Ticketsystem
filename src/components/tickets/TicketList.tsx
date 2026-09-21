import Link from "next/link";
import type { Member, Ticket } from "@/types";
import { PriorityBadge, StatusBadge } from "@/components/tickets/Badges";
import { formatDateTime, formatRelativeTime } from "@/lib/format";

type TicketListProps = {
  tickets: Ticket[];
  members: Member[];
  emptyHint?: string;
};

export function TicketList({ tickets, members, emptyHint }: TicketListProps) {
  const names = new Map(members.map((member) => [member.id, member.displayName]));

  if (tickets.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-[var(--line)] bg-[var(--surface)] px-4 py-10 text-center text-sm text-[var(--muted)]">
        {emptyHint ?? "No tickets match these filters."}
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--surface)]">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-[var(--line)] bg-[var(--bg)] text-xs uppercase tracking-wide text-[var(--muted)]">
          <tr>
            <th className="px-4 py-2 font-medium">Title</th>
            <th className="px-4 py-2 font-medium">Status</th>
            <th className="px-4 py-2 font-medium">Priority</th>
            <th className="px-4 py-2 font-medium">Assignee</th>
            <th className="px-4 py-2 font-medium">Updated</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((ticket) => (
            <tr key={ticket.id} className="border-b border-[var(--line)] last:border-0">
              <td className="px-4 py-3">
                <Link
                  href={`/tickets/${ticket.id}`}
                  className="font-medium text-[var(--ink)] hover:text-[var(--accent)]"
                >
                  {ticket.title || "Untitled"}
                </Link>
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={ticket.status} />
              </td>
              <td className="px-4 py-3">
                <PriorityBadge priority={ticket.priority} />
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

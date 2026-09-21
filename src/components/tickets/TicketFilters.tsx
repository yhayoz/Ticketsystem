import type { Member } from "@/types";
import { TICKET_STATUSES, type TicketFilters, type TicketStatus } from "@/types";
import { statusLabel } from "@/lib/format";

type TicketFiltersProps = {
  filters: TicketFilters;
  members: Member[];
  onChange: (next: TicketFilters) => void;
};

export function TicketFiltersBar({
  filters,
  members,
  onChange,
}: TicketFiltersProps) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1 text-xs text-[var(--muted)]">
        Status
        <select
          className="field min-w-40"
          value={filters.status ?? "all"}
          onChange={(event) =>
            onChange({
              ...filters,
              status: event.target.value as TicketStatus | "all",
            })
          }
        >
          <option value="all">All statuses</option>
          {TICKET_STATUSES.map((status) => (
            <option key={status} value={status}>
              {statusLabel(status)}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-xs text-[var(--muted)]">
        Assignee
        <select
          className="field min-w-48"
          value={filters.assigneeId ?? "all"}
          onChange={(event) =>
            onChange({ ...filters, assigneeId: event.target.value })
          }
        >
          <option value="all">All assignees</option>
          <option value="unassigned">Unassigned</option>
          {members.map((member) => (
            <option key={member.id} value={member.id}>
              {member.displayName}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

import type { Member } from "@/types";
import {
  DUE_FILTERS,
  TICKET_STATUSES,
  type DueFilter,
  type TicketFilters,
  type TicketStatus,
} from "@/types";
import { statusLabel } from "@/lib/format";

const DUE_FILTER_LABELS: Record<DueFilter, string> = {
  all: "Alle Fälligkeiten",
  overdue: "Überfällig",
  has_due: "Mit Fälligkeit",
};

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
      <div className="flex flex-col gap-1">
        <span className="text-xs text-transparent select-none" aria-hidden="true">
          Filter
        </span>
        <button
          type="button"
          className="chip"
          aria-pressed={Boolean(filters.mine)}
          onClick={() => onChange({ ...filters, mine: !filters.mine })}
        >
          Meine Tickets
        </button>
      </div>
      <label className="flex min-w-56 flex-1 flex-col gap-1 text-xs text-[var(--muted)]">
        Title
        <input
          className="field"
          type="search"
          placeholder="Search title…"
          value={filters.title ?? ""}
          onChange={(event) =>
            onChange({ ...filters, title: event.target.value })
          }
        />
      </label>
      <label className="flex flex-col gap-1 text-xs text-[var(--muted)]">
        Status
        <select
          className="field min-w-44"
          value={filters.status ?? "all"}
          onChange={(event) =>
            onChange({
              ...filters,
              status: event.target.value as TicketStatus | "all",
            })
          }
        >
          <option value="all">Alle Status</option>
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
          disabled={Boolean(filters.mine)}
          title={
            filters.mine
              ? "Deaktiviert, solange „Meine Tickets“ aktiv ist."
              : undefined
          }
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
      <label className="flex flex-col gap-1 text-xs text-[var(--muted)]">
        Fälligkeit
        <select
          className="field min-w-44"
          value={filters.due ?? "all"}
          onChange={(event) =>
            onChange({
              ...filters,
              due: event.target.value as DueFilter,
            })
          }
        >
          {DUE_FILTERS.map((due) => (
            <option key={due} value={due}>
              {DUE_FILTER_LABELS[due]}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

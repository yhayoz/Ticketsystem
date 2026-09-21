import { priorityLabel, statusLabel } from "@/lib/format";
import type { TicketPriority, TicketStatus } from "@/types";

const BADGE_BASE =
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium leading-none";

const STATUS_CLASS: Record<TicketStatus, string> = {
  open: "border-[color-mix(in_srgb,var(--accent)_35%,var(--line))] bg-[color-mix(in_srgb,var(--accent)_10%,white)] text-[var(--accent)]",
  in_progress:
    "border-[var(--line)] bg-[var(--bg)] text-[var(--ink)]",
  done: "border-[var(--line)] bg-[var(--bg)] text-[var(--muted)]",
  closed: "border-[var(--line)] bg-[var(--bg)] text-[var(--muted)]",
};

const PRIORITY_CLASS: Record<TicketPriority, string> = {
  low: "border-[var(--line)] bg-[var(--bg)] text-[var(--muted)]",
  medium: "border-[var(--line)] bg-[var(--bg)] text-[var(--ink)]",
  high: "border-[color-mix(in_srgb,var(--accent)_35%,var(--line))] bg-[color-mix(in_srgb,var(--accent)_10%,white)] text-[var(--accent)]",
  urgent: "border-[var(--accent)] bg-[var(--accent)] text-white",
};

export function StatusBadge({ status }: { status: TicketStatus }) {
  return (
    <span className={`${BADGE_BASE} ${STATUS_CLASS[status]}`}>
      {statusLabel(status)}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: TicketPriority }) {
  return (
    <span className={`${BADGE_BASE} ${PRIORITY_CLASS[priority]}`}>
      {priorityLabel(priority)}
    </span>
  );
}

/** Shared status → priority cluster for list rows and the detail header. */
export function TicketBadges({
  status,
  priority,
}: {
  status: TicketStatus;
  priority: TicketPriority;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <StatusBadge status={status} />
      <PriorityBadge priority={priority} />
    </div>
  );
}

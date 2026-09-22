import { dueTone, dueToneLabel, formatDueDate } from "@/lib/due";
import { priorityLabel, statusLabel } from "@/lib/format";
import type { TicketPriority, TicketStatus } from "@/types";

const BADGE_BASE =
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium leading-none";

const STATUS_CLASS: Record<TicketStatus, string> = {
  open: "border-[color-mix(in_srgb,var(--accent)_35%,var(--line))] bg-[color-mix(in_srgb,var(--accent)_10%,white)] text-[var(--accent)]",
  in_progress:
    "border-[var(--line)] bg-[var(--bg)] text-[var(--ink)]",
  done: "border-[var(--ink)]/15 bg-[var(--surface)] text-[var(--ink)]",
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
    <span className={`${BADGE_BASE} ${STATUS_CLASS[status] ?? STATUS_CLASS.open}`}>
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

const DUE_CLASS = {
  overdue: "border-red-200 bg-red-50 text-red-700",
  soon: "border-amber-300 bg-amber-50 text-amber-900",
  neutral: "border-[var(--line)] bg-[var(--bg)] text-[var(--muted)]",
} as const;

/** Inbox and read-only detail: red overdue, amber within 48h, otherwise neutral. */
export function DueBadge({ dueAt }: { dueAt: Date | null }) {
  const tone = dueTone(dueAt);
  if (tone === "none" || !dueAt) {
    return <span className="text-[var(--muted)]">—</span>;
  }
  const label = dueToneLabel(tone);
  return (
    <time
      dateTime={dueAt.toISOString()}
      title={label ?? undefined}
      className={`${BADGE_BASE} ${DUE_CLASS[tone]}`}
    >
      {label ? <span className="sr-only">{label}: </span> : null}
      {formatDueDate(dueAt)}
    </time>
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

import type { TicketPriority, TicketStatus } from "@/types";

const STATUS_CLASS: Record<TicketStatus, string> = {
  open: "bg-blue-50 text-blue-800",
  in_progress: "bg-amber-50 text-amber-800",
  done: "bg-emerald-50 text-emerald-800",
  closed: "bg-zinc-100 text-zinc-700",
};

const PRIORITY_CLASS: Record<TicketPriority, string> = {
  low: "bg-zinc-100 text-zinc-700",
  medium: "bg-sky-50 text-sky-800",
  high: "bg-orange-50 text-orange-800",
  urgent: "bg-red-50 text-red-800",
};

export function StatusBadge({ status }: { status: TicketStatus }) {
  const label =
    status === "in_progress"
      ? "In progress"
      : status.charAt(0).toUpperCase() + status.slice(1);
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLASS[status]}`}
    >
      {label}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: TicketPriority }) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_CLASS[priority]}`}
    >
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </span>
  );
}

import type { DueFilter, Ticket } from "@/types";

/** Amber window: due later today through the next 48 hours. */
export const DUE_SOON_MS = 48 * 60 * 60 * 1000;

export type DueTone = "none" | "overdue" | "soon" | "neutral";

export function dueTone(dueAt: Date | null, now = Date.now()): DueTone {
  if (!dueAt || Number.isNaN(dueAt.getTime())) {
    return "none";
  }
  const delta = dueAt.getTime() - now;
  if (delta < 0) {
    return "overdue";
  }
  if (delta <= DUE_SOON_MS) {
    return "soon";
  }
  return "neutral";
}

export function dueToneLabel(tone: DueTone): string | null {
  switch (tone) {
    case "overdue":
      return "Überfällig";
    case "soon":
      return "Fällig innerhalb von 48 Stunden";
    case "neutral":
      return "Fällig";
    default:
      return null;
  }
}

/** Store a calendar date as the local end of that day so it stays due all day. */
export function dateInputToDueAt(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return null;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day, 23, 59, 59, 999);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}

export function dueAtToDateInput(dueAt: Date | null): string {
  if (!dueAt || Number.isNaN(dueAt.getTime())) {
    return "";
  }
  const year = dueAt.getFullYear();
  const month = String(dueAt.getMonth() + 1).padStart(2, "0");
  const day = String(dueAt.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatDueDate(dueAt: Date | null): string {
  if (!dueAt || Number.isNaN(dueAt.getTime())) {
    return "—";
  }
  return new Intl.DateTimeFormat("de-CH", { dateStyle: "medium" }).format(dueAt);
}

export function matchesDueFilter(
  ticket: Pick<Ticket, "dueAt">,
  due?: DueFilter,
  now = Date.now(),
): boolean {
  if (!due || due === "all") {
    return true;
  }
  if (!ticket.dueAt) {
    return false;
  }
  if (due === "has_due") {
    return true;
  }
  return dueTone(ticket.dueAt, now) === "overdue";
}

/**
 * Meine Tickets: assignee must equal the signed-in uid.
 * Pass null when nobody is signed in — that matches nothing, and never a uid from the URL.
 */
export function matchesMine(
  ticket: Pick<Ticket, "assigneeId">,
  mine: boolean | undefined,
  sessionUid: string | null,
): boolean {
  if (!mine) {
    return true;
  }
  if (!sessionUid) {
    return false;
  }
  return ticket.assigneeId === sessionUid;
}

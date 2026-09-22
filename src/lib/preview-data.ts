import type { Comment, Member, Ticket } from "@/types";

/** Sample directory so preview detail can show a name instead of an id. */
export const PREVIEW_MEMBERS: Member[] = [
  {
    id: "preview-user",
    email: "preview@example.com",
    displayName: "Preview",
    role: "agent",
  },
];

/** UTC end-of-day offset so preview due colors stay stable across server and client. */
function previewDueAt(offsetDays: number): Date {
  const now = new Date();
  return new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + offsetDays,
      23,
      59,
      59,
      999,
    ),
  );
}

/** Static sample used by `/tickets/preview` when Firebase is not configured. */
export const PREVIEW_TICKET: Ticket = {
  id: "preview",
  title: "Printer in the newsroom is jammed",
  description:
    "The HP on the 2nd floor keeps jamming on duplex jobs. Happened three times this morning.",
  status: "open",
  priority: "high",
  assigneeId: null,
  dueAt: previewDueAt(-1),
  createdBy: "preview-user",
  createdAt: new Date("2026-09-20T09:00:00.000Z"),
  updatedAt: new Date("2026-09-21T08:30:00.000Z"),
};

export const PREVIEW_TICKET_DONE: Ticket = {
  id: "preview-done",
  title: "Press badges printed for Monday",
  description: "All visitor badges for the Monday briefing are ready.",
  status: "done",
  priority: "medium",
  assigneeId: null,
  dueAt: previewDueAt(1),
  createdBy: "preview-user",
  createdAt: new Date("2026-09-19T11:00:00.000Z"),
  updatedAt: new Date("2026-09-21T07:10:00.000Z"),
};

export const PREVIEW_TICKET_CLOSED: Ticket = {
  id: "preview-closed",
  title: "Old CMS login reset",
  description: "No longer needed after the CMS cutover. Kept for the audit trail.",
  status: "closed",
  priority: "low",
  assigneeId: null,
  dueAt: previewDueAt(14),
  createdBy: "preview-user",
  createdAt: new Date("2026-09-18T14:00:00.000Z"),
  updatedAt: new Date("2026-09-20T16:45:00.000Z"),
};

/** Inbox preview rows — includes both `done` and `closed` so those badges stay visible. */
export const PREVIEW_TICKETS: Ticket[] = [
  PREVIEW_TICKET,
  PREVIEW_TICKET_DONE,
  PREVIEW_TICKET_CLOSED,
];

export function previewTicketById(id: string): Ticket | undefined {
  return PREVIEW_TICKETS.find((ticket) => ticket.id === id);
}

/** Empty in preview so the detail empty-state CTA is visible. */
export const PREVIEW_COMMENTS: Comment[] = [];

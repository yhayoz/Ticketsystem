import type { Comment, Ticket } from "@/types";

/** Static sample used by `/tickets/preview` when Firebase is not configured. */
export const PREVIEW_TICKET: Ticket = {
  id: "preview",
  title: "Printer in the newsroom is jammed",
  description:
    "The HP on the 2nd floor keeps jamming on duplex jobs. Happened three times this morning.",
  status: "open",
  priority: "high",
  assigneeId: null,
  createdBy: "preview-user",
  createdAt: new Date("2026-09-20T09:00:00.000Z"),
  updatedAt: new Date("2026-09-21T08:30:00.000Z"),
};

export const PREVIEW_COMMENTS: Comment[] = [
  {
    id: "c1",
    ticketId: "preview",
    body: "I will check after the morning conference.",
    authorId: "preview-agent",
    createdAt: new Date("2026-09-21T07:15:00.000Z"),
  },
];

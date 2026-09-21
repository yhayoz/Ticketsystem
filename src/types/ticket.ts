export const TICKET_STATUSES = [
  "open",
  "in_progress",
  "done",
  "closed",
] as const;

export type TicketStatus = (typeof TICKET_STATUSES)[number];

export const TICKET_PRIORITIES = [
  "low",
  "medium",
  "high",
  "urgent",
] as const;

export type TicketPriority = (typeof TICKET_PRIORITIES)[number];

export type Ticket = {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  assigneeId: string | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
};

export type TicketDraft = {
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  assigneeId: string | null;
};

export type TicketUpdates = Partial<
  Pick<Ticket, "title" | "description" | "status" | "priority" | "assigneeId">
>;

export type TicketFilters = {
  status?: TicketStatus | "all";
  assigneeId?: string | "all" | "unassigned";
  /** Client-side title search; not sent to Firestore. */
  title?: string;
};

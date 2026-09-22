/** Stored values allowed by Firestore rules. UI must list both `done` and `closed`. */
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
  /** Calendar due date stored as a Firestore timestamp, or null when unset. */
  dueAt: Date | null;
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
  dueAt: Date | null;
};

export type TicketUpdates = Partial<
  Pick<
    Ticket,
    "title" | "description" | "status" | "priority" | "assigneeId" | "dueAt"
  >
>;

/** Inbox due-date filter. Applied on the loaded list, not as a Firestore query. */
export const DUE_FILTERS = ["all", "overdue", "has_due"] as const;

export type DueFilter = (typeof DUE_FILTERS)[number];

export type TicketFilters = {
  status?: TicketStatus | "all";
  assigneeId?: string | "all" | "unassigned";
  /** Client-side title search; not sent to Firestore. */
  title?: string;
  /** Client-side: overdue, or any ticket that has a due date. */
  due?: DueFilter;
  /**
   * When true, keep tickets whose assigneeId equals the signed-in uid.
   * The page reads that uid from the auth session. This flag is not a uid
   * and must not be filled from the URL.
   */
  mine?: boolean;
};

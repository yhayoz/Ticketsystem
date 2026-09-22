import { Timestamp, type DocumentData, type DocumentSnapshot } from "firebase/firestore";
import {
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  type Ticket,
  type TicketPriority,
  type TicketStatus,
} from "@/types";

export const TICKETS_COLLECTION = "tickets";
export const COMMENTS_SUBCOLLECTION = "comments";
export const MEMBERS_COLLECTION = "members";

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asEnum<T extends string>(
  value: unknown,
  allowed: readonly T[],
  fallback: T,
): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

export function asDate(value: unknown): Date {
  if (value instanceof Timestamp) {
    return value.toDate();
  }
  if (value instanceof Date) {
    return value;
  }
  return new Date(0);
}

/** Missing, null, or non-timestamp values become null (legacy tickets have no dueAt). */
export function asDateOrNull(value: unknown): Date | null {
  if (value == null) {
    return null;
  }
  if (value instanceof Timestamp) {
    return value.toDate();
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }
  return null;
}

export function mapTicket(snapshot: DocumentSnapshot<DocumentData>): Ticket {
  const data = snapshot.data() ?? {};
  const assigneeId = data.assigneeId;

  return {
    id: snapshot.id,
    title: asString(data.title),
    description: asString(data.description),
    status: asEnum<TicketStatus>(data.status, TICKET_STATUSES, "open"),
    priority: asEnum<TicketPriority>(data.priority, TICKET_PRIORITIES, "medium"),
    assigneeId: typeof assigneeId === "string" ? assigneeId : null,
    dueAt: asDateOrNull(data.dueAt),
    createdBy: asString(data.createdBy),
    createdAt: asDate(data.createdAt),
    updatedAt: asDate(data.updatedAt),
  };
}

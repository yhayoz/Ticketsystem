import {
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type QueryConstraint,
} from "firebase/firestore";
import { getClientDb } from "@/lib/firebase/client";
import { TICKETS_COLLECTION, mapTicket } from "@/lib/firestore-map";
import type { Ticket, TicketDraft, TicketFilters, TicketUpdates } from "@/types";

function ticketFiltersToConstraints(filters: TicketFilters = {}): QueryConstraint[] {
  const constraints: QueryConstraint[] = [];

  if (filters.status && filters.status !== "all") {
    constraints.push(where("status", "==", filters.status));
  }

  if (filters.assigneeId && filters.assigneeId !== "all") {
    constraints.push(
      where(
        "assigneeId",
        "==",
        filters.assigneeId === "unassigned" ? null : filters.assigneeId,
      ),
    );
  }

  constraints.push(orderBy("updatedAt", "desc"));
  return constraints;
}

function dueAtToFirestore(dueAt: Date | null): Timestamp | null {
  if (!dueAt || Number.isNaN(dueAt.getTime())) {
    return null;
  }
  return Timestamp.fromDate(dueAt);
}

export function matchesTitleQuery(ticket: Ticket, titleQuery?: string): boolean {
  const needle = titleQuery?.trim().toLowerCase();
  if (!needle) {
    return true;
  }
  return ticket.title.toLowerCase().includes(needle);
}

export async function listTickets(filters: TicketFilters = {}): Promise<Ticket[]> {
  const db = getClientDb();
  const ticketsRef = collection(db, TICKETS_COLLECTION);
  const snapshot = await getDocs(query(ticketsRef, ...ticketFiltersToConstraints(filters)));
  return snapshot.docs.map(mapTicket);
}

export async function getTicket(ticketId: string): Promise<Ticket | null> {
  const db = getClientDb();
  const snapshot = await getDoc(doc(db, TICKETS_COLLECTION, ticketId));
  if (!snapshot.exists()) {
    return null;
  }
  return mapTicket(snapshot);
}

export async function createTicket(
  draft: TicketDraft,
  createdBy: string,
): Promise<string> {
  const db = getClientDb();
  const now = serverTimestamp();
  const ref = await addDoc(collection(db, TICKETS_COLLECTION), {
    title: draft.title.trim(),
    description: draft.description.trim(),
    status: draft.status,
    priority: draft.priority,
    assigneeId: draft.assigneeId,
    dueAt: dueAtToFirestore(draft.dueAt),
    createdBy,
    createdAt: now,
    updatedAt: now,
  });
  return ref.id;
}

export async function updateTicket(
  ticketId: string,
  updates: TicketUpdates,
): Promise<void> {
  const db = getClientDb();
  const payload: Record<string, unknown> = { updatedAt: serverTimestamp() };

  if (updates.title !== undefined) {
    payload.title = updates.title.trim();
  }
  if (updates.description !== undefined) {
    payload.description = updates.description.trim();
  }
  if (updates.status !== undefined) {
    payload.status = updates.status;
  }
  if (updates.priority !== undefined) {
    payload.priority = updates.priority;
  }
  if (updates.assigneeId !== undefined) {
    payload.assigneeId = updates.assigneeId;
  }
  if (updates.dueAt !== undefined) {
    payload.dueAt = dueAtToFirestore(updates.dueAt);
  }

  await updateDoc(doc(db, TICKETS_COLLECTION, ticketId), payload);
}

export async function deleteTicket(ticketId: string): Promise<void> {
  const db = getClientDb();
  await deleteDoc(doc(db, TICKETS_COLLECTION, ticketId));
}

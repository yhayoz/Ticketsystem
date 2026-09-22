import {
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
import { getClientAuth, getClientDb } from "@/lib/firebase/client";
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

/**
 * Creates a ticket. When `assignToSelf` is set, `assigneeId` is the signed-in
 * uid from the auth session. A draft or form uid is ignored on that path.
 */
export async function createTicket(
  draft: TicketDraft,
  createdBy: string,
  options: { assignToSelf?: boolean } = {},
): Promise<string> {
  const sessionUid = getClientAuth().currentUser?.uid ?? null;
  let assigneeId = draft.assigneeId;

  if (options.assignToSelf) {
    if (!sessionUid) {
      throw new Error("Sign in to assign this ticket to yourself.");
    }
    assigneeId = sessionUid;
  }

  const db = getClientDb();
  const now = serverTimestamp();
  const ref = await addDoc(collection(db, TICKETS_COLLECTION), {
    title: draft.title.trim(),
    description: draft.description.trim(),
    status: draft.status,
    priority: draft.priority,
    assigneeId,
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

  await updateDoc(doc(db, TICKETS_COLLECTION, ticketId), payload);
}

/**
 * Assigns the ticket to the signed-in user.
 * The uid is read from the auth session and cannot be passed in.
 */
export async function assignTicketToSelf(ticketId: string): Promise<void> {
  const uid = getClientAuth().currentUser?.uid;
  if (!uid) {
    throw new Error("Sign in to assign this ticket to yourself.");
  }

  const db = getClientDb();
  await updateDoc(doc(db, TICKETS_COLLECTION, ticketId), {
    assigneeId: uid,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteTicket(ticketId: string): Promise<void> {
  const db = getClientDb();
  await deleteDoc(doc(db, TICKETS_COLLECTION, ticketId));
}

import {
  addDoc,
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { getClientDb } from "@/lib/firebase/client";
import {
  COMMENTS_SUBCOLLECTION,
  TICKETS_COLLECTION,
  asDate,
} from "@/lib/firestore-map";
import type { Comment } from "@/types";

export async function listComments(ticketId: string): Promise<Comment[]> {
  const db = getClientDb();
  const commentsRef = collection(
    db,
    TICKETS_COLLECTION,
    ticketId,
    COMMENTS_SUBCOLLECTION,
  );
  const snapshot = await getDocs(query(commentsRef, orderBy("createdAt", "asc")));

  return snapshot.docs.map((commentDoc) => {
    const data = commentDoc.data();
    return {
      id: commentDoc.id,
      ticketId,
      body: typeof data.body === "string" ? data.body : "",
      authorId: typeof data.authorId === "string" ? data.authorId : "",
      createdAt: asDate(data.createdAt),
    };
  });
}

export async function addComment(
  ticketId: string,
  body: string,
  authorId: string,
): Promise<string> {
  const db = getClientDb();
  const commentsRef = collection(
    db,
    TICKETS_COLLECTION,
    ticketId,
    COMMENTS_SUBCOLLECTION,
  );
  const now = serverTimestamp();
  const ref = await addDoc(commentsRef, {
    body: body.trim(),
    authorId,
    createdAt: now,
  });

  await updateDoc(doc(db, TICKETS_COLLECTION, ticketId), {
    updatedAt: now,
  });

  return ref.id;
}

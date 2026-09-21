import { collection, getDocs } from "firebase/firestore";
import { getClientDb } from "@/lib/firebase/client";
import { MEMBERS_COLLECTION } from "@/lib/firestore-map";
import { parseUserRole } from "@/lib/roles";
import type { Member } from "@/types";

export async function listMembers(): Promise<Member[]> {
  const db = getClientDb();
  const snapshot = await getDocs(collection(db, MEMBERS_COLLECTION));

  const members = snapshot.docs.map((memberDoc) => {
    const data = memberDoc.data();
    return {
      id: memberDoc.id,
      email: typeof data.email === "string" ? data.email : "",
      displayName:
        typeof data.displayName === "string" && data.displayName
          ? data.displayName
          : typeof data.email === "string"
            ? data.email
            : memberDoc.id,
      role: parseUserRole(data.role) ?? "viewer",
    };
  });

  return members.sort((a, b) => a.displayName.localeCompare(b.displayName));
}

export function listAssignableMembers(members: Member[]): Member[] {
  return members.filter((member) => member.role === "admin" || member.role === "agent");
}

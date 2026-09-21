import type { UserRole } from "@/types";

export function parseUserRole(value: unknown): UserRole | null {
  if (value === "admin" || value === "agent" || value === "viewer") {
    return value;
  }
  return null;
}

/** viewer = read-only; agent = edit + assign; admin = all. */
export function canWriteTickets(role: UserRole | null): boolean {
  return role === "admin" || role === "agent";
}

export function canAssignTickets(role: UserRole | null): boolean {
  return canWriteTickets(role);
}

export function canDeleteTickets(role: UserRole | null): boolean {
  return role === "admin";
}

export function canModerateComments(role: UserRole | null): boolean {
  return role === "admin";
}

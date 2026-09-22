import type { Member } from "@/types";

export function formatDateTime(value: Date): string {
  if (!value || value.getTime() === 0) {
    return "—";
  }
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export function formatRelativeTime(value: Date): string {
  if (!value || value.getTime() === 0) {
    return "—";
  }

  const diffMs = value.getTime() - Date.now();
  const absMs = Math.abs(diffMs);
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });

  if (absMs < 45_000) {
    return rtf.format(0, "second");
  }
  if (absMs < 90 * 60_000) {
    return rtf.format(Math.round(diffMs / 60_000), "minute");
  }
  if (absMs < 36 * 60 * 60_000) {
    return rtf.format(Math.round(diffMs / 3_600_000), "hour");
  }
  if (absMs < 10 * 86_400_000) {
    return rtf.format(Math.round(diffMs / 86_400_000), "day");
  }
  if (absMs < 40 * 86_400_000) {
    return rtf.format(Math.round(diffMs / (7 * 86_400_000)), "week");
  }
  return rtf.format(Math.round(diffMs / (30 * 86_400_000)), "month");
}

/** UI labels for every stored status — keep both `done` and `closed`. */
export function statusLabel(status: string): string {
  switch (status) {
    case "open":
      return "Offen";
    case "in_progress":
      return "In Arbeit";
    case "done":
      return "Erledigt";
    case "closed":
      return "Geschlossen";
    default:
      return status;
  }
}

export function priorityLabel(priority: string): string {
  switch (priority) {
    case "low":
      return "Low";
    case "medium":
      return "Medium";
    case "high":
      return "High";
    case "urgent":
      return "Urgent";
    default:
      return priority;
  }
}

export function roleLabel(role: string | null): string {
  if (!role) {
    return "No role";
  }
  return role.charAt(0).toUpperCase() + role.slice(1);
}

function usableName(
  value: string | null | undefined,
  uid: string,
  email: string,
): string {
  const text = value?.trim() ?? "";
  if (!text || text === uid || text === email) {
    return "";
  }
  return text;
}

function firstText(...values: Array<string | null | undefined>): string {
  for (const value of values) {
    const text = value?.trim();
    if (text) {
      return text;
    }
  }
  return "";
}

/** Shorten a raw Firebase uid. Names and emails are shown in full. */
export function shortUid(uid: string): string {
  if (uid.length <= 12) {
    return uid;
  }
  return `${uid.slice(0, 8)}…`;
}

/**
 * Prefer a member display name, then the signed-in profile name,
 * then email, then a short uid.
 */
export function memberLabel(
  members: readonly Member[],
  uid: string,
  profile?: { displayName?: string | null; email?: string | null } | null,
): string {
  const member = members.find((entry) => entry.id === uid);
  const email = firstText(member?.email, profile?.email);
  const fromDirectory = usableName(member?.displayName, uid, email);
  if (fromDirectory) {
    return fromDirectory;
  }
  const fromProfile = usableName(profile?.displayName, uid, email);
  if (fromProfile) {
    return fromProfile;
  }
  if (email) {
    return email;
  }
  if (!uid) {
    return "—";
  }
  return shortUid(uid);
}

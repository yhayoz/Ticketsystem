export function formatDateTime(value: Date): string {
  if (!value || value.getTime() === 0) {
    return "—";
  }
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export function statusLabel(status: string): string {
  switch (status) {
    case "open":
      return "Open";
    case "in_progress":
      return "In progress";
    case "done":
      return "Done";
    case "closed":
      return "Closed";
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

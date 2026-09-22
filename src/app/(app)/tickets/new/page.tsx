"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { listAssignableMembers, listMembers } from "@/lib/members";
import { withPreviewRole } from "@/lib/preview-role";
import { canAssignTickets, canUseWriteChrome } from "@/lib/roles";
import { createTicket } from "@/lib/tickets";
import {
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  type Member,
  type TicketPriority,
  type TicketStatus,
} from "@/types";
import { dateInputToDueAt } from "@/lib/due";
import { priorityLabel, statusLabel } from "@/lib/format";

export default function NewTicketPage() {
  const router = useRouter();
  const { user, role, configured } = useAuth();
  const canWrite = canUseWriteChrome(role, configured);
  const canAssign = canWrite && (!configured || canAssignTickets(role));
  const [members, setMembers] = useState<Member[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TicketStatus>("open");
  const [priority, setPriority] = useState<TicketPriority>("medium");
  const [assigneeId, setAssigneeId] = useState("");
  const [assignToMe, setAssignToMe] = useState(false);
  const [dueOn, setDueOn] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!configured) {
      return;
    }
    void listMembers()
      .then((next) => setMembers(listAssignableMembers(next)))
      .catch(() => setMembers([]));
  }, [configured]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canWrite) {
      setError("Your role cannot create tickets.");
      return;
    }
    if (!configured || !user) {
      setError("Firebase is not configured. Add env vars to create tickets.");
      return;
    }

    const assignToSelf = assignToMe && canAssign;

    setSaving(true);
    setError(null);
    try {
      const id = await createTicket(
        {
          title,
          description,
          status,
          priority,
          assigneeId: assignToSelf ? null : assigneeId || null,
          dueAt: dateInputToDueAt(dueOn),
        },
        user.uid,
        { assignToSelf },
      );
      router.push(`/tickets/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create ticket.");
    } finally {
      setSaving(false);
    }
  }

  if (!canWrite) {
    return (
      <div className="mx-auto max-w-2xl space-y-3">
        <Link href={withPreviewRole("/inbox", role, configured)} className="text-sm text-[var(--muted)] hover:text-[var(--ink)]">
          ← Inbox
        </Link>
        <h1 className="text-xl font-semibold">Neues Ticket</h1>
        <p className="text-sm text-[var(--muted)]">
          Mit der Rolle Viewer können keine Tickets erstellt werden.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <Link href={withPreviewRole("/inbox", role, configured)} className="text-sm text-[var(--muted)] hover:text-[var(--ink)]">
          ← Inbox
        </Link>
        <h1 className="mt-2 text-xl font-semibold">Neues Ticket</h1>
        <p className="text-sm text-[var(--muted)]">
          Creates a document in the <code>tickets</code> collection.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4 rounded-lg border border-[var(--line)] bg-[var(--surface)] p-4">
        <label className="flex flex-col gap-1 text-xs text-[var(--muted)]">
          Title
          <input
            className="field"
            required
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            disabled={!canWrite || saving}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-[var(--muted)]">
          Description
          <textarea
            className="field min-h-32"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            disabled={!canWrite || saving}
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-xs text-[var(--muted)]">
            Status
            <select
              className="field"
              value={status}
              onChange={(event) => setStatus(event.target.value as TicketStatus)}
              disabled={!canWrite || saving}
            >
              {TICKET_STATUSES.map((value) => (
                <option key={value} value={value}>
                  {statusLabel(value)}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-[var(--muted)]">
            Priority
            <select
              className="field"
              value={priority}
              onChange={(event) =>
                setPriority(event.target.value as TicketPriority)
              }
              disabled={!canWrite || saving}
            >
              {TICKET_PRIORITIES.map((value) => (
                <option key={value} value={value}>
                  {priorityLabel(value)}
                </option>
              ))}
            </select>
          </label>
          <div className="flex min-w-0 flex-col gap-1.5">
            <label className="flex flex-col gap-1 text-xs text-[var(--muted)]">
              Assignee
              <select
                className="field"
                value={assignToMe ? "" : assigneeId}
                onChange={(event) => setAssigneeId(event.target.value)}
                disabled={!canWrite || saving || assignToMe}
              >
                <option value="">Unassigned</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.displayName}
                  </option>
                ))}
              </select>
            </label>
            {canAssign ? (
              <label className="flex w-fit items-center gap-2 text-sm text-[var(--ink)]">
                <input
                  type="checkbox"
                  className="size-4 accent-[var(--accent)]"
                  checked={assignToMe}
                  onChange={(event) => setAssignToMe(event.target.checked)}
                  disabled={saving}
                />
                Mir zuweisen
              </label>
            ) : null}
            {assignToMe ? (
              <p className="text-xs text-[var(--muted)]">Wird dir zugewiesen.</p>
            ) : null}
          </div>
          <div className="flex flex-col gap-1 text-xs text-[var(--muted)]">
            <label htmlFor="new-ticket-due-at">Fällig</label>
            <span className="flex items-center gap-2">
              <input
                id="new-ticket-due-at"
                type="date"
                className="field min-w-0 flex-1"
                value={dueOn}
                onChange={(event) => setDueOn(event.target.value)}
                disabled={!canWrite || saving}
              />
              <button
                type="button"
                className="shrink-0 font-medium text-[var(--muted)] hover:text-[var(--ink)] disabled:cursor-not-allowed disabled:opacity-40"
                disabled={!canWrite || saving || !dueOn}
                onClick={() => setDueOn("")}
              >
                Löschen
              </button>
            </span>
          </div>
        </div>
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        <button type="submit" className="btn-primary" disabled={!canWrite || saving}>
          {saving ? "Creating…" : "Neues Ticket"}
        </button>
      </form>
    </div>
  );
}

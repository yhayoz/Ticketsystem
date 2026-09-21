"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CommentThread } from "@/components/tickets/CommentThread";
import { useAuth } from "@/components/auth/AuthProvider";
import { addComment, listComments } from "@/lib/comments";
import { formatDateTime, priorityLabel, statusLabel } from "@/lib/format";
import { listAssignableMembers, listMembers } from "@/lib/members";
import { PREVIEW_COMMENTS, PREVIEW_TICKET } from "@/lib/preview-data";
import { canWriteTickets } from "@/lib/roles";
import { getTicket, updateTicket } from "@/lib/tickets";
import {
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  type Comment,
  type Member,
  type Ticket,
  type TicketPriority,
  type TicketStatus,
} from "@/types";

export default function TicketDetailPage() {
  const params = useParams<{ id: string }>();
  const ticketId = params.id;
  const router = useRouter();
  const { user, role, configured } = useAuth();
  const isPreview = ticketId === "preview" || !configured;
  const canWrite = !isPreview && canWriteTickets(role);

  const [ticket, setTicket] = useState<Ticket | null>(
    isPreview ? PREVIEW_TICKET : null,
  );
  const [comments, setComments] = useState<Comment[]>(
    isPreview ? PREVIEW_COMMENTS : [],
  );
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(!isPreview);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isPreview) {
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const [nextTicket, nextComments, nextMembers] = await Promise.all([
          getTicket(ticketId),
          listComments(ticketId),
          listMembers(),
        ]);
        if (cancelled) {
          return;
        }
        setTicket(nextTicket);
        setComments(nextComments);
        setMembers(listAssignableMembers(nextMembers));
        setError(null);
        setLoading(false);
      } catch (err) {
        if (cancelled) {
          return;
        }
        setError(err instanceof Error ? err.message : "Failed to load ticket.");
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isPreview, ticketId]);

  async function refresh() {
    const [nextTicket, nextComments, nextMembers] = await Promise.all([
      getTicket(ticketId),
      listComments(ticketId),
      listMembers(),
    ]);
    setTicket(nextTicket);
    setComments(nextComments);
    setMembers(listAssignableMembers(nextMembers));
  }

  async function patch(updates: Partial<Ticket>) {
    if (!ticket || !canWrite || !configured) {
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await updateTicket(ticket.id, {
        title: updates.title,
        description: updates.description,
        status: updates.status,
        priority: updates.priority,
        assigneeId: updates.assigneeId,
      });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update ticket.");
    } finally {
      setSaving(false);
    }
  }

  async function onComment(body: string) {
    if (!configured || !user) {
      throw new Error("Firebase is not configured.");
    }
    await addComment(ticketId, body, user.uid);
    await refresh();
  }

  if (loading) {
    return <p className="text-sm text-[var(--muted)]">Loading ticket…</p>;
  }

  if (!ticket) {
    return (
      <div className="space-y-3">
        <h1 className="text-xl font-semibold">Ticket not found</h1>
        <p className="text-sm text-[var(--muted)]">
          No document exists at <code>tickets/{ticketId}</code>.
        </p>
        <button type="button" className="btn-secondary" onClick={() => router.push("/inbox")}>
          Back to inbox
        </button>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_16rem]">
      <div className="space-y-5">
        {isPreview ? (
          <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
            Layout preview — this ticket is not stored in Firestore.
          </p>
        ) : null}
        <div className="space-y-3 rounded-lg border border-[var(--line)] bg-[var(--surface)] p-4">
          <label className="flex flex-col gap-1 text-xs text-[var(--muted)]">
            Title
            <input
              className="field text-base font-semibold text-[var(--ink)]"
              value={ticket.title}
              disabled={!canWrite || saving}
              onChange={(event) =>
                setTicket({ ...ticket, title: event.target.value })
              }
              onBlur={() => void patch({ title: ticket.title })}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-[var(--muted)]">
            Description
            <textarea
              className="field min-h-36"
              value={ticket.description}
              disabled={!canWrite || saving}
              onChange={(event) =>
                setTicket({ ...ticket, description: event.target.value })
              }
              onBlur={() => void patch({ description: ticket.description })}
            />
          </label>
          <p className="text-xs text-[var(--muted)]">
            Created by <span className="font-mono">{ticket.createdBy}</span> ·{" "}
            {formatDateTime(ticket.createdAt)}
          </p>
        </div>

        {error ? <p className="text-sm text-red-700">{error}</p> : null}

        <CommentThread
          comments={comments}
          canWrite={canWrite}
          disabled={saving || isPreview}
          onSubmit={onComment}
        />
      </div>

      <aside className="space-y-3 rounded-lg border border-[var(--line)] bg-[var(--surface)] p-4 h-fit">
        <h2 className="text-sm font-semibold">Properties</h2>
        <label className="flex flex-col gap-1 text-xs text-[var(--muted)]">
          Status
          <select
            className="field"
            value={ticket.status}
            disabled={!canWrite || saving}
            onChange={(event) => {
              const status = event.target.value as TicketStatus;
              setTicket({ ...ticket, status });
              void patch({ status });
            }}
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
            value={ticket.priority}
            disabled={!canWrite || saving}
            onChange={(event) => {
              const priority = event.target.value as TicketPriority;
              setTicket({ ...ticket, priority });
              void patch({ priority });
            }}
          >
            {TICKET_PRIORITIES.map((value) => (
              <option key={value} value={value}>
                {priorityLabel(value)}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-[var(--muted)]">
          Assignee
          <select
            className="field"
            value={ticket.assigneeId ?? ""}
            disabled={!canWrite || saving}
            onChange={(event) => {
              const assigneeId = event.target.value || null;
              setTicket({ ...ticket, assigneeId });
              void patch({ assigneeId });
            }}
          >
            <option value="">Unassigned</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.displayName}
              </option>
            ))}
          </select>
        </label>
        <p className="text-xs text-[var(--muted)]">
          Updated {formatDateTime(ticket.updatedAt)}
        </p>
        {!canWrite && !isPreview ? (
          <p className="text-xs text-[var(--muted)]">
            Your role is read-only on this ticket.
          </p>
        ) : null}
      </aside>
    </div>
  );
}

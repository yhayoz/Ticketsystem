"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { CommentThread } from "@/components/tickets/CommentThread";
import { useAuth } from "@/components/auth/AuthProvider";
import { addComment, listComments } from "@/lib/comments";
import { formatDateTime, priorityLabel, statusLabel } from "@/lib/format";
import { listAssignableMembers, listMembers } from "@/lib/members";
import { PREVIEW_COMMENTS, PREVIEW_TICKET } from "@/lib/preview-data";
import { canAssignTickets, canWriteTickets } from "@/lib/roles";
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
  const canEdit = !isPreview && canWriteTickets(role);
  const canAssign = !isPreview && canAssignTickets(role);

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
    if (!ticket || !configured) {
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
        <Link href="/inbox" className="text-sm text-[var(--muted)] hover:text-[var(--ink)]">
          ← Inbox
        </Link>
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
    <div className="space-y-5">
      <Link href="/inbox" className="inline-block text-sm text-[var(--muted)] hover:text-[var(--ink)]">
        ← Inbox
      </Link>

      {isPreview ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          Layout preview — this ticket is not stored in Firestore.
        </p>
      ) : null}

      <header className="space-y-4 rounded-lg border border-[var(--line)] bg-[var(--surface)] p-4">
        <input
          aria-label="Title"
          className="field w-full text-xl font-semibold"
          value={ticket.title}
          disabled={!canEdit || saving}
          onChange={(event) =>
            setTicket({ ...ticket, title: event.target.value })
          }
          onBlur={() => {
            if (canEdit) {
              void patch({ title: ticket.title });
            }
          }}
        />
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="flex flex-col gap-1 text-xs text-[var(--muted)]">
            Status
            <select
              className="field"
              value={ticket.status}
              disabled={!canEdit || saving}
              onChange={(event) => {
                const status = event.target.value as TicketStatus;
                setTicket({ ...ticket, status });
                if (canEdit) {
                  void patch({ status });
                }
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
              disabled={!canEdit || saving}
              onChange={(event) => {
                const priority = event.target.value as TicketPriority;
                setTicket({ ...ticket, priority });
                if (canEdit) {
                  void patch({ priority });
                }
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
              disabled={!canAssign || saving}
              onChange={(event) => {
                const assigneeId = event.target.value || null;
                setTicket({ ...ticket, assigneeId });
                if (canAssign) {
                  void patch({ assigneeId });
                }
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
        </div>
        <p className="text-xs text-[var(--muted)]">
          Created by <span className="font-mono">{ticket.createdBy}</span> ·{" "}
          {formatDateTime(ticket.createdAt)}
        </p>
      </header>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      <label className="flex flex-col gap-1 text-xs text-[var(--muted)]">
        Description
        <textarea
          className="field min-h-36 bg-[var(--surface)]"
          value={ticket.description}
          disabled={!canEdit || saving}
          onChange={(event) =>
            setTicket({ ...ticket, description: event.target.value })
          }
          onBlur={() => {
            if (canEdit) {
              void patch({ description: ticket.description });
            }
          }}
        />
      </label>

      {!canEdit && !isPreview ? (
        <p className="text-xs text-[var(--muted)]">
          Your role is read-only on this ticket.
        </p>
      ) : null}

      <CommentThread
        comments={comments}
        canWrite={canEdit}
        disabled={saving || isPreview}
        onSubmit={onComment}
      />
    </div>
  );
}

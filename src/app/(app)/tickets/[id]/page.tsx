"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { TicketBadges } from "@/components/tickets/Badges";
import { CommentThread } from "@/components/tickets/CommentThread";
import { useAuth } from "@/components/auth/AuthProvider";
import { addComment, listComments } from "@/lib/comments";
import { formatDateTime, priorityLabel, statusLabel } from "@/lib/format";
import { listAssignableMembers, listMembers } from "@/lib/members";
import { PREVIEW_COMMENTS, PREVIEW_TICKET, previewTicketById } from "@/lib/preview-data";
import { withPreviewRole } from "@/lib/preview-role";
import { canAssignTickets, canUseWriteChrome } from "@/lib/roles";
import { assignTicketToSelf, getTicket, updateTicket } from "@/lib/tickets";
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
  const matchedPreview = previewTicketById(ticketId);
  const isPreview =
    Boolean(matchedPreview) || ticketId === "preview" || !configured;
  const canEdit = canUseWriteChrome(role, configured);
  const canAssign = canEdit && (!configured || canAssignTickets(role));
  const selfUid = user?.uid ?? null;

  const [ticket, setTicket] = useState<Ticket | null>(
    isPreview ? (matchedPreview ?? PREVIEW_TICKET) : null,
  );
  const [comments, setComments] = useState<Comment[]>(
    isPreview ? PREVIEW_COMMENTS : [],
  );
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(!isPreview);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [assignNotice, setAssignNotice] = useState<string | null>(null);

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

  async function patch(updates: Partial<Ticket>): Promise<boolean> {
    if (!ticket || !configured) {
      return false;
    }
    setSaving(true);
    setError(null);
    setAssignNotice(null);
    try {
      await updateTicket(ticket.id, {
        title: updates.title,
        description: updates.description,
        status: updates.status,
        priority: updates.priority,
        assigneeId: updates.assigneeId,
      });
      await refresh();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update ticket.");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function assignToMe() {
    if (!ticket || !selfUid || !canAssign || !configured || saving) {
      return;
    }
    if (ticket.assigneeId === selfUid) {
      return;
    }

    const previousAssigneeId = ticket.assigneeId;
    setSaving(true);
    setError(null);
    setAssignNotice(null);
    setTicket({ ...ticket, assigneeId: selfUid });

    try {
      await assignTicketToSelf(ticket.id);
      await refresh();
      setAssignNotice("Dir zugewiesen.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update ticket.");
      setTicket((current) =>
        current ? { ...current, assigneeId: previousAssigneeId } : current,
      );
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
        <Link href={withPreviewRole("/inbox", role, configured)} className="text-sm text-[var(--muted)] hover:text-[var(--ink)]">
          ← Inbox
        </Link>
        <h1 className="text-xl font-semibold">Ticket not found</h1>
        <p className="text-sm text-[var(--muted)]">
          No document exists at <code>tickets/{ticketId}</code>.
        </p>
        <button type="button" className="btn-secondary" onClick={() => router.push(withPreviewRole("/inbox", role, configured))}>
          Back to inbox
        </button>
      </div>
    );
  }

  const assigneeName = ticket.assigneeId
    ? members.find((member) => member.id === ticket.assigneeId)?.displayName ??
      ticket.assigneeId
    : "Unassigned";

  return (
    <div>
      {isPreview ? (
        <p className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          Layout preview — this ticket is not stored in Firestore.
        </p>
      ) : null}

      <header className="sticky top-0 z-10 -mx-4 space-y-3 border-b border-[var(--line)] bg-[var(--bg)] px-4 py-4">
        <Link href={withPreviewRole("/inbox", role, configured)} className="inline-block text-sm text-[var(--muted)] hover:text-[var(--ink)]">
          ← Inbox
        </Link>

        {canEdit ? (
          <input
            aria-label="Title"
            className="field w-full text-xl font-semibold"
            value={ticket.title}
            disabled={saving}
            onChange={(event) =>
              setTicket({ ...ticket, title: event.target.value })
            }
            onBlur={() => {
              void patch({ title: ticket.title });
            }}
          />
        ) : (
          <h1 className="text-xl font-semibold">{ticket.title || "Untitled"}</h1>
        )}

        <TicketBadges status={ticket.status} priority={ticket.priority} />

        {canEdit ? (
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="flex flex-col gap-1 text-xs text-[var(--muted)]">
              Status
              <select
                className="field"
                value={ticket.status}
                disabled={saving}
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
                disabled={saving}
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
            <div className="flex flex-col gap-1">
              {canAssign && selfUid ? (
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={saving || ticket.assigneeId === selfUid}
                  onClick={() => {
                    void assignToMe();
                  }}
                >
                  Mir zuweisen
                </button>
              ) : null}
              {assignNotice ? (
                <p
                  className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs text-emerald-950"
                  role="status"
                >
                  {assignNotice}
                </p>
              ) : null}
              <label className="flex flex-col gap-1 text-xs text-[var(--muted)]">
                Assignee
                <select
                  className="field"
                  aria-label="Assignee"
                  value={ticket.assigneeId ?? ""}
                  disabled={!canAssign || saving}
                  onChange={(event) => {
                    const assigneeId = event.target.value || null;
                    setAssignNotice(null);
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
                  {selfUid &&
                  ticket.assigneeId === selfUid &&
                  !members.some((member) => member.id === selfUid) ? (
                    <option value={selfUid}>
                      {user?.displayName || user?.email || "Ich"}
                    </option>
                  ) : null}
                </select>
              </label>
            </div>
          </div>
        ) : (
          <p className="text-sm text-[var(--muted)]">Zuständig: {assigneeName}</p>
        )}

        <p className="text-xs text-[var(--muted)]">
          Created by <span className="font-mono">{ticket.createdBy}</span> ·{" "}
          {formatDateTime(ticket.createdAt)}
        </p>
      </header>

      {error ? <p className="mt-5 text-sm text-red-700">{error}</p> : null}

      <div className="mt-6 space-y-6">
        <section className="space-y-2 rounded-lg border border-[var(--line)] bg-[var(--surface)] p-4">
          <h2 className="text-sm font-semibold">Beschreibung</h2>
          {canEdit ? (
            <textarea
              aria-label="Description"
              className="field min-h-36 w-full"
              value={ticket.description}
              disabled={saving}
              onChange={(event) =>
                setTicket({ ...ticket, description: event.target.value })
              }
              onBlur={() => {
                void patch({ description: ticket.description });
              }}
            />
          ) : (
            <p className="whitespace-pre-wrap text-sm text-[var(--ink)]">
              {ticket.description || "Keine Beschreibung."}
            </p>
          )}
        </section>

        {!canEdit ? (
          <p className="text-xs text-[var(--muted)]">
            Deine Rolle ist schreibgeschützt.
          </p>
        ) : null}

        <CommentThread
          comments={comments}
          canWrite={canEdit}
          disabled={saving || isPreview}
          onSubmit={onComment}
        />
      </div>
    </div>
  );
}

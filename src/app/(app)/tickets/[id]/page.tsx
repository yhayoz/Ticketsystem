"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { DueBadge, TicketBadges } from "@/components/tickets/Badges";
import { CommentThread } from "@/components/tickets/CommentThread";
import { useAuth } from "@/components/auth/AuthProvider";
import { addComment, listComments } from "@/lib/comments";
import { dateInputToDueAt, dueAtToDateInput, dueTone, dueToneLabel } from "@/lib/due";
import { formatDateTime, memberLabel, priorityLabel, statusLabel } from "@/lib/format";
import { listAssignableMembers, listMembers } from "@/lib/members";
import {
  PREVIEW_COMMENTS,
  PREVIEW_MEMBERS,
  PREVIEW_TICKET,
  previewTicketById,
} from "@/lib/preview-data";
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
  const [members, setMembers] = useState<Member[]>(
    isPreview ? PREVIEW_MEMBERS : [],
  );
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
        setMembers(nextMembers);
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
    setMembers(nextMembers);
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
        dueAt: updates.dueAt,
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
    if (!ticket || !canAssign || saving) {
      return;
    }

    if (!configured) {
      if (ticket.assigneeId === "preview-user") {
        return;
      }
      setAssignNotice(null);
      setTicket({ ...ticket, assigneeId: "preview-user" });
      setAssignNotice("Dir zugewiesen.");
      return;
    }

    if (!selfUid || ticket.assigneeId === selfUid) {
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

  const assignableMembers = listAssignableMembers(members);
  const profileFor = (uid: string) =>
    user && user.uid === uid
      ? { displayName: user.displayName, email: user.email }
      : null;
  const assigneeName = ticket.assigneeId
    ? memberLabel(members, ticket.assigneeId, profileFor(ticket.assigneeId))
    : "Unassigned";
  const createdByLabel = memberLabel(
    members,
    ticket.createdBy,
    profileFor(ticket.createdBy),
  );
  const assignedToSelf = configured
    ? Boolean(selfUid) && ticket.assigneeId === selfUid
    : ticket.assigneeId === "preview-user";

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
          <div className="grid grid-cols-1 items-start gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
            <div className="flex min-w-0 flex-col gap-1.5">
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
                  {assignableMembers.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.displayName}
                    </option>
                  ))}
                  {selfUid &&
                  ticket.assigneeId === selfUid &&
                  !assignableMembers.some((member) => member.id === selfUid) ? (
                    <option value={selfUid}>
                      {user?.displayName || user?.email || "Ich"}
                    </option>
                  ) : null}
                </select>
              </label>
              {canAssign ? (
                <button
                  type="button"
                  className="btn-secondary btn-compact"
                  disabled={saving || (configured && !selfUid) || assignedToSelf}
                  onClick={() => {
                    void assignToMe();
                  }}
                >
                  Mir zuweisen
                </button>
              ) : null}
              {assignNotice ? (
                <p
                  className="w-fit rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs text-emerald-950"
                  role="status"
                >
                  {assignNotice}
                </p>
              ) : null}
            </div>
            <DueDateField
              dueAt={ticket.dueAt}
              disabled={saving}
              onChange={(dueAt) => {
                setTicket({ ...ticket, dueAt });
                void patch({ dueAt });
              }}
            />
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[var(--muted)]">
            <p>Zuständig: {assigneeName}</p>
            <p className="flex items-center gap-2">
              Fällig: <DueBadge dueAt={ticket.dueAt} />
            </p>
          </div>
        )}

        <p className="text-xs text-[var(--muted)]">
          Erstellt von {createdByLabel} · {formatDateTime(ticket.createdAt)}
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

function DueDateField({
  dueAt,
  disabled,
  onChange,
}: {
  dueAt: Date | null;
  disabled: boolean;
  onChange: (dueAt: Date | null) => void;
}) {
  const tone = dueTone(dueAt);
  const hint = dueToneLabel(tone);
  const toneClass =
    tone === "overdue"
      ? "field field-overdue"
      : tone === "soon"
        ? "field field-soon"
        : "field";

  return (
    <div className="flex flex-col gap-1 text-xs text-[var(--muted)]">
      <label htmlFor="ticket-due-at">Fällig</label>
      <span className="flex items-center gap-2">
        <input
          id="ticket-due-at"
          type="date"
          className={`${toneClass} min-w-0 flex-1`}
          value={dueAtToDateInput(dueAt)}
          disabled={disabled}
          onChange={(event) => onChange(dateInputToDueAt(event.target.value))}
        />
        <button
          type="button"
          className="shrink-0 font-medium text-[var(--muted)] hover:text-[var(--ink)] disabled:cursor-not-allowed disabled:opacity-40"
          disabled={disabled || !dueAt}
          onClick={() => onChange(null)}
        >
          Löschen
        </button>
      </span>
      {hint && tone !== "neutral" ? (
        <span className={tone === "overdue" ? "text-red-700" : "text-amber-800"}>
          {hint}
        </span>
      ) : null}
    </div>
  );
}

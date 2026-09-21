"use client";

import { useRef, useState } from "react";
import type { Comment } from "@/types";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatRelativeTime, formatDateTime } from "@/lib/format";

type CommentThreadProps = {
  comments: Comment[];
  canWrite: boolean;
  disabled?: boolean;
  onSubmit: (body: string) => Promise<void>;
};

export function CommentThread({
  comments,
  canWrite,
  disabled,
  onSubmit,
}: CommentThreadProps) {
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!body.trim() || disabled) {
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSubmit(body.trim());
      setBody("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add comment.");
    } finally {
      setSaving(false);
    }
  }

  function focusComposer() {
    composerRef.current?.focus();
    composerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  return (
    <section className="space-y-4">
      <h2 className="text-sm font-semibold">Kommentare</h2>
      {comments.length === 0 ? (
        <EmptyState
          message="Noch keine Kommentare."
          action={
            canWrite ? (
              <button type="button" className="btn-primary" onClick={focusComposer}>
                Ersten Kommentar schreiben
              </button>
            ) : null
          }
        />
      ) : (
        <ol className="space-y-3">
          {comments.map((comment) => (
            <li
              key={comment.id}
              className="rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2"
            >
              <div className="mb-1 flex items-center justify-between gap-2 text-xs text-[var(--muted)]">
                <span className="font-mono">{comment.authorId}</span>
                <time dateTime={comment.createdAt.toISOString()} title={formatDateTime(comment.createdAt)}>
                  {formatRelativeTime(comment.createdAt)}
                </time>
              </div>
              <p className="whitespace-pre-wrap text-sm">{comment.body}</p>
            </li>
          ))}
        </ol>
      )}
      {canWrite ? (
        <form onSubmit={handleSubmit} className="space-y-2">
          <label className="flex flex-col gap-1 text-xs text-[var(--muted)]">
            Kommentar
            <textarea
              id="comment-composer"
              ref={composerRef}
              className="field min-h-24"
              value={body}
              disabled={saving}
              onChange={(event) => setBody(event.target.value)}
              placeholder="Update schreiben…"
            />
          </label>
          {error ? <p className="text-sm text-red-700">{error}</p> : null}
          <button
            type="submit"
            className="btn-primary"
            disabled={disabled || saving || !body.trim()}
          >
            {saving ? "Wird gesendet…" : "Kommentar senden"}
          </button>
        </form>
      ) : (
        <p className="text-xs text-[var(--muted)]">
          Viewer können den Verlauf lesen, aber nicht kommentieren.
        </p>
      )}
    </section>
  );
}

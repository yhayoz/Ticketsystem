"use client";

import { useState } from "react";
import type { Comment } from "@/types";
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

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!body.trim()) {
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

  return (
    <section className="space-y-4">
      <h2 className="text-sm font-semibold">Comments</h2>
      {comments.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">No comments yet.</p>
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
            Add a comment
            <textarea
              className="field min-h-24"
              value={body}
              disabled={disabled || saving}
              onChange={(event) => setBody(event.target.value)}
              placeholder="Write an update…"
            />
          </label>
          {error ? <p className="text-sm text-red-700">{error}</p> : null}
          <button
            type="submit"
            className="btn-primary"
            disabled={disabled || saving || !body.trim()}
          >
            {saving ? "Posting…" : "Post comment"}
          </button>
        </form>
      ) : (
        <p className="text-xs text-[var(--muted)]">
          Viewers can read the thread but cannot comment.
        </p>
      )}
    </section>
  );
}

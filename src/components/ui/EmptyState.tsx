import type { ReactNode } from "react";

type EmptyStateProps = {
  message: string;
  action?: ReactNode;
};

export function EmptyState({ message, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-[var(--line)] bg-[var(--surface)] px-4 py-10 text-center">
      <p className="text-sm text-[var(--muted)]">{message}</p>
      {action}
    </div>
  );
}

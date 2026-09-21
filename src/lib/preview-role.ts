import type { UserRole } from "@/types";

/** Keep `?role=viewer` on preview links so chrome stays read-only. */
export function withPreviewRole(
  href: string,
  role: UserRole | null,
  configured: boolean,
): string {
  if (configured || role !== "viewer") {
    return href;
  }
  const [path, hash] = href.split("#");
  const next = path.includes("?") ? `${path}&role=viewer` : `${path}?role=viewer`;
  return hash ? `${next}#${hash}` : next;
}

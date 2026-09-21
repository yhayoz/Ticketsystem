import { SESSION_COOKIE } from "@/lib/session-cookie";

export { SESSION_COOKIE };

export function setSessionCookie(): void {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${SESSION_COOKIE}=1; Path=/; SameSite=Lax; Max-Age=2592000${secure}`;
}

export function clearSessionCookie(): void {
  document.cookie = `${SESSION_COOKIE}=; Path=/; SameSite=Lax; Max-Age=0`;
}

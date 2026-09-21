import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/session-cookie";

const PROTECTED_PREFIXES = ["/inbox", "/tickets"];

export function proxy(request: NextRequest) {
  const configured = Boolean(process.env.NEXT_PUBLIC_FIREBASE_API_KEY);
  if (!configured) {
    return NextResponse.next();
  }

  const signedIn = request.cookies.get(SESSION_COOKIE)?.value === "1";
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  const isLogin = pathname === "/login";

  if (isProtected && !signedIn) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (isLogin && signedIn) {
    const url = request.nextUrl.clone();
    url.pathname = "/inbox";
    url.searchParams.delete("next");
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/inbox", "/inbox/:path*", "/tickets/:path*"],
};

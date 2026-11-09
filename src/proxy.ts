import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/cms/session";

/**
 * Optimistic gate for /admin — keeps the editor shell from rendering for
 * visitors without a session. The real checks live in the admin page, every
 * Server Function and the upload route.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/admin/login") return NextResponse.next();

  const ok = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);
  if (!ok) return NextResponse.redirect(new URL("/admin/login", request.url));
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};

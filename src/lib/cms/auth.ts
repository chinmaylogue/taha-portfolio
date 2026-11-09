import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, SESSION_TTL_SECONDS, createSessionToken, safeEqual, verifySessionToken } from "./session";

export const isAdminConfigured = () => !!process.env.ADMIN_PASSWORD;

export async function isAuthenticated(): Promise<boolean> {
  const store = await cookies();
  return verifySessionToken(store.get(SESSION_COOKIE)?.value);
}

/** For pages: bounce to the login screen. */
export async function requireAdminPage() {
  if (!(await isAuthenticated())) redirect("/admin/login");
}

/** For Server Functions and Route Handlers: throw so nothing runs unauthenticated. */
export async function requireAdmin() {
  if (!(await isAuthenticated())) throw new Error("Unauthorized");
}

export function checkPassword(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  return !!expected && safeEqual(input, expected);
}

export async function startSession() {
  const store = await cookies();
  store.set(SESSION_COOKIE, await createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function endSession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

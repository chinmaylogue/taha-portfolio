/**
 * Stateless admin session: `<expiry>.<hmac>` signed with AUTH_SECRET (or the
 * admin password if no separate secret is set). Uses Web Crypto only, so it runs
 * in Proxy as well as in Server Functions and Route Handlers.
 */

export const SESSION_COOKIE = "cms_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

const enc = new TextEncoder();

function secret(): string | null {
  return process.env.AUTH_SECRET || process.env.ADMIN_PASSWORD || null;
}

async function hmac(value: string, key: string): Promise<string> {
  const k = await crypto.subtle.importKey("raw", enc.encode(key), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
  ]);
  const sig = await crypto.subtle.sign("HMAC", k, enc.encode(value));
  let bin = "";
  for (const byte of new Uint8Array(sig)) bin += String.fromCharCode(byte);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Length-independent string comparison to avoid leaking how much of a value matched. */
export function safeEqual(a: string, b: string): boolean {
  const ab = enc.encode(a);
  const bb = enc.encode(b);
  let diff = ab.length ^ bb.length;
  const n = Math.max(ab.length, bb.length);
  for (let i = 0; i < n; i++) diff |= (ab[i] ?? 0) ^ (bb[i] ?? 0);
  return diff === 0;
}

export async function createSessionToken(): Promise<string> {
  const key = secret();
  if (!key) throw new Error("ADMIN_PASSWORD is not set");
  const exp = String(Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS);
  return `${exp}.${await hmac(exp, key)}`;
}

export async function verifySessionToken(token: string | undefined | null): Promise<boolean> {
  const key = secret();
  if (!key || !token) return false;
  const [exp, sig] = token.split(".");
  if (!exp || !sig || !/^\d+$/.test(exp)) return false;
  if (Number(exp) < Date.now() / 1000) return false;
  return safeEqual(sig, await hmac(exp, key));
}

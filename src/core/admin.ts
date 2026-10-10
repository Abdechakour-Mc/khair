import { createHmac, timingSafeEqual } from "node:crypto";

export const ADMIN_COOKIE = "khair-admin";

/** Long enough that the Admin is not retyping a password on their phone. */
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/** Shipped in .env.example and docker-compose.yml, and never acceptable live. */
const PLACEHOLDER_PASSWORDS = new Set(["change-me", "changeme", "password", ""]);

function adminPassword(): string {
  return process.env.ADMIN_PASSWORD ?? "";
}

/**
 * The signing key is derived from the password unless one is set explicitly,
 * so changing the password signs every existing session out.
 */
function signingKey(): string {
  return process.env.ADMIN_SESSION_SECRET || `khair:${adminPassword()}`;
}

function sign(payload: string): string {
  return createHmac("sha256", signingKey()).update(payload).digest("base64url");
}

function constantTimeEquals(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) {
    // Compare anyway, so a wrong length is not faster than a wrong value.
    timingSafeEqual(left, left);
    return false;
  }
  return timingSafeEqual(left, right);
}

export type SignInResult = { ok: true; session: string } | { ok: false; reason: "wrong_password" | "not_configured" };

/**
 * Checks the one shared password. Refuses the placeholder outright outside
 * development: an app reachable by the congregation must not be guarded by
 * the value that shipped in the example config.
 */
export function signIn(given: string, now: number = Date.now()): SignInResult {
  const expected = adminPassword();

  if (PLACEHOLDER_PASSWORDS.has(expected.trim().toLowerCase())) {
    if (process.env.NODE_ENV === "production") {
      console.error(
        "ADMIN_PASSWORD is unset or still the placeholder. Set a real password before anyone can reach this app.",
      );
      return { ok: false, reason: "not_configured" };
    }
  }

  if (!expected || !constantTimeEquals(expected, given ?? "")) {
    return { ok: false, reason: "wrong_password" };
  }
  return { ok: true, session: mintSession(now) };
}

export function mintSession(now: number = Date.now()): string {
  const expiresAt = now + SESSION_TTL_MS;
  return `${expiresAt}.${sign(String(expiresAt))}`;
}

export function sessionIsValid(value: string | undefined, now: number = Date.now()): boolean {
  if (!value) return false;

  const separator = value.lastIndexOf(".");
  if (separator <= 0) return false;

  const expiresRaw = value.slice(0, separator);
  const mac = value.slice(separator + 1);

  const expiresAt = Number(expiresRaw);
  if (!Number.isFinite(expiresAt)) return false;
  if (!constantTimeEquals(sign(expiresRaw), mac)) return false;
  return expiresAt > now;
}

export const sessionMaxAgeSeconds = Math.floor(SESSION_TTL_MS / 1000);

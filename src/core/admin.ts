import { createHmac, timingSafeEqual } from "node:crypto";

export const ADMIN_COOKIE = "khair-admin";

/** Long enough that the Admin is not retyping a password on their phone. */
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/** Shipped in .env.example and docker-compose.yml, and never acceptable live. */
const PLACEHOLDER_PASSWORDS = new Set(["change-me", "changeme", "password", ""]);

function adminPassword(): string {
  return process.env.ADMIN_PASSWORD ?? "";
}

function isPlaceholder(value: string): boolean {
  return PLACEHOLDER_PASSWORDS.has(value.trim().toLowerCase());
}

/**
 * The signing key, or null when there is nothing safe to sign with.
 *
 * Derived from the password unless one is set explicitly, so changing the
 * password signs every existing session out.
 *
 * Returning null matters more than it looks. The key used to fall back to
 * `khair:${ADMIN_PASSWORD}` unconditionally, so with the placeholder that
 * ships in .env.example the key was the publicly known string
 * "khair:change-me" and anyone could forge an admin cookie. signIn refused
 * the placeholder in production, but session validation did not, which made
 * that refusal cosmetic. Minting and validating now refuse on the same terms
 * as signing in.
 */
function signingKey(): string | null {
  const explicit = (process.env.ADMIN_SESSION_SECRET ?? "").trim();
  if (explicit && !isPlaceholder(explicit)) return explicit;

  const password = adminPassword().trim();
  // No password at all is never signable, in any environment.
  if (!password) return null;
  // The shipped placeholder is signable in development only, so the app runs
  // locally, and never once this is reachable by the congregation.
  if (isPlaceholder(password) && process.env.NODE_ENV === "production") return null;

  return `khair:${password}`;
}

function sign(payload: string): string | null {
  const key = signingKey();
  if (key === null) return null;
  return createHmac("sha256", key).update(payload).digest("base64url");
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

  if (isPlaceholder(expected)) {
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

  const session = mintSession(now);
  if (session === null) return { ok: false, reason: "not_configured" };
  return { ok: true, session };
}

export function mintSession(now: number = Date.now()): string | null {
  const expiresAt = now + SESSION_TTL_MS;
  const mac = sign(String(expiresAt));
  return mac === null ? null : `${expiresAt}.${mac}`;
}

export function sessionIsValid(
  value: string | null | undefined,
  now: number = Date.now(),
): boolean {
  if (!value) return false;

  const separator = value.lastIndexOf(".");
  if (separator <= 0) return false;

  const expiresRaw = value.slice(0, separator);
  const mac = value.slice(separator + 1);

  const expiresAt = Number(expiresRaw);
  if (!Number.isFinite(expiresAt)) return false;

  const expectedMac = sign(expiresRaw);
  if (expectedMac === null) return false;
  if (!constantTimeEquals(expectedMac, mac)) return false;
  return expiresAt > now;
}

export const sessionMaxAgeSeconds = Math.floor(SESSION_TTL_MS / 1000);

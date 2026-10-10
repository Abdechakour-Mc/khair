import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mintSession, sessionIsValid, signIn } from "@/core/admin";

const REAL_PASSWORD = "a-real-password-for-the-mosque";

beforeEach(() => {
  // stubEnv rather than direct assignment: NODE_ENV is read-only in the
  // Node types, and vitest restores every stub for us.
  vi.stubEnv("ADMIN_PASSWORD", REAL_PASSWORD);
  vi.stubEnv("ADMIN_SESSION_SECRET", "");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("signing in with the one shared password", () => {
  it("accepts the password and hands back a usable session", () => {
    const result = signIn(REAL_PASSWORD);
    expect(result.ok).toBe(true);
    if (result.ok) expect(sessionIsValid(result.session)).toBe(true);
  });

  it("refuses a wrong password", () => {
    expect(signIn("not-it")).toMatchObject({ ok: false, reason: "wrong_password" });
  });

  it("refuses an empty password", () => {
    expect(signIn("")).toMatchObject({ ok: false, reason: "wrong_password" });
  });

  it("refuses a password that is merely a prefix of the real one", () => {
    expect(signIn(REAL_PASSWORD.slice(0, -1))).toMatchObject({ ok: false });
  });

  it("refuses everything when no password is configured", () => {
    vi.stubEnv("ADMIN_PASSWORD", "");
    expect(signIn("anything")).toMatchObject({ ok: false });
    expect(signIn("")).toMatchObject({ ok: false });
  });

  it("refuses the placeholder password in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ADMIN_PASSWORD", "change-me");
    expect(signIn("change-me")).toMatchObject({ ok: false, reason: "not_configured" });
  });

  it("still allows the placeholder in development, so the app runs locally", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("ADMIN_PASSWORD", "change-me");
    expect(signIn("change-me")).toMatchObject({ ok: true });
  });
});

describe("the admin session cookie", () => {
  it("rejects nothing at all", () => {
    expect(sessionIsValid(undefined)).toBe(false);
    expect(sessionIsValid("")).toBe(false);
  });

  it("rejects a session with no signature", () => {
    expect(sessionIsValid(String(Date.now() + 1000))).toBe(false);
  });

  it("rejects a tampered expiry", () => {
    const session = mintSession() ?? "";
    const [, mac] = session.split(".");
    const faked = `${Date.now() + 10 ** 10}.${mac}`;
    expect(sessionIsValid(faked)).toBe(false);
  });

  it("rejects a tampered signature", () => {
    const session = mintSession() ?? "";
    const [expires] = session.split(".");
    expect(sessionIsValid(`${expires}.not-a-real-signature`)).toBe(false);
  });

  it("rejects a session that has expired", () => {
    const longAgo = Date.now() - 400 * 24 * 60 * 60 * 1000;
    expect(sessionIsValid(mintSession(longAgo))).toBe(false);
  });

  it("signs the Admin out everywhere when the password changes", () => {
    const session = mintSession();
    expect(sessionIsValid(session)).toBe(true);

    vi.stubEnv("ADMIN_PASSWORD", "a-new-password-after-a-scare");
    expect(sessionIsValid(session)).toBe(false);
  });

  it("survives a password change when an explicit signing secret is set", () => {
    vi.stubEnv("ADMIN_SESSION_SECRET", "a-stable-signing-secret");
    const session = mintSession();
    vi.stubEnv("ADMIN_PASSWORD", "a-new-password");
    expect(sessionIsValid(session)).toBe(true);
  });
});

describe("a forged session cannot stand in for a password", () => {
  it("refuses every session when the placeholder is in use in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ADMIN_PASSWORD", "change-me");

    // The signing key used to fall back to `khair:${ADMIN_PASSWORD}`, so with
    // the placeholder that ships in .env.example it was the publicly known
    // string "khair:change-me" and an attacker could mint their own cookie.
    expect(mintSession()).toBeNull();
    expect(signIn("change-me")).toMatchObject({ ok: false, reason: "not_configured" });

    // A session minted while the password was real must not survive a
    // deployment that forgot to set one.
    vi.stubEnv("ADMIN_PASSWORD", REAL_PASSWORD);
    const real = mintSession();
    expect(real).not.toBeNull();
    vi.stubEnv("ADMIN_PASSWORD", "change-me");
    expect(sessionIsValid(real)).toBe(false);
  });

  it("refuses every session when no password is configured at all, in any environment", () => {
    vi.stubEnv("ADMIN_PASSWORD", "");
    expect(mintSession()).toBeNull();
    expect(sessionIsValid("1799999999999.anything")).toBe(false);
  });

  it("refuses a placeholder signing secret as readily as a placeholder password", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ADMIN_SESSION_SECRET", "change-me");
    vi.stubEnv("ADMIN_PASSWORD", "change-me");
    expect(mintSession()).toBeNull();
  });

  it("still issues sessions in development so the app runs locally", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("ADMIN_PASSWORD", "change-me");
    const session = mintSession();
    expect(session).not.toBeNull();
    expect(sessionIsValid(session)).toBe(true);
  });
});

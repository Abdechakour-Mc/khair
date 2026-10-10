import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mintSession, sessionIsValid, signIn } from "@/core/admin";

const REAL_PASSWORD = "a-real-password-for-the-mosque";
let savedPassword: string | undefined;
let savedEnv: string | undefined;

beforeEach(() => {
  savedPassword = process.env.ADMIN_PASSWORD;
  savedEnv = process.env.NODE_ENV;
  process.env.ADMIN_PASSWORD = REAL_PASSWORD;
  delete process.env.ADMIN_SESSION_SECRET;
});

afterEach(() => {
  if (savedPassword === undefined) delete process.env.ADMIN_PASSWORD;
  else process.env.ADMIN_PASSWORD = savedPassword;
  if (savedEnv !== undefined) process.env.NODE_ENV = savedEnv;
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
    delete process.env.ADMIN_PASSWORD;
    expect(signIn("anything")).toMatchObject({ ok: false });
    expect(signIn("")).toMatchObject({ ok: false });
  });

  it("refuses the placeholder password in production", () => {
    process.env.NODE_ENV = "production";
    process.env.ADMIN_PASSWORD = "change-me";
    expect(signIn("change-me")).toMatchObject({ ok: false, reason: "not_configured" });
  });

  it("still allows the placeholder in development, so the app runs locally", () => {
    process.env.NODE_ENV = "development";
    process.env.ADMIN_PASSWORD = "change-me";
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
    const session = mintSession();
    const [, mac] = session.split(".");
    const faked = `${Date.now() + 10 ** 10}.${mac}`;
    expect(sessionIsValid(faked)).toBe(false);
  });

  it("rejects a tampered signature", () => {
    const session = mintSession();
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

    process.env.ADMIN_PASSWORD = "a-new-password-after-a-scare";
    expect(sessionIsValid(session)).toBe(false);
  });

  it("survives a password change when an explicit signing secret is set", () => {
    process.env.ADMIN_SESSION_SECRET = "a-stable-signing-secret";
    const session = mintSession();
    process.env.ADMIN_PASSWORD = "a-new-password";
    expect(sessionIsValid(session)).toBe(true);
  });
});

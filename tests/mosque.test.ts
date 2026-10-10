import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mosqueIdentity } from "@/config/mosque";

const KEYS = ["MOSQUE_NAME", "MOSQUE_NAME_AR", "MOSQUE_NAME_FR", "MOSQUE_LOGO"] as const;
const saved: Record<string, string | undefined> = {};

beforeEach(() => {
  for (const key of KEYS) {
    saved[key] = process.env[key];
    delete process.env[key];
  }
});

afterEach(() => {
  for (const key of KEYS) {
    if (saved[key] === undefined) delete process.env[key];
    else process.env[key] = saved[key];
  }
});

describe("which mosque this deployment belongs to", () => {
  it("is empty when nothing is configured, so the pages show the wordmark alone", () => {
    expect(mosqueIdentity("en")).toEqual({ name: "", logoUrl: "" });
  });

  it("uses the configured name in every language by default", () => {
    process.env.MOSQUE_NAME = "Al-Madinah Center";
    expect(mosqueIdentity("en").name).toBe("Al-Madinah Center");
    expect(mosqueIdentity("ar").name).toBe("Al-Madinah Center");
    expect(mosqueIdentity("fr").name).toBe("Al-Madinah Center");
  });

  it("prefers a localised name where one is configured", () => {
    process.env.MOSQUE_NAME = "Al-Madinah Center";
    process.env.MOSQUE_NAME_AR = "مركز المدينة";
    process.env.MOSQUE_NAME_FR = "Centre Al-Madinah";
    expect(mosqueIdentity("ar").name).toBe("مركز المدينة");
    expect(mosqueIdentity("fr").name).toBe("Centre Al-Madinah");
    expect(mosqueIdentity("en").name).toBe("Al-Madinah Center");
  });

  it("falls back for a language whose name is not configured", () => {
    process.env.MOSQUE_NAME = "Al-Madinah Center";
    process.env.MOSQUE_NAME_FR = "Centre Al-Madinah";
    expect(mosqueIdentity("ar").name).toBe("Al-Madinah Center");
  });

  it("ignores a name that is only whitespace", () => {
    process.env.MOSQUE_NAME = "Al-Madinah Center";
    process.env.MOSQUE_NAME_AR = "   ";
    expect(mosqueIdentity("ar").name).toBe("Al-Madinah Center");
  });

  it("carries a logo path when one is given", () => {
    process.env.MOSQUE_LOGO = "/mosque-logo.png";
    expect(mosqueIdentity("en").logoUrl).toBe("/mosque-logo.png");
  });
});

import { describe, expect, it } from "vitest";
import { formatWallTimeInZone, parseWallTimeInZone, zoneOffsetMs } from "@/core/time";

const MONTREAL = "America/Toronto";

describe("reading a wall time as an instant in the mosque's timezone", () => {
  it("reads a winter time against standard time", () => {
    // Montreal is UTC-5 in January.
    const instant = parseWallTimeInZone("2026-01-15T09:00", MONTREAL);
    expect(instant?.toISOString()).toBe("2026-01-15T14:00:00.000Z");
  });

  it("reads a summer time against daylight time", () => {
    // Montreal is UTC-4 in July, so the same wall time is a different instant.
    const instant = parseWallTimeInZone("2026-07-15T09:00", MONTREAL);
    expect(instant?.toISOString()).toBe("2026-07-15T13:00:00.000Z");
  });

  it("does not drift across the spring daylight-saving change", () => {
    const before = parseWallTimeInZone("2026-03-07T12:00", MONTREAL);
    const after = parseWallTimeInZone("2026-03-09T12:00", MONTREAL);
    expect(before?.toISOString()).toBe("2026-03-07T17:00:00.000Z");
    expect(after?.toISOString()).toBe("2026-03-09T16:00:00.000Z");
  });

  it("reads the same wall time differently in a different timezone", () => {
    const montreal = parseWallTimeInZone("2026-01-15T09:00", MONTREAL);
    const utc = parseWallTimeInZone("2026-01-15T09:00", "UTC");
    expect(montreal?.toISOString()).toBe("2026-01-15T14:00:00.000Z");
    expect(utc?.toISOString()).toBe("2026-01-15T09:00:00.000Z");
  });

  it("refuses anything that is not a wall time", () => {
    expect(parseWallTimeInZone("", MONTREAL)).toBeNull();
    expect(parseWallTimeInZone("tomorrow", MONTREAL)).toBeNull();
    expect(parseWallTimeInZone("2026-10-17", MONTREAL)).toBeNull();
    expect(parseWallTimeInZone("2026-10-17T18:30:00Z", MONTREAL)).toBeNull();
  });

  it("tolerates surrounding whitespace from a pasted value", () => {
    expect(parseWallTimeInZone("  2026-01-15T09:00  ", MONTREAL)?.toISOString()).toBe(
      "2026-01-15T14:00:00.000Z",
    );
  });
});

describe("writing an instant back as a wall time", () => {
  it("round-trips a winter time", () => {
    const wall = "2026-01-15T09:00";
    const instant = parseWallTimeInZone(wall, MONTREAL);
    expect(instant).not.toBeNull();
    expect(formatWallTimeInZone(instant as Date, MONTREAL)).toBe(wall);
  });

  it("round-trips a summer time", () => {
    const wall = "2026-07-15T21:45";
    const instant = parseWallTimeInZone(wall, MONTREAL);
    expect(formatWallTimeInZone(instant as Date, MONTREAL)).toBe(wall);
  });

  it("renders midnight as 00:00 rather than 24:00", () => {
    const instant = parseWallTimeInZone("2026-02-01T00:00", MONTREAL);
    expect(formatWallTimeInZone(instant as Date, MONTREAL)).toBe("2026-02-01T00:00");
  });
});

describe("the zone offset itself", () => {
  it("is five hours behind UTC in Montreal in January", () => {
    const offset = zoneOffsetMs(new Date("2026-01-15T14:00:00Z"), MONTREAL);
    expect(offset / (60 * 60 * 1000)).toBe(-5);
  });

  it("is four hours behind UTC in Montreal in July", () => {
    const offset = zoneOffsetMs(new Date("2026-07-15T13:00:00Z"), MONTREAL);
    expect(offset / (60 * 60 * 1000)).toBe(-4);
  });

  it("is zero for UTC", () => {
    expect(zoneOffsetMs(new Date("2026-07-15T13:00:00Z"), "UTC")).toBe(0);
  });
});

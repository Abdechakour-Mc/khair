import { describe, expect, it } from "vitest";
import type { OpenTask } from "@/core/tasks";
import { dayKey, groupIntoAgenda } from "@/view/agenda";

const MONTREAL = "America/Toronto";

function task(overrides: Partial<OpenTask> & { id: string }): OpenTask {
  const startsAt = overrides.startsAt ?? null;
  const dueBy = overrides.dueBy ?? new Date("2026-10-17T20:00:00Z");
  return {
    title: "Task",
    description: "",
    location: "",
    openTo: "anyone",
    slotsNeeded: 1,
    closed: false,
    createdAt: new Date("2026-10-01T00:00:00Z"),
    slotsTaken: 0,
    slotsRemaining: 1,
    isFull: false,
    ...overrides,
    id: overrides.id,
    startsAt,
    dueBy,
    isFlexible: startsAt === null,
  };
}

describe("grouping the public list into an agenda", () => {
  it("puts Tasks that share a day under one heading", async () => {
    const groups = groupIntoAgenda(
      [
        task({ id: "a", startsAt: new Date("2026-10-17T15:30:00Z") }),
        task({ id: "b", startsAt: new Date("2026-10-17T23:00:00Z") }),
      ],
      MONTREAL,
    );

    expect(groups).toHaveLength(1);
    expect(groups[0]?.kind).toBe("day");
    expect(groups[0]?.tasks.map((t) => t.id)).toEqual(["a", "b"]);
  });

  it("separates Tasks that fall on different days", async () => {
    const groups = groupIntoAgenda(
      [
        task({ id: "fri", startsAt: new Date("2026-10-17T15:30:00Z") }),
        task({ id: "mon", startsAt: new Date("2026-10-20T13:00:00Z") }),
      ],
      MONTREAL,
    );

    expect(groups.map((g) => g.tasks.map((t) => t.id))).toEqual([["fri"], ["mon"]]);
  });

  it("collects every flexible Task into one trailing group", async () => {
    const groups = groupIntoAgenda(
      [
        task({ id: "fixed", startsAt: new Date("2026-10-17T15:30:00Z") }),
        task({ id: "flex-1" }),
        task({ id: "flex-2" }),
      ],
      MONTREAL,
    );

    expect(groups).toHaveLength(2);
    expect(groups[1]?.kind).toBe("flexible");
    expect(groups[1]?.tasks.map((t) => t.id)).toEqual(["flex-1", "flex-2"]);
  });

  it("adds no flexible group when every Task has a start time", async () => {
    const groups = groupIntoAgenda(
      [task({ id: "fixed", startsAt: new Date("2026-10-17T15:30:00Z") })],
      MONTREAL,
    );

    expect(groups.every((g) => g.kind === "day")).toBe(true);
  });

  it("returns nothing for an empty list", async () => {
    expect(groupIntoAgenda([], MONTREAL)).toEqual([]);
  });

  it("groups by the mosque's day, not the server's", async () => {
    // 01:30 UTC on the 18th is still the evening of the 17th in Montreal.
    const lateEvening = new Date("2026-10-18T01:30:00Z");
    expect(dayKey(lateEvening, MONTREAL)).toBe("2026-10-17");
    expect(dayKey(lateEvening, "UTC")).toBe("2026-10-18");

    const groups = groupIntoAgenda(
      [
        task({ id: "early-evening", startsAt: new Date("2026-10-17T22:00:00Z") }),
        task({ id: "late-evening", startsAt: lateEvening }),
      ],
      MONTREAL,
    );

    expect(groups).toHaveLength(1);
    expect(groups[0]?.tasks.map((t) => t.id)).toEqual(["early-evening", "late-evening"]);
  });
});

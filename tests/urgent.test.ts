import { beforeEach, describe, expect, it } from "vitest";
import { editTask, listOpenTasks, publishTask } from "@/core/tasks";
import { groupIntoAgenda } from "@/view/agenda";
import { hoursFromNow, resetDb } from "./helpers/db";
import { openTask as task } from "./helpers/task";

beforeEach(resetDb);

const MONTREAL = "America/Toronto";

describe("marking work urgent", () => {
  it("is nothing by default", async () => {
    const published = await publishTask({ title: "Shoe rack", dueBy: hoursFromNow(48) });
    expect(published.urgent).toBe(false);
  });

  it("is the Admin's deliberate choice", async () => {
    const published = await publishTask({
      title: "Drive a family to the hospital",
      dueBy: hoursFromNow(20),
      urgent: true,
    });
    expect(published.urgent).toBe(true);
  });

  it("can be lifted again when the rush is over", async () => {
    const published = await publishTask({
      title: "Drive a family to the hospital",
      dueBy: hoursFromNow(20),
      urgent: true,
    });

    const calmed = await editTask(published.id, {
      title: "Drive a family to the hospital",
      dueBy: hoursFromNow(20),
    });
    expect(calmed.urgent).toBe(false);
  });

  it("reaches the public list, which has to pin it", async () => {
    await publishTask({ title: "Shoe rack", dueBy: hoursFromNow(48), urgent: true });
    expect((await listOpenTasks())[0]?.urgent).toBe(true);
  });
});

describe("pinning urgent work to the top of the list", () => {
  it("comes before the day-by-day list", () => {
    const groups = groupIntoAgenda(
      [
        task({ id: "friday", startsAt: new Date("2026-10-16T15:00:00Z") }),
        task({ id: "rush", startsAt: new Date("2026-10-20T15:00:00Z"), urgent: true }),
      ],
      MONTREAL,
    );

    expect(groups[0]?.kind).toBe("urgent");
    expect(groups[0]?.tasks.map((t) => t.id)).toEqual(["rush"]);
  });

  it("appears once, not in both the pin and its own day", () => {
    const groups = groupIntoAgenda(
      [
        task({ id: "rush", startsAt: new Date("2026-10-16T15:00:00Z"), urgent: true }),
        task({ id: "ordinary", startsAt: new Date("2026-10-16T17:00:00Z") }),
      ],
      MONTREAL,
    );

    const everywhere = groups.flatMap((group) => group.tasks.map((t) => t.id));
    expect(everywhere).toEqual(["rush", "ordinary"]);
    expect(groups[1]?.kind).toBe("day");
    expect(groups[1]?.tasks.map((t) => t.id)).toEqual(["ordinary"]);
  });

  it("orders several urgent Tasks by when they happen, soonest first", () => {
    const groups = groupIntoAgenda(
      [
        task({ id: "later", startsAt: new Date("2026-10-20T15:00:00Z"), urgent: true }),
        // A flexible Task has no start, so its Deadline is when it is measured
        // from. It is sooner than the fixed one above and belongs above it.
        task({ id: "sooner-flexible", dueBy: new Date("2026-10-18T23:00:00Z"), urgent: true }),
        task({ id: "soonest", startsAt: new Date("2026-10-17T15:00:00Z"), urgent: true }),
      ],
      MONTREAL,
    );

    expect(groups[0]?.tasks.map((t) => t.id)).toEqual([
      "soonest",
      "sooner-flexible",
      "later",
    ]);
  });

  it("keeps an urgent flexible Task out of the flexible section", () => {
    const groups = groupIntoAgenda(
      [
        task({ id: "rush", dueBy: new Date("2026-10-18T23:00:00Z"), urgent: true }),
        task({ id: "whenever", dueBy: new Date("2026-10-25T23:00:00Z") }),
      ],
      MONTREAL,
    );

    expect(groups.map((group) => group.kind)).toEqual(["urgent", "flexible"]);
    expect(groups[1]?.tasks.map((t) => t.id)).toEqual(["whenever"]);
  });

  it("adds no section at all when nothing is urgent", () => {
    const groups = groupIntoAgenda(
      [task({ id: "ordinary", startsAt: new Date("2026-10-16T15:00:00Z") })],
      MONTREAL,
    );

    expect(groups.map((group) => group.kind)).toEqual(["day"]);
  });

  it("pins a full Task without hiding that it is full", () => {
    const groups = groupIntoAgenda(
      [
        task({
          id: "rush",
          startsAt: new Date("2026-10-16T15:00:00Z"),
          urgent: true,
          slotsTaken: 1,
          slotsRemaining: 0,
          isFull: true,
        }),
      ],
      MONTREAL,
    );

    expect(groups[0]?.tasks[0]?.isFull).toBe(true);
  });
});

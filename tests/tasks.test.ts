import { beforeEach, describe, expect, it } from "vitest";
import { ValidationError } from "@/core/errors";
import { getTask, listOpenTasks, publishTask } from "@/core/tasks";
import { addCancelledSignup, addLiveSignup, hoursFromNow, resetDb } from "./helpers/db";

beforeEach(resetDb);

describe("publishing a Task", () => {
  it("stores a fixed Task with its start time and deadline", async () => {
    const startsAt = hoursFromNow(48);
    const dueBy = hoursFromNow(50);

    const task = await publishTask({
      title: "Jumu'ah hall setup",
      description: "Lay out the rows and carry the dividers through.",
      location: "Main hall",
      startsAt,
      dueBy,
      slotsNeeded: 3,
    });

    expect(task.title).toBe("Jumu'ah hall setup");
    expect(task.location).toBe("Main hall");
    expect(task.startsAt?.toISOString()).toBe(startsAt.toISOString());
    expect(task.dueBy.toISOString()).toBe(dueBy.toISOString());
    expect(task.slotsNeeded).toBe(3);
    expect(task.closed).toBe(false);

    const stored = await getTask(task.id);
    expect(stored?.id).toBe(task.id);
  });

  it("stores a flexible Task with no start time", async () => {
    const task = await publishTask({
      title: "Shoe rack repair",
      dueBy: hoursFromNow(200),
    });

    expect(task.startsAt).toBeNull();
    expect(task.slotsNeeded).toBe(1);
  });

  it("refuses a Task with no deadline", async () => {
    await expect(
      publishTask({ title: "Grounds litter pick" } as unknown as Parameters<
        typeof publishTask
      >[0]),
    ).rejects.toThrow(ValidationError);
  });

  it("refuses a Task with a blank title", async () => {
    await expect(publishTask({ title: "   ", dueBy: hoursFromNow(24) })).rejects.toThrow(
      ValidationError,
    );
  });

  it("refuses fewer than one helper", async () => {
    await expect(
      publishTask({ title: "Carpet rolls", dueBy: hoursFromNow(24), slotsNeeded: 0 }),
    ).rejects.toThrow(ValidationError);
  });

  it("refuses a start time after its own deadline", async () => {
    await expect(
      publishTask({
        title: "Wudu area deep clean",
        startsAt: hoursFromNow(80),
        dueBy: hoursFromNow(40),
      }),
    ).rejects.toThrow(ValidationError);
  });
});

describe("the public list", () => {
  it("shows a Task whose deadline is still ahead", async () => {
    await publishTask({ title: "Qur'an class refreshments", dueBy: hoursFromNow(24) });

    const open = await listOpenTasks();
    expect(open.map((t) => t.title)).toEqual(["Qur'an class refreshments"]);
  });

  it("leaves out a Task whose deadline has passed", async () => {
    const past = await publishTask({ title: "Last week's setup", dueBy: hoursFromNow(-1) });
    await publishTask({ title: "This week's setup", dueBy: hoursFromNow(24) });

    const open = await listOpenTasks();
    expect(open.map((t) => t.id)).not.toContain(past.id);
    expect(open).toHaveLength(1);
  });

  it("leaves out a closed Task", async () => {
    const task = await publishTask({ title: "Cancelled for weather", dueBy: hoursFromNow(24) });
    await import("@/core/db").then(({ db }) =>
      db().query("update tasks set closed = true where id = $1", [task.id]),
    );

    expect(await listOpenTasks()).toHaveLength(0);
  });

  it("counts live Signups against the Slots a Task needs", async () => {
    const task = await publishTask({
      title: "Unloading the new carpet rolls",
      dueBy: hoursFromNow(24),
      slotsNeeded: 3,
    });
    await addLiveSignup(task.id, "+15145550101");
    await addLiveSignup(task.id, "+15145550102");

    const [open] = await listOpenTasks();
    expect(open?.slotsTaken).toBe(2);
    expect(open?.slotsRemaining).toBe(1);
    expect(open?.isFull).toBe(false);
  });

  it("ignores a cancelled Signup, so the Slot is free again", async () => {
    const task = await publishTask({
      title: "Grounds litter pick",
      dueBy: hoursFromNow(24),
      slotsNeeded: 1,
    });
    await addCancelledSignup(task.id, "+15145550103");

    const [open] = await listOpenTasks();
    expect(open?.slotsTaken).toBe(0);
    expect(open?.slotsRemaining).toBe(1);
    expect(open?.isFull).toBe(false);
  });

  it("keeps a fully covered Task in the list, marked as full", async () => {
    const task = await publishTask({
      title: "Unloading the new carpet rolls",
      dueBy: hoursFromNow(24),
      slotsNeeded: 2,
    });
    await addLiveSignup(task.id, "+15145550104");
    await addLiveSignup(task.id, "+15145550105");

    const [open] = await listOpenTasks();
    expect(open?.isFull).toBe(true);
    expect(open?.slotsRemaining).toBe(0);
  });

  it("puts fixed Tasks first in the order they happen, then flexible ones", async () => {
    await publishTask({ title: "Flexible, due soon", dueBy: hoursFromNow(30) });
    await publishTask({
      title: "Fixed, later",
      startsAt: hoursFromNow(72),
      dueBy: hoursFromNow(74),
    });
    await publishTask({
      title: "Fixed, sooner",
      startsAt: hoursFromNow(12),
      dueBy: hoursFromNow(14),
    });

    const open = await listOpenTasks();
    expect(open.map((t) => t.title)).toEqual([
      "Fixed, sooner",
      "Fixed, later",
      "Flexible, due soon",
    ]);
  });

  it("marks a Task with no start time as flexible", async () => {
    await publishTask({ title: "Shoe rack repair", dueBy: hoursFromNow(24) });
    await publishTask({
      title: "Jumu'ah hall setup",
      startsAt: hoursFromNow(10),
      dueBy: hoursFromNow(12),
    });

    const open = await listOpenTasks();
    expect(open.map((t) => [t.title, t.isFlexible])).toEqual([
      ["Jumu'ah hall setup", false],
      ["Shoe rack repair", true],
    ]);
  });
});

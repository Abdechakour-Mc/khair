import { beforeEach, describe, expect, it } from "vitest";
import { ConflictError, ValidationError } from "@/core/errors";
import { claimSlot, listSignupsForTask } from "@/core/signups";
import {
  editTask,
  getTaskWithSlots,
  listOpenTasks,
  publishTask,
  setTaskClosed,
} from "@/core/tasks";
import { hoursFromNow, resetDb } from "./helpers/db";

beforeEach(resetDb);

async function openTask(slotsNeeded = 2) {
  return publishTask({
    title: "Jumu'ah hall setup",
    description: "Lay out the rows.",
    location: "Main hall",
    startsAt: hoursFromNow(26),
    dueBy: hoursFromNow(28),
    slotsNeeded,
  });
}

describe("correcting a published Task", () => {
  it("changes what the public list shows, without touching the Signups", async () => {
    const task = await openTask(3);
    await claimSlot({ taskId: task.id, name: "Yusuf", phone: "5142849137" });

    await editTask(task.id, {
      title: "Jumu'ah hall setup and chairs",
      description: "Rows, then the chairs from the store.",
      location: "Main hall and lobby",
      startsAt: hoursFromNow(27),
      dueBy: hoursFromNow(29),
      slotsNeeded: 4,
    });

    const updated = await getTaskWithSlots(task.id);
    expect(updated?.title).toBe("Jumu'ah hall setup and chairs");
    expect(updated?.location).toBe("Main hall and lobby");
    expect(updated?.slotsNeeded).toBe(4);
    expect(updated?.slotsTaken).toBe(1);
    expect(await listSignupsForTask(task.id)).toHaveLength(1);
  });

  it("can turn a fixed Task into a flexible one", async () => {
    const task = await openTask();

    await editTask(task.id, {
      title: task.title,
      dueBy: hoursFromNow(200),
      startsAt: null,
    });

    const updated = await getTaskWithSlots(task.id);
    expect(updated?.startsAt).toBeNull();
    expect(updated?.isFlexible).toBe(true);
  });

  it("refuses to cut the helpers below the number already holding a Slot", async () => {
    const task = await openTask(3);
    await claimSlot({ taskId: task.id, name: "Yusuf", phone: "5142849137" });
    await claimSlot({ taskId: task.id, name: "Khadija", phone: "4382017744" });

    await expect(
      editTask(task.id, { title: task.title, dueBy: task.dueBy, slotsNeeded: 1 }),
    ).rejects.toMatchObject({ code: "slots_below_claimed" });

    expect((await getTaskWithSlots(task.id))?.slotsNeeded).toBe(3);
  });

  it("allows cutting to exactly the number already holding a Slot", async () => {
    const task = await openTask(3);
    await claimSlot({ taskId: task.id, name: "Yusuf", phone: "5142849137" });

    await editTask(task.id, { title: task.title, dueBy: task.dueBy, slotsNeeded: 1 });
    const updated = await getTaskWithSlots(task.id);
    expect(updated?.slotsNeeded).toBe(1);
    expect(updated?.isFull).toBe(true);
  });

  it("counts only live Slots, so a released one does not block a cut", async () => {
    const { releaseSignup } = await import("@/core/signups");
    const task = await openTask(3);
    const signup = await claimSlot({ taskId: task.id, name: "Yusuf", phone: "5142849137" });
    await releaseSignup(signup.cancelToken);

    await expect(
      editTask(task.id, { title: task.title, dueBy: task.dueBy, slotsNeeded: 1 }),
    ).resolves.toBeDefined();
  });

  it("applies the same rules as publishing", async () => {
    const task = await openTask();

    await expect(editTask(task.id, { title: "  ", dueBy: task.dueBy })).rejects.toThrow(
      ValidationError,
    );
    await expect(
      editTask(task.id, { title: "x", dueBy: task.dueBy, slotsNeeded: 0 }),
    ).rejects.toThrow(ValidationError);
    await expect(
      editTask(task.id, {
        title: "x",
        startsAt: hoursFromNow(80),
        dueBy: hoursFromNow(40),
      }),
    ).rejects.toMatchObject({ code: "start_after_deadline" });
  });

  it("refuses a Task that does not exist", async () => {
    await expect(
      editTask("00000000-0000-0000-0000-000000000000", {
        title: "x",
        dueBy: hoursFromNow(10),
      }),
    ).rejects.toThrow(ConflictError);
  });
});

describe("calling a Task off", () => {
  it("takes it off the public list and refuses new claims", async () => {
    const task = await openTask();
    await setTaskClosed(task.id, true);

    expect(await listOpenTasks()).toHaveLength(0);
    await expect(
      claimSlot({ taskId: task.id, name: "Yusuf", phone: "5142849137" }),
    ).rejects.toMatchObject({ reason: "task_closed" });
  });

  it("keeps it visible to the Admin, marked closed", async () => {
    const task = await openTask();
    await setTaskClosed(task.id, true);
    expect((await getTaskWithSlots(task.id))?.closed).toBe(true);
  });

  it("preserves the Signups of people who had already claimed a Slot", async () => {
    const task = await openTask();
    await claimSlot({ taskId: task.id, name: "Yusuf", phone: "5142849137" });

    await setTaskClosed(task.id, true);

    const signups = await listSignupsForTask(task.id);
    expect(signups).toHaveLength(1);
    expect(signups[0]?.cancelledAt).toBeNull();
  });

  it("can be put back when it was called off by mistake", async () => {
    const task = await openTask();
    await setTaskClosed(task.id, true);
    await setTaskClosed(task.id, false);

    expect(await listOpenTasks()).toHaveLength(1);
    await expect(
      claimSlot({ taskId: task.id, name: "Yusuf", phone: "5142849137" }),
    ).resolves.toBeDefined();
  });

  it("refuses an id that is not an id, without hitting the database", async () => {
    await expect(setTaskClosed("not-an-id", true)).rejects.toThrow(ConflictError);
  });
});

import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/core/db";
import { ConflictError, ValidationError } from "@/core/errors";
import { claimSlot, findSignupByCancelToken } from "@/core/signups";
import { listOpenTasks, publishTask } from "@/core/tasks";
import { hoursFromNow, resetDb } from "./helpers/db";

beforeEach(resetDb);

async function openTask(slotsNeeded = 1) {
  return publishTask({
    title: "Jumu'ah hall setup",
    location: "Main hall",
    startsAt: hoursFromNow(26),
    dueBy: hoursFromNow(28),
    slotsNeeded,
  });
}

describe("claiming a Slot", () => {
  it("records a Signup against the Task", async () => {
    const task = await openTask(3);

    const signup = await claimSlot({
      taskId: task.id,
      name: "Yusuf Benali",
      phone: "514-284-9137",
    });

    expect(signup.taskId).toBe(task.id);
    expect(signup.volunteerPhone).toBe("+15142849137");
    expect(signup.nameSnapshot).toBe("Yusuf Benali");
    expect(signup.outcome).toBe("done");
    expect(signup.cancelledAt).toBeNull();
    expect(signup.cancelToken).toMatch(/^[\w-]{20,}$/);
  });

  it("takes one Slot off the public list", async () => {
    const task = await openTask(2);
    await claimSlot({ taskId: task.id, name: "Yusuf Benali", phone: "5142849137" });

    const [open] = await listOpenTasks();
    expect(open?.slotsRemaining).toBe(1);
    expect(open?.isFull).toBe(false);
  });

  it("marks the Task fully covered once every Slot is claimed", async () => {
    const task = await openTask(1);
    await claimSlot({ taskId: task.id, name: "Yusuf Benali", phone: "5142849137" });

    const [open] = await listOpenTasks();
    expect(open?.isFull).toBe(true);
  });

  it("gives each Signup its own unguessable cancel token", async () => {
    const task = await openTask(2);
    const first = await claimSlot({ taskId: task.id, name: "Yusuf", phone: "5142849137" });
    const second = await claimSlot({ taskId: task.id, name: "Khadija", phone: "4382017744" });

    expect(first.cancelToken).not.toBe(second.cancelToken);
    expect((await findSignupByCancelToken(first.cancelToken))?.id).toBe(first.id);
    expect((await findSignupByCancelToken(second.cancelToken))?.id).toBe(second.id);
  });

  it("finds nothing for a token that was never issued", async () => {
    expect(await findSignupByCancelToken("not-a-real-token")).toBeNull();
    expect(await findSignupByCancelToken("")).toBeNull();
  });
});

describe("one person, one Slot per Task", () => {
  it("refuses a second claim from the same number", async () => {
    const task = await openTask(3);
    await claimSlot({ taskId: task.id, name: "Yusuf Benali", phone: "5142849137" });

    await expect(
      claimSlot({ taskId: task.id, name: "Yusuf Benali", phone: "5142849137" }),
    ).rejects.toThrow(ConflictError);
  });

  it("refuses it however the number was typed the second time", async () => {
    const task = await openTask(3);
    await claimSlot({ taskId: task.id, name: "Yusuf Benali", phone: "5142849137" });

    await expect(
      claimSlot({ taskId: task.id, name: "Yusuf Benali", phone: "+1 (514) 284-9137" }),
    ).rejects.toThrow(ConflictError);
  });

  it("records only one Signup when the button is double tapped", async () => {
    const task = await openTask(3);
    const claim = () =>
      claimSlot({ taskId: task.id, name: "Yusuf Benali", phone: "5142849137" });

    const results = await Promise.allSettled([claim(), claim()]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);

    const { rows } = await db().query("select * from signups where task_id = $1", [task.id]);
    expect(rows).toHaveLength(1);
  });

  it("still lets the same person claim a different Task", async () => {
    const first = await openTask(1);
    const second = await publishTask({ title: "Shoe rack repair", dueBy: hoursFromNow(100) });

    await claimSlot({ taskId: first.id, name: "Yusuf Benali", phone: "5142849137" });
    await expect(
      claimSlot({ taskId: second.id, name: "Yusuf Benali", phone: "5142849137" }),
    ).resolves.toBeDefined();
  });
});

describe("the last Slot under contention", () => {
  it("lets exactly one of two simultaneous claims through", async () => {
    const task = await openTask(1);

    const results = await Promise.allSettled([
      claimSlot({ taskId: task.id, name: "Yusuf Benali", phone: "5142849137" }),
      claimSlot({ taskId: task.id, name: "Khadija Amrani", phone: "4382017744" }),
    ]);

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect((rejected[0] as PromiseRejectedResult).reason).toBeInstanceOf(ConflictError);

    const { rows } = await db().query("select * from signups where task_id = $1", [task.id]);
    expect(rows).toHaveLength(1);
  });

  it("lets exactly three through when three Slots are contested by five people", async () => {
    const task = await openTask(3);
    const phones = ["5142849137", "4382017744", "5142849201", "4382017745", "5819001122"];

    const results = await Promise.allSettled(
      phones.map((phone, i) => claimSlot({ taskId: task.id, name: `Helper ${i}`, phone })),
    );

    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(3);

    const { rows } = await db().query(
      "select * from signups where task_id = $1 and cancelled_at is null",
      [task.id],
    );
    expect(rows).toHaveLength(3);
  });

  it("tells the congregant plainly when the Slot went while they typed", async () => {
    const task = await openTask(1);
    await claimSlot({ taskId: task.id, name: "Yusuf Benali", phone: "5142849137" });

    await expect(
      claimSlot({ taskId: task.id, name: "Khadija Amrani", phone: "4382017744" }),
    ).rejects.toMatchObject({ reason: "task_full" });
  });
});

describe("refusing a claim the Task cannot accept", () => {
  it("refuses a Task that has been closed", async () => {
    const task = await openTask(2);
    await db().query("update tasks set closed = true where id = $1", [task.id]);

    await expect(
      claimSlot({ taskId: task.id, name: "Yusuf Benali", phone: "5142849137" }),
    ).rejects.toMatchObject({ reason: "task_closed" });
  });

  it("refuses a Task whose deadline has passed", async () => {
    const task = await publishTask({ title: "Last week", dueBy: hoursFromNow(-1) });

    await expect(
      claimSlot({ taskId: task.id, name: "Yusuf Benali", phone: "5142849137" }),
    ).rejects.toMatchObject({ reason: "task_passed" });
  });

  it("refuses a Task that does not exist", async () => {
    await expect(
      claimSlot({
        taskId: "00000000-0000-0000-0000-000000000000",
        name: "Yusuf Benali",
        phone: "5142849137",
      }),
    ).rejects.toMatchObject({ reason: "task_missing" });
  });

  it("refuses a task id that is not an id at all, without hitting the database", async () => {
    await expect(
      claimSlot({ taskId: "../../etc/passwd", name: "Yusuf", phone: "5142849137" }),
    ).rejects.toBeInstanceOf(ConflictError);
  });
});

describe("what the Volunteer gives us", () => {
  it("refuses a blank name", async () => {
    const task = await openTask(1);
    await expect(
      claimSlot({ taskId: task.id, name: "   ", phone: "5142849137" }),
    ).rejects.toThrow(ValidationError);
  });

  it("refuses an unusable phone number before touching the database", async () => {
    const task = await openTask(1);
    await expect(
      claimSlot({ taskId: task.id, name: "Yusuf Benali", phone: "nope" }),
    ).rejects.toThrow(ValidationError);

    const { rows } = await db().query("select * from volunteers");
    expect(rows).toHaveLength(0);
  });

  it("keeps the newest name on the Volunteer and the typed name on each Signup", async () => {
    const first = await openTask(1);
    const second = await publishTask({ title: "Shoe rack repair", dueBy: hoursFromNow(100) });

    const earlier = await claimSlot({ taskId: first.id, name: "Yusuf", phone: "5142849137" });
    const later = await claimSlot({
      taskId: second.id,
      name: "Yusuf Benali",
      phone: "5142849137",
    });

    expect(earlier.nameSnapshot).toBe("Yusuf");
    expect(later.nameSnapshot).toBe("Yusuf Benali");

    const { rows } = await db().query<{ name: string }>(
      "select name from volunteers where phone = $1",
      ["+15142849137"],
    );
    expect(rows[0]?.name).toBe("Yusuf Benali");
  });

  it("trims what was typed rather than storing the spaces", async () => {
    const task = await openTask(1);
    const signup = await claimSlot({
      taskId: task.id,
      name: "  Khadija Amrani  ",
      phone: " 438 201 7744 ",
    });

    expect(signup.nameSnapshot).toBe("Khadija Amrani");
    expect(signup.volunteerPhone).toBe("+14382017744");
  });
});

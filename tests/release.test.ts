import { beforeEach, describe, expect, it } from "vitest";
import { ConflictError } from "@/core/errors";
import { claimSlot, findSignupByCancelToken, releaseSignup } from "@/core/signups";
import { getTaskWithSlots, listOpenTasks, publishTask } from "@/core/tasks";
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

describe("releasing a Slot", () => {
  it("marks the Signup cancelled and stamps when", async () => {
    const task = await openTask(2);
    const signup = await claimSlot({ taskId: task.id, name: "Yusuf", phone: "5142849137" });

    const released = await releaseSignup(signup.cancelToken);

    expect(released.id).toBe(signup.id);
    expect(released.outcome).toBe("cancelled");
    expect(released.cancelledAt).toBeInstanceOf(Date);
  });

  it("gives the Slot back to the pool", async () => {
    const task = await openTask(2);
    const signup = await claimSlot({ taskId: task.id, name: "Yusuf", phone: "5142849137" });
    expect((await listOpenTasks())[0]?.slotsRemaining).toBe(1);

    await releaseSignup(signup.cancelToken);

    expect((await listOpenTasks())[0]?.slotsRemaining).toBe(2);
  });

  it("reopens a Task that had been fully covered", async () => {
    const task = await openTask(1);
    const signup = await claimSlot({ taskId: task.id, name: "Yusuf", phone: "5142849137" });
    expect((await getTaskWithSlots(task.id))?.isFull).toBe(true);

    await releaseSignup(signup.cancelToken);

    expect((await getTaskWithSlots(task.id))?.isFull).toBe(false);
  });

  it("lets somebody else take the released Slot", async () => {
    const task = await openTask(1);
    const first = await claimSlot({ taskId: task.id, name: "Yusuf", phone: "5142849137" });
    await releaseSignup(first.cancelToken);

    const second = await claimSlot({ taskId: task.id, name: "Khadija", phone: "4382017744" });
    expect(second.taskId).toBe(task.id);
    expect((await getTaskWithSlots(task.id))?.isFull).toBe(true);
  });

  it("lets the same person change their mind and claim again", async () => {
    const task = await openTask(1);
    const first = await claimSlot({ taskId: task.id, name: "Yusuf", phone: "5142849137" });
    await releaseSignup(first.cancelToken);

    const again = await claimSlot({ taskId: task.id, name: "Yusuf", phone: "5142849137" });
    expect(again.id).not.toBe(first.id);
    expect(again.cancelledAt).toBeNull();
  });

  it("keeps the cancellation on the record rather than overwriting it", async () => {
    const task = await openTask(1);
    const first = await claimSlot({ taskId: task.id, name: "Yusuf", phone: "5142849137" });
    await releaseSignup(first.cancelToken);
    await claimSlot({ taskId: task.id, name: "Yusuf", phone: "5142849137" });

    const cancelled = await findSignupByCancelToken(first.cancelToken);
    expect(cancelled?.outcome).toBe("cancelled");
    expect(cancelled?.cancelledAt).toBeInstanceOf(Date);
  });

  it("still refuses a second live claim while the first is live", async () => {
    const task = await openTask(3);
    await claimSlot({ taskId: task.id, name: "Yusuf", phone: "5142849137" });

    await expect(
      claimSlot({ taskId: task.id, name: "Yusuf", phone: "5142849137" }),
    ).rejects.toMatchObject({ reason: "already_signed_up" });
  });
});

describe("the reach of a Cancel Token", () => {
  it("touches only its own Signup, not the Volunteer's others", async () => {
    const first = await openTask(1);
    const second = await publishTask({ title: "Shoe rack repair", dueBy: hoursFromNow(120) });

    const a = await claimSlot({ taskId: first.id, name: "Yusuf", phone: "5142849137" });
    const b = await claimSlot({ taskId: second.id, name: "Yusuf", phone: "5142849137" });

    await releaseSignup(a.cancelToken);

    expect((await findSignupByCancelToken(a.cancelToken))?.cancelledAt).toBeInstanceOf(Date);
    expect((await findSignupByCancelToken(b.cancelToken))?.cancelledAt).toBeNull();
  });

  it("refuses an unknown token with the same reason whether or not it existed", async () => {
    await expect(releaseSignup("never-issued-token")).rejects.toMatchObject({
      reason: "signup_missing",
    });
    await expect(releaseSignup("")).rejects.toBeInstanceOf(ConflictError);
  });

  it("treats a second release of the same Signup as a no-op, not a failure", async () => {
    const task = await openTask(1);
    const signup = await claimSlot({ taskId: task.id, name: "Yusuf", phone: "5142849137" });

    const once = await releaseSignup(signup.cancelToken);
    const twice = await releaseSignup(signup.cancelToken);

    expect(twice.id).toBe(once.id);
    expect(twice.cancelledAt?.toISOString()).toBe(once.cancelledAt?.toISOString());
  });

  it("releases exactly once when the button is double tapped", async () => {
    const task = await openTask(1);
    const signup = await claimSlot({ taskId: task.id, name: "Yusuf", phone: "5142849137" });

    const results = await Promise.allSettled([
      releaseSignup(signup.cancelToken),
      releaseSignup(signup.cancelToken),
    ]);

    expect(results.every((r) => r.status === "fulfilled")).toBe(true);
    const stamps = results.map((r) =>
      (r as PromiseFulfilledResult<{ cancelledAt: Date | null }>).value.cancelledAt?.toISOString(),
    );
    expect(stamps[0]).toBe(stamps[1]);
    expect((await getTaskWithSlots(task.id))?.slotsRemaining).toBe(1);
  });
});

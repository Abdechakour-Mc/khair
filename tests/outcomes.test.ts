import { beforeEach, describe, expect, it } from "vitest";
import { ConflictError } from "@/core/errors";
import {
  claimSlot,
  listSignupsForTask,
  releaseSignup,
  setOutcome,
  volunteerHistory,
} from "@/core/signups";
import { publishTask } from "@/core/tasks";
import { describeLeadTime } from "@/view/format";
import { hoursFromNow, resetDb } from "./helpers/db";

beforeEach(resetDb);

async function openTask(slotsNeeded = 2) {
  return publishTask({
    title: "Jumu'ah hall setup",
    startsAt: hoursFromNow(26),
    dueBy: hoursFromNow(28),
    slotsNeeded,
  });
}

describe("recording how a Signup ended", () => {
  it("counts as done with no Admin action at all", async () => {
    const task = await openTask();
    const signup = await claimSlot({ taskId: task.id, name: "Yusuf", phone: "5142849137" });
    expect(signup.outcome).toBe("done");
  });

  it("lets the Admin flag someone who did not come", async () => {
    const task = await openTask();
    const signup = await claimSlot({ taskId: task.id, name: "Yusuf", phone: "5142849137" });

    const flagged = await setOutcome(signup.id, "no_show");
    expect(flagged.outcome).toBe("no_show");
    expect(flagged.cancelledAt).toBeNull();
  });

  it("lets the Admin take it back, so one mistaken tap is not permanent", async () => {
    const task = await openTask();
    const signup = await claimSlot({ taskId: task.id, name: "Yusuf", phone: "5142849137" });

    await setOutcome(signup.id, "no_show");
    const corrected = await setOutcome(signup.id, "done");
    expect(corrected.outcome).toBe("done");
  });

  it("does not let the Admin mark a Signup cancelled: that is the Volunteer's to do", async () => {
    const task = await openTask();
    const signup = await claimSlot({ taskId: task.id, name: "Yusuf", phone: "5142849137" });

    await expect(
      setOutcome(signup.id, "cancelled" as unknown as "done"),
    ).rejects.toBeInstanceOf(ConflictError);

    const [stored] = await listSignupsForTask(task.id);
    expect(stored?.outcome).toBe("done");
  });

  it("refuses to overwrite the outcome of a Slot the Volunteer released", async () => {
    const task = await openTask();
    const signup = await claimSlot({ taskId: task.id, name: "Yusuf", phone: "5142849137" });
    await releaseSignup(signup.cancelToken);

    await expect(setOutcome(signup.id, "no_show")).rejects.toMatchObject({
      reason: "signup_released",
    });
  });

  it("refuses a Signup that does not exist", async () => {
    await expect(
      setOutcome("00000000-0000-0000-0000-000000000000", "no_show"),
    ).rejects.toMatchObject({ reason: "signup_missing" });
    await expect(setOutcome("not-an-id", "no_show")).rejects.toBeInstanceOf(ConflictError);
  });

  it("leaves the Slot taken: not coming is not the same as releasing", async () => {
    const task = await openTask(1);
    const signup = await claimSlot({ taskId: task.id, name: "Yusuf", phone: "5142849137" });
    await setOutcome(signup.id, "no_show");

    const { getTaskWithSlots } = await import("@/core/tasks");
    expect((await getTaskWithSlots(task.id))?.slotsTaken).toBe(1);
  });
});

describe("a Volunteer's record, for the Admin only", () => {
  it("is empty for a number with no Signups", async () => {
    expect(await volunteerHistory("+15142849137")).toEqual([]);
    expect(await volunteerHistory("")).toEqual([]);
  });

  it("lists what happened, newest Task first", async () => {
    const early = await publishTask({ title: "Shoe rack repair", dueBy: hoursFromNow(20) });
    const later = await publishTask({ title: "Carpet rolls", dueBy: hoursFromNow(200) });

    await claimSlot({ taskId: early.id, name: "Yusuf", phone: "5142849137" });
    await claimSlot({ taskId: later.id, name: "Yusuf", phone: "5142849137" });

    const history = await volunteerHistory("+15142849137");
    expect(history.map((entry) => entry.taskTitle)).toEqual(["Carpet rolls", "Shoe rack repair"]);
  });

  it("carries each Outcome, including a release and its timing", async () => {
    const task = await openTask(2);
    const kept = await claimSlot({ taskId: task.id, name: "Yusuf", phone: "5142849137" });
    const dropped = await claimSlot({ taskId: task.id, name: "Khadija", phone: "4382017744" });

    await setOutcome(kept.id, "no_show");
    await releaseSignup(dropped.cancelToken);

    expect((await volunteerHistory("+15142849137"))[0]?.outcome).toBe("no_show");

    const [released] = await volunteerHistory("+14382017744");
    expect(released?.outcome).toBe("cancelled");
    expect(released?.cancelledAt).toBeInstanceOf(Date);
  });

  it("shows only the Volunteer asked about", async () => {
    const task = await openTask(2);
    await claimSlot({ taskId: task.id, name: "Yusuf", phone: "5142849137" });
    await claimSlot({ taskId: task.id, name: "Khadija", phone: "4382017744" });

    expect(await volunteerHistory("+15142849137")).toHaveLength(1);
    expect(await volunteerHistory("+14382017744")).toHaveLength(1);
  });
});

describe("describing when a Slot was released", () => {
  const start = new Date("2026-10-17T15:30:00Z");

  it("reads in minutes just before", () => {
    expect(describeLeadTime(new Date("2026-10-17T15:00:00Z"), start)).toBe("30 minutes before");
    expect(describeLeadTime(new Date("2026-10-17T15:29:00Z"), start)).toBe("1 minute before");
  });

  it("reads in hours for the same day and the night before", () => {
    expect(describeLeadTime(new Date("2026-10-17T13:30:00Z"), start)).toBe("2 hours before");
    expect(describeLeadTime(new Date("2026-10-16T15:30:00Z"), start)).toBe("24 hours before");
  });

  it("reads in days for real notice", () => {
    expect(describeLeadTime(new Date("2026-10-14T15:30:00Z"), start)).toBe("3 days before");
    expect(describeLeadTime(new Date("2026-10-10T15:30:00Z"), start)).toBe("7 days before");
  });

  it("says so plainly when it came too late to matter", () => {
    expect(describeLeadTime(new Date("2026-10-17T16:30:00Z"), start)).toBe(
      "after it had started",
    );
  });

  it("draws no line at 24 hours: the wording is the same either side", () => {
    const justUnder = describeLeadTime(new Date("2026-10-16T16:30:00Z"), start);
    const justOver = describeLeadTime(new Date("2026-10-16T14:30:00Z"), start);
    expect(justUnder).toBe("23 hours before");
    expect(justOver).toBe("25 hours before");
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/core/db";
import { purgeExpiredSignups, retentionMonths } from "@/core/retention";
import { claimSlot, listSignupsForTask, releaseSignup, setOutcome } from "@/core/signups";
import { getTaskWithSlots, publishTask, type Task } from "@/core/tasks";
import { hoursFromNow, resetDb } from "./helpers/db";

beforeEach(resetDb);

const HOURS_PER_MONTH = 24 * 30;
const monthsAgo = (months: number) => hoursFromNow(-months * HOURS_PER_MONTH);

/**
 * Claiming a Slot on a Task whose Deadline has passed is refused, and rightly
 * so, which means a fixture cannot simply publish an old Task. Instead the
 * Task is published, claimed, and then backdated: the same order events happen
 * in real life.
 */
async function claimedThenAged(
  months: number,
  claimants: Array<{ name: string; phone: string }>,
): Promise<Task> {
  const task = await publishTask({
    title: `Work from ${months} months ago`,
    dueBy: hoursFromNow(24),
    slotsNeeded: Math.max(1, claimants.length),
  });

  for (const claimant of claimants) {
    await claimSlot({ taskId: task.id, ...claimant });
  }

  await db().query("update tasks set due_by = $2 where id = $1", [task.id, monthsAgo(months)]);
  return task;
}

const YUSUF = { name: "Yusuf Benali", phone: "5142849137" };
const KHADIJA = { name: "Khadija Amrani", phone: "4382017744" };

describe("how long Khair remembers", () => {
  it("defaults to six months", () => {
    vi.stubEnv("RETENTION_MONTHS", "");
    expect(retentionMonths()).toBe(6);
    vi.unstubAllEnvs();
  });

  it("is configuration, not a constant in the code", () => {
    vi.stubEnv("RETENTION_MONTHS", "3");
    expect(retentionMonths()).toBe(3);
    vi.unstubAllEnvs();
  });

  it("ignores a nonsense value rather than forgetting everything", () => {
    for (const value of ["not-a-number", "0", "-4"]) {
      vi.stubEnv("RETENTION_MONTHS", value);
      expect(retentionMonths()).toBe(6);
    }
    vi.unstubAllEnvs();
  });
});

describe("the retention purge", () => {
  it("deletes Signups whose Task passed longer ago than the window", async () => {
    const old = await claimedThenAged(9, [YUSUF]);

    const result = await purgeExpiredSignups(new Date(), 6);

    expect(result.signupsDeleted).toBe(1);
    expect(await listSignupsForTask(old.id)).toEqual([]);
  });

  it("leaves Signups still inside the window alone", async () => {
    const recent = await claimedThenAged(2, [YUSUF]);

    const result = await purgeExpiredSignups(new Date(), 6);

    expect(result.signupsDeleted).toBe(0);
    expect(await listSignupsForTask(recent.id)).toHaveLength(1);
  });

  it("deletes the Volunteer too, so no phone number survives", async () => {
    await claimedThenAged(9, [YUSUF]);

    const result = await purgeExpiredSignups(new Date(), 6);

    expect(result.volunteersDeleted).toBe(1);
    const { rows } = await db().query("select * from volunteers");
    expect(rows).toEqual([]);
  });

  it("keeps a Volunteer who still has a Signup inside the window", async () => {
    await claimedThenAged(9, [YUSUF]);
    await claimedThenAged(1, [YUSUF]);

    const result = await purgeExpiredSignups(new Date(), 6);

    expect(result.signupsDeleted).toBe(1);
    expect(result.volunteersDeleted).toBe(0);
    const { rows } = await db().query("select phone from volunteers");
    expect(rows).toHaveLength(1);
  });

  it("keeps the Tasks: they are a record of what the mosque needed", async () => {
    const old = await claimedThenAged(9, [YUSUF]);

    await purgeExpiredSignups(new Date(), 6);

    expect((await getTaskWithSlots(old.id))?.title).toBe("Work from 9 months ago");
  });

  it("takes released Slots and no-shows with it, not only the plain ones", async () => {
    const task = await publishTask({
      title: "Work from long ago",
      dueBy: hoursFromNow(24),
      slotsNeeded: 2,
    });
    const released = await claimSlot({ taskId: task.id, ...YUSUF });
    const absent = await claimSlot({ taskId: task.id, ...KHADIJA });
    await releaseSignup(released.cancelToken);
    await setOutcome(absent.id, "no_show");
    await db().query("update tasks set due_by = $2 where id = $1", [task.id, monthsAgo(9)]);

    const result = await purgeExpiredSignups(new Date(), 6);

    expect(result.signupsDeleted).toBe(2);
    expect(result.volunteersDeleted).toBe(2);
  });

  it("changes nothing the second time it runs", async () => {
    await claimedThenAged(9, [YUSUF]);

    const first = await purgeExpiredSignups(new Date(), 6);
    const second = await purgeExpiredSignups(new Date(), 6);

    expect(first.signupsDeleted).toBe(1);
    expect(second).toEqual({ signupsDeleted: 0, volunteersDeleted: 0 });
  });

  it("does nothing at all on an empty database", async () => {
    expect(await purgeExpiredSignups(new Date(), 6)).toEqual({
      signupsDeleted: 0,
      volunteersDeleted: 0,
    });
  });

  it("honours a shorter window", async () => {
    await claimedThenAged(2, [YUSUF]);

    expect((await purgeExpiredSignups(new Date(), 6)).signupsDeleted).toBe(0);
    expect((await purgeExpiredSignups(new Date(), 1)).signupsDeleted).toBe(1);
  });

  it("removes a Volunteer who never had a Signup in the first place", async () => {
    await db().query("insert into volunteers (phone, name) values ($1, $2)", [
      "+15142849137",
      "Orphaned by an earlier purge",
    ]);

    const result = await purgeExpiredSignups(new Date(), 6);

    expect(result.volunteersDeleted).toBe(1);
  });
});

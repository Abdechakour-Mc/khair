import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/core/db";
import { adminOverview, tasksNeedingHelp } from "@/core/overview";
import { claimSlot, releaseSignup, setOutcome } from "@/core/signups";
import { runScheduledCleanup } from "@/core/retention";
import { deleteTask, publishTask } from "@/core/tasks";
import { listVolunteers, setVolunteerPaused, setVolunteerTrusted } from "@/core/volunteers";
import { hoursFromNow, resetDb } from "./helpers/db";

beforeEach(resetDb);

const YUSUF = { name: "Yusuf Benali", phone: "5142849137" };
const KHADIJA = { name: "Khadija Amrani", phone: "4382017744" };

describe("what the Admin sees at a glance", () => {
  it("counts nothing on a quiet week", async () => {
    const empty = await adminOverview();
    expect(empty.upcomingTasks).toBe(0);
    expect(empty.openSpots).toBe(0);
    expect(empty.volunteers).toBe(0);
  });

  it("counts the work ahead and the spots nobody has taken", async () => {
    const task = await publishTask({
      title: "Jumu'ah hall setup",
      startsAt: hoursFromNow(26),
      dueBy: hoursFromNow(28),
      slotsNeeded: 3,
    });
    await claimSlot({ taskId: task.id, ...YUSUF });
    await publishTask({ title: "Shoe rack", dueBy: hoursFromNow(48) });

    const overview = await adminOverview();
    expect(overview.upcomingTasks).toBe(2);
    // Three slots less one claim, plus the shoe rack's one.
    expect(overview.openSpots).toBe(3);
  });

  it("leaves out work that has passed, been called off, or been deleted", async () => {
    const past = await publishTask({ title: "Last week", dueBy: hoursFromNow(24) });
    await db().query("update tasks set due_by = now() - interval '2 days' where id = $1", [
      past.id,
    ]);
    const deleted = await publishTask({ title: "Mistake", dueBy: hoursFromNow(48) });
    await deleteTask(deleted.id);

    expect((await adminOverview()).upcomingTasks).toBe(0);
  });

  it("counts a released Slot as open again", async () => {
    const task = await publishTask({ title: "Shoe rack", dueBy: hoursFromNow(48) });
    const signup = await claimSlot({ taskId: task.id, ...YUSUF });
    expect((await adminOverview()).openSpots).toBe(0);

    await releaseSignup(signup.cancelToken);
    expect((await adminOverview()).openSpots).toBe(1);
  });

  it("counts the people, and how they stand with the Admin", async () => {
    const task = await publishTask({
      title: "Shoe rack",
      dueBy: hoursFromNow(48),
      slotsNeeded: 2,
    });
    await claimSlot({ taskId: task.id, ...YUSUF });
    await claimSlot({ taskId: task.id, ...KHADIJA });
    await setVolunteerTrusted("+15142849137", true);
    await setVolunteerPaused("+14382017744", true);

    const overview = await adminOverview();
    expect(overview.volunteers).toBe(2);
    expect(overview.trusted).toBe(1);
    expect(overview.paused).toBe(1);
  });

  it("counts urgent work and work still held back", async () => {
    await publishTask({ title: "Driving", dueBy: hoursFromNow(20), urgent: true });
    await publishTask({ title: "Quiet one", dueBy: hoursFromNow(40), important: true });

    const overview = await adminOverview();
    expect(overview.urgentTasks).toBe(1);
    expect(overview.withheldTasks).toBe(1);
  });

  it("notices demo data, which must not survive to launch", async () => {
    expect((await adminOverview()).demoTasks).toBe(0);
    await db().query(
      "insert into tasks (title, due_by, demo) values ('Demo work', now() + interval '2 days', true)",
    );
    expect((await adminOverview()).demoTasks).toBe(1);
  });
});

describe("the work that still needs somebody", () => {
  it("lists what is short-handed, soonest first", async () => {
    const later = await publishTask({
      title: "Later this week",
      startsAt: hoursFromNow(72),
      dueBy: hoursFromNow(74),
      slotsNeeded: 2,
    });
    const sooner = await publishTask({
      title: "Tomorrow",
      startsAt: hoursFromNow(26),
      dueBy: hoursFromNow(28),
      slotsNeeded: 2,
    });

    const needed = await tasksNeedingHelp();
    expect(needed.map((t) => t.id)).toEqual([sooner.id, later.id]);
    expect(needed[0]).toMatchObject({
      title: "Tomorrow",
      slotsNeeded: 2,
      slotsTaken: 0,
      flexible: false,
    });
  });

  it("says a flexible Task has no time, only a deadline", async () => {
    await publishTask({ title: "Shoe rack", dueBy: hoursFromNow(48) });
    expect((await tasksNeedingHelp())[0]?.flexible).toBe(true);
  });

  it("drops a Task the moment it is covered", async () => {
    const task = await publishTask({ title: "Shoe rack", dueBy: hoursFromNow(48) });
    expect(await tasksNeedingHelp()).toHaveLength(1);

    await claimSlot({ taskId: task.id, ...YUSUF });
    expect(await tasksNeedingHelp()).toEqual([]);
  });

  it("looks only as far ahead as the Admin can act", async () => {
    await publishTask({ title: "Next month", dueBy: hoursFromNow(24 * 20) });
    expect(await tasksNeedingHelp()).toEqual([]);
  });
});

describe("the nightly clean-up", () => {
  it("leaves nobody behind with a number and nothing attached", async () => {
    // Finalising a deleted Task deletes its Signups. Run after the purge,
    // that leaves the Volunteer's name and number with no Signups at all,
    // which is the state the purge exists to prevent.
    const task = await publishTask({ title: "A mistake", dueBy: hoursFromNow(48) });
    await claimSlot({ taskId: task.id, ...YUSUF });
    await deleteTask(task.id);
    await db().query(
      "update tasks set deleted_at = now() - interval '2 hours' where id = $1",
      [task.id],
    );

    const cleaned = await runScheduledCleanup();
    expect(cleaned.tasksDeleted).toBe(1);

    const { rows } = await db().query("select 1 from volunteers where phone = $1", [
      "+15142849137",
    ]);
    expect(rows).toHaveLength(0);
  });
});

describe("the Admin's list of people", () => {
  it("is empty before anybody has signed up", async () => {
    expect(await listVolunteers()).toEqual([]);
  });

  it("carries what the Admin judges by, and no score", async () => {
    const task = await publishTask({
      title: "Shoe rack",
      dueBy: hoursFromNow(48),
      slotsNeeded: 2,
    });
    const signup = await claimSlot({ taskId: task.id, ...YUSUF });
    await setOutcome(signup.id, "no_show");

    const [yusuf] = await listVolunteers();
    expect(yusuf).toMatchObject({
      phone: "+15142849137",
      name: "Yusuf Benali",
      trusted: false,
      pausedAt: null,
      signups: 1,
      noShows: 1,
      upcoming: 1,
    });
  });

  it("puts anybody paused at the top, because a pause is for reviewing", async () => {
    const task = await publishTask({
      title: "Shoe rack",
      dueBy: hoursFromNow(48),
      slotsNeeded: 2,
    });
    await claimSlot({ taskId: task.id, ...YUSUF });
    await claimSlot({ taskId: task.id, ...KHADIJA });
    await setVolunteerPaused("+15142849137", true);

    expect((await listVolunteers())[0]?.phone).toBe("+15142849137");
  });

  it("counts the same signups the person's own record page shows", async () => {
    const kept = await publishTask({ title: "Kept", dueBy: hoursFromNow(48) });
    const removed = await publishTask({ title: "Deleted later", dueBy: hoursFromNow(48) });
    await claimSlot({ taskId: kept.id, ...YUSUF });
    await claimSlot({ taskId: removed.id, ...YUSUF });
    await deleteTask(removed.id);

    // The record page leaves a deleted Task's signup out, so this must too,
    // or the two pages disagree about the same person.
    const [yusuf] = await listVolunteers();
    expect(yusuf?.signups).toBe(1);
  });

  it("keeps somebody who has signed up for nothing yet", async () => {
    await db().query("insert into volunteers (phone, name) values ('+15145551234', 'New Person')");

    const [person] = await listVolunteers();
    expect(person).toMatchObject({ name: "New Person", signups: 0, lastSignupAt: null });
  });
});

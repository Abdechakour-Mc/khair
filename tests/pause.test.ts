import { beforeEach, describe, expect, it } from "vitest";
import { recentAdminActions } from "@/core/audit";
import { db } from "@/core/db";
import {
  claimSlot,
  listSignupsForTask,
  releaseSignup,
  setOutcome,
  setVolunteerDone,
} from "@/core/signups";
import { publishTask } from "@/core/tasks";
import { isPausedVolunteer, setVolunteerPaused, volunteerStanding } from "@/core/volunteers";
import { hoursFromNow, resetDb } from "./helpers/db";

beforeEach(async () => {
  await resetDb();
  await db().query("truncate admin_actions");
});

const BILAL = { name: "Bilal Amrani", phone: "5142849137" };
const PHONE = "+15142849137";

async function openTask(title = "Jumu'ah hall setup") {
  return publishTask({ title, startsAt: hoursFromNow(26), dueBy: hoursFromNow(28), slotsNeeded: 3 });
}

/** Somebody who has signed up before, which is who a pause is ever about. */
async function withHistory() {
  const task = await openTask("Last week's setup");
  const signup = await claimSlot({ taskId: task.id, ...BILAL });
  return { task, signup };
}

describe("asking a Volunteer to pause", () => {
  it("is nobody by default", async () => {
    await withHistory();
    expect(await isPausedVolunteer(PHONE)).toBe(false);
  });

  it("records when, so the Admin can explain it later", async () => {
    await withHistory();

    const pausedAt = await setVolunteerPaused(PHONE, true);
    expect(pausedAt).toBeInstanceOf(Date);
    expect(await isPausedVolunteer(PHONE)).toBe(true);
  });

  it("can be lifted at any time, and leaves nothing behind", async () => {
    await withHistory();
    await setVolunteerPaused(PHONE, true);

    expect(await setVolunteerPaused(PHONE, false)).toBeNull();
    expect((await volunteerStanding(PHONE))?.pausedAt).toBeNull();
  });

  it("can be lifted and reapplied, since it never becomes permanent", async () => {
    await withHistory();

    await setVolunteerPaused(PHONE, true);
    await setVolunteerPaused(PHONE, false);
    await setVolunteerPaused(PHONE, true);

    expect(await isPausedVolunteer(PHONE)).toBe(true);
  });

  it("refuses a number nobody has signed up with", async () => {
    await expect(setVolunteerPaused("+15140000000", true)).rejects.toMatchObject({
      reason: "signup_missing",
    });
  });

  it("is recorded, both the pause and the lift, and names nobody", async () => {
    await withHistory();
    await setVolunteerPaused(PHONE, true);
    await setVolunteerPaused(PHONE, false);

    const recorded = await recentAdminActions();
    expect(recorded.map((entry) => entry.action)).toEqual(["lift_pause", "pause_volunteer"]);
    expect(JSON.stringify(recorded)).not.toContain("5142849137");
    expect(JSON.stringify(recorded)).not.toContain("Bilal");
  });
});

describe("what a pause stops", () => {
  it("stops a new claim", async () => {
    await withHistory();
    await setVolunteerPaused(PHONE, true);
    const task = await openTask();

    await expect(claimSlot({ taskId: task.id, ...BILAL })).rejects.toMatchObject({
      name: "ConflictError",
      reason: "volunteer_paused",
    });
  });

  it("consumes no Slot while refusing", async () => {
    await withHistory();
    await setVolunteerPaused(PHONE, true);
    const task = await openTask();

    await expect(claimSlot({ taskId: task.id, ...BILAL })).rejects.toThrow();
    expect(await listSignupsForTask(task.id)).toEqual([]);
  });

  it("lets them claim again the moment it is lifted", async () => {
    await withHistory();
    await setVolunteerPaused(PHONE, true);
    const task = await openTask();
    await setVolunteerPaused(PHONE, false);

    const signup = await claimSlot({ taskId: task.id, ...BILAL });
    expect(signup.taskId).toBe(task.id);
  });

  it("stops nobody else", async () => {
    await withHistory();
    await setVolunteerPaused(PHONE, true);
    const task = await openTask();

    const khadija = await claimSlot({ taskId: task.id, name: "Khadija", phone: "4382017744" });
    expect(khadija.taskId).toBe(task.id);
  });
});

describe("what a pause leaves alone", () => {
  it("keeps the Signups they already hold", async () => {
    const { task, signup } = await withHistory();

    await setVolunteerPaused(PHONE, true);

    const [held] = await listSignupsForTask(task.id);
    expect(held?.id).toBe(signup.id);
    expect(held?.cancelledAt).toBeNull();
  });

  it("still lets them release a Slot, so nobody is trapped in a commitment", async () => {
    const { signup } = await withHistory();
    await setVolunteerPaused(PHONE, true);

    const released = await releaseSignup(signup.cancelToken);
    expect(released.outcome).toBe("cancelled");
  });

  it("still lets them say work they hold is done", async () => {
    const task = await publishTask({ title: "Shoe rack", dueBy: hoursFromNow(48) });
    const signup = await claimSlot({ taskId: task.id, ...BILAL });
    await setVolunteerPaused(PHONE, true);

    const said = await setVolunteerDone(signup.cancelToken, true);
    expect(said.volunteerDoneAt).toBeInstanceOf(Date);
  });

  it("leaves the Admin's own record of them untouched", async () => {
    const { task, signup } = await withHistory();
    await setOutcome(signup.id, "no_show");

    await setVolunteerPaused(PHONE, true);

    const [recorded] = await listSignupsForTask(task.id);
    expect(recorded?.outcome).toBe("no_show");
  });
});

describe("what never applies a pause", () => {
  it("is a run of no-shows, however long", async () => {
    // Stated as a test because it is a rule and not an omission: the Admin
    // reads the record and decides as a human. No counter reaches this.
    for (const title of ["One", "Two", "Three", "Four"]) {
      const task = await openTask(title);
      const signup = await claimSlot({ taskId: task.id, ...BILAL });
      await setOutcome(signup.id, "no_show");
    }

    expect(await isPausedVolunteer(PHONE)).toBe(false);

    const task = await openTask("Five");
    await expect(claimSlot({ taskId: task.id, ...BILAL })).resolves.toMatchObject({
      taskId: task.id,
    });
  });

  it("is a release, however late", async () => {
    const { signup } = await withHistory();
    await releaseSignup(signup.cancelToken);

    expect(await isPausedVolunteer(PHONE)).toBe(false);
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/core/db";
import { claimSlot, listSignupsForTask } from "@/core/signups";
import {
  earlyAccessHours,
  editTask,
  getTaskWithSlots,
  listOpenTasks,
  publishTask,
  withheldFrom,
} from "@/core/tasks";
import { isTrustedVolunteer, setVolunteerTrusted } from "@/core/volunteers";
import { hoursFromNow, resetDb } from "./helpers/db";
import { openTask } from "./helpers/task";

beforeEach(resetDb);

const YUSUF = { name: "Yusuf Benali", phone: "5142849137" };
const KHADIJA = { name: "Khadija Amrani", phone: "4382017744" };

/** Published `hours` ago, so the window can be moved past without waiting. */
async function importantTaskPublished(hoursAgo: number) {
  const task = await publishTask({
    title: "Driving the imam to the airport",
    dueBy: hoursFromNow(72),
    important: true,
  });
  await db().query("update tasks set created_at = $2 where id = $1", [
    task.id,
    hoursFromNow(-hoursAgo),
  ]);
  return task;
}

async function trust(phone: string, name: string) {
  await db().query(
    `insert into volunteers (phone, name, trusted) values ($1, $2, true)
     on conflict (phone) do update set trusted = true`,
    [phone, name],
  );
}

describe("marking a Volunteer trusted", () => {
  it("is nobody by default", async () => {
    await claimSlot({
      taskId: (await publishTask({ title: "Shoe rack", dueBy: hoursFromNow(48) })).id,
      ...YUSUF,
    });

    expect(await isTrustedVolunteer("+15142849137")).toBe(false);
  });

  it("is the Admin's deliberate choice, and can be taken back", async () => {
    await claimSlot({
      taskId: (await publishTask({ title: "Shoe rack", dueBy: hoursFromNow(48) })).id,
      ...YUSUF,
    });

    await setVolunteerTrusted("+15142849137", true);
    expect(await isTrustedVolunteer("+15142849137")).toBe(true);

    await setVolunteerTrusted("+15142849137", false);
    expect(await isTrustedVolunteer("+15142849137")).toBe(false);
  });

  it("refuses a number nobody has signed up with", async () => {
    await expect(setVolunteerTrusted("+15140000000", true)).rejects.toMatchObject({
      reason: "signup_missing",
    });
  });

  it("is false for a number that was never here, rather than an error", async () => {
    expect(await isTrustedVolunteer("+15140000000")).toBe(false);
    expect(await isTrustedVolunteer("")).toBe(false);
  });
});

describe("marking a Task important", () => {
  it("is nothing by default", async () => {
    const task = await publishTask({ title: "Shoe rack", dueBy: hoursFromNow(48) });
    expect(task.important).toBe(false);
  });

  it("is set when publishing and changed when editing", async () => {
    const task = await publishTask({
      title: "Driving the imam",
      dueBy: hoursFromNow(48),
      important: true,
    });
    expect(task.important).toBe(true);

    const edited = await editTask(task.id, { title: "Driving the imam", dueBy: hoursFromNow(48) });
    expect(edited.important).toBe(false);
  });
});

describe("who an important Task is withheld from", () => {
  const stranger = { trusted: false };
  const reliedUpon = { trusted: true };

  it("is nobody, when the Task is not important", () => {
    const ordinary = openTask({ id: "a", createdAt: new Date("2026-10-10T00:00:00Z") });
    expect(withheldFrom(ordinary, stranger, new Date("2026-10-10T01:00:00Z"))).toBe(false);
  });

  it("is everybody else, inside the window", () => {
    const important = openTask({
      id: "b",
      important: true,
      createdAt: new Date("2026-10-10T00:00:00Z"),
    });
    expect(withheldFrom(important, stranger, new Date("2026-10-10T01:00:00Z"))).toBe(true);
    expect(withheldFrom(important, reliedUpon, new Date("2026-10-10T01:00:00Z"))).toBe(false);
  });

  it("is nobody once the window has passed, with no Admin action", () => {
    const important = openTask({
      id: "c",
      important: true,
      createdAt: new Date("2026-10-10T00:00:00Z"),
    });
    const later = new Date("2026-10-10T00:00:00Z");
    later.setUTCHours(later.getUTCHours() + earlyAccessHours() + 1);

    expect(withheldFrom(important, stranger, later)).toBe(false);
  });
});

describe("the public list during an early-access window", () => {
  it("leaves an important Task out for everybody else", async () => {
    await importantTaskPublished(0);
    await publishTask({ title: "Shoe rack", dueBy: hoursFromNow(48) });

    const forStranger = await listOpenTasks();
    expect(forStranger.map((t) => t.title)).toEqual(["Shoe rack"]);
  });

  it("includes it for somebody the Admin relies on", async () => {
    await importantTaskPublished(0);
    await publishTask({ title: "Shoe rack", dueBy: hoursFromNow(48) });

    const forTrusted = await listOpenTasks(new Date(), { trusted: true });
    expect(forTrusted.map((t) => t.title)).toContain("Driving the imam to the airport");
  });

  it("includes it for everybody once the window has passed", async () => {
    await importantTaskPublished(earlyAccessHours() + 1);

    const forStranger = await listOpenTasks();
    expect(forStranger.map((t) => t.title)).toContain("Driving the imam to the airport");
  });

  it("says nothing about why the list is shorter", async () => {
    await importantTaskPublished(0);

    const forStranger = await listOpenTasks();
    // No placeholder, no "1 task hidden", nothing to notice at all.
    expect(forStranger).toEqual([]);
  });
});

describe("claiming during an early-access window", () => {
  it("is refused for somebody the Admin has not marked trusted", async () => {
    const task = await importantTaskPublished(0);

    await expect(claimSlot({ taskId: task.id, ...YUSUF })).rejects.toMatchObject({
      // The same answer as a Task that does not exist: a refusal that said
      // "this is reserved for trusted volunteers" would reveal the window.
      reason: "task_missing",
    });
  });

  it("is allowed for a trusted Volunteer, by their number and not a cookie", async () => {
    const task = await importantTaskPublished(0);
    await trust("+15142849137", "Yusuf Benali");

    const signup = await claimSlot({ taskId: task.id, ...YUSUF });
    expect(signup.taskId).toBe(task.id);
  });

  it("is allowed for anybody once the window has passed", async () => {
    const task = await importantTaskPublished(earlyAccessHours() + 1);

    const signup = await claimSlot({ taskId: task.id, ...KHADIJA });
    expect(signup.taskId).toBe(task.id);
  });

  it("leaves the Slots a trusted Volunteer took during the window", async () => {
    const task = await importantTaskPublished(0);
    await trust("+15142849137", "Yusuf Benali");
    await claimSlot({ taskId: task.id, ...YUSUF });

    await db().query("update tasks set created_at = $2 where id = $1", [
      task.id,
      hoursFromNow(-(earlyAccessHours() + 1)),
    ]);

    expect(await listSignupsForTask(task.id)).toHaveLength(1);
    expect((await getTaskWithSlots(task.id))?.slotsTaken).toBe(1);
  });
});

describe("the early-access window", () => {
  it("is configuration, not a constant in the code", () => {
    vi.stubEnv("EARLY_ACCESS_HOURS", "6");
    expect(earlyAccessHours()).toBe(6);
    vi.unstubAllEnvs();
  });

  it("falls back to a day", () => {
    vi.stubEnv("EARLY_ACCESS_HOURS", "");
    expect(earlyAccessHours()).toBe(24);
    vi.unstubAllEnvs();
  });
});

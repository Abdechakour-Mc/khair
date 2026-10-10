import { beforeEach, describe, expect, it, vi } from "vitest";
import { recentAdminActions } from "@/core/audit";
import { db } from "@/core/db";
import {
  clearSyntheticData,
  countSyntheticRecords,
  countVolunteerRecords,
  forgetVolunteer,
} from "@/core/erasure";
import { finaliseDeletedTasks, previewPurge, purgeExpiredSignups } from "@/core/retention";
import { claimSlot, listSignupsForTask, setOutcome, volunteerHistory } from "@/core/signups";
import {
  deleteTask,
  getTaskWithSlots,
  listDeletedTasks,
  listOpenTasks,
  listTasksForAdmin,
  publishTask,
  restoreTask,
  undoWindowMinutes,
} from "@/core/tasks";
import { hoursFromNow, resetDb } from "./helpers/db";

beforeEach(async () => {
  await resetDb();
  await db().query("truncate admin_actions");
});

const YUSUF = { name: "Yusuf Benali", phone: "5142849137" };
const KHADIJA = { name: "Khadija Amrani", phone: "4382017744" };

async function taskWithBoth() {
  const task = await publishTask({
    title: "Jumu'ah hall setup",
    startsAt: hoursFromNow(26),
    dueBy: hoursFromNow(28),
    slotsNeeded: 3,
  });
  await claimSlot({ taskId: task.id, ...YUSUF });
  await claimSlot({ taskId: task.id, ...KHADIJA });
  return task;
}

/**
 * The answer to a congregant who asks what the app knows about them and asks
 * for it to be deleted. It has to be complete: afterwards no page, Outcome or
 * history anywhere mentions them.
 */
describe("forgetting one Volunteer", () => {
  it("counts what will go before anything goes", async () => {
    await taskWithBoth();

    const counted = await countVolunteerRecords("+15142849137");
    expect(counted).toEqual({ signups: 1, volunteers: 1 });
  });

  it("counts nothing for a number that was never here", async () => {
    expect(await countVolunteerRecords("+15140000000")).toEqual({ signups: 0, volunteers: 0 });
  });

  it("refuses when the typed number does not match", async () => {
    await taskWithBoth();

    await expect(forgetVolunteer("+15142849137", "+14382017744")).rejects.toMatchObject({
      name: "ConflictError",
      reason: "confirmation_mismatch",
    });

    expect(await countVolunteerRecords("+15142849137")).toEqual({ signups: 1, volunteers: 1 });
  });

  it("accepts the number typed the way a person would type it", async () => {
    await taskWithBoth();

    // The Admin reads "(514) 284-9137" off the page and types that.
    const result = await forgetVolunteer("+15142849137", "(514) 284-9137");
    expect(result).toEqual({ signups: 1, volunteers: 1 });
  });

  it("leaves nothing behind in any history or list", async () => {
    const task = await taskWithBoth();

    await forgetVolunteer("+15142849137", "+15142849137");

    expect(await volunteerHistory("+15142849137")).toEqual([]);
    const names = (await listSignupsForTask(task.id)).map((s) => s.nameSnapshot);
    expect(names).toEqual(["Khadija Amrani"]);
    const { rows } = await db().query("select 1 from volunteers where phone = $1", [
      "+15142849137",
    ]);
    expect(rows).toHaveLength(0);
  });

  it("takes an Admin-recorded no-show with it", async () => {
    const task = await taskWithBoth();
    const [theirs] = await listSignupsForTask(task.id);
    await setOutcome(theirs!.id, "no_show");

    await forgetVolunteer(theirs!.volunteerPhone, theirs!.volunteerPhone);

    expect(await listSignupsForTask(task.id)).toHaveLength(1);
  });

  it("keeps the Tasks, which hold no personal data", async () => {
    const task = await taskWithBoth();

    await forgetVolunteer("+15142849137", "+15142849137");

    expect(await getTaskWithSlots(task.id)).toMatchObject({ id: task.id, slotsTaken: 1 });
  });

  it("gives the released Slot back", async () => {
    const task = await publishTask({ title: "Shoe rack", dueBy: hoursFromNow(28) });
    await claimSlot({ taskId: task.id, ...YUSUF });
    expect((await getTaskWithSlots(task.id))?.isFull).toBe(true);

    await forgetVolunteer("+15142849137", "+15142849137");

    expect((await getTaskWithSlots(task.id))?.isFull).toBe(false);
  });

  it("touches nobody else", async () => {
    const task = await taskWithBoth();

    await forgetVolunteer("+15142849137", "+15142849137");

    expect(await volunteerHistory("+14382017744")).toHaveLength(1);
    expect(await listSignupsForTask(task.id)).toHaveLength(1);
  });

  it("is recorded, without recording who it was about", async () => {
    await taskWithBoth();
    await forgetVolunteer("+15142849137", "+15142849137");

    const [recorded] = await recentAdminActions();
    expect(recorded?.action).toBe("forget_volunteer");
    // An audit row describing an erasure must not be the one place the
    // erased person survives.
    expect(JSON.stringify(recorded)).not.toContain("5142849137");
    expect(JSON.stringify(recorded)).not.toContain("Yusuf");
  });
});

/**
 * Reversible, so not confirmed: the Task goes out of sight at once and the
 * undo rescues the mistake, which is what WCAG 2.2 3.3.4 accepts and what the
 * usability finding on undo-versus-confirm recommends.
 */
describe("deleting one Task", () => {
  it("takes it off the public list immediately", async () => {
    const task = await taskWithBoth();

    await deleteTask(task.id);

    expect(await listOpenTasks()).toEqual([]);
    expect(await getTaskWithSlots(task.id)).toBeNull();
  });

  it("cannot be claimed while it is deleted", async () => {
    const task = await publishTask({ title: "Shoe rack", dueBy: hoursFromNow(28) });
    await deleteTask(task.id);

    await expect(claimSlot({ taskId: task.id, ...YUSUF })).rejects.toMatchObject({
      reason: "task_missing",
    });
  });

  it("is listed separately for the Admin, not silently gone", async () => {
    const task = await taskWithBoth();
    await deleteTask(task.id);

    const forAdmin = await listTasksForAdmin();
    expect(forAdmin.map((t) => t.id)).not.toContain(task.id);

    const deleted = await listDeletedTasks();
    expect(deleted.map((t) => t.id)).toEqual([task.id]);
  });

  it("comes back whole, with everybody still signed up", async () => {
    const task = await taskWithBoth();
    await deleteTask(task.id);

    const restored = await restoreTask(task.id);

    expect(restored.id).toBe(task.id);
    expect(await listSignupsForTask(task.id)).toHaveLength(2);
    expect((await getTaskWithSlots(task.id))?.slotsTaken).toBe(2);
  });

  it("refuses to undo once the window has passed", async () => {
    const task = await taskWithBoth();
    await deleteTask(task.id);

    await db().query(
      "update tasks set deleted_at = now() - ($2 || ' minutes')::interval where id = $1",
      [task.id, undoWindowMinutes() + 1],
    );

    await expect(restoreTask(task.id)).rejects.toMatchObject({ reason: "undo_expired" });
  });

  it("refuses to undo a Task that was never deleted", async () => {
    const task = await taskWithBoth();
    await expect(restoreTask(task.id)).rejects.toMatchObject({ reason: "task_missing" });
  });

  it("is finished for real once the window has passed", async () => {
    const task = await taskWithBoth();
    await deleteTask(task.id);
    await db().query(
      "update tasks set deleted_at = now() - ($2 || ' minutes')::interval where id = $1",
      [task.id, undoWindowMinutes() + 1],
    );

    expect(await finaliseDeletedTasks()).toEqual({ tasksDeleted: 1, signupsDeleted: 2 });

    const { rows } = await db().query("select 1 from tasks where id = $1", [task.id]);
    expect(rows).toHaveLength(0);
  });

  it("leaves a Task still inside its window alone", async () => {
    const task = await taskWithBoth();
    await deleteTask(task.id);

    expect(await finaliseDeletedTasks()).toEqual({ tasksDeleted: 0, signupsDeleted: 0 });
    await expect(restoreTask(task.id)).resolves.toMatchObject({ id: task.id });
  });

  it("is recorded", async () => {
    const task = await taskWithBoth();
    await deleteTask(task.id);
    await restoreTask(task.id);

    const actions = (await recentAdminActions()).map((entry) => entry.action);
    expect(actions).toEqual(["restore_task", "delete_task"]);
  });
});

/**
 * Ticket 09 seeds synthetic Volunteers from the +1 555 01xx block that NANP
 * reserves for fiction, so the whole set is identifiable by pattern and
 * removable in one statement before the app reaches the congregation.
 */
describe("clearing synthetic data", () => {
  const SYNTHETIC = "+15550101";
  const PHRASE = "clear demo data";

  async function syntheticSignup(taskId: string) {
    await db().query(
      `insert into volunteers (phone, name) values ($1, $2)
       on conflict (phone) do nothing`,
      [SYNTHETIC, "Demo Volunteer"],
    );
    await db().query(
      `insert into signups (task_id, volunteer_phone, name_snapshot, cancel_token)
       values ($1, $2, $3, $4)`,
      [taskId, SYNTHETIC, "Demo Volunteer", `demo-${Math.random()}`],
    );
  }

  it("counts the synthetic records and nothing else", async () => {
    const task = await taskWithBoth();
    await syntheticSignup(task.id);

    // The Task here is a real one, so it is not part of the demo set.
    expect(await countSyntheticRecords()).toEqual({ signups: 1, volunteers: 1, tasks: 0 });
  });

  it("refuses without the exact phrase", async () => {
    const task = await taskWithBoth();
    await syntheticSignup(task.id);

    await expect(clearSyntheticData("clear the demo data")).rejects.toMatchObject({
      reason: "confirmation_mismatch",
    });
    expect(await countSyntheticRecords()).toEqual({ signups: 1, volunteers: 1, tasks: 0 });
  });

  it("deletes every synthetic record", async () => {
    const task = await taskWithBoth();
    await syntheticSignup(task.id);

    expect(await clearSyntheticData(PHRASE)).toEqual({ signups: 1, volunteers: 1, tasks: 0 });
    expect(await countSyntheticRecords()).toEqual({ signups: 0, volunteers: 0, tasks: 0 });
  });

  it("leaves every real record untouched", async () => {
    const task = await taskWithBoth();
    await syntheticSignup(task.id);

    await clearSyntheticData(PHRASE);

    expect(await listSignupsForTask(task.id)).toHaveLength(2);
    expect(await volunteerHistory("+15142849137")).toHaveLength(1);
    expect(await getTaskWithSlots(task.id)).toMatchObject({ id: task.id });
  });

  it("will not reach a number outside the reserved block even by one digit", async () => {
    const task = await publishTask({ title: "Shoe rack", dueBy: hoursFromNow(28) });
    // +1 555 02xx is not the fictional block, so it is treated as real.
    await db().query("insert into volunteers (phone, name) values ($1, $2)", [
      "+15550201",
      "Not Synthetic",
    ]);
    await db().query(
      `insert into signups (task_id, volunteer_phone, name_snapshot, cancel_token)
       values ($1, $2, $3, 'outside-the-block')`,
      [task.id, "+15550201", "Not Synthetic"],
    );

    expect(await countSyntheticRecords()).toEqual({ signups: 0, volunteers: 0, tasks: 0 });
    await clearSyntheticData(PHRASE);

    const { rows } = await db().query("select 1 from volunteers where phone = $1", ["+15550201"]);
    expect(rows).toHaveLength(1);
  });

  it("is recorded", async () => {
    await clearSyntheticData(PHRASE);
    const [recorded] = await recentAdminActions();
    expect(recorded?.action).toBe("clear_synthetic");
  });
});

describe("running the retention purge by hand", () => {
  it("says what it would delete without deleting it", async () => {
    const task = await publishTask({
      title: "Old work",
      dueBy: hoursFromNow(24),
      slotsNeeded: 2,
    });
    await claimSlot({ taskId: task.id, ...YUSUF });
    await db().query("update tasks set due_by = now() - interval '7 months' where id = $1", [
      task.id,
    ]);

    expect(await previewPurge()).toEqual({ signups: 1, volunteers: 1 });

    // Nothing moved: the Admin has only looked.
    expect(await volunteerHistory("+15142849137")).toHaveLength(1);
  });

  it("matches what the purge then does", async () => {
    const task = await publishTask({ title: "Old work", dueBy: hoursFromNow(24) });
    await claimSlot({ taskId: task.id, ...YUSUF });
    await db().query("update tasks set due_by = now() - interval '7 months' where id = $1", [
      task.id,
    ]);

    const preview = await previewPurge();
    const done = await purgeExpiredSignups();

    expect({ signups: done.signupsDeleted, volunteers: done.volunteersDeleted }).toEqual(preview);
  });

  it("previews nothing when nothing is old enough", async () => {
    await taskWithBoth();
    expect(await previewPurge()).toEqual({ signups: 0, volunteers: 0 });
  });
});

describe("the undo window", () => {
  it("is configuration, not a constant in the code", () => {
    vi.stubEnv("UNDO_WINDOW_MINUTES", "5");
    expect(undoWindowMinutes()).toBe(5);
    vi.unstubAllEnvs();
  });

  it("falls back to a sensible short window", () => {
    vi.stubEnv("UNDO_WINDOW_MINUTES", "");
    expect(undoWindowMinutes()).toBe(30);
    vi.unstubAllEnvs();
  });
});

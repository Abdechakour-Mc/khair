import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/core/db";
import { ValidationError } from "@/core/errors";
import { editTask, getTaskWithSlots, listOpenTasks, publishTask } from "@/core/tasks";
import { hoursFromNow, resetDb } from "./helpers/db";

beforeEach(resetDb);

/**
 * Who a Task is open to is a fact about the work, never about the person
 * claiming it. These tests exist partly to pin that down: there is nothing
 * here about a Volunteer's gender because Khair stores none.
 */
describe("who a Task is open to", () => {
  it("is anyone, unless the Admin says otherwise", async () => {
    const task = await publishTask({ title: "Shoe rack", dueBy: hoursFromNow(48) });
    expect(task.openTo).toBe("anyone");
  });

  it("can be the brothers", async () => {
    const task = await publishTask({
      title: "Carrying tables",
      dueBy: hoursFromNow(48),
      openTo: "brothers",
    });
    expect(task.openTo).toBe("brothers");
  });

  it("can be the sisters", async () => {
    const task = await publishTask({
      title: "Sisters' entrance welcome desk",
      dueBy: hoursFromNow(48),
      openTo: "sisters",
    });
    expect(task.openTo).toBe("sisters");
  });

  it("refuses anything else, as a validation error the form can show", async () => {
    await expect(
      publishTask({
        title: "Shoe rack",
        dueBy: hoursFromNow(48),
        // Only the three values exist; this stands in for a tampered form.
        openTo: "everyone" as never,
      }),
    ).rejects.toMatchObject({ name: "ValidationError", code: "open_to_invalid" });
  });

  it("refuses it before writing anything", async () => {
    await expect(
      publishTask({ title: "Shoe rack", dueBy: hoursFromNow(48), openTo: "men" as never }),
    ).rejects.toBeInstanceOf(ValidationError);

    const { rows } = await db().query<{ count: string }>("select count(*) as count from tasks");
    expect(rows[0]?.count).toBe("0");
  });

  it("is corrected by editing, like any other mistyped field", async () => {
    const task = await publishTask({
      title: "Welcome desk",
      dueBy: hoursFromNow(48),
      openTo: "brothers",
    });

    const edited = await editTask(task.id, {
      title: "Welcome desk",
      dueBy: hoursFromNow(48),
      openTo: "sisters",
    });
    expect(edited.openTo).toBe("sisters");
  });

  it("goes back to anyone when the Admin clears it", async () => {
    const task = await publishTask({
      title: "Welcome desk",
      dueBy: hoursFromNow(48),
      openTo: "sisters",
    });

    const edited = await editTask(task.id, { title: "Welcome desk", dueBy: hoursFromNow(48) });
    expect(edited.openTo).toBe("anyone");
  });

  it("reaches the public list and the Task page, which have to say so", async () => {
    const task = await publishTask({
      title: "Sisters' section tidy",
      dueBy: hoursFromNow(48),
      openTo: "sisters",
    });

    expect((await listOpenTasks())[0]?.openTo).toBe("sisters");
    expect((await getTaskWithSlots(task.id))?.openTo).toBe("sisters");
  });

  it("does not change who can claim it, because nothing here is verifiable", async () => {
    // Stated for the record: the Task says who it needs, and the core does
    // not pretend to enforce it. There is no gender to check against.
    const task = await publishTask({
      title: "Sisters' entrance",
      dueBy: hoursFromNow(48),
      openTo: "sisters",
    });
    const { claimSlot } = await import("@/core/signups");

    const signup = await claimSlot({ taskId: task.id, name: "Khadija", phone: "4382017744" });
    expect(signup.taskId).toBe(task.id);
  });
});

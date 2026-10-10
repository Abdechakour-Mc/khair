import { beforeEach, describe, expect, it } from "vitest";
import { db, inTransaction } from "@/core/db";
import { ConflictError } from "@/core/errors";
import { retentionCutoff } from "@/core/retention";
import {
  claimSlot,
  listSignupsForTask,
  releaseSignup,
  setOutcome,
  volunteerHistory,
} from "@/core/signups";
import { editTask, getTaskWithSlots, publishTask, setTaskClosed } from "@/core/tasks";
import { decodeParam } from "@/view/params";
import { hoursFromNow, resetDb } from "./helpers/db";

beforeEach(resetDb);

const YUSUF = { name: "Yusuf Benali", phone: "5142849137" };

/**
 * A Task cannot be published into the past and a passed Task cannot be
 * claimed, so a fixture that needs work which has already happened has to
 * claim first and age the Task afterwards: the order real life happens in.
 */
async function claimedThenHappened(shape: "fixed" | "flexible") {
  const task = await publishTask({
    title: "Shoe rack",
    startsAt: shape === "fixed" ? hoursFromNow(26) : null,
    dueBy: hoursFromNow(28),
  });
  const signup = await claimSlot({ taskId: task.id, ...YUSUF });

  await db().query(
    "update tasks set starts_at = $2, due_by = $3 where id = $1",
    [task.id, shape === "fixed" ? hoursFromNow(-4) : null, hoursFromNow(-2)],
  );
  return { task, signup };
}

describe("releasing a Slot after the work has happened", () => {
  it("refuses, so a no-show cannot be erased by the person who did not come", async () => {
    const { signup } = await claimedThenHappened("fixed");
    await setOutcome(signup.id, "no_show");

    await expect(releaseSignup(signup.cancelToken)).rejects.toMatchObject({
      name: "ConflictError",
      reason: "task_happened",
    });
  });

  it("leaves the Admin's record exactly as the Admin left it", async () => {
    const { task, signup } = await claimedThenHappened("fixed");
    await setOutcome(signup.id, "no_show");

    await expect(releaseSignup(signup.cancelToken)).rejects.toBeInstanceOf(ConflictError);

    const [recorded] = await listSignupsForTask(task.id);
    expect(recorded?.outcome).toBe("no_show");
    expect(recorded?.cancelledAt).toBeNull();
  });

  it("measures a flexible Task by its Deadline", async () => {
    const { signup } = await claimedThenHappened("flexible");

    await expect(releaseSignup(signup.cancelToken)).rejects.toMatchObject({
      reason: "task_happened",
    });
  });

  it("still lets a Volunteer out of work that has not happened yet", async () => {
    const task = await publishTask({
      title: "Jumu'ah hall setup",
      startsAt: hoursFromNow(26),
      dueBy: hoursFromNow(28),
    });
    const signup = await claimSlot({ taskId: task.id, ...YUSUF });

    const released = await releaseSignup(signup.cancelToken);
    expect(released.outcome).toBe("cancelled");
  });

  it("stays a success for somebody who released in good time and taps again later", async () => {
    const task = await publishTask({
      title: "Jumu'ah hall setup",
      startsAt: hoursFromNow(26),
      dueBy: hoursFromNow(28),
    });
    const signup = await claimSlot({ taskId: task.id, ...YUSUF });
    await releaseSignup(signup.cancelToken);

    await db().query("update tasks set starts_at = $2, due_by = $3 where id = $1", [
      task.id,
      hoursFromNow(-4),
      hoursFromNow(-2),
    ]);

    // Their own release stands; a second tap on a saved link is not a failure.
    const again = await releaseSignup(signup.cancelToken);
    expect(again.outcome).toBe("cancelled");
  });
});

/**
 * `/^[0-9a-f-]{36}$/i` accepted strings Postgres cannot cast to `uuid`, so a
 * crafted URL raised 22P02 and the visitor got an untranslated error page
 * instead of the not-found page the guard existed to produce.
 */
describe("an id that is the right shape but not a UUID", () => {
  const NOT_A_UUID = "-".repeat(36);

  it("is not found rather than a database error", async () => {
    await expect(getTaskWithSlots(NOT_A_UUID)).resolves.toBeNull();
  });

  it("cannot be claimed", async () => {
    await expect(claimSlot({ taskId: NOT_A_UUID, ...YUSUF })).rejects.toMatchObject({
      reason: "task_missing",
    });
  });

  it("lists no Signups", async () => {
    await expect(listSignupsForTask(NOT_A_UUID)).resolves.toEqual([]);
  });

  it("records no Outcome", async () => {
    await expect(setOutcome(NOT_A_UUID, "no_show")).rejects.toMatchObject({
      reason: "signup_missing",
    });
  });

  it("cannot be closed", async () => {
    await expect(setTaskClosed(NOT_A_UUID, true)).rejects.toMatchObject({
      reason: "task_missing",
    });
  });

  it("cannot be edited, and says so accurately", async () => {
    await expect(
      editTask(NOT_A_UUID, { title: "Shoe rack", dueBy: hoursFromNow(4) }),
    ).rejects.toMatchObject({ name: "ConflictError", reason: "task_missing" });
  });

  it("does not stop a real id working", async () => {
    const task = await publishTask({ title: "Shoe rack", dueBy: hoursFromNow(4) });
    await expect(getTaskWithSlots(task.id)).resolves.toMatchObject({ id: task.id });
  });
});

describe("editing a Task that is no longer there", () => {
  it("reports it accurately rather than as an unknown failure", async () => {
    await expect(
      editTask("27f1a4e0-0000-4000-8000-000000000000", {
        title: "Shoe rack",
        dueBy: hoursFromNow(4),
      }),
    ).rejects.toMatchObject({ name: "ConflictError", reason: "task_missing" });
  });
});

describe("a transaction whose rollback cannot be sent", () => {
  it("reports the original cause, not the failure of the rollback", async () => {
    const realCause = new Error("the thing that actually went wrong");

    await expect(
      inTransaction(async (client) => {
        const { rows } = await client.query<{ pid: number }>("select pg_backend_pid() as pid");
        // Kill this transaction's own connection from another one, so the
        // rollback below has nowhere to go.
        await db().query("select pg_terminate_backend($1)", [rows[0]?.pid]);
        throw realCause;
      }),
    ).rejects.toBe(realCause);
  });

  it("does not hand the broken connection back to the pool", async () => {
    await expect(
      inTransaction(async (client) => {
        const { rows } = await client.query<{ pid: number }>("select pg_backend_pid() as pid");
        await db().query("select pg_terminate_backend($1)", [rows[0]?.pid]);
        throw new Error("boom");
      }),
    ).rejects.toThrow();

    // A client still inside an aborted transaction would fail every later
    // query with 25P02. The next caller must get a healthy connection.
    const { rows } = await db().query<{ ok: number }>("select 1 as ok");
    expect(rows[0]?.ok).toBe(1);
  });
});

/**
 * `setUTCMonth` overflows on long months: on 31 August, six months back is
 * "28 February + 3", which lands on 3 March and deletes Signups after five
 * months and twenty-nine days. The stated policy is six months.
 */
describe("the retention cutoff", () => {
  it("does not overshoot into the following month", () => {
    const cutoff = retentionCutoff(new Date("2026-08-31T12:00:00.000Z"), 6);
    expect(cutoff.toISOString()).toBe("2026-02-28T12:00:00.000Z");
  });

  it("clamps to the last day of a short month", () => {
    expect(retentionCutoff(new Date("2026-03-31T00:00:00.000Z"), 1).toISOString()).toBe(
      "2026-02-28T00:00:00.000Z",
    );
    expect(retentionCutoff(new Date("2024-03-31T00:00:00.000Z"), 1).toISOString()).toBe(
      "2024-02-29T00:00:00.000Z",
    );
  });

  it("is an ordinary shift when the day exists in the earlier month", () => {
    expect(retentionCutoff(new Date("2026-08-15T09:30:00.000Z"), 6).toISOString()).toBe(
      "2026-02-15T09:30:00.000Z",
    );
  });

  it("crosses a year boundary", () => {
    expect(retentionCutoff(new Date("2026-01-31T00:00:00.000Z"), 2).toISOString()).toBe(
      "2025-11-30T00:00:00.000Z",
    );
  });
});

describe("a Volunteer's record", () => {
  it("does not claim somebody attended work that has not happened yet", async () => {
    const task = await publishTask({
      title: "Next Friday's setup",
      startsAt: hoursFromNow(26),
      dueBy: hoursFromNow(28),
    });
    await claimSlot({ taskId: task.id, ...YUSUF });

    const [entry] = await volunteerHistory("+15142849137");
    expect(entry?.outcome).toBe("done");
    expect(entry?.pending).toBe(true);
  });

  it("reports work that has happened as settled", async () => {
    const { signup } = await claimedThenHappened("fixed");

    const [entry] = await volunteerHistory("+15142849137");
    expect(entry?.signupId).toBe(signup.id);
    expect(entry?.pending).toBe(false);
  });

  it("counts a released Slot as settled whenever it was released", async () => {
    const task = await publishTask({
      title: "Next Friday's setup",
      startsAt: hoursFromNow(26),
      dueBy: hoursFromNow(28),
    });
    const signup = await claimSlot({ taskId: task.id, ...YUSUF });
    await releaseSignup(signup.cancelToken);

    const [entry] = await volunteerHistory("+15142849137");
    expect(entry?.outcome).toBe("cancelled");
    expect(entry?.pending).toBe(false);
  });
});

/**
 * Next hands a dynamic param over still percent-encoded, so the Admin's
 * volunteer pages have to decode it; and a crafted segment is not always
 * valid encoding, so the decode has to survive that rather than 500.
 */
describe("a phone number arriving in a URL", () => {
  it("is decoded, so it matches the number that was stored", () => {
    expect(decodeParam("%2B15142849137")).toBe("+15142849137");
  });

  it("survives a segment that is not valid encoding", () => {
    expect(decodeParam("%")).toBe("%");
    expect(decodeParam("%zz")).toBe("%zz");
  });

  it("leaves an already-plain segment alone", () => {
    expect(decodeParam("+15142849137")).toBe("+15142849137");
  });
});

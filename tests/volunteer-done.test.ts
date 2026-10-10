import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/core/db";
import {
  claimSlot,
  findSignupByCancelToken,
  listSignupsForTask,
  releaseSignup,
  setOutcome,
  setVolunteerDone,
} from "@/core/signups";
import { publishTask } from "@/core/tasks";
import { hoursFromNow, resetDb } from "./helpers/db";

beforeEach(resetDb);

const YUSUF = { name: "Yusuf Benali", phone: "5142849137" };

/** A flexible Task: no start, so it can be finished early and said so. */
async function flexibleClaim() {
  const task = await publishTask({ title: "Shoe rack repair", dueBy: hoursFromNow(48) });
  const signup = await claimSlot({ taskId: task.id, ...YUSUF });
  return { task, signup };
}

/** A fixed Task that has not started yet. */
async function fixedClaim() {
  const task = await publishTask({
    title: "Jumu'ah hall setup",
    startsAt: hoursFromNow(26),
    dueBy: hoursFromNow(28),
  });
  const signup = await claimSlot({ taskId: task.id, ...YUSUF });
  return { task, signup };
}

describe("a Volunteer saying they have done the work", () => {
  it("needs no login, only their own link", async () => {
    const { signup } = await flexibleClaim();

    const said = await setVolunteerDone(signup.cancelToken, true);
    expect(said.volunteerDoneAt).toBeInstanceOf(Date);
  });

  it("can be taken back, because people mistap", async () => {
    const { signup } = await flexibleClaim();
    await setVolunteerDone(signup.cancelToken, true);

    const takenBack = await setVolunteerDone(signup.cancelToken, false);
    expect(takenBack.volunteerDoneAt).toBeNull();
  });

  it("records one timestamp for a double tap", async () => {
    const { signup } = await flexibleClaim();

    const first = await setVolunteerDone(signup.cancelToken, true);
    const second = await setVolunteerDone(signup.cancelToken, true);

    expect(second.volunteerDoneAt).toEqual(first.volunteerDoneAt);
  });

  it("is visible on the link they keep", async () => {
    const { signup } = await flexibleClaim();
    await setVolunteerDone(signup.cancelToken, true);

    const found = await findSignupByCancelToken(signup.cancelToken);
    expect(found?.volunteerDoneAt).toBeInstanceOf(Date);
  });

  it("refuses a link that matches no Signup, the same way releasing does", async () => {
    await expect(setVolunteerDone("not-a-token", true)).rejects.toMatchObject({
      name: "ConflictError",
      reason: "signup_missing",
    });
  });
});

describe("when it can be said", () => {
  it("is any time for a flexible Task, which may be finished early", async () => {
    const { signup } = await flexibleClaim();

    await expect(setVolunteerDone(signup.cancelToken, true)).resolves.toMatchObject({
      id: signup.id,
    });
  });

  it("is refused for a fixed Task that has not started", async () => {
    const { signup } = await fixedClaim();

    await expect(setVolunteerDone(signup.cancelToken, true)).rejects.toMatchObject({
      reason: "task_not_started",
    });
  });

  it("is allowed for a fixed Task once it has started", async () => {
    const { task, signup } = await fixedClaim();
    await db().query("update tasks set starts_at = now() - interval '10 minutes' where id = $1", [
      task.id,
    ]);

    await expect(setVolunteerDone(signup.cancelToken, true)).resolves.toMatchObject({
      id: signup.id,
    });
  });

  it("is refused once the Slot has been released", async () => {
    const { signup } = await flexibleClaim();
    await releaseSignup(signup.cancelToken);

    await expect(setVolunteerDone(signup.cancelToken, true)).rejects.toMatchObject({
      reason: "signup_released",
    });
  });

  it("can still be taken back after the Deadline has passed", async () => {
    const { task, signup } = await flexibleClaim();
    await setVolunteerDone(signup.cancelToken, true);
    await db().query("update tasks set due_by = now() - interval '1 hour' where id = $1", [
      task.id,
    ]);

    // Correcting a mistaken tap is not the same as making a new claim, so
    // the passed Deadline does not freeze it.
    await expect(setVolunteerDone(signup.cancelToken, false)).resolves.toMatchObject({
      volunteerDoneAt: null,
    });
  });
});

describe("what the Admin sees", () => {
  it("has their own Outcome left completely alone", async () => {
    const { signup } = await flexibleClaim();

    const said = await setVolunteerDone(signup.cancelToken, true);
    expect(said.outcome).toBe("done");
    expect(said.cancelledAt).toBeNull();
  });

  it("shows the disagreement when the Admin says otherwise", async () => {
    const { task, signup } = await flexibleClaim();
    await setVolunteerDone(signup.cancelToken, true);

    // The Admin marks them absent anyway. Both facts stand.
    await setOutcome(signup.id, "no_show");

    const [recorded] = await listSignupsForTask(task.id);
    expect(recorded?.outcome).toBe("no_show");
    expect(recorded?.volunteerDoneAt).toBeInstanceOf(Date);
  });

  it("keeps the Admin's no-show when the Volunteer says they did come", async () => {
    const { signup } = await flexibleClaim();
    await setOutcome(signup.id, "no_show");

    const said = await setVolunteerDone(signup.cancelToken, true);

    // The Volunteer writes their own column and nothing else.
    expect(said.outcome).toBe("no_show");
    expect(said.volunteerDoneAt).toBeInstanceOf(Date);
  });
});

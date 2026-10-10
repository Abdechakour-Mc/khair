import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/core/db";
import {
  claimSlot,
  findSignupByCancelToken,
  findSignupByCode,
  formatFindCode,
  newFindCode,
  releaseSignup,
} from "@/core/signups";
import { publishTask } from "@/core/tasks";
import { hoursFromNow, resetDb } from "./helpers/db";

beforeEach(resetDb);

const YUSUF = { name: "Yusuf Benali", phone: "5142849137" };
const KHADIJA = { name: "Khadija Amrani", phone: "4382017744" };

async function claimed(slotsNeeded = 3) {
  const task = await publishTask({
    title: "Jumu'ah hall setup",
    startsAt: hoursFromNow(26),
    dueBy: hoursFromNow(28),
    slotsNeeded,
  });
  const signup = await claimSlot({ taskId: task.id, ...YUSUF });
  return { task, signup };
}

describe("the code a Volunteer is given", () => {
  it("is six digits, so it can be written on a scrap of paper", async () => {
    const { signup } = await claimed();
    expect(signup.findCode).toMatch(/^[0-9]{6}$/);
  });

  it("contains nothing that is misread by hand", () => {
    // Digits only settles it by construction: no O to confuse with 0, no I
    // to confuse with 1, and nothing to spell down the phone.
    for (let i = 0; i < 200; i += 1) {
      expect(newFindCode()).toMatch(/^[0-9]{6}$/);
    }
  });

  it("reads aloud in two groups", () => {
    expect(formatFindCode("482173")).toBe("482 173");
    expect(formatFindCode("000123")).toBe("000 123");
  });

  it("is different for each Signup", async () => {
    const { task, signup } = await claimed();
    const second = await claimSlot({ taskId: task.id, ...KHADIJA });

    expect(second.findCode).not.toBe(signup.findCode);
  });

  it("is unique among live Signups", async () => {
    const { task, signup } = await claimed();
    // Taking the one code that is in use is refused by the database, which
    // is what makes "unique among live signups" true rather than likely.
    const second = await claimSlot({ taskId: task.id, ...KHADIJA });

    await expect(
      db().query("update signups set find_code = $2 where id = $1", [
        second.id,
        signup.findCode,
      ]),
    ).rejects.toMatchObject({ code: "23505" });
  });
});

describe("finding a Signup again", () => {
  it("takes the code and the number together", async () => {
    const { signup } = await claimed();

    const found = await findSignupByCode(signup.findCode!, "5142849137");
    expect(found?.id).toBe(signup.id);
  });

  it("accepts the code however it was written down", async () => {
    const { signup } = await claimed();
    const spaced = formatFindCode(signup.findCode!);

    expect((await findSignupByCode(spaced, "5142849137"))?.id).toBe(signup.id);
    expect((await findSignupByCode(`${signup.findCode}  `, "5142849137"))?.id).toBe(signup.id);
    expect((await findSignupByCode(signup.findCode!.replace(/(\d{3})/, "$1-"), "5142849137"))?.id)
      .toBe(signup.id);
  });

  it("accepts the number however they type it", async () => {
    const { signup } = await claimed();

    expect((await findSignupByCode(signup.findCode!, "(514) 284-9137"))?.id).toBe(signup.id);
    expect((await findSignupByCode(signup.findCode!, "+1 514 284 9137"))?.id).toBe(signup.id);
  });

  it("refuses the right code with the wrong number", async () => {
    const { signup } = await claimed();

    expect(await findSignupByCode(signup.findCode!, "4382017744")).toBeNull();
  });

  it("fails identically for a code that never existed and a code that is wrong", async () => {
    const { signup } = await claimed();
    const wrongCode = signup.findCode === "000000" ? "000001" : "000000";

    expect(await findSignupByCode(wrongCode, "5142849137")).toBeNull();
    expect(await findSignupByCode("999999", "5142849137")).toBeNull();
    expect(await findSignupByCode(signup.findCode!, "5140000000")).toBeNull();
    // An unreadable number is a number that matches nothing, not a different
    // kind of answer.
    expect(await findSignupByCode(signup.findCode!, "not a phone")).toBeNull();
    expect(await findSignupByCode("not a code", "5142849137")).toBeNull();
    expect(await findSignupByCode("", "")).toBeNull();
  });

  it("stops working once the Slot has been released", async () => {
    const { signup } = await claimed();
    await releaseSignup(signup.cancelToken);

    expect(await findSignupByCode(signup.findCode!, "5142849137")).toBeNull();
  });

  it("lets a released code be issued again, since it belongs to nobody now", async () => {
    const { task, signup } = await claimed();
    await releaseSignup(signup.cancelToken);

    // Handing the released code to the next Volunteer is allowed: the index
    // only guards live Signups.
    const second = await claimSlot({ taskId: task.id, ...KHADIJA });
    await db().query("update signups set find_code = $2 where id = $1", [
      second.id,
      signup.findCode,
    ]);

    const found = await findSignupByCode(signup.findCode!, "4382017744");
    expect(found?.id).toBe(second.id);
  });

  it("still works for a Task whose Deadline has passed", async () => {
    const { task, signup } = await claimed();
    await db().query("update tasks set starts_at = null, due_by = now() - interval '2 hours' where id = $1", [
      task.id,
    ]);

    // They may simply want to see what they had signed up for.
    expect((await findSignupByCode(signup.findCode!, "5142849137"))?.id).toBe(signup.id);
  });

  it("leaves the long link working exactly as before", async () => {
    const { signup } = await claimed();

    const found = await findSignupByCancelToken(signup.cancelToken);
    expect(found?.id).toBe(signup.id);
  });

  it("returns the one Signup and never a list", async () => {
    const { task, signup } = await claimed();
    const other = await publishTask({ title: "Shoe rack", dueBy: hoursFromNow(48) });
    await claimSlot({ taskId: other.id, ...YUSUF });

    // Two live Signups on the same number; the code picks exactly one.
    const found = await findSignupByCode(signup.findCode!, "5142849137");
    expect(found?.taskId).toBe(task.id);
  });
});

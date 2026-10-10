import { randomBytes } from "node:crypto";
import type { PoolClient } from "pg";
import { db, inTransaction } from "./db";
import { ConflictError, ValidationError } from "./errors";
import { isUuid } from "./ids";
import { normalizePhone } from "./phone";

export type Signup = {
  id: string;
  taskId: string;
  volunteerPhone: string;
  nameSnapshot: string;
  cancelToken: string;
  outcome: "done" | "cancelled" | "no_show";
  cancelledAt: Date | null;
  /**
   * When the Volunteer said they had done the work, and null until they do.
   *
   * Never written by the Admin. This is a different fact from `outcome`:
   * "the Volunteer said they did it" against "the Admin judged this done".
   * The two are allowed to disagree, and the Admin's page shows both.
   */
  volunteerDoneAt: Date | null;
  createdAt: Date;
};

export type ClaimSlotInput = {
  taskId: string;
  name: string;
  phone: string;
};

type SignupRow = {
  id: string;
  task_id: string;
  volunteer_phone: string;
  name_snapshot: string;
  cancel_token: string;
  outcome: Signup["outcome"];
  cancelled_at: Date | null;
  volunteer_done_at: Date | null;
  created_at: Date;
};

function toSignup(row: SignupRow): Signup {
  return {
    id: row.id,
    taskId: row.task_id,
    volunteerPhone: row.volunteer_phone,
    nameSnapshot: row.name_snapshot,
    cancelToken: row.cancel_token,
    outcome: row.outcome,
    cancelledAt: row.cancelled_at,
    volunteerDoneAt: row.volunteer_done_at,
    createdAt: row.created_at,
  };
}

/** 32 bytes of url-safe randomness. Guessing one is not a realistic attack. */
function newCancelToken(): string {
  return randomBytes(24).toString("base64url");
}

const UNIQUE_VIOLATION = "23505";

/**
 * A Volunteer claims one Slot on one Task.
 *
 * The Slot check and the insert happen while holding a row lock on the Task,
 * so two congregants tapping the last Slot at the same moment cannot both
 * succeed. Without the lock, both would read "1 remaining" and both insert.
 */
export async function claimSlot(input: ClaimSlotInput): Promise<Signup> {
  const name = (input.name ?? "").trim();
  if (!name) throw new ValidationError("name", "name_required", "Enter your name.");
  if (name.length > 80) throw new ValidationError("name", "name_too_long", "That name is too long.");

  // Throws a ValidationError on anything unparseable, before we touch the database.
  const phone = normalizePhone(input.phone);

  return inTransaction(async (client) => {
    const task = await lockTaskForClaim(client, input.taskId);

    const { rows: counted } = await client.query<{ taken: string }>(
      "select count(*) as taken from signups where task_id = $1 and cancelled_at is null",
      [task.id],
    );
    const taken = Number(counted[0]?.taken ?? 0);
    if (taken >= task.slots_needed) {
      throw new ConflictError("task_full", "Every spot on this task has just been taken.");
    }

    // The Volunteer record carries their most recent name; the Signup keeps a
    // snapshot of what was typed today, which covers a shared household phone.
    await client.query(
      `insert into volunteers (phone, name) values ($1, $2)
       on conflict (phone) do update set name = excluded.name`,
      [phone, name],
    );

    try {
      const { rows } = await client.query<SignupRow>(
        `insert into signups (task_id, volunteer_phone, name_snapshot, cancel_token)
         values ($1, $2, $3, $4)
         returning *`,
        [task.id, phone, name, newCancelToken()],
      );
      const row = rows[0];
      if (!row) throw new Error("claimSlot inserted no row");
      return toSignup(row);
    } catch (error) {
      if ((error as { code?: string }).code === UNIQUE_VIOLATION) {
        throw new ConflictError("already_signed_up", "You are already on the list for this task.");
      }
      throw error;
    }
  });
}

type LockedTask = { id: string; slots_needed: number };

async function lockTaskForClaim(client: PoolClient, taskId: string): Promise<LockedTask> {
  if (!isUuid(taskId)) {
    throw new ConflictError("task_missing", "That task is no longer listed.");
  }

  const { rows } = await client.query<LockedTask & { closed: boolean; due_by: Date }>(
    `select id, slots_needed, closed, due_by from tasks
      where id = $1 and deleted_at is null
        for update`,
    [taskId],
  );

  const task = rows[0];
  if (!task) throw new ConflictError("task_missing", "That task is no longer listed.");
  if (task.closed) throw new ConflictError("task_closed", "This task has been called off.");
  if (task.due_by.getTime() <= Date.now()) {
    throw new ConflictError("task_passed", "This task's deadline has passed.");
  }
  return { id: task.id, slots_needed: task.slots_needed };
}

/** The confirmation page, reached by the secret in the link and nothing else. */
export async function findSignupByCancelToken(token: string): Promise<Signup | null> {
  if (!token) return null;
  const { rows } = await db().query<SignupRow>("select * from signups where cancel_token = $1", [
    token,
  ]);
  const row = rows[0];
  return row ? toSignup(row) : null;
}

/**
 * A Volunteer releases their own Slot, using the secret in their link.
 *
 * Idempotent: releasing an already-released Signup changes nothing and is
 * reported as success, because the person holding the token is its owner and
 * a double tap should not look like a failure. An unknown token is refused
 * with the same reason whether or not it ever existed.
 *
 * Refused once the work has happened. Releasing a Slot is a statement about
 * the future, and after the fact it would erase the Admin's record instead:
 * the Task happens, the Volunteer does not come, the Admin marks `no_show`,
 * and the Volunteer opens their saved link. `outcome` would become
 * `cancelled`, `setOutcome` would then refuse to touch it, and the Admin
 * could never restore what they recorded. That contradicts the rule that the
 * Admin's record is always correctable.
 */
export async function releaseSignup(token: string, now: Date = new Date()): Promise<Signup> {
  if (!token) throw new ConflictError("signup_missing", "That link does not match a signup.");

  return inTransaction(async (client) => {
    const { rows } = await client.query<SignupRow & { happens_at: Date }>(
      `select s.*, coalesce(t.starts_at, t.due_by) as happens_at
         from signups s
         join tasks t on t.id = s.task_id
        where s.cancel_token = $1
          for update of s`,
      [token],
    );

    const existing = rows[0];
    if (!existing) {
      throw new ConflictError("signup_missing", "That link does not match a signup.");
    }
    // Checked before the timing, so somebody who released in good time and
    // taps their saved link again next week still sees a success.
    if (existing.cancelled_at !== null) return toSignup(existing);

    if (existing.happens_at.getTime() <= now.getTime()) {
      throw new ConflictError("task_happened", "That task has already taken place.");
    }

    const { rows: updated } = await client.query<SignupRow>(
      `update signups
          set outcome = 'cancelled', cancelled_at = now()
        where id = $1
        returning *`,
      [existing.id],
    );

    const row = updated[0];
    if (!row) throw new Error("releaseSignup updated no row");
    return toSignup(row);
  });
}

/**
 * Every Signup on a Task, for the Admin's eyes only. Live claims first in the
 * order they were made, then anyone who released their Slot.
 */
export async function listSignupsForTask(taskId: string): Promise<Signup[]> {
  if (!isUuid(taskId)) return [];

  const { rows } = await db().query<SignupRow>(
    `select * from signups
      where task_id = $1
      order by (cancelled_at is not null), created_at`,
    [taskId],
  );
  return rows.map(toSignup);
}

/** What the Admin is allowed to record. 'cancelled' is the Volunteer's to set. */
export type AdminOutcome = "done" | "no_show";

/**
 * The Admin's private record of how a Signup ended.
 *
 * Every Signup already counts as done, so a normal week costs the Admin no
 * input at all and only the exceptions are ever touched. Always correctable:
 * nothing here is append-only, and one mistaken tap must not permanently
 * misrepresent somebody.
 */
export async function setOutcome(signupId: string, outcome: AdminOutcome): Promise<Signup> {
  if (outcome !== "done" && outcome !== "no_show") {
    throw new ConflictError(
      "signup_released",
      "Only the volunteer can mark a signup cancelled, by releasing their own slot.",
    );
  }
  if (!isUuid(signupId)) {
    throw new ConflictError("signup_missing", "That signup no longer exists.");
  }

  return inTransaction(async (client) => {
    const { rows: found } = await client.query<SignupRow>(
      "select * from signups where id = $1 for update",
      [signupId],
    );
    const existing = found[0];
    if (!existing) {
      throw new ConflictError("signup_missing", "That signup no longer exists.");
    }
    // A released Slot's outcome belongs to the Volunteer who released it.
    if (existing.cancelled_at !== null) {
      throw new ConflictError("signup_released", "That spot was released by the volunteer.");
    }

    const { rows } = await client.query<SignupRow>(
      "update signups set outcome = $2 where id = $1 returning *",
      [signupId, outcome],
    );
    const row = rows[0];
    if (!row) throw new Error("setOutcome updated no row");
    return toSignup(row);
  });
}

export type VolunteerHistoryEntry = {
  signupId: string;
  taskTitle: string;
  taskDueBy: Date;
  outcome: Signup["outcome"];
  cancelledAt: Date | null;
  /**
   * The work has not happened yet, so there is nothing to report about it.
   *
   * `outcome` defaults to `done`, which means a Signup for next Friday would
   * otherwise sit at the top of somebody's record as attendance they have not
   * given yet, and the Admin would read a positive record for work nobody has
   * done. A released Slot is settled whenever it was released.
   */
  pending: boolean;
};

/**
 * A Volunteer's past Outcomes, so the Admin knows who to count on.
 *
 * Deliberately a list and not a tally. A count would be a score, and Khair
 * has no scores: the Admin reads what happened and judges as a human.
 */
export async function volunteerHistory(
  phone: string,
  limit = 25,
  now: Date = new Date(),
): Promise<VolunteerHistoryEntry[]> {
  if (!phone) return [];

  const { rows } = await db().query<{
    id: string;
    title: string;
    due_by: Date;
    outcome: Signup["outcome"];
    cancelled_at: Date | null;
  }>(
    `select s.id, t.title, t.due_by, s.outcome, s.cancelled_at
       from signups s
       join tasks t on t.id = s.task_id
      where s.volunteer_phone = $1
        and t.deleted_at is null
      order by t.due_by desc
      limit $2`,
    [phone, limit],
  );

  return rows.map((row) => ({
    signupId: row.id,
    taskTitle: row.title,
    taskDueBy: row.due_by,
    outcome: row.outcome,
    cancelledAt: row.cancelled_at,
    pending: row.cancelled_at === null && row.due_by.getTime() > now.getTime(),
  }));
}

/**
 * The Volunteer says they have done the work, or takes that back.
 *
 * Self-management: the Volunteer closes the loop themselves instead of the
 * Admin chasing to find out. It matters most on a flexible Task, where
 * nothing else tells the Admin whether the shoe rack actually got fixed. For
 * a fixed Task the Admin was usually there; for a flexible one they were not.
 *
 * Writes its own column and never `outcome`. That field is the Admin's, and
 * it already defaults to `done`, so a Volunteer writing to it would change
 * nothing in the common case and would overwrite the one thing the Admin
 * owns. The two facts are allowed to disagree: somebody can say they came and
 * be marked absent, and the Admin's page shows both, because that
 * disagreement is the thing worth seeing.
 *
 * Reversible and idempotent, because people mistap: a second tap keeps the
 * first timestamp rather than moving it.
 */
export async function setVolunteerDone(
  token: string,
  done: boolean,
  now: Date = new Date(),
): Promise<Signup> {
  if (!token) throw new ConflictError("signup_missing", "That link does not match a signup.");

  return inTransaction(async (client) => {
    const { rows } = await client.query<SignupRow & { starts_at: Date | null }>(
      `select s.*, t.starts_at
         from signups s
         join tasks t on t.id = s.task_id
        where s.cancel_token = $1
          for update of s`,
      [token],
    );

    const existing = rows[0];
    if (!existing) {
      throw new ConflictError("signup_missing", "That link does not match a signup.");
    }
    // A released Slot is not work anybody did.
    if (existing.cancelled_at !== null) {
      throw new ConflictError("signup_released", "That spot has already been released.");
    }

    // A flexible Task can be finished early and said so at any point. A fixed
    // one cannot have been done before it started, and taking back a mistaken
    // tap is always allowed.
    if (
      done &&
      existing.starts_at !== null &&
      existing.starts_at.getTime() > now.getTime()
    ) {
      throw new ConflictError("task_not_started", "That task has not started yet.");
    }

    // Idempotent: already-said stays said, with its original timestamp.
    if (done && existing.volunteer_done_at !== null) return toSignup(existing);
    if (!done && existing.volunteer_done_at === null) return toSignup(existing);

    const { rows: updated } = await client.query<SignupRow>(
      "update signups set volunteer_done_at = $2 where id = $1 returning *",
      [existing.id, done ? now : null],
    );
    const row = updated[0];
    if (!row) throw new Error("setVolunteerDone updated no row");
    return toSignup(row);
  });
}

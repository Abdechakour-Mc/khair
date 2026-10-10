import { randomBytes } from "node:crypto";
import type { PoolClient } from "pg";
import { db, inTransaction } from "./db";
import { ConflictError, ValidationError } from "./errors";
import { normalizePhone } from "./phone";

export type Signup = {
  id: string;
  taskId: string;
  volunteerPhone: string;
  nameSnapshot: string;
  cancelToken: string;
  outcome: "done" | "cancelled" | "no_show";
  cancelledAt: Date | null;
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
  if (!/^[0-9a-f-]{36}$/i.test(taskId ?? "")) {
    throw new ConflictError("task_missing", "That task is no longer listed.");
  }

  const { rows } = await client.query<LockedTask & { closed: boolean; due_by: Date }>(
    "select id, slots_needed, closed, due_by from tasks where id = $1 for update",
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
 */
export async function releaseSignup(token: string): Promise<Signup> {
  if (!token) throw new ConflictError("signup_missing", "That link does not match a signup.");

  return inTransaction(async (client) => {
    const { rows } = await client.query<SignupRow>(
      "select * from signups where cancel_token = $1 for update",
      [token],
    );

    const existing = rows[0];
    if (!existing) {
      throw new ConflictError("signup_missing", "That link does not match a signup.");
    }
    if (existing.cancelled_at !== null) return toSignup(existing);

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

import { randomUUID } from "node:crypto";
import { db } from "@/core/db";

export async function resetDb(): Promise<void> {
  await db().query("truncate tasks, volunteers, signups cascade");
}

/** Hours from now, as a Date. Negative values are in the past. */
export function hoursFromNow(hours: number): Date {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

async function ensureVolunteer(phone: string, name: string): Promise<void> {
  await db().query(
    `insert into volunteers (phone, name) values ($1, $2)
     on conflict (phone) do update set name = excluded.name`,
    [phone, name],
  );
}

/**
 * Inserts a Signup directly. Claiming a Slot through the core arrives in
 * ticket 02; until then the Slot arithmetic is exercised against rows written
 * here.
 */
export async function addLiveSignup(
  taskId: string,
  phone: string,
  name = "Yusuf Benali",
): Promise<void> {
  await ensureVolunteer(phone, name);
  await db().query(
    `insert into signups (task_id, volunteer_phone, name_snapshot, cancel_token)
     values ($1, $2, $3, $4)`,
    [taskId, phone, name, randomUUID()],
  );
}

export async function addCancelledSignup(
  taskId: string,
  phone: string,
  name = "Yusuf Benali",
): Promise<void> {
  await ensureVolunteer(phone, name);
  await db().query(
    `insert into signups (task_id, volunteer_phone, name_snapshot, cancel_token, outcome, cancelled_at)
     values ($1, $2, $3, $4, 'cancelled', now())`,
    [taskId, phone, name, randomUUID()],
  );
}

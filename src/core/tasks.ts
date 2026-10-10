import { db } from "./db";
import { ValidationError } from "./errors";

export type Task = {
  id: string;
  title: string;
  description: string;
  location: string;
  /** Present on a fixed Task, absent on a flexible one. */
  startsAt: Date | null;
  /** The Deadline. Always present. */
  dueBy: Date;
  slotsNeeded: number;
  closed: boolean;
  createdAt: Date;
};

/** A Task as the public list needs it: with its Slot arithmetic resolved. */
export type OpenTask = Task & {
  slotsTaken: number;
  slotsRemaining: number;
  isFull: boolean;
  isFlexible: boolean;
};

export type PublishTaskInput = {
  title: string;
  description?: string;
  location?: string;
  startsAt?: Date | null;
  dueBy: Date;
  slotsNeeded?: number;
};

type TaskRow = {
  id: string;
  title: string;
  description: string;
  location: string;
  starts_at: Date | null;
  due_by: Date;
  slots_needed: number;
  closed: boolean;
  created_at: Date;
};

function toTask(row: TaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    location: row.location,
    startsAt: row.starts_at,
    dueBy: row.due_by,
    slotsNeeded: row.slots_needed,
    closed: row.closed,
    createdAt: row.created_at,
  };
}

function requireValidDate(value: unknown, field: string, label: string): Date {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    throw new ValidationError(field, `${label} is required.`);
  }
  return value;
}

export async function publishTask(input: PublishTaskInput): Promise<Task> {
  const title = (input.title ?? "").trim();
  if (!title) throw new ValidationError("title", "Give the task a title.");

  const dueBy = requireValidDate(input.dueBy, "dueBy", "A deadline");

  let startsAt: Date | null = null;
  if (input.startsAt !== undefined && input.startsAt !== null) {
    startsAt = requireValidDate(input.startsAt, "startsAt", "The start time");
    if (startsAt.getTime() > dueBy.getTime()) {
      throw new ValidationError("startsAt", "The start time is after the deadline.");
    }
  }

  const slotsNeeded = input.slotsNeeded ?? 1;
  if (!Number.isInteger(slotsNeeded) || slotsNeeded < 1) {
    throw new ValidationError("slotsNeeded", "At least one helper is needed.");
  }

  const { rows } = await db().query<TaskRow>(
    `insert into tasks (title, description, location, starts_at, due_by, slots_needed)
     values ($1, $2, $3, $4, $5, $6)
     returning *`,
    [
      title,
      (input.description ?? "").trim(),
      (input.location ?? "").trim(),
      startsAt,
      dueBy,
      slotsNeeded,
    ],
  );

  const row = rows[0];
  if (!row) throw new Error("publishTask inserted no row");
  return toTask(row);
}

export async function getTask(id: string): Promise<Task | null> {
  const { rows } = await db().query<TaskRow>("select * from tasks where id = $1", [id]);
  const row = rows[0];
  return row ? toTask(row) : null;
}

/**
 * The public list: Tasks still worth volunteering for. Fixed Tasks come first
 * in the order they happen, then flexible ones by Deadline. Fully covered
 * Tasks stay in the list, marked, because an empty list reads as a broken page.
 */
export async function listOpenTasks(now: Date = new Date()): Promise<OpenTask[]> {
  const { rows } = await db().query<TaskRow & { slots_taken: string }>(
    `select t.*, coalesce(live.taken, 0) as slots_taken
       from tasks t
       left join (
         select task_id, count(*) as taken
           from signups
          where cancelled_at is null
          group by task_id
       ) live on live.task_id = t.id
      where t.due_by > $1
        and t.closed = false
      order by (t.starts_at is null), coalesce(t.starts_at, t.due_by), t.created_at`,
    [now],
  );

  return rows.map((row) => {
    const task = toTask(row);
    const slotsTaken = Number(row.slots_taken);
    const slotsRemaining = Math.max(0, task.slotsNeeded - slotsTaken);
    return {
      ...task,
      slotsTaken,
      slotsRemaining,
      isFull: slotsRemaining === 0,
      isFlexible: task.startsAt === null,
    };
  });
}

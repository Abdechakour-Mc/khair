import { recordAdminAction } from "./audit";
import { db, inTransaction } from "./db";
import { ConflictError, ValidationError, type ValidationCode } from "./errors";
import { isUuid } from "./ids";

/**
 * How long a deleted Task can be brought back.
 *
 * Deleting a Task is reversible rather than confirmed, which is what WCAG 2.2
 * 3.3.4 accepts and what the usability finding on undo-versus-confirm
 * recommends: a dialog interrupts everyone to prevent a rare mistake, an undo
 * lets the common case run and still rescues the mistake. Long enough to
 * notice the mistake, short enough that "deleted" means deleted.
 */
export function undoWindowMinutes(): number {
  const configured = Number.parseInt(process.env.UNDO_WINDOW_MINUTES ?? "", 10);
  return Number.isInteger(configured) && configured > 0 ? configured : 30;
}

/**
 * Who a Task is open to. A fact about the work, never about the person
 * claiming it: Khair stores no gender for anybody and asks for none, so this
 * is a statement the public pages make and not a filter they apply. See
 * ticket 17 for why the alternative was refused.
 */
export const openToValues = ["anyone", "brothers", "sisters"] as const;
export type OpenTo = (typeof openToValues)[number];

export function isOpenTo(value: unknown): value is OpenTo {
  return typeof value === "string" && (openToValues as readonly string[]).includes(value);
}

export type Task = {
  id: string;
  title: string;
  description: string;
  location: string;
  /** Who the work is for. `anyone` unless the Admin said otherwise. */
  openTo: OpenTo;
  /**
   * Pinned to the top of the public list, and marked there.
   *
   * A flag and not a scale: three levels of priority is a scale nobody
   * calibrates the same way twice. Nothing withholds an urgent Task from
   * anybody - that is the separate `important` flag for early access - so
   * urgency only ever makes a Task louder and sooner, never narrower.
   */
  urgent: boolean;
  /**
   * Withheld from everybody except trusted Volunteers for a window after it
   * is published, then public like anything else.
   *
   * The opposite instruction from `urgent`, which shows a Task to everyone
   * sooner and louder. A Task can be both, and then the window applies to
   * whoever can see it.
   */
  important: boolean;
  /** Created by the demo seed, and removed with the rest of the demo data. */
  demo: boolean;
  /** Present on a fixed Task, absent on a flexible one. */
  startsAt: Date | null;
  /** The Deadline. Always present. */
  dueBy: Date;
  slotsNeeded: number;
  closed: boolean;
  createdAt: Date;
};

/**
 * When a Task is done with: its start if it has one, otherwise its Deadline.
 *
 * A flexible Task has no start, so the Deadline is the only moment it can be
 * measured against. Both the Admin's page and the confirmation page need the
 * same answer, and the release refusal in `releaseSignup` is the same rule
 * expressed in SQL.
 */
export function happensAt(task: Pick<Task, "startsAt" | "dueBy">): Date {
  return task.startsAt ?? task.dueBy;
}

export function hasHappened(
  task: Pick<Task, "startsAt" | "dueBy">,
  now: Date = new Date(),
): boolean {
  return happensAt(task).getTime() <= now.getTime();
}

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
  openTo?: OpenTo;
  urgent?: boolean;
  important?: boolean;
  startsAt?: Date | null;
  dueBy: Date;
  slotsNeeded?: number;
};

type TaskRow = {
  id: string;
  title: string;
  description: string;
  location: string;
  open_to: OpenTo;
  urgent: boolean;
  important: boolean;
  demo: boolean;
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
    openTo: row.open_to,
    urgent: row.urgent,
    important: row.important,
    demo: row.demo,
    startsAt: row.starts_at,
    dueBy: row.due_by,
    slotsNeeded: row.slots_needed,
    closed: row.closed,
    createdAt: row.created_at,
  };
}

function requireValidDate(
  value: unknown,
  field: string,
  code: ValidationCode,
  label: string,
): Date {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    throw new ValidationError(field, code, `${label} is required.`);
  }
  return value;
}

/**
 * Defaults to `anyone`, so a Task the Admin says nothing about is open to
 * everybody, and refuses anything outside the three rather than silently
 * widening a Task that was meant for the sisters.
 */
function requireOpenTo(value: PublishTaskInput["openTo"]): OpenTo {
  if (value === undefined || value === null) return "anyone";
  if (!isOpenTo(value)) {
    throw new ValidationError("openTo", "open_to_invalid", "That is not a choice on this form.");
  }
  return value;
}

export async function publishTask(input: PublishTaskInput): Promise<Task> {
  const title = (input.title ?? "").trim();
  if (!title) throw new ValidationError("title", "title_required", "Give the task a title.");

  const dueBy = requireValidDate(input.dueBy, "dueBy", "deadline_required", "A deadline");

  let startsAt: Date | null = null;
  if (input.startsAt !== undefined && input.startsAt !== null) {
    startsAt = requireValidDate(input.startsAt, "startsAt", "start_invalid", "The start time");
    if (startsAt.getTime() > dueBy.getTime()) {
      throw new ValidationError(
        "startsAt",
        "start_after_deadline",
        "The start time is after the deadline.",
      );
    }
  }

  const slotsNeeded = input.slotsNeeded ?? 1;
  if (!Number.isInteger(slotsNeeded) || slotsNeeded < 1) {
    throw new ValidationError("slotsNeeded", "slots_too_few", "At least one helper is needed.");
  }

  const openTo = requireOpenTo(input.openTo);

  const { rows } = await db().query<TaskRow>(
    `insert into tasks
       (title, description, location, open_to, urgent, important,
        starts_at, due_by, slots_needed)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     returning *`,
    [
      title,
      (input.description ?? "").trim(),
      (input.location ?? "").trim(),
      openTo,
      input.urgent === true,
      input.important === true,
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
  const { rows } = await db().query<TaskRow>(
    "select * from tasks where id = $1 and deleted_at is null",
    [id],
  );
  const row = rows[0];
  return row ? toTask(row) : null;
}

/**
 * The public list: Tasks still worth volunteering for. Fixed Tasks come first
 * in the order they happen, then flexible ones by Deadline. Fully covered
 * Tasks stay in the list, marked, because an empty list reads as a broken page.
 */
export async function listOpenTasks(
  now: Date = new Date(),
  viewer: Viewer = { trusted: false },
): Promise<OpenTask[]> {
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
        and t.deleted_at is null
        -- An important Task is left out entirely for everybody else while
        -- its window runs. Not greyed out and not counted: a list that said
        -- "1 task hidden" would announce the thing this must not announce.
        and (
          $2::boolean
          or t.important = false
          or t.created_at <= $1 - ($3 || ' hours')::interval
        )
      order by (t.starts_at is null), coalesce(t.starts_at, t.due_by), t.created_at`,
    [now, viewer.trusted, earlyAccessHours()],
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

/**
 * One Task with its Slot arithmetic, regardless of whether it is still open.
 * The detail page needs this so it can explain a closed or passed Task rather
 * than pretending it never existed.
 */
export async function getTaskWithSlots(id: string): Promise<OpenTask | null> {
  if (!isUuid(id)) return null;

  const { rows } = await db().query<TaskRow & { slots_taken: string }>(
    `select t.*, coalesce(live.taken, 0) as slots_taken
       from tasks t
       left join (
         select task_id, count(*) as taken
           from signups
          where cancelled_at is null
          group by task_id
       ) live on live.task_id = t.id
      where t.id = $1
        and t.deleted_at is null`,
    [id],
  );

  const row = rows[0];
  if (!row) return null;

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
}

/**
 * Everything the Admin has ever published, with Slot counts: upcoming work
 * first, then Tasks whose Deadline has passed and which have therefore left
 * the public list.
 */
export async function listTasksForAdmin(now: Date = new Date()): Promise<OpenTask[]> {
  const { rows } = await db().query<TaskRow & { slots_taken: string }>(
    `select t.*, coalesce(live.taken, 0) as slots_taken
       from tasks t
       left join (
         select task_id, count(*) as taken
           from signups
          where cancelled_at is null
          group by task_id
       ) live on live.task_id = t.id
      where t.deleted_at is null
      order by (t.due_by <= $1),
               case when t.due_by > $1 then coalesce(t.starts_at, t.due_by) end asc,
               case when t.due_by <= $1 then coalesce(t.starts_at, t.due_by) end desc`,
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

/**
 * Corrects a published Task. A mistyped time should not mean deleting the
 * Task and re-advertising it, which would lose everyone who had signed up.
 *
 * The Task is locked while the Slot count is checked, so the count cannot be
 * cut below the number of people already holding a Slot.
 */
export async function editTask(id: string, input: PublishTaskInput): Promise<Task> {
  // Guarded before the fields are read, like every other mutator. A stale or
  // tampered hidden id used to reach Postgres and come back as "Something
  // went wrong" with a logged stack trace, rather than the accurate answer.
  if (!isUuid(id)) throw new ConflictError("task_missing", "That task is no longer listed.");

  const title = (input.title ?? "").trim();
  if (!title) throw new ValidationError("title", "title_required", "Give the task a title.");

  const dueBy = requireValidDate(input.dueBy, "dueBy", "deadline_required", "A deadline");

  let startsAt: Date | null = null;
  if (input.startsAt !== undefined && input.startsAt !== null) {
    startsAt = requireValidDate(input.startsAt, "startsAt", "start_invalid", "The start time");
    if (startsAt.getTime() > dueBy.getTime()) {
      throw new ValidationError(
        "startsAt",
        "start_after_deadline",
        "The start time is after the deadline.",
      );
    }
  }

  const slotsNeeded = input.slotsNeeded ?? 1;
  if (!Number.isInteger(slotsNeeded) || slotsNeeded < 1) {
    throw new ValidationError("slotsNeeded", "slots_too_few", "At least one helper is needed.");
  }

  const openTo = requireOpenTo(input.openTo);

  return inTransaction(async (client) => {
    const { rows: locked } = await client.query<{ id: string }>(
      "select id from tasks where id = $1 and deleted_at is null for update",
      [id],
    );
    if (!locked[0]) throw new ConflictError("task_missing", "That task is no longer listed.");

    const { rows: counted } = await client.query<{ taken: string }>(
      "select count(*) as taken from signups where task_id = $1 and cancelled_at is null",
      [id],
    );
    const taken = Number(counted[0]?.taken ?? 0);
    if (slotsNeeded < taken) {
      throw new ValidationError(
        "slotsNeeded",
        "slots_below_claimed",
        `${taken} people already hold a spot.`,
      );
    }

    const { rows } = await client.query<TaskRow>(
      `update tasks
          set title = $2, description = $3, location = $4, open_to = $5, urgent = $6,
              important = $7, starts_at = $8, due_by = $9, slots_needed = $10
        where id = $1
        returning *`,
      [
        id,
        title,
        (input.description ?? "").trim(),
        (input.location ?? "").trim(),
        openTo,
        input.urgent === true,
        input.important === true,
        startsAt,
        dueBy,
        slotsNeeded,
      ],
    );

    const row = rows[0];
    if (!row) throw new Error("editTask updated no row");
    return toTask(row);
  });
}

/**
 * Withdraws work that is no longer happening, or puts it back. Existing
 * Signups are preserved: telling those Volunteers is a message the Admin
 * sends by hand, using the tappable numbers on the Task's Admin page.
 */
export async function setTaskClosed(id: string, closed: boolean): Promise<Task> {
  if (!isUuid(id)) {
    throw new ConflictError("task_missing", "That task is no longer listed.");
  }

  const { rows } = await db().query<TaskRow>(
    "update tasks set closed = $2 where id = $1 and deleted_at is null returning *",
    [id, closed],
  );
  const row = rows[0];
  if (!row) throw new ConflictError("task_missing", "That task is no longer listed.");
  return toTask(row);
}

/**
 * Deletes a Task and, with it, the Signups on it.
 *
 * Soft at first: the Task leaves every public and Admin list at once, and the
 * Signups wait with it, so the undo can bring back exactly what was there.
 * `finaliseDeletedTasks` finishes the job once the window has passed.
 *
 * Calling a Task off is the other thing an Admin might want here, and it is
 * not the same: that keeps the Signups and the people who hold them, and it
 * is what to reach for when the work is cancelled rather than mistyped.
 */
export async function deleteTask(id: string): Promise<Task> {
  if (!isUuid(id)) throw new ConflictError("task_missing", "That task is no longer listed.");

  return inTransaction(async (client) => {
    const { rows } = await client.query<TaskRow>(
      `update tasks set deleted_at = now()
        where id = $1 and deleted_at is null
        returning *`,
      [id],
    );
    const row = rows[0];
    if (!row) throw new ConflictError("task_missing", "That task is no longer listed.");

    const { rows: counted } = await client.query<{ taken: string }>(
      "select count(*) as taken from signups where task_id = $1",
      [id],
    );
    await recordAdminAction("delete_task", `${Number(counted[0]?.taken ?? 0)} signups`, client);
    return toTask(row);
  });
}

/** Brings a deleted Task back, whole, inside the undo window. */
export async function restoreTask(id: string): Promise<Task> {
  if (!isUuid(id)) throw new ConflictError("task_missing", "That task is no longer listed.");

  return inTransaction(async (client) => {
    const { rows: found } = await client.query<{ deleted_at: Date | null }>(
      "select deleted_at from tasks where id = $1 for update",
      [id],
    );
    const existing = found[0];
    if (!existing || existing.deleted_at === null) {
      throw new ConflictError("task_missing", "That task was not deleted.");
    }

    const elapsedMinutes = (Date.now() - existing.deleted_at.getTime()) / 60000;
    if (elapsedMinutes > undoWindowMinutes()) {
      // Past the window the Signups may already be gone, so there would be
      // nothing honest to bring back.
      throw new ConflictError("undo_expired", "That task can no longer be brought back.");
    }

    const { rows } = await client.query<TaskRow>(
      "update tasks set deleted_at = null where id = $1 returning *",
      [id],
    );
    const row = rows[0];
    if (!row) throw new Error("restoreTask updated no row");

    await recordAdminAction("restore_task", "", client);
    return toTask(row);
  });
}

/**
 * Tasks the Admin deleted and can still bring back, so a deletion is visibly
 * undoable rather than silently final.
 */
export async function listDeletedTasks(): Promise<Task[]> {
  const { rows } = await db().query<TaskRow>(
    `select * from tasks
      where deleted_at is not null
        and deleted_at > now() - ($1 || ' minutes')::interval
      order by deleted_at desc`,
    [undoWindowMinutes()],
  );
  return rows.map(toTask);
}

/**
 * How long the Volunteers the Admin relies on see important work before
 * everybody else.
 *
 * Configuration rather than a constant, because it is a judgement about this
 * congregation: long enough that the people who always say yes get first
 * refusal, short enough that nothing sits unclaimed while the mosque waits.
 */
export function earlyAccessHours(): number {
  const configured = Number.parseInt(process.env.EARLY_ACCESS_HOURS ?? "", 10);
  return Number.isInteger(configured) && configured > 0 ? configured : 24;
}

/** What the list needs to know about whoever is reading it. */
export type Viewer = { trusted: boolean };

/**
 * Whether this Task is being kept back from this viewer right now.
 *
 * True only while an important Task is inside its window and the viewer is
 * not somebody the Admin relies on. The window is measured from publication
 * and closes on its own, so nothing waits on the Admin remembering to open it
 * up.
 *
 * Convenience and not a boundary. Identity here rests on an unverified phone
 * number, so this holds only as well as somebody's honesty about their own
 * number; what it protects is a few hours of first refusal on work that holds
 * nothing personal, and the Admin can undo any claim. Nothing that matters
 * may rest on it.
 */
export function withheldFrom(
  task: Pick<Task, "important" | "createdAt">,
  viewer: Viewer,
  now: Date = new Date(),
): boolean {
  if (!task.important || viewer.trusted) return false;
  const opensAt = task.createdAt.getTime() + earlyAccessHours() * 60 * 60 * 1000;
  return now.getTime() < opensAt;
}

/**
 * Whether the Admin has marked this number as one they rely on.
 *
 * Visible to the Admin alone: it appears on no public page, is never shown to
 * the Volunteer, and is never aggregated into a score or a rank, for the same
 * reason there is no leaderboard.
 */
export async function isTrustedVolunteer(phone: string): Promise<boolean> {
  if (!phone) return false;
  const { rows } = await db().query<{ trusted: boolean }>(
    "select trusted from volunteers where phone = $1",
    [phone],
  );
  return rows[0]?.trusted === true;
}

/** The Admin marks somebody as relied upon, or takes that back. */
export async function setVolunteerTrusted(phone: string, trusted: boolean): Promise<boolean> {
  const { rows } = await db().query<{ trusted: boolean }>(
    "update volunteers set trusted = $2 where phone = $1 returning trusted",
    [phone, trusted],
  );
  const row = rows[0];
  if (!row) {
    // Trust is about somebody who has actually turned up, so there is nobody
    // to mark until they have signed up at least once.
    throw new ConflictError("signup_missing", "Nobody has signed up with that number.");
  }
  return row.trusted;
}

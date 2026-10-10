import { db, inTransaction } from "./db";
import { undoWindowMinutes } from "./tasks";

export type PurgeResult = {
  signupsDeleted: number;
  volunteersDeleted: number;
};

/** Long enough to see a pattern, short enough that nothing lingers. */
export function retentionMonths(): number {
  const configured = Number.parseInt(process.env.RETENTION_MONTHS ?? "", 10);
  return Number.isInteger(configured) && configured > 0 ? configured : 6;
}

/**
 * The moment before which Signups are forgotten: `months` back from `now`.
 *
 * The day is clamped before the month is shifted, because `setUTCMonth`
 * overflows. Run on 31 August with a six-month window, "28 February + 3
 * days" lands on 3 March, and Signups from 1 and 2 March would be deleted
 * after five months and twenty-nine days. The stated policy is six months,
 * so a month shorter than the current one lands on its last day instead.
 */
export function retentionCutoff(now: Date, months: number): Date {
  const cutoff = new Date(now);
  const day = cutoff.getUTCDate();

  cutoff.setUTCDate(1);
  cutoff.setUTCMonth(cutoff.getUTCMonth() - months);

  const lastDayOfThatMonth = new Date(
    Date.UTC(cutoff.getUTCFullYear(), cutoff.getUTCMonth() + 1, 0),
  ).getUTCDate();
  cutoff.setUTCDate(Math.min(day, lastDayOfThatMonth));

  return cutoff;
}

/**
 * What the purge would delete if it ran now, without deleting it.
 *
 * Counted and shown first, because a destructive action should say what it is
 * about to do in numbers: an Admin who expected three and is told four
 * hundred has learned something before pressing it.
 */
export async function previewPurge(
  now: Date = new Date(),
  months: number = retentionMonths(),
): Promise<{ signups: number; volunteers: number }> {
  const cutoff = retentionCutoff(now, months);

  const { rows } = await db().query<{ signups: string; volunteers: string }>(
    `with doomed as (
       select s.id, s.volunteer_phone
         from signups s
         join tasks t on t.id = s.task_id
        where t.due_by < $1
     )
     select
       (select count(*) from doomed) as signups,
       (select count(*) from volunteers v
         where not exists (
           select 1 from signups s
            where s.volunteer_phone = v.phone
              and s.id not in (select id from doomed)
         )) as volunteers`,
    [cutoff],
  );

  return {
    signups: Number(rows[0]?.signups ?? 0),
    volunteers: Number(rows[0]?.volunteers ?? 0),
  };
}

/**
 * Finishes the Tasks the Admin deleted, once their undo window has passed.
 *
 * Separate from the retention purge on purpose: they answer to two different
 * policies, six months and half an hour, and nothing good comes of one
 * function that means both. Both are called from the same three places: the
 * schedule, the command line, and the Admin's own page.
 */
export async function finaliseDeletedTasks(
  now: Date = new Date(),
): Promise<{ tasksDeleted: number; signupsDeleted: number }> {
  return inTransaction(async (client) => {
    const cutoff = new Date(now.getTime() - undoWindowMinutes() * 60000);

    const signups = await client.query(
      `delete from signups
        where task_id in (select id from tasks where deleted_at < $1)`,
      [cutoff],
    );
    const tasks = await client.query("delete from tasks where deleted_at < $1", [cutoff]);

    return {
      tasksDeleted: tasks.rowCount ?? 0,
      signupsDeleted: signups.rowCount ?? 0,
    };
  });
}

/**
 * Everything the schedule does, in the one order that works.
 *
 * Deleted Tasks are finished FIRST. The other way round, finalising a Task
 * deletes its Signups after the purge has already counted them, so a
 * Volunteer whose last Signup was on that Task keeps their name and number
 * with nothing attached, until the next run a day later. That is exactly the
 * state the purge exists to prevent, and it would make the retention promise
 * a claim rather than a fact for a day at a time.
 *
 * Called from all three places that clean up: the schedule, the command
 * line, and the Admin's own button.
 */
export async function runScheduledCleanup(
  now: Date = new Date(),
): Promise<PurgeResult & { tasksDeleted: number }> {
  const finalised = await finaliseDeletedTasks(now);
  const purged = await purgeExpiredSignups(now);

  return {
    signupsDeleted: purged.signupsDeleted + finalised.signupsDeleted,
    volunteersDeleted: purged.volunteersDeleted,
    tasksDeleted: finalised.tasksDeleted,
  };
}

/**
 * Forgets names, phone numbers and Outcomes some months after the work is
 * done, so Khair does not quietly accumulate a dossier on the congregation.
 *
 * This is what gives the Admin an honest answer the day a congregant asks
 * what the app knows about them. Without the second delete it would be
 * decorative: the Signups would go and every phone number would survive.
 *
 * Tasks are kept. They are a record of what the mosque has needed and hold no
 * personal data.
 *
 * Idempotent: running it twice changes nothing the second time.
 */
export async function purgeExpiredSignups(
  now: Date = new Date(),
  months: number = retentionMonths(),
): Promise<PurgeResult> {
  const cutoff = retentionCutoff(now, months);

  return inTransaction(async (client) => {
    const signups = await client.query(
      `delete from signups
        where task_id in (select id from tasks where due_by < $1)`,
      [cutoff],
    );

    // A Volunteer exists only to carry Signups. With none left there is no
    // reason to keep their number, and keeping it would make the policy a
    // claim rather than a fact.
    const volunteers = await client.query(
      `delete from volunteers
        where not exists (
          select 1 from signups where signups.volunteer_phone = volunteers.phone
        )`,
    );

    return {
      signupsDeleted: signups.rowCount ?? 0,
      volunteersDeleted: volunteers.rowCount ?? 0,
    };
  });
}

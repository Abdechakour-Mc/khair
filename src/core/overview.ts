import { db } from "./db";
import { earlyAccessHours } from "./tasks";

/**
 * What the Admin needs to know at a glance, and the short list of things
 * only they can do something about.
 *
 * Counts rather than charts. The mosque publishes a handful of Tasks a week,
 * so a graph of anything would be decoration; what an Admin actually opens
 * this page to learn is whether Friday is covered.
 *
 * Nothing here is a score about a person. The volunteer numbers count rows,
 * not behaviour, and no ranking is produced: see the no-recognition rule in
 * ticket 07.
 */
export type AdminOverview = {
  upcomingTasks: number;
  /** Slots on upcoming Tasks that nobody has claimed. */
  openSpots: number;
  urgentTasks: number;
  /** Upcoming Tasks still inside their early-access window. */
  withheldTasks: number;
  volunteers: number;
  trusted: number;
  paused: number;
  signupsThisWeek: number;
  /** Rows the demo seed created, which must be cleared before launch. */
  demoTasks: number;
};

export async function adminOverview(now: Date = new Date()): Promise<AdminOverview> {
  const { rows } = await db().query<Record<string, string>>(
    `with live as (
       select t.id, t.slots_needed, t.urgent, t.important, t.created_at,
              coalesce(count(s.id) filter (where s.cancelled_at is null), 0) as taken
         from tasks t
         left join signups s on s.task_id = t.id
        where t.due_by > $1
          and t.closed = false
          and t.deleted_at is null
        group by t.id
     )
     select
       (select count(*) from live) as upcoming_tasks,
       (select coalesce(sum(greatest(slots_needed - taken, 0)), 0) from live) as open_spots,
       (select count(*) from live where urgent) as urgent_tasks,
       (select count(*) from live
         where important and created_at > $1 - ($2 || ' hours')::interval) as withheld_tasks,
       (select count(*) from volunteers) as volunteers,
       (select count(*) from volunteers where trusted) as trusted,
       (select count(*) from volunteers where paused_at is not null) as paused,
       (select count(*) from signups where created_at > $1 - interval '7 days') as signups_week,
       (select count(*) from tasks where demo) as demo_tasks`,
    [now, earlyAccessHours()],
  );

  const row = rows[0] ?? {};
  const n = (key: string) => Number(row[key] ?? 0);

  return {
    upcomingTasks: n("upcoming_tasks"),
    openSpots: n("open_spots"),
    urgentTasks: n("urgent_tasks"),
    withheldTasks: n("withheld_tasks"),
    volunteers: n("volunteers"),
    trusted: n("trusted"),
    paused: n("paused"),
    signupsThisWeek: n("signups_week"),
    demoTasks: n("demo_tasks"),
  };
}

export type TaskNeedingHelp = {
  id: string;
  title: string;
  happensAt: Date;
  /** No start time, so the Deadline is all there is to say about when. */
  flexible: boolean;
  slotsNeeded: number;
  slotsTaken: number;
};

/**
 * Work happening soon that nobody has claimed, soonest first.
 *
 * The one thing on the Admin's home page that asks for an action. Everything
 * else there is a number; this is a list of Tasks where somebody may need to
 * be rung before Friday.
 */
export async function tasksNeedingHelp(
  now: Date = new Date(),
  withinDays = 7,
): Promise<TaskNeedingHelp[]> {
  const { rows } = await db().query<{
    id: string;
    title: string;
    happens_at: Date;
    flexible: boolean;
    slots_needed: number;
    taken: string;
  }>(
    `select t.id, t.title, coalesce(t.starts_at, t.due_by) as happens_at,
            (t.starts_at is null) as flexible, t.slots_needed,
            coalesce(count(s.id) filter (where s.cancelled_at is null), 0) as taken
       from tasks t
       left join signups s on s.task_id = t.id
      where t.due_by > $1
        and t.due_by < $1 + ($2 || ' days')::interval
        and t.closed = false
        and t.deleted_at is null
      group by t.id
     having coalesce(count(s.id) filter (where s.cancelled_at is null), 0) < t.slots_needed
      order by coalesce(t.starts_at, t.due_by)`,
    [now, withinDays],
  );

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    happensAt: row.happens_at,
    flexible: row.flexible,
    slotsNeeded: row.slots_needed,
    slotsTaken: Number(row.taken),
  }));
}

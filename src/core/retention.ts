import { inTransaction } from "./db";

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

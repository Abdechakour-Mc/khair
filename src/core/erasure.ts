import { recordAdminAction } from "./audit";
import { inTransaction } from "./db";
import { ConflictError } from "./errors";
import { normalizePhone } from "./phone";

/**
 * What a destructive action is about to destroy. Counted and shown before
 * anything happens, because an Admin who sees "412 signups" when they
 * expected 3 has been saved by the screen.
 */
export type RecordCount = {
  signups: number;
  volunteers: number;
};

/**
 * The demo set also contains Tasks, which have no phone number to recognise
 * them by, so they carry a `demo` flag instead. Without it, clearing the demo
 * data would leave fake work in the mosque's own record of what it has
 * needed.
 */
export type SyntheticCount = RecordCount & { tasks: number };

/**
 * The block NANP reserves for fiction: +1 555 0100 through +1 555 0199.
 *
 * Ticket 09's demo seed draws every synthetic number from here, so a fake
 * number can never collide with a real congregant's and the whole synthetic
 * set is identifiable by pattern. Deliberately narrow: `+15550 1xx` and
 * nothing else, so one digit outside it is treated as somebody real.
 */
export const SYNTHETIC_PHONE_PREFIX = "+155501";

/** The phrase the Admin types to clear the synthetic set. */
export const CLEAR_SYNTHETIC_PHRASE = "clear demo data";

async function countBy(
  client: Pick<import("pg").PoolClient, "query">,
  where: string,
  params: unknown[],
): Promise<RecordCount> {
  const { rows } = await client.query<{ signups: string; volunteers: string }>(
    `select
       (select count(*) from signups where volunteer_phone ${where}) as signups,
       (select count(*) from volunteers where phone ${where}) as volunteers`,
    params,
  );
  return {
    signups: Number(rows[0]?.signups ?? 0),
    volunteers: Number(rows[0]?.volunteers ?? 0),
  };
}

/**
 * Whether what the Admin typed is the number on the record.
 *
 * Normalised first, so they can type what the page shows them - "(514)
 * 284-9137" - rather than E.164. When that fails it falls back to comparing
 * digits, which is not a loosening: the digits still have to match exactly.
 * It is what makes this work for a number libphonenumber will not parse,
 * and the +1 555 01xx block reserved for fiction is exactly that. Without
 * the fallback, erasing a demo Volunteer was a dead end that always answered
 * "that is not the same number", in the one flow where being told no without
 * a reason is worst.
 */
function sameNumber(stored: string, typed: string): boolean {
  try {
    if (normalizePhone(typed) === stored) return true;
  } catch {
    // Unparseable is not the same as wrong, so fall through to the digits.
  }
  const digits = (value: string) => value.replace(/\D/g, "");
  return digits(typed).length > 0 && digits(typed) === digits(stored);
}

export async function countVolunteerRecords(phone: string): Promise<RecordCount> {
  return inTransaction((client) => countBy(client, "= $1", [phone]));
}

export async function countSyntheticRecords(): Promise<SyntheticCount> {
  return inTransaction(async (client) => {
    const pattern = `${SYNTHETIC_PHONE_PREFIX}%`;
    const { rows } = await client.query<{
      signups: string;
      volunteers: string;
      tasks: string;
    }>(
      `select
         (select count(*) from signups s
            join tasks t on t.id = s.task_id
           where s.volunteer_phone like $1 or t.demo) as signups,
         (select count(*) from volunteers where phone like $1) as volunteers,
         (select count(*) from tasks where demo) as tasks`,
      [pattern],
    );
    return {
      signups: Number(rows[0]?.signups ?? 0),
      volunteers: Number(rows[0]?.volunteers ?? 0),
      tasks: Number(rows[0]?.tasks ?? 0),
    };
  });
}

/**
 * Erases one Volunteer: their record, every Signup of theirs, and every
 * Outcome the Admin recorded against them. The Tasks stay, because they hold
 * no personal data and they are the mosque's record of what it has needed.
 *
 * This is the answer to a congregant who asks for their data to be deleted,
 * so it has to be complete and it genuinely cannot be undone. Undo being
 * unavailable is exactly why this one is confirmed by typing the number:
 * WCAG 2.2 3.3.4 accepts reversible, checked or confirmed, and only the last
 * is available here.
 *
 * The typed number is normalised before it is compared, so the Admin can type
 * what the page shows them - "(514) 284-9137" - rather than E.164.
 */
export async function forgetVolunteer(phone: string, typed: string): Promise<RecordCount> {
  if (!sameNumber(phone, typed)) {
    throw new ConflictError("confirmation_mismatch", "That is not the same number.");
  }

  return inTransaction(async (client) => {
    const counted = await countBy(client, "= $1", [phone]);

    // Signups cascade from the Volunteer row, so this one statement takes
    // the history with it.
    await client.query("delete from volunteers where phone = $1", [phone]);

    // Named by counts only. The number is not written down here.
    await recordAdminAction(
      "forget_volunteer",
      `${counted.signups} signups, ${counted.volunteers} volunteer record`,
      client,
    );
    return counted;
  });
}

/**
 * Deletes every record whose phone number is in the reserved fictional block,
 * and nothing else, so the synthetic history that ticket 09 needs can be
 * cleared before the app reaches the congregation.
 *
 * Confirmed by a typed phrase rather than reversible, because it is wide:
 * the whole point is that it cannot be unpicked afterwards.
 */
export async function clearSyntheticData(typed: string): Promise<SyntheticCount> {
  if ((typed ?? "").trim().toLowerCase() !== CLEAR_SYNTHETIC_PHRASE) {
    throw new ConflictError("confirmation_mismatch", "That is not the phrase.");
  }

  const counted = await countSyntheticRecords();

  return inTransaction(async (client) => {
    const pattern = `${SYNTHETIC_PHONE_PREFIX}%`;

    // Two things decide what goes and nothing else does: a phone number in
    // the reserved block, and a Task the demo seed created. A number one
    // digit outside that block is somebody real.
    await client.query("delete from volunteers where phone like $1", [pattern]);
    // Signups on a demo Task cascade with it, including any a real person
    // made while the demo data was in place: the work was never real.
    await client.query("delete from tasks where demo");

    await recordAdminAction(
      "clear_synthetic",
      `${counted.signups} signups, ${counted.volunteers} volunteer records, ${counted.tasks} tasks`,
      client,
    );
    return counted;
  });
}

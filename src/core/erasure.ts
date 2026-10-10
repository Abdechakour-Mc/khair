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

export async function countVolunteerRecords(phone: string): Promise<RecordCount> {
  return inTransaction((client) => countBy(client, "= $1", [phone]));
}

export async function countSyntheticRecords(): Promise<RecordCount> {
  return inTransaction((client) => countBy(client, "like $1", [`${SYNTHETIC_PHONE_PREFIX}%`]));
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
  let confirmed: string;
  try {
    confirmed = normalizePhone(typed);
  } catch {
    throw new ConflictError("confirmation_mismatch", "That is not the same number.");
  }
  if (confirmed !== phone) {
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
export async function clearSyntheticData(typed: string): Promise<RecordCount> {
  if ((typed ?? "").trim().toLowerCase() !== CLEAR_SYNTHETIC_PHRASE) {
    throw new ConflictError("confirmation_mismatch", "That is not the phrase.");
  }

  return inTransaction(async (client) => {
    const pattern = `${SYNTHETIC_PHONE_PREFIX}%`;
    const counted = await countBy(client, "like $1", [pattern]);

    // The pattern is the only thing that decides what goes. A number one
    // digit outside the block is somebody real.
    await client.query("delete from volunteers where phone like $1", [pattern]);

    await recordAdminAction(
      "clear_synthetic",
      `${counted.signups} signups, ${counted.volunteers} volunteer records`,
      client,
    );
    return counted;
  });
}

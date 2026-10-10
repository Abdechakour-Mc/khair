import { recordAdminAction } from "./audit";
import { db, inTransaction } from "./db";
import { ConflictError } from "./errors";

/**
 * What the Admin records about one Volunteer: that they are relied upon, or
 * that they have been asked to pause.
 *
 * Both are private to the Admin, appear on no public page, are never shown to
 * the Volunteer, and are never counted into a score or a rank. The early
 * access that trust unlocks lives in `tasks.ts`, with the rule about which
 * Tasks are withheld.
 */

export type VolunteerStanding = {
  trusted: boolean;
  /** When the Admin asked them to pause, and null when they have not. */
  pausedAt: Date | null;
};

export async function volunteerStanding(phone: string): Promise<VolunteerStanding | null> {
  if (!phone) return null;
  const { rows } = await db().query<{ trusted: boolean; paused_at: Date | null }>(
    "select trusted, paused_at from volunteers where phone = $1",
    [phone],
  );
  const row = rows[0];
  return row ? { trusted: row.trusted, pausedAt: row.paused_at } : null;
}

/**
 * Whether the Admin has marked this number as one they rely on.
 *
 * Visible to the Admin alone, and never aggregated: there is no leaderboard
 * here for the same reason there is no score.
 */
export async function isTrustedVolunteer(phone: string): Promise<boolean> {
  return (await volunteerStanding(phone))?.trusted === true;
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

export async function isPausedVolunteer(phone: string): Promise<boolean> {
  const standing = await volunteerStanding(phone);
  return standing?.pausedAt != null;
}

/**
 * The Admin asks a Volunteer to pause, or lifts that.
 *
 * The ordinary tool for somebody who claims Slots and does not come, and
 * deliberately the only rung on the ladder: graduated, private, reversible
 * and recorded is what moderation practice recommends, and a single ban
 * switch is the pattern teams move away from, because almost every real case
 * is somebody unreliable rather than somebody malicious.
 *
 * Never automatic. No counter and no threshold reaches this function: the
 * Admin reads what happened and decides as a human.
 *
 * Stops new claims and nothing else. Signups they already hold are left
 * alone, because cancelling on somebody's behalf would be the mosque
 * deciding they are not coming; and releasing a Slot or saying work is done
 * keeps working, because a paused person must not be trapped in a
 * commitment they can no longer get out of.
 *
 * Recorded in `admin_actions`, so a decision can be explained later. The
 * record holds no name and no number, like every other row there.
 */
export async function setVolunteerPaused(phone: string, paused: boolean): Promise<Date | null> {
  return inTransaction(async (client) => {
    const { rows } = await client.query<{ paused_at: Date | null }>(
      `update volunteers set paused_at = case when $2 then now() else null end
        where phone = $1
        returning paused_at`,
      [phone, paused],
    );
    const row = rows[0];
    if (!row) {
      throw new ConflictError("signup_missing", "Nobody has signed up with that number.");
    }

    await recordAdminAction(paused ? "pause_volunteer" : "lift_pause", "", client);
    return row.paused_at;
  });
}

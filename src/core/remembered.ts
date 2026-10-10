/**
 * What this device remembers about the person using it: the name and number
 * they last signed up with, so a returning Volunteer does not retype both.
 *
 * One phone number is one person, which is the decision this is built on. The
 * number is the identity, so somebody who writes their name differently today
 * is still the same Volunteer, and two numbers are two people.
 *
 * A convenience and never proof of identity. Anybody can put anything in
 * their own cookie, so nothing that matters may depend on this: not reaching
 * a Signup, not releasing a Slot, not seeing a record, and nothing at all in
 * the Admin view. The single exception is the early access in ticket 09,
 * which is argued there, and which only ever reveals a Task that was about to
 * be public anyway.
 */

export const VOLUNTEER_COOKIE = "khair-volunteer";

/** A year: long enough to still be there next Ramadan. */
export const VOLUNTEER_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export type RememberedVolunteer = {
  name: string;
  /** E.164, as the core normalised it, not as it was typed. */
  phone: string;
};

/** Generous for a name, short enough that a crafted cookie is not a payload. */
const MAX_NAME = 80;
const MAX_PHONE = 20;

export function rememberVolunteer(remembered: RememberedVolunteer): string {
  return JSON.stringify({
    name: remembered.name.slice(0, MAX_NAME),
    phone: remembered.phone.slice(0, MAX_PHONE),
  });
}

/**
 * Reads the cookie back, and refuses anything that is not plainly a name and
 * an E.164 number. A device that never completed a Signup has nothing here,
 * and a damaged or hand-written cookie is treated the same as none: the form
 * simply arrives empty, which is the state every first-time visitor sees.
 */
export function readRememberedVolunteer(value: string | undefined): RememberedVolunteer | null {
  if (!value) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    return null;
  }
  if (typeof parsed !== "object" || parsed === null) return null;

  const { name, phone } = parsed as Record<string, unknown>;
  if (typeof name !== "string" || typeof phone !== "string") return null;

  const trimmedName = name.trim().slice(0, MAX_NAME);
  const trimmedPhone = phone.trim();
  if (!trimmedName) return null;
  // Both halves or neither: a prefilled number with no name, or the reverse,
  // is more confusing on the form than an empty one.
  if (!/^\+[1-9][0-9]{6,14}$/.test(trimmedPhone)) return null;

  return { name: trimmedName, phone: trimmedPhone };
}

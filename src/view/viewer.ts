import { cookies } from "next/headers";
import { readRememberedVolunteer, VOLUNTEER_COOKIE } from "@/core/remembered";
import { isTrustedVolunteer, type Viewer } from "@/core/tasks";

/**
 * What the public pages know about whoever is reading them, which is only
 * ever "has this device signed somebody up, and is that number one the Admin
 * relies on".
 *
 * Deliberately the weakest thing that works. There is no login, so this rests
 * on the remembered cookie from ticket 14, and anybody can write their own
 * cookie. What it decides is a few hours of first refusal on work that holds
 * nothing personal, which is why ticket 09 calls early access convenience
 * rather than a boundary. Claiming is checked against the phone number
 * actually submitted, not against this.
 */
export async function currentViewer(): Promise<Viewer> {
  const remembered = readRememberedVolunteer((await cookies()).get(VOLUNTEER_COOKIE)?.value);
  if (!remembered) return { trusted: false };
  return { trusted: await isTrustedVolunteer(remembered.phone) };
}

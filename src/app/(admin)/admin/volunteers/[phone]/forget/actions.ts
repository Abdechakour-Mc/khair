"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, sessionIsValid } from "@/core/admin";
import { forgetVolunteer } from "@/core/erasure";
import { ConflictError } from "@/core/errors";

/**
 * Erases one Volunteer, confirmed by typing their number.
 *
 * Confirmed rather than undoable because it genuinely cannot be undone: this
 * is the answer to somebody asking for their data to be deleted, so a
 * recoverable version of it would not be an answer at all.
 */
export async function forgetVolunteerAction(formData: FormData): Promise<void> {
  const jar = await cookies();
  if (!sessionIsValid(jar.get(ADMIN_COOKIE)?.value)) redirect("/admin");

  const phone = String(formData.get("phone") ?? "");
  const typed = String(formData.get("typed") ?? "");

  try {
    const erased = await forgetVolunteer(phone, typed);
    redirect(
      `/admin/tasks?done=forget&signups=${erased.signups}&volunteers=${erased.volunteers}`,
    );
  } catch (error) {
    if (error instanceof ConflictError) {
      redirect(
        `/admin/volunteers/${encodeURIComponent(phone)}/forget?problem=${error.reason}`,
      );
    }
    throw error;
  }
}

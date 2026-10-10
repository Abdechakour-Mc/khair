"use server";

import { redirect } from "next/navigation";
import { ConflictError } from "@/core/errors";
import { releaseSignup, setVolunteerDone } from "@/core/signups";
import { defaultLocale, isLocale, type Locale } from "@/i18n/config";

export async function releaseSignupAction(formData: FormData): Promise<void> {
  const submittedLocale = String(formData.get("locale") ?? "");
  const locale: Locale = isLocale(submittedLocale) ? submittedLocale : defaultLocale;
  const token = String(formData.get("token") ?? "");

  try {
    await releaseSignup(token);
  } catch (error) {
    if (error instanceof ConflictError) {
      // The page re-renders and explains; there is nothing a Volunteer can
      // usefully do about a link that matches no Signup.
      redirect(`/${locale}/signup/${encodeURIComponent(token)}`);
    }
    throw error;
  }

  // Back to the same page, which now shows the released state.
  redirect(`/${locale}/signup/${encodeURIComponent(token)}`);
}

/**
 * The Volunteer says they have done the work, or takes it back.
 *
 * Reachable only with their own link, like releasing a Slot, and it writes
 * their own column rather than the Admin's record of them.
 */
export async function setVolunteerDoneAction(formData: FormData): Promise<void> {
  const submittedLocale = String(formData.get("locale") ?? "");
  const locale: Locale = isLocale(submittedLocale) ? submittedLocale : defaultLocale;
  const token = String(formData.get("token") ?? "");
  const done = String(formData.get("done") ?? "") === "true";

  try {
    await setVolunteerDone(token, done);
  } catch (error) {
    if (error instanceof ConflictError) {
      // The page re-renders and says why; there is nothing to retry.
      redirect(`/${locale}/signup/${encodeURIComponent(token)}?problem=${error.reason}`);
    }
    throw error;
  }

  redirect(`/${locale}/signup/${encodeURIComponent(token)}`);
}

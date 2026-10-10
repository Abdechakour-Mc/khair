"use server";

import { redirect } from "next/navigation";
import { ConflictError } from "@/core/errors";
import { releaseSignup } from "@/core/signups";
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

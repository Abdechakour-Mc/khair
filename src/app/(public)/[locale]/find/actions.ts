"use server";

import { redirect } from "next/navigation";
import { findSignupByCode } from "@/core/signups";
import { defaultLocale, isLocale, type Locale } from "@/i18n/config";

export type FindState = {
  /** True when nothing matched, which is the only failure this page has. */
  notFound?: boolean;
  /** Echoed back so a mistyped digit is not a retyped form. */
  code?: string;
  phone?: string;
};

/**
 * Looks up one Signup from the short code and the phone number that claimed
 * it, and sends them to the page they would have kept.
 *
 * One failure and one message. A code that never existed, somebody else's
 * code, a mistyped number and a released Slot all come back the same way, so
 * this form cannot be used to find out whether a code or a number is in use.
 */
export async function findSignupAction(
  _previous: FindState,
  formData: FormData,
): Promise<FindState> {
  const submittedLocale = String(formData.get("locale") ?? "");
  const locale: Locale = isLocale(submittedLocale) ? submittedLocale : defaultLocale;
  const code = String(formData.get("code") ?? "");
  const phone = String(formData.get("phone") ?? "");

  const signup = await findSignupByCode(code, phone);
  if (!signup) return { notFound: true, code, phone };

  // Straight to the page the long link opens, which is where everything they
  // can do about this Signup already lives.
  redirect(`/${locale}/signup/${signup.cancelToken}`);
}

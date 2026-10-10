"use server";

import { redirect } from "next/navigation";
import { ConflictError, ValidationError } from "@/core/errors";
import { claimSlot } from "@/core/signups";
import { defaultLocale, isLocale, type Locale } from "@/i18n/config";
import type { ProblemKey } from "@/i18n/messages";

export type ClaimState = {
  /** Which problem to show, looked up in the reader's own language. */
  problem?: ProblemKey;
  /** The input to point at, so the message sits beside the field it concerns. */
  field?: string;
  /** Echoed back so a rejected form is not wiped. */
  name?: string;
  phone?: string;
};

export async function claimSlotAction(
  _previous: ClaimState,
  formData: FormData,
): Promise<ClaimState> {
  const submittedLocale = String(formData.get("locale") ?? "");
  const locale: Locale = isLocale(submittedLocale) ? submittedLocale : defaultLocale;
  const taskId = String(formData.get("taskId") ?? "");
  const name = String(formData.get("name") ?? "");
  const phone = String(formData.get("phone") ?? "");

  let cancelToken: string;
  try {
    const signup = await claimSlot({ taskId, name, phone });
    cancelToken = signup.cancelToken;
  } catch (error) {
    if (error instanceof ValidationError) {
      return { problem: error.code, field: error.field, name, phone };
    }
    if (error instanceof ConflictError) {
      return { problem: error.reason, name, phone };
    }
    console.error("claimSlot failed", error);
    return { problem: "unknown", name, phone };
  }

  // The confirmation page is the cancellation link: its URL carries the
  // secret, so saving the page is all a Volunteer has to do to keep it.
  redirect(`/${locale}/signup/${cancelToken}`);
}

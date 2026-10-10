"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, sessionIsValid } from "@/core/admin";
import { ConflictError } from "@/core/errors";
import { setVolunteerPaused, setVolunteerTrusted } from "@/core/volunteers";

/**
 * The Admin marks somebody as a Volunteer they rely on, or takes it back.
 *
 * Private to the Admin: it appears on no public page, is never shown to the
 * Volunteer, and is never counted into a score or a rank. All it does is let
 * them see important work first.
 */
export async function setVolunteerTrustedAction(formData: FormData): Promise<void> {
  const jar = await cookies();
  if (!sessionIsValid(jar.get(ADMIN_COOKIE)?.value)) redirect("/admin");

  const phone = String(formData.get("phone") ?? "");
  const trusted = String(formData.get("trusted") ?? "") === "true";

  try {
    await setVolunteerTrusted(phone, trusted);
  } catch (error) {
    if (error instanceof ConflictError) {
      redirect(`/admin/volunteers/${encodeURIComponent(phone)}?problem=${error.reason}`);
    }
    throw error;
  }

  redirect(`/admin/volunteers/${encodeURIComponent(phone)}`);
}

/**
 * The Admin asks a Volunteer to pause, or lifts it.
 *
 * Private and reversible, and recorded in `admin_actions` so the decision can
 * be explained months later. Nothing is announced and no public page changes.
 */
export async function setVolunteerPausedAction(formData: FormData): Promise<void> {
  const jar = await cookies();
  if (!sessionIsValid(jar.get(ADMIN_COOKIE)?.value)) redirect("/admin");

  const phone = String(formData.get("phone") ?? "");
  const paused = String(formData.get("paused") ?? "") === "true";

  try {
    await setVolunteerPaused(phone, paused);
  } catch (error) {
    if (error instanceof ConflictError) {
      redirect(`/admin/volunteers/${encodeURIComponent(phone)}?problem=${error.reason}`);
    }
    throw error;
  }

  redirect(`/admin/volunteers/${encodeURIComponent(phone)}`);
}

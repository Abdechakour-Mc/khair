"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, sessionIsValid } from "@/core/admin";
import { setTaskClosed } from "@/core/tasks";

/**
 * Withdraws work that is no longer happening, or puts it back.
 *
 * Existing Signups are kept. Telling the Volunteers who had claimed a Slot is
 * a message the Admin sends by hand, using the tappable numbers on this page:
 * in-app notification is deliberately out of scope for v1.
 */
export async function setTaskClosedAction(formData: FormData): Promise<void> {
  const jar = await cookies();
  if (!sessionIsValid(jar.get(ADMIN_COOKIE)?.value)) redirect("/admin");

  const id = String(formData.get("id") ?? "");
  const closed = String(formData.get("closed") ?? "") === "true";

  await setTaskClosed(id, closed);
  redirect(`/admin/tasks/${id}`);
}

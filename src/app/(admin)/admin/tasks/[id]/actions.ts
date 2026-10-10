"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, sessionIsValid } from "@/core/admin";
import { ConflictError } from "@/core/errors";
import { setOutcome } from "@/core/signups";
import { deleteTask, restoreTask, setTaskClosed } from "@/core/tasks";

/**
 * Sends the Admin back to the Task they were looking at, carrying a problem
 * to explain if there was one.
 *
 * Both actions below can lose a race with a Volunteer: the Admin has a Task
 * page open, the Volunteer releases their Slot, and the Admin taps "Did not
 * come". An uncaught ConflictError replaced the whole page with a generic
 * error screen and no way back, which is the worst outcome available for
 * something as ordinary as two people acting at once.
 */
function backToTask(taskId: string, problem?: ConflictError): never {
  const query = problem ? `?problem=${encodeURIComponent(problem.reason)}` : "";
  redirect(`/admin/tasks/${taskId}${query}`);
}

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

  try {
    await setTaskClosed(id, closed);
  } catch (error) {
    if (error instanceof ConflictError) backToTask(id, error);
    throw error;
  }
  backToTask(id);
}

/**
 * Deletes a Task and the Signups on it.
 *
 * Not confirmed, because it is reversible: the undo on the task list is the
 * safety net, which is both what WCAG 2.2 3.3.4 accepts and what the
 * long-standing finding on undo-versus-confirm recommends. Adding a dialog
 * here is how people are trained to tap straight through the dialogs that
 * matter.
 */
export async function deleteTaskAction(formData: FormData): Promise<void> {
  const jar = await cookies();
  if (!sessionIsValid(jar.get(ADMIN_COOKIE)?.value)) redirect("/admin");

  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "");

  try {
    await deleteTask(id);
  } catch (error) {
    if (error instanceof ConflictError) backToTask(id, error);
    throw error;
  }
  redirect(`/admin/tasks?deleted=${encodeURIComponent(id)}&title=${encodeURIComponent(title)}`);
}

/** The undo. Brings back the Task and everybody who had claimed a Slot. */
export async function restoreTaskAction(formData: FormData): Promise<void> {
  const jar = await cookies();
  if (!sessionIsValid(jar.get(ADMIN_COOKIE)?.value)) redirect("/admin");

  const id = String(formData.get("id") ?? "");

  try {
    await restoreTask(id);
  } catch (error) {
    if (error instanceof ConflictError) redirect(`/admin/tasks?problem=${error.reason}`);
    throw error;
  }
  redirect(`/admin/tasks/${id}`);
}

/**
 * Records how a Signup ended. Every Signup already counts as done, so this is
 * only ever used on the exceptions, and it is always reversible.
 */
export async function setOutcomeAction(formData: FormData): Promise<void> {
  const jar = await cookies();
  if (!sessionIsValid(jar.get(ADMIN_COOKIE)?.value)) redirect("/admin");

  const taskId = String(formData.get("taskId") ?? "");
  const signupId = String(formData.get("signupId") ?? "");
  const outcome = String(formData.get("outcome") ?? "");

  if (outcome === "done" || outcome === "no_show") {
    try {
      await setOutcome(signupId, outcome);
    } catch (error) {
      if (error instanceof ConflictError) backToTask(taskId, error);
      throw error;
    }
  }
  backToTask(taskId);
}

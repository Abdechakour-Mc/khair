"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, sessionIsValid } from "@/core/admin";
import { recordAdminAction } from "@/core/audit";
import { clearSyntheticData } from "@/core/erasure";
import { ConflictError } from "@/core/errors";
import { finaliseDeletedTasks, purgeExpiredSignups } from "@/core/retention";

/**
 * The destructive actions that are not about one person or one Task.
 *
 * Every one of them is refused without a valid Admin session, like every
 * other Admin route, and every one reports what it did in numbers rather
 * than as a silent success.
 */
async function requireSession(): Promise<void> {
  const jar = await cookies();
  if (!sessionIsValid(jar.get(ADMIN_COOKIE)?.value)) redirect("/admin");
}

export async function runPurgeAction(): Promise<void> {
  await requireSession();

  const purged = await purgeExpiredSignups();
  const finalised = await finaliseDeletedTasks();
  await recordAdminAction(
    "purge_by_hand",
    `${purged.signupsDeleted} signups, ${purged.volunteersDeleted} volunteer records, ${finalised.tasksDeleted} deleted tasks`,
  );

  redirect(
    `/admin/data?done=purge&signups=${purged.signupsDeleted}&volunteers=${purged.volunteersDeleted}`,
  );
}

export async function clearSyntheticAction(formData: FormData): Promise<void> {
  await requireSession();

  try {
    const cleared = await clearSyntheticData(String(formData.get("phrase") ?? ""));
    redirect(
      `/admin/data?done=synthetic&signups=${cleared.signups}&volunteers=${cleared.volunteers}`,
    );
  } catch (error) {
    if (error instanceof ConflictError) redirect(`/admin/data?problem=${error.reason}`);
    throw error;
  }
}

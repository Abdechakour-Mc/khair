"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, sessionIsValid } from "@/core/admin";
import { publishTask } from "@/core/tasks";
import { appTimeZone } from "@/i18n/config";
import { describeFailure, readOpenTo, readSlotsNeeded, readTaskForm, resolveTaskTimes } from "../form-logic";
import type { TaskFormState } from "../form-state";

export async function publishTaskAction(
  _previous: TaskFormState,
  formData: FormData,
): Promise<TaskFormState> {
  const jar = await cookies();
  if (!sessionIsValid(jar.get(ADMIN_COOKIE)?.value)) redirect("/admin");

  const values = readTaskForm(formData);
  const times = resolveTaskTimes(values, appTimeZone());
  if (!("dueBy" in times)) return times;

  try {
    await publishTask({
      title: values.title,
      description: values.description,
      location: values.location,
      openTo: readOpenTo(values),
      urgent: values.urgent === "true",
      important: values.important === "true",
      startsAt: times.startsAt,
      dueBy: times.dueBy,
      slotsNeeded: readSlotsNeeded(values),
    });
  } catch (error) {
    return describeFailure(error, values);
  }

  redirect("/admin/tasks");
}

"use server";

import { redirect } from "next/navigation";
import { sessionIsValid, ADMIN_COOKIE } from "@/core/admin";
import { ValidationError } from "@/core/errors";
import { publishTask } from "@/core/tasks";
import { parseWallTimeInZone } from "@/core/time";
import { appTimeZone } from "@/i18n/config";
import { cookies } from "next/headers";

export type PublishState = {
  problem?: string;
  field?: string;
  values?: {
    title: string;
    description: string;
    location: string;
    startsAt: string;
    dueBy: string;
    slotsNeeded: string;
  };
};

const PROBLEMS: Record<string, string> = {
  title_required: "Give the task a title.",
  deadline_required: "Set a deadline, or a date and time to work back from.",
  start_invalid: "That date and time cannot be read.",
  start_after_deadline: "The start time is after the deadline.",
  slots_too_few: "At least one helper is needed.",
  unknown: "Something went wrong. The task was not published.",
};

export async function publishTaskAction(
  _previous: PublishState,
  formData: FormData,
): Promise<PublishState> {
  const jar = await cookies();
  if (!sessionIsValid(jar.get(ADMIN_COOKIE)?.value)) redirect("/admin");

  const values = {
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    location: String(formData.get("location") ?? ""),
    startsAt: String(formData.get("startsAt") ?? ""),
    dueBy: String(formData.get("dueBy") ?? ""),
    slotsNeeded: String(formData.get("slotsNeeded") ?? "1"),
  };

  const timeZone = appTimeZone();
  const startsAt = values.startsAt.trim()
    ? parseWallTimeInZone(values.startsAt, timeZone)
    : null;

  if (values.startsAt.trim() && !startsAt) {
    return { problem: PROBLEMS.start_invalid, field: "startsAt", values };
  }

  // A fixed Task's deadline defaults to its start: you cannot help with the
  // Friday setup after the Friday setup. One field fewer at 9pm on a Thursday.
  const dueBy = values.dueBy.trim() ? parseWallTimeInZone(values.dueBy, timeZone) : startsAt;

  if (!dueBy) {
    return { problem: PROBLEMS.deadline_required, field: "dueBy", values };
  }

  const slotsNeeded = Number.parseInt(values.slotsNeeded, 10);

  try {
    await publishTask({
      title: values.title,
      description: values.description,
      location: values.location,
      startsAt,
      dueBy,
      slotsNeeded: Number.isNaN(slotsNeeded) ? 1 : slotsNeeded,
    });
  } catch (error) {
    if (error instanceof ValidationError) {
      return {
        problem: PROBLEMS[error.code] ?? PROBLEMS.unknown,
        field: error.field,
        values,
      };
    }
    console.error("publishTask failed", error);
    return { problem: PROBLEMS.unknown, values };
  }

  redirect("/admin/tasks");
}

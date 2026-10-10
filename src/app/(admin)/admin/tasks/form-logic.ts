import { ConflictError, ValidationError } from "@/core/errors";
import type { OpenTo } from "@/core/tasks";
import { parseWallTimeInZone } from "@/core/time";
import type { TaskFormState, TaskFormValues } from "./form-state";

/**
 * Shared between publishing a Task and editing one. Server only: these are
 * sync helpers, which a "use server" module may not export, and they reach
 * into the core.
 *
 * The Admin view is English only, so these sentences live here rather than in
 * the public translations.
 */
export const TASK_PROBLEMS: Record<string, string> = {
  title_required: "Give the task a title.",
  deadline_required: "Set a deadline, or a date and time to work back from.",
  start_invalid: "That date and time cannot be read.",
  start_after_deadline: "The start time is after the deadline.",
  slots_too_few: "At least one helper is needed.",
  slots_below_claimed: "More people have already claimed a spot than that.",
  open_to_invalid: "Choose who the task is for.",
  task_missing: "That task no longer exists.",
  unknown: "Something went wrong. Nothing was saved.",
};

export function readTaskForm(formData: FormData): TaskFormValues {
  return {
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    location: String(formData.get("location") ?? ""),
    openTo: String(formData.get("openTo") ?? ""),
    urgent: formData.get("urgent") === "true" ? "true" : "",
    startsAt: String(formData.get("startsAt") ?? ""),
    dueBy: String(formData.get("dueBy") ?? ""),
    slotsNeeded: String(formData.get("slotsNeeded") ?? "1"),
  };
}

/**
 * Left for the core to check rather than corrected here: a tampered value
 * should come back as the same ValidationError as any other bad field, not be
 * quietly widened to `anyone` on a Task that was meant for the sisters.
 */
export function readOpenTo(values: TaskFormValues): OpenTo | undefined {
  return values.openTo.trim() === "" ? undefined : (values.openTo as OpenTo);
}

export function readSlotsNeeded(values: TaskFormValues): number {
  const parsed = Number.parseInt(values.slotsNeeded, 10);
  return Number.isNaN(parsed) ? 1 : parsed;
}

/**
 * Resolves the two wall times against the mosque's timezone.
 *
 * A fixed Task's deadline defaults to its start: you cannot help with the
 * Friday setup after the Friday setup, and that is one field fewer at 9pm on
 * a Thursday.
 */
export function resolveTaskTimes(
  values: TaskFormValues,
  timeZone: string,
): { startsAt: Date | null; dueBy: Date } | TaskFormState {
  const startsAt = values.startsAt.trim() ? parseWallTimeInZone(values.startsAt, timeZone) : null;
  if (values.startsAt.trim() && !startsAt) {
    return { problem: TASK_PROBLEMS.start_invalid, field: "startsAt", values };
  }

  const dueBy = values.dueBy.trim() ? parseWallTimeInZone(values.dueBy, timeZone) : startsAt;
  if (!dueBy) {
    return { problem: TASK_PROBLEMS.deadline_required, field: "dueBy", values };
  }

  return { startsAt, dueBy };
}

export function describeFailure(error: unknown, values: TaskFormValues): TaskFormState {
  if (error instanceof ValidationError) {
    return {
      problem: TASK_PROBLEMS[error.code] ?? TASK_PROBLEMS.unknown,
      field: error.field,
      values,
    };
  }
  if (error instanceof ConflictError) {
    return { problem: TASK_PROBLEMS[error.reason] ?? TASK_PROBLEMS.unknown, values };
  }
  console.error("task write failed", error);
  return { problem: TASK_PROBLEMS.unknown, values };
}

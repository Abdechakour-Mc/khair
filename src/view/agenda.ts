import type { OpenTask } from "@/core/tasks";

export type AgendaGroup =
  | { kind: "day"; key: string; date: Date; tasks: OpenTask[] }
  | { kind: "flexible"; key: "flexible"; tasks: OpenTask[] };

/** The calendar day a moment falls on, in the mosque's own timezone. */
export function dayKey(moment: Date, timeZone: string): string {
  // en-CA formats as YYYY-MM-DD, which sorts correctly as a string.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(moment);
}

/**
 * Groups the public list the way a notice board reads: fixed Tasks under the
 * day they happen, in order, then every flexible Task collected at the end.
 *
 * Expects the order `listOpenTasks` returns (fixed first, by start time).
 */
export function groupIntoAgenda(tasks: OpenTask[], timeZone: string): AgendaGroup[] {
  const days: AgendaGroup[] = [];
  const flexible: OpenTask[] = [];
  const dayIndex = new Map<string, Extract<AgendaGroup, { kind: "day" }>>();

  for (const task of tasks) {
    if (task.startsAt === null) {
      flexible.push(task);
      continue;
    }

    const key = dayKey(task.startsAt, timeZone);
    const existing = dayIndex.get(key);
    if (existing) {
      existing.tasks.push(task);
      continue;
    }

    const group = { kind: "day" as const, key, date: task.startsAt, tasks: [task] };
    dayIndex.set(key, group);
    days.push(group);
  }

  if (flexible.length > 0) {
    days.push({ kind: "flexible", key: "flexible", tasks: flexible });
  }
  return days;
}

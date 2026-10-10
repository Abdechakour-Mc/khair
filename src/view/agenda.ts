import { happensAt, type OpenTask } from "@/core/tasks";

export type AgendaGroup =
  | { kind: "urgent"; key: "urgent"; tasks: OpenTask[] }
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
 * Groups the public list the way a notice board reads: anything urgent pinned
 * at the top, then fixed Tasks under the day they happen, in order, then
 * every flexible Task collected at the end.
 *
 * An urgent Task is pinned instead of appearing in its own day, not as well
 * as: the same Task twice on one short page reads as a mistake in the page
 * rather than as emphasis. The pinned card carries its own day, since it is
 * shown away from the heading that would otherwise have said it.
 *
 * Expects the order `listOpenTasks` returns (fixed first, by start time).
 */
export function groupIntoAgenda(tasks: OpenTask[], timeZone: string): AgendaGroup[] {
  const days: AgendaGroup[] = [];
  const urgent: OpenTask[] = [];
  const flexible: OpenTask[] = [];
  const dayIndex = new Map<string, Extract<AgendaGroup, { kind: "day" }>>();

  for (const task of tasks) {
    if (task.urgent) {
      urgent.push(task);
      continue;
    }
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

  if (urgent.length === 0) return days;

  // Soonest first, across both shapes: a flexible Task due tomorrow is more
  // pressing than a fixed one next week, and the incoming order puts every
  // fixed Task before every flexible one.
  urgent.sort((a, b) => happensAt(a).getTime() - happensAt(b).getTime());
  return [{ kind: "urgent", key: "urgent", tasks: urgent }, ...days];
}

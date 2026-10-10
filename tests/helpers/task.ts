import type { OpenTask } from "@/core/tasks";

/**
 * A Task shaped for the view layer, which never touches the database.
 *
 * Shared so that adding a field to a Task does not mean fixing the same
 * fixture in several test files, which is how the last two fields went.
 */
export function openTask(overrides: Partial<OpenTask> & { id: string }): OpenTask {
  const startsAt = overrides.startsAt ?? null;
  const dueBy = overrides.dueBy ?? new Date("2026-10-17T20:00:00Z");
  return {
    title: "Task",
    description: "",
    location: "",
    openTo: "anyone",
    urgent: false,
    important: false,
    demo: false,
    slotsNeeded: 1,
    closed: false,
    createdAt: new Date("2026-10-01T00:00:00Z"),
    slotsTaken: 0,
    slotsRemaining: 1,
    isFull: false,
    ...overrides,
    id: overrides.id,
    startsAt,
    dueBy,
    isFlexible: startsAt === null,
  };
}

/**
 * Types only. The client form imports from here, so nothing in this file may
 * pull in core code: a type disappears at build time, a value does not.
 */

export type TaskFormValues = {
  title: string;
  description: string;
  location: string;
  /** One of the Task's `openTo` values. Empty means the Admin left it alone. */
  openTo: string;
  /** "true" when the box is ticked. An unticked checkbox sends nothing. */
  urgent: string;
  important: string;
  startsAt: string;
  dueBy: string;
  slotsNeeded: string;
};

export type TaskFormState = {
  problem?: string;
  field?: string;
  values?: TaskFormValues;
};

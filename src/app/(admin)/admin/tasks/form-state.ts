/**
 * Types only. The client form imports from here, so nothing in this file may
 * pull in core code: a type disappears at build time, a value does not.
 */

export type TaskFormValues = {
  title: string;
  description: string;
  location: string;
  startsAt: string;
  dueBy: string;
  slotsNeeded: string;
};

export type TaskFormState = {
  problem?: string;
  field?: string;
  values?: TaskFormValues;
};

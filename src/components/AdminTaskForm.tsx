"use client";

import { useActionState } from "react";
import type {
  TaskFormState,
  TaskFormValues,
} from "@/app/(admin)/admin/tasks/form-state";

/**
 * Publishing a Task and editing one are the same fields, so they are the same
 * form. The server action comes in as a prop, which is how a Client Component
 * is allowed to hold one.
 */
export function AdminTaskForm({
  action,
  initial,
  hiddenFields,
  submitLabel,
  pendingLabel,
  timeZoneLabel,
}: {
  action: (state: TaskFormState, formData: FormData) => Promise<TaskFormState>;
  initial?: TaskFormValues;
  /** Carried in the form rather than an action closure, so the action stays a
      plain reference a Client Component is allowed to hold. */
  hiddenFields?: Record<string, string>;
  submitLabel: string;
  pendingLabel: string;
  timeZoneLabel: string;
}) {
  const [state, formAction, pending] = useActionState<TaskFormState, FormData>(action, {});

  // What came back from a rejected submit wins over what the page loaded with,
  // so a correction never silently discards the rest of the Admin's typing.
  const v = state.values ?? initial;
  const problemFor = (field: string) => (state.field === field ? state.problem : undefined);
  const formProblem = state.problem && !state.field ? state.problem : undefined;

  return (
    <form action={formAction} className="signup-form">
      {Object.entries(hiddenFields ?? {}).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}

      <div className="field">
        <label htmlFor="title">What needs doing</label>
        <input
          id="title"
          name="title"
          type="text"
          required
          maxLength={160}
          defaultValue={v?.title ?? ""}
          aria-invalid={problemFor("title") ? true : undefined}
        />
        {problemFor("title") ? <p className="problem">{problemFor("title")}</p> : null}
      </div>

      <div className="field">
        <label htmlFor="description">Details</label>
        <textarea
          id="description"
          name="description"
          rows={3}
          maxLength={600}
          defaultValue={v?.description ?? ""}
        />
        <p className="hint">What a volunteer needs to know before saying yes.</p>
      </div>

      <div className="field">
        <label htmlFor="location">Where</label>
        <input
          id="location"
          name="location"
          type="text"
          maxLength={120}
          defaultValue={v?.location ?? ""}
        />
      </div>

      <div className="field">
        <label htmlFor="startsAt">Date and time</label>
        <input
          id="startsAt"
          name="startsAt"
          type="datetime-local"
          defaultValue={v?.startsAt ?? ""}
          aria-invalid={problemFor("startsAt") ? true : undefined}
        />
        <p className="hint">
          Leave this empty if it can be done any time before the deadline. Times are{" "}
          {timeZoneLabel}.
        </p>
        {problemFor("startsAt") ? <p className="problem">{problemFor("startsAt")}</p> : null}
      </div>

      <div className="field">
        <label htmlFor="dueBy">Deadline</label>
        <input
          id="dueBy"
          name="dueBy"
          type="datetime-local"
          defaultValue={v?.dueBy ?? ""}
          aria-invalid={problemFor("dueBy") ? true : undefined}
        />
        <p className="hint">
          Required when there is no fixed time. Otherwise it defaults to the start.
        </p>
        {problemFor("dueBy") ? <p className="problem">{problemFor("dueBy")}</p> : null}
      </div>

      <div className="field">
        <label htmlFor="slotsNeeded">Helpers needed</label>
        <input
          id="slotsNeeded"
          name="slotsNeeded"
          type="number"
          min={1}
          max={99}
          step={1}
          defaultValue={v?.slotsNeeded ?? "1"}
          aria-invalid={problemFor("slotsNeeded") ? true : undefined}
        />
        {problemFor("slotsNeeded") ? (
          <p className="problem">{problemFor("slotsNeeded")}</p>
        ) : null}
      </div>

      {formProblem ? (
        <p className="problem problem-block" role="alert">
          {formProblem}
        </p>
      ) : null}

      <button type="submit" className="action" disabled={pending}>
        {pending ? pendingLabel : submitLabel}
      </button>
    </form>
  );
}

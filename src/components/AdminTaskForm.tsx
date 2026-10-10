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
  earlyAccessHours,
}: {
  action: (state: TaskFormState, formData: FormData) => Promise<TaskFormState>;
  initial?: TaskFormValues;
  /** Carried in the form rather than an action closure, so the action stays a
      plain reference a Client Component is allowed to hold. */
  hiddenFields?: Record<string, string>;
  submitLabel: string;
  pendingLabel: string;
  timeZoneLabel: string;
  /** How long trusted volunteers get important work to themselves. */
  earlyAccessHours: number;
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

      {/* A fact about the work, not about anybody claiming it: Khair stores
          no gender for any volunteer and asks for none. The public page says
          who the work is for and claiming is on trust. */}
      <div className="field">
        <label htmlFor="openTo">Who it is for</label>
        <select id="openTo" name="openTo" defaultValue={v?.openTo || "anyone"}>
          <option value="anyone">Anyone</option>
          <option value="brothers">Brothers</option>
          <option value="sisters">Sisters</option>
        </select>
        <p className="hint">
          Shown on the public page. Leave it as anyone unless the work really needs one or
          the other.
        </p>
        {problemFor("openTo") ? <p className="problem">{problemFor("openTo")}</p> : null}
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

      {/* Pins the task to the top of the public list and marks it there.
          Only useful while it stays rare, which is the Admin's judgement to
          make: nothing here counts or caps it. */}
      <div className="field field-check">
        <label htmlFor="urgent">
          <input
            id="urgent"
            name="urgent"
            type="checkbox"
            value="true"
            defaultChecked={v?.urgent === "true"}
          />
          Urgent
        </label>
        <p className="hint">Pinned to the top of the public list, and marked as urgent.</p>
      </div>

      {/* The opposite instruction from urgent: this one holds a task back
          from most people for a while. Nobody is ever told it happened. */}
      <div className="field field-check">
        <label htmlFor="important">
          <input
            id="important"
            name="important"
            type="checkbox"
            value="true"
            defaultChecked={v?.important === "true"}
          />
          Important
        </label>
        <p className="hint">
          Volunteers you have marked as trusted see it {earlyAccessHours} hours before anybody
          else. Nobody is told that a task was held back.
        </p>
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

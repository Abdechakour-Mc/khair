"use client";

import { useActionState } from "react";
import { claimSlotAction, type ClaimState } from "@/app/(public)/[locale]/task/[id]/actions";
import type { Locale } from "@/i18n/config";
import type { ProblemKey } from "@/i18n/messages";

/**
 * Only plain strings: the full Messages object carries pluralisation
 * functions, and a function cannot cross into a Client Component.
 */
export type SignupFormLabels = {
  nameLabel: string;
  phoneLabel: string;
  phoneHint: string;
  signUp: string;
  submitting: string;
  problems: Record<ProblemKey, string>;
};

/**
 * Name and phone number, nothing else. A React form action, so it still
 * submits and still shows its errors with JavaScript switched off.
 */
export function SignupForm({
  taskId,
  locale,
  labels,
  remembered,
}: {
  taskId: string;
  locale: Locale;
  labels: SignupFormLabels;
  /** What this device remembers, if it has signed somebody up before. */
  remembered?: { name: string; phone: string };
}) {
  const [state, formAction, pending] = useActionState<ClaimState, FormData>(claimSlotAction, {});

  const problem = state.problem ? labels.problems[state.problem] : undefined;
  // What came back from a rejected submit wins over what the device
  // remembers, so a correction is never silently undone.
  const name = state.name ?? remembered?.name ?? "";
  const phone = state.phone ?? remembered?.phone ?? "";
  const nameProblem = state.field === "name" ? problem : undefined;
  const phoneProblem = state.field === "phone" ? problem : undefined;
  // A conflict is about the Task, not a field, so it sits above the button.
  const formProblem = state.field ? undefined : problem;

  return (
    <form action={formAction} className="signup-form">
      <input type="hidden" name="taskId" value={taskId} />
      <input type="hidden" name="locale" value={locale} />

      <div className="field">
        <label htmlFor="name">{labels.nameLabel}</label>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          maxLength={80}
          required
          defaultValue={name}
          aria-invalid={nameProblem ? true : undefined}
          aria-describedby={nameProblem ? "name-problem" : undefined}
        />
        {nameProblem ? (
          <p className="problem" id="name-problem">
            {nameProblem}
          </p>
        ) : null}
      </div>

      <div className="field">
        <label htmlFor="phone">{labels.phoneLabel}</label>
        <input
          id="phone"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          required
          defaultValue={phone}
          aria-invalid={phoneProblem ? true : undefined}
          aria-describedby={phoneProblem ? "phone-problem" : "phone-hint"}
        />
        <p className="hint" id="phone-hint">
          {labels.phoneHint}
        </p>
        {phoneProblem ? (
          <p className="problem" id="phone-problem">
            {phoneProblem}
          </p>
        ) : null}
      </div>

      {formProblem ? (
        <p className="problem problem-block" role="alert">
          {formProblem}
        </p>
      ) : null}

      <button type="submit" className="action" disabled={pending}>
        {pending ? labels.submitting : labels.signUp}
      </button>
    </form>
  );
}

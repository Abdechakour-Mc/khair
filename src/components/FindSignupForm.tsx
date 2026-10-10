"use client";

import { useActionState } from "react";
import { findSignupAction, type FindState } from "@/app/(public)/[locale]/find/actions";
import type { Locale } from "@/i18n/config";

export type FindSignupLabels = {
  findCodeLabel: string;
  findCodeHint: string;
  phoneLabel: string;
  findPhoneHint: string;
  findSubmit: string;
  findSearching: string;
  findNothing: string;
};

/**
 * Two fields, because the code alone would be a downgrade: the page it opens
 * can cancel somebody's commitment and shows their name. The number is the
 * proof, and it is one they have already typed once.
 */
export function FindSignupForm({
  locale,
  labels,
}: {
  locale: Locale;
  labels: FindSignupLabels;
}) {
  const [state, formAction, pending] = useActionState<FindState, FormData>(findSignupAction, {});

  return (
    <form action={formAction} className="signup-form">
      <input type="hidden" name="locale" value={locale} />

      <div className="field">
        <label htmlFor="code">{labels.findCodeLabel}</label>
        <input
          id="code"
          name="code"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          maxLength={9}
          required
          defaultValue={state.code ?? ""}
          aria-describedby="code-hint"
        />
        <p className="hint" id="code-hint">
          {labels.findCodeHint}
        </p>
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
          defaultValue={state.phone ?? ""}
          aria-describedby="find-phone-hint"
        />
        <p className="hint" id="find-phone-hint">
          {labels.findPhoneHint}
        </p>
      </div>

      {/* One failure and one message: a wrong code, somebody else's code, a
          mistyped number and a released spot all read the same, so this form
          tells nobody whether a code or a number is in use. */}
      {state.notFound ? (
        <p className="problem problem-block" role="alert">
          {labels.findNothing}
        </p>
      ) : null}

      <button type="submit" className="action" disabled={pending}>
        {pending ? labels.findSearching : labels.findSubmit}
      </button>
    </form>
  );
}

import { countVolunteerRecords } from "@/core/erasure";
import { formatPhoneForDisplay } from "@/core/phone";
import { decodeParam } from "@/view/params";
import { requireAdminSession } from "../../../session";
import { forgetVolunteerAction } from "./actions";

export const dynamic = "force-dynamic";

/**
 * The confirmation page for erasing one Volunteer.
 *
 * A page of its own rather than a dialog, following the GOV.UK pattern, so it
 * works on an old phone with scripting switched off. Two steps, and the first
 * one says in numbers exactly what will be destroyed.
 */
export default async function ForgetVolunteer({
  params,
  searchParams,
}: {
  params: Promise<{ phone: string }>;
  searchParams: Promise<{ problem?: string }>;
}) {
  await requireAdminSession();

  const { phone: raw } = await params;
  const { problem } = await searchParams;
  const phone = decodeParam(raw);
  const counted = await countVolunteerRecords(phone);
  const display = formatPhoneForDisplay(phone);

  return (
    <>
      <p className="backlink">
        <a href={`/admin/volunteers/${encodeURIComponent(phone)}`}>Back to this volunteer</a>
      </p>

      <div className="masthead">
        <h1>Forget {display}?</h1>
        <p>
          This is the answer to somebody asking what Khair knows about them and asking for it to
          be deleted. It is complete, and it cannot be undone.
        </p>
      </div>

      {problem ? (
        <div className="empty is-problem" role="alert">
          <p>That is not the same number, so nothing was deleted. Try again or go back.</p>
        </div>
      ) : null}

      <div className="empty is-warning">
        <p>
          <strong>
            This will delete {counted.signups}{" "}
            {counted.signups === 1 ? "signup" : "signups"} and {counted.volunteers}{" "}
            {counted.volunteers === 1 ? "volunteer record" : "volunteer records"}.
          </strong>
        </p>
        <p>
          Their name, their number and every outcome you recorded against them go with it.
          Afterwards no page here mentions them, including this one.
        </p>
        <p>
          The tasks they signed up for are kept, and their spots go back to the pool. If a task
          is coming up and you were counting on them, tell whoever else needs to know first:
          after this you will have no way to reach them.
        </p>
      </div>

      <form action={forgetVolunteerAction} className="signup-form">
        <input type="hidden" name="phone" value={phone} />
        <div className="field">
          <label htmlFor="typed">Type their number to confirm</label>
          <input
            id="typed"
            name="typed"
            type="tel"
            inputMode="tel"
            autoComplete="off"
            required
            aria-invalid={problem ? true : undefined}
          />
          <p className="hint">{display}</p>
        </div>
        <button type="submit" className="action action-quiet action-danger">
          Forget this volunteer
        </button>
      </form>

      <p className="backlink">
        <a href={`/admin/volunteers/${encodeURIComponent(phone)}`}>No, keep their record</a>
      </p>
    </>
  );
}

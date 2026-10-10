import { formatPhoneForDisplay, whatsappHref } from "@/core/phone";
import { volunteerHistory } from "@/core/signups";
import { earlyAccessHours, isTrustedVolunteer } from "@/core/tasks";
import { appTimeZone } from "@/i18n/config";
import { describeLeadTime, formatShortDate } from "@/view/format";
import { decodeParam } from "@/view/params";
import { requireAdminSession } from "../../session";
import { setVolunteerTrustedAction } from "./actions";

export const dynamic = "force-dynamic";

const OUTCOME_LABEL: Record<string, string> = {
  done: "Came",
  no_show: "Did not come",
  cancelled: "Released the spot",
};

/**
 * One Volunteer's past Outcomes, so the Admin knows who to count on.
 *
 * Deliberately a list and never a tally. A count would be a score, and Khair
 * has no scores: the Admin reads what happened and judges as a human. Nothing
 * on this page is ever shown to the Volunteer.
 */
export default async function VolunteerRecord({
  params,
  searchParams,
}: {
  params: Promise<{ phone: string }>;
  searchParams: Promise<{ problem?: string }>;
}) {
  await requireAdminSession();
  const { problem } = await searchParams;

  const { phone } = await params;
  // Decoded, but not trusted to be decodable: see decodeParam.
  const e164 = decodeParam(phone);
  const history = await volunteerHistory(e164);
  const trusted = await isTrustedVolunteer(e164);
  const timeZone = appTimeZone();

  return (
    <>
      <p className="backlink">
        <a href="/admin/tasks">All tasks</a>
      </p>

      <div className="masthead">
        <h1>{formatPhoneForDisplay(e164)}</h1>
        <p>
          Private to you. Nothing here is shown to the volunteer, and none of it is added up
          into a score.
        </p>
      </div>

      <p className="backlink">
        <a href={`tel:${e164}`}>Call</a>
        {" · "}
        <a href={whatsappHref(e164)} rel="noreferrer noopener">
          WhatsApp
        </a>
      </p>

      {problem ? (
        <div className="empty" role="alert">
          <p>
            {problem === "signup_missing"
              ? "Nobody has signed up with that number, so there is nobody to mark yet."
              : "That did not go through. Nothing was changed."}
          </p>
        </div>
      ) : null}

      {/* Private to you. It appears on no public page, is never shown to the
          volunteer, and is never added up into a score: all it does is let
          them see important work first. */}
      <h2 className="day-heading">Someone you rely on</h2>
      <div className="empty">
        <p>
          {trusted
            ? `Marked as trusted, so they see important tasks ${earlyAccessHours()} hours before anybody else.`
            : "Not marked. They see important tasks at the same time as everybody else."}
        </p>
        <form action={setVolunteerTrustedAction}>
          <input type="hidden" name="phone" value={e164} />
          <input type="hidden" name="trusted" value={trusted ? "false" : "true"} />
          <button type="submit" className="action action-quiet">
            {trusted ? "Remove the mark" : "Mark as trusted"}
          </button>
        </form>
      </div>

      <h2 className="day-heading">What happened</h2>
      {history.length === 0 ? (
        <div className="empty">
          <p>No signups on record for this number.</p>
        </div>
      ) : (
        history.map((entry) => (
          <article className="slot" key={entry.signupId}>
            <div>
              <div className="slot-head">
                <h2>{entry.taskTitle}</h2>
                {/* Work that has not happened yet is reported as such. The
                    outcome defaults to "done", so this would otherwise read
                    as attendance nobody has given yet. */}
                <span
                  className={entry.pending || entry.outcome === "done" ? "spots" : "spots covered"}
                >
                  {entry.pending
                    ? "Not yet"
                    : (OUTCOME_LABEL[entry.outcome] ?? entry.outcome)}
                </span>
              </div>
              <p className="detail">
                <span className="when">{formatShortDate(entry.taskDueBy, "en", timeZone)}</span>
                {entry.cancelledAt ? ` · ${describeLeadTime(entry.cancelledAt, entry.taskDueBy)}` : null}
              </p>
            </div>
          </article>
        ))
      )}

      {/* The way to answer somebody who asks for their data to be deleted.
          At the foot of the page rather than beside the record: it is the
          rarest thing here and the only thing that cannot be undone. */}
      <h2 className="day-heading">If they ask to be forgotten</h2>
      <div className="empty">
        <p>
          You can delete this volunteer and everything above. It is complete and it cannot be
          undone, so it asks you to type their number first.
        </p>
        <p className="backlink">
          <a className="linkish linkish-destructive" href={`/admin/volunteers/${encodeURIComponent(e164)}/forget`}>
            Forget this volunteer
          </a>
        </p>
      </div>
    </>
  );
}

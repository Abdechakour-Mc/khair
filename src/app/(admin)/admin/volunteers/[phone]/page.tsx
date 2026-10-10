import { formatPhoneForDisplay, whatsappHref } from "@/core/phone";
import { volunteerHistory } from "@/core/signups";
import { appTimeZone } from "@/i18n/config";
import { describeLeadTime, formatShortDate } from "@/view/format";
import { requireAdminSession } from "../../session";

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
}: {
  params: Promise<{ phone: string }>;
}) {
  await requireAdminSession();

  // Next has already percent-decoded the param. Decoding it again threw a
  // URIError on a stray `%` and turned `%2520` into a space.
  const { phone: e164 } = await params;
  const history = await volunteerHistory(e164);
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
    </>
  );
}

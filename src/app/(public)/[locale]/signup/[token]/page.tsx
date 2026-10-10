import { notFound } from "next/navigation";
import { mosqueIdentity } from "@/config/mosque";
import { findSignupByCancelToken } from "@/core/signups";
import { getTaskWithSlots, hasHappened } from "@/core/tasks";
import { appTimeZone, isLocale } from "@/i18n/config";
import { messages } from "@/i18n/messages";
import { formatDayHeading, formatShortDate, formatTime } from "@/view/format";
import { releaseSignupAction } from "./actions";

export const dynamic = "force-dynamic";

/**
 * The confirmation page, and the way out of a Signup.
 *
 * Its own URL carries the Cancel Token, so this page is the link a Volunteer
 * keeps. The token reaches this Signup and nothing else: no other Signup by
 * the same Volunteer, and no part of their history.
 */
export default async function SignupConfirmation({
  params,
}: {
  params: Promise<{ locale: string; token: string }>;
}) {
  const { locale, token } = await params;
  if (!isLocale(locale)) notFound();

  const m = messages[locale];
  const mosque = mosqueIdentity(locale);
  const signup = await findSignupByCancelToken(token);

  if (!signup) {
    return (
      <>
        <div className="masthead">
          <h1>{m.confirmedUnknownTitle}</h1>
          <p>{m.confirmedUnknownBody}</p>
        </div>
        <p className="backlink">
          <a href={`/${locale}`}>{m.backToList}</a>
        </p>
      </>
    );
  }

  const released = signup.cancelledAt !== null;
  const task = await getTaskWithSlots(signup.taskId);
  const happened = task !== null && hasHappened(task);
  const timeZone = appTimeZone();
  const when = task?.startsAt
    ? `${formatDayHeading(task.startsAt, locale, timeZone)}, ${formatTime(task.startsAt, locale, timeZone)}`
    : m.noFixedTime;

  return (
    <>
      <div className="masthead">
        <h1>{released ? m.releasedTitle : m.confirmedTitle}</h1>
        {released ? <p>{m.releasedBody}</p> : task ? <p>{m.confirmedFor(task.title)}</p> : null}
      </div>

      {task && !released ? (
        <dl className="facts">
          <div>
            <dt>{m.whenLabel}</dt>
            <dd>{when}</dd>
          </div>
          {task.location ? (
            <div>
              <dt>{m.whereLabel}</dt>
              <dd>{task.location}</dd>
            </div>
          ) : null}
          <div>
            <dt>{m.deadlineLabel}</dt>
            <dd>{formatShortDate(task.dueBy, locale, timeZone)}</dd>
          </div>
        </dl>
      ) : null}

      {released ? null : (
        <>
          <div className="empty">
            <p>{m.confirmedKeepLink}</p>
            {mosque.name ? <p className="hint">{m.heldBy(mosque.name)}</p> : null}
          </div>

          {happened ? (
            // Not offered once the work has happened. Releasing a Slot is a
            // statement about the future, and the core refuses it afterwards,
            // so a button here would only ever produce an error.
            <p className="hint">{m.releaseTooLate}</p>
          ) : (
            /* A plain server action: no client JavaScript, so releasing a Slot
               works on any phone that can submit a form. */
            <form action={releaseSignupAction} className="release-form">
              <input type="hidden" name="token" value={signup.cancelToken} />
              <input type="hidden" name="locale" value={locale} />
              <button type="submit" className="action action-quiet">
                {m.releaseSlot}
              </button>
            </form>
          )}
        </>
      )}

      <p className="backlink">
        <a href={`/${locale}`}>{m.backToList}</a>
      </p>
    </>
  );
}

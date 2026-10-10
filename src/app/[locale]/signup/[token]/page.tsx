import { notFound } from "next/navigation";
import { findSignupByCancelToken } from "@/core/signups";
import { getTaskWithSlots } from "@/core/tasks";
import { appTimeZone, isLocale } from "@/i18n/config";
import { messages } from "@/i18n/messages";
import { formatDayHeading, formatShortDate, formatTime } from "@/view/format";

export const dynamic = "force-dynamic";

/**
 * The confirmation page. Its own URL carries the Cancel Token, so this page
 * is also the link a Volunteer keeps in order to release the Slot later
 * (ticket 03 adds the control itself).
 *
 * The token reaches this Signup and nothing else: no other Signup by the same
 * Volunteer, and no part of their history.
 */
export default async function SignupConfirmation({
  params,
}: {
  params: Promise<{ locale: string; token: string }>;
}) {
  const { locale, token } = await params;
  if (!isLocale(locale)) notFound();

  const m = messages[locale];
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

  const task = await getTaskWithSlots(signup.taskId);
  const timeZone = appTimeZone();
  const when =
    task?.startsAt
      ? `${formatDayHeading(task.startsAt, locale, timeZone)}, ${formatTime(task.startsAt, locale, timeZone)}`
      : m.noFixedTime;

  return (
    <>
      <div className="masthead">
        <h1>{m.confirmedTitle}</h1>
        {task ? <p>{m.confirmedFor(task.title)}</p> : null}
      </div>

      {task ? (
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

      <div className="empty">
        <p>{m.confirmedKeepLink}</p>
      </div>

      <p className="backlink">
        <a href={`/${locale}`}>{m.backToList}</a>
      </p>
    </>
  );
}

import { notFound } from "next/navigation";
import { CalendarLinks } from "@/components/CalendarLinks";
import { mosqueIdentity } from "@/config/mosque";
import { findSignupByCancelToken } from "@/core/signups";
import { getTaskWithSlots, hasHappened } from "@/core/tasks";
import { appTimeZone, isLocale } from "@/i18n/config";
import { messages } from "@/i18n/messages";
import { formatDayHeading, formatShortDate, formatTime } from "@/view/format";
import { siteOrigin } from "@/view/site";
import { releaseSignupAction, setVolunteerDoneAction } from "./actions";

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
  searchParams,
}: {
  params: Promise<{ locale: string; token: string }>;
  searchParams: Promise<{ problem?: string }>;
}) {
  const { locale, token } = await params;
  const { problem } = await searchParams;
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
  // A fixed Task that is under way: it can be reported done, even though the
  // Slot can no longer be released.
  const started = task?.startsAt != null && task.startsAt.getTime() <= Date.now();
  const timeZone = appTimeZone();
  const site = await siteOrigin();
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

          {problem && problem in m.problems ? (
            <p className="problem problem-block" role="alert">
              {m.problems[problem as keyof typeof m.problems]}
            </p>
          ) : null}

          {/* Closing the loop themselves, instead of the organiser chasing
              to find out. It matters most on a flexible task, where nobody
              was there to see it happen. A fixed task cannot be reported done
              before it has started, so the control waits. */}
          {task && (task.startsAt === null || started) ? (
            <div className="done-block">
              {signup.volunteerDoneAt ? (
                <>
                  <p className="hint">{m.markedDone}</p>
                  <form action={setVolunteerDoneAction}>
                    <input type="hidden" name="token" value={signup.cancelToken} />
                    <input type="hidden" name="locale" value={locale} />
                    <input type="hidden" name="done" value="false" />
                    <button type="submit" className="linkish">
                      {m.undoDone}
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <form action={setVolunteerDoneAction}>
                    <input type="hidden" name="token" value={signup.cancelToken} />
                    <input type="hidden" name="locale" value={locale} />
                    <input type="hidden" name="done" value="true" />
                    <button type="submit" className="action action-quiet">
                      {m.markDone}
                    </button>
                  </form>
                  <p className="hint">{m.markDoneHint}</p>
                </>
              )}
            </div>
          ) : null}

          {/* The whole reminder system: the volunteer's own phone, which
              costs no provider and no message fees. Not offered once the
              work has happened, where it would only clutter the page. */}
          {task && !happened ? (
            <CalendarLinks
              task={task}
              locale={locale}
              timeZone={timeZone}
              site={site}
              labels={{
                calendarLabel: m.calendarLabel,
                calendarGoogle: m.calendarGoogle,
                calendarIcs: m.calendarIcs,
              }}
            />
          ) : null}

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

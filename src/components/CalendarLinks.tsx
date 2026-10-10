import type { OpenTask } from "@/core/tasks";
import type { Locale } from "@/i18n/config";
import { googleCalendarUrl } from "@/view/calendar";

/**
 * Two plain links: Google Calendar prefilled, and a `.ics` file for everyone
 * else. No client JavaScript, so it works wherever the signup form does.
 *
 * The cheapest reminder mechanism there is. It needs no provider, no message
 * fees and no scheduled delivery, and the phone does the reminding, which
 * prevents the no-show that an Outcome merely documents.
 */
export function CalendarLinks({
  task,
  locale,
  timeZone,
  site,
  labels,
}: {
  task: OpenTask;
  locale: Locale;
  timeZone: string;
  site: string;
  labels: { calendarLabel: string; calendarGoogle: string; calendarIcs: string };
}) {
  return (
    <div className="calendar-links">
      <p className="hint">{labels.calendarLabel}</p>
      <p className="backlink">
        <a
          className="linkish"
          href={googleCalendarUrl(task, { timeZone, site, locale })}
          target="_blank"
          rel="noreferrer noopener"
        >
          {labels.calendarGoogle}
        </a>
        {" · "}
        <a className="linkish" href={`/api/tasks/${task.id}/calendar?locale=${locale}`}>
          {labels.calendarIcs}
        </a>
      </p>
    </div>
  );
}

import { notFound } from "next/navigation";
import { listOpenTasks, type OpenTask } from "@/core/tasks";
import { appTimeZone, isLocale, type Locale } from "@/i18n/config";
import { messages, type Messages } from "@/i18n/messages";
import { groupIntoAgenda } from "@/view/agenda";
import { formatDayHeading, formatShortDate, formatTime, openToLabel } from "@/view/format";

// The list depends on the current moment, so it is never cached.
export const dynamic = "force-dynamic";

export default async function PublicTaskList({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const m = messages[locale];
  const timeZone = appTimeZone();
  const groups = groupIntoAgenda(await listOpenTasks(), timeZone);

  return (
    <>
      <div className="masthead">
        <h1>{m.pageTitle}</h1>
        <p>{m.pageIntro}</p>
      </div>

      {groups.length === 0 ? (
        <div className="empty">
          <h2>{m.emptyTitle}</h2>
          <p>{m.emptyBody}</p>
        </div>
      ) : (
        groups.map((group) => (
          <section key={group.key}>
            <h2 className="day-heading">
              {group.kind === "urgent" ? (
                m.urgentHeading
              ) : group.kind === "day" ? (
                // The group's own key: the calendar day in the mosque's
                // timezone, which is the day the heading beside it reads. The
                // UTC instant named a different day for an evening Task.
                <time dateTime={group.key}>
                  {formatDayHeading(group.date, locale, timeZone)}
                </time>
              ) : (
                m.noFixedTime
              )}
            </h2>
            {group.tasks.map((task) => (
              <Slot
                key={task.id}
                task={task}
                locale={locale}
                timeZone={timeZone}
                m={m}
                // Pinned Tasks are shown away from their day heading, so the
                // card has to carry the day itself.
                withDay={group.kind === "urgent"}
              />
            ))}
          </section>
        ))
      )}
    </>
  );
}

function Slot({
  task,
  locale,
  timeZone,
  m,
  withDay = false,
}: {
  task: OpenTask;
  locale: Locale;
  timeZone: string;
  m: Messages;
  withDay?: boolean;
}) {
  const when = task.startsAt
    ? withDay
      ? `${formatDayHeading(task.startsAt, locale, timeZone)}, ${formatTime(task.startsAt, locale, timeZone)}`
      : formatTime(task.startsAt, locale, timeZone)
    : m.before(formatShortDate(task.dueBy, locale, timeZone));
  const audience = openToLabel(task.openTo, m);

  return (
    <article className="slot">
      <div>
        <div className="slot-head">
          <h2>{task.title}</h2>
          {/* Marked as well as moved, so the reason it is at the top of the
              page is legible rather than mysterious. */}
          {task.urgent ? <span className="spots urgent">{m.urgentMark}</span> : null}
          <span className={task.isFull ? "spots covered" : "spots"}>
            {task.isFull ? m.fullyCovered : m.spotsLeft(task.slotsRemaining)}
          </span>
          {/* Said before anybody taps through, because finding out on the
              task page that the work was not for you wastes the trip. */}
          {audience ? <span className="spots audience">{audience}</span> : null}
        </div>
        <p className="detail">
          <span className="when">{when}</span>
          {task.location ? ` · ${task.location}` : null}
        </p>
        {task.description ? <p className="note">{task.description}</p> : null}
      </div>
      {task.isFull ? (
        // Still listed, so the page does not look broken and the community
        // can see the work is covered. Just nothing left to claim.
        <span className="action" aria-disabled="true">
          {m.fullyCovered}
        </span>
      ) : (
        <a className="action" href={`/${locale}/task/${task.id}`}>
          {m.signUp}
        </a>
      )}
    </article>
  );
}

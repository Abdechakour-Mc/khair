import { notFound } from "next/navigation";
import { listOpenTasks, type OpenTask } from "@/core/tasks";
import { appTimeZone, isLocale, type Locale } from "@/i18n/config";
import { messages, type Messages } from "@/i18n/messages";
import { groupIntoAgenda } from "@/view/agenda";
import { formatDayHeading, formatShortDate, formatTime, isoDate } from "@/view/format";

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
              {group.kind === "day" ? (
                <time dateTime={isoDate(group.date)}>
                  {formatDayHeading(group.date, locale, timeZone)}
                </time>
              ) : (
                m.noFixedTime
              )}
            </h2>
            {group.tasks.map((task) => (
              <Slot key={task.id} task={task} locale={locale} timeZone={timeZone} m={m} />
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
}: {
  task: OpenTask;
  locale: Locale;
  timeZone: string;
  m: Messages;
}) {
  const when = task.startsAt
    ? formatTime(task.startsAt, locale, timeZone)
    : m.before(formatShortDate(task.dueBy, locale, timeZone));

  return (
    <article className="slot">
      <div>
        <div className="slot-head">
          <h2>{task.title}</h2>
          <span className={task.isFull ? "spots covered" : "spots"}>
            {task.isFull ? m.fullyCovered : m.spotsLeft(task.slotsRemaining)}
          </span>
        </div>
        <p className="detail">
          <span className="when">{when}</span>
          {task.location ? ` · ${task.location}` : null}
        </p>
        {task.description ? <p className="note">{task.description}</p> : null}
      </div>
      {/* Claiming a Slot arrives in ticket 02. Until then the control is
          present and visibly inert rather than absent, so the layout is the
          one that ships. */}
      <span className="action" aria-disabled="true">
        {task.isFull ? m.fullyCovered : m.signUp}
      </span>
    </article>
  );
}

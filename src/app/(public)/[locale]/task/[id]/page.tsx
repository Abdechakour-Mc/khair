import { notFound } from "next/navigation";
import { SignupForm } from "@/components/SignupForm";
import { getTaskWithSlots } from "@/core/tasks";
import { appTimeZone, isLocale } from "@/i18n/config";
import { messages } from "@/i18n/messages";
import { formatDayHeading, formatShortDate, formatTime, openToLabel } from "@/view/format";

export const dynamic = "force-dynamic";

export default async function TaskDetail({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();

  const task = await getTaskWithSlots(id);
  if (!task) notFound();

  const m = messages[locale];
  const timeZone = appTimeZone();

  const audience = openToLabel(task.openTo, m);
  const deadlinePassed = task.dueBy.getTime() <= Date.now();
  const when = task.startsAt
    ? `${formatDayHeading(task.startsAt, locale, timeZone)}, ${formatTime(task.startsAt, locale, timeZone)}`
    : m.noFixedTime;

  let blocked: { title: string; body: string } | undefined;
  if (task.closed) blocked = { title: m.closedTitle, body: m.closedBody };
  else if (deadlinePassed) blocked = { title: m.passedTitle, body: m.passedBody };
  else if (task.isFull) blocked = { title: m.fullTitle, body: m.fullBody };

  return (
    <>
      <p className="backlink">
        <a href={`/${locale}`}>{m.backToList}</a>
      </p>

      <div className="masthead">
        <h1>{task.title}</h1>
        {task.urgent ? <p className="urgent-note">{m.urgentMark}</p> : null}
        {task.description ? <p>{task.description}</p> : null}
      </div>

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
        {audience ? (
          <div>
            <dt>{m.openToLabel}</dt>
            <dd>{audience}</dd>
          </div>
        ) : null}
        <div>
          <dt>{m.deadlineLabel}</dt>
          <dd>{formatShortDate(task.dueBy, locale, timeZone)}</dd>
        </div>
        <div>
          <dt>{m.neededLabel}</dt>
          <dd>
            {m.helpersNeeded(task.slotsNeeded)}
            {" · "}
            {task.isFull ? m.fullyCovered : m.spotsLeft(task.slotsRemaining)}
          </dd>
        </div>
      </dl>

      {blocked ? (
        <div className="empty">
          <h2>{blocked.title}</h2>
          <p>{blocked.body}</p>
        </div>
      ) : (
        <SignupForm
          taskId={task.id}
          locale={locale}
          labels={{
            nameLabel: m.nameLabel,
            phoneLabel: m.phoneLabel,
            phoneHint: m.phoneHint,
            signUp: m.signUp,
            submitting: m.submitting,
            problems: m.problems,
          }}
        />
      )}
    </>
  );
}

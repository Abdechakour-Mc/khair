import { notFound } from "next/navigation";
import { formatPhoneForDisplay, whatsappHref } from "@/core/phone";
import { listSignupsForTask } from "@/core/signups";
import { getTaskWithSlots } from "@/core/tasks";
import { appTimeZone } from "@/i18n/config";
import { formatDayHeading, formatShortDate, formatTime } from "@/view/format";
import { requireAdminSession } from "../../session";

export const dynamic = "force-dynamic";

export default async function AdminTaskDetail({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminSession();

  const { id } = await params;
  const task = await getTaskWithSlots(id);
  if (!task) notFound();

  const timeZone = appTimeZone();
  const signups = await listSignupsForTask(task.id);
  const live = signups.filter((signup) => signup.cancelledAt === null);
  const released = signups.filter((signup) => signup.cancelledAt !== null);

  return (
    <>
      <p className="backlink">
        <a href="/admin/tasks">All tasks</a>
      </p>

      <div className="masthead">
        <h1>{task.title}</h1>
        {task.description ? <p>{task.description}</p> : null}
      </div>

      <dl className="facts">
        <div>
          <dt>When</dt>
          <dd>
            {task.startsAt
              ? `${formatDayHeading(task.startsAt, "en", timeZone)}, ${formatTime(task.startsAt, "en", timeZone)}`
              : "Any time before the deadline"}
          </dd>
        </div>
        {task.location ? (
          <div>
            <dt>Where</dt>
            <dd>{task.location}</dd>
          </div>
        ) : null}
        <div>
          <dt>Deadline</dt>
          <dd>{formatShortDate(task.dueBy, "en", timeZone)}</dd>
        </div>
        <div>
          <dt>Claimed</dt>
          <dd>
            {task.slotsTaken} of {task.slotsNeeded}
            {task.closed ? " · closed" : null}
          </dd>
        </div>
      </dl>

      <h2 className="day-heading">Who is coming</h2>
      {live.length === 0 ? (
        <div className="empty">
          <p>
            Nobody has claimed a spot yet. The task is already on the public list, so there is
            nobody to chase.
          </p>
        </div>
      ) : (
        live.map((signup) => (
          <article className="slot" key={signup.id}>
            <div>
              <div className="slot-head">
                <h2>{signup.nameSnapshot}</h2>
              </div>
              {/* One tap is the whole reminder system. A nudge the day before
                  prevents the no-show that a record merely documents, and it
                  costs no provider and no message fees. */}
              <p className="detail">
                <a href={`tel:${signup.volunteerPhone}`}>
                  {formatPhoneForDisplay(signup.volunteerPhone)}
                </a>
                {" · "}
                <a href={whatsappHref(signup.volunteerPhone)} rel="noreferrer noopener">
                  WhatsApp
                </a>
              </p>
            </div>
          </article>
        ))
      )}

      {released.length > 0 ? (
        <>
          <h2 className="day-heading">Released a spot</h2>
          {released.map((signup) => (
            <article className="slot" key={signup.id}>
              <div>
                <div className="slot-head">
                  <h2>{signup.nameSnapshot}</h2>
                </div>
                <p className="detail">{formatPhoneForDisplay(signup.volunteerPhone)}</p>
              </div>
            </article>
          ))}
        </>
      ) : null}
    </>
  );
}

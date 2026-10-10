import { notFound } from "next/navigation";
import { formatPhoneForDisplay, whatsappHref } from "@/core/phone";
import { listSignupsForTask } from "@/core/signups";
import { getTaskWithSlots, happensAt, hasHappened } from "@/core/tasks";
import { appTimeZone } from "@/i18n/config";
import { describeLeadTime, formatDayHeading, formatShortDate, formatTime } from "@/view/format";
import { requireAdminSession } from "../../session";
import { setOutcomeAction, setTaskClosedAction } from "./actions";

export const dynamic = "force-dynamic";

/**
 * What to say when the Admin loses a race with a Volunteer. Admin view only,
 * so English only, like the rest of these pages.
 */
const PROBLEM_LABEL: Record<string, string> = {
  signup_released: "That volunteer released their spot just now, so there is nothing to record against it.",
  signup_missing: "That signup is no longer there. It may have been removed while this page was open.",
  task_missing: "That task is no longer there.",
};

export default async function AdminTaskDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ problem?: string }>;
}) {
  await requireAdminSession();

  const { id } = await params;
  const { problem } = await searchParams;
  const task = await getTaskWithSlots(id);
  if (!task) notFound();

  const timeZone = appTimeZone();
  const signups = await listSignupsForTask(task.id);
  const live = signups.filter((signup) => signup.cancelledAt === null);
  const released = signups.filter((signup) => signup.cancelledAt !== null);

  // A flexible Task has no start, so a cancellation is measured against its
  // Deadline instead.
  const reference = happensAt(task);
  const happened = hasHappened(task);

  return (
    <>
      <p className="backlink">
        <a href="/admin/tasks">All tasks</a>
      </p>

      <div className="masthead">
        <h1>{task.title}</h1>
        {task.description ? <p>{task.description}</p> : null}
      </div>

      {problem ? (
        <div className="empty" role="status">
          <p>{PROBLEM_LABEL[problem] ?? "That did not go through. Nothing was changed."}</p>
        </div>
      ) : null}

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

      <div className="admin-controls">
        <a className="action action-quiet" href={`/admin/tasks/${task.id}/edit`}>
          Edit this task
        </a>
        <form action={setTaskClosedAction}>
          <input type="hidden" name="id" value={task.id} />
          <input type="hidden" name="closed" value={task.closed ? "false" : "true"} />
          <button type="submit" className="action action-quiet">
            {task.closed ? "Put it back on the list" : "Call this task off"}
          </button>
        </form>
      </div>

      {task.closed ? (
        <div className="empty">
          <p>
            This task is off the public list and cannot be claimed. Anyone who had already
            claimed a spot is still listed below, and still expects to come: tell them yourself
            using the numbers here.
          </p>
        </div>
      ) : null}

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
          <article className="slot slot-stacked" key={signup.id}>
            <div>
              <div className="slot-head">
                <h2>
                  <a href={`/admin/volunteers/${encodeURIComponent(signup.volunteerPhone)}`}>
                    {signup.nameSnapshot}
                  </a>
                </h2>
                {signup.outcome === "no_show" ? (
                  <span className="spots covered">Did not come</span>
                ) : null}
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

            {/* Everything counts as done already, so this only ever records an
                exception, and it goes back with one more tap. Nothing here is
                shown to the volunteer or added up into a score. */}
            {happened || task.closed ? (
              <form action={setOutcomeAction} className="outcome-form">
                <input type="hidden" name="taskId" value={task.id} />
                <input type="hidden" name="signupId" value={signup.id} />
                <input
                  type="hidden"
                  name="outcome"
                  value={signup.outcome === "no_show" ? "done" : "no_show"}
                />
                <button type="submit" className="linkish">
                  {signup.outcome === "no_show" ? "They did come after all" : "Did not come"}
                </button>
              </form>
            ) : null}
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
                  <h2>
                    <a href={`/admin/volunteers/${encodeURIComponent(signup.volunteerPhone)}`}>
                      {signup.nameSnapshot}
                    </a>
                  </h2>
                </div>
                <p className="detail">
                  {formatPhoneForDisplay(signup.volunteerPhone)}
                  {signup.cancelledAt ? (
                    <>
                      {" · "}
                      <span className="when">
                        {describeLeadTime(signup.cancelledAt, reference)}
                      </span>
                    </>
                  ) : null}
                </p>
              </div>
            </article>
          ))}
        </>
      ) : null}
    </>
  );
}

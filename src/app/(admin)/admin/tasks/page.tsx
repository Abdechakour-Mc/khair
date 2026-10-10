import { listTasksForAdmin } from "@/core/tasks";
import { appTimeZone } from "@/i18n/config";
import { formatDayHeading, formatShortDate, formatTime } from "@/view/format";
import { signOutAction } from "../actions";
import { requireAdminSession } from "../session";

export const dynamic = "force-dynamic";

export default async function AdminTaskList() {
  await requireAdminSession();

  const timeZone = appTimeZone();
  const tasks = await listTasksForAdmin();
  const now = Date.now();

  const upcoming = tasks.filter((task) => task.dueBy.getTime() > now);
  const past = tasks.filter((task) => task.dueBy.getTime() <= now);

  return (
    <>
      <div className="topbar">
        <span className="wordmark">Khair admin</span>
        <form action={signOutAction}>
          <button type="submit" className="linkish">
            Sign out
          </button>
        </form>
      </div>

      <div className="masthead">
        <h1>Tasks</h1>
        <p>
          {upcoming.length === 0
            ? "Nothing is published for the days ahead."
            : `${upcoming.length} published for the days ahead.`}
        </p>
      </div>

      <p className="backlink">
        <a className="action" href="/admin/tasks/new">
          Publish a task
        </a>
      </p>

      <h2 className="day-heading">Coming up</h2>
      {upcoming.length === 0 ? (
        <div className="empty">
          <p>Publish a task and it appears on the public list straight away.</p>
        </div>
      ) : (
        upcoming.map((task) => (
          <article className="slot" key={task.id}>
            <div>
              <div className="slot-head">
                <h2>{task.title}</h2>
                <span className={task.isFull ? "spots covered" : "spots"}>
                  {task.slotsTaken} of {task.slotsNeeded}
                </span>
                {task.closed ? <span className="spots covered">Closed</span> : null}
              </div>
              <p className="detail">
                <span className="when">
                  {task.startsAt
                    ? `${formatDayHeading(task.startsAt, "en", timeZone)}, ${formatTime(task.startsAt, "en", timeZone)}`
                    : `Any time before ${formatShortDate(task.dueBy, "en", timeZone)}`}
                </span>
                {task.location ? ` · ${task.location}` : null}
              </p>
            </div>
          </article>
        ))
      )}

      {past.length > 0 ? (
        <>
          <h2 className="day-heading">Already passed</h2>
          {past.map((task) => (
            <article className="slot" key={task.id}>
              <div>
                <div className="slot-head">
                  <h2>{task.title}</h2>
                  <span className="spots covered">
                    {task.slotsTaken} of {task.slotsNeeded}
                  </span>
                </div>
                <p className="detail">
                  <span className="when">
                    {formatShortDate(task.startsAt ?? task.dueBy, "en", timeZone)}
                  </span>
                  {task.location ? ` · ${task.location}` : null}
                </p>
              </div>
            </article>
          ))}
        </>
      ) : null}
    </>
  );
}

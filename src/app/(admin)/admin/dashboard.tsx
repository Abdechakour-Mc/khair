import { AdminNav } from "@/components/AdminNav";
import { adminOverview, tasksNeedingHelp } from "@/core/overview";
import { listDeletedTasks } from "@/core/tasks";
import { appTimeZone } from "@/i18n/config";
import { formatShortDate, formatTime } from "@/view/format";

/**
 * What the Admin lands on after signing in.
 *
 * Numbers, then the one list that asks for an action, then the way to
 * publish. Deliberately not a chart: the mosque publishes a handful of
 * Tasks a week, so a graph of anything here would be decoration, and the
 * question somebody actually opens this page to answer is whether Friday is
 * covered.
 *
 * Nothing on it ranks a person. The volunteer numbers count rows, never
 * behaviour.
 */
export async function AdminDashboard() {
  const timeZone = appTimeZone();
  const overview = await adminOverview();
  const needHelp = await tasksNeedingHelp();
  const deleted = await listDeletedTasks();

  const soon = needHelp.slice(0, 5);

  return (
    <>
      <AdminNav current="home" />

      <div className="masthead">
        <h1>Where things stand</h1>
        <p>
          {overview.upcomingTasks === 0
            ? "Nothing is published for the days ahead."
            : `${overview.upcomingTasks} ${overview.upcomingTasks === 1 ? "task" : "tasks"} published for the days ahead.`}
        </p>
      </div>

      <div className="stats">
        <div className="stat">
          <span className="stat-value">{overview.openSpots}</span>
          <span className="stat-label">
            {overview.openSpots === 1 ? "spot to fill" : "spots to fill"}
          </span>
        </div>
        <div className="stat">
          <span className="stat-value">{overview.signupsThisWeek}</span>
          <span className="stat-label">signups this week</span>
        </div>
        <div className="stat">
          <span className="stat-value">{overview.volunteers}</span>
          <span className="stat-label">
            {overview.volunteers === 1 ? "person has helped" : "people have helped"}
          </span>
        </div>
        <div className="stat">
          <span className="stat-value">{overview.urgentTasks}</span>
          <span className="stat-label">marked urgent</span>
        </div>
      </div>

      <p className="backlink">
        <a className="action" href="/admin/tasks/new">
          Publish a task
        </a>
      </p>

      <h2 className="day-heading">Needs somebody</h2>
      {soon.length === 0 ? (
        <div className="empty">
          <p>
            Everything in the next week is covered. Nothing here needs you, which is the point
            of the app.
          </p>
        </div>
      ) : (
        <>
          <p className="hint">
            Published, not yet full, and happening within the week. Worth a word with somebody
            if a task is still short the day before.
          </p>
          {soon.map((task) => (
            <article className="slot" key={task.id}>
              <div>
                <div className="slot-head">
                  <h2>
                    <a href={`/admin/tasks/${task.id}`}>{task.title}</a>
                  </h2>
                  <span className="spots">
                    {task.slotsTaken} of {task.slotsNeeded}
                  </span>
                </div>
                <p className="detail">
                  <span className="when">
                    {task.flexible
                      ? `Any time before ${formatShortDate(task.happensAt, "en", timeZone)}`
                      : `${formatShortDate(task.happensAt, "en", timeZone)}, ${formatTime(task.happensAt, "en", timeZone)}`}
                  </span>
                </p>
              </div>
            </article>
          ))}
          {needHelp.length > soon.length ? (
            <p className="backlink">
              <a href="/admin/tasks">
                And {needHelp.length - soon.length} more in the task list
              </a>
            </p>
          ) : null}
        </>
      )}

      {/* The two things that are true of the app rather than of the week, and
          that somebody has to deal with before launch or before an undo
          window closes. Shown only when they apply. */}
      {deleted.length > 0 ? (
        <div className="empty is-done">
          <p>
            {deleted.length === 1
              ? "A deleted task can still be brought back."
              : `${deleted.length} deleted tasks can still be brought back.`}{" "}
            <a href="/admin/tasks">Undo it in the task list</a>.
          </p>
        </div>
      ) : null}

      {overview.demoTasks > 0 ? (
        <div className="empty is-warning">
          <p>
            Demo data is still here: {overview.demoTasks} tasks and synthetic volunteers, for
            judging trust and no-show behaviour before there was any real history. Clear it
            before the app reaches the congregation. <a href="/admin/data">Clear it on the data page</a>.
          </p>
        </div>
      ) : null}
    </>
  );
}

import { listDeletedTasks, listTasksForAdmin, undoWindowMinutes } from "@/core/tasks";
import { appTimeZone } from "@/i18n/config";
import { formatDayHeading, formatShortDate, formatTime } from "@/view/format";
import { AdminNav } from "@/components/AdminNav";
import { requireAdminSession } from "../session";
import { restoreTaskAction } from "./[id]/actions";

export const dynamic = "force-dynamic";

const PROBLEM_LABEL: Record<string, string> = {
  undo_expired: "That task can no longer be brought back. The undo window had passed.",
  task_missing: "That task is no longer there.",
};

export default async function AdminTaskList({
  searchParams,
}: {
  searchParams: Promise<{
    deleted?: string;
    title?: string;
    done?: string;
    problem?: string;
    signups?: string;
    volunteers?: string;
  }>;
}) {
  await requireAdminSession();

  const { deleted, title, done, problem, signups, volunteers } = await searchParams;
  const timeZone = appTimeZone();
  const tasks = await listTasksForAdmin();
  const recentlyDeleted = await listDeletedTasks();
  const now = Date.now();

  const upcoming = tasks.filter((task) => task.dueBy.getTime() > now);
  const past = tasks.filter((task) => task.dueBy.getTime() <= now);
  // Said plainly so the Admin can judge whether the word still means
  // anything. Not a cap and not a warning: every task feels urgent to the
  // person publishing it, and the only useful check is being able to see it.
  const urgent = upcoming.filter((task) => task.urgent).length;

  return (
    <>
      <AdminNav current="tasks" />

      <div className="masthead">
        <h1>Tasks</h1>
        <p>
          {upcoming.length === 0
            ? "Nothing is published for the days ahead."
            : `${upcoming.length} published for the days ahead.`}
          {urgent > 0 ? ` ${urgent} marked urgent.` : null}
        </p>
      </div>

      {problem ? (
        <div className="empty is-problem" role="alert">
          <p>{PROBLEM_LABEL[problem] ?? "That did not go through. Nothing was changed."}</p>
        </div>
      ) : null}

      {done === "forget" ? (
        <div className="empty is-done" role="status">
          <p>
            Forgotten. Deleted {signups ?? 0} signups and {volunteers ?? 0} volunteer records.
            Nothing here mentions them any more.
          </p>
        </div>
      ) : null}

      {/* The undo, where the Admin lands after deleting. Offered rather than
          asked for beforehand: a dialog interrupts everyone to prevent a rare
          mistake, an undo rescues the mistake without stopping anybody. */}
      {recentlyDeleted.map((task) => (
        <div className="empty is-done undo-band" role="status" key={task.id}>
          <p>
            Deleted <strong>{task.id === deleted && title ? title : task.title}</strong> and its
            signups. You can still bring it back for {undoWindowMinutes()} minutes.
          </p>
          <form action={restoreTaskAction}>
            <input type="hidden" name="id" value={task.id} />
            <button type="submit" className="action action-quiet">
              Undo
            </button>
          </form>
        </div>
      ))}

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
          <article className={task.urgent ? "slot slot-urgent" : "slot"} key={task.id}>
            <div>
              <div className="slot-head">
                <h2>
                  <a href={`/admin/tasks/${task.id}`}>{task.title}</a>
                </h2>
                <span className={task.isFull ? "spots covered" : "spots"}>
                  {task.slotsTaken} of {task.slotsNeeded}
                </span>
                {task.urgent ? <span className="spots urgent">Urgent</span> : null}
                {task.important ? <span className="spots audience">Important</span> : null}
                {task.openTo === "anyone" ? null : (
                  <span className="spots audience">
                    {task.openTo === "brothers" ? "Brothers" : "Sisters"}
                  </span>
                )}
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
                  <h2>
                  <a href={`/admin/tasks/${task.id}`}>{task.title}</a>
                </h2>
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

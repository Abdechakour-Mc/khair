import { AdminNav } from "@/components/AdminNav";
import { recentAdminActions } from "@/core/audit";
import { CLEAR_SYNTHETIC_PHRASE, countSyntheticRecords } from "@/core/erasure";
import { previewPurge, retentionMonths } from "@/core/retention";
import { appTimeZone } from "@/i18n/config";
import { formatShortDate, formatTime } from "@/view/format";
import { requireAdminSession } from "../session";
import { clearSyntheticAction, runPurgeAction } from "./actions";

export const dynamic = "force-dynamic";

const PROBLEM_LABEL: Record<string, string> = {
  confirmation_mismatch: "That is not the phrase, so nothing was deleted.",
};

const ACTION_LABEL: Record<string, string> = {
  forget_volunteer: "Forgot a volunteer",
  delete_task: "Deleted a task",
  restore_task: "Brought a deleted task back",
  clear_synthetic: "Cleared the demo data",
  purge_by_hand: "Ran the retention purge by hand",
  pause_volunteer: "Paused a volunteer",
  lift_pause: "Lifted a pause",
};

/**
 * Deleting things on purpose, rather than waiting for the retention purge.
 *
 * Every action here says what it is about to destroy in numbers first. An
 * Admin who reads "this will delete 412 signups" when they expected three has
 * been saved by the screen, which is the whole reason the counts are rendered
 * before the button rather than after it.
 */
export default async function AdminData({
  searchParams,
}: {
  searchParams: Promise<{ done?: string; problem?: string; signups?: string; volunteers?: string }>;
}) {
  await requireAdminSession();

  const { done, problem, signups, volunteers } = await searchParams;
  const timeZone = appTimeZone();
  const purge = await previewPurge();
  const synthetic = await countSyntheticRecords();
  const history = await recentAdminActions(20);

  return (
    <>
      <AdminNav current="data" />

      <div className="masthead">
        <h1>Data</h1>
        <p>
          What Khair holds, and how to get rid of it on purpose. Everything here is private to
          you.
        </p>
      </div>

      {problem ? (
        <div className="empty is-problem" role="alert">
          <p>{PROBLEM_LABEL[problem] ?? "That did not go through. Nothing was deleted."}</p>
        </div>
      ) : null}

      {done ? (
        <div className="empty is-done" role="status">
          <p>
            {done === "purge" ? "Purge finished. " : "Demo data cleared. "}
            Deleted {signups ?? 0} signups and {volunteers ?? 0} volunteer records.
          </p>
        </div>
      ) : null}

      <h2 className="day-heading">The retention purge</h2>
      <div className="empty">
        <p>
          Khair forgets names, numbers and outcomes {retentionMonths()} months after the work is
          done. That runs on a schedule, so this is only for when you want it done now.
        </p>
        <p>
          <strong>
            Right now this would delete {purge.signups} signups and {purge.volunteers} volunteer
            records.
          </strong>{" "}
          The tasks themselves are kept: they are the mosque&apos;s record of what it has needed
          and hold nothing about anybody.
        </p>
        <p className="hint">This cannot be undone.</p>
        <form action={runPurgeAction}>
          <button type="submit" className="action action-quiet action-danger">
            Run the purge now
          </button>
        </form>
      </div>

      <h2 className="day-heading">Demo data</h2>
      <div className="empty">
        <p>
          Synthetic volunteers and signups exist so that trust and no-show behaviour could be
          built and judged before there was any real history. Their numbers all come from the
          +1 555 01xx block that is reserved for fiction, so they can never collide with a real
          congregant and this will never reach one.
        </p>
        <p>
          <strong>
            {synthetic.volunteers} demo volunteers, {synthetic.signups} demo signups and{" "}
            {synthetic.tasks} demo tasks are here.
          </strong>
        </p>
        <p className="hint">
          This cannot be undone. Type <strong>{CLEAR_SYNTHETIC_PHRASE}</strong> to confirm.
        </p>
        <form action={clearSyntheticAction} className="signup-form">
          <div className="field">
            <label htmlFor="phrase">Type the phrase</label>
            <input id="phrase" name="phrase" type="text" autoComplete="off" required />
          </div>
          <button type="submit" className="action action-quiet action-danger">
            Clear the demo data
          </button>
        </form>
      </div>

      <h2 className="day-heading">What you have done</h2>
      {history.length === 0 ? (
        <div className="empty">
          <p>Nothing destructive has been done yet.</p>
        </div>
      ) : (
        <>
          <p className="hint">
            So a decision can be explained months later. Counts only: no names and no numbers are
            written here, because a record of an erasure must not be the one place the erased
            person survives.
          </p>
          {history.map((entry) => (
            <article className="slot" key={entry.id}>
              <div>
                <div className="slot-head">
                  <h2>{ACTION_LABEL[entry.action] ?? entry.action}</h2>
                </div>
                <p className="detail">
                  <span className="when">
                    {formatShortDate(entry.at, "en", timeZone)}, {formatTime(entry.at, "en", timeZone)}
                  </span>
                  {entry.detail ? ` · ${entry.detail}` : null}
                </p>
              </div>
            </article>
          ))}
        </>
      )}
    </>
  );
}

import type { PoolClient } from "pg";
import { db } from "./db";

/**
 * What the Admin did, so a decision can be explained months later.
 *
 * Established moderation practice is that every restriction is recorded, and
 * the same reasoning covers the destructive actions: an Admin who deleted
 * something in a hurry should be able to see that they did.
 *
 * `detail` never carries a phone number or a name. That is the point rather
 * than an oversight: an audit row describing an erasure must not become the
 * one place the erased person survives. Counts and the kind of action explain
 * a decision and identify nobody.
 */
export type AdminAction =
  | "forget_volunteer"
  | "delete_task"
  | "restore_task"
  | "clear_synthetic"
  | "purge_by_hand"
  | "pause_volunteer"
  | "lift_pause";

export type AdminActionEntry = {
  id: string;
  action: AdminAction;
  detail: string;
  at: Date;
};

type Queryable = Pick<PoolClient, "query">;

/**
 * Records one action. Takes a client so it can join the transaction that did
 * the work: an audit row for a deletion that did not happen would be worse
 * than no audit row at all.
 */
export async function recordAdminAction(
  action: AdminAction,
  detail = "",
  client: Queryable = db(),
): Promise<void> {
  await client.query("insert into admin_actions (action, detail) values ($1, $2)", [
    action,
    detail,
  ]);
}

/** Most recent first. Admin view only, like everything that reads it. */
export async function recentAdminActions(limit = 50): Promise<AdminActionEntry[]> {
  const { rows } = await db().query<AdminActionEntry>(
    "select id, action, detail, at from admin_actions order by at desc, id limit $1",
    [limit],
  );
  return rows;
}

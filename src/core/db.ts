import { Pool, type PoolClient } from "pg";

let pool: Pool | undefined;

export function db(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) throw new Error("DATABASE_URL is not set");
    pool = new Pool({ connectionString, max: 10 });
  }
  return pool;
}

export async function closeDb(): Promise<void> {
  await pool?.end();
  pool = undefined;
}

/** Runs `work` inside a transaction, rolling back if it throws. */
export async function inTransaction<T>(work: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await db().connect();
  try {
    await client.query("begin");
    const result = await work(client);
    await client.query("commit");
    client.release();
    return result;
  } catch (error) {
    await rollback(client, error);
    throw error;
  }
}

/**
 * Undoes the transaction and gives the connection back, keeping `cause` as
 * the error the caller sees.
 *
 * When the connection has dropped, the rollback fails too. An unguarded
 * rollback would then replace the real cause with a less useful one, and the
 * client would go back to the pool still inside an aborted transaction, where
 * the next borrower gets 25P02 on every query. Passing the error to
 * `release` destroys that connection instead of reusing it.
 */
async function rollback(client: PoolClient, cause: unknown): Promise<void> {
  try {
    await client.query("rollback");
    client.release();
  } catch (rollbackFailed) {
    console.error("rollback failed, discarding the connection", rollbackFailed, "after", cause);
    client.release(rollbackFailed as Error);
  }
}

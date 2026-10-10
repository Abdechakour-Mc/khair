import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { Client } from "pg";

const MIGRATIONS_DIR = join(process.cwd(), "db", "migrations");

/**
 * Applies every migration the target database has not seen yet, in filename
 * order, each inside its own transaction. Safe to run repeatedly.
 */
export async function migrate(connectionString: string): Promise<string[]> {
  const client = new Client({ connectionString });
  await client.connect();
  const applied: string[] = [];
  try {
    await client.query(`
      create table if not exists _migrations (
        name       text primary key,
        applied_at timestamptz not null default now()
      )
    `);

    const files = (await readdir(MIGRATIONS_DIR))
      .filter((f) => f.endsWith(".sql"))
      .sort();

    for (const file of files) {
      const seen = await client.query("select 1 from _migrations where name = $1", [file]);
      if (seen.rowCount) continue;

      const sql = await readFile(join(MIGRATIONS_DIR, file), "utf8");
      await client.query("begin");
      try {
        await client.query(sql);
        await client.query("insert into _migrations (name) values ($1)", [file]);
        await client.query("commit");
      } catch (error) {
        await client.query("rollback");
        throw new Error(`migration ${file} failed: ${(error as Error).message}`);
      }
      applied.push(file);
    }
  } finally {
    await client.end();
  }
  return applied;
}

/** Creates a database if it does not exist. Connects via the `postgres` db. */
export async function ensureDatabase(connectionString: string): Promise<void> {
  const url = new URL(connectionString);
  const name = url.pathname.replace(/^\//, "");
  if (!name) throw new Error(`no database name in ${connectionString}`);

  const admin = new URL(connectionString);
  admin.pathname = "/postgres";
  const client = new Client({ connectionString: admin.toString() });
  await client.connect();
  try {
    const exists = await client.query("select 1 from pg_database where datname = $1", [name]);
    if (!exists.rowCount) {
      // Identifiers cannot be parameterised, so the name is quoted instead.
      await client.query(`create database "${name.replace(/"/g, '""')}"`);
    }
  } finally {
    await client.end();
  }
}

const invokedDirectly =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;

if (invokedDirectly) {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
  }
  ensureDatabase(url)
    .then(() => migrate(url))
    .then((applied) => {
      console.log(applied.length ? `applied: ${applied.join(", ")}` : "already up to date");
    })
    .catch((error: unknown) => {
      console.error(error);
      process.exit(1);
    });
}

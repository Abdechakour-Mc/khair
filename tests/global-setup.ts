import { ensureDatabase, migrate } from "../scripts/migrate";

/** Creates the test database if it is missing and brings its schema up to date. */
export default async function setup() {
  const url = process.env.TEST_DATABASE_URL;
  if (!url) {
    throw new Error("TEST_DATABASE_URL is not set: tests run against a real Postgres");
  }
  await ensureDatabase(url);
  await migrate(url);
}

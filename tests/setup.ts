import { afterAll } from "vitest";
import { closeDb } from "@/core/db";

// The core reads DATABASE_URL. Point it at the test database before any test
// file imports it.
const testUrl = process.env.TEST_DATABASE_URL;
if (!testUrl) {
  throw new Error("TEST_DATABASE_URL is not set: tests run against a real Postgres");
}
process.env.DATABASE_URL = testUrl;
process.env.APP_TIMEZONE ??= "America/Toronto";

afterAll(async () => {
  await closeDb();
});

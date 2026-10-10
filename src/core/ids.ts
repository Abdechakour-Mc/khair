/**
 * Every id in Khair is a Postgres `uuid`, and every public URL carries one.
 *
 * Guarding the format before the query matters for more than tidiness: a
 * string Postgres cannot cast raises 22P02, which nothing catches, so a
 * crafted URL used to reach Next's error page instead of the translated
 * not-found page. The guard that was here before, `/^[0-9a-f-]{36}$/i`,
 * accepted thirty-six dashes.
 */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID.test(value);
}

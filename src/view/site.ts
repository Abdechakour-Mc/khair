import { headers } from "next/headers";

/**
 * Where this deployment answers, so a calendar entry can link back to the
 * Task it came from.
 *
 * Read from the request rather than configured, because there is nothing to
 * configure: one deployment, one hostname, and a wrong constant here would
 * put a dead link in somebody's calendar months from now.
 */
export async function siteOrigin(): Promise<string> {
  const incoming = await headers();
  const host = incoming.get("x-forwarded-host") ?? incoming.get("host") ?? "localhost:3000";
  const proto =
    incoming.get("x-forwarded-proto") ??
    (host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");
  return `${proto}://${host}`;
}

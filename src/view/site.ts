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
  // Configured wins. `x-forwarded-host` is a request header like any other,
  // so a forged one would put an origin of somebody else's choosing into the
  // link saved inside a volunteer's calendar, where it outlives the request
  // that made it. Set APP_ORIGIN in any deployment behind a proxy.
  const configured = (process.env.APP_ORIGIN ?? "").trim().replace(/\/$/, "");
  if (configured) return configured;

  const incoming = await headers();
  const host = incoming.get("host") ?? "localhost:3000";
  const local = host.startsWith("localhost") || host.startsWith("127.0.0.1");
  const proto = incoming.get("x-forwarded-proto") === "http" || local ? "http" : "https";
  return `${proto}://${host}`;
}

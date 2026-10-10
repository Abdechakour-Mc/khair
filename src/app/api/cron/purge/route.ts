import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { purgeExpiredSignups, retentionMonths } from "@/core/retention";

export const dynamic = "force-dynamic";

function authorised(request: NextRequest): boolean {
  const expected = (process.env.CRON_SECRET ?? "").trim();
  // Without a secret configured the endpoint is closed, not open. A retention
  // job anyone can trigger is a way to erase the record on demand.
  if (!expected) return false;

  const header = request.headers.get("authorization") ?? "";
  const given = header.startsWith("Bearer ") ? header.slice(7) : "";

  const a = Buffer.from(expected);
  const b = Buffer.from(given);
  if (a.length !== b.length) {
    timingSafeEqual(a, a);
    return false;
  }
  return timingSafeEqual(a, b);
}

/**
 * Runs the retention purge. Called on a schedule (see vercel.json) so nobody
 * has to remember it, and by hand with `npm run purge` when needed.
 */
export async function GET(request: NextRequest) {
  if (!authorised(request)) {
    return NextResponse.json({ error: "not authorised" }, { status: 401 });
  }

  const result = await purgeExpiredSignups();
  return NextResponse.json({ ...result, retentionMonths: retentionMonths() });
}

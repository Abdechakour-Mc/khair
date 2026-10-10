import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { finaliseDeletedTasks, purgeExpiredSignups, retentionMonths } from "@/core/retention";

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
 * Runs the retention purge, and finishes any Task the Admin deleted whose
 * undo window has passed. Called on a schedule (see vercel.json) so nobody
 * has to remember it, and by hand with `npm run purge` when needed.
 *
 * Two policies, one schedule: six months for personal data, half an hour for
 * a deletion the Admin asked for. Nothing else is watching the deleted Tasks,
 * so if this stopped running they would wait rather than vanish.
 */
export async function GET(request: NextRequest) {
  if (!authorised(request)) {
    return NextResponse.json({ error: "not authorised" }, { status: 401 });
  }

  const result = await purgeExpiredSignups();
  const finalised = await finaliseDeletedTasks();
  return NextResponse.json({
    ...result,
    tasksFinalised: finalised.tasksDeleted,
    retentionMonths: retentionMonths(),
  });
}

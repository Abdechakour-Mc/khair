import { getTaskWithSlots } from "@/core/tasks";
import { appTimeZone, isLocale } from "@/i18n/config";
import { icsFile, icsFilename } from "@/view/calendar";

export const dynamic = "force-dynamic";

/**
 * The `.ics` download, for Apple Calendar and Outlook.
 *
 * A route handler rather than a `data:` URI link, so the file arrives with a
 * real filename and content type and an old phone knows what to do with it.
 *
 * Public, like the Task page itself: the file says what a poster in the
 * entrance says, and holds nothing about who signed up.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;
  const task = await getTaskWithSlots(id);
  if (!task) return new Response("Not found", { status: 404 });

  const url = new URL(request.url);
  const requested = url.searchParams.get("locale") ?? undefined;

  const body = icsFile(task, {
    timeZone: appTimeZone(),
    site: url.origin,
    locale: isLocale(requested) ? requested : undefined,
  });

  return new Response(body, {
    headers: {
      "content-type": "text/calendar; charset=utf-8",
      "content-disposition": `attachment; filename="${icsFilename(task)}"`,
      // The Slot arithmetic is not in here, but the title and time are, and
      // the Admin can correct both.
      "cache-control": "no-store",
    },
  });
}

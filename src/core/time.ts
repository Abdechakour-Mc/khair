/**
 * The Admin types wall-clock times into the browser ("2026-10-17T18:30"),
 * which carry no timezone. Khair stores instants, and the mosque's own
 * timezone decides which instant a wall time means.
 */

const WALL_TIME = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;

/** How far `timeZone` is from UTC at a given instant, in milliseconds. */
export function zoneOffsetMs(instant: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(instant);

  const read = (type: Intl.DateTimeFormatPartTypes): number =>
    Number(parts.find((part) => part.type === type)?.value ?? 0);

  // Some runtimes render midnight as hour 24.
  const hour = read("hour") % 24;

  const asIfUtc = Date.UTC(
    read("year"),
    read("month") - 1,
    read("day"),
    hour,
    read("minute"),
    read("second"),
  );
  return asIfUtc - instant.getTime();
}

/**
 * Reads "2026-10-17T18:30" as that wall time in `timeZone`, returning the
 * instant it names. Returns null for anything unparseable.
 *
 * The offset depends on the instant, and the instant depends on the offset,
 * so this converges rather than solving directly: the second pass settles
 * the days either side of a daylight-saving change.
 */
export function parseWallTimeInZone(wall: string, timeZone: string): Date | null {
  const match = WALL_TIME.exec((wall ?? "").trim());
  if (!match) return null;

  const [, year, month, day, hour, minute] = match;
  const target = Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute));
  if (Number.isNaN(target)) return null;

  let instant = new Date(target);
  for (let pass = 0; pass < 2; pass += 1) {
    instant = new Date(target - zoneOffsetMs(instant, timeZone));
  }
  return Number.isNaN(instant.getTime()) ? null : instant;
}

/** The inverse, for filling in an edit form: an instant as a wall time. */
export function formatWallTimeInZone(instant: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(instant);

  const read = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((part) => part.type === type)?.value ?? "";

  const hour = String(Number(read("hour")) % 24).padStart(2, "0");
  return `${read("year")}-${read("month")}-${read("day")}T${hour}:${read("minute")}`;
}

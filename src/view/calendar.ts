import { happensAt, type OpenTask, type Task } from "@/core/tasks";
import { defaultLocale, type Locale } from "@/i18n/config";
import { dayKey } from "./agenda";

/**
 * Putting a claimed Slot in the Volunteer's own calendar.
 *
 * This is the cheapest reminder mechanism that exists: no provider, no
 * message fees, no scheduled delivery, and the phone does the reminding. A
 * reminder prevents the no-show that an Outcome merely documents.
 *
 * Pure functions, so the awkward parts - a daylight-saving change, a comma in
 * a title - are tested rather than hoped about.
 */

type CalendarTask = Pick<Task, "id" | "title" | "description" | "location" | "startsAt" | "dueBy">;

export type CalendarOptions = {
  timeZone: string;
  /** Origin of this deployment, so the event can link back to the Task. */
  site: string;
  locale?: Locale;
};

/**
 * One hour, because Khair stores no duration.
 *
 * A `duration` column was considered and refused: it would be one more field
 * on the form for the Admin at 9pm on a Thursday, to produce a number nobody
 * reads. An hour in the calendar is a reminder, not a contract.
 */
const DEFAULT_MINUTES = 60;

export type TaskEvent =
  | { kind: "timed"; start: Date; end: Date }
  /** `day` is YYYY-MM-DD in the mosque's timezone. */
  | { kind: "allDay"; day: string };

/**
 * What a Task looks like as a calendar entry.
 *
 * A fixed Task is a timed event. A flexible one has no start at all, so it
 * becomes an all-day event on its Deadline: the day it has to be done by is
 * the only honest thing to write in a calendar.
 */
export function taskEvent(task: CalendarTask, timeZone: string): TaskEvent {
  if (task.startsAt === null) {
    return { kind: "allDay", day: dayKey(task.dueBy, timeZone) };
  }
  const start = happensAt(task);
  return {
    kind: "timed",
    start,
    end: new Date(start.getTime() + DEFAULT_MINUTES * 60000),
  };
}

/** "20261017T223000Z". The instant, so no timezone table can misread it. */
function utcStamp(moment: Date): string {
  return `${moment.toISOString().replace(/[-:]/g, "").slice(0, 15)}Z`;
}

/** "20261026" - an all-day date carries no time and no zone. */
function dateStamp(day: string): string {
  return day.replace(/-/g, "");
}

/** The day after, since both formats read an all-day range's end as exclusive. */
function nextDay(day: string): string {
  const [year, month, date] = day.split("-").map(Number);
  const moment = new Date(Date.UTC(year ?? 1970, (month ?? 1) - 1, (date ?? 1) + 1));
  return dateStamp(moment.toISOString().slice(0, 10));
}

function taskUrl(task: CalendarTask, options: CalendarOptions): string {
  const locale = options.locale ?? defaultLocale;
  return `${options.site.replace(/\/$/, "")}/${locale}/task/${task.id}`;
}

function eventDetails(task: CalendarTask, options: CalendarOptions): string {
  const url = taskUrl(task, options);
  return task.description.trim() ? `${task.description.trim()}\n\n${url}` : url;
}

/**
 * A prefilled Google Calendar entry. A link rather than an integration: no
 * account to connect, nothing to authorise, and it works for anybody signed
 * in on their phone.
 */
export function googleCalendarUrl(task: CalendarTask, options: CalendarOptions): string {
  const event = taskEvent(task, options.timeZone);
  const dates =
    event.kind === "timed"
      ? `${utcStamp(event.start)}/${utcStamp(event.end)}`
      : `${dateStamp(event.day)}/${nextDay(event.day)}`;

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: task.title,
    dates,
    details: eventDetails(task, options),
  });
  if (task.location.trim()) params.set("location", task.location.trim());

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Escapes a value for an iCalendar property.
 *
 * The backslash goes first, or the escapes added below would themselves be
 * escaped. A raw newline would end the property early, so it becomes a
 * literal `\n`, and a comma or semicolon would read as a value separator.
 */
function escapeText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\r\n|\r|\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

/**
 * Folds a property onto continuation lines, which RFC 5545 caps at 75 octets.
 *
 * Counted in octets and not characters, because an Arabic title is two bytes
 * a letter and a naive 75-character fold would produce lines a strict parser
 * rejects. A fold never lands inside a character: the next byte of a
 * multi-byte sequence would arrive on its own line and the title would come
 * back with replacement characters in it.
 */
function foldLine(line: string): string {
  const bytes = Buffer.from(line, "utf8");
  if (bytes.byteLength <= 75) return line;

  const pieces: string[] = [];
  let cut = 0;
  // 75 for the first line; a continuation spends one octet on its leading
  // space, so it can carry 74.
  let room = 75;

  while (cut < bytes.byteLength) {
    let end = Math.min(cut + room, bytes.byteLength);
    // Walk back off a continuation byte, so a character stays whole.
    while (end > cut && end < bytes.byteLength && (bytes[end]! & 0xc0) === 0x80) end -= 1;
    pieces.push(bytes.subarray(cut, end).toString("utf8"));
    cut = end;
    room = 74;
  }

  return pieces.join("\r\n ");
}

/**
 * A `.ics` file, which covers Apple Calendar and Outlook.
 *
 * Served as a file by a route handler rather than a `data:` URI, so it
 * arrives with a real filename and content type and an old phone knows what
 * to do with it.
 */
export function icsFile(task: CalendarTask, options: CalendarOptions): string {
  const event = taskEvent(task, options.timeZone);

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Khair//Volunteer signup//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    // Stable, so adding the same Task twice updates one entry rather than
    // making two.
    `UID:${task.id}@khair`,
    `DTSTAMP:${utcStamp(new Date())}`,
    ...(event.kind === "timed"
      ? [`DTSTART:${utcStamp(event.start)}`, `DTEND:${utcStamp(event.end)}`]
      : [
          `DTSTART;VALUE=DATE:${dateStamp(event.day)}`,
          `DTEND;VALUE=DATE:${nextDay(event.day)}`,
        ]),
    `SUMMARY:${escapeText(task.title)}`,
    `DESCRIPTION:${escapeText(eventDetails(task, options))}`,
    ...(task.location.trim() ? [`LOCATION:${escapeText(task.location.trim())}`] : []),
    `URL:${escapeText(taskUrl(task, options))}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return `${lines.map(foldLine).join("\r\n")}\r\n`;
}

/** The filename a Volunteer sees in their downloads. */
export function icsFilename(task: Pick<OpenTask, "id">): string {
  return `khair-${task.id.slice(0, 8)}.ics`;
}

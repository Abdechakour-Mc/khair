import { formattingLocale, type Locale } from "@/i18n/config";

/** "Friday 17 October" - the agenda's day heading. */
export function formatDayHeading(date: Date, locale: Locale, timeZone: string): string {
  return new Intl.DateTimeFormat(formattingLocale[locale], {
    timeZone,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
}

/** "11:30" - a fixed Task's start time. */
export function formatTime(date: Date, locale: Locale, timeZone: string): string {
  return new Intl.DateTimeFormat(formattingLocale[locale], {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

/** "26 Oct" - a flexible Task's Deadline, kept short enough to sit on one line. */
export function formatShortDate(date: Date, locale: Locale, timeZone: string): string {
  return new Intl.DateTimeFormat(formattingLocale[locale], {
    timeZone,
    day: "numeric",
    month: "short",
  }).format(date);
}

/** A machine-readable value for <time datetime="..."> */
export function isoDate(date: Date): string {
  return date.toISOString();
}

/**
 * How long before a Task a Volunteer released their Slot, in words.
 *
 * Shown, not judged: there is no 24-hour threshold anywhere in Khair. A week's
 * notice and a midnight cancellation are genuinely different to the Admin, who
 * can re-advertise one and not the other, and that difference is theirs to
 * weigh rather than the schema's. Admin view only, so English only.
 */
export function describeLeadTime(cancelledAt: Date, reference: Date): string {
  const ms = reference.getTime() - cancelledAt.getTime();
  if (ms < 0) return "after it had started";

  const minutes = Math.round(ms / 60000);
  if (minutes < 60) return `${minutes} ${minutes === 1 ? "minute" : "minutes"} before`;

  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours} ${hours === 1 ? "hour" : "hours"} before`;

  const days = Math.round(hours / 24);
  return `${days} ${days === 1 ? "day" : "days"} before`;
}

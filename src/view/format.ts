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

import type { OpenTo } from "@/core/tasks";
import { formattingLocale, type Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/messages";

/**
 * "Sisters" - who a Task is open to, or null when it is open to anyone.
 *
 * Null rather than a word for "anyone", because a page that labels every
 * Task makes the label worth nothing: the two that matter should be the only
 * two that say anything.
 */
export function openToLabel(openTo: OpenTo, m: Messages): string | null {
  if (openTo === "brothers") return m.openToBrothers;
  if (openTo === "sisters") return m.openToSisters;
  return null;
}

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

import { describe, expect, it } from "vitest";
import { googleCalendarUrl, icsFile, taskEvent } from "@/view/calendar";
import { openTask } from "./helpers/task";

const MONTREAL = "America/Toronto";
const SITE = "https://khair.example";

/** An evening Task in Montreal: 17 October 2026, 18:30 local, which is 22:30Z. */
const fixed = openTask({
  id: "11111111-1111-4111-8111-111111111111",
  title: "Jumu'ah hall setup",
  description: "Lay out the rows; dividers are in the store.",
  location: "Main hall",
  startsAt: new Date("2026-10-17T22:30:00.000Z"),
  dueBy: new Date("2026-10-18T00:30:00.000Z"),
});

/** A flexible Task: no start, deadline 26 October 2026 at 19:00 local (23:00Z). */
const flexible = openTask({
  id: "22222222-2222-4222-8222-222222222222",
  title: "Shoe rack repair",
  startsAt: null,
  dueBy: new Date("2026-10-26T23:00:00.000Z"),
});

describe("the event a Task becomes", () => {
  it("is an hour long, because Khair stores no duration", () => {
    expect(taskEvent(fixed, MONTREAL)).toEqual({
      kind: "timed",
      start: new Date("2026-10-17T22:30:00.000Z"),
      end: new Date("2026-10-17T23:30:00.000Z"),
    });
  });

  it("is an all-day event on its Deadline when there is no start", () => {
    // 23:00Z on the 26th is 19:00 in Montreal, still the 26th there.
    expect(taskEvent(flexible, MONTREAL)).toEqual({ kind: "allDay", day: "2026-10-26" });
  });

  it("dates an all-day event by the mosque's day, not the server's", () => {
    // 01:00Z on the 27th is 21:00 on the 26th in Montreal.
    const lateEvening = openTask({
      id: "33333333-3333-4333-8333-333333333333",
      startsAt: null,
      dueBy: new Date("2026-10-27T01:00:00.000Z"),
    });

    expect(taskEvent(lateEvening, MONTREAL)).toEqual({ kind: "allDay", day: "2026-10-26" });
  });
});

describe("the Google Calendar link", () => {
  it("carries the title, the time and the place", () => {
    const url = new URL(googleCalendarUrl(fixed, { timeZone: MONTREAL, site: SITE }));

    expect(url.origin + url.pathname).toBe("https://calendar.google.com/calendar/render");
    expect(url.searchParams.get("action")).toBe("TEMPLATE");
    expect(url.searchParams.get("text")).toBe("Jumu'ah hall setup");
    expect(url.searchParams.get("location")).toBe("Main hall");
    expect(url.searchParams.get("dates")).toBe("20261017T223000Z/20261017T233000Z");
  });

  it("links back to the Task, so the volunteer can find it again", () => {
    const url = new URL(
      googleCalendarUrl(fixed, { timeZone: MONTREAL, site: SITE, locale: "fr" }),
    );
    expect(url.searchParams.get("details")).toContain(`${SITE}/fr/task/${fixed.id}`);
  });

  it("asks for a whole day, ending the next one, for a flexible Task", () => {
    const url = new URL(googleCalendarUrl(flexible, { timeZone: MONTREAL, site: SITE }));
    // Google reads the end of an all-day range as exclusive.
    expect(url.searchParams.get("dates")).toBe("20261026/20261027");
  });

  it("stays correct across a daylight-saving change", () => {
    // 1 November 2026 is the Sunday Montreal leaves daylight time. 14:00
    // local that day is 19:00Z; the same wall time a week earlier is 18:00Z.
    const afterTheChange = openTask({
      id: "44444444-4444-4444-8444-444444444444",
      startsAt: new Date("2026-11-01T19:00:00.000Z"),
      dueBy: new Date("2026-11-01T21:00:00.000Z"),
    });

    const url = new URL(googleCalendarUrl(afterTheChange, { timeZone: MONTREAL, site: SITE }));
    expect(url.searchParams.get("dates")).toBe("20261101T190000Z/20261101T200000Z");
  });
});

describe("the .ics file", () => {
  const unfold = (ics: string) => ics.replace(/\r\n[ \t]/g, "");

  it("is a calendar with one event in it", () => {
    const ics = icsFile(fixed, { timeZone: MONTREAL, site: SITE });

    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("VERSION:2.0");
    expect(ics).toContain("BEGIN:VEVENT");
    expect(ics).toContain("END:VEVENT");
    expect(ics.trimEnd().endsWith("END:VCALENDAR")).toBe(true);
  });

  it("uses CRLF line endings, as the format requires", () => {
    const ics = icsFile(fixed, { timeZone: MONTREAL, site: SITE });

    expect(ics).toContain("\r\n");
    expect(ics.split("\r\n").join("")).not.toContain("\n");
  });

  it("times the event in UTC, which no timezone table can get wrong", () => {
    const ics = icsFile(fixed, { timeZone: MONTREAL, site: SITE });

    expect(ics).toContain("DTSTART:20261017T223000Z");
    expect(ics).toContain("DTEND:20261017T233000Z");
  });

  it("marks a flexible Task as a date rather than a time", () => {
    const ics = icsFile(flexible, { timeZone: MONTREAL, site: SITE });

    expect(ics).toContain("DTSTART;VALUE=DATE:20261026");
    expect(ics).toContain("DTEND;VALUE=DATE:20261027");
    expect(ics).not.toContain("DTSTART:");
  });

  it("escapes the characters that would otherwise end the line early", () => {
    const awkward = openTask({
      id: "55555555-5555-4555-8555-555555555555",
      title: "Tables, chairs; and the dividers",
      description: "First line\nSecond line, with a comma; and a semicolon",
      location: "Main hall, upstairs",
      startsAt: new Date("2026-10-17T22:30:00.000Z"),
      dueBy: new Date("2026-10-18T00:30:00.000Z"),
    });

    const ics = unfold(icsFile(awkward, { timeZone: MONTREAL, site: SITE }));

    expect(ics).toContain("SUMMARY:Tables\\, chairs\\; and the dividers");
    expect(ics).toContain("LOCATION:Main hall\\, upstairs");
    expect(ics).toContain("First line\\nSecond line\\, with a comma\\; and a semicolon");
    // The real newline is gone: it would have ended the DESCRIPTION property.
    expect(ics).not.toContain("First line\r\nSecond");
  });

  it("escapes a backslash before anything else, so it is not doubled wrongly", () => {
    const awkward = openTask({
      id: "66666666-6666-4666-8666-666666666666",
      title: "Back\\slash",
      dueBy: new Date("2026-10-26T23:00:00.000Z"),
    });

    expect(unfold(icsFile(awkward, { timeZone: MONTREAL, site: SITE }))).toContain(
      "SUMMARY:Back\\\\slash",
    );
  });

  it("folds a long line, because the format caps them at 75 octets", () => {
    const wordy = openTask({
      id: "77777777-7777-4777-8777-777777777777",
      title: "A".repeat(200),
      dueBy: new Date("2026-10-26T23:00:00.000Z"),
    });

    const ics = icsFile(wordy, { timeZone: MONTREAL, site: SITE });

    for (const line of ics.split("\r\n")) {
      expect(Buffer.byteLength(line, "utf8")).toBeLessThanOrEqual(75);
    }
    // Folding is only presentation: unfolded, the title is whole again.
    expect(unfold(ics)).toContain(`SUMMARY:${"A".repeat(200)}`);
  });

  it("never splits a multi-byte character across a fold", () => {
    const arabic = openTask({
      id: "88888888-8888-4888-8888-888888888888",
      title: "ترتيب الصفوف في القاعة الكبرى قبل صلاة الجمعة بإذن الله تعالى",
      dueBy: new Date("2026-10-26T23:00:00.000Z"),
    });

    const ics = icsFile(arabic, { timeZone: MONTREAL, site: SITE });

    expect(ics).not.toContain("�");
    expect(unfold(ics)).toContain(arabic.title);
  });

  it("identifies the event, so adding it twice does not make two", () => {
    const ics = icsFile(fixed, { timeZone: MONTREAL, site: SITE });
    expect(ics).toContain(`UID:${fixed.id}@khair`);
  });
});

# 11: Add to calendar

**What to build:** A Volunteer who has claimed a Slot can put it in their own
calendar in one tap, so they remember it and their phone reminds them. On the
confirmation page and on the Task page, a control that opens Google Calendar
prefilled, plus a `.ics` file for anyone on Apple or Outlook.

This is the cheapest reminder mechanism available and it needs no provider, no
message fees and no scheduled delivery. It belongs ahead of ticket 09 in any
future ordering, for the same reason the tappable WhatsApp links do: a
reminder prevents the no-show that a record merely documents.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

**Decisions already taken, worth not re-litigating:**
- Khair stores no duration, only a start. Default the event to one hour and
  say so in a comment rather than inventing a `duration` column.
- A flexible Task has no start, so its calendar entry is an all-day event on
  its Deadline.
- Prefer a `.ics` route handler over a `data:` URI link, so the file has a
  real filename and content type.

- [ ] A control on the confirmation page opens Google Calendar with the title,
      time, location and a link back to the Task already filled in
- [ ] The same control appears on the public Task page
- [ ] A `.ics` download covers Apple Calendar and Outlook
- [ ] A fixed Task produces a timed event; a flexible one produces an all-day
      event on its Deadline
- [ ] Times are correct in the mosque's timezone, including across a
      daylight-saving change
- [ ] The `.ics` escapes commas, semicolons and newlines in the title,
      description and location, and uses CRLF line endings
- [ ] Labels are translated in all three languages
- [ ] Covered at the core seam: the Google URL and the `.ics` body are built by
      pure functions and tested against a fixed Task and a flexible one

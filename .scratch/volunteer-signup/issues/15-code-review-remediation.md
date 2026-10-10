# 15: Code review remediation

**What to build:** Nine defects found by a review of the whole history after v1
landed. Each is small and independently verifiable. They are grouped in one
ticket because they are repairs rather than a feature, and because several share
a root cause.

The tenth finding, **admin sessions forgeable with the shipped placeholder
password**, was high severity and is already fixed (commit `ab02d78`). The rest
are medium and below, which is why they are written down rather than rushed.

**Blocked by:** None (can start immediately).

**Status:** done

## Correctness

- [x] **A Volunteer can erase an Admin-recorded no-show.** `releaseSignup`
      checks nothing about the Task's timing, and the confirmation page offers
      the release control whenever the Signup is live. So: the Task happens, the
      Volunteer does not come, the Admin marks `no_show`, the Volunteer later
      opens their saved link and releases the Slot. `outcome` becomes
      `cancelled`, the row moves to the released section, and `setOutcome`
      refuses to touch it afterwards. The Admin can never restore the record,
      which contradicts the "always correctable" rule in ticket 07. Refuse a
      release once `starts_at ?? due_by` is in the past, and stop offering it.

- [x] **A crafted URL returns 500 instead of a translated not-found page.** The
      id guard `/^[0-9a-f-]{36}$/i` accepts strings Postgres cannot cast to
      `uuid`, such as 36 dashes. The query raises `22P02`, nothing catches it,
      and the visitor gets Next's error page. Replace it with a real UUID
      pattern everywhere it appears: `tasks.ts` twice, `signups.ts` three times.

- [x] **`editTask` does not validate its id**, so a stale or tampered hidden
      field produces a Postgres error that gets flattened to "Something went
      wrong" with a logged stack trace, instead of the accurate "That task no
      longer exists". Every other mutator guards the format; this one does not.

- [x] **`ConflictError` is unhandled in two Admin actions.** `setOutcomeAction`
      and `setTaskClosedAction` call the core with no try/catch, and nothing
      translates the error. The Admin has a Task page open, the Volunteer
      releases their Slot, the Admin taps "Did not come", and the whole page is
      replaced by a generic error screen with no way back. `claimSlotAction`
      already does this properly and is the pattern to follow.

- [x] **A failing rollback masks the original error and poisons the pool.** In
      `inTransaction` the rollback is unguarded, so when the connection has
      dropped the rollback throws too and replaces the real cause; then
      `release()` hands a client still inside an aborted transaction back to the
      pool. Wrap the rollback, and pass the error to `release(err)` so the
      client is destroyed rather than reused.

## Accuracy of what the page says

- [x] **The retention purge can run up to three days early.** `setUTCMonth`
      overflows on long months: run on 31 August with a six-month window,
      "28 February + 3" lands on 3 March, so Signups from 1 and 2 March are
      deleted after five months and twenty-nine days. The stated policy is six
      months. Clamp the day before shifting.

- [x] **Future Signups are labelled "Came" in a Volunteer's record.** `outcome`
      defaults to `done`, and the history lists every Signup, so somebody who
      just signed up for next Friday appears at the top of their record as
      having attended. The Admin reads a positive attendance record for work
      that has not happened. Distinguish "not yet" using `taskDueBy > now`.

- [x] **`<time dateTime>` names the wrong day for evening Tasks.** The attribute
      carries the UTC instant while the visible heading is formatted in
      `APP_TIMEZONE`, so a Task at 20:00 on 17 October in Montreal renders
      `dateTime="2026-10-18T00:00:00.000Z"` inside a heading that reads
      "17 October". Emit the `YYYY-MM-DD` that `dayKey` already computed.

- [x] **The volunteer page decodes its route param twice.** Next already
      percent-decodes dynamic params, so `/admin/volunteers/%25` throws a
      `URIError` and 500s for the signed-in Admin, while `%2520` silently
      becomes a space. Use the param as given.

## Afterwards

- [x] Every fix is covered at the core seam, except the two display-only ones
- [x] The full suite passes and the production build is clean

# 01: Walking skeleton: one published Task on a public page

**What to build:** A congregant can open the site and see a Task that exists in
the database, in English, Arabic or French, with its schedule, its location and
how many Slots are still open. There is no way to sign up yet and no Admin yet:
Tasks are seeded directly into the database for this ticket. The point is that
every layer exists and is wired together, so every later ticket is an addition
rather than a foundation.

This ticket also establishes the single test seam the whole project uses: core
use-case functions tested against a real Postgres, with pages and route
handlers holding no rules of their own.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

**Open before starting:** the public list's visual layout has not been chosen.
Three candidates were prototyped (timetable rows, roomy cards, day-grouped
agenda) and one must be picked before this ticket's UI is built. The stack
choice also remains open pending who maintains the app long term.

- [ ] A Task holds a title, description, location, a required Deadline, an
      optional start time and a Slot count defaulting to 1
- [ ] A Task with a start time reads as a fixed Task; one without reads as
      flexible, showing only its Deadline
- [ ] The public list shows seeded Tasks whose Deadline is in the future,
      ordered by when they are needed
- [ ] Tasks whose Deadline has passed do not appear
- [ ] Each Task shows how many Slots remain, and reads as fully covered when
      none do
- [ ] The site renders in English at the root and under a path prefix per
      additional language, English being the default
- [ ] A language switcher appears as three plain text labels in the header of
      every public page, marking the current one, and is reachable by keyboard
- [ ] The browser's language preference selects the language on a first visit
      only; an explicit choice is remembered and is never overridden afterwards
- [ ] The Arabic pages lay out right to left
- [ ] All user-facing strings live in translation resources, including English
- [ ] The page is legible and usable at phone width with large tap targets
- [ ] Core use cases for publishing and listing Tasks are tested against a real
      Postgres through the core seam
- [ ] A Task with no Deadline is rejected

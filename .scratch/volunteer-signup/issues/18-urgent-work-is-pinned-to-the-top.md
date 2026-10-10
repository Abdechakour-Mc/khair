# 18: Urgent work is pinned to the top

**What to build:** The Admin can mark a Task urgent. It sits above everything
else on the public list, visibly marked, so somebody scanning the page on their
phone after Jumu'ah feels which work actually needs them now.

Asked for mid-build: "we should pin some high priority tasks (as urgent) so the
user senses it". The list is ordered by when work happens, which is the right
default and says nothing about what matters. Three days of ordinary setup above
"we need someone to drive a family to the hospital tomorrow" buries the one
thing that cannot wait.

**Blocked by:** None.

**Status:** done

## Not the same flag as ticket 09's "important"

Ticket 09 marks a Task **important** and withholds it from everyone except
trusted Volunteers for a window. This marks a Task **urgent** and does the
opposite: shows it to everyone, louder and sooner. They are two different
intentions and they must not share a column, because collapsing them would
mean the most pressing work is the work fewest people can see.

When ticket 09 is built, `important` stays private machinery about early
access, and `urgent` stays a public statement about priority. A Task can be
both, and then the early-access window applies while the urgent pin shows to
whoever can see it.

## What keeps it meaningful

An urgent flag is only useful while it is rare, and the pressure on it is
one-way: every Task feels urgent to the person publishing it. Two cheap
guards, no counters and no quotas:

- **It expires on its own.** Urgency is about now, so the pin is a property of
  a Task whose Deadline is close. Nothing to remember to turn off.
- **The Admin's own list says how many are urgent.** If the Admin can see
  "4 urgent" at a glance, they can judge whether the word still means
  anything. One line, no enforcement.

Deliberately not built: a priority scale, numeric weights, or sorting by
anything other than urgent-then-when. Three levels of priority is a scale
nobody calibrates the same way twice.

- [x] The Admin can mark a Task urgent when publishing, and change it when
      editing
- [x] An urgent Task is pinned above the day-by-day list on the public page
- [x] It is visibly marked as urgent, not just moved, so the reason it is at
      the top is legible
- [x] An urgent Task appears once, not in both the pinned section and its own
      day
- [x] A pinned Task still says when it happens, since it is shown away from
      its day heading
- [x] Several urgent Tasks are ordered among themselves by when they happen,
      soonest first
- [x] Nothing is urgent by default, and a Task that is full still shows as
      full rather than pinned and unclaimable-looking
- [x] The marking is translated in all three languages
- [x] The Admin's Task list shows which Tasks are urgent and how many
- [x] Covered at the core seam: the grouping puts urgent first, excludes those
      Tasks from their day groups, and orders them by when they happen

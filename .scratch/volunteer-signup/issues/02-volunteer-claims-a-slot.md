# 02: Volunteer claims a Slot

**What to build:** A congregant reads a Task, enters their name and phone
number, and is confirmed as having claimed a Slot. No account, no password, no
verification step. The Task then shows one fewer Slot, and shows as fully
covered once they are all taken.

This is the ticket that carries the project's most likely production bug: two
people tapping the last Slot at the same moment must not both succeed.

**Blocked by:** 01.

**Status:** ready-for-agent

**Open before starting:** the default country used to normalise
locally-written phone numbers. It must be configuration rather than a
hard-coded constant, but the value itself has to come from the maintainer.
Without it, the same person signing up twice in different formats splits into
two Volunteers and every later Outcome record is unreliable.

- [ ] A congregant can claim a Slot by giving only a name and a phone number
- [ ] Phone numbers are normalised to E.164 before being stored or compared,
      using a configured default country for local formats
- [ ] The same number written locally and internationally resolves to one
      Volunteer
- [ ] A Signup records a snapshot of the name given, while the Volunteer record
      holds the most recently given name
- [ ] A Volunteer may hold at most one Signup per Task, enforced in the
      database, and a second attempt is refused with a clear message saying
      they are already on the list
- [ ] Two simultaneous claims on a single remaining Slot result in exactly one
      Signup, verified by a test that invokes them in parallel
- [ ] A congregant whose last Slot was taken while they were filling in the
      form is told clearly rather than silently added
- [ ] The submit control is disabled once a Task is full, and the server
      refuses the claim regardless of what the client sends
- [ ] Confirmation repeats the Task's schedule, location and Deadline
- [ ] The form labels sit above their inputs, errors appear beside the field
      they concern, and every control is reachable by keyboard
- [ ] The whole flow works in all three languages, right to left included

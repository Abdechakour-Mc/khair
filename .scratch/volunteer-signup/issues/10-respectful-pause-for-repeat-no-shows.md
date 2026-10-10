# 10: Respectful pause for repeat no-shows

**What to build:** A Volunteer who repeatedly claims Slots and does not come can
be quietly paused by the Admin, and quietly unpaused. Nothing is announced,
nothing is public, and nothing is permanent.

Post-v1, and the last thing in the whole plan. Before building it, ask whether
the Admin genuinely needs the app to enforce this, or whether having the record
from ticket 07 is already enough for them to act as a human. A conversation is
usually the better instrument, and this ticket should be closed unbuilt if that
turns out to be true.

**Blocked by:** 09.

**Status:** ready-for-agent

- [ ] The Admin can pause a Volunteer, and lift that pause at any time
- [ ] A paused Volunteer cannot claim Slots
- [ ] A paused Volunteer is never told publicly that they are paused, and no
      page reveals that pausing exists
- [ ] A pause is never applied automatically by a counter or a threshold: it is
      always a deliberate Admin action
- [ ] A pause never becomes permanent and is always reversible
- [ ] Existing Signups held by a Volunteer at the moment they are paused are
      preserved, not cancelled on their behalf
- [ ] Pause status is visible only to the Admin
- [ ] Because identity rests on an unverified phone number, a pause is a
      request rather than an enforcement, and must never be described in the
      code or the UI as a ban

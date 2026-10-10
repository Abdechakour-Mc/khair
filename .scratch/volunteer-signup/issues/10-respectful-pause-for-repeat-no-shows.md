# 10: Respectful pause for repeat no-shows

**What to build:** A Volunteer who repeatedly claims Slots and does not come can
be quietly paused by the Admin, and quietly unpaused. Nothing is announced,
nothing is public, and nothing is permanent.

Post-v1, and the last thing in the whole plan. **Approved to build** on the
same terms as ticket 09: synthetic Volunteers and Outcomes make the behaviour
judgeable before any real history exists, and that data is cleared before the
app reaches the congregation.

One reservation to carry into the build rather than discard. The record from
ticket 07 may already be enough for the Admin to act as a human, and a
conversation is usually the better instrument than a mechanism. Build it, then
ask whether the Admin actually reaches for it.

The user asked for admin moderation including bans, then asked for whatever
standard practice recommends. That resolves in favour of this pause:
graduated, private, reversible and audited is the conventional moderation
ladder, and a single ban switch is the pattern moderation teams move away
from. See the Moderation section of ticket 16. This pause is the ordinary
tool; add an audit record of each pause and lift.

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

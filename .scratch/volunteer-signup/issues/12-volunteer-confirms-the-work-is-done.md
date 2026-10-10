# 12: The Volunteer confirms the work is done

**What to build:** A Volunteer can say they have done the work, from the same
page they would use to release the Slot. The Admin sees that they said so.

The point is self-management: the Volunteer closes the loop themselves instead
of the Admin chasing to find out. It matters most for a **flexible Task**,
where nothing else tells the Admin whether the shoe rack actually got fixed.
For a fixed Task the Admin was usually there; for a flexible one they were not.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

**Decisions already taken, worth not re-litigating.** A first pass at this was
written and then reverted deliberately, because it belonged in a ticket rather
than half-built in the tree. Its design held up:

- This is a **separate column**, not a write to `outcome`. `outcome` is the
  Admin's private record and already defaults to `done`, so a Volunteer
  writing to it would change nothing and would quietly overwrite the one field
  the Admin owns. These are two different facts: "the Admin judged this done"
  and "the Volunteer said they did it". The Admin's page should be able to show
  a Volunteer who said they came and whom the Admin marked as absent, because
  that disagreement is exactly what the Admin needs to see.
- The migration is a single nullable timestamp, `volunteer_done_at`, commented
  as never set by the Admin.
- Reversible and idempotent: people mistap.
- A released Slot cannot be marked done.

- [ ] A Volunteer can mark their Signup as done from their own link, with no login
- [ ] Marking done is reversible and a double tap records one timestamp
- [ ] A flexible Task can be marked done at any time, since it may be finished
      early; a fixed Task only once it has started
- [ ] A released Slot cannot be marked done
- [ ] The Admin's Task page shows which Volunteers said they did the work
- [ ] The Admin's own Outcome is untouched by this, and the two can disagree
      visibly
- [ ] Nothing about this is shown to other Volunteers, and it is never counted
      or aggregated: see the no-recognition rule in ticket 07
- [ ] Labels are translated in all three languages
- [ ] Covered at the core seam, including the released-Slot refusal

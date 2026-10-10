# 07: Admin records Outcomes

**What to build:** The Admin keeps a private record of how each Signup ended,
while doing almost nothing. Every Signup already counts as done, so a normal
week costs the Admin no input at all; the Admin only ever flags the exceptions.

This record is never shown to a Volunteer, never turned into a score, a rank or
a badge, and never published. Public credit for worship invites riya', which is
why no recognition feature exists anywhere in this app.

Cancellation timing is shown, not judged. The Admin sees how long before the
Task a Slot was released, which conveys everything a fixed threshold would
while leaving the judgement human.

**Blocked by:** 03, 05.

**Status:** ready-for-agent

- [ ] Every Signup reads as done with no Admin action
- [ ] The Admin can flag a Signup as a no-show, and change it back
- [ ] The Admin cannot set a Signup to cancelled by hand: that comes only from
      a Volunteer releasing their own Slot
- [ ] A released Signup shows how long before the Task's start it was released,
      rendered in relative terms
- [ ] No threshold or cut-off is stored in the schema, and no early or late
      state is computed
- [ ] The Admin can see a Volunteer's past Outcomes when deciding who to rely
      on
- [ ] Outcomes are reachable only with a valid Admin session and appear nowhere
      on the public pages
- [ ] No points, ranks, badges, leaderboards or aggregate scores are produced
      anywhere, for anyone
- [ ] Recording an Outcome takes one tap on a phone

# 08: Retention purge

**What to build:** Names, phone numbers and Outcomes are forgotten some months
after the work is done, so the app does not quietly accumulate a dossier on the
congregation.

A small ticket with a real trust consequence. It is what gives the Admin an
honest answer the day a congregant asks what the app knows about them, and it
is the difference between a retention policy and a decorative claim.

**Blocked by:** 07.

**Status:** ready-for-agent

- [ ] Signups and their Outcomes are deleted once six months have passed since
      the Deadline of the Task they belong to
- [ ] A Volunteer left with no remaining Signups is deleted too, so no phone
      number survives the purge
- [ ] Tasks are kept, as a record of what the mosque has needed
- [ ] Signups still inside the window are untouched
- [ ] The purge is idempotent: running it twice changes nothing the second time
- [ ] The retention period is configuration, not a constant buried in the code
- [ ] The purge runs on a schedule without anyone remembering to trigger it
- [ ] Covered at the core seam: expired Signups go, orphaned Volunteers go,
      Tasks and in-window Signups stay

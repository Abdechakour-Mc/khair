# 09: Trusted Volunteers and early access to important Tasks

**What to build:** The Admin marks some work as important, and the Volunteers
they have come to rely on get first sight of it for a window before it opens to
everyone.

Post-v1. This was deliberately cut from the first release and sequenced last:
it is the largest piece of machinery in the original brief and it serves none of
the reason the app exists. It is placed after ticket 07 because "trusted" is
meaningless without Outcome history to base it on, and after ticket 08 because
retention touches the same tables and doing it first avoids migrating twice.

**This is now approved to build.** The objection was that "trusted" is
meaningless without Outcome history to base it on, and the answer is synthetic
history: seed fake Volunteers and Outcomes so the feature can be built and
judged now, then clear them before the app reaches the congregation.

That makes a demo seed a prerequisite of this ticket, with one hard
requirement. Synthetic phone numbers must come from **+1 555 01xx**, the block
NANP reserves for fiction. A fake number can then never collide with a real
congregant's, and the whole synthetic set is identifiable by pattern and
removable in one statement. Do not generate realistic-looking numbers.

**Blocked by:** 08.

**Status:** ready-for-agent

- [ ] The Admin can mark a Volunteer as trusted, and remove that mark
- [ ] The Admin can mark a Task as important, and remove that mark
- [ ] An important Task is visible and claimable only to trusted Volunteers for
      a configured window after publication
- [ ] The window length is configuration, not a constant in the code
- [ ] Once the window passes, the Task appears to everyone with no Admin action
- [ ] A Volunteer is never told that a Task was withheld from them, and the
      public pages never reveal that an early-access window exists
- [ ] Trusted status is visible only to the Admin and appears nowhere public
- [ ] Because identity rests on an unverified phone number, early access is
      convenience rather than a security boundary, and nothing that matters may
      depend on it holding
- [ ] A demo seed creates synthetic Volunteers, Signups and Outcomes using only
      +1 555 01xx numbers, enough history to make trust judgements legible
- [ ] A single command removes every synthetic record, and leaves real records
      untouched
- [ ] The demo seed refuses to run when NODE_ENV is production

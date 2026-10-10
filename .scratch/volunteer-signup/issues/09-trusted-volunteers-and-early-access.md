# 09: Trusted Volunteers and early access to important Tasks

**What to build:** The Admin marks some work as important, and the Volunteers
they have come to rely on get first sight of it for a window before it opens to
everyone.

Post-v1. This was deliberately cut from the first release and sequenced last:
it is the largest piece of machinery in the original brief and it serves none of
the reason the app exists. It is placed after ticket 07 because "trusted" is
meaningless without Outcome history to base it on, and after ticket 08 because
retention touches the same tables and doing it first avoids migrating twice.

Before building this, check whether it is still wanted. If months of real
Outcomes show no-shows are not actually a problem, this ticket should be closed
unbuilt rather than implemented.

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

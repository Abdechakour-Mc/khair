# 04: Admin signs in and publishes a Task

**What to build:** The Admin reaches a private view with a single password and
publishes a Task that appears on the public list straight away. Both shapes are
supported: a fixed Task with a date and start time, and a flexible Task with
only a Deadline. After this ticket nothing needs to be seeded by hand.

The Admin view is English only. It has one reader who reads English, and
translating it would double the string count for no reach.

**Blocked by:** 01.

**Status:** ready-for-agent

- [ ] A single shared password, held in configuration rather than in the
      codebase, grants access to the Admin view
- [ ] A successful sign-in sets a session that survives closing and reopening
      the browser, so the Admin is not retyping the password on their phone
- [ ] Every Admin page and action is refused without a valid session
- [ ] A wrong password says so without hinting at the correct one
- [ ] The Admin can publish a Task with a title, description, location and
      Deadline
- [ ] The Admin can publish either a fixed Task with a date and start time or a
      flexible Task with only a Deadline
- [ ] The Admin can set how many helpers a Task needs, defaulting to one
- [ ] A published Task appears on the public list immediately
- [ ] The Admin sees a list of Tasks, including those whose Deadline has passed
      and which have therefore left the public list
- [ ] A Task with no Deadline, or with a Slot count below one, is refused with
      a message naming the problem
- [ ] The Admin view is usable on a phone

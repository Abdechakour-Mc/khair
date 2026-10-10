# 06: Admin edits and closes a Task

**What to build:** The Admin corrects a Task after publishing it, and withdraws
work that is no longer happening. A mistyped time no longer means deleting the
Task and re-advertising it, and weather or a cancelled event no longer leaves
stale work on the poster.

Telling the Volunteers who had already signed up is a message the Admin sends
by hand, using the tappable numbers from ticket 05. In-app notification is
deliberately out of scope.

**Blocked by:** 04.

**Status:** ready-for-agent

- [ ] The Admin can edit a published Task's title, description, location,
      schedule, Deadline and Slot count
- [ ] Edits are reflected on the public list immediately and in every language
- [ ] Reducing the Slot count below the number of Signups already taken is
      refused with a message explaining why
- [ ] The Admin can close a Task before its Deadline
- [ ] A closed Task leaves the public list and can no longer be claimed
- [ ] A closed Task remains visible in the Admin view, marked as closed
- [ ] The Admin can reopen a Task closed by mistake
- [ ] Existing Signups on a closed Task are preserved, not deleted
- [ ] Editing and closing are refused without a valid Admin session

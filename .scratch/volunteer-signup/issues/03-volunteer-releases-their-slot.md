# 03: Volunteer releases their own Slot

**What to build:** A congregant who can no longer come opens the link on their
confirmation and releases their Slot, without logging in and without speaking
to anyone. The Slot returns to the pool and somebody else can claim it.

This completes the core loop. Cancelling is where the awkwardness the app
exists to remove bites hardest: telling a person you cannot make it is harder
than being asked in the first place. After this ticket, the app delivers its
whole reason for existing.

**Blocked by:** 02.

**Status:** ready-for-agent

- [ ] Each Signup carries a secret Cancel Token generated when it is created
- [ ] The confirmation page shows the link containing that token, in a form a
      congregant can screenshot or keep
- [ ] Opening the link releases that Signup with no login, and keeps working
      later on a different device
- [ ] Releasing stamps the time of the cancellation
- [ ] The released Slot returns to the pool and the Task becomes claimable
      again, including when it had been fully covered
- [ ] A new Signup can take a released Slot
- [ ] A Cancel Token reaches exactly one Signup and never the Volunteer's other
      Signups or their history
- [ ] An unknown or already-used token fails without revealing whether it ever
      existed
- [ ] The congregant is told clearly that they are no longer expected
- [ ] The page works in all three languages, right to left included

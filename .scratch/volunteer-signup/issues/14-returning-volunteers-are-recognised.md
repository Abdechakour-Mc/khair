# 14: Returning volunteers are recognised

**What to build:** Somebody who has helped before should not retype their name
and number every time, and the Admin should be able to see one person's history
rather than a scatter of similar-looking names.

Two problems, one cause. A Volunteer filling the form from scratch each time
finds it tedious; and when they type their name slightly differently, or use a
second number, the Admin's record of them quietly splits in half. Khair already
keys a Volunteer on their phone number, so the data model is right. What is
missing is a way for the Volunteer to be *recognised* without typing everything
again.

**Blocked by:** 13 (the same decision governs both).

**Status:** blocked on a decision, see below

## The decision this ticket needs

"Use the same account for future signups" is the instinct, and it is right about
the problem. The open question is what proves who someone is, and the honest
options differ a lot in cost:

**(a) Remember them on their own device.** After a Signup, keep the name and
number in a cookie on that phone and prefill the next form. No account, no
login, no new identity mechanism. Solves the tedium completely for the common
case, which is the same person on the same phone. Does nothing across devices,
and nothing for the Admin's split-record problem.

**(b) Verify the phone number once, by SMS.** This is what "an account" really
means here. It makes the identity real, which makes merging and history
trustworthy, and it would let a Volunteer see their own signups safely. Costs an
SMS provider, per-message fees, and a verification step in the one flow that
must stay frictionless. It was considered and rejected at the start of the
project, for that last reason.

**(c) Admin-side merge.** Leave the public form alone, and give the Admin a way
to say "these two records are the same person". Fixes the record-keeping problem
without touching the volunteer experience at all.

**Recommendation: (a) now, (c) when it actually hurts, (b) only if the mosque
decides verified identity is worth the lost signups.** (a) is cheap and
removes most of the tedium; (c) is the real fix for the Admin's problem and can
wait until there is evidence of it. Taking (b) reverses a founding decision of
this project and should be a deliberate choice by the mosque, not a side effect
of wanting prefilled forms.

**The constraint that does not move:** a remembered name on a device is a
convenience, never proof of identity. Nothing that matters may depend on it.
And no page may list a person's Signups from a phone number alone.

- [ ] A returning Volunteer on the same device finds their name and number
      already filled in
- [ ] They can change either field, and changing it is remembered
- [ ] Nothing is remembered on a device that never completed a Signup
- [ ] The remembered values are a convenience only: no page grants access to
      anything on the strength of them
- [ ] Clearing browser data loses the convenience and nothing else
- [ ] The Admin can still see one Volunteer's history keyed on the normalised
      phone number, as today
- [ ] If the Admin-side merge is chosen, merging preserves every Signup and
      every Outcome, and is reversible

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

**Status:** done — decision taken, see below

## The decision, taken

**(a) Remember them on their own device.** Asked which of the three to build,
the answer was "one phone number one user".

That settles both halves of this ticket. The phone number is the identity,
one number to one person, so the Admin-side merge in (c) has nothing to
merge: two numbers are two people by definition, and a Volunteer who writes
their name differently is the same person because the number is the same. And
(b), verifying by SMS, stays refused — it reverses a founding decision of the
project and buys nothing that "one number, one person" does not already give.

So: a cookie on that phone, holding the name and number last used there, and
the next signup form arrives filled in. Both fields stay editable and
whatever is submitted replaces what was remembered.

**The one thing to be careful about.** A remembered name is a convenience and
never proof of identity: anybody can put anything in their own cookie. The
only thing it is allowed to do is save typing.

Ticket 09's early access is the one place that reads it for more than
prefill, and that is deliberate rather than an exception being smuggled in.
What early access does on the strength of this cookie is show a Task that
would have been public a few hours later anyway, holding nothing personal.
Somebody who forges the cookie sees a cleaning rota early, and the Admin can
undo their claim. That is the whole exposure, which is why ticket 09 calls
early access convenience rather than a boundary. Nothing that matters -
reaching a Signup, releasing a Slot, seeing a record, anything in the Admin
view - may ever depend on it.

## The decision this ticket needed

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

- [x] A returning Volunteer on the same device finds their name and number
      already filled in
- [x] They can change either field, and changing it is remembered
- [x] Nothing is remembered on a device that never completed a Signup
- [x] The remembered values are a convenience only: no page grants access to
      anything on the strength of them
- [x] Clearing browser data loses the convenience and nothing else
- [x] The Admin can still see one Volunteer's history keyed on the normalised
      phone number, as today
- [ ] If the Admin-side merge is chosen, merging preserves every Signup and
      every Outcome, and is reversible — not chosen: under "one phone number
      one user" there is nothing to merge

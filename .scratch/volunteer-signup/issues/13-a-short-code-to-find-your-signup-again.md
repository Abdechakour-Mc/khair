# 13: A short code to find your signup again

**What to build:** A Volunteer can get back to their own Signup without having
kept a long link. They are given a short code they can write down or remember,
and a page where they enter it.

Today the only way back is the confirmation URL, which carries 32 characters of
randomness. That is excellent security and poor memory: a congregant standing in
the mosque who closed the tab has no way back, and losing the way back means
losing the way to cancel, which is the whole reason this app exists.

**Blocked by:** None (can start immediately).

**Status:** done — decision taken, see below

## The decision this ticket needs

A short code and the Cancel Token's secrecy pull in opposite directions, and
this is a real trade-off rather than a detail to settle in code.

The page a code opens can **cancel someone's commitment** and shows **their
name and which Task they claimed**. A 6-digit code has a million values; across
a few hundred live Signups, guessing one at random succeeds often enough to
matter, and an attacker does not need a *particular* person's code to do harm.
So a bare short code is a genuine downgrade, not a convenience.

Three ways to have both, in increasing order of friction:

**(a) Code plus phone number.** The Volunteer enters their short code and the
phone number they signed up with; both must match. The code stops being a
secret and becomes a lookup key, and the phone number is the proof. Costs one
extra field. Does not help someone who has forgotten which number they used.

**(b) Longer code, no second factor.** Ten characters from an unambiguous
alphabet (no O/0, no I/1) is still writable on a scrap of paper and has enough
values that guessing is hopeless. Costs nothing but is less memorable than six
digits.

**(c) Six digits plus rate limiting and lockout.** Memorable, and the attack is
blocked operationally rather than mathematically. Needs per-IP and per-code
attempt tracking, which is the only option here that adds infrastructure.

**Decided: (a), code plus phone number.** Asked to choose, the answer was
code plus phone. So the code is a lookup key rather than a secret, six digits
long, and the phone number they have already typed once is the proof.

Two consequences worth recording. The "avoid characters misread by hand"
requirement is satisfied by construction rather than by a careful alphabet:
digits only means there is no O to confuse with 0 and no I to confuse with 1,
and six digits can be read down the phone without spelling anything. And
uniqueness is enforced among live Signups only, by a partial unique index, so
a released Slot gives its code up and the code may belong to somebody else
later - which is also why looking one up matches live Signups only.

**Original recommendation: (a).** It is the only one that stays strong as the mosque
grows, the extra field is a number the Volunteer has already typed once, and it
composes with ticket 14 rather than fighting it.

**What this must not become:** a page where typing a phone number alone lists
that person's Signups. That was ruled out early and for good reason, and it
stays ruled out: phone numbers here are unverified, so anyone who knows a
congregant's number would be able to see and cancel their commitments.

- [x] A Volunteer is shown a short code on the confirmation page, alongside the
      link, in a form that is easy to read aloud or write down
- [x] A page lets them reach their Signup again with that code
- [x] Reaching a Signup requires the chosen second factor, per the decision above
- [x] The long Cancel Token link keeps working unchanged, for anyone who did
      save it
- [x] A wrong code and a code that never existed fail identically
- [x] Codes are unique among live Signups and are not reused while one is live
- [x] Codes avoid characters that are misread by hand (O/0, I/1)
- [x] Covered at the core seam, including a wrong second factor and an expired
      or released Signup

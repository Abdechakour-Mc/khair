-- A short code a Volunteer can write down, so losing the link is not the same
-- as losing the way to cancel.
--
-- The link carries 32 characters of randomness, which is excellent security
-- and poor memory: a congregant standing in the mosque who closed the tab had
-- no way back, and the way back is the way to release a Slot, which is most
-- of the reason this app exists.
--
-- Six digits alone would be a downgrade rather than a convenience: a million
-- values against a few hundred live Signups means guessing one at random
-- succeeds often enough to matter, and the page a code opens can cancel
-- somebody's commitment and shows their name. So the code is a lookup key and
-- not a secret, and the phone number they signed up with is the proof. Both
-- must match.
--
-- Unique among LIVE Signups, which is what the partial index says. Once a
-- Volunteer releases their Slot their code stops working and may eventually
-- belong to somebody else; while a Signup is live, its code is its own.

alter table signups add column find_code text;

create unique index one_live_find_code
  on signups (find_code)
  where cancelled_at is null;

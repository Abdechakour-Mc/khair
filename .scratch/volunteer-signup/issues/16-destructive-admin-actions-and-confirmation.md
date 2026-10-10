# 16: Destructive admin actions, and confirming them

**What to build:** The Admin can erase data on purpose rather than only waiting
for the retention purge, and every action that destroys something asks twice
before doing it.

The most important case is not housekeeping. It is a congregant asking what the
app knows about them and asking for it to be deleted. Khair's answer today is
"it goes in six months", which is honest but not an answer to that request. The
Admin needs to be able to say yes.

**Blocked by:** None (can start immediately). Worth doing before 09 and 10,
which add the synthetic data this ticket needs to be able to clear.

**Status:** ready-for-agent

## The confirmation rule

No single tap may destroy data. Nothing in v1 currently does, which is why
there is no confirmation pattern yet: closing a Task, flagging a no-show and
editing are all reversible and should **stay** one tap. Do not add friction to
them. The rule applies to the new actions below and to nothing else.

- **Two steps, server-rendered.** A destructive control leads to its own page
  that names exactly what will be destroyed, in numbers ("this will delete 3
  signups and 1 volunteer record"), and carries the only button that does it.
  No JavaScript confirm dialog: it must work on an old phone with scripting off.
- **Typing to confirm, for the widest actions.** Clearing all demo data or
  erasing a person requires typing something specific, not just a second tap.
  A phone number for an erasure, a fixed phrase for a bulk clear.
- **Say what cannot be undone.** The page states plainly that the records are
  gone and cannot be recovered, because they genuinely cannot.
- **Count before you destroy, and show the count.** An Admin who sees "this
  will delete 412 signups" when they expected 3 has been saved by the screen.

## The actions

- [ ] **Forget one Volunteer.** Deletes that Volunteer and every Signup of
      theirs, keeping the Tasks. Confirmed by typing their phone number. This
      is the answer to an erasure request, so it must be complete: afterwards no
      page, Outcome or history anywhere mentions them.
- [ ] **Delete one Task.** Removes the Task and its Signups. Confirmed on a page
      naming the Task and counting what goes with it. Calling a Task off already
      exists and is reversible: the confirmation page should say so, so an Admin
      who wanted that reaches for it instead.
- [ ] **Clear all synthetic data.** Deletes every record whose phone number is
      in the +1 555 01xx block that ticket 09 reserves for fiction, and nothing
      else. Confirmed by typing a phrase. Refuses to touch a number outside that
      block even if asked.
- [ ] **Run the retention purge by hand.** The same purge the schedule runs,
      triggered from the Admin view, showing the count first.

## Moderation

The Admin should be able to act on someone who repeatedly claims Slots and does
not come. **That is ticket 10**, and it is deliberately a reversible private
pause rather than a ban.

**One thing to settle before building a ban.** "Never a public ban" was in the
original brief and is a founding decision of this app: a pause is private,
reversible, and never announced, because a mosque removing someone from
volunteering in public is a different and heavier act than an app hiding a
button. If a harder, permanent ban is genuinely wanted, that is a decision to
take knowingly rather than to arrive at by calling a pause a ban. Ask before
building it.

What can be built without touching that question:

- [ ] Whatever moderation lands, it is reversible unless the user has explicitly
      decided otherwise, and nothing about it is ever shown publicly
- [ ] Because identity rests on an unverified phone number, any block is a
      request and not an enforcement: the same person with a new number is a new
      Volunteer. Never describe it in the code or the UI as if it were airtight.

## Afterwards

- [ ] Every destructive core function is covered at the seam, including that it
      destroys exactly what it said it would and nothing adjacent
- [ ] A cancelled confirmation destroys nothing
- [ ] Destructive actions are refused without a valid Admin session, like every
      other Admin route

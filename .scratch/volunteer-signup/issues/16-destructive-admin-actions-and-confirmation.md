# 16: Destructive admin actions, and confirming them

**What to build:** The Admin can erase data on purpose rather than only waiting
for the retention purge, and nothing that destroys data can happen by one
unguarded tap: it is either undoable afterwards or confirmed beforehand.

The most important case is not housekeeping. It is a congregant asking what the
app knows about them and asking for it to be deleted. Khair's answer today is
"it goes in six months", which is honest but not an answer to that request. The
Admin needs to be able to say yes.

**Blocked by:** None (can start immediately). Worth doing before 09 and 10,
which add the synthetic data this ticket needs to be able to clear.

**Status:** done, except the two moderation boxes that ticket 10 carries

## The confirmation rule

Settled by asking what the standards actually require, rather than by taste.

**WCAG 2.2 success criterion 3.3.4 (Error Prevention, Level AA)** governs this
directly: where a submission deletes user-controllable data, it must be
**reversible, or checked, or confirmed**. Any one of the three satisfies it,
which is the important part. And the long-standing usability finding, from
Nielsen Norman Group onwards, is that **undo beats confirm**: a confirmation
dialog interrupts everyone to prevent a rare mistake, while undo lets the
common case run and still rescues the mistake.

So the rule is: **prefer reversible, fall back to confirmed.**

- **Where the action can be undone, make it undoable and do not confirm it.**
  Deleting a Task should soft-delete with an undo for a short window, not
  interrogate the Admin.
- **Where it genuinely cannot be undone, confirm on its own page.** An erasure
  request must really erase, so undo is not available and confirmation is the
  only remaining option.
- **Two steps, server-rendered**, naming exactly what will be destroyed in
  numbers ("this will delete 3 signups and 1 volunteer record"). A dedicated
  confirmation page rather than a JavaScript dialog, following the GOV.UK
  Design System pattern, so it works on an old phone with scripting off.
- **Typing to confirm, for the irreversible and wide actions.** A phone number
  for an erasure, a fixed phrase for a bulk clear.
- **Say plainly what cannot be recovered.**
- **Count before you destroy, and show the count.** An Admin who sees "this
  will delete 412 signups" when they expected 3 has been saved by the screen.

Nothing in v1 currently destroys data, which is why no confirmation pattern
exists yet: closing a Task, flagging a no-show and editing are all reversible
and must **stay** one tap. Adding friction to reversible actions is how people
are trained to tap straight through the dialogs that matter.

## The actions

- [x] **Forget one Volunteer.** Deletes that Volunteer and every Signup of
      theirs, keeping the Tasks. Confirmed by typing their phone number. This
      is the answer to an erasure request, so it must be complete: afterwards no
      page, Outcome or history anywhere mentions them.
- [x] **Delete one Task.** Removes the Task and its Signups. Reversible rather
      than confirmed: soft-delete it, and offer an undo for a short window. Use
      the space to point out that calling a Task off already exists and keeps
      the Signups, so an Admin who wanted that reaches for it instead.
- [x] **Clear all synthetic data.** Deletes every record whose phone number is
      in the +1 555 01xx block that ticket 09 reserves for fiction, and nothing
      else. Confirmed by typing a phrase. Refuses to touch a number outside that
      block even if asked.
- [x] **Run the retention purge by hand.** The same purge the schedule runs,
      triggered from the Admin view, showing the count first.

## Moderation

**Resolved: build what trust-and-safety practice recommends, which is a
graduated private ladder, not a ban switch.** The question was whether to add a
permanent public ban alongside ticket 10's pause. The answer from standard
practice coincides with the original brief, so there is nothing to trade off.

What the established practice actually says:

- **Graduated enforcement, not binary.** The conventional ladder is a quiet
  word, then a temporary restriction, then removal. A single ban switch is the
  pattern experienced moderation teams move away from, because almost every
  real case is somebody unreliable rather than somebody malicious.
- **Reversible by default, with a route back.** The EU Digital Services Act
  codifies notice and a means to contest a restriction; even well outside its
  scope, "no silent irreversible removal" is the baseline expectation.
- **Private, not announced.** Publicising a restriction is not a recognised
  moderation practice, it is shaming. That is also why Khair has no
  leaderboard: see the riya' reasoning in ticket 07.
- **Audited.** Every moderation action records what was done and when, so a
  decision can be explained months later.

Ticket 10's reversible private pause is therefore the primary and probably only
tool needed. A permanent rung may exist at the top of the ladder, but it stays
private, stays recorded, and stays liftable by the Admin.

- [ ] Moderation is graduated: the pause from ticket 10 is the ordinary tool,
      and anything heavier is an explicit further step — carried by ticket 10
- [ ] Every moderation action is reversible by the Admin — carried by ticket 10
- [ ] Nothing about a restriction is ever shown publicly, and no page reveals
      that restriction exists — carried by ticket 10
- [x] Each moderation action is recorded with what changed and when, so it can
      be explained later — the `admin_actions` table is here, ticket 10 writes
      its pause and lift into it
- [ ] Because identity rests on an unverified phone number, any block is a
      request and not an enforcement: the same person with a new number is a new
      Volunteer. Never describe it in the code or the UI as if it were airtight.
      — carried by ticket 10

## Afterwards

- [x] Every destructive core function is covered at the seam, including that it
      destroys exactly what it said it would and nothing adjacent
- [x] A cancelled confirmation destroys nothing
- [x] Destructive actions are refused without a valid Admin session, like every
      other Admin route

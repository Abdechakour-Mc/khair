# 17: Some work is for brothers, or for sisters

**What to build:** A Task can say who it is open to — anyone, brothers, or
sisters — and the public pages say so plainly before anybody claims a Slot.

Asked for mid-build: "sometimes we need gender for that task (either a brother
or sister)". Real and ordinary in a mosque: the sisters' section, the sisters'
entrance, washing of the deceased, supervising the girls' class. A Task that
needs a sister and gets three brothers has not been covered, and the Admin
finds that out on the day.

**Blocked by:** None.

**Status:** done

## The decision this takes, and the one it refuses

The Task carries this, and the Volunteer does not. Khair stores nothing about
anybody's gender, asks nothing on the signup form, and keeps no such column on
`volunteers`.

That is the whole design, and it is worth saying why, because the obvious
alternative is to ask each Volunteer once and filter the list for them:

- **It is one field on a Task against a new personal fact about every
  congregant.** The Task version costs the Admin one tap when publishing.
  The Volunteer version means Khair holds gender for the whole congregation,
  which then falls under the retention policy, appears in an erasure request,
  and has to be justified to anyone who asks what the app knows about them.
  Khair's answer today is "your name, your number, and what you signed up
  for". That is worth keeping.
- **It would not be enforcement anyway.** Identity here rests on an unverified
  phone number, so a stored answer proves nothing. Filtering the list on it
  would buy the appearance of a boundary and none of the substance, which is
  the same reasoning already written down for early access in ticket 09.
- **The congregation is not the attacker.** Somebody reading "we need two
  sisters for the sisters' entrance" and claiming it anyway is not a threat
  model, it is a misunderstanding, and the Admin can see the names and ring
  them. The one-tap WhatsApp link on the Admin page is already the tool for
  that.

So: the Task states who it needs, the pages say it clearly in all three
languages, and claiming is on trust. If the mosque later finds people claiming
work that is not theirs, that is the evidence that would justify asking
Volunteers — and it should be a deliberate decision then, not an assumption
now.

**Naming.** The column and the domain term are `open_to` / **Open To**, with
the values `anyone`, `brothers` and `sisters`. Not "gender" and not "sex":
those name a fact about a person, and this is a fact about a piece of work.
The default is `anyone`, so nothing already published changes meaning and the
Admin only touches the field on the Tasks that need it.

- [x] A Task records who it is open to, defaulting to anyone
- [x] The Admin chooses this when publishing and can change it when editing
- [x] The public list and the Task page say who the work is for, and say
      nothing at all on a Task open to anyone
- [x] Nothing about anybody's gender is stored, asked for, or inferred
- [x] The database rejects a value outside the three
- [x] Labels are translated in all three languages
- [x] The Admin's Task page shows it too, so the Admin can see what they
      published
- [x] Covered at the core seam: the default, each value, a rejected value, and
      editing one Task from one value to another

# Khair v1 — Self-serve volunteer signup

> Not yet published to an issue tracker: none was configured at the time of
> writing. Run `/setup-matt-pocock-skills`, then this file can be published
> with the `ready-for-agent` label.
>
> Decisions marked **ASSUMED** were recommended but not yet confirmed by the
> maintainer. Decisions marked **OPEN** cannot be defaulted and block the work
> they touch.

## Problem Statement

Our mosque needs help with ordinary work — setting up for Friday prayer,
cleaning, receiving a delivery, staffing an event. Today that help is
recruited by asking people face to face.

Being asked in person is the problem. The person asked has to decline to
someone's face if they cannot help, which is uncomfortable enough that some
say yes and then do not come. The person asking has to remember who they have
already approached and feels awkward asking again. Plenty of people who would
gladly help are never asked, because nobody thought of them that week.

Meanwhile the Admin has no written record of what help was needed, who
offered, or who actually turned up — only memory and a WhatsApp scroll.

## Solution

A QR code on a poster in the mosque opens a page listing the open Tasks.
Anyone can read what is needed and claim a Slot themselves, giving only a name
and a phone number. No account, no password, no app to install, and no
conversation with a person. Nobody has to say no to a face: they simply do not
sign up.

If someone can no longer make it, the link on their confirmation lets them
release the Slot themselves — which is where the awkwardness bites hardest,
and so is the part that matters most.

The Admin gets a private view of every Task, who claimed it, and a quiet
record of how each Signup ended. That record exists so the Admin knows who to
count on. It is never shown to Volunteers, never scored, never ranked and
never published, because public recognition for worship invites riya'.

The public pages read in English, Arabic and French, switchable in one tap
from any page.

## User Stories

### Finding work (Volunteer)

1. As a congregant standing in front of a poster, I want to scan a QR code and land straight on the list of open Tasks, so that I can see how I could help without downloading anything or creating an account.
2. As a congregant, I want the page to work well on my phone, so that I can read and use it while standing in the mosque.
3. As a congregant, I want to see every Task that still needs help, so that I can pick one that suits me rather than being handed one.
4. As a congregant, I want to see a Task's Deadline, so that I know whether I can realistically do it in time.
5. As a congregant looking at a fixed Task, I want to see the exact date and start time, so that I can check it against my own week.
6. As a congregant looking at a flexible Task, I want to see that it can be done any time before its Deadline, so that I understand I am not committing to a specific hour.
7. As a congregant, I want to see where a Task happens, so that I am not surprised by the location.
8. As a congregant, I want to see how many helpers a Task still needs, so that I know whether my help is actually required.
9. As a congregant, I want to see Tasks that are already fully covered rather than have them vanish, so that the list does not look broken and I can see the community pulling its weight.
10. As a congregant, I want Tasks whose Deadline has passed to disappear by themselves, so that I am never shown work I can no longer do.
11. As a congregant, I want the whole public site in English, Arabic or French, so that I can read it in the language I actually think in.
12. As an Arabic-speaking congregant, I want the page laid out right to left, so that it reads naturally rather than looking like a translated form.
13. As a congregant, I want the language switcher visible on every page as three plain labels rather than hidden in a menu, so that I can see at a glance that my language is available.
14. As a congregant, I want my language choice remembered on my next visit, so that I do not re-pick it every time I scan the poster.
15. As a congregant whose phone is set to French, I want the site to open in French the first time without my doing anything, so that the first screen I see already makes sense.
16. As a congregant, I want to share a link in my own language with a friend, so that they open it the way I read it.

### Claiming work (Volunteer)

17. As a congregant, I want to claim a Slot by entering only my name and phone number, so that helping costs me ten seconds and no password.
18. As a congregant, I want to be told immediately that my Signup was recorded, so that I am not left wondering whether to sign up again.
19. As a congregant, I want my confirmation to repeat the Task's time, place and Deadline, so that I can screenshot it and not forget.
20. As a congregant, I want a link on my confirmation that releases my Slot, so that if my plans change I can withdraw without telephoning anyone.
21. As a congregant, I want the release link to work without any login, so that it still works weeks later on a different phone.
22. As a congregant, I want the release link to touch only this one Signup, so that a link I forwarded to my wife cannot expose anything else about me.
23. As a congregant, I want to be told clearly once the Slot is released, so that I know I am no longer expected.
24. As a congregant who taps the submit button twice, I want only one Signup recorded, so that I do not appear to have taken two Slots.
25. As a congregant, I want to be stopped with a clear message if I try to claim a Task I already claimed, so that I understand I am already on the list.
26. As a congregant, I want to be told if the last Slot was taken while I was filling in the form, so that I do not turn up to work that is already covered.
27. As a congregant, I want to enter my phone number in whatever format I normally write it, so that I do not have to think about country codes.
28. As a congregant, I want my name and number used only to organise this help, so that I can sign up without wondering where my number ends up.

### Publishing work (Admin)

29. As an Admin, I want to reach a private view with a single password, so that I can manage Tasks without maintaining accounts for anyone.
30. As an Admin, I want to stay signed in on my own phone, so that I am not typing a password every time I check who signed up.
31. As an Admin, I want to publish a Task with a title, description, location and Deadline, so that congregants know what is actually being asked.
32. As an Admin, I want to publish a Task either with a fixed date and time or with only a Deadline, so that I can describe both "Friday 6pm setup" and "repaint the shoe rack sometime this month".
33. As an Admin, I want to say how many helpers a Task needs, so that one poster can recruit three people without my creating three Tasks.
34. As an Admin, I want to edit a Task after publishing it, so that a corrected time does not require deleting and re-advertising it.
35. As an Admin, I want to close a Task before its Deadline, so that I can withdraw work that is cancelled by weather or circumstance.
36. As an Admin, I want to see past Tasks in my own view even though they left the public list, so that I keep a record of what the mosque has needed.

### Tracking help (Admin)

37. As an Admin, I want to see every Volunteer who claimed a Slot on a Task, with their name and number, so that I know who to expect.
38. As an Admin, I want to tap a Volunteer's number to open WhatsApp or a phone call, so that reminding or regrouping people costs me one tap.
39. As an Admin, I want every Signup to count as done without my touching it, so that recording a normal week costs me nothing.
40. As an Admin, I want to flag the exceptions — a Volunteer who did not come — so that the record reflects reality while I only ever handle the unusual cases.
41. As an Admin, I want to correct an Outcome I recorded wrongly, so that one mistaken tap does not permanently misrepresent someone.
42. As an Admin, I want to see when a Volunteer released their Slot relative to the Task's start, so that I can tell a week's notice from a midnight cancellation without the app judging either.
43. As an Admin, I want Outcomes visible only to me, so that nobody is ranked, shamed or praised in public.
44. As an Admin, I want no points, badges or leaderboard anywhere in the app, so that volunteering here never becomes a performance.
45. As an Admin, I want to see a Volunteer's past Outcomes when deciding who to rely on, so that the record is actually useful to me.
46. As an Admin, I want a Volunteer's name and number forgotten some months after the work is done, so that the app does not quietly accumulate a dossier on the congregation.
47. As a congregant, I want nobody to be able to look up my history by typing my phone number into the public site, so that an unverified number never exposes what the mosque recorded about me.

## Implementation Decisions

### Identity

- **A Volunteer is identified by phone number.** The number is the key that
  links Signups over time; no password, no verification, no account. This is a
  deliberate trade: a Volunteer's history is only as trustworthy as the number
  they typed, and anyone who knows a congregant's number could sign up as
  them. Accepted because an SMS verification step at the moment of
  volunteering would cost more Signups than it would prevent impersonations.
- **Phone numbers are normalised to E.164 before storage and comparison.**
  Without this, the same number written locally and internationally becomes
  two Volunteers and the Outcome history silently splits.
- **DECIDED:** the default country for normalising locally-written numbers is
  **Canada (+1)**, held in configuration rather than hard-coded. A 10-digit
  local number resolves to its +1 form. Note that +1 is the whole North
  American plan, so a US number entered locally also resolves cleanly.
- **The Volunteer record holds the most recent name; every Signup also holds a
  name snapshot.** This covers a shared household phone (father and son, one
  number, two names) without introducing a household concept, and keeps the
  Admin's list accurate to what was typed on the day.
- **Mistyped numbers create a new Volunteer, and that is accepted.** It is the
  unavoidable cost of unverified identity.
- **No public lookup by phone number anywhere.** There is no "see my signups"
  screen. Were one to exist, typing a number would expose that person's
  record — which is why the Cancel Token exists instead.

### Tasks

- **One Task entity covers both scheduling shapes**, with a required Deadline
  and an optional start time. A present start time makes it a fixed Task; an
  absent one makes it flexible. Two entities would double every query, form
  and list for no behavioural gain.
- **Slots are an integer count on the Task, defaulting to 1.** Remaining
  capacity is that count minus live Signups.
- **The last Slot is defended on the server.** The submit button disables
  client-side, but the authoritative check happens inside the signup use case
  under a constraint or transaction. Two phones tapping simultaneously must
  not both succeed — this is the single most likely production bug.
- **A Volunteer may hold at most one Signup per Task**, enforced by a
  uniqueness constraint on the Task and the normalised phone number. This
  kills double submission for free; a Volunteer genuinely wanting two Slots is
  rare enough for the Admin to handle by hand.
- **No recurring Tasks.** A weekly Task is published weekly. Recurrence drags
  in series-versus-instance semantics (does cancelling one instance cancel the
  series? do Signups follow it?) that are not worth v1. A duplicate-Task
  action is the cheap future answer.
- **The public list shows Tasks whose Deadline is in the future and which are
  not closed.** Past Tasks leave the public list by date alone; there is no
  archive state and nothing to tidy up.
- **Full Tasks remain visible, marked as fully covered**, rather than
  disappearing. An empty list reads as a broken page.
- **The Admin has a manual close flag** for work withdrawn before its
  Deadline. Telling the Volunteers who had signed up is a manual message; see
  Out of Scope.

### Signups and Outcomes

- **A Signup carries a secret Cancel Token** generated at creation. The
  confirmation page shows the link containing it, and that link is the only
  way a Volunteer reaches their own Signup. Its reach is one Signup — never
  the Volunteer's other Signups and never their Outcome history.
- **Outcome is stored on the Signup and defaults to `done`**, so a normal week
  requires no Admin input and the Admin only ever marks exceptions.
- **The Admin may set `done` or `no_show`.** `cancelled` is set only by the
  Volunteer releasing their Slot, which also stamps the cancellation time.
- **Outcomes are correctable.** Nothing about this record is append-only.
- **Cancellation timing is shown, not judged.** ASSUMED: there is no
  early-versus-late state and no 24-hour threshold in the schema. The Admin
  sees the cancellation time rendered relative to the Task's start ("released
  2 hours before"), which conveys everything a threshold would while leaving
  the judgement human. Hard-coding 24 hours would have to be migrated the
  first time it proves wrong for Ramadan.
- **A released Slot returns to the pool** and the Task becomes claimable
  again.

### Language

- ASSUMED: **UI chrome is translated into English, Arabic and French; Task
  content is written once** in whichever language the Admin chooses. Requiring
  three titles and three descriptions per Task means nine fields at 9pm on a
  Thursday, which in practice means two of them left blank and a French
  speaker shown an empty poster. Optional per-Task translations with fallback
  are the right next step and a cheap migration (nullable columns plus a
  fallback helper).
- **DECIDED:** language lives in the URL path, with **every** locale
  prefixed (`/en`, `/ar`, `/fr`) and the bare root redirecting to the
  remembered or detected one. The spec originally put English at the root;
  always-prefixing avoids a duplicate route tree for one special-cased locale,
  and the QR code still points at the root. A link is still shareable in a
  specific language and a per-language QR code is still possible.
- ASSUMED: **the browser's language preference is honoured on first visit
  only**, after which the Volunteer's explicit choice is remembered in a
  cookie. Auto-detection must never override a deliberate choice.
- ASSUMED: **the switcher is three plain text labels pinned in the header of
  every public page**, the current one marked. Not a dropdown and not a globe
  icon — a dropdown hides two of three languages behind a tap, which fails the
  "very obvious" requirement.
- ASSUMED: **the Admin view is English only.** It has one reader who reads
  English; translating it doubles the string count for no reach.
- **Arabic renders right to left**, which means direction-aware layout from
  the first commit rather than retrofitted. This costs nothing upfront and a
  great deal later.
- **All user-facing strings live in translation resources, never inline in
  markup**, including the English ones.

### Data retention

- ASSUMED: **Signups and their Outcomes are deleted six months after the
  Deadline of the Task they belong to.** Long enough to see a pattern, short
  enough that nothing lingers.
- **A Volunteer left with no Signups is deleted too.** Without this the phone
  numbers survive the purge and the retention policy is decorative.
- **Tasks are kept**, as a record of what the mosque has needed. They hold no
  personal data.
- Keeping Outcomes while dropping phone numbers was rejected: a reliability
  record that can no longer be attached to a person is noise.

### Admin access and stack

- ASSUMED: **one Admin, authenticated by a single shared password held in
  configuration**, exchanged for a session cookie. There is no users table and
  no record of which Admin recorded an Outcome, because there is one.
- ASSUMED: **server-rendered React (Next.js App Router), a managed Postgres,
  and a platform free tier.** Server rendering suits a QR-code entry point and
  three languages; the routing library handles the language path prefixes
  directly; Postgres gives the uniqueness and transactional guarantees the
  Slot defence depends on.
- **DECIDED:** the author remains the maintainer, so the server-rendered
  React stack above stands. Everything runs in Docker (a Node container and a
  Postgres container), because the development machine has no JavaScript
  runtime installed and we chose not to add one.
- A static frontend talking directly to a hosted database was rejected: an
  unauthenticated public form guarded only by row-level security is an easy
  way to leak the Signup table.

### Screens

Synthesised from the decisions above; this inventory was deferred during the
interview and is ASSUMED in full. The public list uses the **day-grouped
agenda** layout, chosen from three prototyped candidates. Eight screens:

1. Public Task list (the QR destination), with the language switcher.
2. Task detail with the signup form.
3. Signup confirmation, showing the Cancel Token link.
4. Cancellation page reached by that link.
5. Admin password entry.
6. Admin Task list, including past Tasks.
7. Admin Task create and edit form.
8. Admin Task detail: Signups, tappable numbers, Outcome marking.

ASSUMED: **a single QR code pointing at the root**, relying on first-visit
language detection, rather than one code per language.

## Testing Decisions

**What makes a good test here.** A test names something Khair promises a
Volunteer or an Admin, and would still pass if the implementation behind it
were rewritten. It goes through the core use cases against a real Postgres,
asserts on what comes back and on what the next use case can see, and never
reaches into a module's internals or asserts on the shape of a query. If a
test has to be rewritten because a function was renamed or a table split, it
was testing the code rather than the promise.

**The seam.** One: the core use-case boundary. Every operation is a
server-side function, and tests call those functions directly against a real
database with per-test isolation. Route handlers, pages and server actions
hold no rules and are therefore not separately tested — they translate HTTP to
a core call and back. Keeping this to one seam depends on that discipline: any
rule that leaks into a route handler becomes untestable at this seam and
should be pushed down into the core.

**Prior art.** None. This is a greenfield repo with no tests, so this spec
establishes the prior art rather than following it. Later specs should match
the pattern set here.

**What must be covered at this seam:**

- Publishing both Task shapes, and rejecting a Task with no Deadline.
- The public list: future Deadlines only, closed Tasks excluded, full Tasks
  present but marked covered, past Tasks absent.
- A successful Signup against a Task with free Slots.
- **Concurrent Signups for a single remaining Slot: exactly one succeeds.**
  Invoked as genuinely parallel calls, not sequentially.
- A second Signup by the same normalised phone on the same Task is rejected.
- Phone normalisation: the same number written locally and internationally
  resolves to one Volunteer, and that Volunteer's Signups accumulate under it.
- A changed name updates the Volunteer while leaving earlier Signups' name
  snapshots untouched.
- A Cancel Token releases its own Signup, frees the Slot, and stamps the
  cancellation time.
- A Cancel Token cannot reach any other Signup; an unknown or already-used
  token fails without revealing whether it ever existed.
- A new Signup can take a released Slot.
- Outcome defaults to `done` with no Admin action.
- The Admin can set `no_show` and change it back.
- The retention purge deletes Signups past the window, deletes Volunteers left
  with none, and leaves Tasks and in-window Signups alone.

**Deliberately not tested:** rendering, translation strings, RTL layout and
the language switcher. One browser-level RTL smoke test earns its place once
the Arabic pages exist; it is not part of v1's suite.

## Out of Scope

Cut from the original brief, deliberately, because each adds machinery without
serving the reason the app exists:

- **Trusted Volunteers and priority access to important Tasks**, including the
  24-to-48-hour early-access window. Revisit once months of real Outcomes show
  that no-shows are a problem worth mechanising.
- **Automatic pausing of repeat no-shows**, reversible or otherwise. The Admin
  has the record and can act as a human.
- **Points, leaderboards, badges and any public recognition.** Permanently out
  of scope, not deferred.
- **Volunteer-facing thank-you messages.** A confirmation screen is enough.
- **Automated reminders** by SMS, WhatsApp API or email. Tappable phone links
  in the Admin view give the Admin the same power with no provider, no cost
  and no scheduled delivery to debug. This is the first thing to add in v2 —
  well before any trusted tier, because a nudge the day before prevents the
  no-show that the Outcome record merely documents.
- **Notifying signed-up Volunteers when a Task is closed or edited.**
- **Volunteer accounts, passwords, logins and phone verification.**
- **Any screen that looks a Volunteer up by phone number.**
- **Recurring Tasks**, and Task duplication.
- **Per-Task translation of Admin-written content.**
- **Multiple Admins**, Admin roles, and any record of which Admin acted.
- **A Volunteer-facing history of their own past Signups.**

## Further Notes

Two decisions here meet the bar for an ADR — hard to reverse, surprising
without context, and the result of a genuine trade-off:

1. **Unverified phone numbers as Volunteer identity.** A future reader will
   ask why a system that records reliability never verifies who it is
   recording. The answer is a deliberate trade of data quality for signup
   friction, and reversing it means adding a verification step to the one flow
   that must stay frictionless.
2. **No public recognition of any kind.** A future contributor will very
   likely propose a leaderboard as an engagement win. The reason it is absent
   is religious, not technical: public credit for worship invites riya'. This
   needs writing down, or it will be re-litigated every time someone new
   arrives.

Neither has been written yet.

The riskiest piece of implementation is the Slot defence under concurrency;
the riskiest piece of *design* is phone-as-identity, which quietly determines
whether the Outcome record is worth anything at all. If the Admin reports that
histories look wrong or thin after a few months, suspect normalisation and
mistyped numbers before suspecting the Volunteers.

# Khair

A mosque volunteering app. A QR code on a poster opens a public list of open
work; anyone can claim a piece of it themselves, so no one has to be asked in
person and no one has to say no to a face.

## Language

### Work

**Task**:
A single piece of work the mosque needs doing, published for volunteers to
claim. One entity covers both scheduling shapes: a _fixed task_ has a start
time, a _flexible task_ has only a deadline.
_Avoid_: Job, shift, event, opportunity

**Deadline**:
The moment after which a Task is no longer useful. Every Task has one.
_Avoid_: Due date, expiry, cutoff

**Slot**:
One unit of the help a Task needs. A Task needing three helpers has three
Slots; when all are claimed the Task is full and accepts no more Signups.
_Avoid_: Spot, place, capacity, seat

**Open To**:
Who a Task is open to: anyone, the brothers, or the sisters. A fact about the
work and never about the person claiming it, so Khair holds no gender for any
Volunteer and asks for none. The pages state it; nothing enforces it.
_Avoid_: Gender, sex, restriction, eligibility, requirement

### People

**Volunteer**:
A person who claims Slots, recognised by phone number and identified to the
Admin by name. Holds no account, password or login.
_Avoid_: User, member, helper, congregant

**Admin**:
The person who publishes Tasks and records what happened. Reaches the admin
view with a single shared password. The only person who can see Outcomes.
_Avoid_: Organiser, manager, coordinator

### Claiming

**Signup**:
One Volunteer's claim on one Slot of one Task. The unit the Admin reviews and
the unit a Cancellation destroys.
_Avoid_: Booking, registration, application, RSVP

**Cancel Token**:
A secret in the link that lets a Volunteer undo one specific Signup without
logging in. Grants reach over that Signup alone and never over the Volunteer's
other Signups or history.
_Avoid_: Magic link, access token

**Outcome**:
The Admin's private record of how a Signup ended: `done`, `cancelled` or
`no_show`. Defaults to `done`, so the Admin only ever marks exceptions.
Never shown to Volunteers and never aggregated into a score, rank or badge.
_Avoid_: Status, rating, score, reliability, attendance

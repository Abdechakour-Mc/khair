-- The core Khair schema. The domain model was settled before any code was
-- written (see CONTEXT.md), so all three tables land together and later
-- tickets add behaviour rather than structure.

create extension if not exists "pgcrypto";

-- A single piece of work the mosque needs doing. One table covers both
-- scheduling shapes: starts_at present makes it a fixed Task, absent makes it
-- flexible. due_by is always required.
create table tasks (
  id            uuid primary key default gen_random_uuid(),
  title         text        not null check (length(btrim(title)) > 0),
  description   text        not null default '',
  location      text        not null default '',
  starts_at     timestamptz,
  due_by        timestamptz not null,
  slots_needed  integer     not null default 1 check (slots_needed >= 1),
  closed        boolean     not null default false,
  created_at    timestamptz not null default now(),

  -- A fixed Task that starts after its own Deadline is nonsense.
  constraint starts_before_deadline check (starts_at is null or starts_at <= due_by)
);

create index tasks_due_by_idx on tasks (due_by);

-- A person who claims Slots, recognised by phone number. Holds no account,
-- password or login. The phone number is stored in E.164 and is the identity
-- key, which is why the format is enforced here and not only in application
-- code.
create table volunteers (
  phone       text primary key check (phone ~ '^\+[1-9][0-9]{6,14}$'),
  name        text        not null check (length(btrim(name)) > 0),
  created_at  timestamptz not null default now()
);

-- One Volunteer's claim on one Slot of one Task. A live Signup is one with
-- cancelled_at still null; that is what consumes a Slot.
create table signups (
  id                uuid        primary key default gen_random_uuid(),
  task_id           uuid        not null references tasks (id) on delete cascade,
  volunteer_phone   text        not null references volunteers (phone) on delete cascade,
  -- What the Volunteer typed on the day. Kept separately from the Volunteer's
  -- current name so a shared household phone stays accurate per Signup.
  name_snapshot     text        not null check (length(btrim(name_snapshot)) > 0),
  -- The secret in the cancellation link. Reaches this Signup and nothing else.
  cancel_token      text        not null unique,
  outcome           text        not null default 'done'
                      check (outcome in ('done', 'cancelled', 'no_show')),
  cancelled_at      timestamptz,
  created_at        timestamptz not null default now(),

  -- Kills double submission, and stops one Volunteer quietly taking two Slots.
  constraint one_signup_per_task unique (task_id, volunteer_phone),

  -- 'cancelled' is the one Outcome a Volunteer sets, and it always carries its
  -- timestamp. The Admin sets only 'done' or 'no_show'.
  constraint cancelled_outcome_carries_timestamp
    check ((outcome = 'cancelled') = (cancelled_at is not null))
);

create index signups_task_id_idx on signups (task_id);
create index signups_volunteer_phone_idx on signups (volunteer_phone);

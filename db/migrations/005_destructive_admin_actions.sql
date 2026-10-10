-- The Admin can erase data on purpose, rather than only waiting for the
-- retention purge. The case that justifies this is a congregant asking what
-- the app knows about them and asking for it to be deleted: "it goes in six
-- months" is honest but is not an answer to that request.

-- Deleting a Task is reversible, so it is not confirmed. WCAG 2.2 success
-- criterion 3.3.4 accepts reversible OR checked OR confirmed, and the older
-- usability finding is that undo beats confirm: a dialog interrupts everyone
-- to prevent a rare mistake, while an undo lets the common case run and still
-- rescues the mistake. So the Task goes out of sight immediately and the
-- Signups wait with it, until the undo window passes and the purge finishes
-- the job for real.
alter table tasks add column deleted_at timestamptz;

-- Every query about live work filters on this, so it is worth an index.
create index tasks_deleted_at_idx on tasks (deleted_at) where deleted_at is not null;

-- What the Admin did, so a decision can be explained months later. Written
-- for moderation (ticket 10's pause and lift) and for the destructive actions
-- here.
--
-- `detail` never holds a phone number or a name, and that is a hard rule
-- rather than a convention: an audit row describing an erasure must not be
-- the one place the erased person survives. Counts and the kind of action are
-- enough to explain a decision, and they identify nobody.
create table admin_actions (
  id      uuid        primary key default gen_random_uuid(),
  action  text        not null check (length(btrim(action)) > 0),
  detail  text        not null default '',
  at      timestamptz not null default now()
);

create index admin_actions_at_idx on admin_actions (at desc);

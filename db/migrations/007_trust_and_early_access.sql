-- Trusted Volunteers, important Tasks, and the window between the two.
--
-- The Admin marks some work important, and the Volunteers they have come to
-- rely on see it first for a configured window after it is published. When
-- the window passes the Task appears to everybody with no Admin action: the
-- clock does it, so nothing waits on somebody remembering.
--
-- This is convenience and not a security boundary, and the schema cannot fix
-- that: identity here rests on an unverified phone number, so "only trusted
-- Volunteers can see it" means "only people who tell us a trusted number".
-- What that exposes is a Task that was about to be public anyway, holding
-- nothing personal, and a claim the Admin can undo. Nothing that matters may
-- rest on it.
--
-- Separate from `urgent`, which is the opposite instruction: urgent shows a
-- Task to everyone sooner and louder, important withholds it from most people
-- for a while. A Task can be both.

alter table volunteers add column trusted boolean not null default false;

alter table tasks add column important boolean not null default false;

-- Rows the demo seed created, so the whole synthetic set can be removed in
-- one statement before the app reaches the congregation.
--
-- Synthetic Volunteers are identifiable by their phone number alone, from the
-- +1 555 01xx block reserved for fiction. A Task has no phone number, so it
-- needs this: without it, clearing the demo data would leave fake work in the
-- mosque's own record of what it has needed.
alter table tasks add column demo boolean not null default false;

create index tasks_demo_idx on tasks (demo) where demo;

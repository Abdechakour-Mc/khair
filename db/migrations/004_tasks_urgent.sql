-- Work that cannot wait is pinned to the top of the public list.
--
-- The list is ordered by when work happens, which says nothing about what
-- matters, so three days of ordinary setup can bury the one thing that is
-- needed tomorrow.
--
-- Deliberately a boolean and not a priority scale. Three levels of priority
-- is a scale nobody calibrates the same way twice, and a flag that means
-- "this one, now" stays legible. Separate from the `important` flag that
-- ticket 09 adds for early access: that one withholds a Task from most
-- people for a window, and collapsing the two would mean the most pressing
-- work was the work fewest people could see.

alter table tasks
  add column urgent boolean not null default false;

-- The public list reads urgent Tasks first, then everything by when it
-- happens, and only ever among Tasks that are still open.
create index tasks_urgent_idx on tasks (urgent) where urgent;

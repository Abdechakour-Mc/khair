-- A Volunteer can say they have done the work, from the same page they would
-- use to release the Slot. It matters most on a flexible Task, where nothing
-- else tells the Admin whether the shoe rack actually got fixed: for a fixed
-- Task the Admin was usually there, for a flexible one they were not.
--
-- A column of its own, and deliberately NOT a write to `outcome`.
--
-- These are two different facts: "the Admin judged this done" and "the
-- Volunteer said they did it". `outcome` is the Admin's private record and
-- already defaults to 'done', so a Volunteer writing to it would change
-- nothing in the common case and would quietly overwrite the one field the
-- Admin owns. Keeping them apart is what lets the Admin's page show somebody
-- who said they came and whom the Admin marked absent, and that disagreement
-- is exactly what the Admin needs to see.
--
-- Never set by the Admin. Nothing in the Admin view writes this column.

alter table signups add column volunteer_done_at timestamptz;

-- Releasing a Slot exposed a defect in 001.
--
-- The constraint `one_signup_per_task` was unconditional, so a Volunteer who
-- released their Slot and then changed their mind was permanently barred from
-- that Task: the cancelled row still occupied the pair. The rule we actually
-- want is one LIVE Signup per Volunteer per Task, which is what kills double
-- submission without punishing anyone for cancelling honestly.
--
-- A partial unique index gives exactly that, and leaves the cancellation on
-- the record rather than overwriting it.

alter table signups drop constraint one_signup_per_task;

create unique index one_live_signup_per_task
  on signups (task_id, volunteer_phone)
  where cancelled_at is null;

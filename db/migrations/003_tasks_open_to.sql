-- Some work is for brothers, or for sisters: the sisters' entrance, the
-- sisters' section, washing of the deceased, supervising the girls' class.
--
-- This is a fact about the Task and never about the Volunteer. Khair holds no
-- gender for anybody, asks for none on the signup form, and has no such
-- column on `volunteers`. The Task says who it needs, the public pages say so
-- plainly, and claiming is on trust: identity here rests on an unverified
-- phone number, so filtering a list on a stored answer would buy the
-- appearance of a boundary and none of the substance.
--
-- `anyone` is the default, so every Task already published keeps its meaning
-- and the Admin only touches the field on the Tasks that need it.

alter table tasks
  add column open_to text not null default 'anyone'
    check (open_to in ('anyone', 'brothers', 'sisters'));

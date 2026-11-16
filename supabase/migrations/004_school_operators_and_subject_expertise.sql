-- School-scoped timetable workspace: two authorized operators per school.
-- Review and apply only after confirming the target Supabase project and backup.
begin;

alter table public.us_organization_users
  add column if not exists id uuid default gen_random_uuid();
update public.us_organization_users set id=gen_random_uuid() where id is null;
alter table public.us_organization_users alter column id set not null;
alter table public.us_organization_users drop constraint if exists us_organization_users_pkey;
alter table public.us_organization_users add constraint us_organization_users_pkey primary key(id);
alter table public.us_organization_users drop constraint if exists us_organization_users_role_check;
alter table public.us_organization_users add constraint us_organization_users_role_check
  check(role in ('owner','scheduler'));
-- Keep user_id unique: one login belongs to exactly one school, while a school
-- may now have two different users. organization_id must no longer be unique.
drop index if exists public.us_one_owner_per_org;
create index if not exists us_org_membership_by_org on public.us_organization_users(organization_id);
create index if not exists us_org_membership_by_user on public.us_organization_users(user_id);

create or replace function private.enforce_two_school_operators()
returns trigger language plpgsql
set search_path=''
as $$
declare operator_count integer;
begin
  perform pg_advisory_xact_lock(hashtextextended(new.organization_id::text,0));
  if tg_op='UPDATE' then
    if new.organization_id=old.organization_id and new.user_id=old.user_id then return new; end if;
    select count(*) into operator_count from public.us_organization_users
      where organization_id=new.organization_id and id<>old.id;
  else
    select count(*) into operator_count from public.us_organization_users
      where organization_id=new.organization_id;
  end if;
  if operator_count>=2 then
    raise exception 'A school can have only two authorized timetable operators' using errcode='23514';
  end if;
  return new;
end;
$$;
drop trigger if exists us_two_school_operators_limit on public.us_organization_users;
create trigger us_two_school_operators_limit
before insert or update of organization_id,user_id on public.us_organization_users
for each row execute function private.enforce_two_school_operators();

create table if not exists public.us_faculty_subjects(
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.us_organizations(id) on delete cascade,
  faculty_id uuid not null references public.us_faculty(id) on delete cascade,
  course_id uuid not null references public.us_courses(id) on delete cascade,
  expertise_type text not null default 'verified'
    check(expertise_type in ('verified','manual_related')),
  verified_by uuid references auth.users(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  unique(organization_id,faculty_id,course_id)
);
alter table public.us_faculty
  add column if not exists is_placeholder boolean not null default false,
  add column if not exists placeholder_course_id uuid references public.us_courses(id) on delete restrict,
  add column if not exists placeholder_sequence integer,
  add column if not exists staffing_status text not null default 'confirmed'
    check(staffing_status in ('confirmed','pending_recruitment','pending_confirmation'));
alter table public.us_faculty
  add constraint us_placeholder_fields_consistent check (
    (is_placeholder=false and placeholder_course_id is null and placeholder_sequence is null)
    or
    (is_placeholder=true and placeholder_course_id is not null and placeholder_sequence>0
      and staffing_status in ('pending_recruitment','pending_confirmation'))
  );
create unique index if not exists us_faculty_placeholder_subject_sequence
  on public.us_faculty(organization_id,placeholder_course_id,placeholder_sequence)
  where is_placeholder=true;

-- Prevent cross-school faculty/course references despite otherwise valid UUIDs.
create or replace function private.check_faculty_subject_school()
returns trigger language plpgsql set search_path=''
as $$
begin
  if not exists(select 1 from public.us_faculty f
    where f.id=new.faculty_id and f.organization_id=new.organization_id) then
    raise exception 'Faculty must belong to the same school workspace' using errcode='23514';
  end if;
  if not exists(select 1 from public.us_courses c
    where c.id=new.course_id and c.organization_id=new.organization_id) then
    raise exception 'Subject must belong to the same school workspace' using errcode='23514';
  end if;
  return new;
end;
$$;
drop trigger if exists us_faculty_subject_school_guard on public.us_faculty_subjects;
create trigger us_faculty_subject_school_guard before insert or update
on public.us_faculty_subjects for each row execute function private.check_faculty_subject_school();

create or replace function private.check_placeholder_subject_school()
returns trigger language plpgsql set search_path=''
as $$
begin
  if new.is_placeholder and not exists(select 1 from public.us_courses c
    where c.id=new.placeholder_course_id and c.organization_id=new.organization_id) then
    raise exception 'Placeholder subject must belong to the same school workspace' using errcode='23514';
  end if;
  return new;
end;
$$;
drop trigger if exists us_placeholder_subject_school_guard on public.us_faculty;
create trigger us_placeholder_subject_school_guard before insert or update
on public.us_faculty for each row execute function private.check_placeholder_subject_school();

alter table public.us_faculty_subjects enable row level security;
revoke all on table public.us_faculty_subjects from anon;
grant select,insert,update,delete on table public.us_faculty_subjects to authenticated;
drop policy if exists us_faculty_subjects_owner_policy on public.us_faculty_subjects;
create policy us_faculty_subjects_school_policy on public.us_faculty_subjects
for all to authenticated
using(organization_id=(select private.current_us_org()))
with check(organization_id=(select private.current_us_org()));

alter table public.us_schedule_entries
  add column if not exists assignment_type text not null default 'automatic'
    check(assignment_type in ('automatic','manual_related','placeholder'));

commit;

-- Verification: this query must return no rows after migration.
-- select organization_id,count(*) from public.us_organization_users
-- group by organization_id having count(*)>2;

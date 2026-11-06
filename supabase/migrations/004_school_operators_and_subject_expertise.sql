-- School-scoped timetable workspace: allow two authorized operators per school.
-- Each school is represented by one us_organizations row. Existing school data remains
-- in that organization; this migration does not move or expose data across schools.
-- Apply only after reviewing the target Supabase project and taking a backup.

begin;

-- Replace the old one-membership-per-school primary key with a membership row key.
alter table public.us_organization_users
  drop constraint if exists us_organization_users_pkey;
alter table public.us_organization_users
  add column if not exists id uuid default gen_random_uuid();
update public.us_organization_users set id=gen_random_uuid() where id is null;
alter table public.us_organization_users alter column id set not null;
alter table public.us_organization_users
  add constraint us_organization_users_pkey primary key (id);

-- A user belongs to one school only; a school may have two authorized operators.
alter table public.us_organization_users
  drop constraint if exists us_organization_users_organization_id_key;
alter table public.us_organization_users
  drop constraint if exists us_organization_users_role_check;
alter table public.us_organization_users
  add constraint us_organization_users_org_user_key unique (organization_id,user_id);
alter table public.us_organization_users
  add constraint us_organization_users_role_check
  check (role in ('owner','scheduler'));

drop index if exists public.us_one_owner_per_org;
create index if not exists us_org_membership_by_org
  on public.us_organization_users(organization_id);

-- Enforce the product limit in the database, not only in the UI.
create or replace function private.enforce_two_school_operators()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
declare
  operator_count integer;
begin
  if tg_op='UPDATE'
     and new.organization_id=old.organization_id
     and new.user_id=old.user_id then
    return new;
  end if;

  perform pg_advisory_xact_lock(hashtextextended(new.organization_id::text,0));
  select count(*) into operator_count
  from public.us_organization_users
  where organization_id=new.organization_id
    and (tg_op <> 'UPDATE' or id <> old.id);

  if operator_count >= 2 then
    raise exception 'A school can have only two authorized timetable operators'
      using errcode='23514';
  end if;
  return new;
end;
$$;

drop trigger if exists us_two_school_operators_limit on public.us_organization_users;
create trigger us_two_school_operators_limit
before insert or update of organization_id,user_id
on public.us_organization_users
for each row execute function private.enforce_two_school_operators();

-- Explicit subject expertise. Automatic allocation must use verified mappings only.
create table if not exists public.us_faculty_subjects(
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.us_organizations(id) on delete cascade,
  faculty_id uuid not null references public.us_faculty(id) on delete cascade,
  course_id uuid not null references public.us_courses(id) on delete cascade,
  expertise_type text not null default 'verified'
    check (expertise_type in ('verified','manual_related')),
  verified_by uuid references auth.users(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  unique (organization_id,faculty_id,course_id)
);

-- A shortage placeholder is explicitly not a real/verified faculty member.
alter table public.us_faculty
  add column if not exists is_placeholder boolean not null default false,
  add column if not exists placeholder_course_id uuid references public.us_courses(id) on delete restrict,
  add column if not exists placeholder_sequence integer,
  add column if not exists staffing_status text not null default 'confirmed'
    check (staffing_status in ('confirmed','pending_recruitment','pending_confirmation'));

create unique index if not exists us_faculty_placeholder_subject_sequence
  on public.us_faculty(organization_id,placeholder_course_id,placeholder_sequence)
  where is_placeholder=true;

alter table public.us_schedule_entries
  add column if not exists assignment_type text not null default 'automatic'
    check (assignment_type in ('automatic','manual_related','placeholder'));

alter table public.us_faculty_subjects enable row level security;
revoke all on table public.us_faculty_subjects from anon;
grant select,insert,update,delete on table public.us_faculty_subjects to authenticated;
drop policy if exists us_faculty_subjects_owner_policy on public.us_faculty_subjects;
create policy us_faculty_subjects_owner_policy on public.us_faculty_subjects
for all to authenticated
using (organization_id=(select private.current_us_org()))
with check (organization_id=(select private.current_us_org()));

commit;

-- Post-migration verification:
-- select organization_id,count(*) from public.us_organization_users
-- group by organization_id having count(*) > 2;
-- Expected: zero rows.

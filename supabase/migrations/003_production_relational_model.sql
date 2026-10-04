-- UniSchedule production relational model
-- One authorized application user per organization.
-- Faculty and students are data records only.
-- Apply with the Supabase CLI/migrations workflow on an ACTIVE project.

create schema if not exists private;

create table if not exists public.us_platform_admins(
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.us_organizations(
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  school text,
  timezone text not null default 'Asia/Kolkata',
  status text not null default 'Active' check(status in ('Active','Suspended')),
  owner_user_id uuid unique references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.us_organization_users(
  organization_id uuid primary key references public.us_organizations(id) on delete cascade,
  user_id uuid not null unique references auth.users(id) on delete cascade,
  role text not null default 'owner' check(role='owner'),
  created_at timestamptz not null default now()
);

create table if not exists public.us_academic_years(
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.us_organizations(id) on delete cascade,
  name text not null, active boolean not null default false, created_at timestamptz not null default now()
);
create table if not exists public.us_semesters(
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.us_organizations(id) on delete cascade,
  academic_year_id uuid references public.us_academic_years(id) on delete set null, name text not null, number int, active boolean not null default false
);
create table if not exists public.us_departments(
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.us_organizations(id) on delete cascade,
  name text not null, code text not null
);
create table if not exists public.us_programs(
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.us_organizations(id) on delete cascade,
  department_id uuid references public.us_departments(id) on delete set null, name text not null
);
create table if not exists public.us_sections(
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.us_organizations(id) on delete cascade,
  department_id uuid references public.us_departments(id) on delete set null, program_id uuid references public.us_programs(id) on delete set null,
  semester_id uuid references public.us_semesters(id) on delete set null, name text not null, code text not null, strength int not null default 0
);
create table if not exists public.us_classes(
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.us_organizations(id) on delete cascade,
  section_id uuid references public.us_sections(id) on delete set null, program_id uuid references public.us_programs(id) on delete set null,
  semester_id uuid references public.us_semesters(id) on delete set null, name text not null, strength int not null default 0, incharge text
);
create table if not exists public.us_faculty(
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.us_organizations(id) on delete cascade,
  department_id uuid references public.us_departments(id) on delete set null, name text not null, designation text, max_day_hours int, max_week_hours int
);
create table if not exists public.us_rooms(
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.us_organizations(id) on delete cascade,
  name text not null, code text not null, type text not null default 'Classroom', capacity int not null default 0,
  building text, floor int, features jsonb not null default '[]'::jsonb, is_lab boolean not null default false
);
create table if not exists public.us_courses(
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.us_organizations(id) on delete cascade,
  code text not null, name text not null, type text not null default 'Theory', credits numeric not null default 0,
  lecture_hours int not null default 0, tutorial_hours int not null default 0, practical_hours int not null default 0,
  faculty_id uuid references public.us_faculty(id) on delete set null, room_id uuid references public.us_rooms(id) on delete set null,
  session_pattern text, lab boolean not null default false
);
create table if not exists public.us_course_classes(
  organization_id uuid not null references public.us_organizations(id) on delete cascade,
  course_id uuid not null references public.us_courses(id) on delete cascade,
  class_id uuid not null references public.us_classes(id) on delete cascade,
  primary key(course_id,class_id)
);
create table if not exists public.us_faculty_availability(
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.us_organizations(id) on delete cascade,
  faculty_id uuid not null references public.us_faculty(id) on delete cascade, day text not null, period int not null, blocked boolean not null default true
);
create table if not exists public.us_room_blocks(
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.us_organizations(id) on delete cascade,
  room_id uuid not null references public.us_rooms(id) on delete cascade, day text not null, period int not null
);
create table if not exists public.us_class_blocks(
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.us_organizations(id) on delete cascade,
  class_id uuid not null references public.us_classes(id) on delete cascade, day text not null, period int not null
);
create table if not exists public.us_calendar_settings(
  organization_id uuid primary key references public.us_organizations(id) on delete cascade,
  days jsonb not null default '["MON","TUE","WED","THU","FRI"]'::jsonb,
  periods int not null default 8, start_time time not null default '09:00', duration_minutes int not null default 50,
  short_breaks jsonb not null default '[2]'::jsonb, lunch_breaks jsonb not null default '[5]'::jsonb
);
create table if not exists public.us_combined_groups(
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.us_organizations(id) on delete cascade,
  name text not null, class_ids jsonb not null default '[]'::jsonb, room_id uuid references public.us_rooms(id) on delete set null
);
create table if not exists public.us_elective_groups(
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.us_organizations(id) on delete cascade,
  name text not null, class_ids jsonb not null default '[]'::jsonb, course_ids jsonb not null default '[]'::jsonb
);
create table if not exists public.us_timetable_versions(
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.us_organizations(id) on delete cascade,
  name text not null, status text not null default 'Draft' check(status in ('Draft','Validated','Published','Archived')),
  score numeric, note text, snapshot jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);
create table if not exists public.us_schedule_entries(
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.us_organizations(id) on delete cascade,
  version_id uuid references public.us_timetable_versions(id) on delete cascade, class_id uuid not null references public.us_classes(id) on delete cascade,
  course_id uuid not null references public.us_courses(id) on delete cascade, faculty_id uuid references public.us_faculty(id) on delete set null,
  room_id uuid references public.us_rooms(id) on delete set null, day text not null, period int not null,
  duration int not null default 1, locked boolean not null default false
);
create table if not exists public.us_share_snapshots(
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.us_organizations(id) on delete cascade,
  token text not null unique, version_id uuid not null references public.us_timetable_versions(id) on delete cascade,
  scope text not null default 'university', snapshot jsonb not null, active boolean not null default true,
  expires_at timestamptz, created_at timestamptz not null default now()
);
create table if not exists public.us_audit_logs(
  id bigint generated always as identity primary key, organization_id uuid not null references public.us_organizations(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null, action text not null, details jsonb, created_at timestamptz not null default now()
);

create unique index if not exists us_one_owner_per_org on public.us_organization_users(organization_id);
create index if not exists us_org_user_lookup on public.us_organization_users(user_id);
create index if not exists us_org_columns_schedule on public.us_schedule_entries(organization_id,day,period);
create index if not exists us_org_course_classes on public.us_course_classes(organization_id,class_id);

create or replace function private.current_us_org()
returns uuid
language sql stable security definer
set search_path=''
as $$
  select organization_id from public.us_organization_users
  where user_id=(select auth.uid())
  limit 1
$$;
revoke all on function private.current_us_org() from public;
grant usage on schema private to authenticated;
grant execute on function private.current_us_org() to authenticated;

do $$
declare t text;
begin
  foreach t in array array['us_academic_years','us_semesters','us_departments','us_programs','us_sections','us_classes','us_faculty','us_rooms','us_courses','us_course_classes','us_faculty_availability','us_room_blocks','us_class_blocks','us_calendar_settings','us_combined_groups','us_elective_groups','us_timetable_versions','us_schedule_entries','us_share_snapshots','us_audit_logs']
  loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on table public.%I from anon',t);
    execute format('grant select,insert,update,delete on table public.%I to authenticated',t);
    execute format('create policy %I on public.%I for all to authenticated using (organization_id=(select private.current_us_org())) with check (organization_id=(select private.current_us_org()))',t||'_owner_policy',t);
  end loop;
end $$;

alter table public.us_share_snapshots enable row level security;
revoke all on table public.us_share_snapshots from anon;
grant select on table public.us_share_snapshots to anon;
create policy "public active shared snapshots" on public.us_share_snapshots
for select to anon using (active=true and (expires_at is null or expires_at>now()));

alter table public.us_organizations enable row level security;
revoke all on table public.us_organizations from anon;
grant select,update on table public.us_organizations to authenticated;
create policy "owner organization access" on public.us_organizations
for select to authenticated using (id=(select private.current_us_org()));
create policy "owner organization update" on public.us_organizations
for update to authenticated using (id=(select private.current_us_org())) with check (id=(select private.current_us_org()));

alter table public.us_organization_users enable row level security;
revoke all on table public.us_organization_users from anon;
grant select on table public.us_organization_users to authenticated;
create policy "owner membership access" on public.us_organization_users
for select to authenticated using (user_id=(select auth.uid()));

alter table public.us_platform_admins enable row level security;
revoke all on table public.us_platform_admins from anon;
grant select on table public.us_platform_admins to authenticated;
create policy "platform admin self" on public.us_platform_admins
for select to authenticated using (user_id=(select auth.uid()));

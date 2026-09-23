-- UniSchedule SaaS multi-tenant schema
-- Supabase/Postgres. Run in SQL Editor, then configure Auth.
create extension if not exists pgcrypto;

create type public.member_role as enum ('owner','admin','scheduler','faculty','viewer');
create type public.booking_status as enum ('pending','confirmed','cancelled');
create type public.substitution_status as enum ('open','assigned','cancelled');

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  plan text not null default 'trial',
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  created_at timestamptz not null default now()
);

create table if not exists public.organization_members (
  organization_id uuid references public.organizations(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role public.member_role not null default 'viewer',
  created_at timestamptz not null default now(),
  primary key (organization_id,user_id)
);

create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  code text not null,
  unique (organization_id,code)
);

create table if not exists public.sections (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  department_id uuid references public.departments(id) on delete set null,
  name text not null,
  code text not null,
  unique (organization_id,code)
);

create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  department_id uuid references public.departments(id) on delete set null,
  section_id uuid references public.sections(id) on delete set null,
  name text not null,
  room_id uuid,
  incharge_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.faculty (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  department_id uuid references public.departments(id) on delete set null,
  name text not null,
  email text,
  active boolean not null default true
);

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  code text,
  type text not null default 'Classroom',
  capacity integer not null default 0,
  building text,
  active boolean not null default true
);

do $
begin
  if not exists (select 1 from pg_constraint where conname='classes_room_fk') then
    alter table public.classes add constraint classes_room_fk foreign key (room_id) references public.rooms(id) on delete set null;
  end if;
  if not exists (select 1 from pg_constraint where conname='classes_incharge_fk') then
    alter table public.classes add constraint classes_incharge_fk foreign key (incharge_id) references public.faculty(id) on delete set null;
  end if;
end $;

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  code text not null,
  name text not null,
  lectures integer not null default 0,
  tutorials integer not null default 0,
  practicals integer not null default 0,
  credits numeric(4,1) not null default 0,
  default_faculty_id uuid references public.faculty(id) on delete set null,
  default_room_id uuid references public.rooms(id) on delete set null,
  unique (organization_id,code)
);

create table if not exists public.calendar_settings (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  academic_year text not null default '2025-26',
  working_days text[] not null default array['MON','TUE','WED','THU','FRI'],
  period_count integer not null default 8,
  start_time time not null default '09:00',
  period_minutes integer not null default 50,
  short_break_period integer,
  lunch_break_period integer
);

create table if not exists public.schedule_entries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  faculty_id uuid references public.faculty(id) on delete set null,
  room_id uuid references public.rooms(id) on delete set null,
  day text not null,
  period integer not null,
  locked boolean not null default false,
  created_at timestamptz not null default now(),
  unique (organization_id,class_id,day,period),
  unique (organization_id,faculty_id,day,period),
  unique (organization_id,room_id,day,period)
);

create table if not exists public.faculty_availability (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  faculty_id uuid not null references public.faculty(id) on delete cascade,
  day text not null,
  period integer not null,
  available boolean not null default false,
  unique (organization_id,faculty_id,day,period)
);

create table if not exists public.room_bookings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  room_id uuid not null references public.rooms(id) on delete cascade,
  day text not null,
  period integer not null,
  title text not null,
  requested_by uuid references auth.users(id) on delete set null,
  status public.booking_status not null default 'confirmed',
  created_at timestamptz not null default now()
);

create table if not exists public.substitutions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  class_id uuid references public.classes(id) on delete set null,
  course_id uuid references public.courses(id) on delete set null,
  day text not null,
  period integer not null,
  absent_faculty_id uuid references public.faculty(id) on delete set null,
  substitute_faculty_id uuid references public.faculty(id) on delete set null,
  status public.substitution_status not null default 'open',
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id bigint generated always as identity primary key,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  message text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  class_id uuid references public.classes(id) on delete set null,
  course_id uuid references public.courses(id) on delete set null,
  faculty_id uuid references public.faculty(id) on delete set null,
  attendance_date date not null,
  period integer not null,
  present integer not null default 0 check (present >= 0),
  total integer not null default 0 check (total >= 0 and present <= total),
  created_at timestamptz not null default now(),
  unique (organization_id,class_id,course_id,attendance_date,period)
);

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  message text not null,
  audience text not null default 'Everyone',
  published_by uuid references auth.users(id) on delete set null,
  published_at timestamptz not null default now(),
  archived_at timestamptz
);

create table if not exists public.timetable_versions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  note text,
  snapshot jsonb not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_members_user on public.organization_members(user_id);
create index if not exists idx_classes_org on public.classes(organization_id);
create index if not exists idx_faculty_org on public.faculty(organization_id);
create index if not exists idx_courses_org on public.courses(organization_id);
create index if not exists idx_rooms_org on public.rooms(organization_id);
create index if not exists idx_schedule_org on public.schedule_entries(organization_id);
create index if not exists idx_audit_org on public.audit_logs(organization_id,created_at desc);
create index if not exists idx_attendance_org on public.attendance_records(organization_id,attendance_date desc);
create index if not exists idx_announcements_org on public.announcements(organization_id,published_at desc);
create index if not exists idx_versions_org on public.timetable_versions(organization_id,created_at desc);

create or replace function public.is_org_member(target_org uuid)
returns boolean language sql stable security definer set search_path=public as $$
  select exists(
    select 1 from public.organization_members
    where organization_id=target_org and user_id=auth.uid()
  );
$$;

create or replace function public.has_org_role(target_org uuid, allowed public.member_role[])
returns boolean language sql stable security definer set search_path=public as $$
  select exists(
    select 1 from public.organization_members
    where organization_id=target_org and user_id=auth.uid() and role=any(allowed)
  );
$$;

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.organization_members enable row level security;
alter table public.departments enable row level security;
alter table public.sections enable row level security;
alter table public.classes enable row level security;
alter table public.faculty enable row level security;
alter table public.rooms enable row level security;
alter table public.courses enable row level security;
alter table public.calendar_settings enable row level security;
alter table public.schedule_entries enable row level security;
alter table public.faculty_availability enable row level security;
alter table public.room_bookings enable row level security;
alter table public.substitutions enable row level security;
alter table public.audit_logs enable row level security;
alter table public.notifications enable row level security;
alter table public.attendance_records enable row level security;
alter table public.announcements enable row level security;
alter table public.timetable_versions enable row level security;

create policy "org members can read organizations" on public.organizations for select to authenticated using (public.is_org_member(id));
create policy "users manage own profile" on public.profiles for all to authenticated using (id=auth.uid()) with check (id=auth.uid());
create policy "members read membership" on public.organization_members for select to authenticated using (user_id=auth.uid() or public.has_org_role(organization_id,array['owner','admin']::public.member_role[]));

create policy "org data read" on public.departments for select to authenticated using (public.is_org_member(organization_id));
create policy "org data write" on public.departments for all to authenticated using (public.has_org_role(organization_id,array['owner','admin','scheduler']::public.member_role[])) with check (public.has_org_role(organization_id,array['owner','admin','scheduler']::public.member_role[]));
create policy "org data read sections" on public.sections for select to authenticated using (public.is_org_member(organization_id));
create policy "org data write sections" on public.sections for all to authenticated using (public.has_org_role(organization_id,array['owner','admin','scheduler']::public.member_role[])) with check (public.has_org_role(organization_id,array['owner','admin','scheduler']::public.member_role[]));
create policy "org data read classes" on public.classes for select to authenticated using (public.is_org_member(organization_id));
create policy "org data write classes" on public.classes for all to authenticated using (public.has_org_role(organization_id,array['owner','admin','scheduler']::public.member_role[])) with check (public.has_org_role(organization_id,array['owner','admin','scheduler']::public.member_role[]));
create policy "org data read faculty" on public.faculty for select to authenticated using (public.is_org_member(organization_id));
create policy "org data write faculty" on public.faculty for all to authenticated using (public.has_org_role(organization_id,array['owner','admin','scheduler']::public.member_role[])) with check (public.has_org_role(organization_id,array['owner','admin','scheduler']::public.member_role[]));
create policy "org data read rooms" on public.rooms for select to authenticated using (public.is_org_member(organization_id));
create policy "org data write rooms" on public.rooms for all to authenticated using (public.has_org_role(organization_id,array['owner','admin','scheduler']::public.member_role[])) with check (public.has_org_role(organization_id,array['owner','admin','scheduler']::public.member_role[]));
create policy "org data read courses" on public.courses for select to authenticated using (public.is_org_member(organization_id));
create policy "org data write courses" on public.courses for all to authenticated using (public.has_org_role(organization_id,array['owner','admin','scheduler']::public.member_role[])) with check (public.has_org_role(organization_id,array['owner','admin','scheduler']::public.member_role[]));
create policy "org data read calendar" on public.calendar_settings for select to authenticated using (public.is_org_member(organization_id));
create policy "org data write calendar" on public.calendar_settings for all to authenticated using (public.has_org_role(organization_id,array['owner','admin','scheduler']::public.member_role[])) with check (public.has_org_role(organization_id,array['owner','admin','scheduler']::public.member_role[]));
create policy "org data read schedule" on public.schedule_entries for select to authenticated using (public.is_org_member(organization_id));
create policy "org data write schedule" on public.schedule_entries for all to authenticated using (public.has_org_role(organization_id,array['owner','admin','scheduler']::public.member_role[])) with check (public.has_org_role(organization_id,array['owner','admin','scheduler']::public.member_role[]));
create policy "org data read availability" on public.faculty_availability for select to authenticated using (public.is_org_member(organization_id));
create policy "org data write availability" on public.faculty_availability for all to authenticated using (public.has_org_role(organization_id,array['owner','admin','scheduler']::public.member_role[])) with check (public.has_org_role(organization_id,array['owner','admin','scheduler']::public.member_role[]));
create policy "org data read bookings" on public.room_bookings for select to authenticated using (public.is_org_member(organization_id));
create policy "org data write bookings" on public.room_bookings for all to authenticated using (public.has_org_role(organization_id,array['owner','admin','scheduler']::public.member_role[])) with check (public.has_org_role(organization_id,array['owner','admin','scheduler']::public.member_role[]));
create policy "org data read substitutions" on public.substitutions for select to authenticated using (public.is_org_member(organization_id));
create policy "org data write substitutions" on public.substitutions for all to authenticated using (public.has_org_role(organization_id,array['owner','admin','scheduler']::public.member_role[])) with check (public.has_org_role(organization_id,array['owner','admin','scheduler']::public.member_role[]));
create policy "org data read audit" on public.audit_logs for select to authenticated using (public.is_org_member(organization_id));
create policy "org data insert audit" on public.audit_logs for insert to authenticated with check (public.is_org_member(organization_id) and actor_id=auth.uid());
create policy "users read own notifications" on public.notifications for select to authenticated using (user_id=auth.uid() and public.is_org_member(organization_id));
create policy "users update own notifications" on public.notifications for update to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());

create policy "org data read attendance" on public.attendance_records for select to authenticated using (public.is_org_member(organization_id));
create policy "org data write attendance" on public.attendance_records for all to authenticated using (public.has_org_role(organization_id,array['owner','admin','scheduler','faculty']::public.member_role[])) with check (public.has_org_role(organization_id,array['owner','admin','scheduler','faculty']::public.member_role[]));
create policy "org data read announcements" on public.announcements for select to authenticated using (public.is_org_member(organization_id));
create policy "org data write announcements" on public.announcements for all to authenticated using (public.has_org_role(organization_id,array['owner','admin']::public.member_role[])) with check (public.has_org_role(organization_id,array['owner','admin']::public.member_role[]));
create policy "org data read versions" on public.timetable_versions for select to authenticated using (public.is_org_member(organization_id));
create policy "org data write versions" on public.timetable_versions for all to authenticated using (public.has_org_role(organization_id,array['owner','admin','scheduler']::public.member_role[])) with check (public.has_org_role(organization_id,array['owner','admin','scheduler']::public.member_role[]));

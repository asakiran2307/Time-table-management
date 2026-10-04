-- UniSchedule production access model
-- Single authorized application user per university.
-- Faculty/students remain timetable data only and never become application users.

create unique index if not exists uq_one_application_user_per_org
  on public.organization_members(organization_id);

update public.organization_members set role='owner' where role <> 'owner';
alter table public.organization_members drop constraint if exists organization_members_owner_only;
alter table public.organization_members add constraint organization_members_owner_only check (role='owner');

alter table public.organizations add column if not exists owner_user_id uuid references auth.users(id) on delete set null;
create unique index if not exists uq_organization_owner_user on public.organizations(owner_user_id) where owner_user_id is not null;

create or replace function public.is_org_owner(target_org uuid)
returns boolean language sql stable security definer set search_path=public
as $$
  select exists (select 1 from public.organization_members where organization_id=target_org and user_id=(select auth.uid()) and role='owner');
$$;

DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT policyname, tablename FROM pg_policies WHERE schemaname='public'
    AND tablename IN ('departments','sections','classes','faculty','rooms','courses','calendar_settings','schedule_entries','faculty_availability','room_bookings','substitutions','audit_logs','notifications','attendance_records','announcements','timetable_versions')
    AND (policyname LIKE 'org data write%' OR policyname LIKE 'users update%')
  LOOP EXECUTE format('drop policy if exists %I on public.%I', r.policyname, r.tablename); END LOOP;
END $$;

create policy "owner writes departments" on public.departments for all to authenticated using (public.is_org_owner(organization_id)) with check (public.is_org_owner(organization_id));
create policy "owner writes sections" on public.sections for all to authenticated using (public.is_org_owner(organization_id)) with check (public.is_org_owner(organization_id));
create policy "owner writes classes" on public.classes for all to authenticated using (public.is_org_owner(organization_id)) with check (public.is_org_owner(organization_id));
create policy "owner writes faculty" on public.faculty for all to authenticated using (public.is_org_owner(organization_id)) with check (public.is_org_owner(organization_id));
create policy "owner writes rooms" on public.rooms for all to authenticated using (public.is_org_owner(organization_id)) with check (public.is_org_owner(organization_id));
create policy "owner writes courses" on public.courses for all to authenticated using (public.is_org_owner(organization_id)) with check (public.is_org_owner(organization_id));
create policy "owner writes calendar" on public.calendar_settings for all to authenticated using (public.is_org_owner(organization_id)) with check (public.is_org_owner(organization_id));
create policy "owner writes schedule" on public.schedule_entries for all to authenticated using (public.is_org_owner(organization_id)) with check (public.is_org_owner(organization_id));
create policy "owner writes availability" on public.faculty_availability for all to authenticated using (public.is_org_owner(organization_id)) with check (public.is_org_owner(organization_id));
create policy "owner writes bookings" on public.room_bookings for all to authenticated using (public.is_org_owner(organization_id)) with check (public.is_org_owner(organization_id));
create policy "owner writes substitutions" on public.substitutions for all to authenticated using (public.is_org_owner(organization_id)) with check (public.is_org_owner(organization_id));
create policy "owner writes audit" on public.audit_logs for insert to authenticated with check (public.is_org_owner(organization_id) and actor_id=(select auth.uid()));
create policy "owner writes attendance" on public.attendance_records for all to authenticated using (public.is_org_owner(organization_id)) with check (public.is_org_owner(organization_id));
create policy "owner writes announcements" on public.announcements for all to authenticated using (public.is_org_owner(organization_id)) with check (public.is_org_owner(organization_id));
create policy "owner writes versions" on public.timetable_versions for all to authenticated using (public.is_org_owner(organization_id)) with check (public.is_org_owner(organization_id));
create policy "owner updates notifications" on public.notifications for update to authenticated using (public.is_org_owner(organization_id) and user_id=(select auth.uid())) with check (public.is_org_owner(organization_id) and user_id=(select auth.uid()));

-- Public sharing must use a separate published-snapshot/share-token model.
-- A share link must never become an edit credential.

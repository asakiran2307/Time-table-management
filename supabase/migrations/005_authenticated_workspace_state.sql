-- Authenticated JSON workspace persistence for the existing timetable UI.
-- RLS derives the school from the signed-in user's membership, never from client input.
begin;
create table if not exists public.us_workspace_state(
  organization_id uuid primary key references public.us_organizations(id) on delete cascade,
  data jsonb not null,
  updated_by uuid not null references auth.users(id),
  updated_at timestamptz not null default now()
);
alter table public.us_workspace_state enable row level security;
revoke all on table public.us_workspace_state from anon;
grant select,insert,update on table public.us_workspace_state to authenticated;
drop policy if exists us_workspace_state_school_policy on public.us_workspace_state;
create policy us_workspace_state_school_policy on public.us_workspace_state
for all to authenticated
using(organization_id=(select private.current_us_org()))
with check(organization_id=(select private.current_us_org()));
commit;

# Authentication setup

## Access model

UniSchedule has exactly two application account types:

1. **MASTER_ADMIN** — platform-level user. Can create, activate and suspend university organizations and provision exactly one university owner account for each organization.
2. **UNIVERSITY_OWNER** — exactly one user per university. Can manage the timetable, generate/validate/publish it, export it and create view-only shares.

Faculty and students are never application users.

## Supabase configuration

The Vercel deployment needs these environment variables:

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` — server-side only; never expose this in frontend code.

The browser receives only the URL and publishable key through `/api/auth-config`. The service-role key is used only by the Master Admin server endpoint.

Supabase's JavaScript client uses `signInWithPassword({ email, password })` for password login, and browser sessions can be persisted automatically. citeturn435242search0turn435242search1

## Bootstrap the first Master Admin

1. Create the first user under Supabase Authentication → Users.
2. Copy that user's UUID.
3. On the active database, insert the UUID into `public.us_platform_admins`.
4. Give that account the Master Admin login email/password.
5. Do not expose the service-role key to the browser.

The repository's `003_production_relational_model.sql` creates the platform-admin table, organization table and one-owner membership model.

## University provisioning

From `master.html`, the Master Admin enters:

- University name
- University code
- School / unit
- Timezone
- Owner email
- Owner password

The server creates the Auth user, creates the organization, links the owner to that organization, and creates default calendar settings. The owner can then sign in at `login.html` under **University Login**.

## Security boundary

The university owner is authorized by relational membership and organization status. Do not use user-editable metadata for authorization. Supabase's current security guidance recommends row-level policies that combine the authenticated identity with an ownership predicate. citeturn435242search1

## Current limitation

The connected Supabase project in this workspace is inactive, so live login credentials cannot be tested or bootstrapped here. The GitHub/Vercel application code is prepared for an active Supabase project.

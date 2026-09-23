# UniSchedule SaaS Architecture

## Research basis

The product direction is based on current timetable platforms and current Vercel/Supabase patterns.

- Untis/WebUntis documents guided master-data entry for school year, subjects, classes, teachers, rooms and availability; weighted automatic generation; manual editing; diagnosis/conflict checking; room/resource booking; substitution planning; digital class register; messaging; and mobile timetable access. https://www.untis.at/en/products/untis-timetable-scheduling and https://www.untis.at/en/products/webuntis
- TimeTabler documents interactive, semi-automatic and fully automatic scheduling, self-checking against teacher/room conflicts, flexible constraints, and support for large timetable datasets. https://www.timetabler.com/timetabler/
- Vercel's current SaaS starter pattern uses Next.js, Postgres, authentication, RBAC, subscriptions and activity logging. https://vercel.com/templates/next.js/next-js-saas-starter
- Supabase currently recommends Next.js with cookie-based Auth, Postgres and Row Level Security; RLS should protect every exposed table and service-role secrets must remain server-side. https://supabase.com/docs/guides/getting-started/quickstarts/nextjs

## Product

UniSchedule is being evolved from a browser-only timetable editor into a university scheduling SaaS.

### Core modules

1. Dashboard
2. Master Setup
3. Timetable Builder
4. Faculty Availability
5. Room & Resource Booking
6. Substitution Planning
7. Classes
8. Faculty
9. Courses
10. Rooms & Labs
11. Departments & Sections
12. Users & Roles
13. Activity/Audit Log
14. Export Centre
15. Settings

### Scheduling hard constraints

- One class cannot have two sessions in one period.
- One faculty member cannot teach two sessions in one period.
- One room cannot host two sessions in one period.
- Configured break/lunch periods are blocked.
- Practical/lab requirements can be placed as consecutive units.
- Faculty availability blocks are respected by automatic generation.
- Room bookings are checked before confirmation.
- Substitution assignment checks substitute availability.

### Production SaaS architecture

Frontend:
- Next.js App Router
- TypeScript
- Tailwind/shadcn-style component system

Backend:
- Supabase Auth
- Supabase Postgres
- Row Level Security
- Supabase Realtime for live timetable changes
- Edge Functions for privileged workflows

Deployment:
- Vercel for the web application
- Supabase for database/auth/storage/realtime

Optional commercial layer:
- Stripe Checkout + Customer Portal + webhooks for subscriptions, following the current Vercel SaaS starter pattern.

### Multi-tenancy

Every business table has organization_id.

Roles:
- Owner
- Admin
- Scheduler
- Faculty
- Viewer

The supplied supabase/schema.sql enables RLS and scopes access through organization membership. This is the required production boundary; do not remove RLS from exposed tables.

### Current implementation state

The live repository currently runs without a backend and stores the demo workspace in browser LocalStorage. The new operational modules are functional in that mode so the UI can be tested immediately:

- Master CRUD
- timetable generation/editing
- faculty availability
- room booking
- substitutions
- users/roles
- activity log
- exports
- settings

The Supabase schema is the production persistence foundation. Connecting the UI to Supabase requires environment variables and authentication setup; it should not be simulated by putting database service keys in browser code.

## Recommended production rollout

1. Create Supabase project.
2. Run supabase/schema.sql.
3. Configure Auth providers.
4. Create organization + first owner.
5. Replace LocalStorage repository functions with Supabase queries.
6. Add server-side authorization/RLS tests.
7. Add Realtime subscriptions for timetable, booking and substitution changes.
8. Add Stripe only after the core scheduling workflow is stable.
9. Deploy Next.js app on Vercel.
10. Configure custom domain and production environment variables.

## Important

The current automatic scheduler is a heuristic generator, not a mathematically optimal university scheduling solver. For large multi-department deployments, move scheduling into a server-side optimization service using a constraint solver and return a scored set of candidate schedules. This matches the market pattern of weighted criteria and candidate timetable generation described by Untis.

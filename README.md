# UniSchedule — University Timetable Management

A professional, browser-based university timetable management application based on the supplied Joy University B.Tech timetable reference.

## Vercel deployment

This repository is a static web application: the production entry point is `index.html`, with no Node.js server or build step required. Vercel can deploy the repository directly and serve the static files from its CDN. Git-connected projects can then redeploy automatically when the main branch changes.

### Deploy from GitHub

1. Sign in to Vercel.
2. Choose **Add New → Project**.
3. Import **`asakiran2307/Time-table-management`**.
4. Keep the **Root Directory** as `./`.
5. Leave the **Build Command** empty.
6. Leave the **Output Directory** empty/default for a static site.
7. Click **Deploy**.

The repository includes `vercel.json` with production response headers, plus a favicon, web manifest, robots.txt and sitemap.

### Deploy with Vercel Drop

The complete repository folder can also be deployed through Vercel Drop. The project already contains `index.html` at the root, so no framework conversion is required.

## Features

- Dashboard with timetable health checks
- Departments and academic sections
- Faculty management
- Course catalogue with L/T/P, credits and weekly workload
- Classroom, lab and seminar-hall resources
- Manual timetable cell editing
- Constraint-aware automatic generation
- Class and faculty timetable views
- Class, faculty and room collision detection
- Working-day, period, break and academic-year settings
- Browser LocalStorage persistence
- JSON backup
- PDF export
- Excel workbook export
- CSV export
- Word-compatible DOC export
- PNG export
- Print-ready landscape layout
- Responsive professional UI
- No animations or transforms

## Run locally

Open `index.html` in a current browser. No server is required for the base application.

The export libraries are loaded from public CDNs:
- SheetJS
- jsPDF
- html2canvas

## Scheduling constraints

1. A class cannot have two subjects in one period.
2. A faculty member cannot teach two classes at the same time.
3. A room cannot host two sessions at the same time.
4. Break periods are blocked.
5. Practical subjects are preferentially scheduled in consecutive periods.

The generator is deliberately simple and transparent. For a large multi-department production deployment, the data model can later be moved to a backend with a CP-SAT/constraint-optimization scheduler.

## Data and deployment limitation

The current application stores workspace data in the browser's LocalStorage. That means each browser/device has its own data; Vercel deployment does **not** create a shared university database.

For multi-user production use, add:
- PostgreSQL/MySQL database
- Admin, department, faculty and viewer roles
- Authentication and password reset
- Audit trail and versioned timetable releases
- Bulk Excel import
- Multiple semesters and academic years
- Faculty availability/preferences
- Room capacity and equipment constraints
- Combined classes / common electives
- Saturday working rules
- Server-side PDF/Excel generation
- Advanced optimization for very large schedules
- REST API and institutional integration

## Export scopes

The Export Centre supports selected-class and complete-university PDF outputs, plus schedule exports to Excel, CSV, Word-compatible DOC, PNG, JSON and browser print.

## Initial sample

The sample workspace is populated using the structure visible in the supplied Joy University timetable: 2025–26 academic year, Monday–Friday schedule, 8 periods, break slots, CSE III/V Section K, course codes 24BTCY151–156 and 24BTCY851 plus the two lab courses, faculty and room information.


## SaaS development

The repository now contains a SaaS foundation in supabase/schema.sql and .env.example.

### Current browser demo
The UI works without a backend using LocalStorage, including master data, timetable generation, availability, room booking, substitutions, users/roles, activity logs and exports.

### Production backend
For a real multi-university SaaS deployment:

1. Create a Supabase project.
2. Run supabase/schema.sql in the Supabase SQL Editor.
3. Configure Supabase Auth.
4. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in the production app.
5. Keep SUPABASE_SECRET_KEY server-side only.
6. Migrate browser LocalStorage repositories to Supabase queries protected by RLS.
7. Add Vercel deployment environment variables.

Supabase's current Next.js guidance uses cookie-based Auth, Postgres and RLS; exposed tables should remain protected by RLS. Vercel's current SaaS starter pattern also demonstrates authentication, RBAC, subscriptions and activity logging.

### Enterprise modules now included

The browser application now also includes:
- Analytics and workload dashboards
- Faculty availability controls used by the generator
- Room booking with timetable collision checks
- Substitution planning with substitute conflict checks
- Users and workspace roles
- Activity/audit log
- Attendance register
- Announcements/notifications workspace
- Timetable release/version snapshots with restore
- JSON backup restore
- Full integrity validation
- Master-data edit/delete with dependency protection
- Break/lunch-aware calendar configuration

These features intentionally work in the browser demo so the project can be tested without a backend.

### Production SaaS target architecture

For a shared university product, the recommended production stack is Next.js App Router + Supabase Auth/Postgres/RLS + Vercel. Supabase's current Next.js guidance uses cookie-based authentication with `@supabase/ssr`, while RLS provides row-level authorization; Vercel's SaaS starter demonstrates authentication, RBAC, activity logging and billing patterns.

The current repository includes the Supabase schema foundation, but the browser demo is still LocalStorage-backed until a Supabase project and application integration are configured. Do not put a Supabase secret/service key in browser code.

### Recommended production rollout

1. Create the Supabase project and run `supabase/schema.sql`.
2. Configure email/password or institutional SSO in Supabase Auth.
3. Add Next.js App Router + `@supabase/ssr` authentication.
4. Create organization onboarding and membership management.
5. Replace LocalStorage repositories with organization-scoped Supabase queries.
6. Keep RLS enabled and test SELECT/INSERT/UPDATE/DELETE policies.
7. Move automatic timetable generation to a server-side constraint solver for large deployments.
8. Add Realtime for schedule, bookings and substitution updates.
9. Add object storage for institutional documents and generated exports.
10. Add Stripe only after the core scheduling workflow is stable.

The current schema deliberately keeps organization_id on business records so multiple universities can share one database while remaining isolated by RLS.

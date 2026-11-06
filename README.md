# UniSchedule — Intelligent University Timetable Management

A professional university timetable planning and optimization workspace for a single authorized user per university. Faculty and students are scheduling data only; they do not receive application logins.

## Product flow

Master Admin → University → One Owner Account → Prepare Data → Constraints → Build Timetable → Preflight → Compare/Repair → Validate → Publish → Export/Share.

The workflow follows the scheduling blueprint in the supplied specification: hard/soft constraints, multiple candidate solutions, lock/repair, versioned releases, owner-only exports and view-only sharing. fileciteturn100file0L2135-L2180

## Implemented in the current branch

### Owner workspace
- One university / one authorized application-user model
- Owner-only timetable management, publish, export and share
- Faculty/student records are never treated as login accounts
- Institutional branding and active-term context

### Academic setup
- University, code, school, academic year and semester
- Departments, programs, sections and classes
- Student strength by class
- Faculty records with day/week workload limits
- Rooms/labs with capacity, building, floor and features
- Course catalogue with L/T/P, credits, session patterns, faculty and room requirements
- Combined class groups and elective groups

### Calendar
- Working days
- Up to 16 periods/day
- Configurable start time and period duration
- 0–4 short breaks
- 0–2 lunch breaks
- Unique break-period validation
- Breaks automatically excluded from scheduling

### Scheduling engine
- Global multi-class activity generation
- Hard constraints: class/faculty/room collision, availability, capacity, lab features, consecutive labs, working days and breaks
- Soft scoring: class gaps, faculty gaps, repeated-course spread, room waste and edge-period use
- Fast, balanced, best-quality, repair and manual+optimize modes
- Three candidate solutions with score comparison
- Locked timetable cells
- Repair mode that preserves valid existing assignments where possible
- Human-readable unscheduled/coverage explanations

### Validation and release
- Preflight data readiness
- Hard-conflict report
- Coverage report
- Explicit Validated state
- Draft → Validated → Published → Archived lifecycle
- Published snapshots
- Version restore/history

### Sharing and export
- Owner-only PDF, Excel, CSV, DOCX, ICS and print export
- View-only snapshot share links
- QR code generation
- Share-link history in the owner workspace

### Operations and analysis
- Faculty availability editor
- Room availability blocks
- Class restrictions
- What-if scenario simulation
- Faculty workload report
- Room utilization report
- Course coverage report
- Scheduling quality breakdown
- Scheduling Intelligence recommendations
- Excel import with workbook preview/validation
- Downloadable import template

## Seed data

The default demo is populated for Joy University, Section K, Semester V, including departments, courses, faculty, Room 103, Cloud Computing Lab and a seeded weekly timetable. The Calendar screen also exposes the break counts and their period positions.

Use Restore Section K seed to return the complete demo dataset.

## Production backend and school isolation

The current browser-only demo is **not production-safe for confidential multi-school data**:
- Demo credentials and university data are stored in browser JavaScript/localStorage.
- The legacy Neon `/api/state` endpoint uses one shared `default` record and does not authenticate requests.
- The Supabase Auth/RLS path is not yet wired end-to-end into the main timetable UI.

Do not enter real faculty/student information or use this demo as a production multi-school system until the security work is completed.

Database migration history:
- `supabase/migrations/001_single_owner.sql` — legacy model.
- `supabase/migrations/003_production_relational_model.sql` — relational model and organization RLS.
- `supabase/migrations/004_school_operators_and_subject_expertise.sql` — schema groundwork for two authorized operators per school, verified faculty-to-subject mappings, subject-specific shortage placeholders, and explicit manual-related assignments.

In this product model, one organization row represents one school workspace. The migration preserves school-level RLS and enforces a maximum of two memberships per school at the database layer. It does not provision the second Supabase Auth user or complete the frontend login/session flow.

The subject expertise table is the source of truth for automatic allocation. Related-subject manual exceptions are marked separately. Placeholder faculty rows are explicitly marked as placeholders and tied to a specific subject and sequence; they must never be counted as verified real faculty.

**Deployment gate:** migrations must be reviewed and applied to the intended Supabase project, then the Auth provisioning API, session-aware app state, tenant-scoped data access, allocation engine, and automated tests must be completed before production use. The connected Supabase project was previously reported inactive; no live database migration has been applied by this change.

## Deploy

Vercel deployments should be checked against the exact branch and commit. A preview deployment is not a production release, and this repository's production branch remains `main`.
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

## Production backend

The browser workspace is intentionally usable without credentials for the demo. Production authentication and tenant isolation are prepared under 'supabase/':
- supabase/migrations/001_single_owner.sql
- supabase/migrations/003_production_relational_model.sql
- supabase/seeds/001_joy_section_k.sql

The relational model uses PostgreSQL RLS with one organization owner. Supabase recommends enabling RLS on exposed tables and using ownership predicates with auth.uid()/secure helper functions for row-level isolation. citeturn547338search0turn547338search4

The current connected Supabase project is inactive, so the migration is committed but has not been applied to that live project.

## Deploy

The repo is linked to Vercel and deploys from main.
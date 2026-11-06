# UniSchedule — Intelligent University Timetable Management

A professional timetable planning and optimization workspace. Each school has one isolated workspace and up to two authorized timetable operators. Faculty and students are scheduling data only; they do not receive application logins.

## Product flow

Platform provisioning → School → Two Operator Accounts → Prepare Data → Constraints → Build Timetable → Preflight → Compare/Repair → Validate → Publish → Export/Share.

The workflow follows the scheduling blueprint in the supplied specification: hard/soft constraints, multiple candidate solutions, lock/repair, versioned releases, owner-only exports and view-only sharing. fileciteturn100file0L2135-L2180

## Implemented in the current branch

### Owner workspace
- One school workspace / up to two authorized operator accounts
- School-operator timetable management, publish, export and share
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

## Initial workspace data

The initial Joy University workspace includes editable sample academic records. These are not treated as verified teaching assignments. The timetable starts without a published/seeded schedule. A school operator must explicitly verify each faculty-to-subject mapping before automatic assignment is allowed.

## Neon backend and school isolation

- Neon project: `joy-university-timetable` (Free organization, ap-southeast-1, smallest scale-to-zero compute).
- One `us_organizations` row represents one school workspace.
- Each school supports at most two operator accounts; a user can belong to only one school.
- `/api/auth` issues an opaque, HttpOnly, SameSite=Lax session cookie after verifying a scrypt password hash.
- `/api/state` reads and writes only the organization resolved from that server-side session. The browser cannot choose an organization ID.
- Workspace data is stored in `us_workspace_state`, keyed by school.
- `us_faculty_subjects` stores explicit verified or manual-related subject eligibility.
- `us_placeholder_sequences` supports per-subject recruitment placeholders.
- Automatic scheduling considers only verified mappings. A related-subject mapping is a deliberate manual exception. When neither exists, the engine creates a subject-specific pending placeholder such as `New Faculty 1`; placeholders are never presented as real faculty.

The Neon schema has been created and the nine Joy University school workspaces have been provisioned. SOCI has two operator accounts: Ambika S (`ambika@joyuniversity.edu.in`) and T. Anitha (`anitha@joyuniversity.edu.in`). Their initial temporary passwords are provided separately to the requester and should be changed after first sign-in. Other schools are created but still need their two operator accounts. Before login can work on Vercel, add the Neon pooled connection string as the encrypted `DATABASE_URL` environment variable for Preview, Production and Development, then redeploy. Do not use the old Supabase migration files for this Neon project; they are retained as historical reference only.

**Production gate:** database schema is present, but live Vercel database connectivity, operator provisioning, end-to-end login, cross-school isolation tests, and deployed timetable generation still require verification. Do not enter confidential university data until those checks pass.

## Deploy

Vercel deployments should be checked against the exact branch and commit. A preview deployment is not a production release, and this repository's production branch remains `main`.
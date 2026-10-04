# UniSchedule production architecture

## Access model

UniSchedule is a **single-owner-per-university** timetable platform.

- Platform Master Admin creates a university/school.
- The university gets exactly one application user.
- That user is the only person who can log in and modify the workspace.
- Faculty and students are records used by the scheduler; they never receive application accounts.
- Export and timetable management are owner-only operations.
- Sharing creates a separate view-only published snapshot; a share link is never an edit credential.

## Product flow

Master Admin → Create University → Create/Invite Owner → Owner Login → Onboarding → Master Data → Constraints → Preflight → Generate → Compare Solutions → Manual Review/Lock → Validate → Publish Version → Export/Share.

## Scheduling model

Every teaching requirement is an activity that needs a feasible day/period/room assignment.

### Hard constraints

- no class collision
- no faculty collision
- no room collision
- room capacity and feature requirements
- faculty unavailable periods
- class unavailable periods
- breaks/holidays
- consecutive lab requirements
- required weekly session coverage
- locked assignments

### Soft constraints

- faculty preferences
- balanced daily workload
- minimize class gaps
- minimize faculty gaps
- spread repeated subjects over days
- prefer suitable/same rooms
- minimize unnecessary building changes
- improve room utilization

The engine should return a solution score plus a human-readable explanation of every unscheduled activity or violated preference.

## Release lifecycle

DRAFT → VALIDATED → PUBLISHED → ARCHIVED

Published timetables are immutable snapshots. Manual edits create a new draft/version rather than silently changing a published release.

## Recommended database boundaries

organizations → owner → academic_years → semesters → departments/programs → sections → course_offerings → activities → faculty/rooms → constraints → schedule_entries → timetable_versions → share_links

Every business row carries organization_id and is protected by PostgreSQL RLS. Authorization is based on relational ownership, not editable user metadata.

## Implementation priorities

1. Supabase Auth + owner provisioning endpoint
2. RLS migration for exactly one owner per organization
3. Relational repository replacing LocalStorage/cloud JSON state
4. Preflight validation
5. Constraint solver service
6. Draft/validate/publish/version workflow
7. Owner-only exports
8. Published snapshot share links
9. XLSX/DOCX/PDF report generation
10. Solver repair/lock/compare and analytics

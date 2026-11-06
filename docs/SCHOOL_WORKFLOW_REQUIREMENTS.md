# School-wise timetable workflow requirements

Status: implementation baseline for the school-wise workflow branch.

## Product goal

Turn UniSchedule into a simple, English-first timetable preparation system for Joy University. Each school manages its own academic data and has exactly two authorized timetable-preparation accounts. Preserve existing scheduling capabilities where compatible.

## Access and privacy

- Model each Joy University school as an isolated data boundary.
- Provision two separate scheduler login accounts for each school.
- For SOCI, the initial operator names are Ambika and Anitha. Provision credentials securely; never hard-code passwords or expose them in client code.
- Both operators can work on the same school's timetable workspace.
- A user from one school must not read or modify another school's faculty, courses, subjects, sections, timetable, or related records.
- Enforce school scope in the database and server/API authorization, not only in frontend navigation.
- Keep any central platform administrator as a separately authorized role.

## Faculty directory and subject eligibility

- Use the official Joy University school faculty pages as the source for publicly listed faculty details.
- SOCI directory: https://joyuniversity.edu.in/University/School-of-Computational-Intelligence
- Faculty profiles: https://joyuniversity.edu.in/our-faculties
- Store faculty-to-subject expertise as explicit, school-scoped mappings.
- Do not infer teachable subjects solely from a research-interest paragraph. Import public profile data, then let school operators/admins verify and maintain subject mappings.
- Automatic assignment may select only faculty mapped as eligible for that subject.
- If no exact eligible faculty is available, allow an operator to manually select a faculty member mapped to a similar/related subject and record the manual exception.
- Check availability, daily/weekly workload limits, and timetable collisions for automatic and manual assignments.

## Timetable setup workflow

1. Sign in to the school's scheduler account.
2. Open the school's private dashboard.
3. Select academic year and year/semester of study.
4. Enter the number of sections and create section labels.
5. Select the program/course offering for each section.
6. Select subjects that belong to each course/program and section.
7. Generate faculty candidates from verified subject-expertise mappings.
8. Auto-assign eligible faculty where possible.
9. Allow manual related-subject assignment when an operator confirms it.
10. If a subject still has no real faculty, create a clearly marked New Faculty 1, New Faculty 2, etc. placeholder rather than leaving a faculty slot empty.
11. Complete timetable generation, conflict checking, review, validation, save, and export.

## Faculty shortage rule

- No required teaching slot may silently remain without a faculty allocation.
- A placeholder is not a real faculty member and must be visibly labelled as pending recruitment/confirmation.
- Placeholders must not be counted as verified faculty or hide a staffing shortage.
- Real faculty assignments must still pass availability and collision checks.
- Placeholder identity/reuse policy is pending product-owner confirmation.

## User experience

- Rewrite labels, help text, and errors in plain, simple English.
- Use a guided step-by-step workflow with clear progress and next actions.
- Keep the dashboard uncluttered and avoid unnecessary technical language.
- Preserve useful timetable generation, conflict checking, workload, calendar, versioning, and export features when compatible.

## Engineering and acceptance requirements

- Add school-scoped database constraints and row-level authorization policies.
- Replace demo/local-only authentication for operational accounts with secure authentication.
- Remove any public/global state endpoint that allows unauthenticated cross-school access.
- Keep service-role/database secrets server-side only.
- Add automated tests for school isolation, two-operator access, faculty-subject eligibility, related-subject manual override, placeholder creation, and timetable collision prevention.
- Run syntax/build/test checks before merging or deploying.
- Do not deploy a production migration that cannot be rolled back or whose required secrets/backend are not configured.
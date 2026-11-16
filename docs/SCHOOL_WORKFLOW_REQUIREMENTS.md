# Joy University timetable workflow

- Joy University only; nine school workspaces; no other universities.
- Exactly two authorized faculty timetable coordinators per school, with equal permissions in that school's workspace.
- Backend session scope prevents cross-school access.
- Students and visitors have no accounts; one public portal shows published timetables.
- No Dean login, Dean dashboard, electronic approval, Master Admin login or university-creation flow.
- Official faculty source: https://joyuniversity.edu.in/our-faculties. Import profiles only when the profile identifies a school. Never invent email addresses or infer teachable subjects from research interests.
- Preparation order: academic year/semester → courses/subjects → years/sections → official faculty import → verified teaching subjects → faculty allocation/exchange → automatic generation and validation.
- Automatic assignment uses verified subject mappings. Related-subject assignments are manual exceptions. Shortages use visible subject-specific placeholders.
- Faculty print the draft. Dean reviews offline. After approval, a faculty coordinator confirms the manual approval and publishes. Store the confirming account and timestamp with the published snapshot.
- One public portal filters by school, academic year, semester, course and section. Only published snapshots are visible. Never expose drafts, login emails or private records.
- Empty school workspaces must not be seeded with SOCI demo data. Run syntax checks and automated tests before production deployment.
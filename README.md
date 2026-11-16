# Joy University Timetable Management

This application is exclusively for Joy University. Nine school workspaces are already present in Neon.

- Each school has two authorized faculty timetable coordinators with equal permissions inside that school's private workspace.
- Students and visitors do not log in. They use one public timetable portal at /timetable.html.
- The Dean has no application login or dashboard. The Dean reviews printed drafts manually, offline.
- A clearly labelled demo environment is available at `/demo.html`: one-click Central Admin access and two demo coordinator profiles for each of the nine schools. Demo sign-ins are browser-local shortcuts, not real authentication.
- All nine Neon school workspaces now contain synthetic sample records and a demo-published timetable snapshot. The public portal labels these releases as DEMO and states that they are not official university-approved timetables.
- SOCI has a Third Year / Semester VI demonstration dataset for Sections A–L: 12 class sections, 22 sample faculty records, 22 course offerings and 192 timetable rows. All other schools have a smaller Semester V sample dataset.
- The browser-local demo workspaces are separately seeded for each school and do not write changes back to Neon. Real SOCI faculty accounts use the Neon-backed workspace; the other eight schools still need their actual coordinator users provisioned before production sign-in.
- Production faculty authentication remains email/password based. The demo shortcut is not production authentication.

## Faculty directory
The faculty workspace syncs public profiles from https://joyuniversity.edu.in/our-faculties. Profiles are mapped only when the profile text names a school. Email addresses are not invented, and research interests are not treated as teaching assignments. Coordinators must verify actual subjects before automatic allocation.

## Workflow
Academic year and semester → courses and subjects → years and sections → official faculty import → verified teaching subjects → faculty allocation and exchange → automatic generation and validation → print draft → Dean approval offline → faculty coordinator confirms approval and publishes → students view published snapshots.

## Security
- The server derives the school scope from the authenticated faculty session.
- PostgreSQL limits each school to two operator memberships.
- Public API returns published snapshots only, omits account emails and private data, and exposes a `demoOnly` marker so sample releases are never presented as official approvals.
- Preview deployments remain protected; Production is intended for public student access.

## Checks
Run npm install, npm test and npm run check.

Vercel Production uses the existing encrypted DATABASE_URL. The current Neon database has two active SOCI coordinator accounts; the other eight schools require their two coordinators to be provisioned after names and university email addresses are confirmed. Directory entries do not automatically receive login access.
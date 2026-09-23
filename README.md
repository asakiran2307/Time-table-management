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

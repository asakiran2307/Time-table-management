# UniSchedule — University Timetable Management

A professional university timetable management web application based on the supplied Joy University B.Tech timetable reference.

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

## Run
Open index.html in a current browser. The base application requires no server.

For GitHub Pages, publish the main branch. The export libraries are loaded from public CDNs.

## Scheduling constraints
1. A class cannot have two subjects in one period.
2. A faculty member cannot teach two classes at the same time.
3. A room cannot host two sessions at the same time.
4. Break periods are blocked.
5. Practical subjects are preferentially scheduled in consecutive periods.

The generator is deliberately simple and transparent. For a large production university deployment, the same data model can be moved to a backend with a CP-SAT/constraint-optimization scheduler.

## Export scopes
The Export Centre supports the selected class and complete-university PDF outputs, plus complete schedule exports to Excel, CSV, Word-compatible DOC, PNG, JSON and browser print.

## Initial sample
The sample workspace is populated using the structure visible in the supplied Joy University timetable: 2025–26 academic year, Monday–Friday schedule, 8 periods, break slots, CSE III/V Section K, course codes 24BTCY151–156 and 24BTCY851 plus the two lab courses, faculty and room information.

## Production roadmap
For a university-wide deployment, add:
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
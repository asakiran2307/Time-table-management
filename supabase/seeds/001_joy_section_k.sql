-- Demo seed for UniSchedule's relational production model.
-- Run after 003_production_relational_model.sql on an ACTIVE Supabase project.
-- This seeds the academic records; the single owner auth user must be provisioned
-- through Supabase Auth/admin tooling and linked to us_organization_users.

insert into public.us_organizations(id,name,code,school,timezone,status)
values ('00000000-0000-0000-0000-000000000001','JOY UNIVERSITY','JU001','School of Computational Intelligence','Asia/Kolkata','Active')
on conflict (id) do update set name=excluded.name,school=excluded.school,timezone=excluded.timezone,status=excluded.status;

insert into public.us_academic_years(id,organization_id,name,active)
values ('00000000-0000-0000-0000-000000000101','00000000-0000-0000-0000-000000000001','2026–27',true)
on conflict (id) do update set name=excluded.name,active=excluded.active;

insert into public.us_semesters(id,organization_id,academic_year_id,name,number,active)
values ('00000000-0000-0000-0000-000000000201','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000101','Semester V',5,true)
on conflict (id) do update set name=excluded.name,active=excluded.active;

insert into public.us_departments(id,organization_id,name,code)
values
('00000000-0000-0000-0000-000000000301','00000000-0000-0000-0000-000000000001','School of Computational Intelligence','SOCI'),
('00000000-0000-0000-0000-000000000302','00000000-0000-0000-0000-000000000001','School of Engineering and Technology','SOET')
on conflict (id) do nothing;

insert into public.us_programs(id,organization_id,department_id,name)
values ('00000000-0000-0000-0000-000000000401','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000301','B.Tech CSE')
on conflict (id) do nothing;

insert into public.us_sections(id,organization_id,department_id,program_id,semester_id,name,code,strength)
values ('00000000-0000-0000-0000-000000000501','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000301','00000000-0000-0000-0000-000000000401','00000000-0000-0000-0000-000000000201','Section K','K',58)
on conflict (id) do nothing;

insert into public.us_classes(id,organization_id,section_id,program_id,semester_id,name,strength,incharge)
values ('00000000-0000-0000-0000-000000000601','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000501','00000000-0000-0000-0000-000000000401','00000000-0000-0000-0000-000000000201','B.Tech CSE · Semester V · K',58,'Ms. S. AMBIKA')
on conflict (id) do nothing;

insert into public.us_rooms(id,organization_id,name,code,type,capacity,building,floor,features,is_lab)
values
('00000000-0000-0000-0000-000000000701','00000000-0000-0000-0000-000000000001','Room 103','R103','Classroom',60,'Joveena Block',1,'["projector","smart-board","internet"]'::jsonb,false),
('00000000-0000-0000-0000-000000000702','00000000-0000-0000-0000-000000000001','Cloud Computing Lab','CCL','Lab',45,'Joveena Block',1,'["computers","internet","projector","linux","cybersecurity"]'::jsonb,true);

insert into public.us_calendar_settings(organization_id,days,periods,start_time,duration_minutes,short_breaks,lunch_breaks)
values ('00000000-0000-0000-0000-000000000001','["MON","TUE","WED","THU","FRI"]'::jsonb,8,'09:00',50,'[2]'::jsonb,'[5]'::jsonb)
on conflict (organization_id) do update set periods=excluded.periods,start_time=excluded.start_time,duration_minutes=excluded.duration_minutes,short_breaks=excluded.short_breaks,lunch_breaks=excluded.lunch_breaks;

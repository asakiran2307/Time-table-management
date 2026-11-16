"use strict";
function parse(value){if(!value)return{};if(typeof value==="string"){try{return JSON.parse(value)}catch{return{}}}return value}
function timeLabel(minutes){return String(Math.floor(minutes/60)%24).padStart(2,"0")+":"+String(minutes%60).padStart(2,"0")}
function releases(row){
 const state=parse(row.data)||{};
 const versions=(state.versions||[]).filter(v=>String(v.status).toLowerCase()==="published"&&Array.isArray(v.schedule)).sort((a,b)=>new Date(b.at||0)-new Date(a.at||0));
 const seen=new Set(),out=[];
 versions.forEach(version=>{
  const snapshot=version.snapshot||{},settings=snapshot.settings||version.settings||state.settings||{};
  const key=String(settings.year||"")+"|"+String(settings.semester||"");
  if(seen.has(key))return;
  seen.add(key);
  out.push({version,settings,classes:snapshot.classes||version.classes||state.classes||[],courses:snapshot.courses||version.courses||state.courses||[],faculty:snapshot.faculty||version.faculty||state.faculty||[],rooms:snapshot.rooms||version.rooms||state.rooms||[],schedule:version.schedule});
 });
 return out;
}
function buildPublicTimetable(rows,query){
 query=query||{};
 const records=rows.map(row=>({row,releases:releases(row)}));
 const schools=records.map(record=>({code:record.row.code,name:record.row.school,hasPublished:record.releases.length>0}));
 const defaultRecord=records.find(x=>x.row.code==="JU-SOCI"&&x.releases.length)||records.find(x=>x.releases.length)||records[0];
 const selectedRecord=records.find(x=>x.row.code===query.school)||defaultRecord;
 const selected={school:selectedRecord?selectedRecord.row.code:"",schoolName:selectedRecord?selectedRecord.row.school:"",year:"",semester:"",course:"",section:""};
 const availableReleases=selectedRecord?selectedRecord.releases:[];
 const years=Array.from(new Set(availableReleases.map(x=>String(x.settings.year||"")).filter(Boolean)));
 selected.year=years.includes(query.year)?query.year:(years[0]||"");
 const yearReleases=availableReleases.filter(x=>!selected.year||String(x.settings.year||"")===selected.year);
 const semesters=Array.from(new Set(yearReleases.map(x=>String(x.settings.semester||"")).filter(Boolean)));
 selected.semester=semesters.includes(query.semester)?query.semester:(semesters[0]||"");
 const current=yearReleases.find(x=>!selected.semester||String(x.settings.semester||"")===selected.semester);
 let courses=[],sections=[];
 if(current){
  const uniqueCourses=new Map();
  current.courses.forEach(course=>{
   const code=String(course.code||course.id||"");
   if(!uniqueCourses.has(code))uniqueCourses.set(code,{id:code,code,name:String(course.name||"")});
  });
  courses=Array.from(uniqueCourses.values());
  selected.course=courses.some(course=>course.id===query.course||course.code===query.course)?query.course:"";
  sections=current.classes.filter(cl=>!selected.course||current.schedule.some(entry=>{
   const course=current.courses.find(item=>String(item.id)===String(entry.courseId));
   return entry.classId===cl.id&&(String(entry.courseId)===selected.course||(course&&String(course.code)===selected.course));
  })).map(cl=>({id:String(cl.id),label:String(cl.name||cl.section||cl.id)}));
  selected.section=sections.some(section=>section.id===query.section)?query.section:"";
 }
 const entries=[];
 if(current){
  const courseMap=new Map(current.courses.map(item=>[String(item.id),item]));
  const facultyMap=new Map(current.faculty.map(item=>[String(item.id),item]));
  const roomMap=new Map(current.rooms.map(item=>[String(item.id),item]));
  const classMap=new Map(current.classes.map(item=>[String(item.id),item]));
  const seen=new Set(),start=String(current.settings.start||"09:00").split(":").map(Number),duration=Number(current.settings.duration)||50;
  const days=current.settings.days||["MON","TUE","WED","THU","FRI"],dayNames={MON:"Monday",TUE:"Tuesday",WED:"Wednesday",THU:"Thursday",FRI:"Friday",SAT:"Saturday",SUN:"Sunday"};
  current.schedule.forEach(entry=>{
   const course=courseMap.get(String(entry.courseId))||{};
   if(selected.course&&String(entry.courseId)!==selected.course&&String(course.code)!==selected.course)return;
   if(selected.section&&String(entry.classId)!==selected.section)return;
   const uniqueKey=String(entry.activityId||entry.id)+"|"+entry.classId;
   if(seen.has(uniqueKey))return;
   seen.add(uniqueKey);
   const faculty=facultyMap.get(String(entry.facultyId))||{},room=roomMap.get(String(entry.roomId))||{},cl=classMap.get(String(entry.classId))||{};
   const minutes=(start[0]||0)*60+(start[1]||0)+(Number(entry.period)||0)*duration;
   entries.push({dayLabel:dayNames[entry.day]||entry.day,dayOrder:Math.max(0,days.indexOf(entry.day)),period:Number(entry.period)||0,time:timeLabel(minutes)+" – "+timeLabel(minutes+duration*(Number(entry.duration)||1)),courseCode:course.code||course.id||"—",courseName:course.name||"Unknown subject",sectionLabel:cl.section||cl.name||"—",facultyName:faculty.name||"Not assigned",staffingPending:!!(faculty.isPlaceholder||faculty.staffingStatus==="pending_recruitment"||faculty.staffingStatus==="pending_confirmation"),roomName:room.name||"—"});
  });
  entries.sort((a,b)=>a.dayOrder-b.dayOrder||a.period-b.period||a.sectionLabel.localeCompare(b.sectionLabel));
 }
 return {
  schools,years,semesters,courses,sections,selected,
  release:current?{name:current.version.name||"Published timetable",publishedAt:current.version.at||null,academicYear:current.settings.year||"",semester:current.settings.semester||"",school:selected.schoolName,demoOnly:!!current.version.demoOnly}:null,
  entries
 };
}
module.exports={buildPublicTimetable};

const KEY="unisched-v3";
const CLOUD_API="/api/state";
let cloudTimer=null,lockMode=false,solutionCandidates=[];

function q(id){return document.getElementById(id)}
function esc(v){return String(v==null?"":v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function copy(v){return JSON.parse(JSON.stringify(v))}
function uid(prefix){return prefix+"-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,7)}
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function dayLabel(d){return ({MON:"Monday",TUE:"Tuesday",WED:"Wednesday",THU:"Thursday",FRI:"Friday",SAT:"Saturday",SUN:"Sunday"}[d]||d)}
function now(){return new Date().toISOString()}
function arr(v){return Array.isArray(v)?v:[]}

const DEFAULT={
  organization:{name:"JOY UNIVERSITY",code:"JU001",school:"School of Computational Intelligence",timezone:"Asia/Kolkata",status:"Active",ownerName:"University Timetable Owner",ownerEmail:"timetable@joyuniversity.edu"},
  settings:{university:"JOY UNIVERSITY",year:"2026–27",semester:"Semester V",title:"TIME TABLE FOR THE ACADEMIC YEAR 2026–27",incharge:"Ms. S. AMBIKA",school:"School of Computational Intelligence",start:"09:00",duration:50,periods:8,days:["MON","TUE","WED","THU","FRI"],shortBreaks:[2],lunchBreaks:[5]},
  departments:[{id:"SOCI",name:"School of Computational Intelligence",code:"SOCI"},{id:"SOET",name:"School of Engineering and Technology",code:"SOET"}],
  programs:[{id:"BTECH-CSE",name:"B.Tech CSE",department:"SOCI"}],
  academicYears:[{id:"AY2627",name:"2026–27",active:true}],
  semesters:[{id:"SEM5",name:"Semester V",number:5,academicYear:"AY2627",active:true}],
  sections:[{id:"SEC-K",name:"Section K",code:"K",department:"SOCI",program:"BTECH-CSE",semester:"SEM5",strength:58}],
  classes:[{id:"CSE5K",name:"B.Tech CSE · Semester V · K",section:"K",department:"SOCI",program:"BTECH-CSE",semester:"SEM5",strength:58,incharge:"Ms. S. AMBIKA"}],
  faculty:[
    {id:"F1",name:"Dr. MARIYAPPAN KANDASAMY",department:"SOCI",designation:"Professor",maxDay:3,maxWeek:18},
    {id:"F2",name:"Dr. SOFIYA",department:"SOCI",designation:"Assistant Professor",maxDay:4,maxWeek:18},
    {id:"F3",name:"Ms. AMBIKA",department:"SOCI",designation:"Assistant Professor",maxDay:4,maxWeek:18},
    {id:"F4",name:"Dr. MANOJKUMAR",department:"SOCI",designation:"Associate Professor",maxDay:4,maxWeek:18},
    {id:"F5",name:"MS. MARY DISILVA PRINCY",department:"SOCI",designation:"Assistant Professor",maxDay:4,maxWeek:18},
    {id:"F6",name:"NEW FACULTY 14",department:"SOCI",designation:"Assistant Professor",maxDay:4,maxWeek:18}
  ],
  rooms:[
    {id:"R103",name:"Room 103",code:"R103",type:"Classroom",capacity:60,building:"Joveena Block",floor:1,features:["projector","smart-board","internet"]},
    {id:"CCL",name:"Cloud Computing Lab",code:"CCL",type:"Lab",capacity:45,building:"Joveena Block",floor:1,features:["computers","internet","projector","linux","cybersecurity"],lab:true},
    {id:"SAK2",name:"SAK Seminar Hall 2nd Floor",code:"SAK2",type:"Seminar Hall",capacity:120,building:"SAK Block",floor:2,features:["projector","smart-board","internet"]}
  ],
  courses:[
    {id:"24BTCY151",code:"24BTCY151",name:"Introduction to Blockchain and Cryptocurrency",type:"Theory",credits:3,l:3,t:0,p:0,faculty:"F1",room:"R103",classIds:["CSE5K"],sessionPattern:"3 × 1"},
    {id:"24BTCY152",code:"24BTCY152",name:"Malware Analysis",type:"Theory",credits:3,l:3,t:0,p:0,faculty:"F1",room:"R103",classIds:["CSE5K"],sessionPattern:"3 × 1"},
    {id:"24BTCY153",code:"24BTCY153",name:"Computer Architecture",type:"Theory",credits:3,l:3,t:0,p:0,faculty:"F2",room:"R103",classIds:["CSE5K"],sessionPattern:"3 × 1"},
    {id:"24BTCY154",code:"24BTCY154",name:"Software Engineering",type:"Theory",credits:3,l:3,t:0,p:0,faculty:"F3",room:"R103",classIds:["CSE5K"],sessionPattern:"3 × 1"},
    {id:"24BTCY155",code:"24BTCY155",name:"Criminology and Cyber Crimes",type:"Theory",credits:3,l:3,t:0,p:0,faculty:"F4",room:"R103",classIds:["CSE5K"],sessionPattern:"3 × 1"},
    {id:"24BTCY156",code:"24BTCY156",name:"Theory of Computation",type:"Theory",credits:4,l:3,t:1,p:0,credits:4,faculty:"F6",room:"R103",classIds:["CSE5K"],sessionPattern:"3 × 1 + 1 × 1"},
    {id:"24BTCY851",code:"24BTCY851",name:"Principles of Management",type:"Theory",credits:3,l:3,t:0,p:0,faculty:"F5",room:"R103",classIds:["CSE5K"],sessionPattern:"3 × 1"},
    {id:"24BTCY251",code:"24BTCY251",name:"Introduction to Blockchain and Cryptocurrency Lab",type:"Lab",credits:1,l:0,t:0,p:2,faculty:"F1",room:"CCL",lab:true,classIds:["CSE5K"],sessionPattern:"1 × 2"},
    {id:"24BTCY252",code:"24BTCY252",name:"Malware Analysis Lab",type:"Lab",credits:1,l:0,t:0,p:2,faculty:"F1",room:"CCL",lab:true,classIds:["CSE5K"],sessionPattern:"1 × 2"}
  ],
  activities:[],
  availability:[
    {faculty:"F1",day:"ALL",period:7,blocked:true},{faculty:"F5",day:"MON",period:0,blocked:true}
  ],
  roomBlocks:[],
  classBlocks:[],
  preferences:{classGaps:8,facultyGaps:7,spread:8,rooms:6,edges:4,workload:7},
  combinedGroups:[],
  electives:[],
  schedule:[],
  versions:[],
  shareLinks:[],
  activityLog:[],
  branding:{name:"JOY UNIVERSITY",code:"JU001",logo:"",timezone:"Asia/Kolkata"}
};

function normalizeState(x){
  x=Object.assign(copy(DEFAULT),x||{});
  x.organization=Object.assign(copy(DEFAULT.organization),x.organization||{});
  x.settings=Object.assign(copy(DEFAULT.settings),x.settings||{});
  x.branding=Object.assign(copy(DEFAULT.branding),x.branding||{});
  ["departments","programs","academicYears","semesters","sections","classes","faculty","rooms","courses","activities","availability","roomBlocks","classBlocks","combinedGroups","electives","schedule","versions","shareLinks","activityLog"].forEach(k=>x[k]=arr(x[k]));
  x.preferences=Object.assign(copy(DEFAULT.preferences),x.preferences||{});
  if(!x.sections.length)x.classes.forEach(c=>x.sections.push({id:uid("SEC"),name:"Section "+c.section,code:c.section,department:c.department,program:c.program||"",semester:c.semester||"",strength:c.strength||60}));
  x.settings.shortBreaks=arr(x.settings.shortBreaks).map(Number);
  x.settings.lunchBreaks=arr(x.settings.lunchBreaks).map(Number);
  if(!x.settings.shortBreaks.length&&Number.isInteger(x.settings.shortBreak))x.settings.shortBreaks=[x.settings.shortBreak];
  if(!x.settings.lunchBreaks.length&&Number.isInteger(x.settings.lunchBreak))x.settings.lunchBreaks=[x.settings.lunchBreak];
  sanitizeBreaks(x.settings);
  const old=arr(x.schedule);
  x.schedule=old.map(e=>Array.isArray(e)?{id:uid("SCH"),day:e[0],period:e[1],courseId:e[2],facultyId:e[3],roomId:e[4],classId:e[5],duration:1,locked:false}:Object.assign({id:uid("SCH"),duration:1,locked:false},e));
  x.courses.forEach(c=>{if(!c.classIds)c.classIds=x.classes.map(cl=>cl.id);});
  if(!x.schedule.length)seedSchedule(x);
  x.activities.forEach(a=>{if(!a.classId)a.classId=x.classIds?.[0]});
  return x;
}
function sanitizeBreaks(s){
  const total=Number(s.periods)||8;
  const clean=v=>arr(v).map(Number).filter(n=>Number.isInteger(n)&&n>=0&&n<total);
  s.shortBreaks=clean(s.shortBreaks).filter((n,i,a)=>a.indexOf(n)===i);
  s.lunchBreaks=clean(s.lunchBreaks).filter((n,i,a)=>a.indexOf(n)===i);
  s.lunchBreaks=s.lunchBreaks.filter(n=>!s.shortBreaks.includes(n));
  s.breaks=[...s.shortBreaks,...s.lunchBreaks].sort((a,b)=>a-b);
}
function seedSchedule(state){
  const s=state.settings;
  const days=s.days;
  const places=[];
  days.forEach(d=>{for(let p=0;p<s.periods;p++)if(!s.breaks.includes(p))places.push([d,p])});
  const classId="CSE5K";
  const fixed=[
    ["MON",0,"24BTCY251","F1","CCL",2],["MON",3,"24BTCY156","F6","R103",1],["MON",4,"24BTCY153","F2","R103",1],["MON",6,"24BTCY155","F4","R103",1],
    ["TUE",0,"24BTCY152","F1","R103",1],["TUE",1,"24BTCY151","F1","R103",1],["TUE",3,"24BTCY156","F6","R103",1],["TUE",4,"24BTCY851","F5","R103",1],["TUE",6,"24BTCY155","F4","R103",1],
    ["WED",0,"24BTCY151","F1","R103",1],["WED",1,"24BTCY851","F5","R103",1],["WED",3,"24BTCY153","F2","R103",1],["WED",4,"24BTCY154","F3","R103",1],["WED",6,"24BTCY156","F6","R103",1],
    ["THU",0,"24BTCY851","F5","R103",1],["THU",1,"24BTCY151","F1","R103",1],["THU",3,"24BTCY153","F2","R103",1],["THU",4,"24BTCY152","F1","R103",1],["THU",6,"24BTCY154","F3","R103",1],["THU",7,"24BTCY156","F6","R103",1],
    ["FRI",0,"24BTCY252","F1","CCL",2],["FRI",3,"24BTCY152","F1","R103",1],["FRI",4,"24BTCY154","F3","R103",1],["FRI",6,"24BTCY155","F4","R103",1]
  ];
  state.schedule=fixed.map(v=>({id:uid("SCH"),day:v[0],period:v[1],courseId:v[2],facultyId:v[3],roomId:v[4],classId,vduration:v[5],duration:v[5],locked:false}));
}
let db=normalizeState(loadLocal());

function loadLocal(){
  try{return JSON.parse(localStorage.getItem(KEY)||"null")||copy(DEFAULT)}catch(e){return copy(DEFAULT)}
}
function save(){
  if(sharedSnap)return false;
  db=normalizeState(db);
  localStorage.setItem(KEY,JSON.stringify(db));
  clearTimeout(cloudTimer);cloudTimer=setTimeout(cloudSave,300);
  render();
}
function log(action,details=""){db.activityLog.unshift({id:uid("ACT"),action,details,at:now()});db.activityLog=db.activityLog.slice(0,300)}
function cloudSave(){
  fetch(CLOUD_API,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({data:db})})
    .then(r=>r.ok?setSync("Cloud sync enabled"):Promise.reject())
    .catch(()=>setSync("Local mode · cloud unavailable"));
}
function cloudLoad(){
  setSync("Syncing workspace…");
  fetch(CLOUD_API,{cache:"no-store"}).then(async r=>{if(!r.ok)throw 0;return r.json()}).then(p=>{
    if(p&&p.data){db=normalizeState(p.data);localStorage.setItem(KEY,JSON.stringify(db));log("Cloud workspace loaded","Remote state");render()}
    setSync("Cloud sync enabled");
  }).catch(()=>setSync("Local mode · cloud unavailable"));
}
function setSync(t){if(q("syncStatus"))q("syncStatus").textContent=t}

function currentBreakType(p){
  if((db.settings.shortBreaks||[]).includes(p))return "SHORT BREAK";
  if((db.settings.lunchBreaks||[]).includes(p))return "LUNCH BREAK";
  return "";
}
function timeSlots(state=db){
  let [h,m]=(state.settings.start||"09:00").split(":").map(Number);let out=[];
  for(let i=0;i<state.settings.periods;i++){let a=h*60+m+i*state.settings.duration,b=a+state.settings.duration;
    out.push({start:String(Math.floor(a/60)%24).padStart(2,"0")+":"+String(a%60).padStart(2,"0"),end:String(Math.floor(b/60)%24).padStart(2,"0")+":"+String(b%60).padStart(2,"0")})}
  return out;
}
function findCourse(id){return db.courses.find(c=>c.id===id)}
function findFaculty(id){return db.faculty.find(f=>f.id===id)}
function findRoom(id){return db.rooms.find(r=>r.id===id)}
function findClass(id){return db.classes.find(c=>c.id===id)}

function courseSessions(c){
  if(c.lab)return Math.max(1,Math.ceil((Number(c.p)||0)/2));
  return Math.max(1,(Number(c.l)||0)+(Number(c.t)||0)+(Number(c.p)||0));
}
function activityList(state=db){
  const out=[];
  state.classes.forEach(cl=>{
    state.courses.filter(c=>arr(c.classIds).includes(cl.id)).forEach(c=>{
      for(let i=0;i<courseSessions(c);i++)out.push({id:uid("ACTV"),classId:cl.id,courseId:c.id,index:i,duration:c.lab?2:1,type:c.lab?"LAB":"CLASS"});
    });
  });
  return out;
}
function entryAt(state,day,period,classId){return state.schedule.find(e=>e.day===day&&e.period===period&&e.classId===classId)}
function occupied(state,day,period,field,value,exceptIds=[]){return state.schedule.some(e=>e.day===day&&e.period===period&&e[field]===value&&!exceptIds.includes(e.id))}
function facultyBlocked(state,fid,day,p){
  return state.availability.some(a=>a.faculty===fid&&a.blocked&&(a.day==="ALL"||a.day===day)&&(a.period===p||a.period===-1))
}
function classBlocked(state,cid,day,p){return state.classBlocks.some(a=>a.classId===cid&&(a.day==="ALL"||a.day===day)&&(a.period===p||a.period===-1)&&a.blocked)}
function roomBlocked(state,rid,day,p){return state.roomBlocks.some(a=>a.roomId===rid&&(a.day==="ALL"||a.day===day)&&(a.period===p||a.period===-1)&&a.blocked)}
function roomFits(state,rid,cid,courseId){
  const r=state.rooms.find(x=>x.id===rid),cl=state.classes.find(x=>x.id===cid),c=state.courses.find(x=>x.id===courseId);
  if(!r||!cl||!c)return false;
  if(r.capacity<(cl.strength||0))return false;
  if(c.lab&&!r.lab)return false;
  return true;
}
function hardCheck(state,a,day,p,roomId,ignoreIds=[]){
  const c=state.courses.find(x=>x.id===a.courseId),f=c&&state.faculty.find(x=>x.id===c.faculty);
  if(!c||!f)return "Missing course/faculty";
  if(state.settings.breaks.includes(p))return "Break period";
  if(!state.settings.days.includes(day))return "Non-working day";
  if(facultyBlocked(state,f.id,day,p))return "Faculty unavailable";
  if(classBlocked(state,a.classId,day,p))return "Class blocked";
  if(roomBlocked(state,roomId,day,p))return "Room unavailable";
  if(occupied(state,day,p,"classId",a.classId,ignoreIds))return "Class collision";
  if(occupied(state,day,p,"facultyId",f.id,ignoreIds))return "Faculty collision";
  if(occupied(state,day,p,"roomId",roomId,ignoreIds))return "Room collision";
  if(!roomFits(state,roomId,a.classId,a.courseId))return "Room capacity/feature mismatch";
  if(a.duration===2){
    if(p+1>=state.settings.periods||state.settings.breaks.includes(p+1)||!state.settings.days.includes(day))return "Lab needs consecutive periods";
    if(facultyBlocked(state,f.id,day,p+1)||classBlocked(state,a.classId,day,p+1)||roomBlocked(state,roomId,day,p+1))return "Consecutive period blocked";
    if(occupied(state,day,p+1,"classId",a.classId,ignoreIds)||occupied(state,day,p+1,"facultyId",f.id,ignoreIds)||occupied(state,day,p+1,"roomId",roomId,ignoreIds))return "Consecutive period collision";
  }
  return "";
}
function deterministicNoise(seed){const x=Math.sin(seed*9973.17)*43758.5453;return x-Math.floor(x)}
function softPenalty(state,entry,trial){
  const c=state.classes.find(x=>x.id===entry.classId),cr=state.courses.find(x=>x.id===entry.courseId),r=state.rooms.find(x=>x.id===entry.roomId);
  let p=0,pen=state.preferences;
  if(entry.period===0||entry.period===state.settings.periods-1)p+=pen.edges*.55;
  const sameDay=state.schedule.filter(e=>e.classId===entry.classId&&e.day===entry.day&&e.id!==entry.id);
  if(sameDay.length)p+=deterministicNoise(entry.period+trial)*0.3;
  if(r&&c)p+=Math.max(0,(r.capacity-c.strength)/Math.max(1,r.capacity))*pen.rooms*.8;
  const sameCourse=state.schedule.filter(e=>e.classId===entry.classId&&e.courseId===entry.courseId&&e.day===entry.day&&e.id!==entry.id).length;
  if(sameCourse)p+=pen.spread*1.4;
  return p;
}
function scheduleScore(state){
  const hard=allConflicts(state);
  let hardN=hard.length;
  let classGap=0,facultyGap=0,spread=0,roomWaste=0,edge=0;
  state.classes.forEach(cl=>{
    const days={};state.schedule.filter(e=>e.classId===cl.id).forEach(e=>(days[e.day]??=[]).push(e.period));
    Object.values(days).forEach(ps=>{ps.sort((a,b)=>a-b);for(let i=1;i<ps.length;i++)classGap+=Math.max(0,ps[i]-ps[i-1]-1)});
  });
  state.faculty.forEach(f=>{
    const days={};state.schedule.filter(e=>e.facultyId===f.id).forEach(e=>(days[e.day]??=[]).push(e.period));
    Object.values(days).forEach(ps=>{ps.sort((a,b)=>a-b);for(let i=1;i<ps.length;i++)facultyGap+=Math.max(0,ps[i]-ps[i-1]-1)});
  });
  state.courses.forEach(cr=>{
    state.schedule.filter(e=>e.courseId===cr.id).forEach(e=>{const n=state.schedule.filter(x=>x.courseId===cr.id&&x.classId===e.classId&&x.day===e.day).length;if(n>1)spread+=n-1});
  });
  state.schedule.forEach(e=>{const r=findRoom(e.roomId),cl=findClass(e.classId);if(r&&cl)roomWaste+=Math.max(0,r.capacity-cl.strength);if(e.period===0||e.period===state.settings.periods-1)edge++});
  const penalty=classGap*state.preferences.classGaps+facultyGap*state.preferences.facultyGaps+spread*state.preferences.spread+roomWaste*0.02*state.preferences.rooms+edge*state.preferences.edges;
  const score=hardN?Math.max(0,Math.round(100-hardN*20-penalty*.7)):Math.max(0,Math.round(100-penalty*.55));
  return {score,hardN,softPenalty:Math.round(penalty),classGap,facultyGap,spread,roomWaste,edge};
}
function allConflicts(state=db){
  const out=[];const seen=new Set();
  for(let i=0;i<state.schedule.length;i++)for(let j=i+1;j<state.schedule.length;j++){
    const a=state.schedule[i],b=state.schedule[j];if(a.day!==b.day||a.period!==b.period)continue;
    [["classId","Class"],["facultyId","Faculty"],["roomId","Room"]].forEach(([f,t])=>{
      if(a[f]&&a[f]===b[f]){const k=t+"|"+a.day+"|"+a.period+"|"+a[f];if(!seen.has(k)){seen.add(k);out.push({type:t,day:a.day,period:a.period,resource:a[f],a:a.id,b:b.id})}}
    });
  }
  return out;
}

function generateCandidate(mode="balanced",trial=1,source=db){
  const state=copy(source);
  if(mode==="repair"){
    const kept=[];
    state.schedule.forEach(e=>{
      if(e.locked){kept.push(e);return}
      const a={classId:e.classId,courseId:e.courseId,duration:e.duration||1};
      const reason=hardCheck(kept,a,e.day,e.period,e.roomId,[]);
      if(!reason)kept.push(e);
    });
    state.schedule=kept;
  }else if(mode==="manual"){
    state.schedule=state.schedule.filter(e=>e.locked);
  }else{
    state.schedule=state.schedule.filter(e=>e.locked&&mode!=="fast");
  }
  const acts=activityList(source).sort((a,b)=>b.duration-a.duration||deterministicNoise(a.index+trial*17)-deterministicNoise(b.index+trial*17));
  const placedIds=new Set();
  let unscheduled=[];
  for(const a of acts){
    if(placedIds.has(a.id))continue;
    const c=source.courses.find(x=>x.id===a.courseId);if(!c)continue;
    const rooms=source.rooms.filter(r=>roomFits(source,r.id,a.classId,a.courseId));
    let candidates=[];
    source.settings.days.forEach(day=>{for(let p=0;p<source.settings.periods;p++){
      if(source.settings.breaks.includes(p))continue;
      for(const r of rooms){
        const reason=hardCheck(state,a,day,p,r.id);
        if(!reason){const temp={id:uid("SCH"),day,period:p,courseId:a.courseId,facultyId:c.faculty,roomId:r.id,classId:a.classId,duration:a.duration,locked:false,activityId:a.id};
          const cost=softPenalty(state,temp,trial)+(mode==="fast"?deterministicNoise(p+trial):0)+(mode==="best"?deterministicNoise(p*19+trial)*0.15:deterministicNoise(p*31+trial)*1.1);
          candidates.push({temp,cost});
        }
      }
    }});
    candidates.sort((x,y)=>x.cost-y.cost);
    if(candidates[0]){
      state.schedule.push(candidates[0].temp);
      if(a.duration===2)state.schedule.push(Object.assign({},candidates[0].temp,{id:uid("SCH"),period:a.period+1,activityId:a.id}));
      placedIds.add(a.id);
    }else unscheduled.push({activity:a,reason:"No feasible day/period/room combination"});
  }
  // remove duplicate activity rows for 2-period labs generated above if validation produced issue
  const score=scheduleScore(state);
  return {state,score,unscheduled};
}

function preflightData(state=db){
  const issues=[],warnings=[];
  if(!state.settings.days.length)issues.push("No working days configured.");
  if(!state.settings.periods)issues.push("No periods configured.");
  if(!state.classes.length)issues.push("No classes configured.");
  if(!state.courses.length)issues.push("No courses configured.");
  if(!state.faculty.length)issues.push("No faculty records configured.");
  if(!state.rooms.length)issues.push("No rooms/labs configured.");
  state.classes.forEach(c=>{if((c.strength||0)<=0)warnings.push(c.name+" has no student strength.");if(!c.department)warnings.push(c.name+" has no department.")});
  state.courses.forEach(c=>{
    if(!state.faculty.some(f=>f.id===c.faculty))issues.push(c.code+" has no valid faculty.");
    if(!state.courses.includes(c))issues.push("Invalid course record.");
    if(!arr(c.classIds).length)issues.push(c.code+" has no class offering.");
  });
  state.rooms.forEach(r=>{if(r.capacity<=0)warnings.push(r.name+" has invalid capacity.")});
  const totalRequired=activityList(state).length;
  const available=state.classes.length*state.settings.days.length*(state.settings.periods-state.settings.breaks.length);
  if(totalRequired>available)issues.push("Required teaching activities exceed available class slots.");
  return {issues,warnings,totalRequired,available};
}
function preflight(){
  const d=preflightData(), conflicts=allConflicts(db), coverage=[];
  db.classes.forEach(cl=>{
    db.courses.filter(cr=>arr(cr.classIds).includes(cl.id)).forEach(cr=>{
      const need=courseSessions(cr), got=db.schedule.filter(e=>e.classId===cl.id&&e.courseId===cr.id).length;
      const requiredRows=cr.lab?need*2:need;
      if(got<requiredRows)coverage.push(cl.name+" / "+cr.code+" needs "+requiredRows+" scheduled period(s); "+got+" currently placed.");
    });
  });
  return {d,conflicts,coverage,ok:d.issues.length===0&&conflicts.length===0&&coverage.length===0};
}
function renderShareHistory(){
  const box=q("shareHistory");if(!box)return;
  const active=db.shareLinks.filter(x=>x.active!==false);
  const revoked=db.shareLinks.filter(x=>x.active===false);
  box.innerHTML=(active.length?"<div class='share-history-title'>Active share links</div>"+active.slice(0,10).map(s=>"<div class='list-row'><div><b>"+esc(s.scope)+" · "+esc(s.version)+"</b><small>"+new Date(s.at).toLocaleString()+"</small></div><button class='btn small' data-revoke-share='"+s.id+"'>Revoke record</button></div>").join(""):"")+
    (revoked.length?"<div class='share-history-title revoked'>Revoked records</div>"+revoked.slice(0,5).map(s=>"<div class='list-row'><div><b>"+esc(s.scope)+" · "+esc(s.version)+"</b><small>Revoked</small></div></div>").join(""):"");
}
function renderImport(){
  if(!q("importSummary"))return;
  if(!window.__importRows){q("importSummary").innerHTML="<div class='empty-state'><strong>No workbook loaded.</strong><span>Upload an Excel file to begin.</span></div>";q("importPreview").innerHTML="";q("applyImport").disabled=true;return}
  const x=window.__importRows;const keys=Object.keys(x);let total=0,valid=0,errors=[];
  keys.forEach(k=>{x[k].rows.forEach((row,i)=>{total++;if(row.__error)errors.push(k+" row "+(i+2)+": "+row.__error);else valid++})});
  q("importSummary").innerHTML="<div class='preflight-summary'><div class='preflight-kpi good'><strong>"+valid+"</strong><span>valid rows</span></div><div class='preflight-kpi "+(errors.length?"warning":"good")+"'><strong>"+errors.length+"</strong><span>errors</span></div><div class='preflight-kpi neutral'><strong>"+total+"</strong><span>rows detected</span></div></div>"+(errors.length?errors.slice(0,20).map(e=>"<div class='issue-row'><span class='issue-dot'></span><span>"+esc(e)+"</span></div>").join(""):"<div class='check good'><b>Workbook is ready</b><span>Only valid rows will be imported.</span></div>");
  q("importPreview").innerHTML=keys.map(k=>"<div class='import-sheet'><div class='import-sheet-head'><b>"+esc(k)+"</b><span>"+x[k].rows.length+" row(s)</span></div><div class='table-wrap'><table><thead><tr>"+(x[k].headers||[]).map(h=>"<th>"+esc(h)+"</th>").join("")+"</tr></thead><tbody>"+x[k].rows.slice(0,12).map(r=>"<tr>"+(x[k].headers||[]).map(h=>"<td>"+esc(r[h]??"")+"</td>").join("")+"</tr>").join("")+"</tbody></table></div></div>").join("");
  q("applyImport").disabled=valid===0;
}
function normalizeHeader(h){return String(h||"").trim().toLowerCase().replace(/[^a-z0-9]+/g,"")}
function readImportFile(file){
  if(!window.XLSX)return alert("Excel library unavailable.");
  const reader=new FileReader();reader.onload=()=>{
    try{
      const wb=XLSX.read(reader.result,{type:"array"});
      const wanted=["Departments","Programs","Classes","Faculty","Rooms","Courses"];
      const out={};
      wb.SheetNames.forEach(name=>{
        const mapped=wanted.find(w=>normalizeHeader(w)===normalizeHeader(name))||name;
        const sheet=wb.Sheets[name];const rows=XLSX.utils.sheet_to_json(sheet,{defval:""});const headers=rows.length?Object.keys(rows[0]):[];
        out[mapped]={headers,rows:rows.map(raw=>{
          const row={};headers.forEach(h=>row[h]=raw[h]);
          const code=(row.Code||row.code||"").toString().trim();
          if((mapped==="Departments"||mapped==="Programs"||mapped==="Classes"||mapped==="Faculty"||mapped==="Rooms"||mapped==="Courses")&&!((row.Name||row.name||"").toString().trim()||code))row.__error="Name or Code is required.";
          return row;
        })};
      });
      window.__importRows=out;renderImport();
    }catch(e){alert("Import parse failed: "+e.message)}
  };reader.readAsArrayBuffer(file);
}
function applyImport(){
  const x=window.__importRows;if(!x)return;let count=0;
  (x.Departments?.rows||[]).forEach(r=>{if(r.__error)return;db.departments.push({id:uid("DEP"),name:r.Name||r.name||"",code:(r.Code||r.code||uid("DEP")).toString().toUpperCase()});count++});
  (x.Programs?.rows||[]).forEach(r=>{if(r.__error)return;db.programs.push({id:uid("PRG"),name:r.Name||r.name||"",department:r.DepartmentId||r.department||db.departments[0]?.id||""});count++});
  (x.Classes?.rows||[]).forEach(r=>{if(r.__error)return;db.classes.push({id:uid("CLS"),name:r.Name||r.name||"Imported Class",section:r.Section||r.section||"",department:r.DepartmentId||r.department||db.departments[0]?.id||"",program:r.ProgramId||r.program||"",semester:r.SemesterId||r.semester||db.semesters[0]?.id||"",strength:+(r.Strength||r.strength||60),incharge:r.Incharge||r.incharge||""});count++});
  (x.Faculty?.rows||[]).forEach(r=>{if(r.__error)return;db.faculty.push({id:uid("FAC"),name:r.Name||r.name||"",designation:r.Designation||r.designation||"Assistant Professor",department:r.DepartmentId||r.department||db.departments[0]?.id||"",maxDay:+(r.MaxDay||r.maxDay||4),maxWeek:+(r.MaxWeek||r.maxWeek||18)});count++});
  (x.Rooms?.rows||[]).forEach(r=>{if(r.__error)return;const type=r.Type||r.type||"Classroom";db.rooms.push({id:uid("ROOM"),name:r.Name||r.name||"",code:(r.Code||r.code||uid("ROOM")).toString().toUpperCase(),type,capacity:+(r.Capacity||r.capacity||60),building:r.Building||r.building||"",floor:+(r.Floor||r.floor||1),features:String(r.Features||r.features||"").split(",").map(s=>s.trim()).filter(Boolean),lab:type==="Lab"});count++});
  (x.Courses?.rows||[]).forEach(r=>{if(r.__error)return;db.courses.push({id:uid("CRS"),code:(r.Code||r.code||uid("CRS")).toString().toUpperCase(),name:r.Name||r.name||"",type:r.Type||r.type||"Theory",credits:+(r.Credits||r.credits||0),l:+(r.L||r.l||0),t:+(r.T||r.t||0),p:+(r.P||r.p||0),faculty:r.FacultyId||r.faculty||"",room:r.RoomId||r.room||"",classIds:String(r.ClassIds||r.classIds||"").split(",").map(s=>s.trim()).filter(Boolean)});count++});
  log("Excel import applied",count+" rows");window.__importRows=null;save();navigate("master");
}
function downloadImportTemplate(){
  if(!window.XLSX)return alert("Excel library unavailable.");
  const wb=XLSX.utils.book_new();
  [["Name","Code"]].forEach((h)=>XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet([h]),"Departments"));
  [["Name","DepartmentId"]].forEach(h=>XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet([h]),"Programs"));
  XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet([["Name","Section","DepartmentId","ProgramId","SemesterId","Strength","Incharge"]]),"Classes");
  XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet([["Name","Designation","DepartmentId","MaxDay","MaxWeek"]]),"Faculty");
  XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet([["Name","Code","Type","Capacity","Building","Floor","Features"]]),"Rooms");
  XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet([["Code","Name","Type","Credits","L","T","P","FacultyId","RoomId","ClassIds"]]),"Courses");
  XLSX.writeFile(wb,"unischedule-import-template.xlsx");
}
function exportAction(type){if(type==="pdf")return exportPDF();if(type==="excel")return exportExcel();if(type==="docx")return exportDOCX();if(type==="csv")return exportCSV();if(type==="ics")return exportICS();if(type==="print")return printReport();if(type==="json")return backup()}
function exportICS(){
  const lines=["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//UniSchedule//Academic Timetable//EN"];
  db.schedule.slice().sort((a,b)=>a.day.localeCompare(b.day)||a.period-b.period).forEach(e=>{
    const d=findCourse(e.courseId),r=findRoom(e.roomId),c=findClass(e.classId);lines.push("BEGIN:VEVENT");lines.push("UID:"+e.id+"@unischedule");lines.push("SUMMARY:"+String(d?.code||"")+" - "+String(d?.name||"").replace(/[\n,;]/g," "));lines.push("DESCRIPTION:"+String(c?.name||"")+" | "+String(findFaculty(e.facultyId)?.name||"")+" | "+String(r?.name||"").replace(/[\n,;]/g," "));lines.push("DTSTART:"+icsStamp(e.day,e.period));lines.push("DTEND:"+icsStamp(e.day,e.period+(e.duration||1)));lines.push("END:VEVENT");
  });
  lines.push("END:VCALENDAR");download("unischedule-timetable.ics",lines.join("\r\n"),"text/calendar");
}
function icsStamp(day,p){
  const index=db.settings.days.indexOf(day);const base=new Date();const diff=(index<0?0:index)-((base.getDay()+6)%7);
  const d=new Date(base);d.setDate(base.getDate()+diff);const t=timeSlots()[p]||{start:"09:00"};const [h,m]=t.start.split(":").map(Number);
  d.setHours(h,m,0,0);return d.toISOString().replace(/[-:]/g,"").replace(/\.\d{3}Z$/,"Z");
}
async function exportDOCX(){
  if(!window.docx)return alert("DOCX library unavailable.");
  const {Document,Paragraph,TextRun,Packer}=window.docx;
  const children=[new Paragraph({children:[new TextRun({text:db.organization.name,bold:true,size:28})]}),new Paragraph({children:[new TextRun({text:db.settings.title,size:20})]})];
  db.classes.forEach(cl=>{children.push(new Paragraph({children:[new TextRun({text:cl.name,bold:true,size:22})]}));db.settings.days.forEach(day=>{const cells=[];for(let p=0;p<db.settings.periods;p++){if(currentBreakType(p)){cells.push("P"+(p+1)+": "+currentBreakType(p));continue}const e=entryAt(db,day,p,cl.id);if(e)cells.push("P"+(p+1)+" "+findCourse(e.courseId)?.code+" / "+findRoom(e.roomId)?.name);};children.push(new Paragraph(dayLabel(day)+": "+cells.join(" | ")))})});
  const doc=new Document({sections:[{children}]});const blob=await Packer.toBlob(doc);const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="unischedule-timetable.docx";a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}
function render(){
  syncHeader();renderCurrentPage();
}
function syncHeader(){
  q("tenantName").textContent=db.organization.name;q("tenantCode").textContent=db.organization.code+" · PRIVATE WORKSPACE";
  q("termLabel").textContent=db.settings.year+" · "+db.settings.semester;
}
function navigate(id){
  document.querySelectorAll(".page").forEach(p=>p.classList.toggle("active",p.id===id));
  document.querySelectorAll(".nav").forEach(n=>n.classList.toggle("active",n.dataset.page===id));
  q("pageTitle").textContent=({dashboard:"Dashboard",master:"Prepare Data",constraints:"Constraints & Preferences",generate:"Build Timetable",preflight:"Preflight Validation",publish:"Publish & Share",courses:"Courses & Activities",classes:"Classes & Sections",faculty:"Faculty Records",rooms:"Rooms & Labs",calendar:"Calendar & Breaks",compare:"Solution Compare",scenarios:"What-if Scenarios",reports:"Reports & Export",versions:"Versions & History",intelligence:"Scheduling Intelligence",settings:"Institution Settings"}[id]||"UniSchedule");
  renderCurrentPage();
}
function renderCurrentPage(){
  renderDashboard();renderMaster();renderConstraints();renderGenerate();renderPreflight();renderPublish();renderCourses();renderClasses();renderFaculty();renderRooms();renderCalendar();renderCompare();renderScenarios();renderReports();renderVersions();renderIntelligence();renderSettings();renderImport();renderWorkflow();
}
function renderWorkflow(){
  const pf=preflight(), stages=[true,db.settings.days.length>0&&db.faculty.length>0,db.schedule.length>0,pf.ok,db.versions.some(v=>v.status==="Published")];
  let done=stages.filter(Boolean).length,pct=Math.round(done/5*100);
  if(q("progressText"))q("progressText").textContent=pct+"% complete";
  if(q("progressBar"))q("progressBar").style.width=pct+"%";
  const labels=[["01","Prepare data","Academic structure, K section & resources","master"],["02","Set constraints","Availability & preferences","constraints"],["03","Build timetable","Generate, lock, edit & repair","generate"],["04","Validate","Preflight, conflicts & coverage","preflight"],["05","Publish & share","Release, export & view-only link","publish"]];
  if(q("workflow"))q("workflow").innerHTML=labels.map((x,i)=>"<button class='workflow-card "+(stages[i]?"complete ":"")+(!stages[i]&&stages.slice(0,i).every(Boolean)?"next":"")+"' data-go='"+x[3]+"'><b>"+x[0]+"</b><span><strong>"+x[1]+"</strong><small>"+x[2]+"</small></span><em>"+(stages[i]?"DONE":i===done?"NEXT":"")+"</em></button>").join("");
}
function renderDashboard(){
  if(!q("dashboardStats"))return;
  const sc=scheduleScore(db);
  q("heroScore").textContent=sc.score+"%";
  q("dashboardStats").innerHTML=[["Classes",db.classes.length],["Courses",db.courses.length],["Faculty",db.faculty.length],["Rooms",db.rooms.length],["Scheduled",db.schedule.length],["Hard conflicts",sc.hardN]].map(x=>"<div class='stat'><span>"+x[0]+"</span><strong>"+x[1]+"</strong></div>").join("");
  const cls=db.classes[0];q("dashboardTable").innerHTML=cls?tableForClass(cls.id,false):"<div class='empty-state'><strong>No class yet.</strong></div>";
  const pf=preflight();q("dashboardChecks").innerHTML=[
    "<div class='check "+(pf.d.issues.length?"bad":"good")+"'><b>Data readiness</b><span>"+(pf.d.issues.length?pf.d.issues.length+" issue(s)":"Master data ready")+"</span></div>",
    "<div class='check "+(pf.conflicts.length?"bad":"good")+"'><b>Hard conflicts</b><span>"+pf.conflicts.length+"</span></div>",
    "<div class='check "+(pf.coverage.length?"bad":"good")+"'><b>Coverage</b><span>"+(pf.coverage.length?pf.coverage.length+" activity gaps":"Complete")+"</span></div>",
    "<div class='check'><b>Calendar</b><span>"+db.settings.days.length+" days · "+db.settings.periods+" periods · "+db.settings.shortBreaks.length+" short · "+db.settings.lunchBreaks.length+" lunch</span></div>"
  ].join("");
  const latest=db.versions.find(v=>v.status==="Published");q("releaseTitle").textContent=latest?latest.name:"Draft timetable";q("releaseBadge").textContent=latest?"PUBLISHED":"DRAFT";q("releaseBadge").className="badge "+(latest?"good":"neutral");
}
function tableForClass(classId,editable=false,state=db){
  const ts=timeSlots(state),h=["<table class='timetable'><thead><tr><th>DAY</th>"];
  ts.forEach(t=>h.push("<th>"+t.start+"<br>"+t.end+"</th>"));h.push("</tr></thead><tbody>");
  state.settings.days.forEach(d=>{h.push("<tr><th>"+dayLabel(d)+"</th>");for(let p=0;p<state.settings.periods;p++){
    const bt=state.settings.shortBreaks.includes(p)?"SHORT BREAK":state.settings.lunchBreaks.includes(p)?"LUNCH BREAK":"";
    if(bt){h.push("<td class='slot break'><strong>"+bt+"</strong></td>");continue}
    const e=entryAt(state,d,p,classId);
    if(e){const c=state.courses.find(x=>x.id===e.courseId),f=state.faculty.find(x=>x.id===e.facultyId),r=state.rooms.find(x=>x.id===e.roomId);h.push("<td class='slot "+(c?.lab?"lab ":"")+" "+(e.locked?"locked ":"")+(editable?"editable":"")+"' "+(editable?"data-slot='"+e.id+"'":"")+"><b>"+esc(c?.code||"")+"</b><span>"+esc(c?.name||"")+"</span><small>"+esc(f?.name||"")+" · "+esc(r?.name||"")+(e.locked?" · LOCKED":"")+"</small></td>")}
    else h.push("<td class='slot empty "+(editable?"editable":"")+"' "+(editable?"data-day='"+d+"' data-period='"+p+"'":"")+"><span>+</span></td>");
  }h.push("</tr>")});
  h.push("</tbody></table>");return h.join("");
}
function renderMaster(){
  q("setUniversity").value=db.settings.university;q("setOrgCode").value=db.organization.code;q("setYear").value=db.settings.year;q("setSemester").value=db.settings.semester;q("setSchool").value=db.settings.school;q("setIncharge").value=db.settings.incharge;
  q("academicHierarchy").innerHTML="<div class='tree-row'><b>"+esc(db.organization.name)+"</b><span>Campus · "+esc(db.settings.school)+"</span></div>"+db.departments.map(d=>"<div class='tree-row indent'><b>"+esc(d.name)+"</b><span>"+esc(d.code)+" · "+db.classes.filter(c=>c.department===d.id).length+" class(es)</span></div>").join("")+db.programs.map(p=>"<div class='tree-row indent2'><b>"+esc(p.name)+"</b><span>Program</span></div>").join("");
  q("departmentList").innerHTML=db.departments.map(d=>"<div class='list-row'><div><b>"+esc(d.name)+"</b><small>"+esc(d.code)+" · "+db.programs.filter(p=>p.department===d.id).length+" program(s)</small></div><button class='btn small' data-edit-dept='"+d.id+"'>Edit</button></div>").join("");
  q("classList").innerHTML=db.classes.map(c=>"<div class='list-row'><div><b>"+esc(c.name)+"</b><small>Section "+esc(c.section)+" · "+c.strength+" students</small></div><button class='btn small' data-edit-class='"+c.id+"'>Edit</button></div>").join("");
  q("facultyMiniList").innerHTML=db.faculty.map(f=>"<div class='list-row'><div><b>"+esc(f.name)+"</b><small>"+esc(f.designation)+" · "+esc(f.department)+"</small></div></div>").join("");
  q("roomMiniList").innerHTML=db.rooms.map(r=>"<div class='list-row'><div><b>"+esc(r.name)+"</b><small>"+r.capacity+" seats · "+esc(r.type)+" · "+esc(r.building)+"</small></div></div>").join("");
}
function renderConstraints(){
  const wrap=q("availabilityGrid");if(!wrap)return;
  let h="<div class='table-wrap'><table class='availability'><thead><tr><th>Faculty</th>"+db.settings.days.map(d=>"<th>"+dayLabel(d)+"</th>").join("")+"</tr></thead><tbody>";
  db.faculty.forEach(f=>{h+="<tr><th>"+esc(f.name)+"</th>";db.settings.days.forEach(d=>{let blocked=db.settings.periods?db.availability.filter(a=>a.faculty===f.id&&(a.day===d||a.day==="ALL")&&a.blocked).length:0;h+="<td><button class='availability-cell "+(blocked?"blocked":"")+"' data-avail-f='"+f.id+"' data-avail-d='"+d+"'>"+blocked+" blocked</button></td>"});h+="</tr>"});h+="</tbody></table></div>";
  wrap.innerHTML=h;
  wrap.insertAdjacentHTML("beforebegin","<div class='constraint-actions'><button class='btn small' id='addRoomBlockInline'>+ Room availability rule</button><button class='btn small' id='addClassBlockInline'>+ Class restriction</button></div>");
  ["classGaps","facultyGaps","spread","rooms","edges","workload"].forEach(k=>{const el=q("pref"+k.charAt(0).toUpperCase()+k.slice(1)),v=q("pref"+k.charAt(0).toUpperCase()+k.slice(1)+"Val");if(el){el.value=db.preferences[k];if(v)v.textContent=el.value}});
}
function renderGenerate(){
  q("classSelector").innerHTML=db.classes.map(c=>"<option value='"+esc(c.id)+"'>"+esc(c.name)+"</option>").join("");
  const cid=q("classSelector").value||db.classes[0]?.id;if(q("gridTitle"))q("gridTitle").textContent=(findClass(cid)?.name||"Section K")+" timetable";
  q("builderTable").innerHTML=cid?tableForClass(cid,!sharedSnap):"<div class='empty-state'>Add a class first.</div>";
  q("qualityPanel").innerHTML=qualityHTML(scheduleScore(db));
  const acts=activityList(db),uns=acts.filter(a=>db.schedule.filter(e=>e.activityId===a.id).length<(a.duration===2?2:1));
  q("unscheduledList").innerHTML=uns.length?uns.slice(0,25).map(a=>"<div class='issue-row'><b>"+esc(findCourse(a.courseId)?.code)+"</b><span>"+esc(findClass(a.classId)?.name)+" · "+esc(a.type)+" · no feasible slot</span></div>").join(""):"<div class='empty-state'><strong>All activities scheduled.</strong><span>No unscheduled activity is currently detected.</span></div>";
  q("coverageList").innerHTML=db.courses.filter(c=>arr(c.classIds).includes(cid||"")).map(c=>{const need=courseSessions(c),got=db.schedule.filter(e=>e.classId===cid&&e.courseId===c.id).length;return "<div class='coverage-row'><span><b>"+esc(c.code)+"</b><small>"+esc(c.name)+"</small></span><strong>"+Math.min(need,Math.ceil(got/(c.lab?2:1)))+"/"+need+"</strong></div>"}).join("");
}
function qualityHTML(sc){
  return "<div class='quality-grid'><div class='quality-main'><span>QUALITY SCORE</span><strong>"+sc.score+"%</strong><small>"+sc.hardN+" hard conflicts · "+sc.softPenalty+" soft penalty</small></div><div class='quality-item'><b>"+sc.classGap+"</b><span>class gap points</span></div><div class='quality-item'><b>"+sc.facultyGap+"</b><span>faculty gap points</span></div><div class='quality-item'><b>"+sc.spread+"</b><span>same-day repeats</span></div><div class='quality-item'><b>"+sc.edge+"</b><span>edge-period uses</span></div></div>";
}
function renderPreflight(){
  const pf=preflight();q("preflightSummary").innerHTML=[["DATA",pf.d.issues.length?"REVIEW":"READY",pf.d.issues.length?"bad":"good"],["HARD",pf.conflicts.length?pf.conflicts.length+" CONFLICTS":"0 CONFLICTS",pf.conflicts.length?"bad":"good"],["COVERAGE",pf.coverage.length?pf.coverage.length+" GAPS":"COMPLETE",pf.coverage.length?"bad":"good"]].map(x=>"<div class='preflight-kpi "+x[2]+"'><strong>"+x[1]+"</strong><span>"+x[0]+"</span></div>").join("");
  q("hardReport").innerHTML=pf.conflicts.length?pf.conflicts.map(x=>"<div class='check bad'><b>"+esc(x.type)+" conflict</b><span>"+esc(dayLabel(x.day))+" · Period "+(x.period+1)+"</span></div>").join(""):"<div class='check good'><b>No hard conflicts</b><span>Classes, faculty and rooms are not double-booked.</span></div>";
  q("dataReport").innerHTML=(pf.d.issues.length?pf.d.issues.map(x=>"<div class='check bad'><b>Issue</b><span>"+esc(x)+"</span></div>").join(""):"<div class='check good'><b>Master data ready</b><span>"+pf.d.totalRequired+" required activities · "+pf.d.available+" base class slots</span></div>")+(pf.d.warnings||[]).map(x=>"<div class='check warn'><b>Warning</b><span>"+esc(x)+"</span></div>").join("");
  q("issueReport").innerHTML=pf.coverage.length?pf.coverage.slice(0,40).map(x=>"<div class='issue-row'><span class='issue-dot'></span><span>"+esc(x)+"</span></div>").join(""):"<div class='empty-state'><strong>Validation passed.</strong><span>The current timetable can move to release review.</span></div>";
}
function renderPublish(){
  const latest=db.versions.find(v=>v.status==="Published"),pf=preflight();
  q("publishReadiness").innerHTML=pf.ok?"<div class='release-ready'><span class='status-dot'></span><div><b>Ready to publish</b><span>0 hard conflicts and complete activity coverage.</span></div></div>":"<div class='release-blocked'><span class='status-dot'></span><div><b>Publishing blocked</b><span>Resolve preflight issues before releasing this timetable.</span></div></div>";
  q("publishBtn").disabled=!pf.ok;
  q("copyShare").disabled=!latest;
  q("publishedList").innerHTML=db.versions.filter(v=>v.status==="Published").map(v=>"<div class='list-row'><div><b>"+esc(v.name)+"</b><small>"+new Date(v.at).toLocaleString()+" · "+v.schedule.length+" entries</small></div><span class='release-badge'>PUBLISHED</span></div>").join("")||"<div class='empty-state'><strong>No published release.</strong></div>";renderShareHistory();
}
function renderCourses(){
  q("combinedList").innerHTML=db.combinedGroups.map(g=>"<div class='list-row'><div><b>"+esc(g.name)+"</b><small>"+g.classIds.map(id=>esc(findClass(id)?.section||id)).join(" + ")+" · "+esc(findRoom(g.roomId)?.name||"")+"</small></div></div>").join("")||"<div class='empty-state'><strong>No combined groups.</strong><span>Use this for common lectures or seminars.</span></div>";
  q("electiveList").innerHTML=db.electives.map(g=>"<div class='list-row'><div><b>"+esc(g.name)+"</b><small>"+g.classIds.length+" class(es) · "+g.courseIds.length+" option(s)</small></div></div>").join("")||"<div class='empty-state'><strong>No elective groups.</strong><span>Create one when students choose between common course options.</span></div>";
  q("coursesTable").innerHTML="<table><thead><tr><th>Code</th><th>Course</th><th>Type</th><th>L</th><th>T</th><th>P</th><th>Pattern</th><th>Faculty</th><th>Room</th><th>Classes</th></tr></thead><tbody>"+db.courses.map(c=>"<tr><td><b>"+esc(c.code)+"</b></td><td>"+esc(c.name)+"</td><td>"+esc(c.type||"Theory")+"</td><td>"+(c.l||0)+"</td><td>"+(c.t||0)+"</td><td>"+(c.p||0)+"</td><td>"+esc(c.sessionPattern||"—")+"</td><td>"+esc(findFaculty(c.faculty)?.name||"—")+"</td><td>"+esc(findRoom(c.room)?.name||"—")+"</td><td>"+arr(c.classIds).map(id=>esc(findClass(id)?.section||id)).join(", ")+"</td></tr>").join("")+"</tbody></table>";
}
function renderClasses(){
  q("classesTable").innerHTML="<table><thead><tr><th>Class</th><th>Section</th><th>Program</th><th>Semester</th><th>Strength</th><th>Department</th></tr></thead><tbody>"+db.classes.map(c=>"<tr><td><b>"+esc(c.name)+"</b></td><td>"+esc(c.section)+"</td><td>"+esc(db.programs.find(p=>p.id===c.program)?.name||c.program||"—")+"</td><td>"+esc(db.semesters.find(s=>s.id===c.semester)?.name||c.semester||"—")+"</td><td>"+c.strength+"</td><td>"+esc(c.department)+"</td></tr>").join("")+"</tbody></table>";
}
function renderFaculty(){q("facultyTable").innerHTML="<table><thead><tr><th>Faculty</th><th>Designation</th><th>Department</th><th>Max/day</th><th>Max/week</th><th>Scheduled</th></tr></thead><tbody>"+db.faculty.map(f=>"<tr><td><b>"+esc(f.name)+"</b></td><td>"+esc(f.designation||"—")+"</td><td>"+esc(f.department)+"</td><td>"+(f.maxDay||0)+"</td><td>"+(f.maxWeek||0)+"</td><td>"+db.schedule.filter(e=>e.facultyId===f.id).length+"</td></tr>").join("")+"</tbody></table>"}
function renderRooms(){q("roomsTable").innerHTML="<table><thead><tr><th>Room</th><th>Type</th><th>Capacity</th><th>Building</th><th>Features</th><th>Sessions</th></tr></thead><tbody>"+db.rooms.map(r=>"<tr><td><b>"+esc(r.name)+"</b></td><td>"+esc(r.type)+"</td><td>"+r.capacity+"</td><td>"+esc(r.building)+"</td><td>"+arr(r.features).map(esc).join(", ")+"</td><td>"+db.schedule.filter(e=>e.roomId===r.id).length+"</td></tr>").join("")+"</tbody></table>"}
function breakSelectors(){
  const sc=+q("shortBreakCount").value||0,lc=+q("lunchBreakCount").value||0;
  const opts="<option value='-1'>None</option>"+Array.from({length:db.settings.periods},(_,i)=>"<option value='"+i+"'>Period "+(i+1)+"</option>").join("");
  q("shortBreakSelectors").innerHTML=Array.from({length:sc},(_,i)=>"<label>Short Break "+(i+1)+"<select data-sb='"+i+"'>"+opts+"</select></label>").join("")||"<div class='break-empty'>None</div>";
  q("lunchBreakSelectors").innerHTML=Array.from({length:lc},(_,i)=>"<label>Lunch Break "+(i+1)+"<select data-lb='"+i+"'>"+opts+"</select></label>").join("")||"<div class='break-empty'>None</div>";
  q("shortBreakSelectors").querySelectorAll("select").forEach((el,i)=>el.value=String(db.settings.shortBreaks[i]??-1));
  q("lunchBreakSelectors").querySelectorAll("select").forEach((el,i)=>el.value=String(db.settings.lunchBreaks[i]??-1));
}
function renderCalendar(){
  q("calendarDays").value=db.settings.days.join(",");
  q("calendarPeriods").value=db.settings.periods;q("calendarStart").value=db.settings.start;q("calendarDuration").value=db.settings.duration;
  q("shortBreakCount").value=db.settings.shortBreaks.length;q("lunchBreakCount").value=db.settings.lunchBreaks.length;breakSelectors();
  q("calendarPreview").innerHTML="<table><thead><tr><th>Period</th>"+timeSlots().map(t=>"<th>"+t.start+"–"+t.end+"</th>").join("")+"</tr></thead><tbody><tr><th>Blocks</th>"+timeSlots().map((t,i)=>{let x=currentBreakType(i);return "<td class='"+(x?"break":"")+"'>"+(x||"Teaching")+"</td>"}).join("")+"</tr></tbody></table>";
}
function renderCompare(){
  q("solutionCards").innerHTML=solutionCandidates.length?solutionCandidates.map((s,i)=>"<div class='solution-card "+(i===0?"selected":"")+"'><span>OPTION "+String.fromCharCode(65+i)+"</span><strong>"+s.score.score+"%</strong><small>"+s.score.hardN+" hard · "+s.unscheduled.length+" unscheduled</small><button class='btn primary' data-apply-solution='"+i+"'>Use this solution</button></div>").join(""):"<div class='empty-state'><strong>No candidates yet.</strong><span>Generate 3 solutions from the Build Timetable stage.</span></div>";
  q("comparisonTable").innerHTML=solutionCandidates.length?"<table><thead><tr><th>Metric</th>"+solutionCandidates.map((_,i)=>"<th>Option "+String.fromCharCode(65+i)+"</th>").join("")+"</tr></thead><tbody>"+["score","hardN","softPenalty","classGap","facultyGap","spread"].map(k=>"<tr><td>"+esc(k)+"</td>"+solutionCandidates.map(s=>"<td>"+s.score[k]+"</td>").join("")+"</tr>").join("")+"</tbody></table>":"<div class='empty-state'>Generate candidates to compare them.</div>";
}
function renderScenarios(){
  q("scenarioStrengthVal").textContent=q("scenarioStrength").value+"%";
}
function renderReports(){
  const pf=preflight(),sc=scheduleScore(db);
  q("reportClass").innerHTML=db.classes.map(c=>"<div class='list-row'><div><b>"+esc(c.name)+"</b><small>"+db.schedule.filter(e=>e.classId===c.id).length+" scheduled entries</small></div><button class='btn small' data-report-class='"+c.id+"'>View</button></div>").join("");
  q("reportFaculty").innerHTML=db.faculty.map(f=>"<div class='list-row'><div><b>"+esc(f.name)+"</b><small>"+db.schedule.filter(e=>e.facultyId===f.id).length+" sessions</small></div><span>"+Math.round((db.schedule.filter(e=>e.facultyId===f.id).length/Math.max(1,f.maxWeek||18))*100)+"%</span></div>").join("");
  q("reportRooms").innerHTML=db.rooms.map(r=>"<div class='list-row'><div><b>"+esc(r.name)+"</b><small>"+db.schedule.filter(e=>e.roomId===r.id).length+" sessions · "+r.capacity+" seats</small></div><span>"+Math.round(db.schedule.filter(e=>e.roomId===r.id).length/Math.max(1,db.settings.days.length*(db.settings.periods-db.settings.breaks.length))*100)+"%</span></div>").join("");
  q("reportQuality").innerHTML="<div class='quality-list'><span>Quality score <b>"+sc.score+"%</b></span><span>Hard conflicts <b>"+sc.hardN+"</b></span><span>Coverage gaps <b>"+pf.coverage.length+"</b></span><span>Unscheduled activities <b>"+activityList(db).filter(a=>!db.schedule.some(e=>e.activityId===a.id)).length+"</b></span></div>";
}
function renderVersions(){
  q("versionsTable").innerHTML=db.versions.length?"<table><thead><tr><th>Version</th><th>Status</th><th>Created</th><th>Score</th><th>Entries</th><th>Action</th></tr></thead><tbody>"+db.versions.map(v=>"<tr><td><b>"+esc(v.name)+"</b></td><td><span class='release-badge'>"+esc(v.status)+"</span></td><td>"+new Date(v.at).toLocaleString()+"</td><td>"+(v.score||"—")+"</td><td>"+v.schedule.length+"</td><td><button class='btn small' data-restore-version='"+v.id+"'>Restore</button></td></tr>").join("")+"</tbody></table>":"<div class='empty-state'><strong>No versions saved.</strong></div>";
}
function renderIntelligence(){
  const sc=scheduleScore(db),pf=preflight();q("qualityBreakdown").innerHTML=qualityHTML(sc);
  const rec=[];
  if(sc.hardN)rec.push("Resolve "+sc.hardN+" hard conflict(s) before publishing.");
  if(sc.classGap>8)rec.push("Spread class sessions to reduce student gaps.");
  if(sc.facultyGap>8)rec.push("Rebalance faculty assignments to reduce idle gaps.");
  if(sc.spread>3)rec.push("Move repeated course sessions to different days.");
  if(sc.edge>3)rec.push("Avoid first/last periods where possible.");
  if(pf.coverage.length)rec.push("Complete unscheduled activities: "+pf.coverage.slice(0,2).join(" · "));
  if(!rec.length)rec.push("The current timetable is well balanced. Generate alternatives to explore further improvements.");
  q("insightList").innerHTML=rec.map(x=>"<div class='insight-item'><span>•</span><p>"+esc(x)+"</p></div>").join("");
}
function renderSettings(){
  q("brandName").value=db.branding.name;q("brandCode").value=db.branding.code;q("brandLogo").value=db.branding.logo;q("brandTimezone").value=db.branding.timezone;
}
function openModal(title,html,submit){
  q("modalTitle").textContent=title;q("modalForm").innerHTML=html;q("modal").classList.add("open");
  q("modalForm").onsubmit=e=>{e.preventDefault();submit(new FormData(e.target));closeModal()};
}
function closeModal(){q("modal").classList.remove("open")}

function addDepartment(){
  openModal("Add Department","<label>Name<input name='name' required></label><label>Code<input name='code' required></label><div class='modal-actions'><button type='button' onclick='closeModal()'>Cancel</button><button class='btn primary'>Add</button></div>",f=>{db.departments.push({id:uid("DEP"),name:f.get("name"),code:f.get("code").toUpperCase()});log("Department added",f.get("name"));save()})
}
function addProgram(){openModal("Add Program","<label>Name<input name='name' required></label><label>Department<select name='department'>"+db.departments.map(d=>"<option value='"+d.id+"'>"+esc(d.name)+"</option>").join("")+"</select></label><div class='modal-actions'><button type='button' onclick='closeModal()'>Cancel</button><button class='btn primary'>Add</button></div>",f=>{db.programs.push({id:uid("PRG"),name:f.get("name"),department:f.get("department")});log("Program added",f.get("name"));save()})}
function addSection(){openModal("Add Section","<label>Name<input name='name' placeholder='Section K' required></label><label>Code<input name='code' required></label><label>Department<select name='department'>"+db.departments.map(d=>"<option value='"+d.id+"'>"+esc(d.name)+"</option>").join("")+"</select></label><label>Program<select name='program'>"+db.programs.map(p=>"<option value='"+p.id+"'>"+esc(p.name)+"</option>").join("")+"</select></label><label>Strength<input name='strength' type='number' min='1' value='60'></label><div class='modal-actions'><button type='button' onclick='closeModal()'>Cancel</button><button class='btn primary'>Add</button></div>",f=>{const id=uid("SEC"),code=f.get("code").toUpperCase(),obj={id,name:f.get("name"),code,department:f.get("department"),program:f.get("program"),semester:db.semesters[0]?.id||"",strength:+f.get("strength")};db.sections.push(obj);db.classes.push({id:uid("CLS"),name:"B.Tech CSE · "+code,section:code,department:obj.department,program:obj.program,semester:obj.semester,strength:obj.strength,incharge:""});log("Section added",code);save()})}
function addClass(){openModal("Add Class","<label>Class name<input name='name' required></label><label>Section code<input name='section' required></label><label>Department<select name='department'>"+db.departments.map(d=>"<option value='"+d.id+"'>"+esc(d.name)+"</option>").join("")+"</select></label><label>Program<select name='program'>"+db.programs.map(p=>"<option value='"+p.id+"'>"+esc(p.name)+"</option>").join("")+"</select></label><label>Strength<input name='strength' type='number' min='1' value='60'></label><div class='modal-actions'><button type='button' onclick='closeModal()'>Cancel</button><button class='btn primary'>Add</button></div>",f=>{db.classes.push({id:uid("CLS"),name:f.get("name"),section:f.get("section").toUpperCase(),department:f.get("department"),program:f.get("program"),semester:db.semesters[0]?.id||"",strength:+f.get("strength"),incharge:""});log("Class added",f.get("name"));save()})}
function addFaculty(){openModal("Add Faculty","<label>Name<input name='name' required></label><label>Designation<input name='designation' value='Assistant Professor'></label><label>Department<select name='department'>"+db.departments.map(d=>"<option value='"+d.id+"'>"+esc(d.name)+"</option>").join("")+"</select></label><label>Maximum hours/day<input name='maxDay' type='number' value='4'></label><label>Maximum hours/week<input name='maxWeek' type='number' value='18'></label><div class='modal-actions'><button type='button' onclick='closeModal()'>Cancel</button><button class='btn primary'>Add</button></div>",f=>{db.faculty.push({id:uid("FAC"),name:f.get("name"),designation:f.get("designation"),department:f.get("department"),maxDay:+f.get("maxDay"),maxWeek:+f.get("maxWeek")});log("Faculty added",f.get("name"));save()})}
function addRoom(){openModal("Add Room / Lab","<label>Name<input name='name' required></label><label>Code<input name='code' required></label><label>Type<select name='type'><option>Classroom</option><option>Lab</option><option>Seminar Hall</option></select></label><label>Capacity<input name='capacity' type='number' min='1' value='60'></label><label>Building<input name='building' value='Joveena Block'></label><label>Floor<input name='floor' type='number' value='1'></label><label>Features<input name='features' value='projector,smart-board,internet'></label><div class='modal-actions'><button type='button' onclick='closeModal()'>Cancel</button><button class='btn primary'>Add</button></div>",f=>{const type=f.get("type"),r={id:uid("ROOM"),name:f.get("name"),code:f.get("code").toUpperCase(),type,capacity:+f.get("capacity"),building:f.get("building"),floor:+f.get("floor"),features:f.get("features").split(",").map(s=>s.trim()).filter(Boolean),lab:type==="Lab"};db.rooms.push(r);log("Room added",r.name);save()})}
function addCombined(){
  openModal("Create combined class group","<label>Group name<input name='name' placeholder='Common lecture group' required></label><label>Classes<select name='classes' multiple size='5'>"+db.classes.map(c=>"<option value='"+c.id+"'>"+esc(c.name)+"</option>").join("")+"</select></label><label>Shared room<select name='room'>"+db.rooms.map(r=>"<option value='"+r.id+"'>"+esc(r.name)+"</option>").join("")+"</select></label><div class='modal-actions'><button type='button' onclick='closeModal()'>Cancel</button><button class='btn primary'>Create group</button></div>",f=>{const ids=Array.from(q("modalForm").querySelector("[name=classes]").selectedOptions).map(o=>o.value);if(ids.length<2)return alert("Select at least two classes.");db.combinedGroups.push({id:uid("CG"),name:f.get("name"),classIds:ids,roomId:f.get("room")});log("Combined class group created",f.get("name"));save()})
}
function addElective(){
  openModal("Create elective group","<label>Group name<input name='name' placeholder='Open elective group' required></label><label>Classes<select name='classes' multiple size='5'>"+db.classes.map(c=>"<option value='"+c.id+"'>"+esc(c.name)+"</option>").join("")+"</select></label><label>Courses<select name='courses' multiple size='6'>"+db.courses.map(c=>"<option value='"+c.id+"'>"+esc(c.code+" — "+c.name)+"</option>").join("")+"</select></label><div class='modal-actions'><button type='button' onclick='closeModal()'>Cancel</button><button class='btn primary'>Create group</button></div>",f=>{const classes=Array.from(q("modalForm").querySelector("[name=classes]").selectedOptions).map(o=>o.value),courses=Array.from(q("modalForm").querySelector("[name=courses]").selectedOptions).map(o=>o.value);if(classes.length<1||courses.length<2)return alert("Select a class and at least two elective courses.");db.electives.push({id:uid("EL"),name:f.get("name"),classIds:classes,courseIds:courses});log("Elective group created",f.get("name"));save()})
}
function addCourse(){openModal("Add Course / Activity","<label>Course code<input name='code' required></label><label>Course name<input name='name' required></label><label>Type<select name='type'><option>Theory</option><option>Lab</option><option>Tutorial</option><option>Elective</option></select></label><div class='mini-form'><label>L<input name='l' type='number' min='0' value='3'></label><label>T<input name='t' type='number' min='0' value='0'></label><label>P<input name='p' type='number' min='0' value='0'></label><label>Credits<input name='credits' type='number' min='0' value='3'></label></div><label>Faculty<select name='faculty'>"+db.faculty.map(f=>"<option value='"+f.id+"'>"+esc(f.name)+"</option>").join("")+"</select></label><label>Room<select name='room'>"+db.rooms.map(r=>"<option value='"+r.id+"'>"+esc(r.name)+"</option>").join("")+"</select></label><label>Classes<select name='classIds' multiple size='4'>"+db.classes.map(c=>"<option selected value='"+c.id+"'>"+esc(c.name)+"</option>").join("")+"</select></label><div class='modal-actions'><button type='button' onclick='closeModal()'>Cancel</button><button class='btn primary'>Add</button></div>",f=>{const type=f.get("type"),classes=Array.from(q("modalForm").querySelector("[name=classIds]").selectedOptions).map(o=>o.value);db.courses.push({id:uid("CRS"),code:f.get("code").toUpperCase(),name:f.get("name"),type,l:+f.get("l"),t:+f.get("t"),p:+f.get("p"),credits:+f.get("credits"),faculty:f.get("faculty"),room:f.get("room"),lab:type==="Lab",classIds:classes,sessionPattern:classes.length?"Auto":""});log("Course added",f.get("code"));save()})}

function editSlotElement(el){
  if(el.dataset.slot){
    const e=db.schedule.find(s=>s.id===el.dataset.slot);if(!e)return;
    const c=findCourse(e.courseId),f=findFaculty(e.facultyId);
    openModal("Timetable Entry","<div class='selected-entry'><b>"+esc(c?.code)+"</b><span>"+esc(c?.name)+"</span><small>"+dayLabel(e.day)+" · Period "+(e.period+1)+"</small></div><label>Course<select name='course'>"+db.courses.map(x=>"<option value='"+x.id+"'>"+esc(x.code+" — "+x.name)+"</option>").join("")+"</select></label><label>Faculty<select name='faculty'>"+db.faculty.map(x=>"<option value='"+x.id+"'>"+esc(x.name)+"</option>").join("")+"</select></label><label>Room<select name='room'>"+db.rooms.map(x=>"<option value='"+x.id+"'>"+esc(x.name)+"</option>").join("")+"</select></label><label><input name='locked' type='checkbox' "+(e.locked?"checked":"")+"> Lock this assignment</label><div class='modal-actions'><button type='button' onclick='closeModal()'>Cancel</button><button class='btn primary'>Apply</button></div>",fdata=>{e.courseId=fdata.get("course");e.facultyId=fdata.get("faculty");e.roomId=fdata.get("room");e.locked=fdata.get("locked")==="on";log("Timetable entry edited",c?.code||"entry");save()});
    q("modalForm").course.value=c?.id||"";q("modalForm").faculty.value=f?.id||"";q("modalForm").room.value=e.roomId;return;
  }
  if(el.dataset.day){
    openModal("Add timetable entry","<label>Course<select name='course'>"+db.courses.map(c=>"<option value='"+c.id+"'>"+esc(c.code+" — "+c.name)+"</option>").join("")+"</select></label><label>Room<select name='room'>"+db.rooms.map(r=>"<option value='"+r.id+"'>"+esc(r.name)+"</option>").join("")+"</select></label><div class='modal-actions'><button type='button' onclick='closeModal()'>Cancel</button><button class='btn primary'>Add</button></div>",f=>{const cid=q("classSelector").value,course=findCourse(f.get("course")),rid=f.get("room"),a={classId:cid,courseId:course.id,duration:course.lab?2:1};const reason=hardCheck(db,a,el.dataset.day,+el.dataset.period,rid);if(reason){alert(reason);return}db.schedule.push({id:uid("SCH"),day:el.dataset.day,period:+el.dataset.period,courseId:course.id,facultyId:course.faculty,roomId:rid,classId:cid,duration:a.duration,locked:false,activityId:uid("ACTV")});log("Timetable slot added",course.code);save()});
  }
}

function editFacultyAvailability(fid,day){
  const f=findFaculty(fid);if(!f)return;
  const existing=new Set(db.availability.filter(a=>a.faculty===fid&&a.day===day&&a.blocked).map(a=>Number(a.period)));
  const checks=Array.from({length:db.settings.periods},(_,p)=>{
    const bt=currentBreakType(p);
    return "<label class='period-check "+(bt?"disabled":"")+"'><input type='checkbox' name='p' value='"+p+"' "+(existing.has(p)?"checked":"")+" "+(bt?"disabled":"")+"><span>Period "+(p+1)+"</span><small>"+timeSlots()[p].start+"–"+timeSlots()[p].end+(bt?" · "+bt:"")+"</small></label>";
  }).join("");
  openModal("Availability · "+f.name+" · "+dayLabel(day),"<p class='muted'>Checked periods are unavailable to this faculty member.</p><div class='period-check-grid'>"+checks+"</div><div class='modal-actions'><button type='button' onclick='closeModal()'>Cancel</button><button class='btn primary'>Save availability</button></div>",form=>{
    db.availability=db.availability.filter(a=>!(a.faculty===fid&&a.day===day));
    Array.from(q("modalForm").querySelectorAll("input[name=p]:checked")).forEach(x=>db.availability.push({id:uid("AV"),faculty:fid,day,period:+x.value,blocked:true}));
    log("Faculty availability changed",f.name+" · "+dayLabel(day));save();
  });
}
function runGenerate(){
  const mode=q("generationMode").value;solutionCandidates=[];
  const candidates=[1,2,3].map(t=>generateCandidate(mode,t,db)).sort((a,b)=>b.score.score-a.score.score);
  solutionCandidates=candidates;applySolution(0,false);q("generateStatus").textContent="3 candidate solutions generated";navigate("compare");
}
function applySolution(index,closePage=true){
  const s=solutionCandidates[index];if(!s)return;db.schedule=s.state.schedule;log("Solution applied","Option "+String.fromCharCode(65+index)+" · "+s.score.score+"%");save();if(closePage)navigate("generate");
}
function clearUnlocked(){db.schedule=db.schedule.filter(e=>e.locked);log("Unlocked timetable entries cleared","");save()}
function toggleLockMode(){lockMode=!lockMode;q("lockHint").textContent=lockMode?"Click any filled cell to lock/unlock":"Click a filled cell to inspect it";q("lockModeBtn").classList.toggle("active",lockMode)}
function publishCurrent(){
  const pf=preflight();if(!pf.ok){alert("Publishing is blocked. Run Preflight and resolve the listed issues.");navigate("preflight");return}
  db.versions.filter(v=>v.status==="Published").forEach(v=>v.status="Archived");
  const release={id:uid("VER"),name:"Release "+(db.versions.length+1),status:"Published",at:now(),score:scheduleScore(db).score,schedule:copy(db.schedule)};
  db.versions.unshift(release);log("Timetable published",release.name);save();navigate("publish");
}
function createShare(){
  const latest=db.versions.find(v=>v.status==="Published");if(!latest){alert("Publish a version first.");return}
  const scope=q("shareScope").value;const cid=q("classSelector").value;
  let schedule=copy(latest.schedule);if(scope==="class")schedule=schedule.filter(e=>e.classId===cid);
  if(scope==="department"){const cls=new Set(db.classes.filter(c=>c.department===db.departments[0]?.id).map(c=>c.id));schedule=schedule.filter(e=>cls.has(e.classId))}
  const snap={shared:true,version:latest.name,settings:copy(db.settings),organization:copy(db.organization),classes:copy(db.classes),courses:copy(db.courses),faculty:copy(db.faculty),rooms:copy(db.rooms),schedule};
  const url=location.origin+location.pathname+"#shared="+btoa(unescape(encodeURIComponent(JSON.stringify(snap))));
  db.shareLinks.unshift({id:uid("SHARE"),scope,url,version:latest.name,at:now(),active:true});log("Share link created",scope);save();q("copyShare").disabled=false;q("copyShare").dataset.url=url;q("shareResult").innerHTML="<div class='share-box'><span>VIEW-ONLY LINK</span><input readonly value='"+esc(url)+"'><button class='btn small' id='copyInline'>Copy</button></div>";q("copyInline").onclick=()=>copyShare(url);if(q("shareQr")){q("shareQr").innerHTML="";if(window.QRCode)new QRCode(q("shareQr"),{text:url,width:128,height:128})};
}
function copyShare(url){navigator.clipboard?navigator.clipboard.writeText(url).then(()=>q("copyShare").textContent="Copied"):alert(url)}
function getShared(){
  const h=location.hash||"";if(!h.startsWith("#shared="))return null;try{return JSON.parse(decodeURIComponent(escape(atob(h.slice(8)))))}catch(e){return null}
}
const sharedSnap=getShared();if(sharedSnap){db=normalizeState(sharedSnap);document.body.classList.add("shared-mode")}

function exportCSV(){
  const rows=[["Day","Period","Start","End","Class","Course","Faculty","Room"]];
  db.settings.days.forEach(d=>{for(let p=0;p<db.settings.periods;p++){const bt=currentBreakType(p),t=timeSlots()[p];if(bt)rows.push([d,p+1,t.start,t.end,bt,"","",""]);else db.classes.forEach(c=>{const e=entryAt(db,d,p,c.id);if(e){rows.push([d,p+1,t.start,t.end,c.name,findCourse(e.courseId)?.code||"",findFaculty(e.facultyId)?.name||"",findRoom(e.roomId)?.name||""])}})}});
  download("unischedule-timetable.csv",rows.map(r=>r.map(v=>'"'+String(v).replaceAll('"','""')+'"').join(",")).join("\n"),"text/csv");
}
function exportExcel(){
  if(!window.XLSX)return alert("Excel library unavailable.");
  const wb=XLSX.utils.book_new();
  const data=[["Day","Period","Start","End","Class","Course","Faculty","Room"]];
  db.settings.days.forEach(d=>{for(let p=0;p<db.settings.periods;p++){const bt=currentBreakType(p),t=timeSlots()[p];if(bt)data.push([d,p+1,t.start,t.end,bt,"","",""]);else db.classes.forEach(c=>{const e=entryAt(db,d,p,c.id);if(e)data.push([d,p+1,t.start,t.end,c.name,findCourse(e.courseId)?.code||"",findFaculty(e.facultyId)?.name||"",findRoom(e.roomId)?.name||""])})}});
  XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(data),"Master Timetable");
  XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet([["Metric","Value"],["Quality",scheduleScore(db).score+"%"],["Hard conflicts",allConflicts(db).length],["Scheduled",db.schedule.length],["Classes",db.classes.length],["Courses",db.courses.length]]),"Overview");
  XLSX.writeFile(wb,"unischedule-report.xlsx");
}
function exportPDF(){
  if(!window.jspdf)return alert("PDF library unavailable.");const {jsPDF}=jspdf;const doc=new jsPDF({orientation:"landscape",unit:"mm",format:"a4"});let y=14;
  doc.setFontSize(14);doc.text(db.organization.name,14,y);y+=7;doc.setFontSize(9);doc.text(db.settings.title,14,y);y+=8;
  db.classes.forEach(c=>{if(y>185){doc.addPage();y=14}doc.setFontSize(11);doc.text(c.name,14,y);y+=5;const headers=["DAY",...timeSlots().map(t=>t.start+"-"+t.end)];const body=db.settings.days.map(d=>[dayLabel(d),...Array.from({length:db.settings.periods},(_,p)=>{const bt=currentBreakType(p);if(bt)return bt;const e=entryAt(db,d,p,c.id);return e?(findCourse(e.courseId)?.code||"")+"\n"+(findRoom(e.roomId)?.name||""):"—"})]);doc.setFontSize(6);const width=265/(headers.length);headers.forEach((h,i)=>doc.text(h,14+i*width,y));y+=4;body.forEach(row=>{row.forEach((cell,i)=>doc.text(String(cell).slice(0,22),14+i*width,y));y+=4});y+=5});
  doc.save("unischedule-timetable.pdf");
}
function printReport(){window.print()}
function download(name,data,type){const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([data],{type}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
function backup(){download("unischedule-backup.json",JSON.stringify(db,null,2),"application/json")}

function addRoomBlock(){
  openModal("Block a room","<label>Room<select name='room'>"+db.rooms.map(r=>"<option value='"+r.id+"'>"+esc(r.name)+"</option>").join("")+"</select></label><label>Day<select name='day'><option value='ALL'>All days</option>"+db.settings.days.map(d=>"<option value='"+d+"'>"+dayLabel(d)+"</option>").join("")+"</select></label><label>Period<select name='period'><option value='-1'>All periods</option>"+Array.from({length:db.settings.periods},(_,i)=>"<option value='"+i+"'>Period "+(i+1)+"</option>").join("")+"</select></label><div class='modal-actions'><button type='button' onclick='closeModal()'>Cancel</button><button class='btn primary'>Save</button></div>",f=>{db.roomBlocks.push({id:uid("RB"),roomId:f.get("room"),day:f.get("day"),period:+f.get("period"),blocked:true});log("Room availability rule added",findRoom(f.get("room")).name);save()})
}
function addClassBlock(){
  openModal("Restrict a class","<label>Class<select name='classId'>"+db.classes.map(c=>"<option value='"+c.id+"'>"+esc(c.name)+"</option>").join("")+"</select></label><label>Day<select name='day'><option value='ALL'>All days</option>"+db.settings.days.map(d=>"<option value='"+d+"'>"+dayLabel(d)+"</option>").join("")+"</select></label><label>Period<select name='period'><option value='-1'>All periods</option>"+Array.from({length:db.settings.periods},(_,i)=>"<option value='"+i+"'>Period "+(i+1)+"</option>").join("")+"</select></label><div class='modal-actions'><button type='button' onclick='closeModal()'>Cancel</button><button class='btn primary'>Save</button></div>",f=>{db.classBlocks.push({id:uid("CB"),classId:f.get("classId"),day:f.get("day"),period:+f.get("period"),blocked:true});log("Class restriction added",findClass(f.get("classId")).name);save()})
}
function runScenario(){
  const s=copy(db);if(q("scenarioSaturday").checked)s.settings.days=s.settings.days.filter(d=>d!=="SAT");
  if(q("scenarioRoom").checked)s.roomBlocks.push({id:uid("RB"),roomId:"CCL",day:"ALL",period:-1,blocked:true});
  if(q("scenarioFaculty").checked&&s.faculty[0])s.availability.push({id:uid("AV"),faculty:s.faculty[0].id,day:"ALL",period:-1,blocked:true});
  const mult=+q("scenarioStrength").value/100;s.classes.forEach(c=>c.strength=Math.round(c.strength*mult));
  if(q("scenarioExtraLab").checked)s.rooms.push({id:uid("ROOM"),name:"Scenario Extra Lab",code:"SC-LAB",type:"Lab",capacity:60,building:"Scenario",floor:1,features:["computers","internet"],lab:true});
  const candidate=generateCandidate("balanced",9,s),sc=scheduleScore(candidate.state);
  q("scenarioResult").innerHTML="<div class='scenario-result'><div><span>CURRENT</span><b>"+scheduleScore(db).score+"%</b></div><div><span>SCENARIO</span><b>"+sc.score+"%</b></div><p>"+candidate.unscheduled.length+" activities unscheduled · "+sc.hardN+" hard conflicts</p></div>";
}

function saveCalendar(){
  const days=q("calendarDays").value.split(",").map(x=>x.trim().toUpperCase()).filter(Boolean);
  const periods=clamp(+q("calendarPeriods").value||8,1,16);
  const sb=Array.from(q("shortBreakSelectors").querySelectorAll("select")).map(x=>+x.value).filter(x=>x>=0&&x<periods);
  const lb=Array.from(q("lunchBreakSelectors").querySelectorAll("select")).map(x=>+x.value).filter(x=>x>=0&&x<periods);
  if(new Set([...sb,...lb]).size!==sb.length+lb.length)return alert("Each break must use a unique period.");
  db.settings.days=days;db.settings.periods=periods;db.settings.start=q("calendarStart").value||"09:00";db.settings.duration=clamp(+q("calendarDuration").value||50,20,180);db.settings.shortBreaks=sb;db.settings.lunchBreaks=lb;sanitizeBreaks(db.settings);
  db.schedule=db.schedule.filter(e=>!db.settings.breaks.includes(e.period));log("Calendar updated",sb.length+" short break(s) · "+lb.length+" lunch break(s)");save();
}
function restoreSeed(){if(!confirm("Restore the complete Joy University Section K seed data? Current demo data will be replaced."))return;db=normalizeState(copy(DEFAULT));log("Section K seed restored","Joy University Semester V");save()}
function saveDraftVersion(){const sc=scheduleScore(db);const note=prompt("Version note","Draft timetable");if(note===null)return;db.versions.unshift({id:uid("VER"),name:"Draft "+(db.versions.length+1),status:"Draft",note,at:now(),score:sc.score,schedule:copy(db.schedule)});log("Draft version saved",note);save()}
function restoreVersion(id){const v=db.versions.find(x=>x.id===id);if(!v)return;if(confirm("Restore "+v.name+"? Current draft will be replaced.")){db.schedule=copy(v.schedule);log("Version restored",v.name);save()}}
function updateBranding(){db.branding.name=q("brandName").value;db.branding.code=q("brandCode").value;db.branding.logo=q("brandLogo").value;db.branding.timezone=q("brandTimezone").value;db.organization.name=db.branding.name;db.organization.code=db.branding.code;log("Branding updated",db.branding.name);save()}
function updateInstitution(){db.settings.university=q("setUniversity").value;db.organization.code=q("setOrgCode").value;db.settings.year=q("setYear").value;db.settings.semester=q("setSemester").value;db.settings.school=q("setSchool").value;db.settings.incharge=q("setIncharge").value;db.organization.name=db.settings.university;log("Institution settings updated",db.organization.name);save()}

document.addEventListener("click",e=>{
  const nav=e.target.closest(".nav");if(nav){navigate(nav.dataset.page);return}
  const go=e.target.closest("[data-go]");if(go){navigate(go.dataset.go);return}
  if(e.target.id==="modalClose")closeModal();
  if(e.target.id==="seedBtn")restoreSeed();
  if(e.target.id==="saveInstitution")updateInstitution();
  if(e.target.id==="addDepartment")addDepartment();if(e.target.id==="addProgram")addProgram();if(e.target.id==="addSection")addSection();if(e.target.id==="addClass"||e.target.id==="addClassBtn")addClass();
  if(e.target.id==="addFacultyBtn")addFaculty();if(e.target.id==="addCombinedBtn")addCombined();if(e.target.id==="addElectiveBtn")addElective();if(e.target.id==="addRoomBtn")addRoom();if(e.target.id==="addCourseBtn")addCourse();
  if(e.target.id==="generateBtn")runGenerate();if(e.target.id==="headerGenerate")navigate("generate");
  if(e.target.id==="lockModeBtn")toggleLockMode();
  if(e.target.id==="clearScheduleBtn")clearUnlocked();
  if(e.target.id==="runPreflight")navigate("preflight");
  if(e.target.id==="publishBtn")publishCurrent();
  if(e.target.id==="createShare")createShare();if(e.target.id==="copyShare")copyShare(e.target.dataset.url);
  if(e.target.id==="compareGenerate")runGenerate();
  if(e.target.id==="runScenario")runScenario();if(e.target.id==="addRoomBlockInline")addRoomBlock();if(e.target.id==="addClassBlockInline")addClassBlock();
  if(e.target.id==="saveCalendarBtn")saveCalendar();
  if(e.target.id==="saveVersionBtn")saveDraftVersion();
  if(e.target.id==="refreshInsights")renderIntelligence();
  if(e.target.id==="saveBranding")updateBranding();
  if(e.target.id==="backupBtn")backup();
  if(e.target.id==="reportPdf")exportPDF();
  if(e.target.id==="reportExcel")exportExcel();
  if(e.target.id==="reportCsv")exportCSV();
  const ex=e.target.closest("[data-export]");if(ex)exportAction(ex.dataset.export);
  if(e.target.id==="downloadTemplate")downloadImportTemplate();
  if(e.target.id==="validateImport"){const file=q("importFile").files?.[0];if(file)readImportFile(file);else alert("Choose an Excel file first.");}
  if(e.target.id==="applyImport")applyImport();
  const slot=e.target.closest(".editable");if(slot){
    if(lockMode&&slot.dataset.slot){const en=db.schedule.find(x=>x.id===slot.dataset.slot);if(en){en.locked=!en.locked;log(en.locked?"Timetable entry locked":"Timetable entry unlocked",findCourse(en.courseId)?.code||"");save()}return}
    editSlotElement(slot);
  }
  const av=e.target.closest("[data-avail-f]");if(av){editFacultyAvailability(av.dataset.availF,av.dataset.availD);}
  const sol=e.target.closest("[data-apply-solution]");if(sol)applySolution(+sol.dataset.applySolution);
  const ver=e.target.closest("[data-restore-version]");if(ver)restoreVersion(ver.dataset.restoreVersion);
  const rc=e.target.closest("[data-report-class]");if(rc){q("classSelector").value=rc.dataset.reportClass;navigate("generate")}
  const rv=e.target.closest("[data-revoke-share]");if(rv){const s=db.shareLinks.find(x=>x.id===rv.dataset.revokeShare);if(s){s.active=false;log("Share link revoked",s.id);save()}}
});

document.addEventListener("input",e=>{
  const id=e.target.id||"";const map={prefClassGaps:"classGaps",prefFacultyGaps:"facultyGaps",prefSpread:"spread",prefRooms:"rooms",prefEdges:"edges",prefWorkload:"workload"};
  if(map[id]){db.preferences[map[id]]=+e.target.value;const out=q(id+"Val");if(out)out.textContent=e.target.value;renderGenerate()}
  if(id==="scenarioStrength")q("scenarioStrengthVal").textContent=e.target.value+"%";
});
document.addEventListener("change",e=>{
  if(["shortBreakCount","lunchBreakCount","calendarPeriods"].includes(e.target.id))breakSelectors();
  if(e.target.id==="classSelector")renderGenerate();
});
q("modal").addEventListener("click",e=>{if(e.target.id==="modal")closeModal()});
q("copyShare").disabled=true;
if(sharedSnap){
  q("syncStatus").textContent="VIEW-ONLY PUBLISHED SNAPSHOT";
  q("pageTitle").textContent="Shared Timetable";
}
render();
if(!sharedSnap)cloudLoad();

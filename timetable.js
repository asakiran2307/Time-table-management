(function(){
"use strict";
var keys=["school","year","semester","course","section"],els={};
keys.forEach(function(k){els[k]=document.getElementById(k+"Select")});
function esc(v){return String(v==null?"":v).replace(/[&<>"']/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
function fill(el,items,selected,valueOf,label,empty){
 var list=Array.isArray(items)?items:[];
 var html='<option value="">'+esc(empty)+'</option>';
 list.forEach(function(item){
  var value=String(valueOf(item)||"");
  if(!value)return;
  html+='<option value="'+esc(value)+'">'+esc(label(item))+'</option>';
 });
 el.innerHTML=html;
 el.value=selected&&list.some(function(item){return String(valueOf(item))===String(selected)})?String(selected):"";
}
function setLoading(loading){
 keys.forEach(function(k){els[k].disabled=loading});
 var box=document.getElementById("tableContainer");
 if(loading)box.innerHTML='<div class="loading-state"><span class="loader-dot"></span><b>Loading published timetable…</b><small>Fetching the latest approved demonstration release</small></div>';
}
async function load(){
 var query=new URLSearchParams();
 keys.forEach(function(k){if(els[k].value)query.set(k,els[k].value)});
 setLoading(true);
 try{
  var response=await fetch("/api/public-timetables?"+query.toString(),{cache:"no-store",headers:{"Accept":"application/json"}});
  var data=await response.json();
  if(!response.ok)throw new Error(data.error||"Unable to load timetable data");
  fill(els.school,data.schools,data.selected.school,function(x){return x.code},function(x){return x.name+(x.hasPublished?"":" · coming soon")},"Choose a school");
  fill(els.year,data.years,data.selected.year,function(x){return x},function(x){return x},"Choose academic year");
  fill(els.semester,data.semesters,data.selected.semester,function(x){return x},function(x){return x},"Choose semester");
  fill(els.course,data.courses,data.selected.course,function(x){return x.id},function(x){return x.code+" · "+x.name},"All courses");
  fill(els.section,data.sections,data.selected.section,function(x){return x.id},function(x){return x.label},"All sections");
  var notice=document.getElementById("demoNotice");
  if(notice)notice.hidden=!(data.release&&data.release.demoOnly);
  var status=document.getElementById("status");
  var meta=document.getElementById("meta");
  var box=document.getElementById("tableContainer");
  if(!data.release){
   meta.textContent=data.selected.schoolName||"Joy University";
   status.textContent="NOT PUBLISHED";
   status.className="status-pill muted";
   box.innerHTML='<div class="empty-state"><span class="empty-icon">◷</span><strong>No timetable published for this school yet.</strong><span>Select another school or check back after the coordinator publishes its timetable.</span></div>';
   return;
  }
  meta.textContent=data.release.school+" · "+data.release.academicYear+" · "+data.release.semester+" · "+data.release.name;
  status.textContent=data.release.demoOnly?"DEMO RELEASE":"PUBLISHED";
  status.className="status-pill "+(data.release.demoOnly?"demo":"published");
  if(!data.entries.length){
   box.innerHTML='<div class="empty-state"><strong>No classes match these filters.</strong><span>Try another course or section.</span></div>';
   return;
  }
  var html='<div class="table-scroll"><table class="public-timetable"><thead><tr><th>Day</th><th>Time</th><th>Course code</th><th>Subject</th><th>Section</th><th>Faculty</th><th>Room</th></tr></thead><tbody>';
  data.entries.forEach(function(entry){
   html+='<tr><td><b>'+esc(entry.dayLabel)+'</b></td><td class="time-cell">'+esc(entry.time)+'</td><td><span class="course-code">'+esc(entry.courseCode)+'</span></td><td class="subject-cell">'+esc(entry.courseName)+'</td><td>'+esc(entry.sectionLabel)+'</td><td>'+esc(entry.facultyName)+(entry.staffingPending?'<small class="pending-label">Staffing pending</small>':"")+'</td><td>'+esc(entry.roomName)+'</td></tr>';
  });
  box.innerHTML=html+'</tbody></table></div><div class="table-foot"><span>'+data.entries.length+' timetable slot(s)</span><span>Times shown in India Standard Time (IST)</span></div>';
 }catch(error){
  document.getElementById("status").textContent="UNAVAILABLE";
  document.getElementById("status").className="status-pill muted";
  document.getElementById("tableContainer").innerHTML='<div class="empty-state error-state"><strong>Timetable could not be loaded.</strong><span>'+esc(error.message)+'</span><button class="print-button" id="retryLoad">Try again</button></div>';
  var retry=document.getElementById("retryLoad");if(retry)retry.onclick=load;
 }finally{keys.forEach(function(k){els[k].disabled=false})}
}
keys.forEach(function(key,index){els[key].addEventListener("change",function(){keys.slice(index+1).forEach(function(later){els[later].value=""});load()})});
document.getElementById("print").addEventListener("click",function(){window.print()});
load();
})();
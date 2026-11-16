(function(){
"use strict";
const schools=[["JU-SANS","School of Arts & Natural Sciences"],["JU-SAS","School of Agricultural Sciences"],["JU-SEAM","School of Entrepreneurship and Management"],["JU-SLHS","School of Life & Health Sciences"],["JU-SOCI","School of Computational Intelligence"],["JU-SOET","School of Engineering and Technology"],["JU-SOL","School of Law"],["JU-SON","School of Nursing"],["JU-SOP","School of Pharmacy"]];
const grid=document.getElementById("facultyGrid");
function enter(role,code,name,school){
 const session={demo:true,type:"UNIVERSITY_OWNER",role:"UNIVERSITY_OWNER",membershipRole:"scheduler",organization:{id:"demo-"+code,code,name:"Joy University",school,timezone:"Asia/Kolkata",status:"Active"},user:{id:"demo-"+code+"-"+role,email:"demo@joyuniversity.edu.in",name},demoRole:role};
 sessionStorage.setItem("ju-timetable-demo-session",JSON.stringify(session));
 location.href="/workspace.html";
}
function admin(){
 sessionStorage.setItem("ju-timetable-demo-admin",JSON.stringify({demo:true,role:"CENTRAL_ADMIN"}));
 location.href="/demo-admin.html";
}
document.getElementById("adminLogin").addEventListener("click",admin);
grid.innerHTML=schools.map(([code,school])=>{
 const names=code==="JU-SOCI"?["Ambika S · Demo","T. Anitha · Demo"]:["Coordinator 1 · Demo","Coordinator 2 · Demo"];
 return '<article class="demo-card"><h3>'+school+'</h3><p>'+code+' · Private browser-local demo workspace</p>'+names.map((n,i)=>'<button '+(i?'class="secondary"':'')+' data-code="'+code+'" data-school="'+school+'" data-role="'+(i+1)+'" data-name="'+n+'">Login as '+n+'</button>').join("")+'</article>';
}).join("");
grid.addEventListener("click",e=>{const b=e.target.closest("button[data-code]");if(b)enter("FACULTY_COORDINATOR_"+b.dataset.role,b.dataset.code,b.dataset.name,b.dataset.school)});
})();
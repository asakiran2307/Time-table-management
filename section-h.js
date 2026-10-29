/* Joy University Section H timetable migration.
   Adds the III Year Section H subjects and faculty from the supplied timetable.
   Runs idempotently so existing browser workspaces are upgraded without removing Section K. */
(function () {
  "use strict";
  const H_CLASS = "CSE3H";
  const H_SECTION = "SEC-H";
  const H_COURSES = [
    {id:"H-TOC",code:"TOC",name:"TOC",faculty:"H-F-TOC",type:"Theory",credits:0,l:0,t:0,p:0,sessionPattern:"As in supplied timetable"},
    {id:"H-MINI-TOC",code:"MINI TOC",name:"MINI TOC",faculty:"H-F-TOC",type:"Theory",credits:0,l:0,t:0,p:0,sessionPattern:"As in supplied timetable"},
    {id:"H-CNW",code:"CNW",name:"CNW",faculty:"H-F-PREETHI",type:"Theory",credits:0,l:0,t:0,p:0,sessionPattern:"As in supplied timetable"},
    {id:"H-DL",code:"DL",name:"DL",faculty:"H-F-ANITHA",type:"Theory",credits:0,l:0,t:0,p:0,sessionPattern:"As in supplied timetable"},
    {id:"H-POM",code:"POM",name:"POM",faculty:"H-F-SUDHA",type:"Theory",credits:0,l:0,t:0,p:0,sessionPattern:"As in supplied timetable"},
    {id:"H-SE",code:"SE",name:"SE",faculty:"H-F-PARTHIBAN",type:"Theory",credits:0,l:0,t:0,p:0,sessionPattern:"As in supplied timetable"},
    {id:"H-CA",code:"CA",name:"CA",faculty:"H-F-RAM",type:"Theory",credits:0,l:0,t:0,p:0,sessionPattern:"As in supplied timetable"},
    {id:"H-DL-LAB",code:"DL LAB",name:"DL LAB",faculty:"H-F-ANITHA",type:"Lab",credits:0,l:0,t:0,p:2,lab:true,sessionPattern:"Lab block"},
    {id:"H-CNW-LAB",code:"CNW LAB",name:"CNW LAB",faculty:"H-F-PREETHI",type:"Lab",credits:0,l:0,t:0,p:2,lab:true,sessionPattern:"Lab block"}
  ];
  const H_FACULTY = [
    ["H-F-TOC","FRA 10C2HITHRA"],
    ["H-F-PREETHI","PREETHI"],
    ["H-F-ANITHA","ANITHA"],
    ["H-F-SUDHA","MS. SUDHA"],
    ["H-F-PARTHIBAN","Prof. Parthiban"],
    ["H-F-RAM","RAM(TANSAM)"],
    ["H-F-ABRAHAM","ABRAHAM DAVID"]
  ];
  function addUnique(list, item) {
    if (!list.some(x => x.id === item.id)) list.push(item);
  }
  function apply(state) {
    if (!state || !Array.isArray(state.classes) || !Array.isArray(state.courses)) return false;
    state.sections = Array.isArray(state.sections) ? state.sections : [];
    state.faculty = Array.isArray(state.faculty) ? state.faculty : [];
    state.schedule = Array.isArray(state.schedule) ? state.schedule : [];
    const dep = state.departments?.find(x => x.id === "SOCI")?.id || state.departments?.[0]?.id || "SOCI";
    const program = state.programs?.find(x => x.id === "BTECH-CSE")?.id || state.programs?.[0]?.id || "BTECH-CSE";
    const sem = state.semesters?.find(x => /semester\s*v\b/i.test(x.name || ""))?.id || state.semesters?.[0]?.id || "SEM5";
    addUnique(state.sections,{id:H_SECTION,name:"Section H",code:"H",department:dep,program,semester:sem,strength:60});
    addUnique(state.classes,{id:H_CLASS,name:"B.Tech CSE · III Year · H",section:"H",department:dep,program,semester:sem,strength:60,incharge:""});
    H_FACULTY.forEach(([id,name]) => addUnique(state.faculty,{id,name,department:dep,designation:"Faculty",maxDay:5,maxWeek:20}));
    H_COURSES.forEach(c => addUnique(state.courses,{...c,classIds:[H_CLASS],room:""}));
    // Source timetable positions are entered as 0-based periods. Breaks remain governed by Calendar.
    const rows = [
      ["MON",0,"H-TOC"],["MON",2,"H-CNW"],["MON",3,"H-DL"],["MON",4,"H-POM"],["MON",5,"H-SE"],["MON",7,"H-TOC"],
      ["TUE",0,"H-DL-LAB"],["TUE",1,"H-DL-LAB"],["TUE",2,"H-MINI-TOC"],["TUE",4,"H-CNW-LAB"],["TUE",5,"H-CNW-LAB"],["TUE",7,"H-TOC"],
      ["WED",0,"H-DL"],["WED",1,"H-DL"],["WED",2,"H-POM"],["WED",3,"H-CNW"],["WED",4,"H-CA"],["WED",7,"H-POM"],
      ["THU",0,"H-MINI-TOC"],["THU",2,"H-DL-LAB"],["THU",3,"H-DL-LAB"],["THU",4,"H-CA"],["THU",7,"H-TOC"],
      ["FRI",0,"H-SE"],["FRI",1,"H-TOC"],["FRI",2,"H-CA"],["FRI",3,"H-CNW"],["FRI",4,"H-SE"],["FRI",6,"H-MINI-TOC"]
    ];
    const already = state.schedule.some(e => e.classId === H_CLASS);
    if (!already) rows.forEach(([day,period,courseId],i) => {
      const c = state.courses.find(x => x.id === courseId);
      state.schedule.push({id:"H-SCH-"+String(i+1).padStart(2,"0"),day,period,courseId,facultyId:c?.faculty||"",roomId:"",classId:H_CLASS,duration:c?.lab?1:1,locked:false});
    });
    state.__joySectionHVersion = 1;
    return true;
  }
  function boot() {
    try {
      // Upgrade the default template for newly created demo workspaces.
      if (typeof DEFAULT !== "undefined") apply(DEFAULT);
      // Upgrade saved workspaces without deleting the existing Section K or other classes.
      if (typeof platform !== "undefined" && Array.isArray(platform.universities)) {
        platform.universities.forEach(u => {
          if (/JU001|JOY UNIVERSITY/i.test((u.code||"")+" "+(u.name||""))) apply(u.data);
        });
        if (typeof savePlatform === "function") savePlatform();
      }
      if (typeof db !== "undefined" && db && /JU001|JOY UNIVERSITY/i.test((db.organization?.code||"")+" "+(db.organization?.name||""))) {
        apply(db);
        if (typeof currentUniversity === "function" && typeof savePlatform === "function") {
          const u = currentUniversity();
          if (u) { u.data = JSON.parse(JSON.stringify(db)); savePlatform(); }
        }
        if (typeof render === "function") render();
      }
    } catch (e) {
      console.error("Section H timetable migration did not complete:", e);
    }
  }
  boot();
})();
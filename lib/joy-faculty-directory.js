"use strict";
const SOURCE_URL="https://joyuniversity.edu.in/our-faculties";
const SCHOOLS=[
 {code:"JU-SAS",name:"School of Agricultural Sciences",aliases:["School of Agricultural Sciences"]},
 {code:"JU-SANS",name:"School of Arts & Natural Sciences",aliases:["School of Arts & Natural Sciences","School of Arts and Natural Sciences","School of Arts and Natural Science"]},
 {code:"JU-SOCI",name:"School of Computational Intelligence",aliases:["School of Computational Intelligence"]},
 {code:"JU-SOET",name:"School of Engineering and Technology",aliases:["School of Engineering and Technology","School of Engineering & Technology"]},
 {code:"JU-SEAM",name:"School of Entrepreneurship and Management",aliases:["School of Entrepreneurship and Management","School of Entrepreneurship & Management","School of Entrepreneurship Management"]},
 {code:"JU-SOL",name:"School of Law",aliases:["School of Law"]},
 {code:"JU-SLHS",name:"School of Life & Health Sciences",aliases:["School of Life & Health Sciences","School of Life and Health Sciences"]},
 {code:"JU-SON",name:"School of Nursing",aliases:["School of Nursing"]},
 {code:"JU-SOP",name:"School of Pharmacy",aliases:["School of Pharmacy"]}
];
function clean(value){return String(value||"").replace(/&amp;/gi,"&").replace(/&nbsp;/gi," ").replace(/&quot;/gi,'"').replace(/&#39;|&apos;/gi,"'").replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim()}
function normalize(value){return String(value||"").toLowerCase().replace(/&/g,"and").replace(/[^a-z0-9]/g,"")}
function schoolFromText(value){const text=normalize(value);for(const school of SCHOOLS){if(school.aliases.some(alias=>text.includes(normalize(alias))))return school}return null}
function isPersonHeading(value){
 const name=String(value||"").trim();
 if(name.length<3||name.length>110)return false;
 if(/^(school of|ph\.?\s*d|faculty of|outstanding|assistant|associate|professor|dean|teaching|research|education|qualification|professional experience|teaching experience|contact|profile|department of)/i.test(name))return false;
 const titled=/^(?:Prof\.?|Dr\.?|Mr\.?|Mrs\.?|Ms\.?|Miss\.?)\s+/i.test(name);
 const plainName=/^[A-Z][A-Za-z.'’()-]+(?:\s+[A-Z][A-Za-z.'’()-]+){1,5}$/.test(name);
 return titled||plainName;
}
function slug(value){return String(value||"").toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")}
function parseJoyFacultyDirectory(html){
 const source=String(html||""),heading=/<h([2-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi,people=[];let match;
 while((match=heading.exec(source))!==null){const name=clean(match[2]);if(isPersonHeading(name))people.push({name:name,start:match.index,end:heading.lastIndex})}
 const output=[],seen=new Set();
 people.forEach((person,index)=>{
  const next=people[index+1],after=clean(source.slice(person.end,next?next.start:Math.min(source.length,person.end+12000)));
  const before=clean(source.slice(Math.max(0,person.start-1800),person.start));
  const school=schoolFromText(after)||schoolFromText(before);
  if(!school)return;
  const key=normalize(person.name)+"|"+school.code;if(seen.has(key))return;seen.add(key);
  const designation=after.match(/\b(Associate Professor|Assistant Professor|Teaching Assistant|Professor|Dean)\b/i);
  output.push({id:school.code+"-"+slug(person.name),name:person.name,designation:designation?designation[0]:"",schoolCode:school.code,school:school.name,profileUrl:SOURCE_URL,source:"Joy University official faculty directory"});
 });
 return output;
}
module.exports={SOURCE_URL,SCHOOLS,parseJoyFacultyDirectory};
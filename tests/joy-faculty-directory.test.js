const test=require("node:test"),assert=require("node:assert/strict"),{parseJoyFacultyDirectory}=require("../lib/joy-faculty-directory");
test("maps profiles to the school named in each official faculty profile",()=>{
 const html='<h4>Prof. Dr. Bini Marin V</h4><h5>Ph.D. - Business Administration</h5><h6>Professor & Associate Dean - School of Entrepreneurship Management</h6><p>Academic profile</p><h4>Prof. Dr. Chithra D Gracia</h4><h5>Ph.D - NIT</h5><h6>Professor & Dean - School of Computational Intelligence</h6><p>Academic profile</p>';
 const result=parseJoyFacultyDirectory(html);assert.equal(result.length,2);assert.equal(result[0].schoolCode,"JU-SEAM");assert.equal(result[1].schoolCode,"JU-SOCI");
});
test("maps unprefixed faculty names but ignores designation headings",()=>{
 const html='<h4>L. Babisha Julit</h4><h5>Ph.D. - Mathematics</h5><h6>Assistant Professor - School of Arts & Natural Sciences</h6><h4>Assistant Professor - School of Nursing</h4><p>Not a person name</p>';
 const result=parseJoyFacultyDirectory(html);assert.equal(result.length,1);assert.equal(result[0].name,"L. Babisha Julit");assert.equal(result[0].schoolCode,"JU-SANS");
});
test("does not guess a school when the official profile omits it",()=>{
 assert.deepEqual(parseJoyFacultyDirectory('<h4>Prof. Dr. Unknown Person</h4><p>Researcher and academician.</p>'),[]);
});
test("deduplicates repeated faculty profiles",()=>{
 const html='<h4>Prof. Dr. Sanjith S</h4><h6>Associate Professor - School of Computational Intelligence</h6><h4>Prof. Dr. Sanjith S</h4><h6>Associate Professor - School of Computational Intelligence</h6>';
 assert.equal(parseJoyFacultyDirectory(html).length,1);
});
const test=require("node:test");
const assert=require("node:assert/strict");
const handler=require("../api/state");
function response(){return{headers:{},statusCode:200,body:null,setHeader(k,v){this.headers[k]=v},status(code){this.statusCode=code;return this},json(body){this.body=body;return this}};}
test("rejects workspace reads without an authenticated session",async()=>{
 const res=response();await handler({method:"GET",headers:{}},res);
 assert.equal(res.statusCode,401);assert.equal(res.body.ok,false);
});
test("rejects workspace writes without an authenticated session",async()=>{
 const res=response();await handler({method:"PUT",headers:{},body:{data:{}}},res);
 assert.equal(res.statusCode,401);
});
test("rejects unsupported workspace methods",async()=>{
 const res=response();await handler({method:"DELETE",headers:{}},res);
 assert.equal(res.statusCode,405);assert.equal(res.headers.Allow,"GET, PUT");
});

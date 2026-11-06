const test = require("node:test");
const assert = require("node:assert/strict");
const handler = require("../api/state");

function response() {
  return {
    headers: {},
    statusCode: 200,
    body: null,
    setHeader(k,v){this.headers[k]=v},
    status(code){this.statusCode=code;return this},
    json(body){this.body=body;return this}
  };
}

test("rejects requests without a bearer token", async () => {
  const res=response();
  await handler({method:"GET",headers:{}},res);
  assert.equal(res.statusCode,401);
});

test("loads only the authenticated user's school workspace", async () => {
  const original=global.fetch;
  const calls=[];
  global.fetch=async (url,options={})=>{
    calls.push({url,options});
    if(String(url).includes("/auth/v1/user")) return new Response(JSON.stringify({id:"user-1"}),{status:200});
    if(String(url).includes("us_organization_users")) return new Response(JSON.stringify([{organization_id:"school-1",role:"scheduler"}]),{status:200});
    if(String(url).includes("us_workspace_state")) return new Response(JSON.stringify([{data:{organization:{code:"SOCI"}},updated_at:"2026-11-06T00:00:00Z"}]),{status:200});
    throw new Error("Unexpected request "+url);
  };
  try{
    process.env.SUPABASE_URL="https://example.supabase.co";
    process.env.SUPABASE_PUBLISHABLE_KEY="test-key";
    const res=response();
    await handler({method:"GET",headers:{authorization:"Bearer valid-token"}},res);
    assert.equal(res.statusCode,200);
    assert.equal(res.body.data.organization.code,"SOCI");
    assert.match(calls.at(-1).url,/organization_id=eq.school-1/);
    assert.equal(calls.at(-1).options.headers.Authorization,"Bearer valid-token");
  }finally{global.fetch=original}
});

test("rejects authenticated users without a school membership", async () => {
  const original=global.fetch;
  global.fetch=async url=>{
    if(String(url).includes("/auth/v1/user")) return new Response(JSON.stringify({id:"user-2"}),{status:200});
    if(String(url).includes("us_organization_users")) return new Response("[]",{status:200});
    throw new Error("Unexpected request "+url);
  };
  try{
    process.env.SUPABASE_URL="https://example.supabase.co";
    process.env.SUPABASE_PUBLISHABLE_KEY="test-key";
    const res=response();
    await handler({method:"GET",headers:{authorization:"Bearer valid-token"}},res);
    assert.equal(res.statusCode,403);
  }finally{global.fetch=original}
});

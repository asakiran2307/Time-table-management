// School-scoped workspace API. Supabase Auth validates the bearer token and
// PostgreSQL RLS scopes every workspace query to the caller's school membership.
const MAX_BODY_BYTES = 2 * 1024 * 1024;
function json(res, status, body) { return res.status(status).json(body); }
function config() {
  const base = String(process.env.SUPABASE_URL || "").replace(/\/$/, "");
  const key = process.env.SUPABASE_PUBLISHABLE_KEY || "";
  if (!base || !key) throw new Error("Supabase server configuration is missing");
  return { base, key };
}
async function request(url, key, token, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { apikey:key, Authorization:"Bearer "+token, "Content-Type":"application/json", ...(options.headers||{}) }
  });
  const raw = await response.text();
  let data = null;
  try { data = raw ? JSON.parse(raw) : null; } catch { data = raw; }
  if (!response.ok) {
    const error = new Error("Workspace service rejected the request");
    error.status = response.status === 401 ? 401 : response.status === 403 ? 403 : 502;
    throw error;
  }
  return data;
}
module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control","no-store, max-age=0");
  res.setHeader("X-Content-Type-Options","nosniff");
  res.setHeader("Vary","Authorization");
  if (!["GET","PUT"].includes(req.method)) {
    res.setHeader("Allow","GET, PUT");
    return json(res,405,{ok:false,error:"Method not allowed"});
  }
  const token = String(req.headers.authorization || "").replace(/^Bearer\s+/i,"").trim();
  if (!token) return json(res,401,{ok:false,error:"Sign in is required"});
  try {
    const {base,key}=config();
    const user=await request(base+"/auth/v1/user",key,token);
    if (!user || !user.id) return json(res,401,{ok:false,error:"Invalid session"});
    const memberships=await request(
      base+"/rest/v1/us_organization_users?user_id=eq."+encodeURIComponent(user.id)+"&select=organization_id,role",
      key,token
    );
    if (!Array.isArray(memberships) || memberships.length!==1 || !["owner","scheduler"].includes(memberships[0].role))
      return json(res,403,{ok:false,error:"No school workspace is assigned to this account"});
    const organizationId=memberships[0].organization_id;
    if (req.method==="GET") {
      const rows=await request(base+"/rest/v1/us_workspace_state?organization_id=eq."+encodeURIComponent(organizationId)+"&select=data,updated_at",key,token);
      if (!Array.isArray(rows) || !rows.length) return json(res,404,{ok:false,error:"No saved workspace yet"});
      return json(res,200,{ok:true,data:rows[0].data,updatedAt:rows[0].updated_at});
    }
    const raw=typeof req.body==="string"?req.body:JSON.stringify(req.body||{});
    if (Buffer.byteLength(raw,"utf8")>MAX_BODY_BYTES) return json(res,413,{ok:false,error:"Workspace data exceeds the 2 MB limit"});
    let payload;
    try { payload=typeof req.body==="string"?JSON.parse(req.body):req.body; }
    catch { return json(res,400,{ok:false,error:"Invalid JSON body"}); }
    if (!payload || typeof payload.data!=="object" || payload.data===null || Array.isArray(payload.data))
      return json(res,400,{ok:false,error:"A workspace data object is required"});
    await request(base+"/rest/v1/us_workspace_state?on_conflict=organization_id",key,token,{
      method:"POST",headers:{Prefer:"resolution=merge-duplicates,return=minimal"},
      body:JSON.stringify({organization_id:organizationId,data:payload.data,updated_by:user.id})
    });
    return json(res,200,{ok:true});
  } catch(error) {
    const status=error.status||503;
    return json(res,status,{ok:false,error:status===401?"Your session has expired. Sign in again.":status===403?
      "This account is not authorized for this school workspace.":"Secure workspace storage is temporarily unavailable."});
  }
};

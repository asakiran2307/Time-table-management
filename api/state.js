const {db,getSession}=require("./_lib/auth");
const MAX_BODY_BYTES=2*1024*1024;
function send(res,status,data){return res.status(status).json(data);}
module.exports=async function(req,res){
 res.setHeader("Cache-Control","no-store, max-age=0");res.setHeader("X-Content-Type-Options","nosniff");res.setHeader("Vary","Cookie");
 if(!["GET","PUT"].includes(req.method)){res.setHeader("Allow","GET, PUT");return send(res,405,{ok:false,error:"Method not allowed"});}
 try{
  const session=await getSession(req);if(!session)return send(res,401,{ok:false,error:"Sign in is required"});
  const sql=db(),org=session.organization.id,user=session.user.id;
  if(req.method==="GET"){
   const rows=await sql`select data,updated_at from us_workspace_state where organization_id=${org} limit 1`;
   if(!rows.length)return send(res,404,{ok:false,error:"No saved workspace yet"});
   return send(res,200,{ok:true,data:rows[0].data,updatedAt:rows[0].updated_at});
  }
  const raw=typeof req.body==="string"?req.body:JSON.stringify(req.body||{});
  if(Buffer.byteLength(raw,"utf8")>MAX_BODY_BYTES)return send(res,413,{ok:false,error:"Workspace data exceeds the 2 MB limit"});
  let payload;try{payload=typeof req.body==="string"?JSON.parse(req.body):req.body;}catch{return send(res,400,{ok:false,error:"Invalid JSON body"});}
  if(!payload||typeof payload.data!=="object"||payload.data===null||Array.isArray(payload.data))return send(res,400,{ok:false,error:"A workspace data object is required"});
  await sql`insert into us_workspace_state(organization_id,data,updated_by,updated_at) values(${org},${JSON.stringify(payload.data)}::jsonb,${user},now()) on conflict(organization_id) do update set data=excluded.data,updated_by=excluded.updated_by,updated_at=now()`;
  return send(res,200,{ok:true});
 }catch(error){console.error("Workspace API error",error);return send(res,503,{ok:false,error:"Secure workspace storage is temporarily unavailable."});}
};

function supabaseHeaders(token){
  return {
    "Content-Type":"application/json",
    "apikey":process.env.SUPABASE_PUBLISHABLE_KEY,
    "Authorization":"Bearer "+(token||process.env.SUPABASE_SERVICE_ROLE_KEY)
  };
}
async function sb(path,options={}){
  const base=String(process.env.SUPABASE_URL||"").replace(/\/$/,"");
  if(!base||!process.env.SUPABASE_SERVICE_ROLE_KEY)throw new Error("Supabase server configuration is missing");
  const r=await fetch(base+path,{...options,headers:{...supabaseHeaders(options.token),...(options.headers||{})}});
  const text=await r.text();let body={};try{body=JSON.parse(text)}catch{body={raw:text}}
  if(!r.ok)throw new Error(body.message||body.error_description||body.error||("Supabase request failed: "+r.status));
  return body;
}
async function caller(token){
  return sb("/auth/v1/user",{token,headers:{Authorization:"Bearer "+token,apikey:process.env.SUPABASE_PUBLISHABLE_KEY}});
}
async function isMaster(userId){
  const rows=await sb("/rest/v1/us_platform_admins?select=user_id&user_id=eq."+encodeURIComponent(userId)+"&limit=1");
  return Array.isArray(rows)&&rows.length>0;
}
module.exports=async function handler(req,res){
  res.setHeader("Cache-Control","no-store");
  res.setHeader("X-Content-Type-Options","nosniff");
  const token=(req.headers.authorization||"").replace(/^Bearer\s+/i,"").trim();
  try{
    if(!token)return res.status(401).json({error:"Authentication required"});
    const user=await caller(token);
    if(!user?.id||!(await isMaster(user.id)))return res.status(403).json({error:"Master Admin access required"});
    if(req.method==="GET"){
      const rows=await sb("/rest/v1/us_organizations?select=id,name,code,school,timezone,status,owner_user_id,created_at&order=created_at.desc");
      return res.status(200).json({organizations:rows});
    }
    if(req.method==="POST"){
      let b=req.body;if(typeof b==="string")b=JSON.parse(b);
      const name=String(b?.name||"").trim(),code=String(b?.code||"").trim().toUpperCase(),school=String(b?.school||"").trim(),timezone=String(b?.timezone||"Asia/Kolkata").trim();
      const email=String(b?.ownerEmail||"").trim().toLowerCase(),password=String(b?.ownerPassword||"");
      if(!name||!code||!email||password.length<8)return res.status(400).json({error:"University name, code, owner email and an 8+ character password are required."});
      const existing=await sb("/rest/v1/us_organizations?select=id&code=eq."+encodeURIComponent(code)+"&limit=1");
      if(existing.length)return res.status(409).json({error:"University code already exists."});
      const created=await sb("/auth/v1/admin/users",{method:"POST",headers:{Authorization:"Bearer "+process.env.SUPABASE_SERVICE_ROLE_KEY,apikey:process.env.SUPABASE_PUBLISHABLE_KEY},body:JSON.stringify({email,password,email_confirm:true,user_metadata:{},app_metadata:{app_role:"university_owner"}})});
      const ownerId=created.id;
      const orgId=crypto.randomUUID();
      try{
        await sb("/rest/v1/us_organizations",{method:"POST",headers:{"Prefer":"return=minimal"},body:JSON.stringify({id:orgId,name,code,school,timezone,status:"Active",owner_user_id:ownerId})});
        await sb("/rest/v1/us_organization_users",{method:"POST",headers:{"Prefer":"return=minimal"},body:JSON.stringify({organization_id:orgId,user_id:ownerId,role:"owner"})});
        await sb("/rest/v1/us_calendar_settings",{method:"POST",headers:{"Prefer":"return=minimal"},body:JSON.stringify({organization_id:orgId,days:["MON","TUE","WED","THU","FRI"],periods:8,start_time:"09:00",duration_minutes:50,short_breaks:[2],lunch_breaks:[5]})});
      }catch(err){
        await fetch(String(process.env.SUPABASE_URL||"").replace(/\/$/,"")+"/auth/v1/admin/users/"+ownerId,{method:"DELETE",headers:{Authorization:"Bearer "+process.env.SUPABASE_SERVICE_ROLE_KEY,apikey:process.env.SUPABASE_PUBLISHABLE_KEY}}).catch(()=>{});
        throw err;
      }
      return res.status(201).json({ok:true,organization:{id:orgId,name,code,school,status:"Active",owner_user_id:ownerId,owner_email:email}});
    }
    if(req.method==="PATCH"){
      let b=req.body;if(typeof b==="string")b=JSON.parse(b);const id=String(b?.id||"").trim(),status=String(b?.status||"");
      if(!id||!["Active","Suspended"].includes(status))return res.status(400).json({error:"Valid organization id and status are required."});
      await sb("/rest/v1/us_organizations?id=eq."+encodeURIComponent(id),{method:"PATCH",headers:{"Prefer":"return=minimal"},body:JSON.stringify({status})});
      return res.status(200).json({ok:true});
    }
    res.setHeader("Allow","GET, POST, PATCH");return res.status(405).json({error:"Method not allowed"});
  }catch(error){console.error("Platform organization API error:",error);return res.status(500).json({error:error.message||"Platform operation failed"});}
};
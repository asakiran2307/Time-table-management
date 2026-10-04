(function(){
  const SUPABASE_CDN="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
  let clientPromise=null;
  async function loadConfig(){
    const r=await fetch("/api/auth-config",{cache:"no-store"});let j={};try{j=await r.json()}catch{}
    if(!r.ok||!j.configured)throw new Error(j.error||"Authentication is not configured.");
    return j;
  }
  async function client(){
    if(!clientPromise)clientPromise=loadConfig().then(c=>{
      if(!window.supabase||!window.supabase.createClient)throw new Error("Supabase client library failed to load.");
      return window.supabase.createClient(c.url,c.key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
    });
    return clientPromise;
  }
  async function signIn(email,password){
    const sb=await client();const {data,error}=await sb.auth.signInWithPassword({email,password});
    if(error)throw error;
    const role=await resolveRole(sb,data.user);
    if(!role){await sb.auth.signOut();throw new Error("This account is not authorized for UniSchedule. Ask the Master Admin to provision it.");}
    localStorage.setItem("US_ROLE",role.type);
    if(role.organization)localStorage.setItem("US_ORG",JSON.stringify(role.organization));
    return role;
  }
  async function resolveRole(sb,user){
    const master=await sb.from("us_platform_admins").select("user_id").eq("user_id",user.id).maybeSingle();
    if(!master.error&&master.data)return {type:"MASTER_ADMIN",user};
    const member=await sb.from("us_organization_users").select("organization_id,role").eq("user_id",user.id).maybeSingle();
    if(!member.error&&member.data&&member.data.role==="owner"){
      const org=await sb.from("us_organizations").select("id,name,code,school,timezone,status").eq("id",member.data.organization_id).maybeSingle();
      if(org.data&&org.data.status==="Active")return {type:"UNIVERSITY_OWNER",organization:org.data,user};
    }
    return null;
  }
  async function getRole(){
    const sb=await client();const {data:{session}}=await sb.auth.getSession();if(!session?.user)return null;return resolveRole(sb,session.user);
  }
  async function signOut(){const sb=await client();await sb.auth.signOut();localStorage.removeItem("US_ROLE");localStorage.removeItem("US_ORG");location.href="login.html";}
  async function require(role){
    if(location.hash.startsWith("#shared="))return {shared:true,type:"PUBLIC_VIEW"};
    try{
      const r=await getRole();
      if(!r||r.type!==role){await signOut();return null;}
      return r;
    }catch(e){if(location.pathname.endsWith("login.html"))throw e;location.href="login.html?reason="+encodeURIComponent(e.message);return null;}
  }
  window.USAuth={client,signIn,getRole,signOut,require};
})();
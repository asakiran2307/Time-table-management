const crypto=require("node:crypto");
const {neon}=require("@neondatabase/serverless");
function db(){if(!process.env.DATABASE_URL)throw new Error("DATABASE_URL is not configured");return neon(process.env.DATABASE_URL);}
function cookieValue(req,name){const raw=String(req.headers.cookie||"");for(const part of raw.split(";")){const i=part.indexOf("=");if(i>0&&part.slice(0,i).trim()===name)return decodeURIComponent(part.slice(i+1).trim());}return "";}
function sameOrigin(req){const origin=req.headers.origin;if(!origin)return true;try{const host=req.headers["x-forwarded-host"]||req.headers.host;return !!host&&new URL(origin).host===host;}catch{return false;}}
function sessionCookie(token,maxAge){const secure=process.env.NODE_ENV==="production"?"; Secure":"";return "us_session="+encodeURIComponent(token)+"; Path=/; HttpOnly; SameSite=Lax; Max-Age="+maxAge+secure;}
async function getSession(req){
 const token=cookieValue(req,"us_session");if(!token||token.length<40)return null;
 const tokenHash=crypto.createHash("sha256").update(token).digest("hex");
 const sql=db();
 const rows=await sql`select u.id as user_id,u.email,u.display_name,m.role as membership_role,o.id as organization_id,o.name as organization_name,o.code,o.school,o.timezone,o.status
 from us_sessions s join us_users u on u.id=s.user_id join us_organization_users m on m.user_id=u.id join us_organizations o on o.id=m.organization_id
 where s.token_hash=${tokenHash} and s.expires_at>now() and u.active=true limit 1`;
 if(!rows.length||rows[0].status!=="Active")return null;
 const r=rows[0];
 return {user:{id:r.user_id,email:r.email,name:r.display_name},membershipRole:r.membership_role,organization:{id:r.organization_id,name:r.organization_name,code:r.code,school:r.school,timezone:r.timezone,status:r.status},type:"UNIVERSITY_OWNER"};
}
module.exports={db,getSession,cookieValue,sessionCookie,sameOrigin};

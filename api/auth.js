const crypto=require("node:crypto");
const {promisify}=require("node:util");
const scrypt=promisify(crypto.scrypt);
const {db,getSession,cookieValue,sessionCookie}=require("./_lib/auth");
function send(res,status,data){return res.status(status).json(data);}
function passwordMatches(password,stored){
 const parts=String(stored||"").split("$");if(parts.length!==3||parts[0]!=="scrypt")return false;
 const salt=Buffer.from(parts[1],"hex"),expected=Buffer.from(parts[2],"hex");
 const actual=crypto.scryptSync(password,salt,expected.length);
 return expected.length===actual.length&&crypto.timingSafeEqual(expected,actual);
}
module.exports=async function(req,res){
 res.setHeader("Cache-Control","no-store, max-age=0");res.setHeader("X-Content-Type-Options","nosniff");
 try{
  const sql=db();
  if(req.method==="GET"){
   const session=await getSession(req);
   if(!session)return send(res,200,{authenticated:false});
   return send(res,200,{authenticated:true,...session});
  }
  if(req.method!=="POST"){res.setHeader("Allow","GET, POST");return send(res,405,{error:"Method not allowed"});}
  const body=typeof req.body==="string"?JSON.parse(req.body||"{}"):(req.body||{});
  if(body.action==="logout"){
   const token=cookieValue(req,"us_session");
   if(token){const hash=crypto.createHash("sha256").update(token).digest("hex");await sql`delete from us_sessions where token_hash=${hash}`;}
   res.setHeader("Set-Cookie",sessionCookie("",0));return send(res,200,{ok:true});
  }
  const email=String(body.email||"").trim().toLowerCase(),password=String(body.password||"");
  if(!email||!password||email.length>254||password.length>256)return send(res,400,{error:"Enter your registered university email and password."});
  const users=await sql`select u.id,u.email,u.display_name,u.password_hash,u.active,m.role,m.organization_id,o.name as organization_name,o.code,o.school,o.timezone,o.status
   from us_users u join us_organization_users m on m.user_id=u.id join us_organizations o on o.id=m.organization_id
   where lower(u.email)=${email} limit 1`;
  const user=users[0];
  if(!user||!user.active||user.status!=="Active"||!passwordMatches(password,user.password_hash))return send(res,401,{error:"Email or password is incorrect."});
  const token=crypto.randomBytes(32).toString("hex"),hash=crypto.createHash("sha256").update(token).digest("hex");
  await sql`insert into us_sessions(user_id,token_hash,expires_at) values(${user.id},${hash},now()+interval '7 days')`;
  res.setHeader("Set-Cookie",sessionCookie(token,604800));
  return send(res,200,{ok:true,type:"UNIVERSITY_OWNER",membershipRole:user.role,organization:{id:user.organization_id,name:user.organization_name,code:user.code,school:user.school,timezone:user.timezone,status:user.status},user:{id:user.id,email:user.email,name:user.display_name}});
 }catch(error){console.error("Auth API error",error);return send(res,503,{error:"Secure sign-in is temporarily unavailable. Please try again."});}
};

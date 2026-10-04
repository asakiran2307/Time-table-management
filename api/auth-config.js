module.exports = function handler(req,res){
  res.setHeader("Cache-Control","public, max-age=60");
  res.setHeader("X-Content-Type-Options","nosniff");
  if(req.method!=="GET")return res.status(405).json({error:"Method not allowed"});
  const url=process.env.SUPABASE_URL||"";
  const key=process.env.SUPABASE_PUBLISHABLE_KEY||"";
  if(!url||!key)return res.status(503).json({configured:false,error:"Supabase authentication is not configured on this deployment."});
  return res.status(200).json({configured:true,url,key});
};
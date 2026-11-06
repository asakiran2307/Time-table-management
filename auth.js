(function(){
 async function request(url,options={}){
  const response=await fetch(url,{cache:"no-store",credentials:"same-origin",...options,headers:{"Content-Type":"application/json",...(options.headers||{})}});
  let data={};try{data=await response.json()}catch{}
  if(!response.ok)throw new Error(data.error||"Authentication request failed.");
  return data;
 }
 async function signIn(email,password){
  const result=await request("/api/auth",{method:"POST",body:JSON.stringify({action:"login",email,password})});
  if(!result.ok||!result.organization)throw new Error("This account is not assigned to a school workspace.");
  return result;
 }
 async function getRole(){const result=await request("/api/auth");return result.authenticated?result:null;}
 async function signOut(){try{await request("/api/auth",{method:"POST",body:JSON.stringify({action:"logout"})})}finally{location.href="login.html";}}
 async function require(role){
  if(location.hash.startsWith("#shared="))return {shared:true,type:"PUBLIC_VIEW"};
  try{const r=await getRole();if(!r||r.type!==role){await signOut();return null;}return r;}
  catch(e){if(!location.pathname.endsWith("login.html"))location.href="login.html?reason="+encodeURIComponent(e.message);return null;}
 }
 window.USAuth={signIn,getRole,signOut,require};
})();

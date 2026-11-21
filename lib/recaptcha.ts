export async function verifyRecaptcha(token:string):Promise<'ok'|'invalid'|'unavailable'> {
 const siteKey=process.env.RECAPTCHA_SITE_KEY||'';
 const secret=process.env.RECAPTCHA_SECRET_KEY||'';
 const required=process.env.RECAPTCHA_REQUIRED==='true'||!!siteKey||!!secret;
 if(!required)return 'ok';
 if(!siteKey||!secret)return 'unavailable';
 if(!token||token.length>4096)return 'invalid';
 try {
  const response=await fetch('https://www.google.com/recaptcha/api/siteverify',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({secret,response:token}),signal:AbortSignal.timeout(8000),cache:'no-store'});
  if(!response.ok)return 'unavailable';
  const result=await response.json() as {success?:boolean;hostname?:string};
  if(!result.success)return 'invalid';
  const allowed=(process.env.RECAPTCHA_ALLOWED_HOSTNAMES||'amigoscarcare.com,www.amigoscarcare.com').split(',').map(x=>x.trim().toLowerCase()).filter(Boolean);
  if(process.env.NODE_ENV!=='production')allowed.push('localhost','127.0.0.1');
  return result.hostname&&allowed.includes(result.hostname.toLowerCase())?'ok':'invalid';
 } catch {return 'unavailable'}
}

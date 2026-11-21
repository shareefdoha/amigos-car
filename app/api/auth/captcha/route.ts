export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(){
 const siteKey=process.env.RECAPTCHA_SITE_KEY||'';
 const secret=process.env.RECAPTCHA_SECRET_KEY||'';
 const required=process.env.RECAPTCHA_REQUIRED==='true'||!!siteKey||!!secret;
 return Response.json({required,siteKey:required?siteKey:''},{headers:{'Cache-Control':'no-store'}});
}

import {NextRequest,NextResponse} from 'next/server';
export function proxy(req:NextRequest){
 if(!['POST','PUT','PATCH','DELETE'].includes(req.method))return NextResponse.next();
 const origin=req.headers.get('origin');const site=req.headers.get('sec-fetch-site');
 if(site==='cross-site')return NextResponse.json({error:'Cross-site request rejected.'},{status:403});
 if(origin){
  const allowed=(process.env.ADMIN_ALLOWED_ORIGINS||'https://amigoscarcare.com,https://www.amigoscarcare.com').split(',').map(x=>x.trim());
  if(process.env.NODE_ENV!=='production')allowed.push(req.nextUrl.origin);
  if(!allowed.includes(origin))return NextResponse.json({error:'Request origin not permitted.'},{status:403});
 }
 return NextResponse.next();
}
export const config={matcher:['/api/admin/:path*','/api/auth/:path*']};

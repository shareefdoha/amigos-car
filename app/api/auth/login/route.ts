import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { query, insertRow } from '@/lib/db';
import { bad, hash, randomToken, SESSION_COOKIE } from '@/lib/auth';
import { ensureSeed } from '@/lib/seed';
import { rateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';
const bodySchema = z.object({username:z.string().min(1).max(100),password:z.string().min(1).max(200)});
export async function POST(req:Request) {
  if (!rateLimit(req,'admin-login',6,900000)) return bad('Too many sign-in attempts. Wait 15 minutes before trying again.',429);
  let body:unknown;
  try { body = await req.json(); } catch { return bad('Enter your username and password.'); }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return bad('Enter your username and password.');
  try {
    await ensureSeed();
    const {username,password} = parsed.data;
    const result = await query<{id:string;password_hash:string;active:boolean}>('SELECT id,password_hash,active FROM admins WHERE username=$1',[username]);
    const user = result.rows[0];
    if (!user || !user.active || !await bcrypt.compare(password,user.password_hash)) return bad('Those sign-in details are not valid.',401);
    const token = randomToken();
    await insertRow('admin_sessions',{admin_id:user.id,token_hash:hash(token),expires_at:new Date(Date.now()+8*60*60*1000)});
    await query('UPDATE admins SET last_login_at=now() WHERE id=$1',[user.id]);
    const response = Response.json({authenticated:true,message:'Signed in securely.'});
    const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
    response.headers.append('Set-Cookie',`${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=28800${secure}`);
    return response;
  } catch (error) {
    const info = error as {code?:string};
    console.error('Admin sign-in failed',{stage:'database/account',code:info?.code || 'UNKNOWN'});
    return bad('The sign-in service is unavailable. Contact the site administrator to check database configuration.',503);
  }
}

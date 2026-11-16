import { createHmac, randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';
import { query, insertRow } from '@/lib/db';

export const hash = (s: string) => {
  const secret=process.env.AUTH_SECRET;
  if(process.env.NODE_ENV==='production'&&(!secret||secret.length<32))throw new Error('AUTH_SECRET must contain at least 32 characters in production.');
  return createHmac('sha256',secret||'amigos-local-development-key').update(s).digest('hex');
};
export const randomToken = (bytes = 32) => randomBytes(bytes).toString('base64url');
export const SESSION_COOKIE = 'amigos_admin_session';
export async function currentAdmin() {
  const jar = await cookies(); const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const r = await query<{id:string;username:string;email:string;role:string}>(`SELECT a.id,a.username,a.email,a.role FROM admin_sessions s JOIN admins a ON a.id=s.admin_id WHERE s.token_hash=$1 AND s.expires_at>now() AND a.active=true`, [hash(token)]);
  return r.rows[0] ?? null;
}
export async function adminOr401() { const admin = await currentAdmin(); return admin; }
export function bad(message: string, status = 400) { return Response.json({ error: message }, { status }); }
export async function audit(adminId:string, action:string, entity:string, id='') { await insertRow('audit_events',{admin_id:adminId,action,entity,entity_id:id}); }

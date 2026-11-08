import { currentAdmin } from '@/lib/auth'; export const runtime='nodejs';
export async function GET(){const admin=await currentAdmin();return Response.json({authenticated:!!admin,admin:admin?{username:admin.username,email:admin.email,role:admin.role}:null});}

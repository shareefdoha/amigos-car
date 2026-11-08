import { getDb } from '@/lib/db';
export const runtime='nodejs';
export async function GET(){ try { await getDb(); return Response.json({status:'ok',service:'amigos-platform'}); } catch { return Response.json({status:'error'}, {status:503}); } }

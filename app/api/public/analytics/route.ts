import {rateLimit} from '@/lib/rate-limit';
import {z} from 'zod';import{query}from'@/lib/db';import{bad}from'@/lib/auth';export const runtime='nodejs';
const schema=z.object({path:z.string().regex(/^\/[a-zA-Z0-9/_-]{0,100}$/)});
export async function POST(req:Request){if(!rateLimit(req,'page-view',120,60000))return bad('Too many requests. Please try again later.',429);const p=schema.safeParse(await req.json());if(!p.success)return bad('Invalid page path.');await query('INSERT INTO analytics_page_views(page_path) VALUES($1)',[p.data.path]);return Response.json({ok:true},{status:202});}

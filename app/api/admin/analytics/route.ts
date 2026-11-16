import { currentAdmin, bad } from '@/lib/auth';
import { query } from '@/lib/db';
export const runtime = 'nodejs';
export async function GET() {
  if (!await currentAdmin()) return bad('Sign in required.', 401);
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);
  const [total, today, top] = await Promise.all([
    query<{count:number|string}>('SELECT count(*) AS count FROM analytics_page_views WHERE created_at >= $1', [since]),
    query<{count:number|string}>('SELECT count(*) AS count FROM analytics_page_views WHERE created_at >= $1', [todayStart]),
    query<{page_path:string;views:number|string}>('SELECT page_path,count(*) AS views FROM analytics_page_views WHERE created_at >= $1 GROUP BY page_path ORDER BY views DESC LIMIT 8', [since]),
  ]);
  return Response.json({ last30Days:Number(total.rows[0]?.count || 0), today:Number(today.rows[0]?.count || 0), topPages:top.rows.map(row => ({...row,views:Number(row.views)})) });
}

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { Pool } from 'pg';
import { PGlite } from '@electric-sql/pglite';

type QueryResult<T> = { rows: T[]; rowCount: number };
type Db = { query<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<QueryResult<T>> };
let dbPromise: Promise<Db> | undefined;

async function connect(): Promise<Db> {
  const schema = await readFile(path.join(process.cwd(), 'data', 'schema.sql'), 'utf8');
  if (process.env.DATABASE_URL) {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: true } : undefined, max: 10 });
    await pool.query(schema);
    await pool.query("INSERT INTO site_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING");
    return { query: async (sql, params = []) => { const r = await pool.query(sql, params); return { rows: r.rows as never[], rowCount: r.rowCount ?? 0 }; } };
  }
  const local = new PGlite(path.join(process.cwd(), 'data', 'local-db'));
  await local.exec(schema);
  await local.exec("INSERT INTO site_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING");
  return { query: async (sql, params = []) => { const r = await local.query(sql, params as never[]); return { rows: r.rows as never[], rowCount: r.affectedRows ?? r.rows.length }; } };
}
export function getDb() { return dbPromise ??= connect(); }
export async function query<T = Record<string, unknown>>(sql: string, params: unknown[] = []) { return (await getDb()).query<T>(sql, params); }

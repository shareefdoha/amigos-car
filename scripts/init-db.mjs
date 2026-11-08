import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import pg from 'pg';
const schema = await readFile(path.join(process.cwd(), 'data', 'schema.sql'), 'utf8');
if (process.env.DATABASE_URL) {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: true } : undefined });
  await pool.query(schema); await pool.query('INSERT INTO site_settings(id) VALUES(1) ON CONFLICT(id) DO NOTHING'); await pool.end();
} else {
  const db = new PGlite(path.join(process.cwd(), 'data', 'local-db')); await db.exec(schema); await db.exec('INSERT INTO site_settings(id) VALUES(1) ON CONFLICT(id) DO NOTHING'); await db.close();
}
console.log('Database schema is ready.');

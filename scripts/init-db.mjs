import nextEnv from '@next/env';
import { createDatabase } from './database.mjs';
nextEnv.loadEnvConfig(process.cwd(), process.env.NODE_ENV !== 'production');
const db = await createDatabase();
try { await db.initialize(); console.log('Database schema is ready.'); }
finally { await db.close(); }

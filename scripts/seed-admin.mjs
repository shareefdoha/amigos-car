import bcrypt from 'bcryptjs';
import nextEnv from '@next/env';
import { createDatabase } from './database.mjs';
nextEnv.loadEnvConfig(process.cwd(), process.env.NODE_ENV !== 'production');
const { ADMIN_INITIAL_USERNAME: username, ADMIN_INITIAL_EMAIL: email, ADMIN_INITIAL_PASSWORD: password } = process.env;
if (!username || !email || !password || password === 'SET_A_NEW_UNIQUE_PASSWORD_HERE') throw new Error('Set private admin credentials before seeding.');
const db = await createDatabase();
try {
  await db.initialize();
  const exists = await db.query('SELECT id FROM admins WHERE username=$1 OR email=$2', [username, email]);
  if (!exists.rows.length) await db.insert('admins', { username, email, password_hash: await bcrypt.hash(password, 12), role: 'super_admin' });
  console.log(exists.rows.length ? 'An administrator with that username or email already exists.' : 'Initial administrator created.');
} finally { await db.close(); }

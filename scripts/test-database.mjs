import assert from 'node:assert/strict';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createDatabase, mysqlStatement, resolveDatabaseConfig } from './database.mjs';

// Opt in to a dedicated, disposable MySQL database. Never use production/local app data.
const url = process.env.TEST_DATABASE_URL;
if (url && !/^amigos_test_[a-z0-9_]+$/.test(new URL(url).pathname.slice(1))) {
  throw new Error('TEST_DATABASE_URL must name a disposable amigos_test_* database.');
}
const rawPassword = String.raw`p@ss:#;\~'"word`;
const separate = {NODE_ENV:'production',DB_HOST:'db.example.test',DB_NAME:'test_db',DB_USER:'test_user',DB_PASSWORD:rawPassword};
assert.equal(resolveDatabaseConfig(separate).options.password,rawPassword);
assert.equal(resolveDatabaseConfig(separate).options.port,3306);
assert.equal(resolveDatabaseConfig({...separate,DB_PORT:'3307'}).options.port,3307);
assert.equal(resolveDatabaseConfig({...separate,DATABASE_URL:'not-a-url'}).dialect,'mysql');
assert.throws(()=>resolveDatabaseConfig({DB_HOST:'localhost',DATABASE_URL:'mysql://user:pass@host/db'}),/DB_NAME/);
for(const port of ['0','65536','not-a-port','1e3'])assert.throws(()=>resolveDatabaseConfig({...separate,DB_PORT:port}),/DB_PORT/);
assert.throws(()=>resolveDatabaseConfig({NODE_ENV:'production'}),/DB_HOST/);
assert.equal(resolveDatabaseConfig({DATABASE_URL:'postgresql://user:pass@host/db'}).dialect,'postgres');
assert.equal(resolveDatabaseConfig({}).dialect,'pglite');
assert.equal(resolveDatabaseConfig({DATABASE_URL:'postgresql://user:pass@host/db',DATABASE_SSL:'true',DB_SSL:'false'}).ssl.rejectUnauthorized,true);
assert.equal(resolveDatabaseConfig({...separate,DB_SSL:'true'}).options.ssl.rejectUnauthorized,true);
assert.equal(resolveDatabaseConfig({...separate,DB_SSL:'false',DATABASE_SSL:'true'}).options.ssl,undefined);
const testUri = url ? new URL(url) : null;
const splitEnv = process.env.TEST_SEPARATE_DB === 'true' && testUri ? {DATABASE_URL:'',DB_HOST:testUri.hostname,DB_PORT:testUri.port||'3306',DB_NAME:decodeURIComponent(testUri.pathname.slice(1)),DB_USER:decodeURIComponent(testUri.username),DB_PASSWORD:decodeURIComponent(testUri.password)} : {};
const db = await createDatabase({
  NODE_ENV: 'test', DATABASE_URL: url || '', DATABASE_SSL: process.env.TEST_DATABASE_SSL || 'false', ...splitEnv,
  LOCAL_DATABASE_PATH: path.join(await mkdtemp(path.join(tmpdir(), 'amigos-db-test-')), 'pglite'),
});
try {
  const bound = mysqlStatement("SELECT '$1', $2, $1, $2", ['one', "x'); DROP TABLE admins; --"]);
  assert.equal(bound.statement, "SELECT '$1', ?, ?, ?");
  assert.deepEqual(bound.values, ["x'); DROP TABLE admins; --", 'one', "x'); DROP TABLE admins; --"]);
  await db.initialize();
  await db.initialize();
  const admin = await db.insert('admins', { username:'test-admin', email:'test@example.com', password_hash:'test-hash' });
  assert.match(admin.id, /^[a-f0-9-]{36}$/);
  assert.equal(admin.active, true);
  await assert.rejects(db.insert('admins', { username:'test-admin', email:'other@example.com', password_hash:'hash' }));
  await assert.rejects(db.insert('admin_sessions', { admin_id:'00000000-0000-4000-8000-000000000000', token_hash:'invalid', expires_at:new Date() }));
  const service = await db.insert('services', {slug:'test-service',title_en:'خدمة السيارات',summary_en:'Test service',details_en:['فحص المحرك', 'Oil change'],image_path:'/test.jpg',active:false}, 'slug');
  assert.deepEqual(service.details_en, ['فحص المحرك', 'Oil change']);
  assert.deepEqual(service.gallery_images, []);
  assert.equal(service.active, false);
  const existing = await db.insert('services', {slug:'test-service',title_en:'Do not overwrite',summary_en:'Test',image_path:'/other.jpg'}, 'slug');
  assert.equal(existing.id, service.id);
  assert.equal(existing.title_en, 'خدمة السيارات');
  const offer = await db.insert('offers', {title_en:'Test offer',description_en:'Test',starts_at:new Date('2026-11-01T10:00:00Z'),ends_at:null});
  assert.equal(new Date(offer.starts_at).toISOString(), '2026-11-01T10:00:00.000Z');
  const enquiry = await db.insert('enquiries', {kind:'career',contact_name:'Test applicant',email:'test@example.com',metadata:{cv:{fileName:'test.pdf'}}});
  assert.deepEqual(enquiry.metadata, {cv:{fileName:'test.pdf'}});
  const booking = await db.insert('enquiries', {kind:'booking',contact_name:'Test booking',email:'test@example.com'});
  assert.deepEqual(booking.metadata, {});
  const session = await db.insert('admin_sessions', {admin_id:admin.id,token_hash:'valid-token',expires_at:new Date(Date.now()+60000)});
  assert.equal((await db.query('SELECT id FROM admin_sessions WHERE id=$1 AND expires_at>now()', [session.id])).rows.length,1);
  const challenge = await db.insert('login_challenges',{admin_id:admin.id,code_hash:'test-code-hash',expires_at:new Date(Date.now()+60000)});
  assert.equal(challenge.attempts,0);
  const migration = 'integration-migration';
  await db.migrate(migration,["UPDATE services SET sort_order=sort_order+1 WHERE slug='test-service'"]);
  await db.migrate(migration,["UPDATE services SET sort_order=sort_order+1 WHERE slug='test-service'"]);
  assert.equal((await db.query('SELECT sort_order FROM services WHERE id=$1',[service.id])).rows[0].sort_order,1);
  await assert.rejects(db.migrate('rollback-migration',["UPDATE services SET sort_order=99 WHERE slug='test-service'", 'UPDATE missing_table SET id=1']));
  assert.equal((await db.query("SELECT migration_id FROM app_migrations WHERE migration_id='rollback-migration'")).rows.length,0);
  assert.equal((await db.query('SELECT sort_order FROM services WHERE id=$1',[service.id])).rows[0].sort_order,1);
  await Promise.all([db.migrate('parallel-migration',["UPDATE services SET sort_order=sort_order+1 WHERE slug='test-service'"]),db.migrate('parallel-migration',["UPDATE services SET sort_order=sort_order+1 WHERE slug='test-service'"])]);
  assert.equal((await db.query('SELECT sort_order FROM services WHERE id=$1',[service.id])).rows[0].sort_order,2);
  await db.insert('analytics_page_views',{page_path:'/'});
  const stats = await db.query('SELECT page_path,count(*) AS views FROM analytics_page_views WHERE created_at >= $1 GROUP BY page_path ORDER BY views DESC LIMIT 8',[new Date(Date.now()-86400000)]);
  assert.equal(Number(stats.rows[0].views),1);
  await db.query('DELETE FROM admins WHERE id=$1',[admin.id]);
  assert.equal((await db.query('SELECT id FROM admin_sessions WHERE id=$1',[session.id])).rows.length,0);
  console.log(`${url ? 'MySQL/MariaDB' : 'PGlite'} integration checks passed: schema, UUIDs, constraints, JSON, Arabic, dates, sessions, migrations, analytics.`);
} finally { await db.close(); }

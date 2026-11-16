import { createDatabase, type Database } from '../scripts/database.mjs';
let dbPromise: Promise<Database> | undefined;
export function getDb() {
  return dbPromise ??= createDatabase().then(async db => {
    try { await db.initialize(); return db; }
    catch (error) { await db.close(); throw error; }
  }).catch(error => { dbPromise = undefined; throw error; });
}
export async function query<T = Record<string, unknown>>(sql: string, params: unknown[] = []) {
  return (await getDb()).query<T>(sql, params);
}
export async function insertRow<T = Record<string, unknown>>(table: string, values: Record<string, unknown>, conflictKey?: string) {
  return (await getDb()).insert<T>(table, values, conflictKey);
}
export async function runMigration(id: string, statements: string[]) {
  return (await getDb()).migrate(id, statements);
}

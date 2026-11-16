import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import mysql from 'mysql2/promise';
import pg from 'pg';
import { PGlite } from '@electric-sql/pglite';

const identifier = value => {
  if (!/^[a-z_][a-z0-9_]*$/.test(value)) throw new Error('Invalid database identifier.');
  return value;
};

export function mysqlStatement(sql, params = []) {
  const values = [];
  // Preserve quoted SQL literals, including literal dollar signs.
  const statement = sql.replace(/'(?:''|\\.|[^'\\])*'|"(?:""|\\.|[^"\\])*"|\$(\d+)/g, (token, index) => {
    if (!index) return token;
    const position = Number(index) - 1;
    if (position >= params.length) throw new Error('Missing SQL parameter.');
    values.push(params[position] === undefined ? null : params[position]);
    return '?';
  });
  return { statement, values };
}

function normalizeRows(rows) {
  return rows.map(row => {
    const result = { ...row };
    for (const key of ['active', 'notification_sent']) if (key in result) result[key] = Boolean(result[key]);
    // MariaDB returns JSON strings; MySQL can return parsed objects.
    for (const key of ['details_en', 'details_ar', 'gallery_images', 'metadata']) {
      if (typeof result[key] === 'string') result[key] = JSON.parse(result[key]);
    }
    return result;
  });
}

export async function createDatabase(env = process.env) {
  const url = env.DATABASE_URL;
  const isMysql = url?.startsWith('mysql://') || url?.startsWith('mariadb://');
  if (url && !isMysql && !/^postgres(?:ql)?:\/\//.test(url)) throw new Error('DATABASE_URL must use mysql://, mariadb:// or postgresql://.');
  if (!url && env.NODE_ENV === 'production') throw new Error('DATABASE_URL is required in production.');
  let query, transaction, close;
  if (isMysql) {
    const uri = new URL(url);
    const pool = mysql.createPool({
      host: uri.hostname, port: Number(uri.port || 3306),
      user: decodeURIComponent(uri.username), password: decodeURIComponent(uri.password),
      database: decodeURIComponent(uri.pathname.slice(1)),
      ssl: env.DATABASE_SSL === 'true' ? { rejectUnauthorized: true } : undefined,
      charset: 'utf8mb4', timezone: 'Z', connectionLimit: 10, multipleStatements: false,
    });
    const run = async (connection, sql, params = []) => {
      const { statement, values } = mysqlStatement(sql, params);
      const [result] = await connection.execute(statement, values);
      return Array.isArray(result)
        ? { rows: normalizeRows(result), rowCount: result.length }
        : { rows: [], rowCount: result.affectedRows };
    };
    const connect = async () => {
      const connection = await pool.getConnection();
      try { await connection.query("SET time_zone = '+00:00'"); return connection; }
      catch (error) { connection.release(); throw error; }
    };
    query = async (sql, params) => {
      const connection = await connect();
      try { return await run(connection, sql, params); } finally { connection.release(); }
    };
    transaction = async callback => {
      const connection = await connect();
      try {
        await connection.beginTransaction();
        const result = await callback((sql, params) => run(connection, sql, params));
        await connection.commit();
        return result;
      } catch (error) { await connection.rollback(); throw error; }
      finally { connection.release(); }
    };
    close = () => pool.end();
  } else if (url) {
    const pool = new pg.Pool({ connectionString: url, ssl: env.DATABASE_SSL === 'true' ? { rejectUnauthorized: true } : undefined, max: 10 });
    const run = async (client, sql, params = []) => {
      const result = await client.query(sql, params);
      return { rows: result.rows, rowCount: result.rowCount ?? 0 };
    };
    query = (sql, params) => run(pool, sql, params);
    transaction = async callback => {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const result = await callback((sql, params) => run(client, sql, params));
        await client.query('COMMIT');
        return result;
      } catch (error) { await client.query('ROLLBACK'); throw error; }
      finally { client.release(); }
    };
    close = () => pool.end();
  } else {
    const local = new PGlite(env.LOCAL_DATABASE_PATH || path.join(process.cwd(), 'data', 'local-db'));
    const run = async (client, sql, params = []) => {
      const result = await client.query(sql, params);
      return { rows: result.rows, rowCount: result.affectedRows ?? result.rows.length };
    };
    query = (sql, params) => run(local, sql, params);
    transaction = callback => local.transaction(tx => callback((sql, params) => run(tx, sql, params)));
    close = () => local.close();
  }

  const insert = async (table, input, conflictKey) => {
    identifier(table);
    const values = { id: randomUUID(), ...input };
    const keys = Object.keys(values).map(identifier);
    const params = Object.values(values).map(value => Array.isArray(value) || (value && typeof value === 'object' && !(value instanceof Date)) ? JSON.stringify(value) : value);
    let sql = `INSERT INTO ${table}(${keys.join(',')}) VALUES(${keys.map((_, index) => `$${index + 1}`).join(',')})`;
    if (conflictKey) {
      identifier(conflictKey);
      sql += isMysql ? ` ON DUPLICATE KEY UPDATE ${conflictKey}=${conflictKey}` : ` ON CONFLICT(${conflictKey}) DO NOTHING`;
    }
    await query(sql, params);
    return (await query(`SELECT * FROM ${table} WHERE ${conflictKey || 'id'}=$1`, [values[conflictKey || 'id']])).rows[0];
  };
  const migrate = (id, statements) => transaction(async run => {
    // Claim the unique marker and commit the changes in the same transaction.
    const result = await run(isMysql
      ? 'INSERT IGNORE INTO app_migrations(migration_id) VALUES($1)'
      : 'INSERT INTO app_migrations(migration_id) VALUES($1) ON CONFLICT(migration_id) DO NOTHING', [id]);
    if (result.rowCount) for (const sql of statements) await run(sql);
  });
  const initialize = async () => {
    const schema = await readFile(path.join(process.cwd(), 'data', isMysql ? 'schema.mysql.sql' : 'schema.sql'), 'utf8');
    // DDL files contain no routines or semicolons inside literals.
    for (const sql of schema.split(';').map(value => value.trim()).filter(Boolean)) await query(sql);
    await query(isMysql ? 'INSERT INTO site_settings(id) VALUES(1) ON DUPLICATE KEY UPDATE id=id' : 'INSERT INTO site_settings(id) VALUES(1) ON CONFLICT(id) DO NOTHING');
  };
  // The standalone Next.js server closes database handles before a normal restart.
  const connections = globalThis[Symbol.for('amigos.databaseConnections')] ??= new Set();
  const closeConnection = close;
  close = async () => {
    try { await closeConnection(); } finally { connections.delete(close); }
  };
  connections.add(close);
  return { query, insert, migrate, initialize, close };
}

export type QueryResult<T = Record<string, unknown>> = { rows: T[]; rowCount: number };
export type Database = {
  query<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<QueryResult<T>>;
  insert<T = Record<string, unknown>>(table: string, values: Record<string, unknown>, conflictKey?: string): Promise<T>;
  migrate(id: string, statements: string[]): Promise<void>;
  initialize(): Promise<void>;
  close(): Promise<void>;
};
export function createDatabase(env?: NodeJS.ProcessEnv): Promise<Database>;
export function mysqlStatement(sql: string, params?: unknown[]): { statement: string; values: unknown[] };

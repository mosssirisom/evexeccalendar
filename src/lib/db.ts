/**
 * Database connection helper.
 * In production, replace this with your PostgreSQL / Supabase client.
 *
 * When DATABASE_URL is present the app will use pg; otherwise it falls
 * back to the in-memory mock store (src/data/mockData.ts) so the UI
 * works without a database during local development.
 */

// Connection pool — only instantiated when DATABASE_URL is set.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let pool: any = null;

export async function getPool() {
  if (!process.env.DATABASE_URL) return null;

  if (!pool) {
    // Dynamic import keeps `pg` optional; add it to dependencies when using a real DB.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Pool } = require("pg");
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
  }
  return pool;
}

export async function query<T = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  const p = await getPool();
  if (!p) throw new Error("No DATABASE_URL configured");
  const result = await p.query(text, params);
  return result.rows as T[];
}

import { attachDatabasePool } from '@neon/functions'
import pg from 'pg'

// numeric(12,2) comes back as a string by default; parse it so amounts are numbers.
pg.types.setTypeParser(1700, (value) => Number.parseFloat(value))

// One small pool per isolate, reused across requests (Neon injects DATABASE_URL).
export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
})
attachDatabasePool(pool)

export async function query<T extends pg.QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  const result = await pool.query<T>(text, params)
  return result.rows
}

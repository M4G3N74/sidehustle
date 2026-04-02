import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/hustletrack';

const globalForPg = globalThis as unknown as {
  __pgClient: ReturnType<typeof postgres>;
};

if (!globalForPg.__pgClient) {
  globalForPg.__pgClient = postgres(connectionString, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  });
}

export const db = drizzle(globalForPg.__pgClient, { schema });

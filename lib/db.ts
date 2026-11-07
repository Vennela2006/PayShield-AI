import { Pool } from 'pg';

const globalForPostgres = globalThis as typeof globalThis & {
  payshieldPool?: Pool;
};

function createPool(): Pool {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL is not configured.');
  }

  return new Pool({
    connectionString,
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });
}

export const db =
  globalForPostgres.payshieldPool ?? createPool();

if (process.env.NODE_ENV !== 'production') {
  globalForPostgres.payshieldPool = db;
}

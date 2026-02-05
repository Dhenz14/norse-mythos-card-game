/**
 * Database Connection Module
 * 
 * This module sets up the database connection using Drizzle ORM with PostgreSQL.
 * It uses the connection string from the environment variables.
 */

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

// Get database URL from environment
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable not set');
}

console.log(`Database connection initialized with URL: ${databaseUrl.replace(/:[^:]*@/, ':***@')}`);

// Create connection pool with SSL support
const pool = new Pool({
  connectionString: databaseUrl,
  ssl: databaseUrl.includes('sslmode=require') ? { rejectUnauthorized: false } : false,
});

// Create drizzle instance with the pg pool
export const db = drizzle(pool);

// Export direct pool for SQL migrations
export const directDb = pool;

// Export for use in other modules
export default db;
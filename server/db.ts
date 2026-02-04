/**
 * Database Connection Module
 * 
 * This module sets up the database connection using Drizzle ORM with PostgreSQL.
 * It uses the connection string from the environment variables.
 */

import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool } from 'pg';
import { neon } from '@neondatabase/serverless';

// Get database URL from environment
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable not set');
}

console.log(`Database connection initialized with URL: ${databaseUrl.replace(/:[^:]*@/, ':***@')}`);

// For neon serverless
const sql = neon(databaseUrl);

// For direct SQL queries
const pool = new Pool({
  connectionString: databaseUrl,
});

// Create drizzle instance with the neon connection
// @ts-ignore - Type mismatch in drizzle-orm with neon
export const db = drizzle(sql);

// Export direct pool for SQL migrations
export const directDb = pool;

// Export for use in other modules
export default db;
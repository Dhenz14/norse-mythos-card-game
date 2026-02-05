import { Pool } from 'pg';

// Get the database URL from environment variables
const databaseUrl = process.env.DATABASE_URL as string;

if (!databaseUrl) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}

// Create a connection pool with SSL support for Replit
const pool = new Pool({
  connectionString: databaseUrl,
  ssl: databaseUrl.includes('sslmode=require') ? { rejectUnauthorized: false } : false,
});

// Create a convenience wrapper for SQL queries
export const db = {
  // Execute a SQL query with parameters
  async query(text: string, params: any[] = []) {
    try {
      const result = await pool.query(text, params);
      return { rows: result.rows };
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  },
  
  // Alias for query to provide compatibility with previous code
  execute: function(text: string, params: any[] = []) {
    return this.query(text, params);
  }
};

// Export pool for direct access if needed
export { pool };

// For debugging purposes
console.log('Database connection initialized with URL:', databaseUrl.replace(/:[^:]*@/, ':***@'));
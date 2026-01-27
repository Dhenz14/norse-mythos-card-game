import { neon } from '@neondatabase/serverless';

// Get the database URL from environment variables
const databaseUrl = process.env.DATABASE_URL as string;

if (!databaseUrl) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}

// Create a Neon SQL query function with the ws protocol for better compatibility
export const sql = neon(databaseUrl);

// Create a convenience wrapper for SQL queries
export const db = {
  // Execute a SQL query with parameters
  async query(text: string, params: any[] = []) {
    try {
      // Convert to template literal style query that neon expects
      let query = text;
      const values = [...params];
      
      // Replace $1, $2, etc. with appropriate placeholder
      if (params.length > 0) {
        // We're manually replacing the parameters here to use neon's tagged template literals
        let paramIndex = 1;
        while (query.includes(`$${paramIndex}`)) {
          query = query.replace(`$${paramIndex}`, '${values[' + (paramIndex - 1) + ']}');
          paramIndex++;
        }
      }
      
      // Create a function that will execute the query with the given params
      const dynamicQuery = new Function('sql', 'values', `return sql\`${query}\`;`);
      
      // Execute the query
      const result = await dynamicQuery(sql, values);
      return { rows: result };
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

// For debugging purposes
console.log('Database connection initialized with URL:', databaseUrl.replace(/:[^:]*@/, ':***@'));
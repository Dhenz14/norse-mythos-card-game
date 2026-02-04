import { drizzle } from 'drizzle-orm/neon-serverless';
import { neon } from '@neondatabase/serverless';
import { migrate } from 'drizzle-orm/neon-serverless/migrator';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get database connection string from environment variables
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL not found in environment variables');
  process.exit(1);
}

// Function to run migrations
async function runMigrations() {
  try {
    console.log('Starting database migrations...');
    
    const sql = neon(DATABASE_URL);
    const db = drizzle(sql);
    
    // Run migrations from the drizzle folder
    await migrate(db, { migrationsFolder: 'drizzle' });
    
    console.log('Database migrations completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error running migrations:', error);
    process.exit(1);
  }
}

// Run the migrations
runMigrations();
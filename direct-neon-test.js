// Direct Neon client test using raw queries
import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testDirectNeon() {
  try {
    // Get the database URL
    const databaseUrl = process.env.DATABASE_URL;
    
    if (!databaseUrl) {
      console.error('DATABASE_URL environment variable is not set');
      return;
    }
    
    console.log('Database URL:', databaseUrl.replace(/:[^:]*@/, ':***@'));
    console.log('Testing direct Neon client access...');
    
    // Create a Neon SQL query function
    const sql = neon(databaseUrl);
    
    // Test querying users
    console.log('\n1. Testing direct Neon for user retrieval:');
    const userResult = await sql`SELECT * FROM users LIMIT 1`;
    console.log('User query result:', userResult);
    
    // Test querying think_tools_sessions
    console.log('\n2. Testing direct Neon for session retrieval:');
    const sessionResult = await sql`SELECT * FROM think_tools_sessions LIMIT 1`;
    console.log('Session query result:', sessionResult);
    
    // Test querying reasoning_results
    console.log('\n3. Testing direct Neon for reasoning results retrieval:');
    const resultsResult = await sql`SELECT * FROM reasoning_results LIMIT 3`;
    console.log('Reasoning results query result:', resultsResult);
    
    // Test querying reasoning_metrics
    console.log('\n4. Testing direct Neon for reasoning metrics retrieval:');
    const metricsResult = await sql`SELECT * FROM reasoning_metrics LIMIT 1`;
    console.log('Reasoning metrics query result:', metricsResult);
    
    console.log('\nDirect Neon client test completed successfully!');
  } catch (error) {
    console.error('Error in direct Neon client test:', error);
  }
}

// Run the test
testDirectNeon();
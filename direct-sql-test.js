// Direct SQL test using raw queries 
import { db } from './server/database.js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testDirectSQL() {
  try {
    console.log('Testing direct SQL access to Think Tools tables...');
    
    // Test querying users
    console.log('\n1. Testing direct SQL for user retrieval:');
    // @ts-expect-error: Using direct SQL execution
    const userResult = await db.execute('SELECT * FROM users LIMIT 1');
    console.log('User query result:', userResult.rows);
    
    // Test querying think_tools_sessions
    console.log('\n2. Testing direct SQL for session retrieval:');
    // @ts-expect-error: Using direct SQL execution
    const sessionResult = await db.execute('SELECT * FROM think_tools_sessions LIMIT 1');
    console.log('Session query result:', sessionResult.rows);
    
    // Test querying reasoning_results
    console.log('\n3. Testing direct SQL for reasoning results retrieval:');
    // @ts-expect-error: Using direct SQL execution
    const resultsResult = await db.execute('SELECT * FROM reasoning_results LIMIT 3');
    console.log('Reasoning results query result:', resultsResult.rows);
    
    // Test querying reasoning_metrics
    console.log('\n4. Testing direct SQL for reasoning metrics retrieval:');
    // @ts-expect-error: Using direct SQL execution
    const metricsResult = await db.execute('SELECT * FROM reasoning_metrics LIMIT 1');
    console.log('Reasoning metrics query result:', metricsResult.rows);
    
    console.log('\nDirect SQL test completed successfully!');
  } catch (error) {
    console.error('Error in direct SQL test:', error);
  }
}

// Run the test
testDirectSQL();
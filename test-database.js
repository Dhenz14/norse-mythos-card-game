// Test script to verify the database integration for Think Tools

import { storage } from './server/storage.js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testDatabaseIntegration() {
  try {
    console.log('Testing Think Tools Database Integration...');
    
    // Test getUserByUsername
    console.log('\n1. Testing user retrieval:');
    const user = await storage.getUserByUsername('test_user');
    console.log('Retrieved user:', user);
    
    // Test getThinkToolsSession
    console.log('\n2. Testing session retrieval:');
    const session = await storage.getThinkToolsSession(1);
    console.log('Retrieved session:', session);
    
    // Test getThinkToolsSessionsByUserId
    console.log('\n3. Testing user sessions retrieval:');
    const sessions = await storage.getThinkToolsSessionsByUserId(1);
    console.log('Retrieved sessions:', sessions);
    
    // Test getReasoningResultsBySessionId
    console.log('\n4. Testing reasoning results retrieval:');
    const results = await storage.getReasoningResultsBySessionId(1);
    console.log('Retrieved reasoning results:', results);
    
    // Test getReasoningMetricsBySessionId
    console.log('\n5. Testing reasoning metrics retrieval:');
    const metrics = await storage.getReasoningMetricsBySessionId(1);
    console.log('Retrieved reasoning metrics:', metrics);
    
    console.log('\nDatabase integration test completed successfully!');
  } catch (error) {
    console.error('Error testing database integration:', error);
  }
}

// Run tests
testDatabaseIntegration();
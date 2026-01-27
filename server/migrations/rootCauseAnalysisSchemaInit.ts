/**
 * Root Cause Analysis Schema Initialization
 * 
 * This script creates the necessary database tables for the root cause analysis functionality.
 * It uses a direct PostgreSQL connection to execute raw SQL statements.
 */

import { directDb } from '../db';
import RootCauseDBConnector from '../mcp/RootCauseDBConnector';
import { rootCauseAnalyses, rootCausePatterns, rootCauseRelationships, rootCauseMemory } from '../schema/rootCauseSchema';

async function main() {
  try {
    console.log('Creating Root Cause Analysis schema...');
    
    // Create tables if they don't exist
    try {
      await directDb.query(`
        CREATE TABLE IF NOT EXISTS root_cause_analyses (
          id TEXT PRIMARY KEY,
          issue TEXT NOT NULL,
          result TEXT NOT NULL,
          timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
          patterns TEXT DEFAULT '[]',
          related_issues TEXT DEFAULT '[]'
        );
      `);
    } catch (error) {
      console.log('Using RootCauseDBConnector as fallback for directDb...');
      await RootCauseDBConnector.query(`
        CREATE TABLE IF NOT EXISTS root_cause_analyses (
          id TEXT PRIMARY KEY,
          issue TEXT NOT NULL,
          result TEXT NOT NULL,
          timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
          patterns TEXT DEFAULT '[]',
          related_issues TEXT DEFAULT '[]'
        );
      `);
    }
    
    await directDb.query(`
      CREATE TABLE IF NOT EXISTS root_cause_patterns (
        id TEXT PRIMARY KEY,
        pattern TEXT NOT NULL UNIQUE,
        occurrences INTEGER DEFAULT 0 NOT NULL,
        first_detected TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        last_detected TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        solutions TEXT DEFAULT '[]'
      );
    `);
    
    await directDb.query(`
      CREATE TABLE IF NOT EXISTS root_cause_relationships (
        id TEXT PRIMARY KEY,
        source_issue_id TEXT NOT NULL REFERENCES root_cause_analyses(id),
        target_issue_id TEXT NOT NULL REFERENCES root_cause_analyses(id),
        relationship_type TEXT NOT NULL,
        strength INTEGER DEFAULT 50 NOT NULL
      );
    `);
    
    await directDb.query(`
      CREATE TABLE IF NOT EXISTS root_cause_memory (
        id SERIAL PRIMARY KEY,
        analysis_id TEXT REFERENCES root_cause_analyses(id),
        path TEXT NOT NULL,
        access_count INTEGER DEFAULT 1 NOT NULL,
        last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        metadata TEXT DEFAULT '{}'
      );
    `);
    
    // Create indexes for performance
    await directDb.query(`
      CREATE INDEX IF NOT EXISTS idx_root_cause_analyses_timestamp ON root_cause_analyses(timestamp);
    `);
    
    await directDb.query(`
      CREATE INDEX IF NOT EXISTS idx_root_cause_patterns_occurrences ON root_cause_patterns(occurrences);
    `);
    
    await directDb.query(`
      CREATE INDEX IF NOT EXISTS idx_root_cause_memory_path ON root_cause_memory(path);
    `);
    
    await directDb.query(`
      CREATE INDEX IF NOT EXISTS idx_root_cause_memory_analysis_id ON root_cause_memory(analysis_id);
    `);
    
    console.log('Root Cause Analysis schema created successfully!');
  } catch (error) {
    console.error('Error creating Root Cause Analysis schema:', error);
    throw error;
  }
}

// Export the initialization function
export { main as initRootCauseAnalysisSchema };
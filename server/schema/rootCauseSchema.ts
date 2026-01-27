/**
 * Root Cause Analysis Database Schema
 * 
 * This module defines the database schema for the Root Cause Analysis functionality.
 * It uses Drizzle ORM to define the tables, columns, and relationships.
 */

import { text, timestamp, integer, serial, pgTable } from 'drizzle-orm/pg-core';

/**
 * Root Cause Analyses Table
 * 
 * Stores the results of root cause analyses. Each analysis has a unique ID,
 * an issue description, and the detailed result of the analysis.
 */
export const rootCauseAnalyses = pgTable('root_cause_analyses', {
  id: text('id').primaryKey(),
  issue: text('issue').notNull(),
  result: text('result').notNull(),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  patterns: text('patterns').default('[]'),
  relatedIssues: text('related_issues').default('[]')
});

/**
 * Root Cause Patterns Table
 * 
 * Stores common patterns identified across multiple analyses.
 * These patterns can be used to quickly identify similar issues.
 */
export const rootCausePatterns = pgTable('root_cause_patterns', {
  id: text('id').primaryKey(),
  pattern: text('pattern').notNull().unique(),
  occurrences: integer('occurrences').default(0).notNull(),
  firstDetected: timestamp('first_detected').defaultNow().notNull(),
  lastDetected: timestamp('last_detected').defaultNow().notNull(),
  solutions: text('solutions').default('[]')
});

/**
 * Root Cause Relationships Table
 * 
 * Stores relationships between different root cause analyses.
 * This helps build a knowledge graph of related issues.
 */
export const rootCauseRelationships = pgTable('root_cause_relationships', {
  id: text('id').primaryKey(),
  sourceIssueId: text('source_issue_id')
    .notNull()
    .references(() => rootCauseAnalyses.id),
  targetIssueId: text('target_issue_id')
    .notNull()
    .references(() => rootCauseAnalyses.id),
  relationshipType: text('relationship_type').notNull(),
  strength: integer('strength').default(50).notNull()
});

/**
 * Root Cause Memory Table
 * 
 * Stores information about which files were accessed during analyses.
 * This helps build a navigation map for future analyses.
 */
export const rootCauseMemory = pgTable('root_cause_memory', {
  id: serial('id').primaryKey(),
  analysisId: text('analysis_id').references(() => rootCauseAnalyses.id),
  path: text('path').notNull(),
  accessCount: integer('access_count').default(1).notNull(),
  lastAccessed: timestamp('last_accessed').defaultNow().notNull(),
  metadata: text('metadata').default('{}')
});

// Types for Drizzle ORM
export type RootCauseAnalysis = typeof rootCauseAnalyses.$inferSelect;
export type NewRootCauseAnalysis = typeof rootCauseAnalyses.$inferInsert;

export type RootCausePattern = typeof rootCausePatterns.$inferSelect;
export type NewRootCausePattern = typeof rootCausePatterns.$inferInsert;

export type RootCauseRelationship = typeof rootCauseRelationships.$inferSelect;
export type NewRootCauseRelationship = typeof rootCauseRelationships.$inferInsert;

export type RootCauseMemoryEntry = typeof rootCauseMemory.$inferSelect;
export type NewRootCauseMemoryEntry = typeof rootCauseMemory.$inferInsert;
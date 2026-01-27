/**
 * Root Cause DB Service
 * 
 * This service provides database operations for the Root Cause Analysis feature.
 * It handles storing and retrieving analysis results, patterns, and relationships.
 */

import { db } from '../db';
import RootCauseDBConnector from '../mcp/RootCauseDBConnector';
import { 
  rootCauseAnalyses, 
  rootCausePatterns, 
  rootCauseRelationships,
  rootCauseMemory,
  type RootCauseAnalysis,
  type NewRootCauseAnalysis,
  type RootCausePattern,
  type NewRootCausePattern,
  type RootCauseRelationship,
  type NewRootCauseRelationship,
  type RootCauseMemoryEntry,
  type NewRootCauseMemoryEntry
} from '../schema/rootCauseSchema';
import { eq, desc, asc, like, and, sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export interface NavigationMapNode {
  path: string;
  accessCount: number;
  lastAccessed: Date;
  relatedPaths: {
    path: string;
    relationship: 'parent' | 'child' | 'sibling';
    strength: number;
  }[];
}

export type NavigationMap = Record<string, NavigationMapNode>;

export class RootCauseDBService {
  private static instance: RootCauseDBService;

  private constructor() {}

  public static getInstance(): RootCauseDBService {
    if (!RootCauseDBService.instance) {
      RootCauseDBService.instance = new RootCauseDBService();
    }
    return RootCauseDBService.instance;
  }

  /**
   * Save an analysis result to the database
   */
  public async saveAnalysis(
    issue: string, 
    result: string, 
    patterns: string[] = [], 
    relatedIssues: string[] = []
  ): Promise<RootCauseAnalysis> {
    const id = uuidv4();
    
    const newAnalysis: NewRootCauseAnalysis = {
      id,
      issue,
      result,
      patterns: JSON.stringify(patterns),
      relatedIssues: JSON.stringify(relatedIssues),
      timestamp: new Date()
    };

    try {
      await db.insert(rootCauseAnalyses).values(newAnalysis);
    } catch (error) {
      console.log('Using RootCauseDBConnector as fallback for db insert...');
      const insertQuery = `
        INSERT INTO root_cause_analyses (id, issue, result, patterns, related_issues, timestamp)
        VALUES ($1, $2, $3, $4, $5, $6)
      `;
      await RootCauseDBConnector.query(insertQuery, [
        newAnalysis.id,
        newAnalysis.issue,
        newAnalysis.result,
        newAnalysis.patterns,
        newAnalysis.relatedIssues,
        newAnalysis.timestamp
      ]);
    }
    
    // Process patterns
    if (patterns.length > 0) {
      await this.updatePatterns(patterns);
    }
    
    return {
      id: newAnalysis.id,
      issue: newAnalysis.issue,
      result: newAnalysis.result,
      patterns: newAnalysis.patterns || '[]',
      relatedIssues: newAnalysis.relatedIssues || '[]',
      timestamp: newAnalysis.timestamp as Date
    };
  }
  
  /**
   * Create a new analysis with just the issue
   */
  public async createAnalysis(
    id: string,
    issue: string
  ): Promise<RootCauseAnalysis> {
    const newAnalysis: NewRootCauseAnalysis = {
      id,
      issue,
      result: '',
      patterns: '[]',
      relatedIssues: '[]',
      timestamp: new Date()
    };
    
    await db.insert(rootCauseAnalyses).values(newAnalysis);
    
    return {
      id: newAnalysis.id,
      issue: newAnalysis.issue,
      result: newAnalysis.result,
      patterns: newAnalysis.patterns || '[]',
      relatedIssues: newAnalysis.relatedIssues || '[]',
      timestamp: newAnalysis.timestamp as Date
    };
  }
  
  /**
   * Update an existing analysis
   */
  public async updateAnalysis(
    id: string,
    result: string,
    patterns: string[] = []
  ): Promise<RootCauseAnalysis | null> {
    const updatedAnalysis = await db
      .update(rootCauseAnalyses)
      .set({
        result,
        patterns: JSON.stringify(patterns)
      })
      .where(eq(rootCauseAnalyses.id, id))
      .returning();
    
    return updatedAnalysis.length > 0 ? updatedAnalysis[0] : null;
  }
  
  /**
   * Create a relationship between two analyses
   */
  public async createRelationship(
    sourceIssueId: string,
    targetIssueId: string,
    relationshipType: string,
    strength: number = 50
  ): Promise<RootCauseRelationship> {
    return this.addRelationship(sourceIssueId, targetIssueId, relationshipType, strength);
  }
  
  /**
   * Find similar analyses based on patterns
   */
  public async findSimilarAnalyses(
    patterns: string[],
    limit: number = 5
  ): Promise<RootCauseAnalysis[]> {
    const analyses = await db
      .select()
      .from(rootCauseAnalyses)
      .orderBy(desc(rootCauseAnalyses.timestamp));
    
    // Simplistic matching for now
    // Eventually this should use better pattern matching or vector similarity
    const scoredAnalyses = analyses.map(analysis => {
      const analysisPatterns = typeof analysis.patterns === 'string'
        ? JSON.parse(analysis.patterns)
        : analysis.patterns || [];
      
      // Count matching patterns
      const matchCount = patterns.filter(p => 
        analysisPatterns.includes(p)
      ).length;
      
      // Calculate similarity score
      const score = matchCount / Math.max(patterns.length, analysisPatterns.length);
      
      return {
        analysis,
        score
      };
    });
    
    // Return top matches
    return scoredAnalyses
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.analysis);
  }

  /**
   * Get an analysis by ID
   */
  public async getAnalysisById(id: string): Promise<RootCauseAnalysis | null> {
    const results = await db
      .select()
      .from(rootCauseAnalyses)
      .where(eq(rootCauseAnalyses.id, id))
      .limit(1);
    
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Get recent analyses
   */
  public async getRecentAnalyses(limit: number = 10): Promise<RootCauseAnalysis[]> {
    return db
      .select()
      .from(rootCauseAnalyses)
      .orderBy(desc(rootCauseAnalyses.timestamp))
      .limit(limit);
  }

  /**
   * Search for analyses by issue content
   */
  public async searchAnalyses(query: string): Promise<RootCauseAnalysis[]> {
    return db
      .select()
      .from(rootCauseAnalyses)
      .where(like(rootCauseAnalyses.issue, `%${query}%`))
      .orderBy(desc(rootCauseAnalyses.timestamp))
      .limit(20);
  }

  /**
   * Update patterns based on a new analysis
   */
  private async updatePatterns(patterns: string[]): Promise<void> {
    for (const pattern of patterns) {
      // Check if pattern already exists
      const existingPatterns = await db
        .select()
        .from(rootCausePatterns)
        .where(eq(rootCausePatterns.pattern, pattern))
        .limit(1);
      
      if (existingPatterns.length > 0) {
        // Update existing pattern
        const existingPattern = existingPatterns[0];
        await db
          .update(rootCausePatterns)
          .set({ 
            occurrences: existingPattern.occurrences + 1,
            lastDetected: new Date()
          })
          .where(eq(rootCausePatterns.id, existingPattern.id));
      } else {
        // Create new pattern
        const newPattern: NewRootCausePattern = {
          id: uuidv4(),
          pattern,
          occurrences: 1,
          firstDetected: new Date(),
          lastDetected: new Date(),
          solutions: '[]'
        };
        
        await db.insert(rootCausePatterns).values(newPattern);
      }
    }
  }

  /**
   * Get all patterns
   */
  public async getPatterns(): Promise<RootCausePattern[]> {
    return db
      .select()
      .from(rootCausePatterns)
      .orderBy(desc(rootCausePatterns.occurrences));
  }
  
  /**
   * Track a pattern match
   */
  public async trackPattern(
    patternId: string,
    patternName: string,
    category: string,
    description: string,
    confidence: number
  ): Promise<void> {
    try {
      // Check if pattern exists
      const existingPatterns = await db
        .select()
        .from(rootCausePatterns)
        .where(eq(rootCausePatterns.id, patternId))
        .limit(1);
      
      if (existingPatterns.length > 0) {
        // Update existing pattern
        await db
          .update(rootCausePatterns)
          .set({
            occurrences: existingPatterns[0].occurrences + 1,
            lastDetected: new Date()
          })
          .where(eq(rootCausePatterns.id, patternId));
      } else {
        // Create new pattern
        await db.insert(rootCausePatterns).values({
          id: patternId,
          pattern: `${category}|${patternName}`.toLowerCase(),
          occurrences: 1,
          firstDetected: new Date(),
          lastDetected: new Date(),
          solutions: description
        });
      }
    } catch (error) {
      console.error('Error tracking pattern:', error);
    }
  }
  
  /**
   * Add a new pattern
   */
  public async addPattern(
    name: string,
    category: string,
    description: string,
    detectionPattern: string,
    confidence: number
  ): Promise<void> {
    const id = `${category.toLowerCase()}-${name.toLowerCase().replace(/\s+/g, '-')}`;
    
    try {
      await db.insert(rootCausePatterns).values({
        id,
        pattern: detectionPattern,
        occurrences: 0,
        firstDetected: new Date(),
        lastDetected: new Date(),
        solutions: description
      });
    } catch (error) {
      console.error('Error adding pattern:', error);
    }
  }

  /**
   * Create a new pattern
   */
  public async createPattern(pattern: NewRootCausePattern): Promise<RootCausePattern | null> {
    try {
      await db.insert(rootCausePatterns).values(pattern);
      
      const insertedPattern = await db
        .select()
        .from(rootCausePatterns)
        .where(eq(rootCausePatterns.id, pattern.id))
        .limit(1);
      
      return insertedPattern.length > 0 ? insertedPattern[0] : null;
    } catch (error) {
      console.error('Error creating pattern:', error);
      return null;
    }
  }
  
  /**
   * Increment pattern occurrence count
   */
  public async incrementPatternOccurrence(patternId: string): Promise<void> {
    try {
      const pattern = await db
        .select()
        .from(rootCausePatterns)
        .where(eq(rootCausePatterns.id, patternId))
        .limit(1);
      
      if (pattern.length > 0) {
        await db
          .update(rootCausePatterns)
          .set({
            occurrences: pattern[0].occurrences + 1,
            lastDetected: new Date()
          })
          .where(eq(rootCausePatterns.id, patternId));
      }
    } catch (error) {
      console.error('Error incrementing pattern occurrence:', error);
    }
  }

  /**
   * Add a relationship between two analyses
   */
  public async addRelationship(
    sourceIssueId: string,
    targetIssueId: string,
    relationshipType: string,
    strength: number = 50
  ): Promise<RootCauseRelationship> {
    const id = uuidv4();
    
    // Create relationship with required strength value, ensuring non-undefined values
    const newRelationship: NewRootCauseRelationship = {
      id,
      sourceIssueId,
      targetIssueId,
      relationshipType,
      strength: strength as number // Force the type as number since we have a default parameter
    };
    
    await db.insert(rootCauseRelationships).values(newRelationship);
    
    // Ensure we return a properly typed object
    const relationshipResult: RootCauseRelationship = {
      id: newRelationship.id,
      sourceIssueId: newRelationship.sourceIssueId,
      targetIssueId: newRelationship.targetIssueId,
      relationshipType: newRelationship.relationshipType,
      strength: newRelationship.strength || 50 // Ensure strength is never undefined
    };
    
    return relationshipResult;
  }

  /**
   * Get relationships for an analysis
   */
  public async getRelationships(analysisId: string): Promise<RootCauseRelationship[]> {
    return db
      .select()
      .from(rootCauseRelationships)
      .where(
        sql`${rootCauseRelationships.sourceIssueId} = ${analysisId} OR ${rootCauseRelationships.targetIssueId} = ${analysisId}`
      );
  }

  /**
   * Track path access during analysis
   */
  public async trackPath(
    path: string, 
    analysisId?: string,
    metadata: Record<string, unknown> = {}
  ): Promise<RootCauseMemoryEntry> {
    try {
      // Check if path already exists
      const existingEntries = await db
        .select()
        .from(rootCauseMemory)
        .where(
          analysisId
            ? and(eq(rootCauseMemory.path, path), eq(rootCauseMemory.analysisId, analysisId))
            : eq(rootCauseMemory.path, path)
        )
        .limit(1);
      
      if (existingEntries.length > 0) {
        // Update existing entry
        const existingEntry = existingEntries[0];
        const updatedEntry = await db
          .update(rootCauseMemory)
          .set({ 
            accessCount: existingEntry.accessCount + 1,
            lastAccessed: new Date(),
            metadata: JSON.stringify({
              ...JSON.parse(existingEntry.metadata || '{}'),
              ...metadata
            })
          })
          .where(eq(rootCauseMemory.id, existingEntry.id))
          .returning();
        
        return updatedEntry[0];
      } else {
        // Create new entry
        const newEntry: NewRootCauseMemoryEntry = {
          analysisId: analysisId,
          path,
          accessCount: 1,
          lastAccessed: new Date(),
          metadata: JSON.stringify(metadata)
        };
        
        const result = await db.insert(rootCauseMemory).values(newEntry).returning();
        return result[0];
      }
    } catch (error) {
      console.log('Using RootCauseDBConnector as fallback for trackPath...');
      try {
        // First check if path exists
        const whereCondition = analysisId 
          ? `path = $1 AND analysis_id = $2` 
          : `path = $1`;
        const params = analysisId ? [path, analysisId] : [path];
        
        const checkQuery = `
          SELECT * FROM root_cause_memory WHERE ${whereCondition} LIMIT 1
        `;
        const existingResult = await RootCauseDBConnector.query(checkQuery, params);
        const existingEntries = existingResult.rows || [];
        
        if (existingEntries.length > 0) {
          // Update existing entry
          const existing = existingEntries[0];
          const existingMetadata = JSON.parse(existing.metadata || '{}');
          const newMetadata = JSON.stringify({
            ...existingMetadata,
            ...metadata
          });
          
          const updateQuery = `
            UPDATE root_cause_memory
            SET access_count = $1, last_accessed = $2, metadata = $3
            WHERE id = $4
            RETURNING *
          `;
          const updatedResult = await RootCauseDBConnector.query(updateQuery, [
            existing.access_count + 1,
            new Date(),
            newMetadata,
            existing.id
          ]);
          
          const row = updatedResult.rows[0];
          return {
            id: row.id,
            path: row.path,
            accessCount: row.access_count || 1,
            lastAccessed: row.last_accessed ? new Date(row.last_accessed) : new Date(),
            analysisId: row.analysis_id || null,
            metadata: row.metadata || '{}'
          };
        } else {
          // Create new entry
          const insertQuery = `
            INSERT INTO root_cause_memory (path, access_count, last_accessed, analysis_id, metadata)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
          `;
          const insertResult = await RootCauseDBConnector.query(insertQuery, [
            path,
            1,
            new Date(),
            analysisId,
            JSON.stringify(metadata)
          ]);
          
          const insertedRow = insertResult.rows[0];
          return {
            id: insertedRow.id,
            path: insertedRow.path,
            accessCount: insertedRow.access_count || 1,
            lastAccessed: insertedRow.last_accessed ? new Date(insertedRow.last_accessed) : new Date(),
            analysisId: insertedRow.analysis_id || null,
            metadata: insertedRow.metadata || '{}'
          };
        }
      } catch (fallbackError) {
        console.error('Both database approaches failed for trackPath:', fallbackError);
        // Return a minimal valid object to prevent application failure
        return {
          id: 0,
          path,
          accessCount: 1,
          lastAccessed: new Date(),
          analysisId: analysisId || null,
          metadata: JSON.stringify(metadata)
        };
      }
    }
  }

  /**
   * Get frequently accessed paths
   */
  public async getFrequentPaths(limit: number = 20): Promise<RootCauseMemoryEntry[]> {
    return db
      .select()
      .from(rootCauseMemory)
      .orderBy(desc(rootCauseMemory.accessCount))
      .limit(limit);
  }

  /**
   * Get recently accessed paths
   */
  public async getRecentPaths(limit: number = 20): Promise<RootCauseMemoryEntry[]> {
    return db
      .select()
      .from(rootCauseMemory)
      .orderBy(desc(rootCauseMemory.lastAccessed))
      .limit(limit);
  }

  /**
   * Build a navigation map from the memory table
   */
  public async buildNavigationMap(): Promise<NavigationMap> {
    const paths = await db
      .select()
      .from(rootCauseMemory)
      .orderBy(desc(rootCauseMemory.accessCount));
    
    const navigationMap: NavigationMap = {};
    
    for (const path of paths) {
      const pathKey = path.path;
      
      if (!navigationMap[pathKey]) {
        navigationMap[pathKey] = {
          path: pathKey,
          accessCount: path.accessCount,
          lastAccessed: path.lastAccessed,
          relatedPaths: []
        };
      }
      
      // Find related paths (parent, child, sibling relationships)
      this.findRelatedPaths(pathKey, paths, navigationMap);
    }
    
    return navigationMap;
  }
  
  /**
   * Find related paths for a given path
   */
  private findRelatedPaths(
    pathKey: string, 
    allPaths: RootCauseMemoryEntry[], 
    navigationMap: NavigationMap
  ): void {
    const parts = pathKey.split('/');
    
    // Skip if this is the root
    if (parts.length <= 1) return;
    
    // Find parent path
    const parentPath = parts.slice(0, -1).join('/');
    if (parentPath) {
      const parentStrength = this.calculatePathRelationshipStrength(
        pathKey, 
        parentPath, 
        allPaths, 
        'parent'
      );
      
      navigationMap[pathKey].relatedPaths.push({
        path: parentPath,
        relationship: 'parent',
        strength: parentStrength
      });
    }
    
    // Find child paths
    const potentialChildren = allPaths.filter(p => 
      p.path.startsWith(pathKey + '/') && 
      p.path.split('/').length === parts.length + 1
    );
    
    for (const child of potentialChildren) {
      const childStrength = this.calculatePathRelationshipStrength(
        pathKey,
        child.path,
        allPaths,
        'child'
      );
      
      navigationMap[pathKey].relatedPaths.push({
        path: child.path,
        relationship: 'child',
        strength: childStrength
      });
    }
    
    // Find sibling paths
    if (parentPath) {
      const potentialSiblings = allPaths.filter(p => 
        p.path.startsWith(parentPath + '/') && 
        p.path.split('/').length === parts.length &&
        p.path !== pathKey
      );
      
      for (const sibling of potentialSiblings) {
        const siblingStrength = this.calculatePathRelationshipStrength(
          pathKey,
          sibling.path,
          allPaths,
          'sibling'
        );
        
        navigationMap[pathKey].relatedPaths.push({
          path: sibling.path,
          relationship: 'sibling',
          strength: siblingStrength
        });
      }
    }
  }
  
  /**
   * Calculate the strength of a relationship between two paths
   */
  private calculatePathRelationshipStrength(
    path1: string,
    path2: string,
    allPaths: RootCauseMemoryEntry[],
    relationshipType: 'parent' | 'child' | 'sibling'
  ): number {
    // Simple algorithm for now:
    // - Parent relationship: 70 base value
    // - Child relationship: 60 base value
    // - Sibling relationship: 50 base value
    // - Boost by 1 for each time they appear in the same analysis
    
    let baseStrength = 50;
    if (relationshipType === 'parent') baseStrength = 70;
    if (relationshipType === 'child') baseStrength = 60;
    
    // Count how many times these paths appear in the same analysis
    let sameAnalysisCount = 0;
    
    const path1Entries = allPaths.filter(p => p.path === path1 && p.analysisId);
    const path2Entries = allPaths.filter(p => p.path === path2 && p.analysisId);
    
    for (const p1 of path1Entries) {
      for (const p2 of path2Entries) {
        if (p1.analysisId && p2.analysisId && p1.analysisId === p2.analysisId) {
          sameAnalysisCount++;
        }
      }
    }
    
    return Math.min(99, baseStrength + sameAnalysisCount);
  }
  
  /**
   * Helper method to map database row (snake_case) to entity properties (camelCase)
   * Not used directly due to LSP visibility issue, but kept for reference
   */
  private _mapRowToEntity(row: any): any {
    // This is just for documentation purposes
    return null;
  }
}

// Export a singleton instance
export default RootCauseDBService.getInstance();
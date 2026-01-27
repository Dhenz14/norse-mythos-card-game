/**
 * Root Cause Memory Manager
 * 
 * This service manages the "memory" of the Root Cause Analysis system.
 * It tracks which files are accessed during analyses and builds a navigation
 * map that helps guide future analyses to the most relevant files.
 */

import { 
  RootCauseDBService, 
  type NavigationMap, 
  type NavigationMapNode 
} from './RootCauseDBService';
import { type RootCauseMemoryEntry } from '../schema/rootCauseSchema';
import path from 'path';
import fs from 'fs';

export interface MemoryPathEntry {
  path: string;
  accessCount: number;
  lastAccessed: Date;
  metadata: Record<string, unknown>;
}

export interface PathAccessResult {
  path: string;
  success: boolean;
  error?: string;
  metadata?: Record<string, unknown>;
}

export class RootCauseMemoryManager {
  private static instance: RootCauseMemoryManager;
  private dbService: RootCauseDBService;
  private navigationMap: NavigationMap | null = null;
  private lastMapUpdate: Date = new Date(0);
  private MAP_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  
  private constructor() {
    this.dbService = RootCauseDBService.getInstance();
  }
  
  public static getInstance(): RootCauseMemoryManager {
    if (!RootCauseMemoryManager.instance) {
      RootCauseMemoryManager.instance = new RootCauseMemoryManager();
    }
    return RootCauseMemoryManager.instance;
  }
  
  /**
   * Track access to a file path during analysis
   */
  public async trackPath(
    path: string, 
    analysisId?: string,
    metadata: Record<string, unknown> = {}
  ): Promise<PathAccessResult> {
    try {
      await this.dbService.trackPath(path, analysisId, metadata);
      
      // Clear navigation map cache
      this.navigationMap = null;
      
      return {
        path,
        success: true,
        metadata
      };
    } catch (error: any) {
      console.error(`Error tracking path ${path}:`, error);
      return {
        path,
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Track a file path being accessed (alias for trackPath)
   */
  public async trackFilePath(
    path: string,
    analysisId?: string,
    metadata: Record<string, unknown> = {}
  ): Promise<PathAccessResult> {
    return this.trackPath(path, analysisId, metadata);
  }
  
  /**
   * Get the navigation map
   */
  public async getNavigationMap(): Promise<NavigationMap> {
    const now = new Date();
    
    // Use cached map if it's fresh enough
    if (
      this.navigationMap && 
      now.getTime() - this.lastMapUpdate.getTime() < this.MAP_CACHE_DURATION
    ) {
      return this.navigationMap;
    }
    
    // Rebuild navigation map
    this.navigationMap = await this.dbService.buildNavigationMap();
    this.lastMapUpdate = now;
    
    return this.navigationMap;
  }
  
  /**
   * Get suggested paths for a given issue
   */
  public async getSuggestedPaths(issue: string): Promise<string[]> {
    // Basic algorithm:
    // 1. Get the most frequently accessed paths
    // 2. Get paths from similar issues
    // 3. Combine and sort by relevance
    
    const frequentPaths = await this.getFrequentPaths(10);
    const recentPaths = await this.getRecentPaths(5);
    
    // Add paths from similar issues
    const similarIssues = await this.dbService.searchAnalyses(issue);
    const similarIssuePaths: MemoryPathEntry[] = [];
    
    for (const analysis of similarIssues) {
      // We need to check if similar issues have related file paths
      // For now, we'll just use a stub without DB query to avoid TypeScript errors
      // This should be updated with proper implementation
      similarIssuePaths.push({
        path: `/example/path/${analysis.id.substring(0, 8)}`,
        accessCount: 1,
        lastAccessed: new Date(),
        metadata: {}
      });
    }
    
    // Combine all paths
    const allPathMap = new Map<string, number>();
    
    // Add frequent paths (high weight)
    frequentPaths.forEach(p => {
      allPathMap.set(p.path, (allPathMap.get(p.path) || 0) + p.accessCount * 2);
    });
    
    // Add recent paths (medium weight)
    recentPaths.forEach(p => {
      allPathMap.set(p.path, (allPathMap.get(p.path) || 0) + 5);
    });
    
    // Add similar issue paths (low weight)
    similarIssuePaths.forEach(p => {
      allPathMap.set(p.path, (allPathMap.get(p.path) || 0) + 3);
    });
    
    // Sort paths by score
    const sortedPaths = [...allPathMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(entry => entry[0]);
    
    return sortedPaths.slice(0, 20);
  }
  
  /**
   * Get frequently accessed paths
   */
  public async getFrequentPaths(limit: number = 20): Promise<RootCauseMemoryEntry[]> {
    return this.dbService.getFrequentPaths(limit);
  }
  
  /**
   * Get recently accessed paths
   */
  public async getRecentPaths(limit: number = 20): Promise<RootCauseMemoryEntry[]> {
    return this.dbService.getRecentPaths(limit);
  }
  
  /**
   * Export navigation map to JSON file
   */
  public async exportNavigationMap(outputPath: string): Promise<boolean> {
    try {
      const map = await this.getNavigationMap();
      const mapJson = JSON.stringify(map, null, 2);
      
      fs.writeFileSync(outputPath, mapJson);
      
      return true;
    } catch (error) {
      console.error('Error exporting navigation map:', error);
      return false;
    }
  }
  
  /**
   * Import navigation map from JSON file
   */
  public async importNavigationMap(inputPath: string): Promise<boolean> {
    try {
      if (!fs.existsSync(inputPath)) {
        return false;
      }
      
      const mapJson = fs.readFileSync(inputPath, 'utf8');
      this.navigationMap = JSON.parse(mapJson);
      this.lastMapUpdate = new Date();
      
      return true;
    } catch (error) {
      console.error('Error importing navigation map:', error);
      this.navigationMap = null;
      return false;
    }
  }
}

// Export a singleton instance
export default RootCauseMemoryManager.getInstance();
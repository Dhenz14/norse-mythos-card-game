/**
 * File Search Cache
 * 
 * This service caches file search results to avoid redundant glob operations
 * and filesystem traversal. This significantly improves performance for
 * repeated searches with similar keywords or patterns.
 */

import { glob } from 'glob';

interface SearchCacheEntry {
  pattern: string;
  ignorePattern: string;
  results: string[];
  timestamp: Date;
}

export interface SearchCacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  cacheSize: number;
  oldestEntry: Date | null;
  newestEntry: Date | null;
}

export class FileSearchCache {
  private static instance: FileSearchCache;
  private cache: Map<string, SearchCacheEntry> = new Map();
  private readonly MAX_CACHE_SIZE = 20; // Maximum number of patterns to cache
  private readonly MAX_CACHE_AGE = 10 * 60 * 1000; // 10 minutes
  private stats = {
    hits: 0,
    misses: 0
  };
  
  private constructor() {}
  
  public static getInstance(): FileSearchCache {
    if (!FileSearchCache.instance) {
      FileSearchCache.instance = new FileSearchCache();
    }
    return FileSearchCache.instance;
  }
  
  /**
   * Search for files matching a glob pattern
   */
  public async searchFiles(
    pattern: string,
    ignorePattern: string,
    options: Record<string, any> = {}
  ): Promise<string[]> {
    // Create cache key from pattern and options
    const cacheKey = this.createCacheKey(pattern, ignorePattern, options);
    
    // Check if we have a cached result
    const cached = this.cache.get(cacheKey);
    const now = new Date();
    
    if (cached && (now.getTime() - cached.timestamp.getTime()) < this.MAX_CACHE_AGE) {
      // Cache hit
      this.stats.hits++;
      return cached.results;
    }
    
    // Cache miss, perform the search
    this.stats.misses++;
    
    try {
      const searchOptions = {
        ...options,
        ignore: ignorePattern
      };
      
      const results = await glob(pattern, searchOptions);
      
      // Cache the results
      this.cache.set(cacheKey, {
        pattern,
        ignorePattern,
        results,
        timestamp: now
      });
      
      // Check if we need to prune the cache
      if (this.cache.size > this.MAX_CACHE_SIZE) {
        this.pruneCache();
      }
      
      return results;
    } catch (error) {
      console.error(`Error searching files with pattern ${pattern}:`, error);
      return [];
    }
  }
  
  /**
   * Create a cache key from search parameters
   */
  private createCacheKey(
    pattern: string, 
    ignorePattern: string, 
    options: Record<string, any>
  ): string {
    return `${pattern}|${ignorePattern}|${JSON.stringify(options)}`;
  }
  
  /**
   * Remove oldest entries from the cache
   */
  private pruneCache(): void {
    // Convert cache to array and sort by timestamp
    const entries = Array.from(this.cache.entries())
      .sort((a, b) => a[1].timestamp.getTime() - b[1].timestamp.getTime());
    
    // Remove the oldest 25% of entries
    const removeCount = Math.max(1, Math.floor(this.cache.size * 0.25));
    for (let i = 0; i < removeCount; i++) {
      if (entries[i]) {
        this.cache.delete(entries[i][0]);
      }
    }
  }
  
  /**
   * Clear the cache
   */
  public clearCache(): void {
    this.cache.clear();
    console.log('File search cache cleared');
  }
  
  /**
   * Get cache statistics
   */
  public getStats(): SearchCacheStats {
    // Find oldest and newest entries
    let oldestTimestamp: Date | null = null;
    let newestTimestamp: Date | null = null;
    
    for (const entry of this.cache.values()) {
      if (!oldestTimestamp || entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
      }
      if (!newestTimestamp || entry.timestamp > newestTimestamp) {
        newestTimestamp = entry.timestamp;
      }
    }
    
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: this.stats.hits / (this.stats.hits + this.stats.misses || 1),
      cacheSize: this.cache.size,
      oldestEntry: oldestTimestamp,
      newestEntry: newestTimestamp
    };
  }
}

// Export singleton instance
export default FileSearchCache.getInstance();
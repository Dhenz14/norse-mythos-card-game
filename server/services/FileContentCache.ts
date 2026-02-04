/**
 * File Content Cache
 * 
 * This service provides a caching layer for file contents to reduce disk I/O
 * operations during root cause analysis. It significantly improves performance
 * when the same files are accessed multiple times.
 */

import fs from 'fs';
import path from 'path';

interface CacheEntry {
  content: string;
  size: number;
  lastModified: Date;
  extension: string;
  lastAccessed: Date;
  accessCount: number;
}

export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  size: number;
  oldestEntry: Date | null;
  newestEntry: Date | null;
}

export class FileContentCache {
  private static instance: FileContentCache;
  private cache: Map<string, CacheEntry> = new Map();
  private maxSize: number = 100; // Maximum number of files to cache
  private stats = {
    hits: 0,
    misses: 0
  };

  // Cache policy parameters
  private readonly MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB max file size to cache
  private readonly MAX_CACHE_AGE = 10 * 60 * 1000; // 10 minutes max cache age
  
  private constructor() {}
  
  public static getInstance(): FileContentCache {
    if (!FileContentCache.instance) {
      FileContentCache.instance = new FileContentCache();
    }
    return FileContentCache.instance;
  }
  
  /**
   * Get file content from cache or read from disk
   */
  public getFileContent(filePath: string): {
    content: string;
    size: number;
    lastModified: Date;
    extension: string;
    fromCache: boolean;
  } | null {
    try {
      // Check if file exists and is accessible
      if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
        return null;
      }
      
      // Get file stats
      const stat = fs.statSync(filePath);
      const fileSize = stat.size;
      const lastModified = stat.mtime;
      const extension = path.extname(filePath).slice(1);
      
      // Skip files that are too large
      if (fileSize > this.MAX_FILE_SIZE) {
        return {
          content: '[File too large for cache]',
          size: fileSize,
          lastModified,
          extension,
          fromCache: false
        };
      }
      
      // Check cache
      const cacheEntry = this.cache.get(filePath);
      
      // If file is in cache and hasn't been modified since
      if (
        cacheEntry && 
        cacheEntry.lastModified.getTime() === lastModified.getTime() &&
        Date.now() - cacheEntry.lastAccessed.getTime() < this.MAX_CACHE_AGE
      ) {
        // Update cache stats and entry
        this.stats.hits++;
        cacheEntry.lastAccessed = new Date();
        cacheEntry.accessCount++;
        
        return {
          content: cacheEntry.content,
          size: cacheEntry.size,
          lastModified: cacheEntry.lastModified,
          extension: cacheEntry.extension,
          fromCache: true
        };
      }
      
      // File not in cache or needs refresh - read from disk
      this.stats.misses++;
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Add to cache
      this.cache.set(filePath, {
        content,
        size: fileSize,
        lastModified,
        extension,
        lastAccessed: new Date(),
        accessCount: 1
      });
      
      // Check if we need to prune the cache
      if (this.cache.size > this.maxSize) {
        this.pruneCache();
      }
      
      return {
        content,
        size: fileSize,
        lastModified,
        extension,
        fromCache: false
      };
    } catch (error) {
      console.error(`Error reading file ${filePath}:`, error);
      return null;
    }
  }
  
  /**
   * Remove the least recently accessed items from the cache
   */
  private pruneCache(): void {
    // Convert cache to array and sort by access time and count
    const entries = Array.from(this.cache.entries())
      .map(([key, value]) => ({
        key,
        value,
        score: value.accessCount * 0.3 + value.lastAccessed.getTime() * 0.7
      }))
      .sort((a, b) => a.score - b.score);
    
    // Remove the oldest 20% of entries
    const removeCount = Math.max(1, Math.floor(this.cache.size * 0.2));
    for (let i = 0; i < removeCount; i++) {
      if (entries[i]) {
        this.cache.delete(entries[i].key);
      }
    }
  }
  
  /**
   * Force refreshing a file in cache
   */
  public forceRefresh(filePath: string): boolean {
    try {
      // Remove from cache
      this.cache.delete(filePath);
      
      // Try to read and cache again
      return this.getFileContent(filePath) !== null;
    } catch (error) {
      console.error(`Error refreshing file ${filePath}:`, error);
      return false;
    }
  }
  
  /**
   * Clear the entire cache
   */
  public clearCache(): void {
    this.cache.clear();
    console.log('File content cache cleared');
  }
  
  /**
   * Get cache statistics
   */
  public getStats(): CacheStats {
    // Find oldest and newest entries
    let oldestAccess: Date | null = null;
    let newestAccess: Date | null = null;
    
    for (const entry of this.cache.values()) {
      if (!oldestAccess || entry.lastAccessed < oldestAccess) {
        oldestAccess = entry.lastAccessed;
      }
      if (!newestAccess || entry.lastAccessed > newestAccess) {
        newestAccess = entry.lastAccessed;
      }
    }
    
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: this.stats.hits / (this.stats.hits + this.stats.misses || 1),
      size: this.cache.size,
      oldestEntry: oldestAccess,
      newestEntry: newestAccess
    };
  }
  
  /**
   * Set the maximum cache size
   */
  public setMaxSize(size: number): void {
    this.maxSize = size;
    
    // Prune if needed
    if (this.cache.size > this.maxSize) {
      this.pruneCache();
    }
  }
}

// Export singleton instance
export default FileContentCache.getInstance();
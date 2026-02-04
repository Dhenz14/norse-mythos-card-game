/**
 * Root Cause Analysis Performance Monitor
 * 
 * This utility provides performance monitoring for the root cause analysis system,
 * tracking execution times and resource usage to identify bottlenecks.
 */

import FileContentCache from '../services/FileContentCache';
import FileSearchCache from '../services/FileSearchCache';

export interface PerformanceMetrics {
  analysisId: string;
  operation: string;
  startTime: number;
  endTime: number;
  duration: number;
  fileCount?: number;
  patternCount?: number;
  cacheHitRate?: number;
  searchCacheHitRate?: number;
  error?: boolean;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private operations: Map<string, number> = new Map();
  private readonly MAX_METRICS = 100;
  
  /**
   * Start timing an operation
   */
  public startOperation(analysisId: string, operation: string): string {
    const operationId = `${analysisId}:${operation}:${Date.now()}`;
    this.operations.set(operationId, Date.now());
    return operationId;
  }
  
  /**
   * End timing an operation and record metrics
   */
  public endOperation(
    operationId: string, 
    additionalData: {
      fileCount?: number;
      patternCount?: number;
      error?: boolean;
    } = {}
  ): PerformanceMetrics | null {
    const startTime = this.operations.get(operationId);
    if (!startTime) {
      console.warn(`Operation ${operationId} not found. Cannot end timing.`);
      return null;
    }
    
    // Remove from active operations
    this.operations.delete(operationId);
    
    // Parse operation ID
    const [analysisId, operation] = operationId.split(':');
    
    // Get cache stats
    const contentCacheStats = FileContentCache.getStats();
    const searchCacheStats = FileSearchCache.getStats();
    
    // Record metrics
    const endTime = Date.now();
    const metric: PerformanceMetrics = {
      analysisId,
      operation,
      startTime,
      endTime,
      duration: endTime - startTime,
      ...additionalData,
      cacheHitRate: contentCacheStats.hitRate,
      searchCacheHitRate: searchCacheStats.hitRate
    };
    
    this.metrics.push(metric);
    
    // Prune metrics if needed
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS);
    }
    
    return metric;
  }
  
  /**
   * Get metrics for a specific analysis
   */
  public getMetricsForAnalysis(analysisId: string): PerformanceMetrics[] {
    return this.metrics.filter(m => m.analysisId === analysisId);
  }
  
  /**
   * Get average operation times
   */
  public getAverageOperationTimes(): Record<string, number> {
    const operationTimes: Record<string, number[]> = {};
    
    for (const metric of this.metrics) {
      if (!operationTimes[metric.operation]) {
        operationTimes[metric.operation] = [];
      }
      operationTimes[metric.operation].push(metric.duration);
    }
    
    const averages: Record<string, number> = {};
    for (const [operation, times] of Object.entries(operationTimes)) {
      averages[operation] = times.reduce((sum, time) => sum + time, 0) / times.length;
    }
    
    return averages;
  }
  
  /**
   * Get total execution time for an analysis
   */
  public getTotalExecutionTime(analysisId: string): number {
    const metrics = this.getMetricsForAnalysis(analysisId);
    return metrics.reduce((total, metric) => total + metric.duration, 0);
  }
  
  /**
   * Get cache hit rates over time
   */
  public getCacheHitRates(): {
    contentCache: number;
    searchCache: number;
  } {
    const contentCacheRates = this.metrics
      .filter(m => m.cacheHitRate !== undefined)
      .map(m => m.cacheHitRate as number);
    
    const searchCacheRates = this.metrics
      .filter(m => m.searchCacheHitRate !== undefined)
      .map(m => m.searchCacheHitRate as number);
    
    // Calculate averages
    const contentCacheAvg = contentCacheRates.length > 0
      ? contentCacheRates.reduce((sum, rate) => sum + rate, 0) / contentCacheRates.length
      : 0;
    
    const searchCacheAvg = searchCacheRates.length > 0
      ? searchCacheRates.reduce((sum, rate) => sum + rate, 0) / searchCacheRates.length
      : 0;
    
    return {
      contentCache: contentCacheAvg,
      searchCache: searchCacheAvg
    };
  }
  
  /**
   * Get performance summary
   */
  public getPerformanceSummary(): {
    averageOperationTimes: Record<string, number>;
    cacheHitRates: {
      contentCache: number;
      searchCache: number;
    };
    totalMetricsCount: number;
  } {
    return {
      averageOperationTimes: this.getAverageOperationTimes(),
      cacheHitRates: this.getCacheHitRates(),
      totalMetricsCount: this.metrics.length
    };
  }
  
  /**
   * Clear all metrics
   */
  public clearMetrics(): void {
    this.metrics = [];
    this.operations.clear();
  }
}

// Export singleton instance
const performanceMonitor = new PerformanceMonitor();
export default performanceMonitor;
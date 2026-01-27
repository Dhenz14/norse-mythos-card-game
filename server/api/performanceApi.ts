/**
 * Root Cause Analysis Performance API
 * 
 * This API provides endpoints to access performance metrics and cache statistics
 * for the root cause analysis system.
 */

import express from 'express';
import PerformanceMonitor from '../utils/PerformanceMonitor';
import FileContentCache from '../services/FileContentCache';
import FileSearchCache from '../services/FileSearchCache';

const router = express.Router();

// GET performance summary
router.get('/summary', (req, res) => {
  try {
    const summary = PerformanceMonitor.getPerformanceSummary();
    
    // Add cache statistics
    const contentCacheStats = FileContentCache.getStats();
    const searchCacheStats = FileSearchCache.getStats();
    
    res.json({
      ...summary,
      cacheStats: {
        contentCache: contentCacheStats,
        searchCache: searchCacheStats
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error retrieving performance summary:', error);
    res.status(500).json({ error: 'Error retrieving performance metrics' });
  }
});

// GET detailed metrics for a specific analysis
router.get('/analysis/:id', (req, res) => {
  try {
    const analysisId = req.params.id;
    const metrics = PerformanceMonitor.getMetricsForAnalysis(analysisId);
    
    if (metrics.length === 0) {
      return res.status(404).json({ error: 'No metrics found for this analysis ID' });
    }
    
    // Calculate totals
    const totalDuration = metrics.reduce((sum, m) => sum + m.duration, 0);
    const operations = Array.from(
      new Set(metrics.map(m => m.operation))
    ).map(operation => {
      const operationMetrics = metrics.filter(m => m.operation === operation);
      const totalTime = operationMetrics.reduce((sum, m) => sum + m.duration, 0);
      const percentage = (totalTime / totalDuration) * 100;
      
      return {
        operation,
        totalTime,
        percentage: percentage.toFixed(1) + '%',
        count: operationMetrics.length,
        averageTime: totalTime / operationMetrics.length
      };
    }).sort((a, b) => b.totalTime - a.totalTime);
    
    res.json({
      analysisId,
      totalDuration,
      operationBreakdown: operations,
      detailedMetrics: metrics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(`Error retrieving performance metrics for analysis ${req.params.id}:`, error);
    res.status(500).json({ error: 'Error retrieving performance metrics' });
  }
});

// GET cache statistics
router.get('/cache-stats', (req, res) => {
  try {
    const contentCacheStats = FileContentCache.getStats();
    const searchCacheStats = FileSearchCache.getStats();
    
    res.json({
      contentCache: contentCacheStats,
      searchCache: searchCacheStats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error retrieving cache statistics:', error);
    res.status(500).json({ error: 'Error retrieving cache statistics' });
  }
});

// POST clear performance metrics
router.post('/clear', (req, res) => {
  try {
    PerformanceMonitor.clearMetrics();
    res.json({ success: true, message: 'Performance metrics cleared' });
  } catch (error) {
    console.error('Error clearing performance metrics:', error);
    res.status(500).json({ error: 'Error clearing performance metrics' });
  }
});

// POST clear file caches
router.post('/clear-caches', (req, res) => {
  try {
    FileContentCache.clearCache();
    FileSearchCache.clearCache();
    res.json({ 
      success: true, 
      message: 'File caches cleared',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error clearing file caches:', error);
    res.status(500).json({ error: 'Error clearing file caches' });
  }
});

export default router;
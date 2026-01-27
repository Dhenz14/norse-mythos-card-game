import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { routes } from '../lib/routes';

interface ContentCacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  size: number;
  oldestEntry: string | null;
  newestEntry: string | null;
}

interface SearchCacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  cacheSize: number;
  oldestEntry: string | null;
  newestEntry: string | null;
}

interface PerformanceData {
  averageOperationTimes: Record<string, number>;
  cacheHitRates: {
    contentCache: number;
    searchCache: number;
  };
  totalMetricsCount: number;
  cacheStats: {
    contentCache: ContentCacheStats;
    searchCache: SearchCacheStats;
  };
  timestamp: string;
}

const PerformanceDashboard: React.FC = () => {
  const [data, setData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/performance/summary');
      setData(response.data);
      setError(null);
    } catch (err) {
      setError('Error fetching performance data');
      console.error('Error fetching performance data:', err);
    } finally {
      setLoading(false);
    }
  };

  const clearCaches = async () => {
    try {
      await axios.post('/api/performance/clear-caches');
      await fetchData();
    } catch (err) {
      setError('Error clearing caches');
      console.error('Error clearing caches:', err);
    }
  };

  const clearMetrics = async () => {
    try {
      await axios.post('/api/performance/clear');
      await fetchData();
    } catch (err) {
      setError('Error clearing metrics');
      console.error('Error clearing metrics:', err);
    }
  };

  useEffect(() => {
    fetchData();

    // Set up auto-refresh if enabled
    let interval: number | null = null;
    if (autoRefresh) {
      interval = window.setInterval(fetchData, 5000); // Refresh every 5 seconds
    }

    return () => {
      if (interval !== null) {
        clearInterval(interval);
      }
    };
  }, [autoRefresh]);

  // Format time in milliseconds to be more readable
  const formatTime = (ms: number): string => {
    if (ms < 1000) {
      return `${ms.toFixed(1)}ms`;
    }
    return `${(ms / 1000).toFixed(2)}s`;
  };

  // Format percentage for more readable display
  const formatPercentage = (value: number): string => {
    return `${(value * 100).toFixed(1)}%`;
  };

  return (
    <div className="bg-gray-900 text-white min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Root Cause Analysis Performance Dashboard</h1>
            <Link to={routes.rootCauseAnalyzer} className="text-blue-400 hover:text-blue-300 transition-colors mt-2 inline-block">
              ← Back to Root Cause Analyzer
            </Link>
          </div>
          <div className="flex space-x-4">
            <button
              onClick={fetchData}
              className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 transition"
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
            <button
              onClick={clearCaches}
              className="px-4 py-2 bg-yellow-600 rounded hover:bg-yellow-700 transition"
            >
              Clear Caches
            </button>
            <button
              onClick={clearMetrics}
              className="px-4 py-2 bg-red-600 rounded hover:bg-red-700 transition"
            >
              Clear Metrics
            </button>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="autoRefresh"
                checked={autoRefresh}
                onChange={() => setAutoRefresh(!autoRefresh)}
                className="mr-2"
              />
              <label htmlFor="autoRefresh">Auto-refresh</label>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-800 text-white p-4 rounded mb-6">
            {error}
          </div>
        )}

        {loading && !data ? (
          <div className="text-center py-10">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-4"></div>
            <p>Loading performance data...</p>
          </div>
        ) : data ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Cache Stats Card */}
            <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
              <h2 className="text-2xl font-bold mb-4">Cache Performance</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Content Cache</h3>
                  <div className="space-y-2">
                    <p>Hit Rate: <span className="text-green-400">{formatPercentage(data.cacheStats.contentCache.hitRate)}</span></p>
                    <p>Hits: {data.cacheStats.contentCache.hits}</p>
                    <p>Misses: {data.cacheStats.contentCache.misses}</p>
                    <p>Size: {data.cacheStats.contentCache.size} items</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Search Cache</h3>
                  <div className="space-y-2">
                    <p>Hit Rate: <span className="text-green-400">{formatPercentage(data.cacheStats.searchCache.hitRate)}</span></p>
                    <p>Hits: {data.cacheStats.searchCache.hits}</p>
                    <p>Misses: {data.cacheStats.searchCache.misses}</p>
                    <p>Size: {data.cacheStats.searchCache.cacheSize} items</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Operation Times Card */}
            <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
              <h2 className="text-2xl font-bold mb-4">Operation Times</h2>
              <div className="space-y-2">
                {Object.entries(data.averageOperationTimes).map(([operation, time]) => (
                  <div key={operation} className="flex justify-between items-center">
                    <span className="font-mono">{operation}:</span>
                    <span className="font-mono">{formatTime(time)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-700">
                <p>Total Metrics Collected: {data.totalMetricsCount}</p>
                <p className="text-xs text-gray-500 mt-2">Last updated: {new Date(data.timestamp).toLocaleString()}</p>
              </div>
            </div>

            {/* Performance Visualization */}
            <div className="bg-gray-800 rounded-lg p-6 shadow-lg col-span-1 md:col-span-2">
              <h2 className="text-2xl font-bold mb-4">Cache Hit Rates</h2>
              <div className="h-24 flex items-end space-x-8">
                <div className="flex flex-col items-center">
                  <div 
                    className="w-24 bg-blue-500 rounded-t"
                    style={{ height: `${data.cacheHitRates.contentCache * 100}%` }}
                  ></div>
                  <p className="mt-2">Content Cache</p>
                  <p className="text-blue-400">{formatPercentage(data.cacheHitRates.contentCache)}</p>
                </div>
                <div className="flex flex-col items-center">
                  <div 
                    className="w-24 bg-green-500 rounded-t"
                    style={{ height: `${data.cacheHitRates.searchCache * 100}%` }}
                  ></div>
                  <p className="mt-2">Search Cache</p>
                  <p className="text-green-400">{formatPercentage(data.cacheHitRates.searchCache)}</p>
                </div>
              </div>
              
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-2">Performance Analysis</h3>
                <p>
                  The caching system is showing 
                  {data.cacheHitRates.contentCache > 0.7 ? ' excellent' : 
                   data.cacheHitRates.contentCache > 0.4 ? ' good' : ' developing'} content cache performance and
                  {data.cacheHitRates.searchCache > 0.7 ? ' excellent' : 
                   data.cacheHitRates.searchCache > 0.4 ? ' good' : ' developing'} search cache performance.
                </p>
                <p className="mt-2">
                  {data.totalMetricsCount < 10 ? 
                    'More analysis operations are needed to gather comprehensive performance data.' :
                    `Based on ${data.totalMetricsCount} operations, the system is showing ${
                      (data.cacheHitRates.contentCache + data.cacheHitRates.searchCache) / 2 > 0.6 ? 
                      'significant' : 'some'
                    } performance improvements from caching.`
                  }
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
            <p>No performance data available. Run some analyses to generate metrics.</p>
          </div>
        )}
      </div>
      
      <footer className="mt-8 py-4 border-t border-gray-800 text-center text-gray-400 text-sm">
        <div>
          Root Cause Analysis Performance Monitoring System
        </div>
        <div className="text-xs mt-1">
          Powered by FileContentCache and FileSearchCache
        </div>
      </footer>
    </div>
  );
};

export default PerformanceDashboard;
/**
 * ThinkToolsResponseLogger.ts
 * 
 * This module logs information about Think Tools template compliance
 * and tracks usage statistics for analysis and improvement.
 */

// Log levels for different types of information
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  SUCCESS = 'success'
}

// Structure for Think Tools response metrics
export interface ThinkToolsResponseMetrics {
  timestamp: string;
  responseId: string;
  isCompliant: boolean;
  missingComponents: string[];
  requiredCorrection: boolean;
  responseLength: number;
  structuralComponents: {
    hasThinkToolsHeader: boolean;
    hasSequentialThinking: boolean;
    hasThinkTool: boolean;
    hasImplementationStrategy: boolean;
  };
  processingTimeMs: number;
}

/**
 * Central logger for Think Tools template compliance
 */
export default class ThinkToolsResponseLogger {
  private static instance: ThinkToolsResponseLogger;
  private metrics: ThinkToolsResponseMetrics[] = [];
  
  private constructor() {
    console.log('[ThinkToolsResponseLogger] Initialized');
    
    // Setup metrics collection
    setInterval(() => {
      if (this.metrics.length > 100) {
        // Limit array size to avoid memory issues
        this.metrics = this.metrics.slice(-100);
      }
    }, 60000); // Check every minute
  }
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): ThinkToolsResponseLogger {
    if (!ThinkToolsResponseLogger.instance) {
      ThinkToolsResponseLogger.instance = new ThinkToolsResponseLogger();
    }
    return ThinkToolsResponseLogger.instance;
  }
  
  /**
   * Log a message with a specific level
   */
  public log(message: string, level: LogLevel = LogLevel.INFO): void {
    const prefix = '[ThinkToolsLogger]';
    
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(`${prefix} ${message}`);
        break;
      case LogLevel.INFO:
        console.log(`${prefix} ${message}`);
        break;
      case LogLevel.WARNING:
        console.warn(`${prefix} Warning: ${message}`);
        break;
      case LogLevel.ERROR:
        console.error(`${prefix} Error: ${message}`);
        break;
      case LogLevel.SUCCESS:
        console.log(`${prefix} Success: ${message}`);
        break;
    }
  }
  
  /**
   * Record metrics about a Think Tools response
   */
  public recordResponseMetrics(metrics: Partial<ThinkToolsResponseMetrics>): void {
    const defaultMetrics: ThinkToolsResponseMetrics = {
      timestamp: new Date().toISOString(),
      responseId: `think-tools-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      isCompliant: false,
      missingComponents: [],
      requiredCorrection: false,
      responseLength: 0,
      structuralComponents: {
        hasThinkToolsHeader: false,
        hasSequentialThinking: false,
        hasThinkTool: false,
        hasImplementationStrategy: false
      },
      processingTimeMs: 0
    };
    
    const fullMetrics = { ...defaultMetrics, ...metrics };
    this.metrics.push(fullMetrics);
    
    if (fullMetrics.isCompliant) {
      this.log(`Response ${fullMetrics.responseId} is template compliant`, LogLevel.SUCCESS);
    } else {
      this.log(`Response ${fullMetrics.responseId} required template correction: ${fullMetrics.missingComponents.join(', ')}`, LogLevel.WARNING);
    }
  }
  
  /**
   * Analyze the metrics for insights on template compliance
   */
  public getComplianceStats(): any {
    if (this.metrics.length === 0) {
      return {
        totalResponses: 0,
        complianceRate: 0,
        averageCorrectionNeeded: 0,
        mostCommonMissingComponent: 'None'
      };
    }
    
    const totalResponses = this.metrics.length;
    const compliantResponses = this.metrics.filter(m => m.isCompliant).length;
    const complianceRate = compliantResponses / totalResponses;
    
    // Count missing components to find the most common
    const missingComponentCounts: Record<string, number> = {};
    this.metrics.forEach(metric => {
      metric.missingComponents.forEach(component => {
        missingComponentCounts[component] = (missingComponentCounts[component] || 0) + 1;
      });
    });
    
    // Find the most common missing component
    let mostCommonMissingComponent = 'None';
    let highestCount = 0;
    
    Object.entries(missingComponentCounts).forEach(([component, count]) => {
      if (count > highestCount) {
        mostCommonMissingComponent = component;
        highestCount = count;
      }
    });
    
    return {
      totalResponses,
      complianceRate,
      averageCorrectionNeeded: this.metrics.filter(m => m.requiredCorrection).length / totalResponses,
      mostCommonMissingComponent
    };
  }
  
  /**
   * Clear the metrics (useful for testing or resets)
   */
  public clearMetrics(): void {
    this.metrics = [];
    this.log('Metrics cleared', LogLevel.INFO);
  }
}
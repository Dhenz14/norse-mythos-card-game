/**
 * Think Tools Context
 * 
 * This module provides context management for Think Tools operations.
 * It maintains state across multiple operations and provides access
 * to shared resources and configuration.
 */

import { THINK_TOOLS_CONFIG } from './thinkToolsConfig';

/**
 * Interface for Think Tools context
 */
export interface ThinkToolsContext {
  sessionId: string;
  history: ThinkToolsHistoryItem[];
  resources: Record<string, any>;
  metadata: Record<string, any>;
  config: typeof THINK_TOOLS_CONFIG;
}

/**
 * Interface for Think Tools history item
 */
export interface ThinkToolsHistoryItem {
  timestamp: number;
  query: string;
  result: string;
  mode: string;
  success: boolean;
}

/**
 * Class for managing Think Tools context
 */
export class ThinkToolsContextManager {
  private static instance: ThinkToolsContextManager;
  private contexts: Map<string, ThinkToolsContext> = new Map();
  
  /**
   * Private constructor for singleton pattern
   */
  private constructor() {}
  
  /**
   * Get singleton instance
   */
  public static getInstance(): ThinkToolsContextManager {
    if (!ThinkToolsContextManager.instance) {
      ThinkToolsContextManager.instance = new ThinkToolsContextManager();
    }
    
    return ThinkToolsContextManager.instance;
  }
  
  /**
   * Create a new context
   */
  public createContext(sessionId: string): ThinkToolsContext {
    const context: ThinkToolsContext = {
      sessionId,
      history: [],
      resources: {},
      metadata: {},
      config: { ...THINK_TOOLS_CONFIG }
    };
    
    this.contexts.set(sessionId, context);
    return context;
  }
  
  /**
   * Get an existing context or create a new one
   */
  public getContext(sessionId: string): ThinkToolsContext {
    const existingContext = this.contexts.get(sessionId);
    
    if (existingContext) {
      return existingContext;
    }
    
    return this.createContext(sessionId);
  }
  
  /**
   * Update an existing context
   */
  public updateContext(sessionId: string, updates: Partial<ThinkToolsContext>): ThinkToolsContext {
    const context = this.getContext(sessionId);
    
    const updatedContext: ThinkToolsContext = {
      ...context,
      ...updates,
      history: [...context.history, ...(updates.history || [])],
      resources: { ...context.resources, ...(updates.resources || {}) },
      metadata: { ...context.metadata, ...(updates.metadata || {}) }
    };
    
    this.contexts.set(sessionId, updatedContext);
    return updatedContext;
  }
  
  /**
   * Add a history item to a context
   */
  public addHistoryItem(
    sessionId: string,
    item: Omit<ThinkToolsHistoryItem, 'timestamp'>
  ): ThinkToolsContext {
    const context = this.getContext(sessionId);
    
    const historyItem: ThinkToolsHistoryItem = {
      ...item,
      timestamp: Date.now()
    };
    
    return this.updateContext(sessionId, {
      history: [...context.history, historyItem]
    });
  }
  
  /**
   * Get history for a context
   */
  public getHistory(sessionId: string): ThinkToolsHistoryItem[] {
    const context = this.getContext(sessionId);
    return [...context.history];
  }
  
  /**
   * Clear a context
   */
  public clearContext(sessionId: string): void {
    this.contexts.delete(sessionId);
  }
  
  /**
   * Get all context sessions
   */
  public getAllSessions(): string[] {
    return Array.from(this.contexts.keys());
  }
}

/**
 * Get the context manager instance
 */
export function getThinkToolsContextManager(): ThinkToolsContextManager {
  return ThinkToolsContextManager.getInstance();
}

/**
 * Get a context for a session
 */
export function getThinkToolsContext(sessionId: string): ThinkToolsContext {
  return ThinkToolsContextManager.getInstance().getContext(sessionId);
}

/**
 * Create a new Think Tools context
 */
export function createThinkToolsContext(sessionId: string): ThinkToolsContext {
  return ThinkToolsContextManager.getInstance().createContext(sessionId);
}

/**
 * Add a history item to a context
 */
export function addThinkToolsHistoryItem(
  sessionId: string,
  item: Omit<ThinkToolsHistoryItem, 'timestamp'>
): ThinkToolsContext {
  return ThinkToolsContextManager.getInstance().addHistoryItem(sessionId, item);
}

export default {
  getThinkToolsContextManager,
  getThinkToolsContext,
  createThinkToolsContext,
  addThinkToolsHistoryItem
};
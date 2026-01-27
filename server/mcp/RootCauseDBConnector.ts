/**
 * Root Cause DB Connector
 * 
 * This module provides a unified database interface for the Root Cause Analysis feature.
 * It handles connection issues and ensures compatibility between different database access methods.
 */

import compatibleClient from './adapters/DatabaseClientAdapter';

/**
 * Database client that provides query functionality for Root Cause Analysis
 * This handles both direct pg Pool connections and neon connections
 */
class RootCauseDBConnector {
  /**
   * Execute a query using the appropriate database client
   * This method ensures compatibility with both pg Pool and neon connection methods
   */
  async query(text: string, params: any[] = []) {
    try {
      // Use the compatible client adapter which handles both types of connections
      return await compatibleClient.query(text, params);
    } catch (error) {
      console.error('Error executing database query for Root Cause Analysis:', error);
      throw error;
    }
  }
}

// Export a singleton instance
const instance = new RootCauseDBConnector();
export default instance;
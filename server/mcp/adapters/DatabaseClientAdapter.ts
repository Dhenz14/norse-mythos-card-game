/**
 * Database Client Adapter
 * 
 * This adapter provides compatibility between different database client implementations.
 * It specifically handles the "client.query is not a function" error by providing
 * a standardized interface for database queries.
 */

import { directDb } from '../../db';
import { db as neonDb } from '../../database';

/**
 * Create a database client with a compatible query method
 * This function returns an object with a query method that works
 * regardless of which database client implementation is being used
 */
export function createCompatibleClient() {
  // Return an object with a standardized query method
  return {
    query: async (text: string, params: any[] = []) => {
      try {
        // First try the directDb (pg Pool) if available
        if (directDb && typeof directDb.query === 'function') {
          return await directDb.query(text, params);
        }
        
        // If directDb not available or query not a function, try neonDb
        if (neonDb && typeof neonDb.query === 'function') {
          return await neonDb.query(text, params);
        }
        
        // If neither client works, throw an error
        throw new Error('No compatible database client available');
      } catch (error) {
        console.error(`Database query error for query "${text.substring(0, 50)}..."`, error);
        throw error;
      }
    }
  };
}

// Export a pre-created client
export const compatibleClient = createCompatibleClient();

// Default export
export default compatibleClient;
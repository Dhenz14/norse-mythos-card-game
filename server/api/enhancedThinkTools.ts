/**
 * Enhanced Think Tools API
 * 
 * This API provides endpoints for integrating the Think Tools middleware
 * with client-side applications, allowing formatted responses and testing.
 */

import { Request, Response } from 'express';
import { initThinkToolsMiddleware } from '../mcp/initThinkToolsMiddleware';
import { processWithMiddleware } from '../mcp/middlewareHelpers';

// Initialize the middleware
const middleware = initThinkToolsMiddleware();

/**
 * Process a query with the Think Tools middleware
 */
export async function processThinkToolsQuery(req: Request, res: Response) {
  try {
    const { query, skipFormatting = false } = req.body;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid query provided. Expected a string.'
      });
    }
    
    // Start timing the processing
    const startTime = Date.now();
    
    // Process the query with our middleware
    const result = await processWithMiddleware(query, { skipFormatting });
    
    // Calculate processing time
    const processingTime = Date.now() - startTime;
    
    return res.json({
      success: true,
      result,
      metrics: {
        processingTimeMs: processingTime,
        originalLength: query.length,
        resultLength: result.length,
        formattingApplied: !skipFormatting
      }
    });
  } catch (error) {
    console.error('Error processing Think Tools query:', error);
    return res.status(500).json({
      success: false,
      error: 'Error processing query with Think Tools middleware'
    });
  }
}

/**
 * Test the middleware with a sample query
 */
export async function testMiddleware(req: Request, res: Response) {
  try {
    const { query, skipFormatting = false } = req.body;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid query provided. Expected a string.'
      });
    }
    
    // Start timing the processing
    const startTime = Date.now();
    
    // Process the query with our middleware
    const result = await processWithMiddleware(query, { 
      skipFormatting,
      templateEnforcement: true,
      debug: true
    });
    
    // Calculate processing time
    const processingTime = Date.now() - startTime;
    
    return res.json({
      success: true,
      result,
      metrics: {
        processingTimeMs: processingTime,
        originalLength: query.length,
        resultLength: result.length,
        formattingApplied: !skipFormatting
      }
    });
  } catch (error) {
    console.error('Error testing Think Tools middleware:', error);
    return res.status(500).json({
      success: false,
      error: 'Error testing Think Tools middleware'
    });
  }
}

export default {
  processThinkToolsQuery,
  testMiddleware
};
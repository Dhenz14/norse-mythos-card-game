import { Request, Response } from 'express';
import { storage } from '../storage';
import { ReasoningMode } from '../../client/src/replitBridge/reasoningModes';
import { insertSessionSchema, insertResultSchema, insertMetricsSchema } from '../../shared/schema';
import { z } from 'zod';

// Create a new Think Tools session
export const createSession = async (req: Request, res: Response) => {
  try {
    const { userId, title, query } = insertSessionSchema.parse(req.body);
    
    const session = await storage.createThinkToolsSession({
      userId,
      title,
      query
    });
    
    return res.status(201).json(session);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid session data', details: error.errors });
    }
    console.error('Error creating Think Tools session:', error);
    return res.status(500).json({ error: 'Failed to create session' });
  }
};

// Get a specific Think Tools session by ID
export const getSession = async (req: Request, res: Response) => {
  try {
    const sessionId = parseInt(req.params.id);
    if (isNaN(sessionId)) {
      return res.status(400).json({ error: 'Invalid session ID' });
    }
    
    const session = await storage.getThinkToolsSession(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    return res.status(200).json(session);
  } catch (error) {
    console.error('Error retrieving Think Tools session:', error);
    return res.status(500).json({ error: 'Failed to retrieve session' });
  }
};

// Get all sessions for a user
export const getUserSessions = async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    const sessions = await storage.getThinkToolsSessionsByUserId(userId);
    return res.status(200).json(sessions);
  } catch (error) {
    console.error('Error retrieving user Think Tools sessions:', error);
    return res.status(500).json({ error: 'Failed to retrieve user sessions' });
  }
};

// Add a reasoning result to a session
export const addReasoningResult = async (req: Request, res: Response) => {
  try {
    const { sessionId, reasoningMode, content, orderIndex } = insertResultSchema.parse(req.body);
    
    // Verify the session exists
    const session = await storage.getThinkToolsSession(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    const result = await storage.createReasoningResult({
      sessionId,
      reasoningMode,
      content,
      orderIndex
    });
    
    return res.status(201).json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid result data', details: error.errors });
    }
    console.error('Error adding reasoning result:', error);
    return res.status(500).json({ error: 'Failed to add reasoning result' });
  }
};

// Get all reasoning results for a session
export const getSessionResults = async (req: Request, res: Response) => {
  try {
    const sessionId = parseInt(req.params.sessionId);
    if (isNaN(sessionId)) {
      return res.status(400).json({ error: 'Invalid session ID' });
    }
    
    // Verify the session exists
    const session = await storage.getThinkToolsSession(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    const results = await storage.getReasoningResultsBySessionId(sessionId);
    return res.status(200).json(results);
  } catch (error) {
    console.error('Error retrieving session results:', error);
    return res.status(500).json({ error: 'Failed to retrieve session results' });
  }
};

// Add reasoning metrics for a session
export const addReasoningMetrics = async (req: Request, res: Response) => {
  try {
    const { sessionId, reasoningMode, durationMs, stepsCount, insightsCount } = insertMetricsSchema.parse(req.body);
    
    // Verify the session exists
    const session = await storage.getThinkToolsSession(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    const metrics = await storage.createReasoningMetric({
      sessionId,
      reasoningMode,
      durationMs,
      stepsCount,
      insightsCount
    });
    
    return res.status(201).json(metrics);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid metrics data', details: error.errors });
    }
    console.error('Error adding reasoning metrics:', error);
    return res.status(500).json({ error: 'Failed to add reasoning metrics' });
  }
};

// Get all reasoning metrics for a session
export const getSessionMetrics = async (req: Request, res: Response) => {
  try {
    const sessionId = parseInt(req.params.sessionId);
    if (isNaN(sessionId)) {
      return res.status(400).json({ error: 'Invalid session ID' });
    }
    
    // Verify the session exists
    const session = await storage.getThinkToolsSession(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    const metrics = await storage.getReasoningMetricsBySessionId(sessionId);
    return res.status(200).json(metrics);
  } catch (error) {
    console.error('Error retrieving session metrics:', error);
    return res.status(500).json({ error: 'Failed to retrieve session metrics' });
  }
};
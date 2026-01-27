import express from 'express';
import {
  createSession,
  getSession,
  getUserSessions,
  addReasoningResult,
  getSessionResults,
  addReasoningMetrics,
  getSessionMetrics
} from '../controllers/thinkToolsController';

const router = express.Router();

// Session routes
router.post('/sessions', createSession);
router.get('/sessions/:id', getSession);
router.get('/users/:userId/sessions', getUserSessions);

// Reasoning results routes
router.post('/results', addReasoningResult);
router.get('/sessions/:sessionId/results', getSessionResults);

// Reasoning metrics routes
router.post('/metrics', addReasoningMetrics);
router.get('/sessions/:sessionId/metrics', getSessionMetrics);

export default router;
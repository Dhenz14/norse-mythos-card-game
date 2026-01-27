import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { SmitheryMcpService } from "./smitheryWsService";
import { SmitheryThinkToolService } from "./smitheryThinkToolService";
import mcpRouter from "./mcp";
import { initializeThinkTools } from "./mcp/ThinkToolsIntegration";
import enhancedThinkToolsRoute from "./routes/enhancedThinkToolsRoutes";
import thinkToolsRouter from "./routes/thinkTools";
import thinkToolsDiscoveryRouter from "./routes/thinkToolsDiscoveryRoutes";
import replitChatIntegrationRoutes from "./routes/replitChatIntegrationRoutes";
import rootCauseAnalysisRouter from "./routes/rootCauseAnalysisRoutes";
import rootCauseRoutes from "./routes/rootCauseRoutes";
import simulationRoutes from "./routes/simulationRoutes";
import performanceApi from "./api/performanceApi";
import searchRoutes from "./routes/searchRoutes";
import multer from "multer";
import fs from "fs";
import path from "path";

// Configure multer for handling multipart/form-data
const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

export async function registerRoutes(app: Express): Promise<Server> {
  // put application routes here
  // prefix all routes with /api


  // Create uploads directory if it doesn't exist
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Initialize Smithery MCP Service
  try {
    await SmitheryMcpService.initialize();
    console.log('Smithery MCP Service initialized successfully');
    
    // Initialize Enhanced Think Tools
    initializeThinkTools();
    console.log('Enhanced Think Tools initialized successfully');
  } catch (error) {
    console.error('Failed to initialize services:', error);
  }

  // Smithery MCP API routes
  app.get('/api/smithery/status', async (req: Request, res: Response) => {
    const isConnected = SmitheryMcpService.isConnected();
    const useMockFallback = SmitheryMcpService.getUseMockFallback();
    
    res.json({ 
      status: isConnected ? 'connected' : 'disconnected',
      apiConfigured: !!process.env.SMITHERY_API_KEY,
      mockFallbackEnabled: useMockFallback,
      mockFallbackActive: !isConnected && useMockFallback,
      // Always using the advanced Norse-specific implementation
      advancedMockEnabled: true,
      usingAdvancedMock: !isConnected && useMockFallback
    });
  });

  app.get('/api/smithery/tools', async (req: Request, res: Response) => {
    try {
      const tools = await SmitheryMcpService.listTools();
      res.json({ tools });
    } catch (error: any) {
      res.status(500).json({ 
        error: 'Failed to list Smithery MCP tools',
        details: error.message
      });
    }
  });
  
  // Configure mock mode
  app.post('/api/smithery/config', async (req: Request, res: Response) => {
    try {
      const { useMockFallback } = req.body;
      let updated = false;
      
      // Update mock fallback setting if provided
      if (typeof useMockFallback === 'boolean') {
        SmitheryMcpService.setUseMockFallback(useMockFallback);
        updated = true;
      }
      
      if (updated) {
        res.json({
          success: true,
          mockFallbackEnabled: SmitheryMcpService.getUseMockFallback(),
          // Always true since we only use the advanced implementation now
          advancedMockEnabled: true
        });
      } else {
        res.status(400).json({
          error: 'Invalid configuration',
          details: 'Expected useMockFallback boolean parameter'
        });
      }
    } catch (error: any) {
      res.status(500).json({
        error: 'Failed to update configuration',
        details: error.message
      });
    }
  });

  app.post('/api/smithery/sequential-thinking', async (req: Request, res: Response) => {
    try {
      const { prompt, maxSteps, temperature, stream } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
      }
      
      const result = await SmitheryMcpService.sequentialThinking(prompt, {
        maxSteps,
        temperature,
        stream
      }) as {
        steps?: Array<{thought?: string, reasoning?: string}>,
        conclusion?: string
      };
      
      res.json(result || { error: 'No result returned from sequential thinking' });
    } catch (error: any) {
      console.error('Sequential thinking API error:', error);
      res.status(500).json({ 
        error: 'Sequential thinking failed',
        details: error.message || 'Unknown error'
      });
    }
  });
  
  // Direct API route for simple access to Sequential Thinking with text response
  app.get('/api/smithery/think', async (req: Request, res: Response) => {
    try {
      const prompt = req.query.prompt as string;
      
      if (!prompt) {
        return res.status(400).send('Error: No prompt provided. Use ?prompt=your question here');
      }
      
      const result = await SmitheryMcpService.sequentialThinking(prompt) as {
        steps?: Array<{thought?: string, reasoning?: string}>,
        conclusion?: string
      };
      
      // Format the result as a text response
      let textResponse = `Sequential Thinking: "${prompt}"\n\n`;
      
      if (result?.steps && Array.isArray(result.steps)) {
        result.steps.forEach((step, index: number) => {
          textResponse += `Step ${index + 1}:\n`;
          textResponse += `* Thought: ${step?.thought || 'N/A'}\n`;
          textResponse += `* Reasoning: ${step?.reasoning || 'N/A'}\n\n`;
        });
      }
      
      if (result?.conclusion) {
        textResponse += `Conclusion: ${result.conclusion}\n`;
      }
      
      // Set content type to plain text and send the response
      res.setHeader('Content-Type', 'text/plain');
      res.send(textResponse);
    } catch (error: any) {
      res.status(500).send(`Error: ${error.message || 'Unknown error'}`);
    }
  });

  // Think Tool API route for strategic analysis
  app.post('/api/smithery/think-tool', async (req: Request, res: Response) => {
    try {
      const { task, context } = req.body;
      
      if (!task) {
        return res.status(400).json({ error: 'Task is required' });
      }
      
      const result = await SmitheryThinkToolService.thinkToolAnalysis(task, context);
      res.json(result);
    } catch (error: any) {
      console.error('Think Tool API error:', error);
      res.status(500).json({ 
        error: 'Think Tool analysis failed',
        details: error.message || 'Unknown error'
      });
    }
  });

  // Mount the MCP router
  app.use('/api/mcp', mcpRouter);
  
  // Mount the Enhanced Think Tools router
  app.use('/api/enhanced-think-tools', enhancedThinkToolsRoute);
  
  // Mount the Think Tools Database API router
  app.use('/api/think-tools', thinkToolsRouter);
  
  // Mount the Think Tools Discovery Protocol router
  app.use('/api/thinktools', thinkToolsDiscoveryRouter);
  
  // Mount the Replit Chat Integration routes
  app.use('/api/replit-chat', replitChatIntegrationRoutes);
  
  // Mount the Root Cause Analysis router
  app.use('/api/rootcause', rootCauseAnalysisRouter);
  
  // Mount the Root Cause Chat Integration router
  app.use('/api/rootcause-chat', rootCauseRoutes);
  
  // Mount the Performance monitoring API router
  app.use('/api/performance', performanceApi);
  
  // Mount the Search API router
  app.use('/api/search', searchRoutes);
  
  // Mount the Simulation API router
  app.use('/api/simulation', simulationRoutes);

  // use storage to perform CRUD operations on the storage interface
  // e.g. storage.insertUser(user) or storage.getUserByUsername(username)

  const httpServer = createServer(app);

  return httpServer;
}

import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import fs from "fs";
import path from "path";

// Configure multer for handling multipart/form-data
const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Create uploads directory if it doesn't exist
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Mount Pack and Inventory routes only when DATABASE_URL is set (optional for static/local dev)
  if (process.env.DATABASE_URL) {
    const packRoutes = (await import("./routes/packRoutes")).default;
    const inventoryRoutes = (await import("./routes/inventoryRoutes")).default;
    app.use('/api/packs', packRoutes);
    app.use('/api/inventory', inventoryRoutes);
  }

  // Health check endpoint
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Matchmaking routes (always available, no DB required)
  const matchmakingRoutes = (await import("./routes/matchmakingRoutes")).default;
  app.use('/api/matchmaking', matchmakingRoutes);

  // Mock blockchain routes (always available, no DB required)
  // Used when DATA_LAYER_MODE = 'test' — simulates Hive blockchain locally
  const mockBlockchainRoutes = (await import("./routes/mockBlockchainRoutes")).default;
  app.use('/api/mock-blockchain', mockBlockchainRoutes);

  const httpServer = createServer(app);

  return httpServer;
}

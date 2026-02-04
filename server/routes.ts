import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import packRoutes from "./routes/packRoutes";
import inventoryRoutes from "./routes/inventoryRoutes";
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

  // Mount the Pack System routes
  app.use('/api/packs', packRoutes);
  
  // Mount the Inventory routes
  app.use('/api/inventory', inventoryRoutes);

  // Health check endpoint
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  const httpServer = createServer(app);

  return httpServer;
}

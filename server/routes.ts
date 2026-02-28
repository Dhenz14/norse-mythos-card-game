import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

export async function registerRoutes(app: Express): Promise<Server> {
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

  // Mock blockchain routes — development/test only, disabled in production
  if (!IS_PRODUCTION) {
    const mockBlockchainRoutes = (await import("./routes/mockBlockchainRoutes")).default;
    app.use('/api/mock-blockchain', mockBlockchainRoutes);
  }

  // Chain indexer routes — global state derived from Hive L1 ops
  const chainRoutes = (await import("./routes/chainRoutes")).default;
  app.use('/api/chain', chainRoutes);

  // Start the server-side chain indexer (polls Hive RPC for ragnarok-cards ops)
  const { startIndexer } = await import("./services/chainIndexer");
  startIndexer();

  const httpServer = createServer(app);

  return httpServer;
}

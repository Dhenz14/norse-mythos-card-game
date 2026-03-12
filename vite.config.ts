import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";
import { visualizer } from "rollup-plugin-visualizer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let buildHash = "dev";
try {
  buildHash = execSync("git rev-parse --short HEAD").toString().trim();
} catch {
  buildHash = Date.now().toString(36);
}

export default defineConfig(({ command }) => ({
  base: process.env.VITE_BASE_PATH || (command === 'build' ? './' : '/'),
  define: {
    __BUILD_HASH__: JSON.stringify(buildHash),
  },
  plugins: [
    react(),
    ...(command === 'build' ? [visualizer({ filename: 'dist/bundle-stats.html', gzipSize: true, brotliSize: true })] : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
    },
    dedupe: ['react', 'react-dom'],
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react/jsx-runtime', 'react/jsx-dev-runtime'],
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
    target: 'esnext',
    chunkSizeWarningLimit: 300,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          // Vendor splits — isolate heavy node_modules
          if (id.includes('node_modules')) {
            if (id.includes('react-dom') || id.includes('react/')) return 'react-vendor';
            if (id.includes('pixi')) return 'pixi-vendor';
            if (id.includes('framer-motion') || id.includes('@react-spring')) return 'ui-vendor';
            if (id.includes('@radix-ui')) return 'radix-vendor';
            if (id.includes('zustand') || id.includes('@tanstack')) return 'state-vendor';
            if (id.includes('gsap')) return 'anim-vendor';
            if (id.includes('peerjs') || id.includes('uuid')) return 'network-vendor';
            if (id.includes('drizzle') || id.includes('idb')) return 'db-vendor';
          }
          // Card data splits — 84K lines split by category
          if (id.includes('/game/data/cardRegistry/sets/core/pets/')) return 'card-data-pets';
          if (id.includes('/game/data/cardRegistry/sets/core/neutrals/')) return 'card-data-neutrals';
          if (id.includes('/game/data/cardRegistry/sets/core/classes/')) return 'card-data-classes';
          if (id.includes('/game/data/cardRegistry/sets/')) return 'card-data-sets';
          if (id.includes('/game/data/norseHeroes/')) return 'card-data-heroes';
          if (id.includes('/game/data/cardSets/')) return 'card-data-legacy-sets';
          if (id.includes('/game/data/allCards')) return 'card-data';
          if (id.includes('/game/data/')) return 'card-data';
          // Game logic splits
          if (id.includes('/game/effects/handlers/battlecry/')) return 'effects-battlecry';
          if (id.includes('/game/effects/handlers/spellEffect/')) return 'effects-spells';
          if (id.includes('/game/effects/')) return 'effects-core';
          if (id.includes('/game/utils/spells/')) return 'engine-spells';
          if (id.includes('/game/utils/battlecry')) return 'engine-battlecry';
          if (id.includes('/game/utils/heroPower') || id.includes('/game/utils/norseHeroPower')) return 'engine-heropower';
          if (id.includes('/game/utils/deathrattle')) return 'engine-deathrattle';
          if (id.includes('/game/utils/')) return 'game-engine';
          if (id.includes('/game/stores/combat/')) return 'combat-stores';
          if (id.includes('/game/stores/gameStore')) return 'game-store';
          if (id.includes('/game/campaign/')) return 'campaign';
          // Hive data layer — shared by many chunks, must be in its own chunk to avoid circulars
          if (id.includes('/data/HiveSync') || id.includes('/data/HiveEvents') || id.includes('/data/HiveDataLayer') || id.includes('/data/schemas/')) return 'hive-data';
          if (id.includes('/data/blockchain/')) return 'blockchain';
          return undefined;
        },
      },
    },
  },
  assetsInclude: ["**/*.mp3", "**/*.ogg", "**/*.wav"],
}));

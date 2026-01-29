# Visual Studio Code Setup Guide

This file contains specific instructions for getting the project running in Visual Studio Code after downloading from Replit.

## Handling Replit-specific Features

This project uses some Replit-specific features that need to be addressed when running in VSCode:

### Vite Configuration

The project uses a Replit-specific Vite plugin (`@replit/vite-plugin-runtime-error-modal`) which may cause errors in VSCode. There are two ways to handle this:

#### Option 1: Modify package.json (Recommended)

Add a new script to your package.json:

```json
"scripts": {
  "dev": "tsx server/index.ts",
  "dev:local": "VITE_SKIP_REPLIT_PLUGIN=true tsx server/index.ts",
  // other scripts...
}
```

Then use `npm run dev:local` to start the development server.

#### Option 2: Create an environment variable

Before running the dev script, set an environment variable:

```bash
# Windows
set VITE_SKIP_REPLIT_PLUGIN=true
npm run dev

# Mac/Linux
VITE_SKIP_REPLIT_PLUGIN=true npm run dev
```

#### Option 3: Modify vite.config.ts

If the above options don't work, you can create a copy of `vite.config.ts` named `vite.config.local.ts`:

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import glsl from "vite-plugin-glsl";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  plugins: [
    react(),
    glsl(), // Add GLSL shader support
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
    },
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
  },
  // Add support for large models and audio files
  assetsInclude: ["**/*.gltf", "**/*.glb", "**/*.mp3", "**/*.ogg", "**/*.wav"],
});
```

Then replace the original `vite.config.ts` with this version.

## Node.js Version

This project works best with Node.js version 18 or higher. You can check your version with:

```bash
node --version
```

## Ports and Networking

The server is configured to run on port 5000. Make sure this port is available on your machine. The application will be accessible at:

```
http://localhost:5000
```
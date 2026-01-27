# Norse Mythos Card Game

A sophisticated Norse mythology-themed digital card game that delivers an immersive strategic experience through advanced interactive design and dynamic rendering techniques. The game combines intricate gameplay mechanics with cutting-edge visual technologies, focusing on precise card interactions and mythological storytelling.

## Special Feature: "Use Think Tools" Command

This project includes a special trigger command for the Replit AI assistant. When you type `Use Think Tools` followed by a strategy question, the system will automatically run both sequential thinking and deck recommendation tools to give you comprehensive strategy analysis.

For details on how to use this feature, see [REPLIT_CHAT_INTEGRATION.md](./REPLIT_CHAT_INTEGRATION.md).

## Features

- **Norse Mythology Theme**: Authentic Norse gods, creatures, and myths brought to life
- **Advanced Holographic Effects**: Dynamic holographic cards with distinct effects for different rarities
- **Optimized Card Designs**: Space-efficient card layouts that maximize visual appeal
- **Responsive Card Transformations**: Cards transform from full size in hand to compact battlefield versions
- **Interactive Mechanics**: Sophisticated dragability and interactive card animations
- **Strategy Analysis Tools**: Advanced tools including sequential thinking and deck recommendation systems
- **AI-Powered Assistance**: Special "Use Think Tools" command for AI-powered strategy recommendations

## Technology Stack

- **Frontend**: React with TypeScript for type-safe logic
- **State Management**: Zustand for efficient state handling
- **Styling**: Tailwind CSS for responsive design
- **Animations**: Framer Motion for sophisticated animations
- **3D Rendering**: React Three Fiber / WebGL for 3D card rendering
- **Interactive Animations**: React Spring for card animations
- **Asset Management**: Cloudinary for advanced image management
- **Backend**: Express server with TypeScript
- **Strategy Analysis**: Custom MCP (Model Controlled Program) server
- **AI Integration**: Smithery AI for advanced strategy generation
- **Chat Integration**: Special trigger commands for Replit AI assistant

## Card Design

- **Attack/Health Values**: Displayed in hexagonal badges at the top corners
- **Card Rarity Effects**:
  - **Legendary Cards**: Gold holographic effects with foil texture and shine-gold animation
  - **Epic Cards**: Purple holographic effects with prismatic-shift animation
- **Optimized Layout**: Professional sectioning with no wasted space, similar to Hearthstone's design

## 📥 Downloading the Project

This project contains over 1,500 files and 261MB of assets. For your convenience, we offer several download options:

### Option 1: Automated Download (Recommended)

The repository includes a GitHub workflow that automatically downloads all project files:

1. Go to the Actions tab in the GitHub repository
2. Select the "Download All Files Workflow"
3. Click "Run workflow" and select your preferred download option:
   - `all` - Complete project (261MB, all 1,568 files)
   - `key_components` - Essential card components only (28KB)
   - `source_only` - Source code without assets (131MB)
4. Wait for the workflow to complete and download the artifact

### Option 2: Direct Downloads

You can directly download the archives from the [Releases page](https://github.com/Dhenz14/norse-mythos-card-game/releases):

- `norse-mythos-everything-complete.tar.gz` (261MB) - Complete project with all 1,568 files
- `norse-mythos-key-components.tar.gz` (28KB) - Essential card components only
- `norse-mythos-archive.tar.gz` (131MB) - Source code archive

### Option 3: Clone Repository (Partial Files Only)

```bash
git clone https://github.com/Dhenz14/norse-mythos-card-game.git
```

This option only includes files directly pushed to the repository, not the complete project. For the full project, use Options 1 or 2.

## Getting Started

1. Extract the downloaded archive
2. Install dependencies with `npm install`
3. Start the development server with `npm run dev`
4. Open your browser and navigate to `http://localhost:5173`

## Key Components

### Card System Components

The most important files for understanding the holographic card system are:

- `client/src/components/CardFrame.tsx` - Main card component
- `client/src/components/BattlefieldCardFrame.tsx` - Optimized battlefield cards
- `client/src/game/components/HolographicCardEffect.tsx` - Base holographic effect
- `client/src/game/components/LegendaryCardEffect.tsx` - Gold legendary effect
- `client/src/game/hooks/useCardTransform.tsx` - Card transformation logic

### Strategy Analysis Components

Key files for the strategy analysis and AI integration:

- `server/mcp/triggerCommand.ts` - "Use Think Tools" trigger command handler
- `server/mcp/sequentialThinking.ts` - Sequential thinking analysis
- `server/mcp/thinkTool.ts` - Deck recommendation tool
- `server/mcp/combinedStrategy.ts` - Combined workflow implementation
- `server/triggerThinkTools.js` - JavaScript helper for detecting trigger commands
- `REPLIT_CHAT_INTEGRATION.md` - Detailed documentation on using the trigger command

## License

This project is licensed under the MIT License - see the LICENSE file for details.
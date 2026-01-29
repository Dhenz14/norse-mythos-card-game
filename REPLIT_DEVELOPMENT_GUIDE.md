# Comprehensive Replit Development Guide

## Introduction
This guide provides comprehensive guidance for developing within the Replit environment, with specific focus on the Norse Card Game project. It covers tool usage, best practices, error handling, deployment, and integration with Replit's ecosystem.

## Table of Contents
1. [Replit Tools](#replit-tools)
2. [Development Workflow](#development-workflow)
3. [Error Handling](#error-handling)
4. [Debugging Strategies](#debugging-strategies)
5. [Testing Framework](#testing-framework)
6. [Deployment Guide](#deployment-guide)
7. [Environment Management](#environment-management)
8. [Package Management](#package-management)
9. [Multiplayer Collaboration](#multiplayer-collaboration)
10. [Think Tools Integration](#think-tools-integration)
11. [Performance Requirements](#performance-requirements)

## Replit Tools

### File Operations
```javascript
// View file content
str_replace_editor({
  command: "view",
  path: "./client/src/components/Card.tsx"
});

// Create a new file
str_replace_editor({
  command: "create",
  path: "./client/src/effects/FrostEffect.ts",
  file_text: "export const frostEffect = {\n  // Implementation\n};"
});

// Modify existing file
str_replace_editor({
  command: "str_replace",
  path: "./client/src/cards/thorCards.ts",
  old_str: "damage: 5",
  new_str: "damage: 6"
});

// Insert at specific line
str_replace_editor({
  command: "insert",
  path: "./client/src/game/effects.ts",
  insert_line: 25,  // Insert after line 25
  new_str: "  freezeEffect: applyFreezeStatus,"
});

// View a specific range of lines
str_replace_editor({
  command: "view",
  path: "./server/index.ts",
  view_range: [45, 60]  // Show lines 45-60
});
```

### File Search
```javascript
// Find by natural language query
search_filesystem({
  query_description: "Find card definition files for Thor cards"
});

// Search for specific classes
search_filesystem({
  class_names: ["Card", "ThorCard", "CardEffect"]
});

// Look for specific functions
search_filesystem({
  function_names: ["applyCardEffect", "drawCard", "calculateDamage"]
});

// Search for code patterns
search_filesystem({
  code: ["export const thorCards", "class ThorHammer extends Card"]
});
```

### Database Operations
```javascript
// Query data
execute_sql_tool({
  sql_query: "SELECT * FROM cards WHERE class = 'Thor' ORDER BY cost ASC LIMIT 10;"
});

// Update records
execute_sql_tool({
  sql_query: "UPDATE cards SET attack = 5 WHERE id = 'thor_hammer';"
});

// Schema migration (create table)
execute_sql_tool({
  sql_query: "CREATE TABLE IF NOT EXISTS card_effects (id TEXT PRIMARY KEY, name TEXT, description TEXT, target TEXT);"
});

// Join queries
execute_sql_tool({
  sql_query: "SELECT c.name, c.cost, e.description FROM cards c JOIN card_effects e ON c.effect_id = e.id WHERE c.class = 'Thor';"
});

// Check database status
check_database_status({});
```

### Workflow Management
```javascript
// Start or restart workflow
restart_workflow({
  name: "Start Game"
});

// Get application feedback
web_application_feedback_tool({
  workflow_name: "Start Game",
  query: "How does the new card animation look?",
  website_route: "/game"  // Optional specific route
});
```

### Package Management
```javascript
// Install Node.js packages
packager_tool({
  install_or_uninstall: "install",
  language_or_system: "nodejs",
  dependency_list: ["three", "react-three-fiber", "zustand"]
});

// Install system packages
packager_tool({
  install_or_uninstall: "install", 
  language_or_system: "system",
  dependency_list: ["ffmpeg", "imagemagick"]
});

// Uninstall packages
packager_tool({
  install_or_uninstall: "uninstall",
  language_or_system: "nodejs",
  dependency_list: ["unused-package"]
});
```

### Secret Management
```javascript
// Request secrets from user
ask_secrets({
  secret_keys: ["OPENAI_API_KEY", "CLOUDINARY_URL"],
  user_message: "We need your OpenAI API key for AI card generation and Cloudinary credentials for image storage. These will be securely stored as environment variables."
});

// Check if secrets exist
check_secrets({
  secret_keys: ["OPENAI_API_KEY", "CLOUDINARY_URL"]
});
```

### Shell Commands (when necessary)
```javascript
// Execute commands and capture output
bash({
  command: "ls -la ./client/public/assets"
});

// Complex piped commands
bash({
  command: "find ./client/src -name '*.tsx' | xargs grep 'useCardEffect'"
});

// Never use for file editing - use str_replace_editor instead
```

## Development Workflow

### Starting a New Feature
1. Search codebase to understand relevant components:
   ```javascript
   search_filesystem({
     query_description: "Find card effect implementation and usage"
   });
   ```

2. Examine existing patterns:
   ```javascript
   str_replace_editor({
     command: "view",
     path: "./client/src/effects/FireEffect.ts" 
   });
   ```

3. Create implementation files:
   ```javascript
   str_replace_editor({
     command: "create",
     path: "./client/src/effects/FrostEffect.ts",
     file_text: "// Frost effect implementation" 
   });
   ```

4. Test implementation:
   ```javascript
   restart_workflow({
     name: "Start Game"
   });
   
   web_application_feedback_tool({
     workflow_name: "Start Game",
     query: "How does the new frost effect look?"
   });
   ```

5. Refine based on feedback

### Fixing Bugs
1. Locate problematic code:
   ```javascript
   search_filesystem({
     query_description: "Find card damage calculation"
   });
   ```

2. Examine implementation:
   ```javascript
   str_replace_editor({
     command: "view",
     path: "./client/src/game/combat.ts"
   });
   ```

3. Implement fix:
   ```javascript
   str_replace_editor({
     command: "str_replace",
     path: "./client/src/game/combat.ts",
     old_str: "function calculateDamage(attack, defense) {\n  return attack - defense;\n}",
     new_str: "function calculateDamage(attack, defense) {\n  return Math.max(1, attack - defense);\n}"
   });
   ```

4. Verify fix:
   ```javascript
   restart_workflow({
     name: "Start Game"
   });
   
   web_application_feedback_tool({
     workflow_name: "Start Game",
     query: "Is the damage calculation fixed now?"
   });
   ```

## Error Handling

### Replit-Specific Error Handling

#### Console Error Analysis
When encountering errors in the Replit console:

1. Extract error details:
   ```javascript
   bash({
     command: "grep -r 'TypeError:' ./logs/error.log | tail -n 20"
   });
   ```

2. Examine stack trace for Replit-specific paths (e.g., `/home/runner/...`)

3. Check for environment-specific issues:
   - Permissions problems in Replit's containers
   - Path resolution differences
   - Memory limitations

#### Common Replit Error Scenarios and Solutions

| Error Type | Common Causes | Solution Approach |
|------------|---------------|------------------|
| Module not found | Package not installed, path resolution | Use `packager_tool` to install, check relative paths |
| Permission denied | Attempting file operations outside allowed paths | Use proper relative paths from project root |
| Memory limit exceeded | Asset size, inefficient operations | Optimize asset loading, implement pagination |
| Port conflicts | Multiple services using same port | Use Replit-assigned ports via environment variables |
| Environment variable issues | Missing secrets | Use `ask_secrets` to request needed values |

### Error Handling Implementation
```javascript
// Frontend error boundary for Replit environment
str_replace_editor({
  command: "create",
  path: "./client/src/components/ErrorBoundary.tsx",
  file_text: `import React from 'react';

export class ReplitErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Caught error:", error, errorInfo);
    this.setState({ error, errorInfo });
    
    // Log to Replit console with distinguishable format
    console.error(\`[REPLIT_ERROR_BOUNDARY] \${error.message}\`);
    
    // Could implement API call to log server-side
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-container">
          <h2>Something went wrong.</h2>
          <details>
            <summary>Error Details</summary>
            <pre>{this.state.error?.toString()}</pre>
            <pre>{this.state.errorInfo?.componentStack}</pre>
          </details>
          <button onClick={() => window.location.reload()}>
            Reload Application
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}`
});
```

## Debugging Strategies

### Replit-Specific Debugging

#### Console Logs Capture
```javascript
// Add enhanced logging
str_replace_editor({
  command: "str_replace",
  path: "./client/src/utils/logger.ts",
  old_str: "export function logError(error) {\n  console.error(error);\n}",
  new_str: `export function logError(error, context = {}) {
  // Format for easy filtering in Replit logs
  const timestamp = new Date().toISOString();
  const contextStr = JSON.stringify(context);
  console.error(\`[ERROR][${timestamp}] \${error.message || error}\nContext: \${contextStr}\nStack: \${error.stack || 'No stack trace'}\`);
}`
});
```

#### Debug Mode Implementation
```javascript
// Toggle debug mode via environment variable
str_replace_editor({
  command: "str_replace",
  path: "./client/src/utils/debug.ts",
  old_str: "export const isDebug = false;",
  new_str: "export const isDebug = process.env.REPLIT_ENVIRONMENT === 'development';"
});
```

#### Frontend Component Debugging
```javascript
// Create debug overlay component
str_replace_editor({
  command: "create",
  path: "./client/src/components/DebugOverlay.tsx",
  file_text: `import React, { useState, useEffect } from 'react';
import { useGameState } from '../state/gameState';

export const DebugOverlay = () => {
  const [visible, setVisible] = useState(false);
  const gameState = useGameState();
  const [fps, setFps] = useState(0);
  const [memory, setMemory] = useState(0);
  
  // Toggle with Ctrl+Shift+D
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        setVisible(prev => !prev);
        e.preventDefault();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  // Performance monitoring
  useEffect(() => {
    if (!visible) return;
    
    let frameCount = 0;
    let lastTime = performance.now();
    
    const calculateFps = () => {
      frameCount++;
      const now = performance.now();
      
      if (now - lastTime >= 1000) {
        setFps(Math.round(frameCount * 1000 / (now - lastTime)));
        frameCount = 0;
        lastTime = now;
        
        // Update memory usage if performance API available
        if (performance.memory) {
          setMemory(Math.round(performance.memory.usedJSHeapSize / (1024 * 1024)));
        }
      }
      
      requestAnimationFrame(calculateFps);
    };
    
    const rafId = requestAnimationFrame(calculateFps);
    return () => cancelAnimationFrame(rafId);
  }, [visible]);
  
  if (!visible) return null;
  
  return (
    <div className="debug-overlay">
      <h3>Debug Info</h3>
      <div>FPS: {fps}</div>
      {memory > 0 && <div>Memory: {memory} MB</div>}
      <div>Cards in play: {gameState.cardsInPlay.length}</div>
      <div>Hand size: {gameState.hand.length}</div>
      <div>Current mana: {gameState.currentMana}/{gameState.maxMana}</div>
      
      <button onClick={() => console.log('Full game state:', gameState)}>
        Log State
      </button>
    </div>
  );
};`
});
```

#### Network Request Debugging
```javascript
// Enhanced API debugging
str_replace_editor({
  command: "str_replace",
  path: "./client/src/api/apiClient.ts",
  old_str: "async function fetchFromApi(endpoint, options = {}) {\n  const response = await fetch(endpoint, options);\n  return response.json();\n}",
  new_str: `async function fetchFromApi(endpoint, options = {}) {
  const DEBUG = process.env.REPLIT_ENVIRONMENT === 'development';
  
  if (DEBUG) console.log(\`API Request: \${options.method || 'GET'} \${endpoint}\`, options.body || '');
  
  try {
    const startTime = performance.now();
    const response = await fetch(endpoint, options);
    const endTime = performance.now();
    
    if (DEBUG) {
      console.log(\`API Response: \${response.status} (\${Math.round(endTime - startTime)}ms)\`);
    }
    
    const data = await response.json();
    
    if (DEBUG && !response.ok) {
      console.error('API Error:', data);
    }
    
    return data;
  } catch (error) {
    console.error(\`API Request Failed: \${endpoint}\`, error);
    throw error;
  }
}`
});
```

## Testing Framework

### Jest Configuration for Replit
```javascript
// Create Jest config
str_replace_editor({
  command: "create",
  path: "./jest.config.js",
  file_text: `module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: [
    '**/tests/**/*.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
    }]
  },
  setupFilesAfterEnv: ['./tests/setup.js'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  moduleNameMapper: {
    // Handle CSS/SCSS imports in tests
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    // Handle image imports
    '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/tests/__mocks__/fileMock.js',
    // Handle module aliases
    '^@/(.*)$': '<rootDir>/client/src/$1'
  },
  collectCoverage: true,
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'client/src/**/*.{ts,tsx}',
    'server/**/*.ts',
    '!**/node_modules/**',
    '!**/vendor/**'
  ],
  // Optimize for Replit environment
  maxWorkers: '50%', // Limit workers to avoid memory issues
  verbose: true
};`
});

// Create test setup file
str_replace_editor({
  command: "create",
  path: "./tests/setup.js",
  file_text: `// Setup for Jest in Replit environment
process.env.REPLIT_ENVIRONMENT = 'test';

// Mock window object for non-browser tests
if (typeof window === 'undefined') {
  global.window = {};
}

// Mock localStorage
if (typeof localStorage === 'undefined') {
  global.localStorage = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  };
}

// Mock fetch API
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({}),
    ok: true,
    status: 200,
  })
);

// Console overrides for cleaner test output
const originalConsoleError = console.error;
console.error = (...args) => {
  // Filter out certain React-specific warnings
  if (typeof args[0] === 'string' && 
      (args[0].includes('Warning: React') || 
       args[0].includes('Warning: The above error'))) {
    return;
  }
  originalConsoleError(...args);
};

// Extend Jest with custom matchers
expect.extend({
  toBeWithinRange(received, floor, ceiling) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () => \`expected \${received} not to be within range \${floor} - \${ceiling}\`,
        pass: true,
      };
    } else {
      return {
        message: () => \`expected \${received} to be within range \${floor} - \${ceiling}\`,
        pass: false,
      };
    }
  },
});`
});

// Create mock file for assets
str_replace_editor({
  command: "create",
  path: "./tests/__mocks__/fileMock.js",
  file_text: "module.exports = 'test-file-stub';"
});
```

### Sample Test Implementation
```javascript
// Create a test file
str_replace_editor({
  command: "create",
  path: "./tests/card.test.ts",
  file_text: `import { Card } from '../client/src/models/Card';
import { applyCardEffect } from '../client/src/game/effects';

describe('Card', () => {
  test('should create card with correct properties', () => {
    const card = new Card({
      id: 'test-card',
      name: 'Test Card',
      cost: 3,
      attack: 2,
      health: 4,
      type: 'Minion',
      rarity: 'Common',
      class: 'Neutral'
    });
    
    expect(card.id).toBe('test-card');
    expect(card.name).toBe('Test Card');
    expect(card.cost).toBe(3);
    expect(card.attack).toBe(2);
    expect(card.health).toBe(4);
    expect(card.type).toBe('Minion');
    expect(card.rarity).toBe('Common');
    expect(card.class).toBe('Neutral');
  });
  
  test('should handle damage correctly', () => {
    const card = new Card({
      id: 'test-card',
      name: 'Test Card',
      health: 5,
      type: 'Minion'
    });
    
    card.takeDamage(2);
    expect(card.health).toBe(3);
    
    card.takeDamage(4);
    expect(card.health).toBe(0);
    expect(card.isDestroyed()).toBe(true);
  });
});

describe('Card Effects', () => {
  test('should apply damage effect correctly', () => {
    const sourceCard = new Card({
      id: 'source',
      name: 'Source Card',
      attack: 3
    });
    
    const targetCard = new Card({
      id: 'target',
      name: 'Target Card',
      health: 5
    });
    
    applyCardEffect('damage', sourceCard, targetCard);
    expect(targetCard.health).toBe(2);
  });
});`
});
```

### Running Tests in Replit
```javascript
// Add script to run tests
str_replace_editor({
  command: "create",
  path: "./test-runner.sh",
  file_text: `#!/bin/bash

# Define colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Running Jest tests in Replit environment...${NC}"

# Run Jest with optimizations for Replit
npx jest --runInBand --detectOpenHandles --forceExit "$@"

# Store test result
TEST_RESULT=$?

if [ $TEST_RESULT -eq 0 ]; then
  echo -e "${GREEN}All tests passed!${NC}"
else
  echo -e "${RED}Some tests failed.${NC}"
fi

exit $TEST_RESULT`
});

// Make script executable
bash({
  command: "chmod +x ./test-runner.sh"
});
```

## Deployment Guide

### Replit Deployments Setup

1. Prepare for deployment:
   ```javascript
   // Create a production build script
   str_replace_editor({
     command: "create",
     path: "./deploy.sh",
     file_text: `#!/bin/bash

# Define colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Building production version...${NC}"

# Install production dependencies only
npm ci --production

# Build frontend
npm run build

echo -e "${GREEN}Build complete! Ready for deployment.${NC}"

# Suggest deployment
echo -e "${YELLOW}To deploy, use the suggest_deploy tool or click the Deploy button in Replit.${NC}"`
   });
   
   // Make script executable
   bash({
     command: "chmod +x ./deploy.sh"
   });
   ```

2. Configure deployment settings:
   ```javascript
   // Create .replit file with deployment configuration
   str_replace_editor({
     command: "str_replace",
     path: "./.replit",
     old_str: "# Add deployment configuration here",
     new_str: `run = "npm run dev"
build = "./deploy.sh"
entrypoint = "server/index.ts"

# Deployment settings
deploymentTarget = "cloudrun"
ignorePorts = false
sleepPreventionEnabled = true

# Environment variables
[env]
PORT = "5000"
NODE_ENV = "production"`
   });
   ```

3. Optimize for production:
   ```javascript
   // Optimize asset loading for production
   str_replace_editor({
     command: "str_replace",
     path: "./client/src/utils/assetLoader.ts",
     old_str: "export async function loadAssets() {",
     new_str: `// Configure asset loading based on environment
const CDN_URL = process.env.NODE_ENV === 'production' 
  ? 'https://cdn.example.com/assets' 
  : '';
  
export async function loadAssets() {
  // Use CDN in production`
   });
   ```

4. Deploy using the built-in tool:
   ```javascript
   // Suggest deployment to the user
   suggest_deploy({});
   ```

### Post-Deployment Verification
```javascript
// Create post-deployment verification script
str_replace_editor({
  command: "create",
  path: "./verify-deployment.js",
  file_text: `// Deployment verification script
const https = require('https');

// Get the deployment URL (default to example if not provided)
const deploymentUrl = process.env.DEPLOYMENT_URL || 'https://your-app.replit.app';

console.log(\`Verifying deployment at: \${deploymentUrl}\`);

// Perform basic health check
https.get(\`\${deploymentUrl}/api/health\`, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    if (res.statusCode === 200) {
      console.log('✅ Health check passed!');
      console.log(\`Response: \${data}\`);
    } else {
      console.error(\`❌ Health check failed with status: \${res.statusCode}\`);
      console.error(\`Response: \${data}\`);
      process.exit(1);
    }
  });
}).on('error', (err) => {
  console.error('❌ Health check request failed:', err.message);
  process.exit(1);
});`
});
```

## Environment Management

### Environment Variables
```javascript
// Create environment setup script
str_replace_editor({
  command: "create",
  path: "./setup-env.js",
  file_text: `// Environment setup script for Replit
const fs = require('fs');
const path = require('path');

// Default environment values
const defaultEnv = {
  NODE_ENV: 'development',
  PORT: '5000',
  DATABASE_URL: process.env.DATABASE_URL || 'sqlite://./dev.db',
  // Add other default values here
};

// Check if .env exists, create if not
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  console.log('Creating default .env file...');
  
  const envContent = Object.entries(defaultEnv)
    .map(([key, value]) => \`\${key}=\${value}\`)
    .join('\\n');
  
  fs.writeFileSync(envPath, envContent);
  console.log('.env file created successfully');
} else {
  console.log('.env file already exists');
}

// Create example .env file
const exampleEnvPath = path.join(__dirname, '.env.example');
if (!fs.existsSync(exampleEnvPath)) {
  console.log('Creating .env.example file...');
  
  const exampleContent = Object.entries(defaultEnv)
    .map(([key, value]) => \`\${key}=\${value}\`)
    .join('\\n');
  
  fs.writeFileSync(exampleEnvPath, exampleContent);
  console.log('.env.example file created successfully');
}`
});
```

### Secrets Management Best Practices
```javascript
// Create environment loader
str_replace_editor({
  command: "create",
  path: "./client/src/utils/environment.ts",
  file_text: `// Environment utilities for Replit
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Environment type
type Environment = 'development' | 'production' | 'test';

// Get current environment
export const getEnvironment = (): Environment => {
  return (process.env.NODE_ENV as Environment) || 'development';
};

// Check if in Replit environment
export const isReplitEnvironment = (): boolean => {
  return !!process.env.REPLIT_ENVIRONMENT;
};

// Get API URL based on environment
export const getApiUrl = (): string => {
  if (getEnvironment() === 'production') {
    return process.env.API_URL || window.location.origin;
  }
  
  // Development URL with port
  return \`http://localhost:\${process.env.PORT || 5000}\`;
};

// Get secret safely (with fallback)
export const getSecret = <T>(key: string, fallback: T): string | T => {
  const value = process.env[key];
  if (!value && getEnvironment() === 'production') {
    console.warn(\`Missing required secret: \${key}\`);
  }
  return value || fallback;
};

// Check if all required secrets are present
export const validateSecrets = (requiredSecrets: string[]): boolean => {
  const missing = requiredSecrets.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.warn(\`Missing required secrets: \${missing.join(', ')}\`);
    return false;
  }
  
  return true;
};`
});
```

## Package Management

### Efficient Package Installation
```javascript
// Install production packages
packager_tool({
  install_or_uninstall: "install",
  language_or_system: "nodejs",
  dependency_list: ["express", "react", "react-dom", "three"]
});

// Install development packages
packager_tool({
  install_or_uninstall: "install", 
  language_or_system: "nodejs",
  dependency_list: ["typescript", "jest", "ts-jest", "@types/jest"]
});
```

### Package Optimization
```javascript
// Create dependency management script
str_replace_editor({
  command: "create",
  path: "./optimize-packages.js",
  file_text: `// Package optimization script for Replit
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Analyzing dependencies...');

// Check for duplicate dependencies
try {
  console.log('Checking for duplicates...');
  execSync('npx depcheck', { stdio: 'inherit' });
} catch (error) {
  console.warn('Depcheck failed:', error.message);
}

// Check for unused dependencies
try {
  console.log('\\nChecking for unused dependencies...');
  execSync('npx npm-check', { stdio: 'inherit' });
} catch (error) {
  console.warn('npm-check failed:', error.message);
}

// Check bundle size
try {
  console.log('\\nAnalyzing bundle size...');
  execSync('npx source-map-explorer dist/assets/*.js', { stdio: 'inherit' });
} catch (error) {
  console.warn('Bundle analysis failed:', error.message);
}

console.log('\\nOptimization analysis complete');`
});
```

## Multiplayer Collaboration

### Replit Multiplayer Best Practices
```javascript
// Create multiplayer guidance
str_replace_editor({
  command: "create",
  path: "./MULTIPLAYER_GUIDE.md",
  file_text: `# Replit Multiplayer Collaboration Guide

## Best Practices for Collaborative Development

### Setting Up Multiplayer Session

1. **Invite Collaborators**
   - Click "Invite" in the top-right corner of your Repl
   - Share the invitation link with your team members
   - Set appropriate permissions (Read, Write, Admin)

2. **Establish Communication Channel**
   - Use Replit's built-in chat for quick discussions
   - Consider setting up a separate channel (Discord, Slack) for larger discussions
   - Document decisions in comments or separate files

### Collaborative Coding

1. **File Ownership**
   - Assign primary ownership of files/modules to avoid conflicts
   - Update the CODEOWNERS file with assignments:
     \`\`\`
     # Card system
     client/src/cards/* @developer1
     
     # Game mechanics
     client/src/game/* @developer2
     
     # UI components
     client/src/components/* @developer3
     \`\`\`

2. **Real-time Collaboration**
   - Communicate when working on the same file
   - Use comments to indicate work-in-progress sections:
     \`\`\`javascript
     // TODO(@developer1): Implement card draw animation
     // FIXME(@developer2): Fix performance issue with particle effects
     // NOTE(@developer3): This approach may need optimization for mobile
     \`\`\`

3. **Conflict Resolution**
   - If conflicts occur, communicate before resolving
   - Prefer smaller, focused changes to minimize conflicts
   - Use branches for larger features (via Git if needed)

### Version Control Integration

1. **Snapshot Management**
   - Create regular snapshots with descriptive messages
   - Use conventional commits format: \`type(scope): message\`
   - Example: \`feat(cards): add frost giant card implementation\`

2. **Git Integration**
   - For advanced version control, connect Replit to GitHub
   - Use the Version Control panel in Replit
   - Create feature branches for larger changes

### Performance Considerations

1. **Resource Sharing**
   - Be mindful of RAM usage in multiplayer sessions
   - Avoid running multiple heavy processes simultaneously
   - Coordinate when running tests or builds

2. **Workspace Responsiveness**
   - Close unnecessary files to improve editor performance
   - Use .gitignore and .replignore to exclude large files
   - Consider splitting very large projects into multiple Repls

### Documentation

1. **Code Comments**
   - Document complex logic with clear comments
   - Use JSDoc style for functions and classes
   - Include examples for non-obvious usage

2. **Project Documentation**
   - Maintain up-to-date README.md
   - Document architecture in separate files
   - Keep API documentation current

3. **Collaboration Notes**
   - Document decisions in DECISIONS.md
   - Track known issues in ISSUES.md
   - Maintain a CHANGELOG.md for version history`
});
```

## Think Tools Integration

### Usage Guide
```javascript
// Create Think Tools usage guide
str_replace_editor({
  command: "create",
  path: "./THINK_TOOLS_GUIDE.md",
  file_text: `# Think Tools Usage Guide

## Overview
The Think Tools system provides strategic analysis for the Norse Card Game. It breaks down complex questions into sequential steps and provides structured recommendations.

## How to Use Think Tools

### Starting a Think Tools Analysis
Begin any query with "Use Think Tools" followed by your strategic question. For example:
- "Use Think Tools to analyze Thor aggro deck weaknesses"
- "Use Think Tools for developing a control Odin strategy"
- "Use Think Tools to optimize my midrange Heimdall deck"

### Think Tools Output Format
Think Tools responses follow a consistent format:

1. **Strategic Analysis**: Sequential breakdown of the problem
2. **Deck Recommendations**: Suggested deck archetypes
3. **Strength/Weakness Analysis**: Pros and cons of strategies
4. **Implementation Plan**: Practical steps to implement

### Example Think Tools Query
\`\`\`
Use Think Tools how to counter aggressive Thor decks
\`\`\`

### Response Components

#### Sequential Thinking
- Breaks complex problems into ordered steps
- Analyzes goals, meta, matchups, and card selection
- Organizes information into logical progressions

#### Think Tool Analysis
- Provides concrete deck recommendations
- Analyzes strengths and weaknesses
- Identifies key cards for specific strategies
- Suggests tech choices for common matchups

#### Visual Indicators
🔮 Indicates Think Tools activation
⚡ Marks sequential thinking sections
🌲 Denotes detailed analysis sections

## Best Practices

1. **Be Specific**: Include specific archetypes or cards in your query
2. **Focus on Strategy**: Think Tools excels at strategic questions rather than technical implementation
3. **Build on Results**: Use generated strategies as a starting point for further refinement
4. **Test and Iterate**: Implement recommendations and track results for improvement`
});
```

## Performance Requirements

### Performance Monitoring Setup
```javascript
// Create performance monitoring utility
str_replace_editor({
  command: "create",
  path: "./client/src/utils/performance.ts",
  file_text: `// Performance monitoring utilities for Replit environment
import { useEffect, useState } from 'react';

// Performance thresholds (as specified in requirements)
export const PERFORMANCE_THRESHOLDS = {
  rendering: {
    targetFps: 60,
    maxFrameTime: 16, // ms
  },
  interactions: {
    maxResponseTime: 50, // ms
  },
  memory: {
    maxUsage: 512, // MB
  },
  loading: {
    maxAssetTime: 2000, // ms
  },
};

// Track frame rate
export function useFpsMonitor() {
  const [fps, setFps] = useState(0);
  const [frameTime, setFrameTime] = useState(0);
  
  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let rafId: number;
    
    const countFrames = () => {
      const now = performance.now();
      frameCount++;
      
      if (now - lastTime >= 1000) {
        // Calculate FPS
        const currentFps = Math.round(frameCount * 1000 / (now - lastTime));
        setFps(currentFps);
        
        // Calculate average frame time
        setFrameTime(Math.round((now - lastTime) / frameCount));
        
        // Reset counters
        frameCount = 0;
        lastTime = now;
      }
      
      rafId = requestAnimationFrame(countFrames);
    };
    
    rafId = requestAnimationFrame(countFrames);
    
    return () => {
      cancelAnimationFrame(rafId);
    };
  }, []);
  
  // Check if performance meets requirements
  const isPerformant = fps >= PERFORMANCE_THRESHOLDS.rendering.targetFps &&
    frameTime <= PERFORMANCE_THRESHOLDS.rendering.maxFrameTime;
  
  return { fps, frameTime, isPerformant };
}

// Track memory usage
export function useMemoryMonitor() {
  const [memoryUsage, setMemoryUsage] = useState(0);
  
  useEffect(() => {
    // Only works in browsers that support the performance.memory API
    const checkMemory = () => {
      if (performance.memory) {
        const usedHeapSize = performance.memory.usedJSHeapSize / (1024 * 1024);
        setMemoryUsage(Math.round(usedHeapSize));
      }
    };
    
    // Check once immediately
    checkMemory();
    
    // Set up interval to check regularly
    const intervalId = setInterval(checkMemory, 2000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, []);
  
  // Check if memory usage meets requirements
  const isWithinLimits = memoryUsage <= PERFORMANCE_THRESHOLDS.memory.maxUsage;
  
  return { memoryUsage, isWithinLimits };
}

// Track interaction response time
export function trackInteractionTime(
  interactionType: string,
  callback: () => void
) {
  const startTime = performance.now();
  
  const wrappedCallback = () => {
    const endTime = performance.now();
    const responseTime = endTime - startTime;
    
    // Log if response time exceeds threshold
    if (responseTime > PERFORMANCE_THRESHOLDS.interactions.maxResponseTime) {
      console.warn(
        \`Slow interaction: \${interactionType} took \${responseTime.toFixed(2)}ms\`
      );
    }
    
    // Call the original callback
    callback();
  };
  
  return wrappedCallback;
}

// Track asset loading time
export function trackAssetLoading(assetUrl: string): Promise<any> {
  const startTime = performance.now();
  
  return new Promise((resolve, reject) => {
    const assetType = assetUrl.split('.').pop()?.toLowerCase();
    
    if (assetType === 'jpg' || assetType === 'png' || assetType === 'webp') {
      // Image loading
      const img = new Image();
      img.onload = () => {
        const loadTime = performance.now() - startTime;
        
        if (loadTime > PERFORMANCE_THRESHOLDS.loading.maxAssetTime) {
          console.warn(\`Slow asset loading: \${assetUrl} took \${loadTime.toFixed(2)}ms\`);
        }
        
        resolve(img);
      };
      img.onerror = (err) => reject(err);
      img.src = assetUrl;
    } else {
      // For other asset types (audio, json, etc.)
      fetch(assetUrl)
        .then(response => {
          const loadTime = performance.now() - startTime;
          
          if (loadTime > PERFORMANCE_THRESHOLDS.loading.maxAssetTime) {
            console.warn(\`Slow asset loading: \${assetUrl} took \${loadTime.toFixed(2)}ms\`);
          }
          
          return response.blob();
        })
        .then(resolve)
        .catch(reject);
    }
  });
}`
});
```

### Performance Implementation Example
```javascript
// Implement performance monitoring in a card renderer
str_replace_editor({
  command: "create",
  path: "./client/src/components/CardRenderer.tsx",
  file_text: `import React, { useEffect, useRef } from 'react';
import { Card } from '../models/Card';
import { useFpsMonitor, trackAssetLoading, trackInteractionTime } from '../utils/performance';

interface CardRendererProps {
  card: Card;
  position: { x: number, y: number };
  onClick?: () => void;
}

export const CardRenderer: React.FC<CardRendererProps> = ({ 
  card, 
  position, 
  onClick 
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const { fps, frameTime, isPerformant } = useFpsMonitor();
  
  // Track card image loading
  useEffect(() => {
    if (card.imageUrl) {
      trackAssetLoading(card.imageUrl)
        .then(() => {
          console.log(\`Card image loaded: \${card.name}\`);
        })
        .catch(error => {
          console.error(\`Failed to load card image: \${card.name}\`, error);
        });
    }
  }, [card.imageUrl, card.name]);
  
  // Handle click with performance tracking
  const handleClick = onClick 
    ? trackInteractionTime('card-click', onClick)
    : undefined;
  
  // Apply performance optimizations if needed
  useEffect(() => {
    if (!isPerformant && cardRef.current) {
      // Reduce visual effects when performance is low
      cardRef.current.classList.add('performance-mode');
      
      // Log performance issue
      console.warn(
        \`Performance mode activated for card \${card.name}. ` + 
        \`FPS: \${fps}, Frame time: \${frameTime}ms\`
      );
    }
  }, [isPerformant, fps, frameTime, card.name]);
  
  return (
    <div 
      ref={cardRef}
      className="card-renderer"
      style={{
        transform: \`translate(\${position.x}px, \${position.y}px)\`,
        width: '200px',
        height: '280px',
      }}
      onClick={handleClick}
      data-card-id={card.id}
    >
      <div className="card-name">{card.name}</div>
      <div className="card-cost">{card.cost}</div>
      {card.imageUrl && (
        <div 
          className="card-image"
          style={{ backgroundImage: \`url(\${card.imageUrl})\` }}
        />
      )}
      <div className="card-stats">
        {card.attack !== undefined && (
          <div className="card-attack">{card.attack}</div>
        )}
        {card.health !== undefined && (
          <div className="card-health">{card.health}</div>
        )}
      </div>
      <div className="card-text">{card.text}</div>
      
      {/* Performance indicator in development mode */}
      {process.env.NODE_ENV === 'development' && !isPerformant && (
        <div className="performance-warning">
          ⚠️ Low FPS: {fps}
        </div>
      )}
    </div>
  );
};`
});
```

## Conclusion
This comprehensive guide covers all aspects of developing in the Replit environment for the Norse Card Game project. By following these guidelines, you'll ensure efficient, performant, and collaborative development that takes full advantage of Replit's features and capabilities.

Key recommendations:
1. Use Replit-specific tools rather than generic alternatives
2. Follow error handling and debugging best practices
3. Implement performance monitoring to meet requirements
4. Leverage Think Tools for strategic analysis
5. Use proper deployment and environment management
6. Follow collaborative development guidelines
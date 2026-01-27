/**
 * Think Tools Configuration
 * 
 * This module provides configuration for the Think Tools system.
 * It defines standard emojis, templates, triggers, and other settings.
 */

/**
 * Standard emoji set for Think Tools
 */
export const STANDARD_EMOJIS = {
  ACTIVATION: '🔮',
  SEQUENTIAL: '⚡',
  THINK_TOOL: '🌲',
  NEXT_STEP: '>>',
  COMPLETED: '✅',
  ROOT: '🌳',
  BRANCH: '🌿',
  LEAF: '🍃',
  MULTIDIRECTIONAL: '🔄',
  PERSPECTIVE: '🔍',
  COGNITIVE: '🧠',
  IMPLEMENTATION_CHECKMARK: '✓',
  IMPLEMENTATION_NEXT: '→'
};

/**
 * Standard format template
 */
export const STANDARD_FORMAT_TEMPLATE = `
🔮 THINK TOOLS ACTIVATED 🔮

⚡ SEQUENTIAL THINKING ACTIVATED ⚡

🌳 Root: Main Analysis Point
  ├─ 🌿 Branch: Key Aspect 1
  │  ├─ 🍃 Leaf: Important Detail 1.1
  │  ├─ 🍃 Leaf: Important Detail 1.2
  │  └─ 🍃 Leaf: Important Detail 1.3
  │
  ├─ 🌿 Branch: Key Aspect 2
  │  ├─ 🍃 Leaf: Important Detail 2.1
  │  ├─ 🍃 Leaf: Important Detail 2.2
  │  └─ 🍃 Leaf: Important Detail 2.3
  │
  └─ 🌿 Branch: Key Aspect 3
     ├─ 🍃 Leaf: Important Detail 3.1
     ├─ 🍃 Leaf: Important Detail 3.2
     └─ 🍃 Leaf: Important Detail 3.3

⚡ SEQUENTIAL THINKING COMPLETE ⚡

🌲 THINK TOOL ACTIVATED 🌲

🔄 Multidirectional Analysis: Core Topic

🔍 Perspective: First Viewpoint
• Analysis point 1
• Analysis point 2
• Analysis point 3

🔍 Perspective: Second Viewpoint
• Analysis point 1
• Analysis point 2
• Analysis point 3

🔍 Perspective: Third Viewpoint
• Analysis point 1
• Analysis point 2
• Analysis point 3

🔍 Perspective: Fourth Viewpoint
• Analysis point 1
• Analysis point 2
• Analysis point 3

🌲 THINK TOOL COMPLETE 🌲

🧠 Cognitive Framework Analysis:
1. First cognitive insight about the analysis
2. Second cognitive insight about the approach
3. Third cognitive insight about the implications

Implementation Plan:
✓ Complete action item 1
✓ Complete action item 2
→ Next action item to consider
→ Future action item to plan
`;

/**
 * Standard trigger phrases
 */
export const STANDARD_TRIGGER_PHRASES = [
  'use think tools',
  'apply think tools',
  'utilize think tools',
  'run think tools',
  'think tools analyze'
];

/**
 * Think Tools configuration
 */
export const THINK_TOOLS_CONFIG = {
  EMOJIS: STANDARD_EMOJIS,
  FORMAT_TEMPLATE: STANDARD_FORMAT_TEMPLATE,
  TRIGGER_PHRASES: STANDARD_TRIGGER_PHRASES,
  DISCOVERY: {
    RECURSION_DEPTH: 5, // Maximum directory recursion depth
    FILE_EXTENSIONS: ['.ts', '.tsx', '.js', '.jsx', '.md', '.json'],
    INCLUDE_HIDDEN_FILES: false,
    EXCLUDE_DIRECTORIES: ['node_modules', '.git', 'dist', 'build']
  },
  TEMPLATE: {
    MAX_RESPONSE_LENGTH: 8000,
    INDENT_SIZE: 2,
    LINE_BREAK_AFTER: 100 // Characters before inserting line break
  },
  CACHING: {
    ENABLE_CACHE: true,
    CACHE_TTL: 1800000, // 30 minutes in milliseconds
    MAX_CACHE_ITEMS: 100
  },
  MIDDLEWARE: {
    TIMEOUT: 30000, // 30 seconds in milliseconds
    THROTTLE: {
      ENABLE: true,
      MAX_REQUESTS: 10,
      WINDOW: 60000 // 1 minute in milliseconds
    }
  }
};

export default THINK_TOOLS_CONFIG;
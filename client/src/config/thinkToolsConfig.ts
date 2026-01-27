/**
 * Think Tools Configuration
 * 
 * This module contains the configuration settings and constants for the
 * Think Tools integration, including formatting templates and emoji patterns.
 */

export const THINK_TOOLS_CONFIG = {
  // API endpoints
  API: {
    TRIGGER_COMMAND: '/api/mcp/trigger-command',
    SEQUENTIAL_THINKING: '/api/mcp/sequential-thinking',
    THINK_TOOL: '/api/mcp/think-tool'
  },
  
  // Trigger phrases for Think Tools commands
  TRIGGER_PHRASES: [
    'use think tool',
    'use think tools'
  ],
  
  // Emoji indicators
  EMOJIS: {
    ACTIVATION: '🔮',
    SEQUENTIAL: '⚡',
    THINK_TOOL: '🌲',
    COMPLETED: '✓',
    NEXT_STEP: '→',
    PROCESSING: '⏳'
  },
  
  // Standard section headers
  HEADERS: {
    ACTIVATION: 'THINK TOOLS ACTIVATED',
    SEQUENTIAL_START: 'SEQUENTIAL THINKING ACTIVATED',
    SEQUENTIAL_END: 'SEQUENTIAL THINKING COMPLETE',
    THINK_TOOL_START: 'THINK TOOL ACTIVATED',
    THINK_TOOL_END: 'THINK TOOL COMPLETE',
    IMPLEMENTATION: 'Implementation Strategy:'
  },
  
  // Response template
  TEMPLATE: {
    // Full template with all sections
    FULL: `
🔮 THINK TOOLS ACTIVATED 🔮

⚡ SEQUENTIAL THINKING ACTIVATED ⚡
{{sequential_thinking_content}}
⚡ SEQUENTIAL THINKING COMPLETE ⚡

🌲 THINK TOOL ACTIVATED 🌲
{{think_tool_content}}
🌲 THINK TOOL COMPLETE 🌲

Implementation Strategy:
{{implementation_content}}
    `.trim(),
    
    // Sequential thinking step template
    STEP: `
Step {{step_number}}: {{step_title}}
{{step_details}}
    `.trim(),
    
    // Implementation item template
    IMPLEMENTATION_ITEM: `{{icon}} {{item}}`,
    
    // Progress display template
    PROGRESS: `
🔮 THINK TOOLS IN PROGRESS 🔮

{{progress_steps}}
    `.trim()
  },
  
  // Display settings
  DISPLAY: {
    PROGRESS_UPDATE_INTERVAL: 200, // ms
    TYPING_SIMULATION_SPEED: 50,   // ms per character
    MAX_DETAILS_PER_STEP: 5,       // Maximum number of bullet points per step
    MAX_STEPS: 5                   // Maximum number of steps to display
  }
};

export default THINK_TOOLS_CONFIG;
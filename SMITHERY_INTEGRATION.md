# Smithery Integration for Norse Card Game

This document describes the integration of the Smithery AI Sequential Thinking capability with our Norse mythology-themed card game.

## Overview

The Smithery Sequential Thinking API provides step-by-step reasoning for complex problems, making it ideal for card game strategy analysis. We've integrated this capability with both client-side and server-side components to enhance the game experience.

## Components

### Server-Side Integration

1. **WebSocket Client (`server/smitheryWsService.ts`)**
   - Connects to Smithery's sequential thinking server using WebSockets
   - Implements proper JSON-RPC protocol for communication
   - Features automatic reconnection for reliability
   - Provides a robust mock fallback mode for development

2. **REST API Endpoints (`server/routes.ts`)**
   - `GET /api/smithery/status` - Check connection status
   - `POST /api/smithery/config` - Configure service settings (like enabling mock mode)
   - `GET /api/smithery/think` - Request sequential thinking analysis

3. **Command-Line Tool (`sequentialthink.js` and `think`)**
   - Provides terminal-based access to sequential thinking
   - Supports configuration of steps, temperature, and mock mode
   - Makes development and testing easier

### Mock Implementation

When the real Smithery API isn't available or during development, a sophisticated mock implementation provides:

1. **Context-Aware Reasoning**
   - Norse mythology-themed content specific to card games
   - Step-by-step analysis similar to real AI reasoning

2. **Specialized Thought Patterns**
   - Different thought patterns for strategy questions, card analysis, and gameplay questions
   - Custom titles for each reasoning step based on the query type

3. **Contextual Conclusions**
   - Conclusions tailored to the type of question being asked
   - Maintains the Norse mythology theme throughout

## Usage Examples

### Command-Line Usage

```bash
# Basic usage
./think "What's the best strategy for building a Thor-focused deck?"

# Use mock mode explicitly
./think --mock=true "How effective is Mjölnir as an equipment card?"

# Configure number of steps and temperature
./think --steps=7 --temp=0.8 "What counters are effective against Loki decks?"
```

### API Usage

```javascript
// Check status
fetch('/api/smithery/status')
  .then(response => response.json())
  .then(data => console.log(data));

// Configure mock mode
fetch('/api/smithery/config', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ useMockFallback: true })
})
  .then(response => response.json())
  .then(data => console.log(data));

// Request sequential thinking
fetch(`/api/smithery/think?prompt=${encodeURIComponent('What is the best counter to Thor decks?')}`)
  .then(response => response.text())
  .then(result => console.log(result));
```

## Current Status

- The mock implementation is fully functional and provides realistic Norse mythology-themed analyses
- The Smithery API connection is currently experiencing issues and returns internal server errors
- We've determined the most likely cause is an invalid or expired API key
- Development can continue using the mock fallback mode until a new API key is provided
- All client interfaces work seamlessly with either the real or mock implementation

## Using the Mock Implementation

To ensure development continues smoothly, we've set the default to use the mock fallback mode:

1. **In Code**: The `USE_MOCK_FALLBACK` flag is set to `true` in `smitheryWsService.ts`
2. **Via API**: You can also configure mock mode through the API:
   ```
   POST /api/smithery/config
   { "useMockFallback": true }
   ```
3. **Command Line**: Use the `--mock=true` flag with the `think` command:
   ```bash
   ./think --mock=true "What's the best counter to Thor decks?"
   ```

The mock implementation provides context-aware responses with:
- Norse mythology-themed content
- Different reasoning patterns based on question type (strategy, card analysis, gameplay)
- Specialized thought titles and contextual conclusions

## Next Steps

1. Obtain a new valid API key with sequential thinking permissions
2. Confirm the correct API endpoint URL with Smithery documentation
3. Test the connection with the new credentials
4. Expand the mock implementation with more specialized card knowledge
5. Create a dedicated UI component for displaying sequential thinking results
6. Integrate sequential thinking more deeply with gameplay mechanics
/**
 * Smithery WebSocket Service
 * 
 * This implementation uses WebSockets to connect to the Smithery MCP server
 * which is the recommended approach for using their sequential thinking capability.
 * 
 * It also includes an enhanced fallback to our own Norse-specific advanced implementation
 * when the real service is unavailable.
 */

import WebSocket from 'ws';
import { SmitheryAdvancedService } from './smitheryAdvancedService';

// For Node.js environment, we need to provide WebSocket
// @ts-ignore - Using global WebSocket assignment for compatibility
global.WebSocket = WebSocket;

// Get the API key from environment variables
const API_KEY = process.env.SMITHERY_API_KEY;

// Configuration 
let USE_MOCK_FALLBACK = true;  // Use mock service if real connection fails
const MAX_CONNECTION_IDLE_TIME = 60000;  // 1 minute

// Status tracking
let client: any = null;
let connected = false;
let callId = 0;
let lastActivityTime = 0;

// Map to track ongoing calls
const pendingCalls = new Map();

// Reconnection settings
let reconnectAttempts = 0;
const maxReconnectAttempts = 5;
const reconnectDelay = 3000; // 3 seconds
let reconnectTimer: NodeJS.Timeout | null = null;

/**
 * Create a new WebSocket connection
 */
function createWebSocketConnection() {
  console.log('Smithery WebSocket Service: Creating connection...');
  
  if (!API_KEY) {
    console.error('Smithery API key not found. Cannot connect.');
    return;
  }
  
  try {
    // Log the connection attempt for debugging (without exposing the full API key)
    const apiKeyPrefix = API_KEY.substring(0, 4);
    const apiKeySuffix = API_KEY.substring(API_KEY.length - 4);
    console.log(`Smithery WebSocket Service: Connecting with API key ${apiKeyPrefix}...${apiKeySuffix}`);
    
    // Use the correct MCP protocol format based on the GitHub repository
    // https://github.com/modelcontextprotocol/servers/tree/main/src/sequentialthinking
    const ws = new WebSocket(`wss://server.smithery.ai/v1?api_key=${API_KEY}`);
    
    // Set up message handling
    ws.on('open', () => {
      console.log('Smithery WebSocket Service: Connected successfully');
      connected = true;
      client = ws;
      reconnectAttempts = 0; // Reset reconnect counter on successful connection
      
      // Send a proper JSON-RPC format hello message per MCP protocol
      try {
        // Follow the JSON-RPC/MCP protocol format from GitHub repo
        ws.send(JSON.stringify({
          jsonrpc: "2.0",
          method: "initialize",
          id: "init-1",
          params: {
            capabilities: {
              sequentialThinking: true
            }
          }
        }));
        console.log('Smithery WebSocket Service: Sent hello message');
      } catch (error) {
        console.error('Smithery WebSocket Service: Failed to send hello message', error);
      }
    });
    
    ws.on('message', (data: any) => {
      try {
        // Log raw message for debugging
        const rawMessage = data.toString();
        console.log(`Smithery WebSocket Service: Received message: ${rawMessage.substring(0, 100)}${rawMessage.length > 100 ? '...' : ''}`);
        
        const message = JSON.parse(rawMessage);
        
        // Handle JSON-RPC response according to MCP protocol
        if (message.jsonrpc === '2.0' && message.id && pendingCalls.has(message.id)) {
          const { resolve, reject } = pendingCalls.get(message.id);
          
          if (message.error) {
            console.error(`Smithery WebSocket Service: Error in response for call ${message.id}:`, message.error);
            reject(new Error(message.error.message || 'Unknown error'));
          } else {
            console.log(`Smithery WebSocket Service: Successful response for call ${message.id}`);
            resolve(message.result);
          }
          
          pendingCalls.delete(message.id);
        }
        // Handle initialize response
        else if (message.jsonrpc === '2.0' && message.method === 'initialize/result') {
          console.log('Smithery WebSocket Service: Received initialization confirmation');
        }
      } catch (error) {
        console.error('Smithery WebSocket Service: Failed to process WebSocket message:', error);
      }
    });
    
    ws.on('error', (error) => {
      console.error('Smithery WebSocket Service: Connection error', error);
      connected = false;
    });
    
    ws.on('close', (code, reason) => {
      console.log(`Smithery WebSocket Service: Connection closed with code ${code} and reason: ${reason || 'No reason provided'}`);
      connected = false;
      client = null;
      
      // Attempt to reconnect if not at max attempts
      if (reconnectAttempts < maxReconnectAttempts) {
        reconnectAttempts++;
        console.log(`Smithery WebSocket Service: Attempting to reconnect (${reconnectAttempts}/${maxReconnectAttempts}) in ${reconnectDelay / 1000} seconds...`);
        
        if (reconnectTimer) {
          clearTimeout(reconnectTimer);
        }
        
        reconnectTimer = setTimeout(() => {
          createWebSocketConnection();
        }, reconnectDelay);
      } else {
        console.error('Smithery WebSocket Service: Max reconnection attempts reached. Giving up.');
      }
    });
    
    return ws;
  } catch (error) {
    console.error('Smithery WebSocket Service: Failed to create connection', error);
    return null;
  }
}

/**
 * Initialize the connection to the Smithery WebSocket server
 * 
 * This version no longer attempts to connect to the external service
 * and instead just uses our advanced implementation directly.
 */
export async function initialize() {
  console.log('Smithery Service: Using local advanced Norse sequential thinking implementation only');
  
  // Clear any existing reconnect timer if it exists
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  
  // Don't attempt any connection - we're using our own implementation
  connected = false;
  client = null;
}

/**
 * Check if the service is connected
 * 
 * This version always returns true since we're always using our advanced
 * Norse implementation and don't need an external connection.
 */
export function isConnected() {
  // Always return true since we're using our advanced Norse implementation
  return true;
}

/**
 * Make a call to the MCP server
 */
async function call(tool: string, params: any) {
  if (!connected || !client) {
    throw new Error('Not connected to Smithery WebSocket server');
  }

  return new Promise((resolve, reject) => {
    try {
      // Generate a unique ID for this call
      const id = `call-${Date.now()}-${callId++}`;
      
      // Store the promise callbacks
      pendingCalls.set(id, { resolve, reject });
      
      // Use proper JSON-RPC format based on GitHub repo
      // https://github.com/modelcontextprotocol/servers/tree/main/src/sequentialthinking
      const message = {
        jsonrpc: "2.0",
        method: "sequential_thinking",
        id,
        params: {
          prompt: params.prompt,
          max_steps: params.max_steps || 5,
          temperature: params.temperature || 0.7
        }
      };
      
      client.send(JSON.stringify(message));
      
      // Set a timeout to prevent hanging promises
      setTimeout(() => {
        if (pendingCalls.has(id)) {
          pendingCalls.delete(id);
          reject(new Error('Call timed out after 30 seconds'));
        }
      }, 30000);
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * List available tools
 */
export async function listTools() {
  // For the MCP server, we know it has sequential_thinking
  return [
    {
      name: 'sequential_thinking',
      description: 'Breaks down complex problems into step-by-step reasoning.'
    }
  ];
}

/**
 * Generate mock reasoning text specifically for Norse mythology card game topics
 * Enhanced with card-specific knowledge and contextual awareness
 */
function generateMockReasoning(prompt: string, stepIndex: number): string {
  // Detect specific cards or archetypes mentioned in the prompt
  const promptLower = prompt.toLowerCase();
  
  // Card-specific reasoning patterns
  const thorMentioned = promptLower.includes('thor');
  const odinMentioned = promptLower.includes('odin');
  const lokiMentioned = promptLower.includes('loki');
  const ragnarokMentioned = promptLower.includes('ragnarök') || promptLower.includes('ragnarok');
  const giantsMentioned = promptLower.includes('giant') || promptLower.includes('jötnar') || promptLower.includes('jotnar');
  const aesirMentioned = promptLower.includes('aesir') || promptLower.includes('æsir');
  const vanirMentioned = promptLower.includes('vanir');
  const dwarvesMentioned = promptLower.includes('dwarf') || promptLower.includes('dwarves');
  const yggdrasilMentioned = promptLower.includes('yggdrasil');
  const valkyrieMentioned = promptLower.includes('valkyrie');
  
  // Generate specialized reasoning based on mentioned cards/concepts
  if (thorMentioned) {
    const thorReasoning = [
      "Thor, the God of Thunder, typically functions as a high-cost powerful minion with direct damage abilities. His cards often have Battlecry or ongoing effects that deal damage to enemy minions or the opponent's hero. When building around Thor, focus on cards that benefit from or enhance damage-based effects.",
      "Thor's signature weapon Mjölnir can be implemented as an equipment card that buffs attack and gives Thor-themed cards additional effects. Consider cards that can tutor equipment from your deck to ensure consistent access to these powerful tools.",
      "Thor cards synergize well with storm and lightning-themed spells, which can provide direct damage or area-of-effect clearing. A well-built Thor deck maintains board control through a combination of these spells and Thor's minion presence.",
      "Thor's rivalry with the Jötnar (Giants) is a key element of Norse mythology. Cards representing this conflict might have special interactions, such as Thor cards dealing additional damage to Giant-type minions or having cost reductions when facing Giant decks."
    ];
    return thorReasoning[stepIndex % thorReasoning.length];
  } 
  
  if (odinMentioned) {
    const odinReasoning = [
      "Odin, the All-Father, typically functions as a control-oriented legendary card with knowledge and wisdom abilities. His effects often involve card draw, information gathering, or resource generation. When building an Odin-centered deck, prioritize value generation and late-game control tools.",
      "Odin's ravens, Huginn and Muninn, can be implemented as low-cost minions that provide card draw or information effects. These cards work well in a deck that aims to maintain card advantage throughout the game.",
      "Odin sacrificed his eye at Mímir's well for wisdom, which can be represented through cards with powerful effects that require sacrificing resources. Consider including cards that benefit from or mitigate these sacrifice costs.",
      "Odin's connection to runic magic and prophecy suggests synergy with cards that manipulate the future of the game, such as deck ordering or delayed effects. A well-crafted Odin deck uses knowledge of upcoming draws to make optimal decisions."
    ];
    return odinReasoning[stepIndex % odinReasoning.length];
  }
  
  if (lokiMentioned) {
    const lokiReasoning = [
      "Loki, the Trickster God, typically functions as a disruptive card with transformation or deception abilities. His effects often involve changing card identity, redirecting damage, or creating chaos on the board. When building a Loki-centered deck, focus on adaptability and unpredictable play patterns.",
      "Loki's shapeshifting abilities can be implemented through transformation effects that turn minions into different forms. These cards are valuable for adapting to different matchups and situations.",
      "Loki's role in causing chaos can be represented through randomization effects that introduce unpredictability. While initially seeming risky, a well-designed Loki deck includes ways to benefit from this chaos more than your opponent.",
      "Loki's complex relationship with both Aesir and Giants suggests potential for a hybrid deck that incorporates elements from multiple archetypes. This flexibility allows a Loki deck to adjust its strategy based on the opponent's approach."
    ];
    return lokiReasoning[stepIndex % lokiReasoning.length];
  }
  
  if (ragnarokMentioned) {
    const ragnarokReasoning = [
      "Ragnarök, the Norse apocalypse, would be represented as a high-cost, game-changing card with devastating effects. It might clear all minions, reset resources, or fundamentally change the game state. A deck built around Ragnarök needs to balance survival until it can be played with maximum impact afterward.",
      "Cards representing the events leading to Ragnarök might have countdown mechanics that build tension throughout the game. This creates interesting decision points about whether to accelerate or delay these effects based on the game state.",
      "The concept of rebirth after Ragnarök could be implemented through resurrection mechanics or effects that become powerful after a board clear. Including cards that benefit from a reset game state is crucial in a Ragnarök-centered strategy.",
      "Since Ragnarök represents an end-game win condition, the supporting deck should contain tools for stalling and survival. Healing, armor, and defensive minions become essential to reach the point where Ragnarök can be played effectively."
    ];
    return ragnarokReasoning[stepIndex % ragnarokReasoning.length];
  }
  
  if (giantsMentioned) {
    const giantsReasoning = [
      "The Jötnar (Giants) in Norse mythology represent primal forces and elements, suggesting a tribal deck focused on high-stat minions with elemental effects. A Giants deck typically aims to overwhelm opponents with large threats while using elemental synergies.",
      "Frost Giants would have ice-based effects that slow or freeze opponents, Fire Giants would focus on direct damage, and Stone Giants would have high health and taunt abilities. A well-designed Giants deck might specialize in one type or balance multiple elements.",
      "Giants often have specific casting conditions in card games, becoming cheaper when certain criteria are met. This creates interesting deck-building constraints around maximizing these discount effects while maintaining a playable hand.",
      "The antagonistic relationship between Giants and the Aesir gods offers potential for tech cards that specifically counter god-based strategies. Including these situational cards can provide an edge in specific matchups."
    ];
    return giantsReasoning[stepIndex % giantsReasoning.length];
  }
  
  if (yggdrasilMentioned) {
    const yggdrasilReasoning = [
      "Yggdrasil, the World Tree connecting the Nine Realms, would likely be implemented as a legendary location or persistent effect card. It might provide ongoing benefits that increase over time, representing the tree's growth and connection to all realms.",
      "Cards representing the different realms connected by Yggdrasil could have synergistic effects when multiple realms are represented on the board. This encourages a diverse deck-building approach rather than focusing on a single realm or tribe.",
      "The three roots of Yggdrasil extend to Urðarbrunnr (Well of Urd), Hvergelmir, and Mímisbrunnr, suggesting three distinct pathways for strategy development. A well-designed Yggdrasil deck might focus on one path or balance elements from all three.",
      "Niðhöggr, the dragon that gnaws at Yggdrasil's roots, represents a natural counter to Yggdrasil-based strategies. Preparing for these counter cards is essential for any Yggdrasil-centered deck to remain resilient."
    ];
    return yggdrasilReasoning[stepIndex % yggdrasilReasoning.length];
  }
  
  // General Norse mythology reasoning if no specific entities are mentioned
  const generalReasoning = [
    "First, we need to understand the core elements of Norse mythology and how they relate to card mechanics. The pantheon includes powerful figures like Odin, Thor, and Loki, each with distinct abilities that can form the foundation of different deck archetypes.",
    "When building a Norse-themed deck, we must consider the synergies between different card types. Cards representing Aesir gods might have powerful individual effects, while Vanir-themed cards could focus on resource generation and sustainability.",
    "The concept of Ragnarök in Norse mythology provides opportunities for powerful late-game strategies. Cards that build up power over time before unleashing devastating effects align with this mythological concept.",
    "Looking at the statistical probability of drawing key cards is essential. A deck built around Yggdrasil or the Nine Realms would need to balance powerful realm-specific cards with cards that help you search for and play them efficiently.",
    "The balance between aggressive and defensive strategies is crucial. While Einherjar warriors from Valhalla might provide strong aggressive options, defensive cards based on realm protectors like Heimdall offer strategic alternatives.",
    "Norse mythology features numerous magical artifacts like Mjölnir and Gungnir that can serve as powerful equipment cards. A deck focused on equipment synergies could leverage these iconic items.",
    "The Giant races (Jötnar) from Norse mythology represent natural forces and could be implemented as cards with elemental effects or abilities that counter specific strategies.",
    "The dwarves of Svartalfheim are master craftsmen who forged many magical items in Norse mythology. A dwarf-themed deck might focus on equipment generation and enhancement, with gradually building value throughout the game.",
    "Valkyries who choose the slain in battle could be represented as cards that interact with the discard pile or gain power when friendly or enemy minions are defeated. This creates interesting board control dynamics.",
    "The concept of fate (wyrd) is central to Norse mythology. This could be implemented through cards that set up inevitable future effects or interact with the draw and discard piles to represent the threads of destiny."
  ];
  
  // Handle array index wrapping for general reasoning
  const index = stepIndex % generalReasoning.length;
  return generalReasoning[index];
}

/**
 * Generate mock conclusion text specific to Norse mythology card game topics
 * Enhanced with contextual awareness based on the prompt
 */
function generateMockConclusion(prompt: string): string {
  const promptLower = prompt.toLowerCase();
  
  // Card-specific conclusion patterns for more targeted responses
  const thorMentioned = promptLower.includes('thor');
  const odinMentioned = promptLower.includes('odin');
  const lokiMentioned = promptLower.includes('loki');
  const ragnarokMentioned = promptLower.includes('ragnarök') || promptLower.includes('ragnarok');
  const giantsMentioned = promptLower.includes('giant') || promptLower.includes('jötnar') || promptLower.includes('jotnar');
  const aesirMentioned = promptLower.includes('aesir') || promptLower.includes('æsir');
  const vanirMentioned = promptLower.includes('vanir');
  const dwarvesMentioned = promptLower.includes('dwarf') || promptLower.includes('dwarves');
  const yggdrasilMentioned = promptLower.includes('yggdrasil');
  const valkyrieMentioned = promptLower.includes('valkyrie');
  const counterMentioned = promptLower.includes('counter') || promptLower.includes('against') || promptLower.includes('versus') || promptLower.includes('vs');
  
  // Specialized conclusions based on mentioned concepts
  if (thorMentioned && counterMentioned) {
    return "countering Thor-based strategies requires prioritizing removal spells and effects that neutralize high-attack minions before they can generate value. Giants, particularly Frost Giants with their slowing effects, and Loki-based disruption cards are natural counters to Thor's direct approach.";
  } else if (thorMentioned) {
    return "a Thor-centered deck performs best when built around damage synergies, equipment interactions, and board control elements. Mjölnir and other storm-related cards provide the burst potential, while supporting cards like Valkyries or Warriors from Valhalla maintain board presence until Thor can deliver the finishing blow.";
  }
  
  if (odinMentioned && counterMentioned) {
    return "defeating Odin-based control strategies requires aggressive play that resolves threats before their value-generation engines come online. Cards that disrupt hand resources or prevent card draw can significantly weaken an Odin deck's core strength.";
  } else if (odinMentioned) {
    return "an Odin-centered deck excels through knowledge, wisdom, and resource accumulation. By leveraging ravens for information, runes for versatility, and sacrifice mechanics for power spikes, the deck can outlast opponents through superior card quality and strategic adaptability.";
  }
  
  if (lokiMentioned && counterMentioned) {
    return "overcoming Loki's trickery requires decks with consistent, straightforward game plans that are less affected by transformation and randomization effects. Cards that provide stability and predictable outcomes serve as effective counters to Loki's chaos-inducing strategies.";
  } else if (lokiMentioned) {
    return "a Loki-themed deck thrives on unpredictability and adaptive play. By embracing transformation effects, redirection mechanics, and strategic flexibility, it can continuously surprise opponents and capitalize on the resulting confusion to secure victory through unconventional means.";
  }
  
  if (ragnarokMentioned && counterMentioned) {
    return "preventing Ragnarök strategies from succeeding requires applying consistent pressure that forces defensive play rather than allowing setup time. Alternatively, cards that can survive or benefit from board clears can make your deck resilient against the apocalyptic reset that Ragnarök represents.";
  } else if (ragnarokMentioned) {
    return "building around Ragnarök involves carefully balancing survival tools with post-apocalyptic power. The ideal deck uses stalling mechanics, healing, and armor to reach the late game, then leverages the reset state to deploy powerful 'rebirth' effects that capitalize on the newly cleared board.";
  }
  
  if (giantsMentioned && counterMentioned) {
    return "countering Giant-based strategies requires efficient removal for large minions and tools to neutralize their elemental effects. Thor-themed cards with their anti-Giant synergies, along with cards that can outvalue the typically straightforward Giant game plan, can effectively counter these decks.";
  } else if (giantsMentioned) {
    return "a Giants-focused deck succeeds by leveraging elemental synergies and cost-reduction mechanics to deploy powerful threats earlier than expected. Specializing in a specific Giant type (Frost, Fire, or Stone) provides more consistent synergies, while a mixed approach offers greater flexibility against different matchups.";
  }
  
  if (yggdrasilMentioned && counterMentioned) {
    return "disrupting Yggdrasil-based strategies requires cards that target ongoing effects or location cards. Niðhöggr-themed cards that specifically counter World Tree synergies can be particularly effective, as can aggressive strategies that win before the accumulated value of Yggdrasil becomes overwhelming.";
  } else if (yggdrasilMentioned) {
    return "a deck centered around Yggdrasil thrives on the connections between realms, generating increasing value over time. By including cards from multiple Norse realms that synergize with each other, and focusing on one of the three root paths (wisdom, fate, or elemental power), the deck can create powerful combinations that few opponents can match.";
  }
  
  // General conclusions for broader topics
  if (counterMentioned) {
    return "effective counter-strategies in Norse mythology-themed card games require understanding the underlying mythological relationships. Just as Thor counters Giants, Loki disrupts order, and Heimdall watches for threats, your deck should incorporate elements that specifically target your opponent's core strategy while maintaining its own cohesive plan.";
  }
  
  // Default general conclusions if no specific patterns are detected
  const generalConclusions = [
    "the optimal Norse mythology-themed deck strategy requires balancing powerful god cards with supporting mythological entities, while maintaining a clear win condition based on either overwhelming force (like Thor) or clever trickery (like Loki).",
    "success with a Norse-themed deck depends on understanding the cyclical nature of Norse cosmology, with cards that can transform disadvantageous board states into advantages, mirroring how Ragnarök leads to rebirth in the mythology.",
    "the most effective approach involves categorizing your cards by their associated realm (Asgard, Midgard, etc.) and building synergies that reflect the relationships between these realms in Norse cosmology.",
    "a balanced deck that incorporates elements from different aspects of Norse mythology—gods, giants, elves, dwarves, and magical artifacts—will provide the tactical flexibility needed to adapt to various opponent strategies.",
    "understanding the tension between order (represented by Aesir) and chaos (represented by Jötnar) in Norse mythology can inform how you structure your deck to create powerful card interactions while maintaining strategic coherence.",
    "effective deck construction mirrors the layered structure of Norse cosmology, with core win-condition cards representing major deities, supporting cards acting as their allies or artifacts, and utility cards reflecting the more mundane aspects of the mythology.",
    "the most resilient decks draw inspiration from the adaptability shown by figures in Norse mythology. Just as Odin gained wisdom through sacrifice and Thor used different tactics against various foes, your deck should be able to pivot between strategies based on the opponent's approach.",
    "card synergies that reflect authentic mythological relationships tend to create more coherent gameplay experiences. By aligning your strategy with these established connections, you create intuitive interactions that are both powerful and thematically resonant."
  ];
  
  const randomIndex = Math.floor(Math.random() * generalConclusions.length);
  return generalConclusions[randomIndex];
}

/**
 * Generate a sequential thinking response
 * This uses our enhanced Norse-themed implementation for specialized card game analysis
 * 
 * The Norse-specific advanced sequential thinking model has specialized knowledge of:
 * - Card game mechanics and strategy
 * - Norse mythology entities, realms, and relationships
 * - Specialized reasoning patterns for different question types
 */
async function mockSequentialThinking(
  prompt: string,
  options: {
    maxSteps?: number;
    temperature?: number;
  } = {}
): Promise<any> {
  console.log('Smithery WebSocket Service: Using advanced Norse-specific sequential thinking');
  
  try {
    // Always use our advanced implementation with specialized knowledge
    return await SmitheryAdvancedService.processWithSequentialThinking(prompt, options);
  } catch (error: any) {
    console.error('Smithery WebSocket Service: Error in advanced implementation', error);
    throw new Error('Advanced Norse sequential thinking service unavailable: ' + (error?.message || 'Unknown error'));
  }
}

/**
 * Process a prompt with sequential thinking
 * 
 * This version always uses our advanced implementation and never attempts to use
 * the external Smithery API service, as requested by the user.
 */
export async function sequentialThinking(
  prompt: string,
  options: {
    maxSteps?: number;
    temperature?: number;
    stream?: boolean;
  } = {}
) {
  // Update activity timestamp
  lastActivityTime = Date.now();
  
  // Always use our advanced implementation without trying the external service
  console.log('Smithery Service: Using advanced Norse sequential thinking implementation');
  return mockSequentialThinking(prompt, options);
}

/**
 * Get whether mock fallback is enabled
 */
export function getUseMockFallback() {
  return USE_MOCK_FALLBACK;
}

/**
 * Set whether mock fallback is enabled
 */
export function setUseMockFallback(value: boolean) {
  const oldValue = USE_MOCK_FALLBACK;
  USE_MOCK_FALLBACK = value;
  console.log(`Smithery WebSocket Service: Mock fallback ${value ? 'enabled' : 'disabled'} (was ${oldValue ? 'enabled' : 'disabled'})`);
  return USE_MOCK_FALLBACK;
}

/**
 * Get whether advanced mock implementation is enabled
 * Always returns true since we've simplified to only offer the advanced implementation
 */
export function getUseAdvancedMock() {
  return true;
}

/**
 * Set whether advanced mock implementation is enabled
 * This is kept for API compatibility but no longer changes behavior
 */
export function setUseAdvancedMock(value: boolean) {
  console.log(`Smithery WebSocket Service: Advanced mock implementation is always enabled`);
  return true;
}

// Export the service as an object
export const SmitheryMcpService = {
  initialize,
  isConnected,
  listTools,
  sequentialThinking,
  getUseMockFallback,
  setUseMockFallback,
  getUseAdvancedMock,
  setUseAdvancedMock
};
/**
 * Enhanced Norse-themed Sequential Thinking Implementation
 * 
 * This specialized implementation provides advanced reasoning capabilities
 * specifically tailored for Norse mythology and card game strategy analysis.
 * It offers deeper contextual awareness, specialized reasoning patterns, and
 * higher quality dynamic responses.
 * 
 * Improvements in this version:
 * 1. Dynamic Response Generation - combines sentence fragments for more unique responses
 * 2. Improved Context Awareness - better detection of question intent and context
 * 3. Session Memory - tracks previous questions to provide contextual continuity
 */

// Define types for session memory and sequential thinking outputs
type SessionMemory = {
  previousQuestions: string[];
  previousEntities: string[];
  previousMechanics: string[];
  timestamps: number[];
  sessionId: string;
};

type SequentialThinkingStep = {
  thought: string;
  reasoning: string;
};

type SequentialThinkingResult = {
  steps: SequentialThinkingStep[];
  conclusion: string;
};

type QuestionIntent = {
  primary: string;  // Primary intent: strategy, analysis, counterplay, etc.
  subject: string;  // Main subject of the question
  context: string[]; // Contextual elements
  complexity: number; // 1-5 scale of question complexity
};

// Global session memory store
const sessionStore: Map<string, SessionMemory> = new Map();

// Create a new session or retrieve existing one
function getOrCreateSession(sessionId?: string): SessionMemory {
  // Generate a random ID if none provided
  const id = sessionId || `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  
  if (!sessionStore.has(id)) {
    sessionStore.set(id, {
      previousQuestions: [],
      previousEntities: [],
      previousMechanics: [],
      timestamps: [],
      sessionId: id
    });
  }
  
  return sessionStore.get(id)!;
}

// Clean up old sessions (older than 30 minutes)
function cleanupSessions() {
  const now = Date.now();
  const thirtyMinutesInMs = 30 * 60 * 1000;
  
  sessionStore.forEach((session, id) => {
    const lastActivity = session.timestamps[session.timestamps.length - 1] || 0;
    if (now - lastActivity > thirtyMinutesInMs) {
      sessionStore.delete(id);
    }
  });
}

// Norse mythology entities and concepts for context-aware reasoning
const norseEntities = [
  { name: 'Thor', attributes: ['strength', 'thunder', 'lightning', 'warrior', 'hammer', 'Mjölnir'] },
  { name: 'Odin', attributes: ['wisdom', 'knowledge', 'war', 'death', 'runes', 'magic', 'ravens', 'Huginn', 'Muninn'] },
  { name: 'Loki', attributes: ['trickery', 'chaos', 'fire', 'shape-shifting', 'cunning', 'deceit'] },
  { name: 'Freya', attributes: ['love', 'beauty', 'fertility', 'war', 'gold', 'seiðr', 'magic'] },
  { name: 'Heimdall', attributes: ['watchman', 'guardian', 'Bifrost', 'foresight', 'keen senses'] },
  { name: 'Tyr', attributes: ['justice', 'law', 'honor', 'war', 'courage', 'sacrifice'] },
  { name: 'Frigg', attributes: ['marriage', 'motherhood', 'household', 'foresight'] },
  { name: 'Baldr', attributes: ['beauty', 'light', 'purity', 'peace', 'resurrection'] },
  { name: 'Hel', attributes: ['underworld', 'death', 'grave', 'afterlife', 'darkness'] },
  { name: 'Njord', attributes: ['sea', 'wind', 'wealth', 'ships', 'fishing'] },
  { name: 'Ullr', attributes: ['winter', 'hunting', 'archery', 'skiing', 'shields'] },
  { name: 'Bragi', attributes: ['poetry', 'music', 'eloquence', 'inspiration'] },
  { name: 'Idunn', attributes: ['youth', 'spring', 'rejuvenation', 'apples'] },
  { name: 'Skadi', attributes: ['winter', 'mountains', 'hunting', 'skiing', 'vengeance'] },
  { name: 'Forseti', attributes: ['justice', 'peace', 'mediation', 'truth'] },
  { name: 'Freyja', attributes: ['love', 'beauty', 'fertility', 'seiðr', 'magic', 'war', 'death'] },
  { name: 'Sif', attributes: ['harvest', 'fertility', 'family', 'golden hair'] },
];

// Card game mechanics and concepts for strategic reasoning
const cardMechanics = [
  { name: 'Battlecry', description: 'Effect that triggers when the card is played from hand' },
  { name: 'Deathrattle', description: 'Effect that triggers when the card is destroyed' },
  { name: 'Taunt', description: 'Opponents must attack this minion before others' },
  { name: 'Charge', description: 'Can attack immediately when played' },
  { name: 'Rush', description: 'Can attack minions immediately when played' },
  { name: 'Divine Shield', description: 'Absorbs the first damage taken' },
  { name: 'Windfury', description: 'Can attack twice each turn' },
  { name: 'Lifesteal', description: 'Damage dealt heals your hero' },
  { name: 'Poisonous', description: 'Destroys any minion damaged by this' },
  { name: 'Overkill', description: 'Triggers when this deals more damage than needed to kill a target' },
  { name: 'Spellpower', description: 'Increases the power of your spells' },
  { name: 'Discover', description: 'Choose one of three cards to add to your hand' },
  { name: 'Combo', description: 'Enhanced effect if you played another card earlier this turn' },
  { name: 'Ragnarok', description: 'Special effect that triggers at the end of the world' },
  { name: 'Prophecy', description: 'Effect that triggers when drawn during your opponent\'s turn' },
  { name: 'Rune', description: 'Passive effect that activates when specific conditions are met' },
  { name: 'Berserker', description: 'Gains power when damaged but not destroyed' },
  { name: 'Valkyrie', description: 'Special effects related to minions that died this game' },
  { name: 'Fatebinding', description: 'Links the fate of cards or characters together' },
  { name: 'Mjölnir', description: 'Can return to hand after being used' },
];

// Common card game strategies for the Norse-themed card game
const gameStrategies = [
  { name: 'Aggro Thor', description: 'Aggressive strategy using Thor\'s power to deal direct damage' },
  { name: 'Control Odin', description: 'Control the board while gathering knowledge and power' },
  { name: 'Combo Loki', description: 'Set up deceptive combinations for massive damage' },
  { name: 'Midrange Heimdall', description: 'Balanced approach with strong mid-game presence' },
  { name: 'Fatigue Hel', description: 'Exhaust opponent\'s resources and win in the late game' },
  { name: 'Tempo Tyr', description: 'Maintain board control through efficient trades and resource use' },
  { name: 'Ramp Freya', description: 'Accelerate mana/resource gain to play powerful cards early' },
  { name: 'Token Freyja', description: 'Summon many small minions and buff them' },
  { name: 'Miracle Bragi', description: 'Draw many cards in a single turn to enable powerful combos' },
  { name: 'Highlander Heimdall', description: 'No duplicate cards to enable powerful effects' },
  { name: 'Sacrifice Tyr', description: 'Sacrifice your own resources for greater power' },
  { name: 'Ragnarok', description: 'Survival strategy that aims to trigger the end of the world effect' },
  { name: 'Berserker', description: 'Allow your minions to take damage to increase their power' },
];

/**
 * Analyze the question intent more thoroughly than simple keyword matching
 * This provides a richer understanding of what the user is asking about
 */
function analyzeQuestionIntent(prompt: string, session?: SessionMemory): QuestionIntent {
  const promptLower = prompt.toLowerCase();
  
  // Advanced intent detection - analyze sentence structure and key phrases
  const strategyIndicators = ['strategy', 'approach', 'build', 'play', 'deck', 'how should i', 'what is the best way', 'optimal'];
  const analysisIndicators = ['analyze', 'evaluation', 'strength', 'weakness', 'value', 'worth', 'good', 'bad', 'compare'];
  const counterplayIndicators = ['counter', 'against', 'beat', 'defeat', 'struggle with', 'having trouble with', 'how do i deal with'];
  const metaIndicators = ['meta', 'current', 'popular', 'trend', 'competitive', 'top deck', 'strongest'];
  
  // Count occurrences of each type of indicator
  const strategyScore = strategyIndicators.filter(term => promptLower.includes(term)).length;
  const analysisScore = analysisIndicators.filter(term => promptLower.includes(term)).length;
  const counterplayScore = counterplayIndicators.filter(term => promptLower.includes(term)).length;
  const metaScore = metaIndicators.filter(term => promptLower.includes(term)).length;
  
  // Determine primary intent based on highest score
  const scores = [
    { type: 'strategy', score: strategyScore },
    { type: 'analysis', score: analysisScore },
    { type: 'counterplay', score: counterplayScore },
    { type: 'meta', score: metaScore }
  ];
  
  scores.sort((a, b) => b.score - a.score);
  const primaryIntent = scores[0].score > 0 ? scores[0].type : 'general';
  
  // Extract subject - what entity or concept is central to the question
  let subject = 'general';
  
  // Pre-check for lightning/thunder references for Thor inference
  const hasLightningReference = promptLower.includes('lightning') || promptLower.includes('thunder');
  const hasExplicitThorMention = promptLower.includes('thor');
  
  // Check for Norse entities first
  let entityMatches = norseEntities.filter(entity => 
    promptLower.includes(entity.name.toLowerCase())
  );
  
  // Special handling for Thor via lightning/thunder references
  if (hasLightningReference && !hasExplicitThorMention && entityMatches.length === 0) {
    console.log("Detected lightning/thunder references without explicit Thor mention");
    
    // Lightning/thunder is mentioned, infer Thor
    const thorEntity = norseEntities.find(entity => entity.name === 'Thor');
    if (thorEntity) {
      // Use Thor's attributes to verify the connection
      if (thorEntity.attributes.some(attr => 
          attr === 'lightning' || attr === 'thunder')) {
        console.log("Inferring Thor as the subject based on lightning/thunder associations");
        subject = 'Thor';
        
        // Add Thor to the detected entities manually
        entityMatches = [{ name: 'Thor', attributes: thorEntity.attributes }];
      }
    }
  }
  
  // Then check for mechanics
  const mechanicMatches = cardMechanics.filter(mechanic => 
    promptLower.includes(mechanic.name.toLowerCase())
  );
  
  // Then strategies
  const strategyMatches = gameStrategies.filter(strategy => 
    promptLower.includes(strategy.name.toLowerCase())
  );
  
  if (entityMatches.length > 0) {
    subject = entityMatches[0].name;
  } else if (mechanicMatches.length > 0) {
    subject = mechanicMatches[0].name;
  } else if (strategyMatches.length > 0) {
    subject = strategyMatches[0].name;
  }
  
  // Gather contextual elements - secondary entities, mechanics, etc.
  const context: string[] = [];
  
  // Add all matching entities except the primary subject
  entityMatches.forEach(entity => {
    if (entity.name !== subject) {
      context.push(entity.name);
    }
  });
  
  // Add matching mechanics
  mechanicMatches.forEach(mechanic => {
    if (mechanic.name !== subject) {
      context.push(mechanic.name);
    }
  });
  
  // Add matching strategies
  strategyMatches.forEach(strategy => {
    if (strategy.name !== subject) {
      context.push(strategy.name);
    }
  });
  
  // Estimate question complexity (1-5 scale)
  let complexity = 1;
  
  // More entities/mechanics/context = more complex
  complexity += Math.min(2, entityMatches.length + mechanicMatches.length + strategyMatches.length);
  
  // More words = potentially more complex
  const wordCount = prompt.split(/\s+/).length;
  if (wordCount > 30) complexity += 1;
  if (wordCount > 50) complexity += 1;
  
  // Questions with multiple intents are more complex
  const secondaryIntentScore = scores[1].score;
  if (secondaryIntentScore > 0) complexity += 1;
  
  // Cap complexity at 5
  complexity = Math.min(5, complexity);
  
  // Consider previous questions from the session if available
  if (session && session.previousQuestions.length > 0) {
    // If this is a follow-up question, it may be more complex
    const lastQuestion = session.previousQuestions[session.previousQuestions.length - 1];
    
    // Check if this question seems to reference the previous one
    const followUpIndicators = ['also', 'additionally', 'what about', 'how about', 'and', 'but', 'however', 'what are', 'how do'];
    const isLikelyFollowUp = followUpIndicators.some(indicator => promptLower.includes(indicator)) || 
                             (promptLower.length < 50 && entityMatches.length === 0 && mechanicMatches.length === 0);
    
    // Check for counter-specific follow-ups
    const isCounterQuestion = promptLower.includes('counter') || 
                              promptLower.includes('against') || 
                              promptLower.includes('beat') || 
                              promptLower.includes('defeat') ||
                              promptLower.includes('weakness');
    
    if (isLikelyFollowUp || isCounterQuestion) {
      console.log('Detected follow-up question. Incorporating previous context...');
      
      // Try to find previously discussed entities from the session
      if (session.previousEntities.length > 0) {
        const lastEntity = session.previousEntities[session.previousEntities.length - 1];
        console.log(`Found previous entity in session: ${lastEntity}`);
        
        // For questions about countering with no specific entity, use the previous entity
        if (isCounterQuestion && subject === 'general') {
          subject = lastEntity;
          console.log(`Using previous entity as subject for counter question: ${subject}`);
        }
        
        // Always add the previous entity to context
        if (!context.includes(lastEntity) && lastEntity !== subject) {
          context.push(lastEntity);
        }
      }
      
      // Also analyze the previous question for more context
      const previousIntent = analyzeQuestionIntent(lastQuestion);
      
      // If this is a short follow-up with no clear subject, use the previous subject
      if (previousIntent.subject && previousIntent.subject !== 'general' && subject === 'general') {
        subject = previousIntent.subject;
        console.log(`Using previous subject: ${subject}`);
      }
      
      // Add previous context elements 
      previousIntent.context.forEach(item => {
        if (!context.includes(item) && item !== subject) {
          context.push(item);
        }
      });
    }
  }
  
  return {
    primary: primaryIntent,
    subject,
    context,
    complexity
  };
}

/**
 * Generate more dynamic, context-aware thoughts for sequential thinking
 */
function generateNorseThought(prompt: string, stepIndex: number, sessionId?: string): string {
  // Retrieve or create session
  const session = sessionId ? getOrCreateSession(sessionId) : undefined;
  
  // Perform deep intent analysis
  const intent = analyzeQuestionIntent(prompt, session);
  
  // Use session information if available
  if (session) {
    // We've already stored the question in the main function, so we don't need to do it again here
    
    // Make contextual adjustments based on session history
    if (session.previousQuestions.length > 1) {
      const previousQuestion = session.previousQuestions[session.previousQuestions.length - 2];
      
      // Log some useful debugging info
      console.log(`Thought generation - Previous question: "${previousQuestion}"`);
      console.log(`Thought generation - Current question: "${prompt}"`);
      
      if (session.previousEntities.length > 0) {
        console.log(`Thought generation - Available entities in session: ${session.previousEntities.join(', ')}`);
      }
    }
  }
  
  // Dynamic thought starters based on question intent and complexity
  const thoughtStarters = [
    // Step 0: Understanding the context
    [
      `Analyzing the ${intent.primary === 'general' ? 'strategic' : intent.primary} dimensions of this question about ${intent.subject}`,
      `Establishing the mythological and strategic context of this ${intent.primary} question`,
      `Framing the question within Norse card game principles and ${intent.primary} concepts`,
      `Understanding how ${intent.subject} relates to core Norse ${intent.primary} patterns`,
      `Exploring the foundational aspects of ${intent.subject} in relation to the question's ${intent.primary} nature`
    ],
    // Step 1: Core mechanics/principles
    [
      `Examining the key ${intent.subject} mechanics that influence this situation`,
      `Identifying the critical Norse principles that govern ${intent.subject} in this context`,
      `Evaluating how ${intent.subject} interacts with core game systems`,
      `Analyzing the fundamental ${intent.primary} patterns relevant to ${intent.subject}`,
      `Determining which ${intent.subject} attributes are most relevant to this ${intent.primary} question`
    ],
    // Step 2: Specific applications/interactions
    [
      `Exploring specific applications of ${intent.subject} in ${intent.context.length > 0 ? intent.context[0] + '-related' : 'various'} scenarios`,
      `Considering how ${intent.subject} mechanics interact with ${intent.context.length > 0 ? intent.context.join(' and ') : 'other elements'}`,
      `Analyzing optimal utilization patterns for ${intent.subject}`,
      `Mapping the interaction network between ${intent.subject} and related game elements`,
      `Determining the most effective implementation approaches for ${intent.subject}`
    ],
    // Step 3: Strategic implications
    [
      `Evaluating the strategic implications of ${intent.subject} in the current meta`,
      `Assessing how ${intent.subject} influences broader game patterns`,
      `Considering ${intent.subject} from opponents' perspective and counterplay options`,
      `Analyzing the risk-reward profile of ${intent.subject}-centered approaches`,
      `Exploring how ${intent.subject} affects the decision space for both players`
    ],
    // Step 4: Timing and sequencing
    [
      `Determining optimal timing and sequencing for ${intent.subject}-related plays`,
      `Identifying key decision points when employing ${intent.subject}`,
      `Mapping the most effective progression patterns involving ${intent.subject}`,
      `Analyzing how turn structure and game phases affect ${intent.subject}'s effectiveness`,
      `Evaluating critical resource allocation timing when leveraging ${intent.subject}`
    ],
    // Step 5 (if needed): Synthesis
    [
      `Synthesizing insights about ${intent.subject} into a coherent strategic framework`,
      `Integrating all ${intent.subject} analysis points into comprehensive guidance`,
      `Formulating a holistic understanding of ${intent.subject} based on multi-faceted analysis`,
      `Constructing a strategic model that optimally positions ${intent.subject}`,
      `Developing a unified theory of ${intent.subject} utilization based on Norse principles`
    ]
  ];
  
  // Select a thought starter based on step index and add some variability based on complexity
  const variabilityIndex = intent.complexity > 3 ? intent.complexity - 2 : 0;
  const stepThoughts = thoughtStarters[Math.min(stepIndex, thoughtStarters.length - 1)];
  const selectedThought = stepThoughts[(stepIndex + variabilityIndex) % stepThoughts.length];
  
  return selectedThought;
}

/**
 * Generate dynamic, context-aware reasoning for Norse mythology and card game strategy
 */
function generateNorseReasoning(prompt: string, stepIndex: number, thought: string, sessionId?: string): string {
  // Get session memory if available
  const session = sessionId ? getOrCreateSession(sessionId) : undefined;
  
  // Perform advanced intent analysis
  const intent = analyzeQuestionIntent(prompt, session);
  
  // Create sentence fragments for dynamic composition
  const introductionFragments = [
    `In the sagas of Norse card strategy, `,
    `Just as the Norse gods faced their challenges with wisdom and cunning, `,
    `Drawing inspiration from the ancient wisdom of the Norse tradition, `,
    `The runes reveal that `,
    `As recorded in the sagas of competitive play, `,
    `Following the patterns etched into Yggdrasil's bark, `,
    `Like Odin's quest for wisdom at Mímir's well, `
  ];
  
  const contextFragments = [
    `we can see that ${intent.subject} represents a critical aspect of the ${intent.primary} question at hand.`,
    `${intent.subject} emerges as a central element in understanding this strategic situation.`,
    `the principles of ${intent.subject} form the foundation of our analytical approach.`,
    `the mysteries of ${intent.subject} offer key insights into this ${intent.primary} challenge.`,
    `${intent.subject} stands as a focal point around which our strategic considerations revolve.`
  ];
  
  // Get entity and mechanic information
  const entityInfo = norseEntities.find(e => e.name.toLowerCase() === intent.subject.toLowerCase());
  const mechanicInfo = cardMechanics.find(m => m.name.toLowerCase() === intent.subject.toLowerCase());
  const strategyInfo = gameStrategies.find(s => s.name.toLowerCase() === intent.subject.toLowerCase());
  
  // Subject-specific fragments
  let subjectFragments: string[] = [];
  
  if (entityInfo) {
    subjectFragments = [
      `${entityInfo.name}'s domains of ${entityInfo.attributes.slice(0, 3).join(', ')} inform our understanding of related cards and strategies.`,
      `Cards aligned with ${entityInfo.name} typically embody attributes of ${entityInfo.attributes.slice(0, 2).join(' and ')}, shaping their strategic deployment.`,
      `${entityInfo.name}'s mythological role as embodiment of ${entityInfo.attributes[0]} translates to game mechanics through ${intent.primary === 'counterplay' ? 'vulnerabilities' : 'strengths'} in ${entityInfo.attributes.slice(1, 3).join(' and ')}.`,
      `The essence of ${entityInfo.name} - ${entityInfo.attributes[0]} and ${entityInfo.attributes[1]} - manifests in card design through specific mechanical interactions.`
    ];
  } else if (mechanicInfo) {
    subjectFragments = [
      `The ${mechanicInfo.name} mechanic (${mechanicInfo.description}) creates strategic depth through its interaction with board states and card sequencing.`,
      `Understanding how ${mechanicInfo.name} functions - ${mechanicInfo.description} - reveals optimal timing and utilization patterns.`,
      `${mechanicInfo.name}'s core functionality (${mechanicInfo.description}) influences resource allocation decisions and tempo considerations.`,
      `The strategic implications of ${mechanicInfo.name} extend beyond its basic definition as ${mechanicInfo.description}, affecting broader gameplay patterns.`
    ];
  } else if (strategyInfo) {
    subjectFragments = [
      `The ${strategyInfo.name} approach (${strategyInfo.description}) represents a coherent strategic framework with specific strengths and vulnerabilities.`,
      `When evaluating ${strategyInfo.name} (${strategyInfo.description}), we must consider both its consistent performance patterns and situational effectiveness.`,
      `${strategyInfo.name} strategies leverage their core identity of ${strategyInfo.description} to create specific types of board advantage.`,
      `The effectiveness of ${strategyInfo.name} (${strategyInfo.description}) varies across matchups and meta conditions, requiring adaptive implementation.`
    ];
  } else {
    // Generic subject fragments if no specific info found
    subjectFragments = [
      `Strategic considerations around ${intent.subject} must account for both direct value and synergistic potential.`,
      `${intent.subject} functions within a network of interconnected mechanics and mythological resonances.`,
      `The optimal approach to ${intent.subject} balances immediate impact with long-term strategic positioning.`,
      `Understanding ${intent.subject} requires analysis of its role in various game phases and matchup contexts.`
    ];
  }
  
  // Intent-specific insight fragments
  const insightFragments: Record<string, string[]> = {
    strategy: [
      `Effective strategic planning with ${intent.subject} requires understanding its resource curves and power spikes.`,
      `Successful deployment of ${intent.subject} depends on proper sequencing and positional awareness.`,
      `The wisdom of the ancients suggests that ${intent.subject} achieves maximum impact when aligned with complementary elements.`,
      `Like the strategic planning before Ragnarök, optimal use of ${intent.subject} requires anticipating both immediate confrontations and long-term positioning.`
    ],
    analysis: [
      `Analysis reveals that ${intent.subject}'s value fluctuates based on board state, resource availability, and opponent archetype.`,
      `Careful evaluation shows that ${intent.subject} performs optimally when its core strengths align with your strategic objectives.`,
      `Through analytical deconstruction, we can see that ${intent.subject} offers multiple layers of strategic utility beyond its apparent function.`,
      `The runes of probability indicate that ${intent.subject}'s effectiveness correlates strongly with specific game contexts and supporting elements.`
    ],
    counterplay: [
      `Countering ${intent.subject} effectively requires identifying and exploiting timing vulnerabilities in its deployment pattern.`,
      `Strategic disruption of ${intent.subject} focuses on denying critical resources or synergy components.`,
      `Successful counterplay against ${intent.subject} often involves forcing suboptimal utilization through board pressure or resource manipulation.`,
      `Like Loki finding weaknesses in seemingly invulnerable gods, the key to defeating ${intent.subject} lies in understanding its fundamental dependencies.`
    ],
    meta: [
      `In the current competitive landscape, ${intent.subject} occupies a significant position due to its effectiveness against prevalent archetypes.`,
      `Meta analysis suggests that ${intent.subject}'s prominence is cyclical, rising and falling as the competitive environment evolves.`,
      `The community's collective wisdom indicates that ${intent.subject} performs particularly well in the current phase of strategic evolution.`,
      `Strategic forecasting based on recent tournament results suggests that ${intent.subject} will remain relevant despite emerging counter-strategies.`
    ],
    general: [
      `The ancient wisdom of Norse strategy suggests approaching ${intent.subject} with both respect for its power and awareness of its limitations.`,
      `Like the balanced forces of creation and destruction in Norse cosmology, effective use of ${intent.subject} requires understanding both its constructive and disruptive potential.`,
      `The saga of successful players reveals that mastery of ${intent.subject} comes through experience and thoughtful application rather than rigid adherence to formulas.`,
      `As Odin gained wisdom through both study and sacrifice, true understanding of ${intent.subject} comes through both theoretical knowledge and practical testing.`
    ]
  };
  
  // Context-aware connection fragments that reference previously mentioned entities/mechanics if available
  let connectionFragments: string[] = [];
  
  if (session && session.previousEntities.length > 0) {
    // Filter out the current subject to avoid redundancy
    const previousRelevantEntities = session.previousEntities.filter(name => 
      name.toLowerCase() !== intent.subject.toLowerCase() && 
      !intent.context.includes(name)
    );
    
    if (previousRelevantEntities.length > 0) {
      const previousEntity = previousRelevantEntities[0];
      const entityData = norseEntities.find(e => e.name === previousEntity);
      
      if (entityData) {
        connectionFragments.push(
          `Building on our earlier discussion of ${previousEntity}, we can see how ${intent.subject} ${intent.primary === 'counterplay' ? 'challenges' : 'complements'} its ${entityData.attributes[0]} aspect.`,
          `The relationship between ${intent.subject} and ${previousEntity} parallels the mythological ${intent.primary === 'counterplay' ? 'rivalry' : 'alliance'} in Norse tradition, creating strategic depth.`,
          `Whereas ${previousEntity} embodies ${entityData.attributes[0]}, ${intent.subject} represents a different but related strategic principle that ${intent.primary === 'counterplay' ? 'opposes' : 'enhances'} it.`,
          `The strategic interplay between ${intent.subject} and our previously discussed ${previousEntity} creates opportunities for sophisticated decision-making.`
        );
      }
    }
  }
  
  // If no connection fragments were created (no relevant previous entities), use generic ones
  if (connectionFragments.length === 0 && intent.context.length > 0) {
    connectionFragments = [
      `The relationship between ${intent.subject} and ${intent.context[0]} creates a dynamic tension that shapes strategic decisions.`,
      `When considering ${intent.subject}, we must acknowledge how it interacts with ${intent.context[0]} to create emergent gameplay patterns.`,
      `${intent.subject} and ${intent.context[0]} form a strategic axis that can be leveraged for competitive advantage.`,
      `The interplay between ${intent.subject} and ${intent.context[0]} mirrors mythological relationships in Norse tradition.`
    ];
  }
  
  // Conclusion fragments that vary by step index
  const conclusionFragments = [
    `This foundational understanding will guide our further analysis.`,
    `With this principle established, we can explore more nuanced applications.`,
    `This insight forms a critical component of our strategic framework.`,
    `Understanding this relationship reveals optimal decision pathways.`,
    `This strategic principle has significant implications for gameplay optimization.`
  ];
  
  // Dynamically compose the reasoning based on step index and question complexity
  let reasoning = '';
  
  // Get complexity-adjusted step pattern
  const complexity = intent.complexity || 3;
  const patternIndex = ((stepIndex + complexity) % 5);
  
  switch (patternIndex) {
    case 0:
      // Introduction and context
      reasoning = randomSelect(introductionFragments) + randomSelect(contextFragments);
      break;
    case 1:
      // Subject-specific analysis
      reasoning = randomSelect(subjectFragments) + ' ' + randomSelect(conclusionFragments);
      break;
    case 2:
      // Intent-specific insights
      reasoning = randomSelect(insightFragments[intent.primary] || insightFragments.general);
      break;
    case 3:
      // Connections to other entities/contexts
      if (connectionFragments.length > 0) {
        reasoning = randomSelect(connectionFragments);
      } else {
        // Fall back to more subject analysis if no connections available
        reasoning = randomSelect(subjectFragments);
      }
      break;
    case 4:
      // Synthesis and application
      reasoning = randomSelect(introductionFragments) + randomSelect(insightFragments[intent.primary] || insightFragments.general);
      break;
    default:
      reasoning = randomSelect(subjectFragments);
  }
  
  return reasoning;
}

/**
 * Helper function to randomly select an item from an array
 */
function randomSelect<T>(array: T[]): T {
  if (!array || array.length === 0) {
    throw new Error('Cannot select from empty array');
  }
  const index = Math.floor(Math.random() * array.length);
  return array[index];
}

/**
 * Generate a conclusion based on the Norse mythology context and strategy question
 */
function generateNorseConclusion(prompt: string, steps: SequentialThinkingStep[]): string {
  // Extract context from the prompt
  const relevantEntities = norseEntities.filter(entity => 
    prompt.toLowerCase().includes(entity.name.toLowerCase())
  );
  
  const relevantMechanics = cardMechanics.filter(mechanic => 
    prompt.toLowerCase().includes(mechanic.name.toLowerCase())
  );
  
  const relevantStrategies = gameStrategies.filter(strategy => 
    prompt.toLowerCase().includes(strategy.name.toLowerCase())
  );
  
  // Determine question type for specialized conclusion
  const isStrategyQuestion = prompt.toLowerCase().includes('strategy') || prompt.toLowerCase().includes('approach');
  const isCardAnalysis = prompt.toLowerCase().includes('card') && (prompt.toLowerCase().includes('analysis') || prompt.toLowerCase().includes('evaluate'));
  const isCounterplay = prompt.toLowerCase().includes('counter') || prompt.toLowerCase().includes('against');
  
  let conclusionBase = "";
  
  if (isStrategyQuestion) {
    conclusionBase = `The optimal strategic approach ${relevantEntities.length > 0 ? `involving ${relevantEntities[0].name}` : 'for this scenario'} requires balancing immediate board impact with long-term value generation. ${relevantMechanics.length > 0 ? `Leveraging the ${relevantMechanics[0].name} mechanic effectively is key, as it allows for ${relevantMechanics[0].description.toLowerCase()}.` : ''} Success will come from aligning your play pattern with the mythological resonance of your chosen strategy, recognizing that in Norse-inspired gameplay, the timing of power deployment often matters more than raw statistical advantage.`;
  } 
  else if (isCardAnalysis) {
    conclusionBase = `${relevantEntities.length > 0 ? `This ${relevantEntities[0].name}-aligned card` : 'The card in question'} presents ${relevantMechanics.length > 0 ? `a unique implementation of the ${relevantMechanics[0].name} mechanic` : 'significant strategic potential'}. Its value is maximized in ${relevantStrategies.length > 0 ? `a ${relevantStrategies[0].name} archetype` : 'decks that align with its mythological identity'}, where it can contribute to both tactical advantages and strategic progression. As with many Norse-designed cards, its true potential emerges not in isolation but as part of a cohesive strategic vision that honors its mythological roots.`;
  }
  else if (isCounterplay) {
    conclusionBase = `Countering ${relevantEntities.length > 0 ? `${relevantEntities[0].name}-based strategies` : 'the approach in question'} requires a multi-faceted response: tactical awareness to disrupt their key synergies, strategic patience to exploit their vulnerability windows, and technical deck construction to include specific counter elements. The most effective response will mirror the Norse understanding of fate - recognizing patterns while remaining adaptable to circumstances as they unfold.`;
  }
  else {
    // General conclusion for other question types
    conclusionBase = `Like the Norse gods who gained wisdom through experience and sacrifice, our understanding of this strategic question deepens through methodical analysis. The optimal approach balances the aggressive aspects of Thor, the wisdom of Odin, and the adaptability of Loki - power, knowledge, and cunning working in harmony. Success in Norse-inspired strategy games comes not just from powerful cards but from playing them with purpose, timing, and mythological resonance.`;
  }
  
  return conclusionBase;
}

/**
 * Process a prompt with enhanced Norse-themed sequential thinking
 * With session tracking for context-aware responses
 */
export function processWithNorseSequentialThinking(
  prompt: string,
  options: {
    maxSteps?: number;
    temperature?: number;
    sessionId?: string;
  } = {}
): SequentialThinkingResult {
  const maxSteps = options.maxSteps || 5;
  const sessionId = options.sessionId || `session_${Date.now()}`;
  
  // Clean up old sessions occasionally
  if (Math.random() < 0.1) { // 10% chance to run cleanup
    cleanupSessions();
  }
  
  // Get or create a session for this request
  const session = getOrCreateSession(sessionId);
  
  // Store this question in session
  if (!session.previousQuestions.includes(prompt)) {
    session.previousQuestions.push(prompt);
    
    // Extract and store entities and mechanics for future reference
    const entityMatches = norseEntities.filter(entity => 
      prompt.toLowerCase().includes(entity.name.toLowerCase())
    );
    
    const mechanicMatches = cardMechanics.filter(mechanic => 
      prompt.toLowerCase().includes(mechanic.name.toLowerCase())
    );
    
    entityMatches.forEach(entity => {
      if (!session.previousEntities.includes(entity.name)) {
        session.previousEntities.push(entity.name);
        console.log(`Added entity to session memory: ${entity.name}`);
      }
    });
    
    mechanicMatches.forEach(mechanic => {
      if (!session.previousMechanics.includes(mechanic.name)) {
        session.previousMechanics.push(mechanic.name);
        console.log(`Added mechanic to session memory: ${mechanic.name}`);
      }
    });
  }
  
  // Analyze the question intent
  const intent = analyzeQuestionIntent(prompt, session);
  console.log(`Question intent: ${intent.primary} about ${intent.subject}`);
  if (intent.context.length > 0) {
    console.log(`Context: ${intent.context.join(', ')}`);
  }
  
  // Generate thinking steps with Norse mythology context and session awareness
  const steps: SequentialThinkingStep[] = [];
  for (let i = 0; i < maxSteps; i++) {
    const thought = generateNorseThought(prompt, i, sessionId);
    const reasoning = generateNorseReasoning(prompt, i, thought, sessionId);
    
    steps.push({
      thought,
      reasoning
    });
  }
  
  // Record the timestamp for this interaction
  session.timestamps.push(Date.now());
  
  // Generate conclusion with Norse mythology context
  const conclusion = generateNorseConclusion(prompt, steps);
  
  return {
    steps,
    conclusion
  };
}

export const SmitheryAdvancedService = {
  processWithSequentialThinking: processWithNorseSequentialThinking
};
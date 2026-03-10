/**
 * Utility functions for Highlander cards mechanics
 * Primarily checking for no duplicates in deck and handling Kazakus potion creation
 */

import { GameState, CardInstance, CardData, GameLogEventType } from '../types';
import { createGameLogEvent } from '../utils/gameLogUtils';
import { getRandomInt } from '../utils/randomUtils';
import { fireAnnouncementAdapter } from '../hooks';
import { MAX_HAND_SIZE } from '../constants/gameConstants';

/**
 * Check if a player's deck has no duplicates (for Highlander card effects)
 * @param state Current game state
 * @param playerType Player to check
 * @returns Boolean indicating if the player's deck has no duplicates
 */
export function deckHasNoDuplicates(
  state: GameState,
  playerType: 'player' | 'opponent'
): boolean {
  const deck = state.players[playerType].deck;
  
  // If deck is empty, technically it has no duplicates
  if (deck.length === 0) {
    return true;
  }
  
  // Create a map to count occurrences of each card by ID
  const cardCounts = new Map<number, number>();
  
  // Count each card in the deck
  for (const card of deck) {
    const cardId = typeof card.id === 'number' ? card.id : parseInt(card.id as string, 10);
    const currentCount = cardCounts.get(cardId) || 0;
    cardCounts.set(cardId, currentCount + 1);
  }
  
  // Check if any card appears more than once
  const countValues = Array.from(cardCounts.values());
  for (const count of countValues) {
    if (count > 1) {
      return false;
    }
  }
  
  // No duplicates found
  return true;
}

/**
 * Execute The Wanderer's battlecry (full heal if deck has no duplicates)
 * @param state Current game state
 * @param playerType Player who played The Wanderer
 * @returns Updated game state after The Wanderer's battlecry
 */
export function executeRenoJacksonBattlecry(
  state: GameState,
  playerType: 'player' | 'opponent'
): GameState {
  // Create a deep copy of the state to avoid mutation
  let newState = structuredClone(state);
  
  // Check if the player's deck has no duplicates
  const noDuplicates = deckHasNoDuplicates(newState, playerType);
  
  // Log the battlecry attempt
  newState.gameLog.push(
    createGameLogEvent(
      newState, 
      'play_card' as GameLogEventType,
      playerType,
      `The Wanderer attempts to fully heal ${playerType}.`,
      { cardId: '70001' } // The Wanderer's ID
    )
  );
  
  // If the condition is not met, show notification and return unchanged state
  if (!noDuplicates) {
    newState.gameLog.push(
      createGameLogEvent(
        newState,
        'play_card' as GameLogEventType,
        playerType,
        `The effect fails because ${playerType}'s deck has duplicates.`,
        { cardId: '70001' } // The Wanderer's ID
      )
    );
    
    // Show visual notification for failed Highlander effect
    fireAnnouncementAdapter('condition_not_met', 'Effect Failed!', {
      subtitle: 'Deck contains duplicate cards',
      duration: 2000
    });
    
    return newState;
  }
  
  // Get the player's current and maximum health
  const currentHealth = (newState.players[playerType].hero as any)?.health ?? newState.players[playerType].health;
  const maxHealth = newState.players[playerType].maxHealth;
  const healAmount = maxHealth - currentHealth;

  // Apply the full heal
  (newState.players[playerType].hero as any).health = maxHealth;
  
  // Log the healing
  newState.gameLog.push(
    createGameLogEvent(
      newState,
      'heal' as GameLogEventType,
      playerType,
      `The Wanderer fully heals ${playerType} for ${healAmount} health.`,
      {
        targetId: `${playerType}_hero`,
        value: healAmount
      }
    )
  );
  
  return newState;
}

// Define types for Kazakus potion options
interface PotionEffect {
  id: number;
  name: string;
  description: string;
}

// Potion effect options by mana cost
const potionEffects: Record<number, PotionEffect[]> = {
  // 1-mana potion effects
  1: [
    { id: 1, name: "Felbloom", description: "Deal 2 damage to all minions" },
    { id: 2, name: "Kingsblood", description: "Draw a card" },
    { id: 3, name: "Icecap", description: "Freeze a random enemy minion" },
    { id: 4, name: "Netherbloom", description: "Summon a 2/2 Titan" },
    { id: 5, name: "Heart of Fire", description: "Deal 3 damage to a random enemy" }
  ],
  
  // 5-mana potion effects
  5: [
    { id: 1, name: "Felbloom", description: "Deal 4 damage to all minions" },
    { id: 2, name: "Kingsblood", description: "Draw 2 cards" },
    { id: 3, name: "Icecap", description: "Freeze all enemy minions" },
    { id: 4, name: "Netherbloom", description: "Summon a 5/5 Titan" },
    { id: 5, name: "Heart of Fire", description: "Deal 5 damage to a random enemy" }
  ],
  
  // 10-mana potion effects
  10: [
    { id: 1, name: "Felbloom", description: "Deal 6 damage to all minions" },
    { id: 2, name: "Kingsblood", description: "Draw 3 cards" },
    { id: 3, name: "Icecap", description: "Freeze and Silence all enemy minions" },
    { id: 4, name: "Netherbloom", description: "Summon an 8/8 Titan" },
    { id: 5, name: "Heart of Fire", description: "Deal 8 damage to all enemies" }
  ]
};

/**
 * Execute Alchemist's battlecry (create a custom spell if deck has no duplicates)
 * @param state Current game state
 * @param playerType Player who played Alchemist
 * @returns Updated game state after Alchemist's battlecry
 */
export function executeKazakusBattlecry(
  state: GameState,
  playerType: 'player' | 'opponent'
): GameState {
  // Create a deep copy of the state to avoid mutation
  let newState = structuredClone(state);
  
  // Check if the player's deck has no duplicates
  const noDuplicates = deckHasNoDuplicates(newState, playerType);
  
  // Log the battlecry attempt
  newState.gameLog.push(
    createGameLogEvent(
      newState,
      'play_card' as GameLogEventType,
      playerType,
      `Alchemist attempts to create a custom spell.`,
      { cardId: '70002' } // Alchemist's ID
    )
  );
  
  // If the condition is not met, show notification and return unchanged state
  if (!noDuplicates) {
    newState.gameLog.push(
      createGameLogEvent(
        newState,
        'play_card' as GameLogEventType, 
        playerType,
        `The effect fails because ${playerType}'s deck has duplicates.`,
        { cardId: '70002' } // Alchemist's ID
      )
    );
    
    // Show visual notification for failed Highlander effect
    fireAnnouncementAdapter('condition_not_met', 'Alchemist Effect Failed!', {
      subtitle: 'Deck contains duplicate cards',
      duration: 2000
    });
    
    return newState;
  }
  
  // In a real implementation, this would trigger a UI to let the player choose
  // For now, we'll simulate a random choice
  
  // Choose potion mana cost (1, 5, or 10)
  const potionCosts = [1, 5, 10];
  const randomCostIndex = getRandomInt(0, potionCosts.length - 1);
  const potionCost = potionCosts[randomCostIndex];
  
  // Choose first effect
  const availableEffects = potionEffects[potionCost];
  const firstEffectIndex = getRandomInt(0, availableEffects.length - 1);
  const firstEffect = availableEffects[firstEffectIndex];
  
  // Choose second effect (different from first)
  let secondEffectIndex;
  do {
    secondEffectIndex = getRandomInt(0, availableEffects.length - 1);
  } while (secondEffectIndex === firstEffectIndex);
  const secondEffect = availableEffects[secondEffectIndex];
  
  // Create potion card ID based on cost
  const potionId = potionCost === 1 ? 70101 : potionCost === 5 ? 70105 : 70110;
  
  // Create custom potion description
  const potionDescription = `${firstEffect.description} and ${secondEffect.description}.`;
  
  // Create the custom potion card
  const customPotion: CardInstance = {
    instanceId: `${playerType}_custom_potion_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    card: {
      id: potionId,
      name: `Custom Potion (${potionCost}-Cost)`,
      manaCost: potionCost,
      type: "spell" as const,
      rarity: "epic",
      description: potionDescription,
      keywords: [],
      heroClass: "neutral",
      kazakusEffects: [firstEffect.id, secondEffect.id],
      potionCost: potionCost
    } as any,
    isPlayed: false
  };
  
  // Add to player's hand (respect hand limit)
  if (newState.players[playerType].hand.length >= MAX_HAND_SIZE) {
    return newState;
  }
  newState.players[playerType].hand.push(customPotion);
  
  // Log the potion creation
  newState.gameLog.push(
    createGameLogEvent(
      newState,
      'kazakus_potion_created' as GameLogEventType,
      playerType,
      `Alchemist creates a ${potionCost}-cost potion: ${potionDescription}`,
      { cardId: potionId.toString() }
    )
  );
  
  return newState;
}

/**
 * Execute Arcane-Master's battlecry (next spell costs 0 if deck has no duplicates)
 * @param state Current game state
 * @param playerType Player who played Arcane-Master
 * @returns Updated game state after Arcane-Master's battlecry
 */
export function executeSoliaBattlecry(
  state: GameState,
  playerType: 'player' | 'opponent'
): GameState {
  // Create a deep copy of the state to avoid mutation
  let newState = structuredClone(state);
  
  // Check if the player's deck has no duplicates
  const noDuplicates = deckHasNoDuplicates(newState, playerType);
  
  // Log the battlecry attempt
  newState.gameLog.push(
    createGameLogEvent(
      newState,
      'play_card' as GameLogEventType,
      playerType,
      `Arcane-Master attempts to make your next spell cost (0).`,
      { cardId: '70003' } // Arcane-Master's ID
    )
  );
  
  // If the condition is not met, show notification and return unchanged state
  if (!noDuplicates) {
    newState.gameLog.push(
      createGameLogEvent(
        newState,
        'play_card' as GameLogEventType,
        playerType,
        `The effect fails because ${playerType}'s deck has duplicates.`,
        { cardId: '70003' } // Arcane-Master's ID
      )
    );
    
    // Show visual notification for failed Highlander effect
    fireAnnouncementAdapter('condition_not_met', 'Arcane-Master Effect Failed!', {
      subtitle: 'Deck contains duplicate cards',
      duration: 2000
    });
    
    return newState;
  }
  
  // Set the next spell costs zero flag
  (newState.players[playerType] as any).nextSpellCostsZero = true;
  
  // Log the effect
  newState.gameLog.push(
    createGameLogEvent(
      newState,
      'effect_applied' as GameLogEventType,
      playerType,
      `Arcane-Master makes ${playerType}'s next spell this turn cost (0).`,
      { cardId: '70003' } // Arcane-Master's ID
    )
  );
  
  return newState;
}

/**
 * Execute Bound-Spirit's battlecry (hero power costs 0 if deck has no duplicates)
 * @param state Current game state
 * @param playerType Player who played Bound-Spirit
 * @returns Updated game state after Bound-Spirit's battlecry
 */
export function executeRazaBattlecry(
  state: GameState,
  playerType: 'player' | 'opponent'
): GameState {
  // Create a deep copy of the state to avoid mutation
  let newState = structuredClone(state);
  
  // Check if the player's deck has no duplicates
  const noDuplicates = deckHasNoDuplicates(newState, playerType);
  
  // Log the battlecry attempt
  newState.gameLog.push(
    createGameLogEvent(
      newState,
      'raza_battlecry' as GameLogEventType,
      playerType,
      `Bound-Spirit attempts to make your Hero Power cost (0).`,
      { cardId: '70004' }
    )
  );
  
  // If the condition is not met, show notification and return unchanged state
  if (!noDuplicates) {
    newState.gameLog.push(
      createGameLogEvent(
        newState,
        'play_card' as GameLogEventType,
        playerType,
        `The effect fails because ${playerType}'s deck has duplicates.`,
        { cardId: '70004' } // Bound-Spirit's ID
      )
    );
    
    // Show visual notification for failed Highlander effect
    fireAnnouncementAdapter('condition_not_met', 'Bound-Spirit Effect Failed!', {
      subtitle: 'Deck contains duplicate cards',
      duration: 2000
    });
    
    return newState;
  }
  
  // Set the hero power costs zero flag
  (newState.players[playerType] as any).heroPowerCostsZero = true;
  
  // Log the effect
  newState.gameLog.push(
    createGameLogEvent(
      newState,
      'effect_applied' as GameLogEventType,
      playerType,
      `Bound-Spirit makes ${playerType}'s Hero Power cost (0) for the rest of the game.`,
      { cardId: '70004' } // Bound-Spirit's ID
    )
  );
  
  return newState;
}

/**
 * Execute The Unshackled's battlecry (summon all Titans from hand if deck has no duplicates)
 * @param state Current game state
 * @param playerType Player who played The Unshackled
 * @returns Updated game state after The Unshackled's battlecry
 */
export function executeKrulBattlecry(
  state: GameState,
  playerType: 'player' | 'opponent'
): GameState {
  // Create a deep copy of the state to avoid mutation
  let newState = structuredClone(state);
  
  // Check if the player's deck has no duplicates
  const noDuplicates = deckHasNoDuplicates(newState, playerType);
  
  // Log the battlecry attempt
  newState.gameLog.push(
    createGameLogEvent(
      newState,
      'krul_battlecry' as GameLogEventType,
      playerType,
      `The Unshackled attempts to summon all Titans from your hand.`,
      { cardId: '70005' }
    )
  );
  
  // If the condition is not met, show notification and return unchanged state
  if (!noDuplicates) {
    newState.gameLog.push(
      createGameLogEvent(
        newState,
        'play_card' as GameLogEventType,
        playerType,
        `The effect fails because ${playerType}'s deck has duplicates.`,
        { cardId: '70005' } // The Unshackled's ID
      )
    );
    
    // Show visual notification for failed Highlander effect
    fireAnnouncementAdapter('condition_not_met', 'The Unshackled Effect Failed!', {
      subtitle: 'Deck contains duplicate cards',
      duration: 2000
    });
    
    return newState;
  }
  
  // Find all titans (formerly demons) in hand
  const hand = newState.players[playerType].hand;
  const titansInHand = hand.filter((card: CardInstance) => {
    const r = ((card.card as any).race || '').toLowerCase();
    return card.card.type === 'minion' && (r === 'titan' || r === 'demon');
  });

  // If no titans in hand, return unchanged state
  if (titansInHand.length === 0) {
    newState.gameLog.push(
      createGameLogEvent(
      newState,
      'krul_no_titans' as GameLogEventType,
      playerType,
      `The Unshackled found no Titans to summon from your hand.`,
      { cardId: '70005' }
    )
    );
    return newState;
  }
  
  // Check if the battlefield is full
  const battlefield = newState.players[playerType].battlefield;
  const maxMinions = 5;
  const availableSlots = maxMinions - battlefield.length;
  
  // Limit titans to available slots
  const titansToSummon = titansInHand.slice(0, availableSlots);

  // Remove titans from hand
  newState.players[playerType].hand = hand.filter((card: CardInstance) =>
    !titansToSummon.some((titan: CardInstance) => titan.instanceId === card.instanceId)
  );

  // Add titans to battlefield
  for (const titan of titansToSummon) {
    // Create a modified version for the battlefield
    const summonedTitan = {
      ...titan,
      isSummoningSick: true,
      attacksPerformed: 0,
      isPlayed: false
    };
    
    // Add to battlefield
    newState.players[playerType].battlefield.push(summonedTitan);

    // Log the summon
    newState.gameLog.push(
      createGameLogEvent(
      newState,
      'summon' as GameLogEventType,
      playerType,
      `The Unshackled summons ${titan.card.name} from your hand.`,
      { cardId: titan.card.id.toString() }
    )
    );
  }
  
  return newState;
}

/**
 * Cast a custom potion (using its random effects)
 * @param state Current game state
 * @param potionInstanceId ID of the custom potion
 * @param playerType Player who cast the potion
 * @returns Updated game state after potion effects
 */
export function castKazakusPotion(
  state: GameState,
  potionInstanceId: string,
  playerType: 'player' | 'opponent'
): GameState {
  // Create a deep copy of the state to avoid mutation
  let newState = structuredClone(state);
  
  // Find the potion card in hand
  const hand = newState.players[playerType].hand;
  const potionIndex = hand.findIndex((card: CardInstance) => card.instanceId === potionInstanceId);
  
  if (potionIndex === -1) {
    // Potion not found in hand
    return newState;
  }
  
  const potion = hand[potionIndex];
  
  // Get the potion's cost and effects
  const potionCost = (potion.card as any).potionCost || 1;
  const effectIds = (potion.card as any).kazakusEffects || [];
  
  // Log the potion cast
  newState.gameLog.push(
    createGameLogEvent(
      newState,
      'spell_cast' as GameLogEventType,
      playerType,
      `${playerType} casts ${potion.card.name}.`,
      { cardId: potion.card.id.toString() }
    )
  );
  
  // Remove from hand
  newState.players[playerType].hand.splice(potionIndex, 1);
  
  // Apply each effect
  for (const effectId of effectIds) {
    // Get effect details
    const effect = potionEffects[potionCost].find(e => e.id === effectId);
    
    if (!effect) continue;
    
    // Log effect
    newState.gameLog.push(
      createGameLogEvent(
        newState,
        'spell_effect' as GameLogEventType,
        playerType,
        `Potion effect: ${effect.description}`,
        { cardId: potion.card.id.toString() }
      )
    );
    
    // Apply the potion effect based on its description
    const player = newState.players[playerType];
    const opponentType = playerType === 'player' ? 'opponent' : 'player';
    const opponent = newState.players[opponentType];

    if (effect.description.startsWith('Deal') && effect.description.includes('all minions')) {
      const dmg = parseInt(effect.description.match(/\d+/)?.[0] || '0');
      [...player.battlefield, ...opponent.battlefield].forEach((m: CardInstance) => {
        m.currentHealth = (m.currentHealth ?? (m.card as any).health ?? 0) - dmg;
      });
      player.battlefield = player.battlefield.filter((m: CardInstance) => (m.currentHealth ?? 0) > 0);
      opponent.battlefield = opponent.battlefield.filter((m: CardInstance) => (m.currentHealth ?? 0) > 0);
    } else if (effect.description.startsWith('Draw')) {
      const count = parseInt(effect.description.match(/\d+/)?.[0] || '1');
      for (let d = 0; d < count && player.deck.length > 0 && player.hand.length < MAX_HAND_SIZE; d++) {
        player.hand.push(player.deck.shift()! as unknown as CardInstance);
      }
    } else if (effect.description.includes('Freeze') && effect.description.includes('enemy')) {
      opponent.battlefield.forEach((m: CardInstance) => { (m as any).isFrozen = true; });
    } else if (effect.description.startsWith('Deal') && effect.description.includes('random enemy')) {
      const dmg = parseInt(effect.description.match(/\d+/)?.[0] || '0');
      const targets = [...opponent.battlefield];
      if (targets.length > 0) {
        const target = targets[Math.floor(Math.random() * targets.length)];
        target.currentHealth = (target.currentHealth ?? (target.card as any).health ?? 0) - dmg;
        if ((target.currentHealth ?? 0) <= 0) {
          opponent.battlefield = opponent.battlefield.filter((m: CardInstance) => m.instanceId !== target.instanceId);
        }
      }
    } else if (effect.description.startsWith('Deal') && effect.description.includes('all enemies')) {
      const dmg = parseInt(effect.description.match(/\d+/)?.[0] || '0');
      opponent.battlefield.forEach((m: CardInstance) => {
        m.currentHealth = (m.currentHealth ?? (m.card as any).health ?? 0) - dmg;
      });
      opponent.battlefield = opponent.battlefield.filter((m: CardInstance) => (m.currentHealth ?? 0) > 0);
    }
  }
  
  // Move to graveyard
  newState.players[playerType].graveyard.push(potion);
  
  return newState;
}
import { v4 as uuidv4 } from 'uuid';
import { CardData, CardInstance } from '../types';
import allCards from '../data/allCards';
import { colossalMinionCards } from '../data/colossalCards';
import { initializeSpellPower } from './spellPowerUtils';
import { initializePoisonousEffect } from './poisonousUtils';
import { initializeLifestealEffect } from './lifestealUtils';
import { initializeRushEffect } from './rushUtils';
import { initializeMagneticEffect } from './magneticUtils';
import { initializeFrenzyEffect } from './frenzyUtils';
import { initializeColossalEffect } from './colossalUtils';
import { initializeEchoEffect } from './echoUtils';

/**
 * Creates a new card instance from card data
 */
export function createCardInstance(card: CardData): CardInstance {
  // Check if the card has Charge, which allows it to attack immediately
  const hasCharge = card.keywords?.includes('charge') || false;
  
  // Create the basic card instance
  const cardInstance: CardInstance = {
    instanceId: uuidv4(),
    card,
    currentHealth: card.health,
    canAttack: false,
    isPlayed: false,
    // Charge minions are not affected by summoning sickness
    isSummoningSick: !hasCharge,
    // Initialize hasDivineShield based on card keywords
    hasDivineShield: card.keywords?.includes('divine_shield') || false,
    // Initialize attacks performed this turn
    attacksPerformed: 0,
    // Initialize new keyword properties
    isPoisonous: card.keywords?.includes('poisonous') || false,
    hasLifesteal: card.keywords?.includes('lifesteal') || false,
    isRush: card.keywords?.includes('rush') || false,
    isMagnetic: card.keywords?.includes('magnetic') || false,
    // For mech attachments in magnetic mechanic
    mechAttachments: []
  };
  
  // Apply additional card-specific initializations
  let processedInstance = cardInstance;
  
  // Apply spell power initialization if the card has the spell_damage keyword
  if (card.keywords?.includes('spell_damage')) {
    processedInstance = initializeSpellPower(processedInstance);
  }
  
  // Initialize poisonous effect
  if (card.keywords?.includes('poisonous')) {
    processedInstance = initializePoisonousEffect(processedInstance);
  }
  
  // Initialize lifesteal effect
  if (card.keywords?.includes('lifesteal')) {
    processedInstance = initializeLifestealEffect(processedInstance);
  }
  
  // Initialize rush effect (allows immediate attacks against minions)
  if (card.keywords?.includes('rush')) {
    processedInstance = initializeRushEffect(processedInstance);
  }
  
  // Initialize magnetic effect for mechs
  if (card.keywords?.includes('magnetic')) {
    processedInstance = initializeMagneticEffect(processedInstance);
  }
  
  // Initialize frenzy effect
  if (card.keywords?.includes('frenzy') && card.frenzyEffect) {
    processedInstance = initializeFrenzyEffect(processedInstance);
  }
  
  // Initialize colossal effect
  if (card.keywords?.includes('colossal')) {
    processedInstance = initializeColossalEffect(processedInstance);
  }
  
  // Initialize echo effect
  if (card.keywords?.includes('echo')) {
    processedInstance = initializeEchoEffect(processedInstance);
  }
  
  return processedInstance;
}

/**
 * Get random cards from the card database
 */
export function getRandomCards(count: number): CardData[] {
  const shuffled = [...allCards].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

/**
 * Create a starting deck of cards for testing
 * Ensures a mix of cards including special cards for testing various mechanics
 */
export function createStartingDeck(size: number = 20): CardData[] {
  // First, get all deathrattle cards
  const deathrattleCards = allCards.filter((card: CardData) => 
    card.keywords?.includes('deathrattle') || false
  );
  
  // Make sure we include at least some deathrattle cards
  const numDeathrattleCards = Math.min(3, deathrattleCards.length);
  const selectedDeathrattleCards = deathrattleCards
    .sort(() => 0.5 - Math.random())
    .slice(0, numDeathrattleCards);
  
  // Get cards with complex battlecries for testing (AoE damage)
  const aoeBattlecryCards = allCards.filter((card: CardData) => 
    card.battlecry?.type === 'aoe_damage'
  );
  
  // Make sure we include the AoE battlecry cards
  const numAoECards = Math.min(2, aoeBattlecryCards.length);
  const selectedAoECards = aoeBattlecryCards.slice(0, numAoECards);
  
  // Get some taunt cards for testing
  const tauntCards = allCards.filter((card: CardData) => 
    card.keywords?.includes('taunt') || false
  );
  
  const numTauntCards = Math.min(3, tauntCards.length);
  const selectedTauntCards = tauntCards
    .sort(() => 0.5 - Math.random())
    .slice(0, numTauntCards);
    
  // Get overload cards for testing
  const overloadCards = allCards.filter((card: CardData) => 
    card.keywords?.includes('overload') || false
  );
  
  // Make sure we include several overload cards for testing
  const numOverloadCards = Math.min(4, overloadCards.length);
  const selectedOverloadCards = overloadCards.slice(0, numOverloadCards);
  
  // Get mana manipulation cards for testing (The Coin and Innervate)
  // Use allCards (1300+ cards) instead of tiny spellCards database
  const manaCards = allCards.filter(card => 
    card.type === 'spell' && card.spellEffect?.type === 'mana_crystal'
  );
  
  // Make sure we include these mana cards for testing
  const numManaCards = Math.min(2, manaCards.length);
  const selectedManaCards = manaCards.slice(0, numManaCards);
  
  // Get frenzy cards for testing
  const frenzyCards = allCards.filter((card: CardData) => 
    card.keywords?.includes('frenzy') || false
  );
  
  // Make sure we include some frenzy cards
  const numFrenzyCards = Math.min(2, frenzyCards.length);
  const selectedFrenzyCards = frenzyCards
    .sort(() => 0.5 - Math.random())
    .slice(0, numFrenzyCards);
  
  // Get colossal minions for testing - use imported array of colossal minions
  // The colossalMinionCards is imported from data/colossalCards.ts
  
  // Make sure we include some colossal minions
  const numColossalCards = Math.min(2, colossalMinionCards.length);
  const selectedColossalCards = colossalMinionCards
    .sort(() => 0.5 - Math.random())
    .slice(0, numColossalCards);
  
  // Get Murloc cards for testing Giga-Fin's battlecry
  const murlocCards = allCards.filter((card: CardData) => 
    (card.race?.toLowerCase() === 'murloc' || card.tribe?.toLowerCase() === 'murloc')
  );
  
  // Make sure we include enough Murloc cards
  const numMurlocCards = Math.min(4, murlocCards.length);
  const selectedMurlocCards = murlocCards
    .sort(() => 0.5 - Math.random())
    .slice(0, numMurlocCards);
  
  // Get random cards for the rest of the deck
  const specialCardIds = [
    ...selectedDeathrattleCards, 
    ...selectedAoECards, 
    ...selectedTauntCards,
    ...selectedOverloadCards,
    ...selectedManaCards,
    ...selectedFrenzyCards,
    ...selectedColossalCards,
    ...selectedMurlocCards
  ].map(card => card.id);
  
  const remainingCards = allCards
    .filter((card: CardData) => !specialCardIds.includes(card.id))
    .sort(() => 0.5 - Math.random())
    .slice(0, size - numDeathrattleCards - numAoECards - numTauntCards - numOverloadCards - numManaCards - numFrenzyCards - numColossalCards - numMurlocCards);
  
  // Combine and shuffle the deck
  return [
    ...selectedDeathrattleCards, 
    ...selectedAoECards, 
    ...selectedTauntCards, 
    ...selectedOverloadCards,
    ...selectedManaCards,
    ...selectedFrenzyCards,
    ...selectedColossalCards,
    ...selectedMurlocCards,
    ...remainingCards
  ].sort(() => 0.5 - Math.random());
}

/**
 * Create a random deck for a specific class without test cards
 * @param heroClass - The hero class for the deck
 * @param size - The number of cards in the deck
 */
export function createClassDeck(heroClass: string, size: number = 30): CardData[] {
  // Filter out undefined cards first
  const validCards = allCards.filter(card => card !== undefined && card !== null);
  
  // Filter cards for the specific class and neutral cards
  const classCards = validCards.filter((card: CardData) => {
    try {
      // Extract the card class safely
      let cardClass = '';
      
      // Check the class property
      if (typeof card.class === 'string') {
        cardClass = card.class;
      } 
      // Check heroClass property if class isn't available
      else if (typeof card.heroClass === 'string') {
        cardClass = card.heroClass;
      }
      
      // Check if the card belongs to the specified class or is neutral
      const matchesClass = cardClass.toLowerCase() === heroClass.toLowerCase() || 
                           cardClass.toLowerCase() === 'neutral';
      
      // Only include collectible cards
      return matchesClass && card.collectible !== false;
    } catch (error) {
      // Log the error safely without breaking the application
      console.error("Error filtering card:", error);
      return false;
    }
  });
  
  // If we don't have enough class cards, mix in some generic cards
  if (classCards.length < size) {
    // Just get random cards from all collectible cards
    const allCollectibleCards = allCards.filter(card => card && card.collectible !== false);
    return allCollectibleCards
      .sort(() => 0.5 - Math.random())
      .slice(0, size);
  }
  
  // Randomly select cards for the deck
  return classCards
    .sort(() => 0.5 - Math.random())
    .slice(0, size);
}

/**
 * Draw cards and convert them to instances
 */
export function drawCards(deck: CardData[], count: number): {
  drawnCards: CardInstance[];
  remainingDeck: CardData[];
} {
  // Ensure we don't draw more cards than available
  const actualDrawCount = Math.min(count, deck.length);
  
  // Get the cards to draw from the top of the deck
  const drawnCardData = deck.slice(0, actualDrawCount);
  const remainingDeck = deck.slice(actualDrawCount);
  
  // Convert card data to card instances
  const drawnCards = drawnCardData.map(createCardInstance);
  
  return {
    drawnCards,
    remainingDeck
  };
}

/**
 * Find a card instance by its ID in a list of card instances
 */
/**
 * Safely finds a card instance by its ID in an array of card instances
 * This version handles undefined arrays by returning undefined
 */
export function findCardInstance(
  cards: CardInstance[] | undefined,
  instanceId: string
): { card: CardInstance; index: number } | undefined {
  if (!cards || cards.length === 0) return undefined;
  const index = cards.findIndex(card => card.instanceId === instanceId);
  if (index === -1) return undefined;
  return { card: cards[index], index };
}

/**
 * Converts a CardInstance to CardData
 * This is useful for functions that expect CardData but receive CardInstance
 */
export function instanceToCardData(cardInstance: CardInstance): CardData {
  return cardInstance.card;
}

/**
 * Safely gets keywords from a card, returning an empty array if undefined
 * This prevents "possibly undefined" errors when checking for keywords
 */
export function getCardKeywords(card: CardData): string[] {
  return card.keywords || [];
}

/**
 * Check if a card instance can be played (has enough mana)
 */
export function canPlayCard(card: CardInstance, currentMana: number): boolean {
  return card.card.manaCost <= currentMana;
}

/**
 * Check if a card can attack (not summoning sick, has attack value, not frozen)
 * For cards with Windfury, they can attack twice per turn
 */
export function canCardAttack(card: CardInstance): boolean {
  const hasWindfury = card.card.keywords?.includes('windfury') || false;
  const maxAttacksAllowed = hasWindfury ? 2 : 1;
  const attacksPerformed = card.attacksPerformed || 0;
  
  return (card.card.attack || 0) > 0 && 
         !card.isSummoningSick && 
         card.canAttack === true && 
         !card.isFrozen && // Cannot attack if frozen
         attacksPerformed < maxAttacksAllowed;
}

/**
 * Find a card by its ID in the full card database
 */
export function findCardById(id: number): CardData | undefined {
  return allCards.find((card: CardData) => card && card.id === id);
}

/**
 * Get a card's tribe or race consistently
 * Some cards use 'race' while others use 'tribe', this standardizes the access
 */
export function getCardTribe(card: CardData | CardInstance): string | undefined {
  if (!card) return undefined;
  
  // If it's a CardInstance, get the inner card
  const cardData = 'card' in card ? card.card : card;
  
  // Check both race and tribe properties
  return cardData ? (cardData.tribe || cardData.race) : undefined;
}

/**
 * Check if a card belongs to a specific tribe/race
 */
export function isCardOfTribe(card: CardData | CardInstance, tribeName: string): boolean {
  const tribe = getCardTribe(card);
  return tribe ? tribe.toLowerCase() === tribeName.toLowerCase() : false;
}

/**
 * Check if a card is a Murloc
 */
export function isMurlocCard(card: CardData | CardInstance): boolean {
  return isCardOfTribe(card, 'murloc');
}

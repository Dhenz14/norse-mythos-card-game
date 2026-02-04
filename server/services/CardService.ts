/**
 * Card Service
 * 
 * This service provides methods for retrieving card data for the game.
 * It acts as an abstraction layer between the database and the application.
 */

import { CardData } from '../models/cardData';

/**
 * Basic card data for common test cards
 */
const basicCards: Record<number, CardData> = {
  // Basic minions
  1001: {
    id: 1001,
    name: 'Warrior Recruit',
    description: 'A basic warrior minion.',
    manaCost: 2,
    attack: 2,
    health: 3,
    type: 'minion',
    class: 'Warrior',
    rarity: 'basic',
    collectible: true
  },
  1101: {
    id: 1101,
    name: 'Mage Apprentice',
    description: 'A basic mage minion.',
    manaCost: 2,
    attack: 1,
    health: 3,
    type: 'minion',
    class: 'Mage',
    rarity: 'basic',
    collectible: true
  },
  1201: {
    id: 1201,
    name: 'Druid Acolyte',
    description: 'A basic druid minion.',
    manaCost: 2,
    attack: 2,
    health: 2,
    type: 'minion',
    class: 'Druid',
    rarity: 'basic',
    collectible: true
  },
  
  // Basic spells
  1002: {
    id: 1002,
    name: 'Warrior Strike',
    description: 'Deal 3 damage.',
    manaCost: 1,
    type: 'spell',
    class: 'Warrior',
    rarity: 'basic',
    collectible: true,
    spellEffect: {
      type: 'damage',
      value: 3,
      requiresTarget: true
    }
  },
  1102: {
    id: 1102,
    name: 'Mage Bolt',
    description: 'Deal 2 damage.',
    manaCost: 1,
    type: 'spell',
    class: 'Mage',
    rarity: 'basic',
    collectible: true,
    spellEffect: {
      type: 'damage',
      value: 2,
      requiresTarget: true
    }
  },
  1202: {
    id: 1202,
    name: 'Druid Growth',
    description: 'Gain an empty mana crystal.',
    manaCost: 2,
    type: 'spell',
    class: 'Druid',
    rarity: 'basic',
    collectible: true,
    spellEffect: {
      type: 'gain_mana',
      value: 1
    }
  },
  
  // Low-cost minions
  2001: {
    id: 2001,
    name: 'Footman',
    description: 'A basic minion with taunt.',
    manaCost: 1,
    attack: 1,
    health: 2,
    type: 'minion',
    class: 'Neutral',
    rarity: 'common',
    collectible: true,
    keywords: ['taunt']
  },
  2002: {
    id: 2002,
    name: 'Charger',
    description: 'A basic minion with charge.',
    manaCost: 1,
    attack: 2,
    health: 1,
    type: 'minion',
    class: 'Neutral',
    rarity: 'common',
    collectible: true,
    keywords: ['charge']
  },
  
  // Spell cards
  2003: {
    id: 2003,
    name: 'Minor Heal',
    description: 'Restore 2 health.',
    manaCost: 0,
    type: 'spell',
    class: 'Neutral',
    rarity: 'common',
    collectible: true,
    spellEffect: {
      type: 'heal',
      value: 2,
      requiresTarget: true
    }
  },
  
  // The Coin (special card)
  10000: {
    id: 10000,
    name: 'The Coin',
    description: 'Gain 1 Mana Crystal this turn only.',
    manaCost: 0,
    type: 'spell',
    class: 'Neutral',
    rarity: 'common',
    collectible: false,
    spellEffect: {
      type: 'gain_mana',
      value: 1
    }
  }
};

/**
 * Service for retrieving card data
 */
const CardService = {
  /**
   * Get card data by ID
   * 
   * @param cardId Card ID to retrieve
   * @returns Card data or null if not found
   */
  async findCardById(cardId: number): Promise<CardData | null> {
    // Check basic test cards first
    if (basicCards[cardId]) {
      return basicCards[cardId];
    }
    
    // If not found and ID is in a valid range, generate a basic card
    if (cardId > 0) {
      // Determine card class based on ID range
      let cardClass = 'Neutral';
      if (cardId >= 1000 && cardId < 1100) cardClass = 'Warrior';
      else if (cardId >= 1100 && cardId < 1200) cardClass = 'Mage';
      else if (cardId >= 1200 && cardId < 1300) cardClass = 'Druid';
      else if (cardId >= 1300 && cardId < 1400) cardClass = 'Warlock';
      else if (cardId >= 1400 && cardId < 1500) cardClass = 'Priest';
      else if (cardId >= 1500 && cardId < 1600) cardClass = 'Demonhunter';
      
      // Determine card type based on ID
      const type = cardId % 100 < 50 ? 'minion' : 'spell';
      
      // Generate basic card stats
      const attack = type === 'minion' ? Math.floor(cardId % 5) + 1 : undefined;
      const health = type === 'minion' ? Math.floor(cardId % 4) + 1 : undefined;
      const manaCost = Math.min(10, Math.floor((cardId % 1000) / 100));
      
      // Return generated card
      return {
        id: cardId,
        name: `Test Card ${cardId}`,
        description: `A test card with ID ${cardId}.`,
        manaCost,
        attack,
        health,
        type,
        class: cardClass,
        rarity: 'common',
        collectible: true
      };
    }
    
    return null;
  },
  
  /**
   * Get multiple cards by ID
   * 
   * @param cardIds Array of card IDs to retrieve
   * @returns Array of found cards (may be less than requested if some aren't found)
   */
  async findCardsByIds(cardIds: number[]): Promise<CardData[]> {
    const cards: CardData[] = [];
    
    for (const cardId of cardIds) {
      const card = await this.findCardById(cardId);
      if (card) {
        cards.push(card);
      }
    }
    
    return cards;
  },
  
  /**
   * Get cards by class
   * 
   * @param cardClass Class to filter by
   * @param collectibleOnly Whether to only include collectible cards
   * @returns Array of cards for the specified class
   */
  async findCardsByClass(cardClass: string, collectibleOnly: boolean = true): Promise<CardData[]> {
    // For the test implementation, we'll just return some basic cards
    const cards = Object.values(basicCards).filter(card => {
      return card.class === cardClass && (!collectibleOnly || card.collectible);
    });
    
    return cards;
  },
  
  /**
   * Get basic test cards for AI simulation
   * 
   * @returns Object containing basic test cards
   */
  getBasicCards(): Record<number, CardData> {
    return { ...basicCards };
  }
};

export default CardService;
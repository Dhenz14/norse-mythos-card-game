/**
 * interfaceExtensions.ts
 * 
 * This file contains interface extensions for the game's type system,
 * allowing us to add properties to existing interfaces without modifying
 * the original type definitions. This is especially useful for adding
 * properties that are only used in specific components or features.
 */

import { CardData } from '../types';

// Extend the CardInstance interface to include the card property
// This reflects the actual runtime structure where a CardInstance
// has a .card property containing the CardData
export interface CardInstanceWithCardData {
  instanceId: string;
  card: CardData;
  // Include other properties that might be on CardInstance
  currentHealth?: number;
  canAttack?: boolean;
  isPlayed?: boolean;
  isSummoningSick?: boolean;
  hasDivineShield?: boolean;
  attacksPerformed?: number;
  isPoisonous?: boolean;
  hasLifesteal?: boolean;
  isRush?: boolean;
  isMagnetic?: boolean;
  animationPosition?: {
    x: number;
    y: number;
  };
  
  // Status Effects (Ragnarok unique system)
  isPoisonedDoT?: boolean;     // Takes 3 damage at start of turn
  isBleeding?: boolean;        // Takes +3 damage when damaged
  isParalyzed?: boolean;       // 50% chance to fail actions
  isWeakened?: boolean;        // Has -3 Attack
  isVulnerable?: boolean;      // Takes +3 damage from all sources
  isMarked?: boolean;          // Can always be targeted (ignores stealth/protection)
  isSilenced?: boolean;        // Cannot use abilities
  isBurning?: boolean;         // Takes 3 damage when attacking, deals +3 damage
  
  [key: string]: any;  // Allow other properties
}

// Helper utility to check if an object is a CardInstanceWithCardData
export function isCardInstanceWithCardData(obj: any): obj is CardInstanceWithCardData {
  return obj && typeof obj === 'object' && 'instanceId' in obj && 'card' in obj;
}

// Helper utility to get the CardData from either a CardData or CardInstanceWithCardData
export function getCardData(card: CardData | CardInstanceWithCardData): CardData {
  if (isCardInstanceWithCardData(card)) {
    return card.card;
  }
  return card;
}

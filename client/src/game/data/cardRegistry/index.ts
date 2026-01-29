/**
 * Card Registry - Single Source of Truth
 * 
 * Hearthstone-style card organization:
 * - Core Set: Basic neutral and class cards
 * - Norse Set: Norse mythology themed expansion
 * - Tokens: Non-collectible cards summoned by other cards
 * 
 * All card data flows through this registry with validation.
 */

import { CardData } from '../../types';
import { validateCardRegistry } from './validation';

// Import organized card sets
import { coreNeutralCards } from './sets/core/neutrals';
import { allClassCards } from './sets/core/classes';
import { heroCards } from './sets/core/heroes';
import { norseMythologyCards } from './sets/norse';
import { tokenCards } from './sets/tokens';
import { heroSuperMinions } from '../sets/superMinions/heroSuperMinions';

// Combine all sets into a single registry
// Order matters: Norse cards take precedence over duplicates
// All tokens are centralized in tokenCards to avoid duplicates
const rawRegistry: CardData[] = [
  ...norseMythologyCards,
  ...allClassCards,
  ...coreNeutralCards,
  ...heroCards,
  ...tokenCards,
  ...heroSuperMinions,
];

// Validate and deduplicate
export const cardRegistry = validateCardRegistry(rawRegistry);

// Convenience exports for specific sets
export { coreNeutralCards } from './sets/core/neutrals';
export { allClassCards } from './sets/core/classes';
export { heroCards } from './sets/core/heroes';
export { norseMythologyCards } from './sets/norse';
export { tokenCards } from './sets/tokens';

// Re-export for backwards compatibility
export const fullCardDatabase = cardRegistry;
export default cardRegistry;

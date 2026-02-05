/**
 * Card Registry - Single Source of Truth
 * 
 * Hearthstone-style card organization:
 * - Core Set: Basic neutral and class cards
 * - Norse Set: Norse mythology themed expansion
 * - Tokens: Non-collectible cards summoned by other cards
 * - Legendary Sets: Additional legendary cards from various expansions
 * - Mechanic Cards: Cards with specific mechanics (quest, outcast, etc.)
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
// Import poker spells from original location (has proper PokerSpellCardData type)
import { pokerSpellCards } from '../pokerSpellCards';

// Import additional legendary card sets (previously scattered files)
import { additionalLegendaryCards } from '../additionalLegendaryCards';
import { iconicLegendaryCards } from '../iconicLegendaryCards';
import { modernLegendaryCards } from '../modernLegendaryCards';
import { finalLegendaryCards } from '../finalLegendaryCards';
import { expansionLegendaryCards } from '../expansionLegendaryCards';

// Import mechanic-specific card sets
import { questCards } from '../questCards';
import { outcastCards } from '../outcastCards';
import { recruitCards } from '../recruitCards';
import { spellburstCards } from '../spellburstCards';
import { secretCards } from '../secretCards';
import { classMinions } from '../classMinions';

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
  // Cast poker spells to CardData for type compatibility
  // PokerSpellCard extends CardData with additional pokerSpellEffect property
  ...(pokerSpellCards as unknown as CardData[]),
  // Additional legendary cards from various expansions
  ...additionalLegendaryCards,
  ...iconicLegendaryCards,
  ...modernLegendaryCards,
  ...finalLegendaryCards,
  ...expansionLegendaryCards,
  // Mechanic-specific cards
  ...questCards,
  ...outcastCards,
  ...recruitCards,
  ...spellburstCards,
  ...secretCards,
  ...classMinions,
];

// Validate and deduplicate
export const cardRegistry = validateCardRegistry(rawRegistry);

// Convenience exports for specific sets
export { coreNeutralCards } from './sets/core/neutrals';
export { allClassCards } from './sets/core/classes';
export { heroCards } from './sets/core/heroes';
export { norseMythologyCards } from './sets/norse';
export { tokenCards } from './sets/tokens';
// Re-export poker spells from original location
export { pokerSpellCards } from '../pokerSpellCards';

// Re-export for backwards compatibility
export const fullCardDatabase = cardRegistry;
export default cardRegistry;

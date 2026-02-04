/**
 * Card Management System
 * 
 * This is the public API for the card management system.
 * It provides a centralized way to create, register, and access card data.
 */

// Export from cardRegistry
export {
  registerCard,
  getCardById,
  getCardByName,
  getAllCards,
  getCardsByCategory,
  getCardsByCategories,
  getCardsByPredicate,
  hasCardWithId,
  getCardCount,
  getAllCategories,
  clearRegistry
} from './cardRegistry';

// Export from cardBuilder
export {
  CardBuilder,
  createCard
} from './cardBuilder';

// Export from cardImporter
export {
  importCards,
  importCardsFromJson
} from './cardImporter';

// Export from effectGenerator
export {
  generateEffectHandlerCode,
  generateEffectIndexCode,
  parseEffectNameFromFileName
} from './effectGenerator';

// Export initialization function
export { initializeCardDatabase } from './initializeCards';
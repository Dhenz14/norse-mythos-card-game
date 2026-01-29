/**
 * Super Minion Cards Registration
 * 
 * Registers all 76 hero-linked super minions in the card registry.
 * These legendary minions gain +2/+2 when played by their linked hero.
 */
import { registerCard } from '../cardManagement/cardRegistry';
import { heroSuperMinions } from '../sets/superMinions/heroSuperMinions';

/**
 * Register all super minion cards with the card registry
 */
export function registerSuperMinionCards(): void {
  heroSuperMinions.forEach(card => {
    try {
      registerCard(card, ['super_minion', 'hero_linked']);
    } catch (error) {
      console.error(`Failed to register super minion: ${card.name}`, error);
    }
  });
  
  console.log(`Registered ${heroSuperMinions.length} super minion cards.`);
}

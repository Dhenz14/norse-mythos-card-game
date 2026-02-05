/**
 * Outcast cards for Hearthstone clone
 * Outcast cards have special effects when played from the leftmost or rightmost position in your hand
 * This mechanic was introduced in the Ashes of Outland expansion for Demon Hunter
 */
import { CardData } from '../types';

/**
 * Collection of cards with the Outcast mechanic
 * Primarily Demon Hunter class cards with special effects when played from the leftmost or rightmost position in hand
 */
export const outcastCards: CardData[] = [
  {
      id: 50001,
      name: "Fenrir's Gaze",
      manaCost: 3,
      type: "spell",
      rarity: "rare",
      description: "Deal 3 damage to a minion. Outcast: This costs (1).",
      keywords: ["outcast"],
      heroClass: "demonhunter", 
      class: "Demonhunter",
      spellEffect: {
        type: "damage",
        value: 3,
        requiresTarget: true,
        targetType: "any_minion"
      },
      outcastEffect: {
        type: "mana_discount",
        manaDiscount: 2,
        targetRequired: false
      },
      collectible: true
  },
  {
      id: 50002,
      name: "Odin's Vision",
      manaCost: 2,
      type: "spell",
      rarity: "common",
      description: "Draw a card. Outcast: Draw another.",
      keywords: ["outcast"],
      heroClass: "demonhunter",
      class: "Demonhunter",
      spellEffect: {
        type: "draw",
        value: 1,
        requiresTarget: false,
        targetType: "none"
      },
      outcastEffect: {
        type: "draw",
        value: 1,
        targetRequired: false
      },
      collectible: true
  },
  {
      id: 50003,
      name: "Shadow Studies",
      manaCost: 1,
      type: "spell",
      rarity: "common",
      description: "Discover an Outcast card. Outcast: It costs (1) less.",
      keywords: ["discover", "outcast"],
      heroClass: "demonhunter",
      class: "Demonhunter",
      spellEffect: {
        type: "discover",
        value: 1,
        requiresTarget: false,
        targetType: "none",
        discoveryType: "any"
        // Special handling for outcast cards in discovery logic
      },
      outcastEffect: {
        type: "mana_discount",
        manaDiscount: 1,
        targetRequired: false
      },
      collectible: true
  },
  {
      id: 50004,
      name: "Chaos Guardians",
      manaCost: 7,
      type: "spell",
      rarity: "rare",
      description: "Summon three 1/2 Demons with Taunt. Costs (1) less for each minion that died this game.",
      keywords: ["outcast"],
      heroClass: "demonhunter",
      class: "Demonhunter",
      spellEffect: {
        type: "summon",
        value: 3,
        requiresTarget: false,
        targetType: "none",
        // Will summon 1/2 demons with Taunt in the implementation
        summonCardId: 50005
      },
      outcastEffect: {
        type: "mana_discount",
        manaDiscount: 1,
        targetRequired: false
      },
      collectible: true
  },
  {
      id: 50005,
      name: "Star Maiden Astraea",
      manaCost: 4,
      attack: 4,
      health: 3,
      type: "minion",
      rarity: "legendary",
      description: "Outcast: Look at 3 cards in your opponent's hand. Shuffle one of them into their deck.",
      keywords: ["outcast"],
      heroClass: "demonhunter",
      class: "Demonhunter",
      outcastEffect: {
        type: "discover",
        value: 3,
        targetRequired: false
      },
      collectible: true
  },
  {
      id: 50007,
      name: "Devour Runes",
      manaCost: 1,
      type: "spell",
      rarity: "common",
      description: "Silence a minion. Outcast: Draw a card.",
      keywords: ["outcast"],
      heroClass: "demonhunter",
      class: "Demonhunter",
      spellEffect: {
        type: "silence",
        requiresTarget: true,
        targetType: "any_minion"
      },
      outcastEffect: {
        type: "draw",
        value: 1,
        targetRequired: false
      },
      collectible: true
  },
  {
      id: 50008,
      name: "Twin Fang Strike",
      manaCost: 1,
      type: "spell",
      rarity: "common",
      description: "Give your hero +1 Attack this turn. Outcast: Add a Second Slice to your hand.",
      keywords: ["outcast"],
      heroClass: "demonhunter",
      class: "Demonhunter",
      spellEffect: {
        type: "buff",
        value: 1,
        requiresTarget: false,
        targetType: "friendly_hero",
        temporaryEffect: true
      },
      outcastEffect: {
        type: "draw",
        value: 1,
        targetRequired: false
        // In the implementation, this will add Second Slice to hand
      },
      collectible: true
  }
      ];

export default outcastCards;
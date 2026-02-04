/**
 * Secret cards for Hearthstone clone
 * Secrets are hidden spells that trigger automatically when specific conditions are met
 */
import { CardData, SecretTriggerType } from '../types';

export const secretCards: CardData[] = [
  {
    id: 15001,
    name: "Hunter's Ambush",
    manaCost: 2,
    type: "spell",
    rarity: "common",
    description: "Secret: After your opponent plays a minion, deal 4 damage to it.",
    keywords: ["secret"],
    class: "Hunter",
    heroClass: "hunter",
    collectible: true,
    secretEffect: {
      triggerType: "on_minion_summon" as SecretTriggerType,
      type: "damage",
      value: 4,
      targetType: "enemy_minion",
      requiresTarget: true
    }
  },
  {
    id: 15007,
    name: "Einherjar's Sacrifice",
    manaCost: 1,
    description: "Secret: When an enemy attacks, summon a 2/1 Defender as the new target.",
    rarity: "common",
    type: "spell",
    keywords: ["secret"],
    class: "Paladin",
    heroClass: "paladin",
    collectible: true,
    secretEffect: {
      triggerType: "on_minion_attack" as SecretTriggerType,
      type: "summon",
      targetType: "none",
      requiresTarget: false,
      summonCardId: 15008 // Defender token
    },
    // Adding spellEffect to ensure it can be played manually
    spellEffect: {
      type: "summon",
      targetType: "none",
      requiresTarget: false,
      summonCardId: 15008 // Defender token
    }
  }
];

export default secretCards;
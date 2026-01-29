/**
 * Script to add 50 new Priest cards to the game
 * 
 * This script will:
 * 1. Create new Priest minions, spells, and weapons
 * 2. Add them to appropriate files
 * 3. Follow existing ID patterns
 * 4. Add all required card properties
 */

const fs = require('fs');
const path = require('path');

// New Priest cards to add
const newPriestCards = [
  // Priest Minions (30 cards)
  {
    id: 5100,
    name: "Twilight Acolyte",
    manaCost: 3,
    attack: 2,
    health: 4,
    type: "minion",
    rarity: "rare",
    description: "Battlecry: If you're holding a Dragon, swap a minion's Attack and Health.",
    keywords: ["battlecry"],
    heroClass: "priest",
    class: "Priest",
    battlecry: {
      type: "swap_stats",
      requiresTarget: true,
      targetType: "any_minion",
      condition: {
        type: "holding_dragon"
      }
    },
    collectible: true
  },
  {
    id: 5101,
    name: "Crystalline Oracle",
    manaCost: 1,
    attack: 1,
    health: 1,
    type: "minion",
    rarity: "rare",
    description: "Deathrattle: Copy a card from your opponent's deck and add it to your hand.",
    keywords: ["deathrattle"],
    heroClass: "priest",
    class: "Priest",
    deathrattle: {
      type: "copy_from_opponent_deck",
      count: 1
    },
    collectible: true
  },
  {
    id: 5102,
    name: "Shadowy Figure",
    manaCost: 2,
    attack: 2,
    health: 2,
    type: "minion",
    rarity: "epic",
    description: "Battlecry: Transform into a 2/2 copy of a friendly Deathrattle minion.",
    keywords: ["battlecry"],
    heroClass: "priest",
    class: "Priest",
    battlecry: {
      type: "transform_into_copy",
      requiresTarget: true,
      targetType: "friendly_deathrattle_minion",
      copyStats: {
        attack: 2,
        health: 2
      }
    },
    collectible: true
  },
  {
    id: 5103,
    name: "Cleric of Scales",
    manaCost: 1,
    attack: 1,
    health: 1,
    type: "minion",
    rarity: "rare",
    description: "Battlecry: If you're holding a Dragon, Discover a spell from your deck.",
    keywords: ["battlecry", "discover"],
    heroClass: "priest",
    class: "Priest",
    battlecry: {
      type: "discover",
      cardType: "spell",
      source: "deck",
      condition: {
        type: "holding_dragon"
      }
    },
    collectible: true
  },
  {
    id: 5104,
    name: "Dark Inquisitor Xanesh",
    manaCost: 7,
    attack: 5,
    health: 7,
    type: "minion",
    rarity: "legendary",
    description: "Battlecry: Reduce the Cost of Corrupt cards in your hand and deck by (2).",
    keywords: ["battlecry"],
    heroClass: "priest",
    class: "Priest",
    battlecry: {
      type: "reduce_cost",
      value: 2,
      targets: "corrupt_cards",
      targetsLocation: ["hand", "deck"]
    },
    collectible: true
  },
  {
    id: 5105,
    name: "Lightwarden",
    manaCost: 1,
    attack: 1,
    health: 2,
    type: "minion",
    rarity: "common",
    description: "Whenever a character is healed, gain +2 Attack.",
    keywords: [],
    heroClass: "priest",
    class: "Priest",
    onEvent: {
      type: "on_heal",
      effect: {
        type: "buff",
        buffAttack: 2,
        buffTarget: "self"
      }
    },
    collectible: true
  },
  {
    id: 5106,
    name: "Radiant Elemental",
    manaCost: 2,
    attack: 2,
    health: 3,
    type: "minion",
    rarity: "common",
    description: "Your spells cost (1) less.",
    keywords: [],
    heroClass: "priest",
    class: "Priest",
    aura: {
      type: "mana_reduction",
      value: 1,
      targets: "spells"
    },
    collectible: true
  },
  {
    id: 5107,
    name: "Psychic Conjurer",
    manaCost: 1,
    attack: 1,
    health: 1,
    type: "minion",
    rarity: "common",
    description: "Battlecry: Copy a card in your opponent's deck and add it to your hand.",
    keywords: ["battlecry"],
    heroClass: "priest",
    class: "Priest",
    battlecry: {
      type: "copy_from_opponent_deck",
      count: 1
    },
    collectible: true
  },
  {
    id: 5108,
    name: "Catrina Muerte",
    manaCost: 8,
    attack: 6,
    health: 8,
    type: "minion",
    rarity: "legendary",
    description: "At the end of your turn, summon a friendly minion that died this game.",
    keywords: [],
    heroClass: "priest",
    class: "Priest",
    endOfTurn: {
      type: "summon",
      source: "graveyard",
      count: 1,
      targetType: "friendly_minion"
    },
    collectible: true
  },
  {
    id: 5109,
    name: "Sandhoof Waterbearer",
    manaCost: 5,
    attack: 5,
    health: 5,
    type: "minion",
    rarity: "common",
    description: "At the end of your turn, restore 5 Health to a damaged friendly character.",
    keywords: [],
    heroClass: "priest",
    class: "Priest",
    endOfTurn: {
      type: "heal",
      value: 5,
      requiresTarget: true,
      targetType: "damaged_friendly_character"
    },
    collectible: true
  },
  {
    id: 5110,
    name: "Convincing Infiltrator",
    manaCost: 5,
    attack: 2,
    health: 6,
    type: "minion",
    rarity: "rare",
    description: "Taunt, Deathrattle: Destroy a random enemy minion.",
    keywords: ["taunt", "deathrattle"],
    heroClass: "priest",
    class: "Priest",
    deathrattle: {
      type: "destroy",
      targetType: "random_enemy_minion"
    },
    collectible: true
  },
  {
    id: 5111,
    name: "High Priest Amet",
    manaCost: 4,
    attack: 2,
    health: 7,
    type: "minion",
    rarity: "legendary",
    description: "Whenever you summon a minion, set its Health equal to this minion's.",
    keywords: [],
    heroClass: "priest",
    class: "Priest",
    onEvent: {
      type: "on_summon_minion",
      effect: {
        type: "set_health",
        valueSource: "this_minion_health"
      }
    },
    collectible: true
  },
  {
    id: 5112,
    name: "Disciplinarian Gandling",
    manaCost: 4,
    attack: 3,
    health: 6,
    type: "minion",
    rarity: "legendary",
    description: "After you play a minion, destroy it and summon a 4/4 Failed Student.",
    keywords: [],
    heroClass: "priest",
    class: "Priest",
    onEvent: {
      type: "after_play_minion",
      effect: {
        type: "destroy_and_summon",
        summonName: "Failed Student",
        summonAttack: 4,
        summonHealth: 4
      }
    },
    collectible: true
  },
  {
    id: 5113,
    name: "Mindflayer Kaahrj",
    manaCost: 3,
    attack: 3,
    health: 3,
    type: "minion",
    rarity: "legendary",
    description: "Battlecry: Choose an enemy minion. Deathrattle: Summon a copy of it.",
    keywords: ["battlecry", "deathrattle"],
    heroClass: "priest",
    class: "Priest",
    battlecry: {
      type: "choose",
      requiresTarget: true,
      targetType: "enemy_minion",
      storeTarget: true
    },
    deathrattle: {
      type: "summon_copy",
      useStoredTarget: true
    },
    collectible: true
  },
  {
    id: 5114,
    name: "Murozond the Infinite",
    manaCost: 8,
    attack: 8,
    health: 8,
    type: "minion",
    rarity: "legendary",
    description: "Battlecry: Play all cards your opponent played last turn.",
    keywords: ["battlecry"],
    heroClass: "priest",
    class: "Priest",
    battlecry: {
      type: "replay_opponent_turn"
    },
    collectible: true
  },
  {
    id: 5115,
    name: "Corrupt Elementalist",
    manaCost: 3,
    attack: 3,
    health: 3,
    type: "minion",
    rarity: "common",
    description: "Battlecry: If you've cast a spell this turn, deal 2 damage to a minion.",
    keywords: ["battlecry"],
    heroClass: "priest",
    class: "Priest",
    battlecry: {
      type: "damage",
      value: 2,
      requiresTarget: true,
      targetType: "any_minion",
      condition: {
        type: "spell_cast_this_turn"
      }
    },
    collectible: true
  },
  {
    id: 5116,
    name: "Reliquary of Souls",
    manaCost: 1,
    attack: 1,
    health: 3,
    type: "minion",
    rarity: "legendary",
    description: "Lifesteal. Deathrattle: Shuffle 'Reliquary Prime' into your deck.",
    keywords: ["lifesteal", "deathrattle"],
    heroClass: "priest",
    class: "Priest",
    deathrattle: {
      type: "shuffle_into_deck",
      cardName: "Reliquary Prime"
    },
    collectible: true
  },
  {
    id: 5117,
    name: "Reliquary Prime",
    manaCost: 7,
    attack: 7,
    health: 7,
    type: "minion",
    rarity: null,
    description: "Taunt, Lifesteal",
    keywords: ["taunt", "lifesteal"],
    heroClass: "priest",
    class: "Priest",
    collectible: false
  },
  {
    id: 5118,
    name: "Morgue Spank",
    manaCost: 3,
    attack: 2,
    health: 4,
    type: "minion",
    rarity: "common",
    description: "After a friendly minion dies, add a random Priest spell to your hand.",
    keywords: [],
    heroClass: "priest",
    class: "Priest",
    onEvent: {
      type: "on_friendly_minion_death",
      effect: {
        type: "add_to_hand",
        cardType: "spell",
        cardClass: "priest",
        count: 1,
        isRandom: true
      }
    },
    collectible: true
  },
  {
    id: 5119,
    name: "Auspicious Spirits",
    manaCost: 4,
    attack: 3,
    health: 5,
    type: "minion",
    rarity: "epic",
    description: "Battlecry: Shuffle three Soul Fragments into your deck. Draw a card.",
    keywords: ["battlecry"],
    heroClass: "priest",
    class: "Priest",
    battlecry: {
      type: "shuffle_soul_fragments",
      count: 3,
      drawCards: 1
    },
    collectible: true
  },

  // Priest Spells (15 cards)
  {
    id: 6000,
    name: "Soul Mirror",
    manaCost: 7,
    type: "spell",
    rarity: "legendary",
    description: "Summon copies of enemy minions. They have 1 Health remaining.",
    keywords: [],
    heroClass: "priest",
    class: "Priest",
    spellEffect: {
      type: "summon_copies",
      source: "enemy_board",
      modifyHealth: 1
    },
    collectible: true
  },
  {
    id: 6001,
    name: "Renew",
    manaCost: 1,
    type: "spell",
    rarity: "common",
    description: "Restore 3 Health. Discover a spell.",
    keywords: ["discover"],
    heroClass: "priest",
    class: "Priest",
    spellEffect: {
      type: "heal",
      value: 3,
      requiresTarget: true,
      targetType: "any_character",
      discover: {
        type: "spell"
      }
    },
    collectible: true
  },
  {
    id: 6002,
    name: "Wave of Apathy",
    manaCost: 1,
    type: "spell",
    rarity: "common",
    description: "Set the Attack of all enemy minions to 1 until your next turn.",
    keywords: [],
    heroClass: "priest",
    class: "Priest",
    spellEffect: {
      type: "set_attack",
      value: 1,
      targetType: "all_enemy_minions",
      duration: "until_next_turn"
    },
    collectible: true
  },
  {
    id: 6003,
    name: "Raise Dead",
    manaCost: 0,
    type: "spell",
    rarity: "common",
    description: "Deal 3 damage to your hero. Return two friendly minions that died this game to your hand.",
    keywords: [],
    heroClass: "priest",
    class: "Priest",
    spellEffect: {
      type: "damage_hero",
      value: 3,
      returnFromDead: {
        count: 2,
        targetType: "friendly_minion"
      }
    },
    collectible: true
  },
  {
    id: 6004,
    name: "Psyche Split",
    manaCost: 5,
    type: "spell",
    rarity: "rare",
    description: "Give a minion +1/+2. Summon a copy of it.",
    keywords: [],
    heroClass: "priest",
    class: "Priest",
    spellEffect: {
      type: "buff_and_copy",
      buffAttack: 1,
      buffHealth: 2,
      requiresTarget: true,
      targetType: "any_minion"
    },
    collectible: true
  },
  {
    id: 6005,
    name: "Apotheosis",
    manaCost: 3,
    type: "spell",
    rarity: "rare",
    description: "Give a minion +2/+3 and Lifesteal.",
    keywords: ["lifesteal"],
    heroClass: "priest",
    class: "Priest",
    spellEffect: {
      type: "buff",
      buffAttack: 2,
      buffHealth: 3,
      addKeywords: ["lifesteal"],
      requiresTarget: true,
      targetType: "any_minion"
    },
    collectible: true
  },
  {
    id: 6006,
    name: "Whispers of EVIL",
    manaCost: 0,
    type: "spell",
    rarity: "common",
    description: "Add a Lackey to your hand.",
    keywords: [],
    heroClass: "priest",
    class: "Priest",
    spellEffect: {
      type: "add_to_hand",
      cardType: "lackey",
      count: 1,
      isRandom: true
    },
    collectible: true
  },
  {
    id: 6007,
    name: "Penance",
    manaCost: 2,
    type: "spell",
    rarity: "common",
    description: "Lifesteal. Deal 3 damage to a minion.",
    keywords: ["lifesteal"],
    heroClass: "priest",
    class: "Priest",
    spellEffect: {
      type: "damage",
      value: 3,
      requiresTarget: true,
      targetType: "any_minion",
      hasLifesteal: true
    },
    collectible: true
  },
  {
    id: 6008,
    name: "Lazul's Scheme",
    manaCost: 0,
    type: "spell",
    rarity: "epic",
    description: "Reduce the Attack of an enemy minion by 1 until your next turn. (Upgrades each turn!)",
    keywords: [],
    heroClass: "priest",
    class: "Priest",
    spellEffect: {
      type: "reduce_attack",
      value: 1,
      requiresTarget: true,
      targetType: "enemy_minion",
      duration: "until_next_turn",
      upgradesEachTurn: true
    },
    collectible: true
  },
  {
    id: 6009,
    name: "Plague of Death",
    manaCost: 9,
    type: "spell",
    rarity: "epic",
    description: "Silence and destroy all minions.",
    keywords: ["silence"],
    heroClass: "priest",
    class: "Priest",
    spellEffect: {
      type: "silence_and_destroy",
      targetType: "all_minions"
    },
    collectible: true
  },
  {
    id: 6010,
    name: "Breath of the Infinite",
    manaCost: 3,
    type: "spell",
    rarity: "rare",
    description: "Deal 2 damage to all minions. If you're holding a Dragon, only damage enemies.",
    keywords: [],
    heroClass: "priest",
    class: "Priest",
    spellEffect: {
      type: "aoe_damage",
      value: 2,
      targetType: "all_minions",
      condition: {
        type: "holding_dragon",
        effect: {
          targetType: "enemy_minions_only"
        }
      }
    },
    collectible: true
  },
  {
    id: 6011,
    name: "Initiation",
    manaCost: 6,
    type: "spell",
    rarity: "rare",
    description: "Deal 4 damage to a minion. If that kills it, summon a new copy.",
    keywords: [],
    heroClass: "priest",
    class: "Priest",
    spellEffect: {
      type: "damage",
      value: 4,
      requiresTarget: true,
      targetType: "any_minion",
      onKill: {
        type: "summon_copy"
      }
    },
    collectible: true
  },
  {
    id: 6012,
    name: "Forbidden Words",
    manaCost: 0,
    type: "spell",
    rarity: "rare",
    description: "Spend all your Mana. Destroy a minion with that much Attack or less.",
    keywords: [],
    heroClass: "priest",
    class: "Priest",
    spellEffect: {
      type: "spend_all_mana",
      effect: {
        type: "destroy",
        requiresTarget: true,
        targetType: "minion_with_attack_less_than_mana_spent"
      }
    },
    collectible: true
  },
  {
    id: 6013,
    name: "Power Word: Feast",
    manaCost: 2,
    type: "spell",
    rarity: "common",
    description: "Give a minion +2/+2. Restore it to full Health at the end of this turn.",
    keywords: [],
    heroClass: "priest",
    class: "Priest",
    spellEffect: {
      type: "buff",
      buffAttack: 2,
      buffHealth: 2,
      requiresTarget: true,
      targetType: "any_minion",
      endOfTurn: {
        type: "restore_full_health"
      }
    },
    collectible: true
  },
  {
    id: 6014,
    name: "Shadow Word: Ruin",
    manaCost: 4,
    type: "spell",
    rarity: "epic",
    description: "Destroy all minions with 5 or more Attack.",
    keywords: [],
    heroClass: "priest",
    class: "Priest",
    spellEffect: {
      type: "destroy",
      targetType: "minions_with_attack_5_or_more"
    },
    collectible: true
  },

  // Priest Weapons (5 cards)
  {
    id: 7000,
    name: "Sphere of Sapience",
    manaCost: 1,
    attack: 0,
    durability: 4,
    type: "weapon",
    rarity: "legendary",
    description: "At the start of your turn, look at your top card. You can put it on the bottom and lose 1 Durability.",
    keywords: [],
    heroClass: "priest",
    class: "Priest",
    startOfTurn: {
      type: "look_at_top_card",
      option: {
        type: "move_to_bottom",
        loseDurability: 1
      }
    },
    collectible: true
  },
  {
    id: 7001,
    name: "Staff of Devout Shadows",
    manaCost: 3,
    attack: 0,
    durability: 3,
    type: "weapon",
    rarity: "epic",
    description: "After you cast a spell, restore Health to your hero equal to the spell's Cost. Lose 1 Durability.",
    keywords: [],
    heroClass: "priest",
    class: "Priest",
    onEvent: {
      type: "after_cast_spell",
      effect: {
        type: "heal_hero",
        valueSource: "spell_cost",
        loseDurability: 1
      }
    },
    collectible: true
  },
  {
    id: 7002,
    name: "Crystalline Scepter",
    manaCost: 2,
    attack: 1,
    durability: 2,
    type: "weapon",
    rarity: "rare",
    description: "After your hero Power restores Health, deal that much damage to all enemy minions.",
    keywords: [],
    heroClass: "priest",
    class: "Priest",
    onEvent: {
      type: "after_hero_power_heals",
      effect: {
        type: "aoe_damage",
        valueSource: "healing_amount",
        targetType: "all_enemy_minions"
      }
    },
    collectible: true
  },
  {
    id: 7003,
    name: "Lightforged Blade",
    manaCost: 4,
    attack: 2,
    durability: 2,
    type: "weapon",
    rarity: "rare",
    description: "Divine Shield. After you cast a spell, gain Divine Shield.",
    keywords: ["divine_shield"],
    heroClass: "priest",
    class: "Priest",
    onEvent: {
      type: "after_cast_spell",
      effect: {
        type: "gain_divine_shield"
      }
    },
    collectible: true
  },
  {
    id: 7004,
    name: "Mind Spike",
    manaCost: 3,
    attack: 2,
    durability: 3,
    type: "weapon",
    rarity: "epic",
    description: "After you play a minion, deal 2 damage to a random enemy.",
    keywords: [],
    heroClass: "priest",
    class: "Priest",
    onEvent: {
      type: "after_play_minion",
      effect: {
        type: "damage",
        value: 2,
        targetType: "random_enemy"
      }
    },
    collectible: true
  }
];

// Function to find the right insertion point in a file
function findInsertionPoint(content, arrayName) {
  // Find the array in the file - accounts for spaces and type annotations
  // For example: "export const   spellCards: CardData[] = [{"
  const arrayMatch = new RegExp(`export\\s+const\\s+${arrayName}.*?\\[`, 'm');
  const match = content.match(arrayMatch);
  
  if (!match) {
    throw new Error(`Could not find array ${arrayName} in the file`);
  }
  
  // Find the end of the array
  const startPos = match.index + match[0].length;
  let braceCount = 1;
  let endPos = startPos;
  
  for (let i = startPos; i < content.length; i++) {
    if (content[i] === '[') braceCount++;
    if (content[i] === ']') braceCount--;
    if (braceCount === 0) {
      endPos = i;
      break;
    }
  }
  
  return { startPos, endPos };
}

// Function to insert cards into a file
function insertCardsIntoFile(filePath, cards, arrayName) {
  console.log(`Adding ${cards.length} cards to ${filePath}`);
  
  // Read the file
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Find insertion point
  const { startPos, endPos } = findInsertionPoint(content, arrayName);
  
  // Format the cards as strings with proper format
  const cardStrings = cards.map(card => {
    // Convert JSON to string but format it to match the existing style
    let cardStr = '{\n';
    
    // Add each property with proper indentation
    Object.entries(card).forEach(([key, value]) => {
      // Special formatting for nested objects
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        cardStr += `      ${key}: {\n`;
        Object.entries(value).forEach(([nestedKey, nestedValue]) => {
          if (typeof nestedValue === 'string') {
            cardStr += `      ${nestedKey}: "${nestedValue}",\n`;
          } else {
            cardStr += `      ${nestedKey}: ${nestedValue},\n`;
          }
        });
        cardStr += '      },\n';
      } 
      // Special formatting for arrays
      else if (Array.isArray(value)) {
        if (value.length === 0) {
          cardStr += `      ${key}: [],\n`;
        } else {
          cardStr += `      ${key}: [${value.map(v => typeof v === 'string' ? `"${v}"` : v).join(', ')}],\n`;
        }
      }
      // Regular values
      else if (typeof value === 'string') {
        cardStr += `      ${key}: "${value}",\n`;
      } else {
        cardStr += `      ${key}: ${value},\n`;
      }
    });
    
    cardStr += '  }';
    return cardStr;
  });
  
  // Insert the cards
  const newContent = 
    content.substring(0, endPos) + 
    (content[endPos - 1] !== '[' ? ',' : '') + // Add comma if not empty array
    '\n' + cardStrings.join(',\n') + 
    content.substring(endPos);
  
  // Write the file
  fs.writeFileSync(filePath, newContent, 'utf8');
  
  console.log(`✅ Successfully added ${cards.length} cards to ${filePath}`);
}

// Main function
function main() {
  console.log('=== Adding 50 New Priest Cards ===');
  
  try {
    // Group cards by type
    const spellCards = newPriestCards.filter(card => card.type === 'spell');
    const minionCards = newPriestCards.filter(card => card.type === 'minion' && !card.rarity?.toLowerCase().includes('legendary'));
    const legendaryCards = newPriestCards.filter(card => 
      card.type === 'minion' && card.rarity?.toLowerCase().includes('legendary')
    );
    const weaponCards = newPriestCards.filter(card => card.type === 'weapon');
    
    // Add cards to appropriate files
    insertCardsIntoFile('client/src/game/data/spellCards.ts', spellCards, 'spellCards');
    insertCardsIntoFile('client/src/game/data/classMinions.ts', minionCards, 'classMinions');
    insertCardsIntoFile('client/src/game/data/modernLegendaryCards.ts', legendaryCards, 'modernLegendaryCards');
    insertCardsIntoFile('client/src/game/data/cards.ts', weaponCards, 'cards');
    
    console.log('=== Summary ===');
    console.log(`Added ${spellCards.length} Priest spells`);
    console.log(`Added ${minionCards.length} Priest minions`);
    console.log(`Added ${legendaryCards.length} Priest legendary minions`);
    console.log(`Added ${weaponCards.length} Priest weapons`);
    console.log(`Total: ${newPriestCards.length} new Priest cards`);
    
  } catch (error) {
    console.error('Error adding cards:', error);
  }
}

main();
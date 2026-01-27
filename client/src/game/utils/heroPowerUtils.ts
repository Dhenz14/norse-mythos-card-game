import { HeroClass, HeroPower, GameState, CardInstance, Position, CardData, CardRarity, CardType, CardKeyword } from '../types';
import { updateEnrageEffects } from './enrageUtils';
import { destroyCard } from './zoneUtils';
import { drawCard } from './deckUtils';
import { handleInspireEffects } from './mechanicsUtils';
import { NORSE_HEROES } from '../data/norseHeroes/heroDefinitions';

// Type for animation callback function
// Used to trigger animations when hero power is used
type AnimationCallback = (position: Position, heroClass: HeroClass) => void;

/**
 * Hero Power upgrade interface for upgraded versions
 */
export interface HeroPowerUpgrade {
  name: string;
  description: string;
  requiresSourceCard?: boolean; // Does this upgrade require a specific source card?
  sourceCardName?: string; // Name of the card that grants this upgrade (e.g., "Justicar Trueheart")
}

/**
 * Get the default hero power for a given hero class
 */
export function getDefaultHeroPower(heroClass: HeroClass): HeroPower {
  // Check if we have a Norse hero definition for this class
  // For Odin (Mage class), we want Wisdom of the Ravens
  const odin = NORSE_HEROES['hero-odin'];
  switch (heroClass) {
    case 'mage':
      return {
        name: odin.heroPower.name,
        description: odin.heroPower.description,
        cost: odin.heroPower.cost,
        used: false,
        class: 'mage'
      };
    case 'warrior':
      return {
        name: 'Armor Up!',
        description: 'Gain 2 armor.',
        cost: 2,
        used: false,
        class: 'warrior'
      };
    case 'paladin':
      return {
        name: 'Reinforce',
        description: 'Summon a 1/1 Silver Hand Recruit.',
        cost: 2,
        used: false,
        class: 'paladin'
      };
    case 'hunter':
      return {
        name: 'Steady Shot',
        description: 'Deal 2 damage to the enemy hero.',
        cost: 2,
        used: false,
        class: 'hunter'
      };
    case 'druid':
      return {
        name: 'Shapeshift',
        description: 'Gain 1 Attack this turn and 1 Armor.',
        cost: 2,
        used: false,
        class: 'druid'
      };
    case 'priest':
      return {
        name: 'Lesser Heal',
        description: 'Restore 2 Health to any target.',
        cost: 2,
        used: false,
        class: 'priest'
      };
    case 'warlock':
      return {
        name: 'Life Tap',
        description: 'Draw a card and take 2 damage.',
        cost: 2,
        used: false,
        class: 'warlock'
      };
    case 'shaman':
      return {
        name: 'Totemic Call',
        description: 'Summon a random basic Totem.',
        cost: 2,
        used: false,
        class: 'shaman'
      };
    case 'rogue':
      return {
        name: 'Dagger Mastery',
        description: 'Equip a 1/2 Dagger.',
        cost: 2,
        used: false,
        class: 'rogue'
      };
    case 'demonhunter':
      return {
        name: 'Demon Claws',
        description: 'Gain +1 Attack this turn.',
        cost: 1, // Demon Hunter's hero power costs 1 mana
        used: false,
        class: 'demonhunter'
      };
    default:
      // Default to mage if something goes wrong
      return {
        name: 'Fireblast',
        description: 'Deal 1 damage to any target.',
        cost: 2,
        used: false,
        class: 'mage'
      };
  }
}

/**
 * Get an upgraded hero power for a given hero class
 * These are usually granted by cards like Justicar Trueheart or through quests
 */
export function getUpgradedHeroPower(heroClass: HeroClass): HeroPower {
  // Check for Odin's upgraded power
  const odin = NORSE_HEROES['hero-odin'];
  if (heroClass === 'mage' && odin?.upgradedHeroPower) {
    return {
      name: odin.upgradedHeroPower.name,
      description: odin.upgradedHeroPower.description,
      cost: odin.upgradedHeroPower.cost,
      used: false,
      class: 'mage',
      isUpgraded: true
    };
  }

  switch (heroClass) {
    case 'mage':
      return {
        name: 'Fireblast Rank 2',
        description: 'Deal 2 damage to any target.',
        cost: 2,
        used: false,
        class: 'mage',
        isUpgraded: true
      };
    case 'warrior':
      return {
        name: 'Tank Up!',
        description: 'Gain 4 armor.',
        cost: 2,
        used: false,
        class: 'warrior',
        isUpgraded: true
      };
    case 'paladin':
      return {
        name: 'The Silver Hand',
        description: 'Summon two 1/1 Silver Hand Recruits.',
        cost: 2,
        used: false,
        class: 'paladin',
        isUpgraded: true
      };
    case 'hunter':
      return {
        name: 'Ballista Shot',
        description: 'Deal 3 damage to the enemy hero.',
        cost: 2,
        used: false,
        class: 'hunter',
        isUpgraded: true
      };
    case 'druid':
      return {
        name: 'Dire Shapeshift',
        description: 'Gain 2 Attack this turn and 2 Armor.',
        cost: 2,
        used: false,
        class: 'druid',
        isUpgraded: true
      };
    case 'priest':
      return {
        name: 'Heal',
        description: 'Restore 4 Health to any target.',
        cost: 2,
        used: false,
        class: 'priest',
        isUpgraded: true
      };
    case 'warlock':
      return {
        name: 'Soul Tap',
        description: 'Draw a card.',
        cost: 2,
        used: false,
        class: 'warlock',
        isUpgraded: true
      };
    case 'shaman':
      return {
        name: 'Totemic Slam',
        description: 'Summon a Totem of your choice.',
        cost: 2,
        used: false,
        class: 'shaman',
        isUpgraded: true
      };
    case 'rogue':
      return {
        name: 'Poisoned Daggers',
        description: 'Equip a 2/2 Dagger.',
        cost: 2,
        used: false,
        class: 'rogue',
        isUpgraded: true
      };
    case 'demonhunter':
      return {
        name: 'Demon\'s Bite',
        description: 'Gain +2 Attack this turn.',
        cost: 1,
        used: false,
        class: 'demonhunter',
        isUpgraded: true
      };
    default:
      return getDefaultHeroPower(heroClass);
  }
}

/**
 * Execute hero power based on the player's hero class
 */
export function executeHeroPower(
  state: GameState, 
  playerType: 'player' | 'opponent',
  targetId?: string, // Card ID or 'hero' for the opponent's hero
  targetType?: 'card' | 'hero', // Type of the target
  targetPosition?: Position, // Position for animation effects
  onHeroPowerAnimation?: AnimationCallback // Optional callback for animation effects
): GameState {
  // Deep clone the state to avoid mutation
  const newState = JSON.parse(JSON.stringify(state)) as GameState;
  const player = newState.players[playerType];
  
  // Check if hero power can be used
  if (player.heroPower.used) {
    console.error('Hero power already used this turn');
    return state;
  }
  
  // Check if player has enough mana
  if (player.mana.current < player.heroPower.cost) {
    console.error(`Not enough mana. Need ${player.heroPower.cost} but only have ${player.mana.current}`);
    return state;
  }
  
  // Execute the hero power based on class
  const heroClass = player.heroClass;
  
  // Trigger hero power animation if callback and target position are provided
  if (onHeroPowerAnimation && targetPosition) {
    onHeroPowerAnimation(targetPosition, heroClass);
  }
  
  let updatedState;
  
  // SPECIAL HANDLING: If the current hero has a custom Norse Hero definition, use it
  const heroId = player.hero?.id;
  const norseHero = heroId ? NORSE_HEROES[heroId] : null;

  if (norseHero) {
    console.log(`[HERO-POWER] Executing Norse Hero Power for ${norseHero.name}: ${norseHero.heroPower.name}`);
    updatedState = executeNorseHeroPower(newState, playerType, norseHero, targetId, targetType);
  } else {
    // Execute the appropriate default hero power based on class
    switch (heroClass) {
      case 'mage':
        updatedState = executeMagePower(newState, playerType, targetId, targetType);
        break;
      case 'warrior':
        updatedState = executeWarriorPower(newState, playerType);
        break;
      case 'paladin':
        updatedState = executePaladinPower(newState, playerType);
        break;
      case 'hunter':
        updatedState = executeHunterPower(newState, playerType);
        break;
      case 'druid':
        updatedState = executeDruidPower(newState, playerType);
        break;
      case 'priest':
        updatedState = executePriestPower(newState, playerType, targetId, targetType);
        break;
      case 'warlock':
        updatedState = executeWarlockPower(newState, playerType);
        break;
      case 'shaman':
        updatedState = executeShamanPower(newState, playerType);
        break;
      case 'rogue':
        updatedState = executeRoguePower(newState, playerType);
        break;
      case 'demonhunter':
        updatedState = executeDemonHunterPower(newState, playerType);
        break;
      default:
        console.error('Unknown hero class');
        return state;
    }
  }
  
  // Process any Inspire effects after hero power execution
  console.log(`[INSPIRE] Processing Inspire effects after ${playerType} used hero power`);
  updatedState = handleInspireEffects(updatedState, playerType);
  
  return updatedState;
}

/**
 * Execute custom Norse hero powers (like Odin's Wisdom of the Ravens)
 */
function executeNorseHeroPower(
  state: GameState,
  playerType: 'player' | 'opponent',
  hero: NorseHero,
  targetId?: string,
  targetType?: 'card' | 'hero'
): GameState {
  const player = state.players[playerType];
  const power = player.heroPower.isUpgraded ? hero.upgradedHeroPower : hero.heroPower;
  
  if (!power) {
    console.error('Norse hero power not found');
    return state;
  }

  // Apply cost and mark as used
  player.mana.current -= player.heroPower.cost;
  player.heroPower.used = true;

  // Execute based on effectType
  // Simplified implementation for Odin's Wisdom of the Ravens (Draw + Reveal)
  if (hero.id === 'hero-odin') {
    const drawCount = power.value || 1;
    console.log(`[ODIN-POWER] Wisdom of the Ravens: Drawing ${drawCount} card(s)`);
    for (let i = 0; i < drawCount; i++) {
      state = drawCard(state, playerType);
    }
    // Reveal logic would be implemented here in a more complex state management system
    return state;
  }

  // Fallback to class default if effectType is not explicitly handled for this hero
  switch (player.heroClass) {
    case 'mage': return executeMagePower(state, playerType, targetId, targetType);
    case 'warrior': return executeWarriorPower(state, playerType);
    case 'paladin': return executePaladinPower(state, playerType);
    case 'hunter': return executeHunterPower(state, playerType);
    case 'druid': return executeDruidPower(state, playerType);
    case 'priest': return executePriestPower(state, playerType, targetId, targetType);
    case 'warlock': return executeWarlockPower(state, playerType);
    case 'shaman': return executeShamanPower(state, playerType);
    case 'rogue': return executeRoguePower(state, playerType);
    case 'demonhunter': return executeDemonHunterPower(state, playerType);
    default: return state;
  }
}

/**
 * Mage hero power: Deal 1 damage to any target
 */
function executeMagePower(
  state: GameState, 
  playerType: 'player' | 'opponent',
  targetId?: string,
  targetType?: 'card' | 'hero'
): GameState {
  const player = state.players[playerType];
  const opponentType = playerType === 'player' ? 'opponent' : 'player';
  const opponent = state.players[opponentType];
  
  // SPECIAL HANDLING: Odin's Wisdom of the Ravens (Mage Class but no target needed)
  if (player.hero?.id === 'hero-odin') {
    // Check if hero power can be used
    if (player.heroPower.used) {
      console.error('Hero power already used this turn');
      return state;
    }
    
    // Check if player has enough mana
    if (player.mana.current < player.heroPower.cost) {
      console.error(`Not enough mana. Need ${player.heroPower.cost} but only have ${player.mana.current}`);
      return state;
    }

    // Apply cost
    player.mana.current -= player.heroPower.cost;
    player.heroPower.used = true;
    
    // Odin's effect: Draw a card (Reveal logic would go here)
    const drawCount = player.heroPower.isUpgraded ? 2 : 1;
    console.log(`[ODIN-POWER] Executing for ${playerType}: Drawing ${drawCount} cards`);
    let updatedState = state;
    for (let i = 0; i < drawCount; i++) {
      updatedState = drawCard(updatedState, playerType);
    }
    return updatedState;
  }

  // Mage power requires a target
  if (!targetId || !targetType) {
    console.error('Mage power requires a target');
    return state;
  }
  
  // Apply cost
  player.mana.current -= player.heroPower.cost;
  player.heroPower.used = true;
  
  // Deal 1 damage to the target
  if (targetType === 'hero') {
    // Damage the opponent's hero using the proper heroHealth property
    opponent.heroHealth = Math.max(0, (opponent.heroHealth || 30) - 1);
    console.log(`Mage hero power deals 1 damage to ${opponentType}`);
    
    // Check for game over
    if (opponent.heroHealth <= 0) {
      state.gamePhase = "game_over";
      state.winner = playerType;
      console.log(`Game over - ${playerType} wins!`);
    }
  } else {
    // Find the target card
    const targetField = targetId.startsWith(playerType) 
      ? player.battlefield
      : opponent.battlefield;
    
    const targetIndex = targetField.findIndex(card => card.instanceId === targetId);
    
    if (targetIndex === -1) {
      console.error('Target card not found');
      return state;
    }
    
    // Get the target card
    const targetCard = targetField[targetIndex];
    if (!targetCard.currentHealth) {
      console.error('Target card has no health property');
      return state;
    }
    
    // Deal 1 damage
    targetCard.currentHealth -= 1;
    console.log(`Mage hero power deals 1 damage to ${targetCard.card.name}`);
    
    // Apply enrage effects
    state = updateEnrageEffects(state);
    
    // Check if the minion is destroyed
    if (targetCard.currentHealth <= 0) {
      const cardName = targetCard.card.name;
      const cardId = targetCard.instanceId;
      const targetPlayerType = targetId.startsWith(playerType) ? playerType : opponentType;
      
      console.log(`${cardName} is destroyed by hero power`);
      
      // Use the imported destroyCard function
      state = destroyCard(state, cardId, targetPlayerType);
    }
  }
  
  return state;
}

/**
 * Warrior hero power: Gain 2 armor
 * 
 * Note: We'll simplify this to just add 2 health since we don't have an armor system
 */
function executeWarriorPower(state: GameState, playerType: 'player' | 'opponent'): GameState {
  const player = state.players[playerType];
  
  // Apply cost
  player.mana.current -= player.heroPower.cost;
  player.heroPower.used = true;
  
  // Gain 2 health (simplified version of armor)
  player.heroHealth = Math.min((player.heroHealth || 30) + 2, 30);
  console.log(`Warrior hero power adds 2 health to ${playerType}`);
  
  return state;
}

/**
 * Paladin hero power: Summon a 1/1 Silver Hand Recruit
 */
function executePaladinPower(state: GameState, playerType: 'player' | 'opponent'): GameState {
  const player = state.players[playerType];
  
  // Check if the battlefield is full (max 7 minions)
  if (player.battlefield.length >= 7) {
    console.error('Battlefield is full, cannot summon recruit');
    return state;
  }
  
  // Apply cost
  player.mana.current -= player.heroPower.cost;
  player.heroPower.used = true;
  
  // Create a 1/1 Silver Hand Recruit
  const recruit: CardInstance = {
    instanceId: `${playerType}_recruit_${Date.now()}`,
    card: {
      id: 9999, // Special ID for Silver Hand Recruit
      name: 'Silver Hand Recruit',
      manaCost: 1,
      attack: 1,
      health: 1,
      description: 'Summoned by Paladin hero power',
      rarity: 'common',
      type: 'minion', // Need to specify card type
      keywords: [] // No special abilities
    },
    currentHealth: 1,
    canAttack: false, // Cannot attack on the turn it's summoned
    isPlayed: true,
    isSummoningSick: true,
    attacksPerformed: 0, // New property for Windfury tracking
    hasDivineShield: false
  };
  
  // Add the recruit to the battlefield
  player.battlefield.push(recruit);
  console.log(`Paladin hero power summons a 1/1 Silver Hand Recruit`);
  
  return state;
}

/**
 * Hunter hero power: Deal 2 damage to the enemy hero
 */
function executeHunterPower(state: GameState, playerType: 'player' | 'opponent'): GameState {
  const player = state.players[playerType];
  const opponentType = playerType === 'player' ? 'opponent' : 'player';
  const opponent = state.players[opponentType];
  
  // Apply cost
  player.mana.current -= player.heroPower.cost;
  player.heroPower.used = true;
  
  // Deal 2 damage to enemy hero using the proper heroHealth property
  opponent.heroHealth = Math.max(0, (opponent.heroHealth || 30) - 2);
  console.log(`Hunter hero power deals 2 damage to ${opponentType}`);
  
  // Check for game over
  if (opponent.heroHealth <= 0) {
    state.gamePhase = "game_over";
    state.winner = playerType;
    console.log(`Game over - ${playerType} wins!`);
  }
  
  return state;
}

/**
 * Druid hero power: Gain 1 Attack this turn and 1 Armor
 */
function executeDruidPower(state: GameState, playerType: 'player' | 'opponent'): GameState {
  const player = state.players[playerType];
  
  // Apply cost
  player.mana.current -= player.heroPower.cost;
  player.heroPower.used = true;
  
  // Gain 1 attack (we'll track this as a temp stat for this turn)
  if (!player.tempStats) {
    player.tempStats = { attack: 0 };
  }
  player.tempStats.attack = (player.tempStats.attack || 0) + 1;
  
  // Gain 1 armor 
  player.heroArmor = (player.heroArmor || 0) + 1;
  
  console.log(`Druid hero power gives ${playerType} +1 Attack this turn and +1 Armor`);
  
  return state;
}

/**
 * Priest hero power: Restore 2 Health to any target
 */
function executePriestPower(
  state: GameState,
  playerType: 'player' | 'opponent',
  targetId?: string,
  targetType?: 'card' | 'hero'
): GameState {
  const player = state.players[playerType];
  const opponentType = playerType === 'player' ? 'opponent' : 'player';
  const opponent = state.players[opponentType];
  
  // Priest power requires a target
  if (!targetId || !targetType) {
    console.error('Priest power requires a target');
    return state;
  }
  
  // Apply cost
  player.mana.current -= player.heroPower.cost;
  player.heroPower.used = true;
  
  // Heal depending on target type
  if (targetType === 'hero') {
    const targetHero = targetId === 'player' ? state.players.player : state.players.opponent;
    
    // Heal the hero
    targetHero.heroHealth = Math.min((targetHero.heroHealth || 30) + 2, 30); // Cap at 30 health
    console.log(`Priest hero power heals ${targetId} for 2 health`);
  } else {
    // Find the target card
    const targetField = targetId.startsWith(playerType) 
      ? player.battlefield
      : opponent.battlefield;
    
    const targetIndex = targetField.findIndex(card => card.instanceId === targetId);
    
    if (targetIndex === -1) {
      console.error('Target card not found');
      return state;
    }
    
    const targetCard = targetField[targetIndex];
    if (!targetCard.currentHealth) {
      console.error('Target card has no health property');
      return state;
    }
    
    const maxHealth = targetCard.card.health || 1;
    
    // Heal the card
    targetCard.currentHealth = Math.min(targetCard.currentHealth + 2, maxHealth);
    console.log(`Priest hero power heals ${targetCard.card.name} for 2 health`);
  }
  
  return state;
}

/**
 * Warlock hero power: Draw a card and take 2 damage
 */
function executeWarlockPower(state: GameState, playerType: 'player' | 'opponent'): GameState {
  const player = state.players[playerType];
  
  // Apply cost
  player.mana.current -= player.heroPower.cost;
  player.heroPower.used = true;
  
  // Take 2 damage
  player.heroHealth = Math.max(0, (player.heroHealth || 30) - 2);
  console.log(`Warlock hero power causes ${playerType} to take 2 damage`);
  
  // Check for game over (unlikely but possible if at 2 health)
  if (player.heroHealth <= 0) {
    state.gamePhase = "game_over";
    state.winner = playerType === 'player' ? 'opponent' : 'player';
    console.log(`Game over - ${state.winner} wins!`);
    return state;
  }
  
  // Draw a card
  state = drawCard(state, playerType);
  console.log(`Warlock hero power draws a card for ${playerType}`);
  
  return state;
}

/**
 * Shaman hero power: Summon a random basic Totem
 */
function executeShamanPower(state: GameState, playerType: 'player' | 'opponent'): GameState {
  const player = state.players[playerType];
  
  // Check if the battlefield is full (max 7 minions)
  if (player.battlefield.length >= 7) {
    console.error('Battlefield is full, cannot summon totem');
    return state;
  }
  
  // Apply cost
  player.mana.current -= player.heroPower.cost;
  player.heroPower.used = true;
  
  // Define the basic totems as proper CardData
  const basicTotems: CardData[] = [
    {
      id: 9001,
      name: 'Healing Totem',
      manaCost: 1,
      attack: 0,
      health: 2,
      description: 'At the end of your turn, restore 1 Health to all friendly minions.',
      rarity: 'common',
      type: 'minion',
      keywords: [],
      effects: [{ type: 'end_of_turn_heal', value: 1 }]
    } as CardData,
    {
      id: 9002,
      name: 'Searing Totem',
      manaCost: 1,
      attack: 1,
      health: 1,
      description: '',
      rarity: 'common',
      type: 'minion',
      keywords: []
    } as CardData,
    {
      id: 9003,
      name: 'Stoneclaw Totem',
      manaCost: 1,
      attack: 0,
      health: 2,
      description: 'Taunt',
      rarity: 'common',
      type: 'minion',
      keywords: ['taunt']
    } as CardData,
    {
      id: 9004,
      name: 'Wrath of Air Totem',
      manaCost: 1,
      attack: 0,
      health: 2,
      description: 'Spell Damage +1',
      rarity: 'common',
      type: 'minion',
      keywords: ['spell_damage'],
      spellDamage: 1
    } as CardData
  ];
  
  // Check which totems are already on the battlefield
  // Since 'totem' isn't a valid CardKeyword, we'll check by card name instead
  const existingTotemNames = player.battlefield
    .filter(card => card.card.name.includes('Totem'))
    .map(card => card.card.name);
  
  // Filter out totems that are already summoned
  const availableTotems = basicTotems.filter(totem => !existingTotemNames.includes(totem.name));
  
  // If all totems are already summoned, return
  if (availableTotems.length === 0) {
    console.log(`All basic totems are already summoned!`);
    return state;
  }
  
  // Randomly select one of the available totems
  const selectedTotem = availableTotems[Math.floor(Math.random() * availableTotems.length)];
  
  // Create a totem instance
  const totem: CardInstance = {
    instanceId: `${playerType}_totem_${Date.now()}`,
    card: selectedTotem,
    currentHealth: selectedTotem.health,
    canAttack: false, // Cannot attack on the turn it's summoned
    isPlayed: true,
    isSummoningSick: true,
    attacksPerformed: 0,
    hasDivineShield: false
  };
  
  // Add the totem to the battlefield
  player.battlefield.push(totem);
  console.log(`Shaman hero power summons a ${selectedTotem.name}`);
  
  return state;
}

/**
 * Rogue hero power: Equip a 1/2 Dagger
 */
function executeRoguePower(state: GameState, playerType: 'player' | 'opponent'): GameState {
  const player = state.players[playerType];
  
  // Apply cost
  player.mana.current -= player.heroPower.cost;
  player.heroPower.used = true;
  
  // Define the dagger weapon
  const dagger: CardInstance = {
    instanceId: `${playerType}_weapon_${Date.now()}`,
    card: {
      id: 9005,
      name: 'Wicked Knife',
      manaCost: 1,
      attack: 1,
      durability: 2,
      description: '',
      rarity: 'common',
      type: 'weapon',
      keywords: []  // Required by CardData type
    } as CardData,
    currentDurability: 2,
    canAttack: true,
    isPlayed: true,
    attacksPerformed: 0
  };
  
  // If player already has a weapon, destroy it
  if (player.weapon) {
    console.log(`${playerType}'s ${player.weapon.card.name} is destroyed`);
  }
  
  // Equip the dagger
  player.weapon = dagger;
  console.log(`Rogue hero power equips a 1/2 Wicked Knife`);
  
  return state;
}

/**
 * Demon Hunter hero power: Gain +1 Attack this turn
 */
function executeDemonHunterPower(state: GameState, playerType: 'player' | 'opponent'): GameState {
  const player = state.players[playerType];
  
  // Apply cost
  player.mana.current -= player.heroPower.cost;
  player.heroPower.used = true;
  
  // Gain 1 attack for this turn
  if (!player.tempStats) {
    player.tempStats = { attack: 0 };
  }
  player.tempStats.attack = (player.tempStats.attack || 0) + 1;
  
  console.log(`Demon Hunter hero power gives ${playerType} +1 Attack this turn`);
  
  return state;
}

/**
 * Reset hero power when the turn ends
 */
export function resetHeroPower(player: 'player' | 'opponent', state: GameState): GameState {
  const newState = JSON.parse(JSON.stringify(state)) as GameState;
  newState.players[player].heroPower.used = false;
  
  // Also reset temporary stats that were granted by hero powers
  if (newState.players[player].tempStats) {
    newState.players[player].tempStats.attack = 0;
  }
  
  return newState;
}
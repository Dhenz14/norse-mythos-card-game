/**
 * norseHeroPowerUtils.ts
 * 
 * Execution logic for Norse Hero powers in Ragnarok Poker.
 * Handles all hero power execution, weapon upgrades, and hero passives.
 */

import { GameState, CardInstance, CardData } from '../types';
import { NorseHero, NorseHeroPower, HeroPassiveTrigger, NorseHeroPassive } from '../types/NorseTypes';
import { ALL_NORSE_HEROES, getAnyHeroById } from '../data/norseHeroes';

/**
 * Helper to safely get attack from card data
 */
function getCardAttack(card: CardData): number {
  return (card as any).attack || 0;
}

/**
 * Helper to safely get health from card data
 */
function getCardHealth(card: CardData): number {
  return (card as any).health || 1;
}

/**
 * Get a Norse hero by ID
 */
export function getNorseHeroById(heroId: string): NorseHero | undefined {
  return getAnyHeroById(heroId);
}

/**
 * Check if player can use hero power
 */
export function canUseHeroPower(
  state: GameState,
  playerType: 'player' | 'opponent',
  heroId: string
): boolean {
  const hero = getNorseHeroById(heroId);
  if (!hero) return false;

  const player = state.players[playerType];
  
  // Check mana
  if (player.mana.current < hero.heroPower.cost) return false;
  
  // Check if already used this turn
  if (player.heroPower?.used) return false;
  
  return true;
}

/**
 * Execute a Norse hero power
 */
export function executeNorseHeroPower(
  state: GameState,
  playerType: 'player' | 'opponent',
  heroId: string,
  targetId?: string,
  isUpgraded: boolean = false
): GameState {
  const hero = getNorseHeroById(heroId);
  if (!hero) return state;

  const power = isUpgraded ? hero.upgradedHeroPower : hero.heroPower;
  
  let newState = JSON.parse(JSON.stringify(state)) as GameState;
  const player = newState.players[playerType];
  const opponentType = playerType === 'player' ? 'opponent' : 'player';
  const opponent = newState.players[opponentType];

  // Deduct mana
  player.mana.current -= power.cost;
  player.heroPower.used = true;

  console.log(`[NORSE HERO POWER] ${hero.name} uses ${power.name}`);

  // Execute based on effect type
  switch (power.effectType) {
    case 'damage_single':
      newState = executeDamageSingle(newState, playerType, targetId, power);
      break;
    case 'damage_aoe':
      newState = executeDamageAoE(newState, playerType, power);
      break;
    case 'damage_random':
      newState = executeDamageRandom(newState, playerType, power);
      break;
    case 'heal_single':
      newState = executeHealSingle(newState, playerType, targetId, power);
      break;
    case 'heal_aoe':
      newState = executeHealAoE(newState, playerType, power);
      break;
    case 'buff_single':
      newState = executeBuffSingle(newState, playerType, targetId, power);
      break;
    case 'buff_aoe':
      newState = executeBuffAoE(newState, playerType, power);
      break;
    case 'debuff_single':
      newState = executeDebuffSingle(newState, playerType, targetId, power);
      break;
    case 'debuff_aoe':
      newState = executeDebuffAoE(newState, playerType, power);
      break;
    case 'summon':
      newState = executeSummon(newState, playerType, power);
      break;
    case 'freeze':
      newState = executeFreeze(newState, playerType, targetId, power);
      break;
    case 'stealth':
      newState = executeStealth(newState, playerType, targetId, power);
      break;
    case 'draw':
      newState = executeDraw(newState, playerType, power);
      break;
    case 'copy':
      newState = executeCopy(newState, playerType, power);
      break;
    case 'scry':
      newState = executeScry(newState, playerType, power);
      break;
    case 'reveal':
      newState = executeReveal(newState, playerType, power);
      break;
    case 'grant_keyword':
      newState = executeGrantKeyword(newState, playerType, targetId, power);
      break;
    default:
      console.warn(`[HERO POWER] Unknown effect type: ${power.effectType}`);
  }

  // Handle secondary effects (e.g., heal hero after buff)
  if (power.secondaryValue && power.effectType === 'buff_single') {
    player.heroHealth = Math.min((player.heroHealth || 30) + power.secondaryValue, 30);
    console.log(`  - Hero healed for ${power.secondaryValue}`);
  }

  return newState;
}

// ==================== EFFECT EXECUTORS ====================

function executeDamageSingle(
  state: GameState,
  playerType: 'player' | 'opponent',
  targetId: string | undefined,
  power: NorseHeroPower
): GameState {
  if (!targetId) return state;

  const opponentType = playerType === 'player' ? 'opponent' : 'player';
  const opponent = state.players[opponentType];

  const targetMinion = opponent.battlefield.find(m => m.instanceId === targetId);
  if (targetMinion) {
    targetMinion.currentHealth = (targetMinion.currentHealth || getCardHealth(targetMinion.card)) - (power.value || 0);
    console.log(`  - Dealt ${power.value} damage to ${targetMinion.card.name}`);

    // Remove dead minions
    opponent.battlefield = opponent.battlefield.filter(m => (m.currentHealth || 0) > 0);

    // Apply secondary debuff if present
    if (power.secondaryValue && power.duration) {
      targetMinion.currentAttack = Math.max(0, (targetMinion.currentAttack || getCardAttack(targetMinion.card)) - power.secondaryValue);
    }
  }

  return state;
}

function executeDamageAoE(
  state: GameState,
  playerType: 'player' | 'opponent',
  power: NorseHeroPower
): GameState {
  const opponentType = playerType === 'player' ? 'opponent' : 'player';
  const opponent = state.players[opponentType];

  opponent.battlefield.forEach(minion => {
    minion.currentHealth = (minion.currentHealth || getCardHealth(minion.card)) - (power.value || 0);
    console.log(`  - Dealt ${power.value} damage to ${minion.card.name}`);
  });

  opponent.battlefield = opponent.battlefield.filter(m => (m.currentHealth || 0) > 0);

  return state;
}

function executeDamageRandom(
  state: GameState,
  playerType: 'player' | 'opponent',
  power: NorseHeroPower
): GameState {
  const opponentType = playerType === 'player' ? 'opponent' : 'player';
  const opponent = state.players[opponentType];

  if (opponent.battlefield.length > 0) {
    const randomIndex = Math.floor(Math.random() * opponent.battlefield.length);
    const target = opponent.battlefield[randomIndex];
    target.currentHealth = (target.currentHealth || getCardHealth(target.card)) - (power.value || 0);
    console.log(`  - Dealt ${power.value} damage to random target ${target.card.name}`);

    opponent.battlefield = opponent.battlefield.filter(m => (m.currentHealth || 0) > 0);
  }

  return state;
}

function executeHealSingle(
  state: GameState,
  playerType: 'player' | 'opponent',
  targetId: string | undefined,
  power: NorseHeroPower
): GameState {
  const player = state.players[playerType];

  if (targetId === 'hero') {
    player.heroHealth = Math.min((player.heroHealth || 30) + (power.value || 0), 30);
    console.log(`  - Healed hero for ${power.value}`);
  } else if (targetId) {
    const targetMinion = player.battlefield.find(m => m.instanceId === targetId);
    if (targetMinion) {
      const maxHealth = getCardHealth(targetMinion.card);
      targetMinion.currentHealth = Math.min(
        (targetMinion.currentHealth || maxHealth) + (power.value || 0),
        maxHealth
      );
      console.log(`  - Healed ${targetMinion.card.name} for ${power.value}`);
    }
  }

  return state;
}

function executeHealAoE(
  state: GameState,
  playerType: 'player' | 'opponent',
  power: NorseHeroPower
): GameState {
  const player = state.players[playerType];

  player.battlefield.forEach(minion => {
    const maxHealth = getCardHealth(minion.card);
    minion.currentHealth = Math.min(
      (minion.currentHealth || maxHealth) + (power.value || 0),
      maxHealth
    );
    console.log(`  - Healed ${minion.card.name} for ${power.value}`);
  });

  return state;
}

function executeBuffSingle(
  state: GameState,
  playerType: 'player' | 'opponent',
  targetId: string | undefined,
  power: NorseHeroPower
): GameState {
  const player = state.players[playerType];

  if (!targetId) {
    // Random friendly target
    if (player.battlefield.length > 0) {
      const randomIndex = Math.floor(Math.random() * player.battlefield.length);
      const target = player.battlefield[randomIndex];
      target.currentAttack = (target.currentAttack || getCardAttack(target.card)) + (power.value || 0);
      target.currentHealth = (target.currentHealth || getCardHealth(target.card)) + (power.value || 0);
      console.log(`  - Buffed random minion ${target.card.name} by +${power.value}/+${power.value}`);
    }
  } else {
    const targetMinion = player.battlefield.find(m => m.instanceId === targetId);
    if (targetMinion) {
      targetMinion.currentAttack = (targetMinion.currentAttack || getCardAttack(targetMinion.card)) + (power.value || 0);
      targetMinion.currentHealth = (targetMinion.currentHealth || getCardHealth(targetMinion.card)) + (power.value || 0);
      console.log(`  - Buffed ${targetMinion.card.name} by +${power.value}/+${power.value}`);

      // Grant keyword if present
      if (power.grantKeyword) {
        applyKeyword(targetMinion, power.grantKeyword);
      }
    }
  }

  return state;
}

function executeBuffAoE(
  state: GameState,
  playerType: 'player' | 'opponent',
  power: NorseHeroPower
): GameState {
  const player = state.players[playerType];

  player.battlefield.forEach(minion => {
    minion.currentAttack = (minion.currentAttack || getCardAttack(minion.card)) + (power.value || 0);
    minion.currentHealth = (minion.currentHealth || getCardHealth(minion.card)) + (power.value || 0);
    console.log(`  - Buffed ${minion.card.name} by +${power.value}/+${power.value}`);
  });

  return state;
}

function executeDebuffSingle(
  state: GameState,
  playerType: 'player' | 'opponent',
  targetId: string | undefined,
  power: NorseHeroPower
): GameState {
  if (!targetId) return state;

  const opponentType = playerType === 'player' ? 'opponent' : 'player';
  const opponent = state.players[opponentType];

  const targetMinion = opponent.battlefield.find(m => m.instanceId === targetId);
  if (targetMinion) {
    const newAttack = (targetMinion.currentAttack || getCardAttack(targetMinion.card)) - (power.value || 0);
    targetMinion.currentAttack = Math.max(0, newAttack);
    console.log(`  - Reduced ${targetMinion.card.name}'s Attack by ${power.value}`);
  }

  return state;
}

function executeDebuffAoE(
  state: GameState,
  playerType: 'player' | 'opponent',
  power: NorseHeroPower
): GameState {
  const opponentType = playerType === 'player' ? 'opponent' : 'player';
  const opponent = state.players[opponentType];

  opponent.battlefield.forEach(minion => {
    const newAttack = (minion.currentAttack || getCardAttack(minion.card)) - (power.value || 0);
    minion.currentAttack = Math.max(0, newAttack);
    console.log(`  - Reduced ${minion.card.name}'s Attack by ${power.value}`);
  });

  return state;
}

function executeReveal(
  state: GameState,
  playerType: 'player' | 'opponent',
  power: NorseHeroPower
): GameState {
  const opponentType = playerType === 'player' ? 'opponent' : 'player';
  const opponent = state.players[opponentType];

  const revealCount = power.value || 1;
  if (opponent.hand.length > 0) {
    const revealed: string[] = [];
    for (let i = 0; i < Math.min(revealCount, opponent.hand.length); i++) {
      const randomIndex = Math.floor(Math.random() * opponent.hand.length);
      const card = opponent.hand[randomIndex];
      revealed.push(card.card.name);
      (card as any).isRevealed = true;
    }
    console.log(`  - Revealed opponent cards: ${revealed.join(', ')}`);
  }

  return state;
}

function executeSummon(
  state: GameState,
  playerType: 'player' | 'opponent',
  power: NorseHeroPower
): GameState {
  const player = state.players[playerType];

  if (!power.summonData || player.battlefield.length >= 7) return state;

  const token: CardInstance = {
    instanceId: `${playerType}_hero_summon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    card: {
      id: 99998,
      name: power.summonData.name,
      manaCost: 0,
      attack: power.summonData.attack,
      health: power.summonData.health,
      description: power.summonData.keywords?.join(', ') || '',
      rarity: 'token' as any,
      type: 'minion',
      keywords: power.summonData.keywords || []
    },
    currentHealth: power.summonData.health,
    currentAttack: power.summonData.attack,
    canAttack: false,
    isPlayed: true,
    isSummoningSick: true,
    attacksPerformed: 0,
    hasDivineShield: power.summonData.keywords?.includes('divine_shield') || false,
    isFrozen: false
  };

  player.battlefield.push(token);
  console.log(`  - Summoned ${power.summonData.name} (${power.summonData.attack}/${power.summonData.health})`);

  return state;
}

function executeFreeze(
  state: GameState,
  playerType: 'player' | 'opponent',
  targetId: string | undefined,
  power: NorseHeroPower
): GameState {
  if (!targetId) return state;

  const opponentType = playerType === 'player' ? 'opponent' : 'player';
  const opponent = state.players[opponentType];

  const targetMinion = opponent.battlefield.find(m => m.instanceId === targetId);
  if (targetMinion) {
    targetMinion.isFrozen = true;
    console.log(`  - Froze ${targetMinion.card.name}`);

    // Deal damage if upgraded
    if (power.value) {
      targetMinion.currentHealth = (targetMinion.currentHealth || getCardHealth(targetMinion.card)) - power.value;
      console.log(`  - Dealt ${power.value} damage to ${targetMinion.card.name}`);
      opponent.battlefield = opponent.battlefield.filter(m => (m.currentHealth || 0) > 0);
    }
  }

  return state;
}

function executeStealth(
  state: GameState,
  playerType: 'player' | 'opponent',
  targetId: string | undefined,
  power: NorseHeroPower
): GameState {
  if (!targetId) return state;

  const player = state.players[playerType];

  const targetMinion = player.battlefield.find(m => m.instanceId === targetId);
  if (targetMinion) {
    (targetMinion as any).hasStealth = true;
    console.log(`  - Gave Stealth to ${targetMinion.card.name}`);

    // Apply attack buff if present
    if (power.value) {
      targetMinion.currentAttack = (targetMinion.currentAttack || getCardAttack(targetMinion.card)) + power.value;
    }
  }

  return state;
}

function executeDraw(
  state: GameState,
  playerType: 'player' | 'opponent',
  power: NorseHeroPower
): GameState {
  let newState = state;
  const player = newState.players[playerType];

  // First handle the draw effect
  const drawCount = power.value || 1;
  for (let i = 0; i < drawCount; i++) {
    if (player.deck.length > 0 && player.hand.length < 10) {
      const drawnCardData = player.deck.shift();
      if (drawnCardData) {
        const cardInstance: CardInstance = {
          instanceId: `${playerType}_draw_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          card: drawnCardData,
          currentHealth: getCardHealth(drawnCardData),
          currentAttack: getCardAttack(drawnCardData),
          canAttack: false,
          isPlayed: false,
          isSummoningSick: true,
          attacksPerformed: 0
        };
        player.hand.push(cardInstance);
        console.log(`  - Drew a card`);
      }
    }
  }

  // Handle Odin's secondary "reveal" effect if present
  if (power.secondaryValue && power.id.startsWith('odin-power')) {
    newState = executeReveal(newState, playerType, {
      ...power,
      value: power.secondaryValue
    });
  }

  return newState;
}

function executeCopy(
  state: GameState,
  playerType: 'player' | 'opponent',
  power: NorseHeroPower
): GameState {
  const player = state.players[playerType];
  const opponentType = playerType === 'player' ? 'opponent' : 'player';
  const opponent = state.players[opponentType];

  const copyCount = power.value || 1;
  for (let i = 0; i < copyCount; i++) {
    if (opponent.hand.length > 0 && player.hand.length < 10) {
      const randomIndex = Math.floor(Math.random() * opponent.hand.length);
      const copiedCard = { ...opponent.hand[randomIndex] };
      copiedCard.instanceId = `${playerType}_copy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      player.hand.push(copiedCard);
      console.log(`  - Copied ${copiedCard.card.name} from opponent's hand`);
    }
  }

  return state;
}

function executeScry(
  state: GameState,
  playerType: 'player' | 'opponent',
  power: NorseHeroPower
): GameState {
  const player = state.players[playerType];

  const scryCount = power.value || 1;
  console.log(`  - Looking at top ${scryCount} card(s) of deck`);
  // Note: Actual scry UI would need to be handled by the game UI

  return state;
}

function executeGrantKeyword(
  state: GameState,
  playerType: 'player' | 'opponent',
  targetId: string | undefined,
  power: NorseHeroPower
): GameState {
  if (!targetId || !power.grantKeyword) return state;

  const player = state.players[playerType];
  const targetMinion = player.battlefield.find(m => m.instanceId === targetId);

  if (targetMinion) {
    applyKeyword(targetMinion, power.grantKeyword);
    console.log(`  - Granted ${power.grantKeyword} to ${targetMinion.card.name}`);
  }

  return state;
}

/**
 * Apply a keyword to a minion
 */
function applyKeyword(minion: CardInstance, keyword: string): void {
  switch (keyword) {
    case 'taunt':
      if (!minion.card.keywords) minion.card.keywords = [];
      minion.card.keywords.push('taunt');
      break;
    case 'divine_shield':
      minion.hasDivineShield = true;
      break;
    case 'stealth':
      (minion as any).hasStealth = true;
      break;
    case 'frozen':
      minion.isFrozen = true;
      break;
    case 'poisonous':
      minion.hasPoisonous = true;
      break;
    case 'lifesteal':
      minion.hasLifesteal = true;
      break;
    case 'rush':
      minion.isRush = true;
      break;
  }
}

// ==================== WEAPON UPGRADE ====================

/**
 * Apply a weapon upgrade to a hero
 */
export function applyWeaponUpgrade(
  state: GameState,
  playerType: 'player' | 'opponent',
  heroId: string
): GameState {
  const hero = getNorseHeroById(heroId);
  if (!hero) return state;

  let newState = JSON.parse(JSON.stringify(state)) as GameState;
  const player = newState.players[playerType];

  // Check mana
  if (player.mana.current < 5) return state;

  // Deduct mana
  player.mana.current -= 5;

  console.log(`[WEAPON UPGRADE] ${hero.name} equips ${hero.weaponUpgrade.name}`);

  // Execute immediate effect (simplified - would need full effect system)
  console.log(`  - Immediate: ${hero.weaponUpgrade.immediateEffect.description}`);

  // Upgrade the hero power
  player.heroPower = {
    ...player.heroPower,
    name: hero.upgradedHeroPower.name,
    description: hero.upgradedHeroPower.description
  };

  // Mark as upgraded in game state (extended property)
  (player as any).heroPowerUpgraded = true;
  (player as any).upgradedHeroId = heroId;

  console.log(`  - Hero power upgraded to: ${hero.upgradedHeroPower.name}`);

  return newState;
}

// ==================== HERO PASSIVES ====================

/**
 * Execute hero passive effects for a specific trigger
 */
export function executeHeroPassive(
  state: GameState,
  heroId: string,
  ownerType: 'player' | 'opponent',
  trigger: HeroPassiveTrigger,
  context?: {
    playedMinionId?: string;
    attackingMinionId?: string;
    attackTargetId?: string;
    targetIsFrozen?: boolean;
    targetType?: 'friendly' | 'enemy';
    minionElement?: string;
  }
): GameState {
  const hero = getNorseHeroById(heroId);
  if (!hero) return state;

  const passive = hero.passive;
  if (passive.trigger !== trigger) return state;

  // Check conditions
  if (passive.condition) {
    if (passive.condition.minionElement && context?.minionElement !== passive.condition.minionElement) {
      return state;
    }
    if (passive.condition.targetType && context?.targetType !== passive.condition.targetType) {
      return state;
    }
  }

  let newState = JSON.parse(JSON.stringify(state)) as GameState;
  const owner = newState.players[ownerType];
  const opponent = newState.players[ownerType === 'player' ? 'opponent' : 'player'];

  console.log(`[HERO PASSIVE] ${hero.name}: ${passive.name} triggered (${trigger})`);

  // Helper to check minion eligibility based on conditions
  const isEligible = (minion: CardInstance): boolean => {
    if (passive.condition?.minionElement && (minion.card as any).element !== passive.condition.minionElement) {
      return false;
    }
    // For requiresFrozen, check if the attack target is frozen (not just any enemy)
    if (passive.condition?.requiresFrozen) {
      if (context?.attackTargetId) {
        const target = opponent.battlefield.find(m => m.instanceId === context.attackTargetId);
        if (!target?.isFrozen && !context?.targetIsFrozen) return false;
      } else {
        // Fallback: check if any enemy is frozen for aura-type passives
        const hasAnyFrozenEnemy = opponent.battlefield.some(m => m.isFrozen);
        if (!hasAnyFrozenEnemy) return false;
      }
    }
    if (passive.condition?.requiresStealth && !(minion as any).hasStealth) {
      return false;
    }
    return true;
  };

  // Apply passive effect based on type
  switch (passive.effectType) {
    case 'buff_attack':
      owner.battlefield.forEach(minion => {
        if (isEligible(minion)) {
          minion.currentAttack = (minion.currentAttack || getCardAttack(minion.card)) + (passive.value || 0);
          console.log(`  - ${minion.card.name} gains +${passive.value} Attack`);
        }
      });
      break;
    case 'buff_health':
      owner.battlefield.forEach(minion => {
        if (isEligible(minion)) {
          minion.currentHealth = (minion.currentHealth || getCardHealth(minion.card)) + (passive.value || 0);
          console.log(`  - ${minion.card.name} gains +${passive.value} Health`);
        }
      });
      break;
    case 'buff':
      owner.battlefield.forEach(minion => {
        if (isEligible(minion)) {
          minion.currentAttack = (minion.currentAttack || getCardAttack(minion.card)) + (passive.value || 0);
          minion.currentHealth = (minion.currentHealth || getCardHealth(minion.card)) + (passive.value || 0);
          console.log(`  - ${minion.card.name} gains +${passive.value}/+${passive.value}`);
        }
      });
      break;
    case 'buff_damage':
      owner.battlefield.forEach(minion => {
        if (isEligible(minion)) {
          (minion as any).bonusDamage = ((minion as any).bonusDamage || 0) + (passive.value || 0);
          console.log(`  - ${minion.card.name} deals +${passive.value} damage`);
        }
      });
      break;
    case 'damage_reduction':
      owner.battlefield.forEach(minion => {
        if (isEligible(minion)) {
          (minion as any).damageReduction = ((minion as any).damageReduction || 0) + (passive.value || 0);
          console.log(`  - ${minion.card.name} takes ${passive.value} less damage`);
        }
      });
      break;
    case 'damage_hero':
      opponent.heroHealth = (opponent.heroHealth || 30) - (passive.value || 0);
      console.log(`  - Dealt ${passive.value} damage to enemy hero`);
      break;
    case 'cost_reduction':
      owner.hand.forEach(card => {
        if (!passive.condition?.minionElement || (card.card as any).element === passive.condition.minionElement) {
          (card as any).costReduction = ((card as any).costReduction || 0) + (passive.value || 0);
        }
      });
      console.log(`  - Reduced cost of eligible cards by ${passive.value}`);
      break;
    case 'grant_keyword':
      const keywordToGrant = passive.grantKeyword || 'poisonous';
      owner.battlefield.forEach(minion => {
        if (isEligible(minion)) {
          applyKeyword(minion, keywordToGrant);
          console.log(`  - ${minion.card.name} gains ${keywordToGrant}`);
        }
      });
      break;
    case 'heal':
      owner.battlefield.forEach(minion => {
        if (isEligible(minion)) {
          const maxHealth = getCardHealth(minion.card);
          minion.currentHealth = Math.min(
            (minion.currentHealth || maxHealth) + (passive.value || 0),
            maxHealth
          );
          console.log(`  - ${minion.card.name} healed for ${passive.value}`);
        }
      });
      break;
    case 'debuff_attack':
      opponent.battlefield.forEach(minion => {
        minion.currentAttack = Math.max(0, (minion.currentAttack || getCardAttack(minion.card)) - (passive.value || 0));
        console.log(`  - ${minion.card.name} loses ${passive.value} Attack`);
      });
      break;
    case 'reveal':
      if (opponent.hand.length > 0) {
        const randomIndex = Math.floor(Math.random() * opponent.hand.length);
        (opponent.hand[randomIndex] as any).isRevealed = true;
        console.log(`  - Revealed ${opponent.hand[randomIndex].card.name} from opponent's hand`);
      }
      break;
    case 'copy':
      if (opponent.deck.length > 0 && owner.hand.length < 10) {
        const randomIndex = Math.floor(Math.random() * opponent.deck.length);
        const copiedCardData = opponent.deck[randomIndex];
        const copiedCardInstance: CardInstance = {
          instanceId: `${ownerType}_passive_copy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          card: { ...copiedCardData },
          currentHealth: getCardHealth(copiedCardData),
          currentAttack: getCardAttack(copiedCardData),
          canAttack: false,
          isPlayed: false,
          isSummoningSick: true,
          attacksPerformed: 0
        };
        owner.hand.push(copiedCardInstance);
        console.log(`  - Copied a card from opponent's deck`);
      }
      break;
    default:
      console.warn(`[HERO PASSIVE] Unknown effect type: ${passive.effectType}`);
  }

  return newState;
}

/**
 * Get passive description for UI display
 */
export function getHeroPassiveDescription(heroId: string): string {
  const hero = getNorseHeroById(heroId);
  if (!hero) return '';
  
  return `${hero.passive.name}: ${hero.passive.description}`;
}

/**
 * Get hero power description for UI
 */
export function getHeroPowerDescription(heroId: string, isUpgraded: boolean = false): string {
  const hero = getNorseHeroById(heroId);
  if (!hero) return '';
  
  const power = isUpgraded ? hero.upgradedHeroPower : hero.heroPower;
  return `${power.name} (${power.cost} mana): ${power.description}`;
}

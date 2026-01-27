/**
 * kingPassiveUtils.ts
 * 
 * Execution logic for King passive abilities in Ragnarok Poker.
 * Handles all King passive triggers and effects.
 */

import { GameState, CardInstance, CardData } from '../types';
import { NorseKing, KingPassiveTrigger, KingPassiveEffect, PassiveExecutionContext } from '../types/NorseTypes';
import { NORSE_KINGS } from '../data/norseKings/kingDefinitions';

const RANDOM_KEYWORDS = ['taunt', 'divine_shield', 'stealth', 'rush', 'charge', 'poisonous', 'lifesteal', 'windfury'];

/**
 * Helper to safely get attack from card data (minions only)
 */
function getCardAttack(card: CardData): number {
  return (card as any).attack || 0;
}

/**
 * Helper to safely get health from card data (minions only)
 */
function getCardHealth(card: CardData): number {
  return (card as any).health || 1;
}

/**
 * Extended CardInstance with optional armor property
 */
interface ExtendedCardInstance extends CardInstance {
  armor?: number;
}

/**
 * Get a King by ID
 */
export function getKingById(kingId: string): NorseKing | undefined {
  return NORSE_KINGS[kingId];
}

/**
 * Apply continuous aura effects from a King to all friendly minions
 * Called when calculating minion stats
 */
export function applyKingAuraBuffs(
  kingId: string,
  minions: CardInstance[],
  isOwner: boolean
): ExtendedCardInstance[] {
  const king = getKingById(kingId);
  if (!king) return minions;

  return minions.map(minion => {
    let modifiedMinion: ExtendedCardInstance = { ...minion };
    
    for (const passive of king.passives) {
      if (passive.trigger !== 'always') continue;
      if (!passive.isAura) continue;

      switch (passive.effectType) {
        case 'buff_attack':
          if (isOwner) {
            modifiedMinion.currentAttack = (modifiedMinion.currentAttack || getCardAttack(minion.card)) + passive.value;
          }
          break;
        case 'buff_health':
          if (isOwner) {
            modifiedMinion.currentHealth = (modifiedMinion.currentHealth || getCardHealth(minion.card)) + passive.value;
          }
          break;
        case 'buff_armor':
          if (isOwner) {
            modifiedMinion.armor = (modifiedMinion.armor || 0) + passive.value;
          }
          break;
        case 'debuff_attack':
          if (!isOwner) {
            const newAttack = (modifiedMinion.currentAttack || getCardAttack(minion.card)) - passive.value;
            modifiedMinion.currentAttack = Math.max(0, newAttack);
          }
          break;
      }
    }
    
    return modifiedMinion;
  });
}

/**
 * Execute King passive effects for a specific trigger
 */
export function executeKingPassive(
  state: GameState,
  kingId: string,
  ownerType: 'player' | 'opponent',
  trigger: KingPassiveTrigger,
  context?: PassiveExecutionContext
): GameState {
  const king = getKingById(kingId);
  if (!king) return state;

  let newState = JSON.parse(JSON.stringify(state)) as GameState;
  const owner = newState.players[ownerType];
  const opponentType = ownerType === 'player' ? 'opponent' : 'player';
  const opponent = newState.players[opponentType];

  for (const passive of king.passives) {
    if (passive.trigger !== trigger) continue;

    console.log(`[KING PASSIVE] ${king.name}: ${passive.name} triggered (${trigger})`);

    switch (passive.effectType) {
      case 'buff_health':
        if (trigger === 'start_of_turn') {
          owner.battlefield.forEach(minion => {
            minion.currentHealth = (minion.currentHealth || getCardHealth(minion.card)) + passive.value;
            console.log(`  - ${minion.card.name} gains +${passive.value} Health (now ${minion.currentHealth})`);
          });
        }
        break;

      case 'damage_all_enemies':
        opponent.battlefield.forEach(minion => {
          minion.currentHealth = (minion.currentHealth || getCardHealth(minion.card)) - passive.value;
          console.log(`  - ${minion.card.name} takes ${passive.value} damage (now ${minion.currentHealth})`);
        });
        opponent.battlefield = opponent.battlefield.filter(m => (m.currentHealth || 0) > 0);
        break;

      case 'heal_all_friendly':
        owner.battlefield.forEach(minion => {
          const maxHealth = getCardHealth(minion.card);
          const currentHealth = minion.currentHealth || maxHealth;
          const newHealth = Math.min(currentHealth + passive.value, maxHealth);
          minion.currentHealth = newHealth;
          console.log(`  - ${minion.card.name} healed for ${passive.value} (now ${minion.currentHealth})`);
        });
        break;

      case 'freeze_random':
        if (opponent.battlefield.length > 0) {
          const randomIndex = Math.floor(Math.random() * opponent.battlefield.length);
          const targetMinion = opponent.battlefield[randomIndex];
          targetMinion.isFrozen = true;
          console.log(`  - ${targetMinion.card.name} is Frozen!`);
        }
        break;

      case 'summon_token':
        if (passive.summonData && owner.battlefield.length < 7) {
          const keywords = passive.summonData.randomKeyword 
            ? [RANDOM_KEYWORDS[Math.floor(Math.random() * RANDOM_KEYWORDS.length)]]
            : (passive.summonData.keywords || []);
          
          const token: CardInstance = {
            instanceId: `${ownerType}_king_token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            card: {
              id: 99999,
              name: passive.summonData.name,
              manaCost: 0,
              attack: passive.summonData.attack,
              health: passive.summonData.health,
              description: keywords.join(', '),
              rarity: 'token' as any,
              type: 'minion',
              keywords: keywords
            },
            currentHealth: passive.summonData.health,
            currentAttack: passive.summonData.attack,
            canAttack: false,
            isPlayed: true,
            isSummoningSick: true,
            attacksPerformed: 0,
            hasDivineShield: keywords.includes('divine_shield'),
            isFrozen: false
          };
          
          owner.battlefield.push(token);
          console.log(`  - Summoned ${passive.summonData.name} (${passive.summonData.attack}/${passive.summonData.health}) with ${keywords.join(', ')}`);
        }
        break;

      case 'grant_attack_on_heal':
        if (context?.targetMinions) {
          context.targetMinions.forEach(minionId => {
            const minion = owner.battlefield.find(m => m.instanceId === minionId);
            if (minion) {
              minion.currentAttack = (minion.currentAttack || getCardAttack(minion.card)) + passive.value;
              console.log(`  - ${minion.card.name} gains +${passive.value} Attack from healing (now ${minion.currentAttack})`);
            }
          });
        }
        break;
    }
  }

  return newState;
}

/**
 * Execute start of turn King passives
 */
export function executeStartOfTurnKingPassives(
  state: GameState,
  playerType: 'player' | 'opponent',
  kingId: string
): GameState {
  return executeKingPassive(state, kingId, playerType, 'start_of_turn');
}

/**
 * Execute end of turn King passives
 */
export function executeEndOfTurnKingPassives(
  state: GameState,
  playerType: 'player' | 'opponent',
  kingId: string
): GameState {
  return executeKingPassive(state, kingId, playerType, 'end_of_turn');
}

/**
 * Execute on minion death King passives
 */
export function executeOnMinionDeathKingPassives(
  state: GameState,
  playerType: 'player' | 'opponent',
  kingId: string,
  dyingMinionId: string
): GameState {
  return executeKingPassive(state, kingId, playerType, 'on_minion_death', {
    ownerId: playerType,
    trigger: 'on_minion_death',
    sourceId: kingId,
    dyingMinionId
  });
}

/**
 * Execute on minion play King passives
 */
export function executeOnMinionPlayKingPassives(
  state: GameState,
  playerType: 'player' | 'opponent',
  kingId: string,
  playedMinionId: string
): GameState {
  return executeKingPassive(state, kingId, playerType, 'on_minion_play', {
    ownerId: playerType,
    trigger: 'on_minion_play',
    sourceId: kingId,
    playedMinionId
  });
}

/**
 * Execute on heal King passives (for Yggdrasil)
 */
export function executeOnHealKingPassives(
  state: GameState,
  playerType: 'player' | 'opponent',
  kingId: string,
  healedMinionIds: string[]
): GameState {
  return executeKingPassive(state, kingId, playerType, 'on_heal', {
    ownerId: playerType,
    trigger: 'on_heal',
    sourceId: kingId,
    targetMinions: healedMinionIds
  });
}

/**
 * Get King passive description for UI display
 */
export function getKingPassiveDescription(kingId: string): string[] {
  const king = getKingById(kingId);
  if (!king) return [];
  
  return king.passives.map(p => `${p.name}: ${p.description}`);
}

/**
 * Check if a King has a specific trigger type
 */
export function kingHasTrigger(kingId: string, trigger: KingPassiveTrigger): boolean {
  const king = getKingById(kingId);
  if (!king) return false;
  
  return king.passives.some(p => p.trigger === trigger);
}

/**
 * Apply King aura buffs to a PetData object for poker combat integration.
 * This bridges the card-game king system with the poker combat pet system.
 * Only applies 'always' (aura) type passives that affect stats.
 */
export interface PetStatModifiers {
  attackBonus: number;
  healthBonus: number;
  armorBonus: number;
  enemyAttackDebuff: number;
}

export function getKingPetBuffs(kingId: string): PetStatModifiers {
  const king = getKingById(kingId);
  if (!king) {
    return { attackBonus: 0, healthBonus: 0, armorBonus: 0, enemyAttackDebuff: 0 };
  }

  const modifiers: PetStatModifiers = {
    attackBonus: 0,
    healthBonus: 0,
    armorBonus: 0,
    enemyAttackDebuff: 0
  };

  for (const passive of king.passives) {
    if (passive.trigger !== 'always' || !passive.isAura) continue;

    switch (passive.effectType) {
      case 'buff_attack':
        modifiers.attackBonus += passive.value;
        break;
      case 'buff_health':
        modifiers.healthBonus += passive.value;
        break;
      case 'buff_armor':
        modifiers.armorBonus += passive.value;
        break;
      case 'debuff_attack':
        modifiers.enemyAttackDebuff += passive.value;
        break;
    }
  }

  console.log(`[KING BUFFS] ${king.name} provides: +${modifiers.attackBonus} Attack, +${modifiers.healthBonus} Health, +${modifiers.armorBonus} Armor, -${modifiers.enemyAttackDebuff} enemy Attack`);
  return modifiers;
}

/**
 * Effect Types
 * 
 * This file defines all the type interfaces for card effects in the game.
 * It provides consistent typing for battlecry, deathrattle, spell effects and more.
 */

// Target types
export type TargetType = 
  | 'none'
  | 'any'
  | 'friendly_character'
  | 'enemy_character'
  | 'friendly_minion'
  | 'enemy_minion'
  | 'any_minion'
  | 'all_minions'
  | 'friendly_minions'
  | 'enemy_minions'
  | 'random_minion'
  | 'random_enemy_minion'
  | 'random_friendly_minion'
  | 'adjacent_minions'
  | 'friendly_hero'
  | 'enemy_hero'
  | 'any_hero'
  | 'self';

// Result of an effect execution
export interface EffectResult {
  success: boolean;
  error?: string;
  additionalData?: any;
}

// Base interface for all effect types
export interface BaseEffect {
  type: string;
  requiresTarget?: boolean;
  targetType?: TargetType;
  value?: number;
  condition?: string;
  isRandom?: boolean;
}

// Damage effect
export interface DamageEffect extends BaseEffect {
  type: 'damage';
  value: number;
  splashDamage?: number;
  freezeTarget?: boolean;
  conditionalTarget?: string;
  conditionalValue?: number;
  isSplit?: boolean;
  targetsCount?: number;
}

// Heal effect
export interface HealEffect extends BaseEffect {
  type: 'heal';
  value: number;
}

// AoE Damage effect
export interface AoEDamageEffect extends BaseEffect {
  type: 'aoe_damage';
  value: number;
  includeHeroes?: boolean;
  healValue?: number;
  isBasedOnWeaponAttack?: boolean;
  destroyWeapon?: boolean;
  freezeTarget?: boolean;
}

// Buff effect
export interface BuffEffect extends BaseEffect {
  type: 'buff';
  buffAttack?: number;
  buffHealth?: number;
  temporaryEffect?: boolean;
  grantKeywords?: string[];
  grantDeathrattle?: any;
  grantTaunt?: boolean;
  adjacentOnly?: boolean;
  cardType?: string;
  isBasedOnStats?: boolean;
  includeHeroes?: boolean;
}

// Transform effect
export interface TransformEffect extends BaseEffect {
  type: 'transform';
  summonCardId?: number | string;
  returnToHand?: boolean;
  manaReduction?: number;
  isRepeatable?: boolean;
}

// Summon effect
export interface SummonEffect extends BaseEffect {
  type: 'summon';
  summonCardId?: number | string;
  summonCount?: number;
  summonForOpponent?: boolean;
  fromGraveyard?: boolean;
  fromHand?: boolean;
  specificManaCost?: number;
  specificRace?: string;
  condition?: string;
}

// Draw effect
export interface DrawEffect extends BaseEffect {
  type: 'draw';
  value: number;
  isBasedOnStats?: boolean;
  temporaryEffect?: boolean;
  delayedEffect?: boolean;
  delayedTrigger?: string;
  cardType?: string;
}

// Discover effect
export interface DiscoverEffect extends BaseEffect {
  type: 'discover';
  discoveryType?: string;
  discoveryCount?: number;
  discoveryClass?: string;
  discoveryPoolId?: string;
  discoveryManaCostRange?: {
    min: number;
    max: number;
  };
  manaDiscount?: number;
  manaReduction?: number;
  replaceDeck?: boolean;
  makeDuplicates?: boolean;
}

// Destroy effect
export interface DestroyEffect extends BaseEffect {
  type: 'destroy';
  condition?: string;
  discardCount?: number;
}

// Silence effect
export interface SilenceEffect extends BaseEffect {
  type: 'silence';
  drawCards?: number;
  secondaryEffect?: any;
}

// Quest effect
export interface QuestEffect extends BaseEffect {
  type: 'quest';
  questData?: any;
  progress?: number;
  target?: number;
  completed?: boolean;
  rewardCardId?: number | string;
}

// Add adjacent buff effect
export interface BuffAdjacentEffect extends BaseEffect {
  type: 'buff_adjacent';
  buffType?: string;
}

// This union type includes all possible effect types
export type CardEffect = 
  | DamageEffect
  | HealEffect
  | AoEDamageEffect
  | BuffEffect
  | TransformEffect
  | SummonEffect
  | DrawEffect
  | DiscoverEffect
  | DestroyEffect
  | SilenceEffect
  | QuestEffect
  | BuffAdjacentEffect
  | BaseEffect; // Include base effect for extensibility
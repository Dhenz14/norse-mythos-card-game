/**
 * Card Types
 * 
 * This file defines the type interfaces for cards in the game.
 */
import { CardEffect } from './EffectTypes';

export type CardType = 'minion' | 'spell' | 'weapon' | 'hero' | 'hero_power';
export type CardRarity = 'common' | 'rare' | 'epic' | 'legendary' | 'token' | 'basic' | 'free';
export type HeroClass = 
  | 'neutral' 
  | 'mage' 
  | 'warrior' 
  | 'priest' 
  | 'paladin' 
  | 'hunter' 
  | 'druid' 
  | 'warlock' 
  | 'shaman' 
  | 'rogue' 
  | 'demonhunter' 
  | 'deathknight';

export type MinionRace = 
  | 'none' 
  | 'beast' 
  | 'demon' 
  | 'dragon' 
  | 'elemental' 
  | 'mech' 
  | 'murloc' 
  | 'pirate' 
  | 'totem' 
  | 'all';

// Battlecry effect interface
export interface BattlecryEffect {
  type: string;
  [key: string]: any;
}

// Deathrattle effect interface
export interface DeathrattleEffect {
  type: string;
  targetType?: string;
  value?: number;
  condition?: string;
  summonCardId?: number | string;
  buffAttack?: number;
  buffHealth?: number;
  cardId?: string;
  targetFromBattlecry?: boolean;
  count?: number;
  [key: string]: any; // Keep this to maintain backward compatibility
}

// Spell effect interface
export interface SpellEffect {
  type: string;
  [key: string]: any;
}

// Combo effect interface
export interface ComboEffect {
  type: string;
  [key: string]: any;
}

// Base Card interface - common properties for all card types
export interface Card {
  id: number;
  name: string;
  description: string;
  manaCost: number;
  type: CardType;
  rarity: CardRarity;
  heroClass: HeroClass;
  keywords?: string[];
  flavorText?: string;
  collectible?: boolean;
  
  // Effect properties
  battlecry?: BattlecryEffect;
  deathrattle?: DeathrattleEffect;
  spellEffect?: SpellEffect;
  combo?: ComboEffect;
  aura?: any;
  onDeath?: any;
  onPlay?: any;
  endOfTurn?: any;
  startOfTurn?: any;
  
  // Minion-specific properties
  attack?: number;
  health?: number;
  race?: MinionRace;
  attacksPerTurn?: number;
  
  // Weapon-specific properties
  durability?: number;
  
  // Hero-specific properties
  armor?: number;
  heroPower?: any;
}

// Minion card interface
export interface MinionCard extends Card {
  type: 'minion';
  attack: number;
  health: number;
  race?: MinionRace;
}

// Spell card interface
export interface SpellCard extends Card {
  type: 'spell';
  spellEffect?: SpellEffect;
}

// Weapon card interface
export interface WeaponCard extends Card {
  type: 'weapon';
  attack: number;
  durability: number;
}

// Hero card interface
export interface HeroCard extends Card {
  type: 'hero';
  armor: number;
  heroPower: any;
}

// Hero power card interface
export interface HeroPowerCard extends Card {
  type: 'hero_power';
  spellEffect: SpellEffect;
}

// Card instance with game state
export interface CardInstance {
  instanceId: string;
  card: Card;
  currentHealth?: number;
  currentAttack?: number;
  canAttack: boolean;
  isPlayed: boolean;
  isSummoningSick: boolean;
  hasDivineShield?: boolean;
  isPoisonous?: boolean;
  hasLifesteal?: boolean;
  isRush?: boolean;
  isMagnetic?: boolean;
  isFrozen?: boolean;
  attacksPerformed: number;
  mechAttachments?: CardInstance[];
  
  // Status Effects (Ragnarok unique system)
  isPoisonedDoT?: boolean;     // Takes 3 damage at start of turn
  isBleeding?: boolean;        // Takes +3 damage when damaged
  isParalyzed?: boolean;       // 50% chance to fail actions
  isWeakened?: boolean;        // Has -3 Attack
  isVulnerable?: boolean;      // Takes +3 damage from all sources
  isMarked?: boolean;          // Can always be targeted (ignores stealth/protection)
  isSilenced?: boolean;        // Cannot use abilities
  isBurning?: boolean;         // Takes 3 damage when attacking, deals +3 damage
  
  isPlayerOwned?: boolean;
}

// Card database interface
export interface CardDatabase {
  getCardById(id: number): Card | undefined;
  getAllCards(): Card[];
  getCardsByClass(heroClass: HeroClass): Card[];
  getCardsByType(type: CardType): Card[];
  getCollectibleCards(): Card[];
}

export default Card;
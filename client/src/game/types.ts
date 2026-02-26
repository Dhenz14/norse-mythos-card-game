/**
 * Types.ts
 *
 * Central type definitions for the game system.
 *
 * This file contains the core types used throughout the application.
 * For adapter functions and unified types that bridge systems, see:
 * /utils/cardTypeAdapter.ts
 */
/**
 * Collection filtering types
 */
export interface CollectionFilter {
  class?: string | null;
  searchTerm?: string;
  minMana?: number;
  maxMana?: number;
  cardType?: string | null;
  rarity?: string | null;
}

/**
 * Hero class type - supports both PascalCase and lowercase for compatibility
 */
export type HeroClass = 
  | 'Druid' | 'druid'
  | 'Hunter' | 'hunter'
  | 'Mage' | 'mage'
  | 'Paladin' | 'paladin'
  | 'Priest' | 'priest'
  | 'Rogue' | 'rogue'
  | 'Shaman' | 'shaman'
  | 'Warlock' | 'warlock'
  | 'Warrior' | 'warrior'
  | 'Neutral' | 'neutral'
  | 'Necromancer' | 'necromancer'
  | 'DemonHunter' | 'demonhunter'
  | 'DeathKnight' | 'deathknight';

/**
 * Deck information type for deck builder
 */
export interface DeckInfo {
  id?: number;
  name: string;
  heroClass: HeroClass;
  cards: Record<string, number>; // Card ID to count mapping
}

/**
 * Sound effect type for game audio
 */
export type SoundEffectType = 
  | 'card_draw' 
  | 'card_play' 
  | 'card_attack' 
  | 'card_place'
  | 'button_click'
  | 'game_start'
  | 'turn_end'
  | 'victory'
  | 'defeat';

/**
 * Valid card types
 */
export type CardType = 'minion' | 'spell' | 'weapon' | 'hero' | 'secret' | 'location' | 'poker_spell';

/**
 * Valid game zones (areas where cards can be located)
 */
export type ZoneType = 'deck' | 'hand' | 'battlefield' | 'graveyard';

/**
 * Valid card rarities
 */
export type CardRarity = 'free' | 'common' | 'rare' | 'epic' | 'legendary';

/**
 * Base interface with properties common to all cards
 */
export interface BaseCardData {
  id: number | string;
  name: string;
  description?: string;
  flavorText?: string;
  type: CardType;
  rarity?: CardRarity;
  manaCost?: number;
  class?: string;
  heroClass?: string;
  collectible?: boolean;
  race?: string;
  set?: string;
  keywords?: string[];
  startOfGameEffect?: {
    type: string;
    healthValue?: number;
    deckSize?: number;
    [key: string]: any;
  };
}

/**
 * Battlecry effect interface
 */
export interface BattlecryEffect {
  type: string;
  targetType?: string;
  value?: number;
  requiresTarget?: boolean;
  [key: string]: any;
}

/**
 * Spell effect interface
 */
export interface SpellEffect {
  type: string;
  targetType?: string;
  value?: number;
  requiresTarget?: boolean;
  [key: string]: any;
}

/**
 * Deathrattle effect interface
 */
export interface DeathrattleEffect {
  type: string;
  targetType?: string;
  value?: number;
  [key: string]: any;
}

/**
 * Triggered effect for passive abilities
 */
export interface TriggeredEffect {
  type: string;
  targetType?: string;
  value?: number | string;
  condition?: string | { [key: string]: any };
  [key: string]: any;
}

/**
 * Aura effect for persistent board-wide effects
 */
export interface AuraEffect {
  type: string;
  targetType?: string;
  value?: number;
  condition?: string | { [key: string]: any };
  [key: string]: any;
}

/**
 * Passive effect for inherent abilities
 */
export interface PassiveEffect {
  type: string;
  value?: number;
  condition?: string | { [key: string]: any };
  [key: string]: any;
}

/**
 * Minion-specific properties
 */
export interface MinionCardData extends BaseCardData {
  type: 'minion';
  attack?: number;
  health?: number;
  battlecry?: BattlecryEffect;
  deathrattle?: DeathrattleEffect;
  race?: string;
  endOfTurn?: TriggeredEffect;
  onFriendlyDeath?: TriggeredEffect;
  onSummon?: TriggeredEffect;
  onKill?: TriggeredEffect;
  onDamage?: TriggeredEffect;
  onAttack?: TriggeredEffect;
  startOfTurn?: TriggeredEffect;
  onSurviveDamage?: TriggeredEffect;
  onAnyDeath?: TriggeredEffect;
  onDamageTaken?: TriggeredEffect;
  aura?: AuraEffect;
  auraEffect?: AuraEffect;
  passive?: PassiveEffect;
  cantBeSilenced?: boolean;
  categories?: string[];
  triggeredEffect?: TriggeredEffect;
  triggerEffect?: TriggeredEffect;
  linkedHeroId?: string;
  isSuperMinion?: boolean;
  overload?: { amount: number };
  comboEffect?: any;
  spellDamage?: number;
  costReduction?: any;
  tradeableInfo?: any;
  inspireEffect?: any;
  corruptState?: any;
  dormantTurns?: number;
  frenzyEffect?: any;
  spellburstEffect?: any;
  effects?: any;
  dualClassInfo?: any;
  combo?: any;
  cantBeTargetedBySpells?: boolean;
  spellPower?: number;
  awakenCondition?: any;
  awakenEffect?: any;
  customAwakeningCondition?: any;
  chooseOneOptions?: any[];
  outcastEffect?: any;
  costModifier?: any;
  dynamicAttack?: any;
  onPlayCardEffect?: any;
  minionEffect?: any;
  cantAttack?: boolean;
}

/**
 * Spell-specific properties
 */
export interface SpellCardData extends BaseCardData {
  type: 'spell';
  spellEffect?: SpellEffect;
  overload?: { amount: number };
  comboEffect?: any;
  tradeableInfo?: any;
  corruptState?: any;
  dualClassInfo?: any;
  outcast?: any;
  outcastEffect?: any;
  secretEffect?: {
    triggerType?: string;
    effect?: {
      type?: string;
      value?: number;
      targetType?: string;
      summonCardId?: string | number;
      buffAttack?: number;
      buffHealth?: number;
      [key: string]: any;
    };
    [key: string]: any;
  };
  chooseOneOptions?: any[];
  questProgress?: {
    goal: number;
    current: number;
    condition: string;
  };
  questReward?: {
    cardId: number | string;
  };
}

/**
 * Weapon-specific properties
 */
export interface WeaponCardData extends BaseCardData {
  type: 'weapon';
  attack?: number;
  durability?: number;
  overload?: { amount: number };
  deathrattle?: DeathrattleEffect;
  tradeableInfo?: any;
  corruptState?: any;
  dualClassInfo?: any;
  battlecry?: BattlecryEffect;
  weaponEffect?: any;
  onSummonEffect?: any;
  onKillEffect?: any;
  runeEffect?: any;
}

/**
 * Hero-specific properties
 */
export interface HeroCardData extends BaseCardData {
  type: 'hero';
  armor?: number;
  armorGain?: number;
  health?: number;
  overload?: { amount: number };
  heroPower?: HeroPower;
  battlecry?: BattlecryEffect;
}

/**
 * Secret-specific properties
 */
export interface SecretCardData extends BaseCardData {
  type: 'secret';
  overload?: { amount: number };
  secretEffect?: {
    triggerType?: string;
    effect?: {
      type?: string;
      value?: number;
      targetType?: string;
      summonCardId?: string | number;
      buffAttack?: number;
      buffHealth?: number;
      [key: string]: any;
    };
    [key: string]: any;
  };
}

/**
 * Location-specific properties
 */
export interface LocationCardData extends BaseCardData {
  type: 'location';
  durability?: number;
  overload?: { amount: number };
}

/**
 * Poker Spell card data - spells that affect poker combat
 */
export interface PokerSpellCardData extends BaseCardData {
  type: 'poker_spell';
  pokerSpellEffect: {
    effectType: string;
    timing: 'pre_deal' | 'on_bet' | 'on_fold' | 'on_all_in' | 'on_river';
    duration?: 'instant' | 'this_combat' | 'next_action';
    targetSelf?: boolean;
    targetOpponent?: boolean;
    value?: number;
  };
  overload?: { amount: number };
}

/**
 * Union type for all card data types with discriminated union based on type field
 */
export type CardData =
  | MinionCardData
  | SpellCardData
  | WeaponCardData
  | HeroCardData
  | SecretCardData
  | LocationCardData
  | PokerSpellCardData;

/**
 * Type for card transform objects that should not be treated as cards
 */
export interface CardTransformObject {
  type: 'transform';
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  [key: string]: any;
}

/**
 * Type for card effect objects that should not be treated as cards
 */
export interface CardEffectObject {
  targetType: BattlecryTargetTypeString | SpellTargetTypeString;
  requiresTarget: boolean;
  value?: number;
  isRepeatable?: boolean;
  effectType?: string;
  [key: string]: any;
}

/**
 * Card view options for the different display modes
 */
export type CardViewMode = 'standard' | 'detailed' | 'hand' | 'board' | 'miniature';

/**
 * Card quality/rarity types
 */
export type CardQuality = 'normal' | 'premium' | 'golden' | 'diamond';

/**
 * Data for a card in the player's deck
 */
export interface DeckCard {
  cardId: number | string;
  count: number;
}

/**
 * Player deck information
 */
export interface Deck {
  id?: number | string;
  name: string;
  class: string;
  cards: DeckCard[];
}

/**
 * Card transition properties for animations
 */
export interface CardTransition {
  progress: number;
  value: number;
}

/**
 * Noise options for card effects
 */
export interface NoiseOptions {
  type?: '2d' | '3d' | '4d';
  scale?: number;
  seed?: number;
  octaves?: number;
  persistence?: number;
  lacunarity?: number;
  updateInterval?: number;
  value?: number;
  generator?: any;
}

/**
 * Card animation types
 */
export type CardAnimationType = 
  | 'draw' 
  | 'play' 
  | 'attack' 
  | 'death' 
  | 'enhance' 
  | 'damage' 
  | 'heal' 
  | 'transform'
  | 'deathrattle';

/**
 * Battlecry target type enum for accessing as properties
 */
export enum BattlecryTargetType {
  NONE = 'none',
  ANY = 'any',
  ANY_MINION = 'any_minion',
  ENEMY_MINION = 'enemy_minion',
  FRIENDLY_MINION = 'friendly_minion',
  ENEMY_HERO = 'enemy_hero',
  FRIENDLY_HERO = 'friendly_hero',
  HERO = 'hero',
  ALL = 'all',
  MECH = 'mech',
  FRIENDLY_MECH = 'friendly_mech',
  ANY_HERO = 'any_hero',
  ALL_MINIONS = 'all_minions',
  ALL_ENEMY_MINIONS = 'all_enemy_minions'
}

/**
 * Spell target type enum for accessing as properties
 */
export enum SpellTargetType {
  NONE = 'none',
  ANY = 'any',
  ANY_MINION = 'any_minion',
  ENEMY_MINION = 'enemy_minion',
  FRIENDLY_MINION = 'friendly_minion',
  ENEMY_HERO = 'enemy_hero',
  FRIENDLY_HERO = 'friendly_hero',
  HERO = 'hero',
  ALL = 'all',
  ALL_MINIONS = 'all_minions',
  ALL_ENEMY_MINIONS = 'all_enemy_minions'
}

/**
 * Battlecry target type
 */
export type BattlecryTargetTypeString =
  | 'none'
  | 'any'
  | 'any_minion'
  | 'enemy_minion'
  | 'friendly_minion'
  | 'enemy_hero'
  | 'friendly_hero'
  | 'hero'
  | 'all'
  | 'mech'
  | 'any_hero'
  | 'all_minions'
  | 'all_enemy_minions';

/**
 * Spell target type
 */
export type SpellTargetTypeString =
  | 'none'
  | 'any'
  | 'any_minion'
  | 'enemy_minion'
  | 'friendly_minion'
  | 'enemy_hero'
  | 'friendly_hero'
  | 'hero'
  | 'all'
  | 'all_minions'
  | 'all_enemy_minions';

/**
 * Mana pool structure
 */
export interface ManaPool {
  current: number;
  max: number;
  overloaded: number;
  pendingOverload: number;
}

/**
 * Hero power structure
 */
export interface HeroPower {
  name: string;
  cost: number;
  used: boolean;
  effect?: string | any;
  description?: string;
  class?: HeroClass;
  isUpgraded?: boolean;
}

/**
 * Card instance in the game (cards in hand, on battlefield, etc.)
 */
export interface CardInstance {
  instanceId: string;
  card: CardData;
  currentHealth?: number;
  currentAttack?: number;
  currentDurability?: number;
  canAttack?: boolean;
  isSummoningSick?: boolean;
  hasAttacked?: boolean;
  hasDivineShield?: boolean;
  isFrozen?: boolean;
  isStealth?: boolean;
  isTaunt?: boolean;
  isRush?: boolean;
  hasRush?: boolean;
  hasCharge?: boolean;
  hasWindfury?: boolean;
  hasLifesteal?: boolean;
  hasPoisonous?: boolean;
  enchantments?: any[];
  silenced?: boolean;
  isSilenced?: boolean;
  buffs?: any[];
  isPlayed?: boolean;
  hasSuperMinionBonus?: boolean;
  attacksPerformed?: number;
  isPlayerOwned?: boolean;
  isBurning?: boolean;
  returnToOwnerAtEndOfTurn?: boolean;
  originalOwner?: 'player' | 'opponent';
  isRevealed?: boolean;
  chosenOption?: number;
  corruptState?: any;
  stealthUntilAttack?: boolean;
  isElusive?: boolean;
  isColossal?: boolean;
  colossalParts?: CardInstance[];
  isColossalPart?: boolean;
  parentColossalId?: string;
  isDormant?: boolean;
  dormantTurnsLeft?: number;
  canBeAttacked?: boolean;
  canTakeDamage?: boolean;
  hasEcho?: boolean;
  isEchoExpired?: boolean;
  isEchoCopy?: boolean;
  echoCreatedThisTurn?: boolean;
  originalManaCost?: number;
  
  // Status Effects (Ragnarok unique system)
  isPoisonedDoT?: boolean;     // Takes 3 damage at start of turn
  isBleeding?: boolean;        // Takes +3 damage when damaged
  isParalyzed?: boolean;       // 50% chance to fail actions
  isWeakened?: boolean;        // Has -3 Attack
  isVulnerable?: boolean;      // Takes +3 damage from all sources
  isMarked?: boolean;          // Can always be targeted (ignores stealth/protection)

  // Evolution system
  evolutionLevel?: 1 | 2 | 3;

  // NFT — present if this is a Hive L1 NFT card; absent for demo/dev cards
  nft_id?: string;
}

/**
 * Weapon equipped by a player
 */
export interface EquippedWeapon {
  card: CardData;
  durability: number;
  attack: number;
}

/**
 * Hero state for a player
 */
export interface HeroState {
  id?: string;
  isFrozen?: boolean;
  isImmune?: boolean;
}

/**
 * Game player information - matches actual runtime structure
 */
export interface Player {
  id: string;
  name: string;
  hand: CardInstance[];
  battlefield: CardInstance[];
  deck: CardData[];
  graveyard: CardInstance[];
  secrets: CardInstance[];
  weapon?: CardInstance;
  mana: ManaPool;
  health: number;
  heroHealth?: number;
  heroArmor?: number;
  armor?: number;
  heroClass: HeroClass;
  heroPower: HeroPower;
  cardsPlayedThisTurn: number;
  attacksPerformedThisTurn: number;
  hero?: HeroState;
  deckSize?: number;
  heroId?: string;
  tempStats?: {
    attack?: number;
    armor?: number;
  };
}

/**
 * Mulligan state
 */
export interface MulliganState {
  active: boolean;
  playerSelections: Record<string, boolean>;
  playerReady: boolean;
  opponentReady: boolean;
}

/**
 * Fatigue counter
 */
export interface FatigueCount {
  player: number;
  opponent: number;
}

export interface DiscoveryState {
  active: boolean;
  options: CardData[];
  allOptions?: CardData[];
  sourceCardId?: string;
  filters?: {
    type?: CardType | 'any';
    rarity?: CardRarity | 'any';
    manaCost?: number | 'any';
    manaCostRange?: [number, number] | 'any';
    heroClass?: string | 'any';
  };
  callback?: (card: CardData | null) => any;
}

/**
 * Game state information - matches actual runtime structure
 */
export interface GameState {
  id?: string;
  players: {
    player: Player;
    opponent: Player;
  };
  currentTurn: 'player' | 'opponent';
  turnNumber: number;
  gamePhase: 'mulligan' | 'playing' | 'ended' | 'game_over';
  winner?: 'player' | 'opponent' | null;
  gameLog: GameLogEvent[];
  mulligan?: MulliganState;
  mulliganCompleted?: boolean;
  fatigueCount?: FatigueCount;
  discovery?: DiscoveryState;
  targetingState?: any;
  animations?: AnimationParams[];
}

/**
 * Card interaction event types
 */
export type CardInteractionEvent = 
  | 'select'
  | 'hover'
  | 'click'
  | 'drag'
  | 'drop'
  | 'play'
  | 'attack'
  | 'target';

/**
 * Card event handler types
 */
export interface CardEventHandlers {
  onSelect?: (card: CardData) => void;
  onHover?: (isHovered: boolean, card: CardData) => void;
  onClick?: (card: CardData) => void;
  onPlay?: (card: CardData, target?: CardData) => void;
  onAttack?: (attacker: CardData, target: CardData) => void;
}

/**
 * Game log event types
 */
export type GameLogEventType = 
  | 'card_played' 
  | 'play_card'
  | 'minion_attack' 
  | 'attack'
  | 'spell_cast' 
  | 'hero_damage'
  | 'minion_death'
  | 'death'
  | 'turn_start'
  | 'turn_end'
  | 'quest_progress'
  | 'quest_completed'
  | 'secret_triggered'
  | 'hero_power_used'
  | 'hero_power'
  | 'draw'
  | 'fatigue'
  | 'burn'
  | 'mulligan'
  | 'summon'
  | 'heal'
  | 'damage'
  | 'buff'
  | 'discover'
  | 'deathrattle'
  | 'effect'
  | 'tradeable_traded'
  | 'inspire_triggered'
  | 'choose_one_selected'
  | 'adapt'
  | 'adapt_applied'
  | 'recruit'
  | 'card_corrupted'
  | 'kazakus_discover'
  | 'equip_weapon'
  | 'weapon_break'
  | 'hero_attack'
  | 'dormant_awaken';

/**
 * Animation parameters for card animations
 */
export interface AnimationParams {
  type: 'play' | 'attack' | 'damage' | 'heal' | 'death' | 'draw' | 'deathrattle';
  sourceId?: string | number;
  targetId?: string | number;
  position?: { x: number; y: number };
  duration?: number;
  value?: number;
  damage?: number;
  healing?: number;
}

/**
 * Game log event interface
 */
export interface GameLogEvent {
  id: string;
  type: GameLogEventType;
  player: 'player' | 'opponent';
  text: string;
  timestamp: number;
  turn?: number;
  cardId?: string;
  targetId?: string;
  value?: number;
  progress?: number;
  target?: number;
  cardName?: string;
}

/**
 * Position interface for UI element positioning
 */
export interface Position {
  x: number;
  y: number;
}

/**
 * Secret trigger types
 */
export type SecretTriggerType = 
  | 'on_minion_attack'
  | 'on_hero_attack'
  | 'on_minion_death'
  | 'on_spell_cast'
  | 'on_minion_summon'
  | 'on_damage_taken'
  | 'on_turn_start'
  | 'on_turn_end';

/**
 * Active secret interface for triggered secrets
 */
export interface ActiveSecret {
  instanceId: string;
  card: CardData;
  isRevealed?: boolean;
  id?: string;
  name?: string;
  heroClass?: HeroClass | string;
  isTriggered?: boolean;
}

/**
 * Player state interface for game state management
 * Uses existing HeroPower interface defined earlier in this file
 */
export interface PlayerState {
  heroHealth: number;
  heroArmor: number;
  heroClass?: HeroClass;
  currentMana: number;
  maxMana: number;
  hand: CardInstance[];
  battlefield: CardInstance[];
  deck: CardInstance[];
  graveyard: CardInstance[];
  weapon?: CardInstance | null;
  heroPower: HeroPower;
  secrets?: ActiveSecret[];
}
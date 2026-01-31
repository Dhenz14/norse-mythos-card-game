import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { usePokerCombatAdapter, getActionPermissions, getPokerCombatAdapterState } from '../hooks/usePokerCombatAdapter';
import { useGameStore } from '../stores/gameStore';
import {
  CombatPhase,
  CombatAction,
  PokerCard,
  CardSuit,
  getCombinedHandName
} from '../types/PokerCombatTypes';
import { getSmartAIAction } from './modules/SmartAI';
import SimpleBattlefield from '../components/SimpleBattlefield';
import HandFan from '../components/HandFan';
import ManaBar from '../components/ManaBar';
import { MulliganScreen } from '../components/MulliganScreen';
import { adaptCardInstance } from '../utils/cardInstanceAdapter';
import { CardInstanceWithCardData } from '../types/interfaceExtensions';
import { Position } from '../types/Position';
import { TargetingOverlay } from '../components/TargetingOverlay';
import { CardBurnOverlay } from '../components/CardBurnOverlay';
import { fireActionAnnouncement, useAnimationStore } from '../stores/animationStore';
import { ActionAnnouncement } from '../components/ActionAnnouncement';
import './RagnarokCombatArena.css';
import './GameViewport.css';
import { MinionActivityLog, PokerActivityLog } from '../components/ActivityLog';
import { LastActionLog } from '../components/LastActionLog';
import AIAttackAnimationProcessor from '../components/AIAttackAnimationProcessor';
import { AnimationOverlay } from '../components/AnimationOverlay';
import { Howl } from 'howler';
import { ALL_NORSE_HEROES } from '../data/norseHeroes';
import { executeNorseHeroPower, canUseHeroPower, getNorseHeroById } from '../utils/norseHeroPowerUtils';
import { ShowdownCelebration } from './components/ShowdownCelebration';
import { TargetingPrompt } from './components/TargetingPrompt';
import { HeroPowerPrompt } from './components/HeroPowerPrompt';
import { DamageIndicator } from './components/DamageIndicator';
import { HeroDeathAnimation } from './components/HeroDeathAnimation';
import { ArenaPokerHand } from './components/ArenaPokerHand';
import { PlayingCard } from './components/PlayingCard';
import { GameViewport } from './GameViewport';
import { isValidTargetForHeroPower, getNorseRune, getNorseSymbol, getSuitColor, getNorseValue } from '../utils/combatUtils';
import type { HeroPowerTarget } from '../utils/combatUtils';
import { useCombatLayout } from '../hooks/useCombatLayout';
import { usePokerAI } from './hooks/usePokerAI';
import { usePokerPhases } from './hooks/usePokerPhases';
import { useCombatTimer } from './hooks/useCombatTimer';
import { useCombatEvents, ShowdownCelebration as ShowdownCelebrationState, HeroDeathState } from './hooks/useCombatEvents';
import { useTurnOrchestrator } from './hooks/useTurnOrchestrator';

interface RagnarokCombatArenaProps {
  onCombatEnd?: (winner: 'player' | 'opponent' | 'draw') => void;
}

interface DamageAnimation {
  id: string;
  damage: number;
  targetId: string;
  x: number;
  y: number;
  timestamp: number;
}

const PetGodCard: React.FC<{ 
  pet: any; 
  hpCommitted?: number; 
  isPlayer?: boolean;
  onClick?: () => void;
  isTargetable?: boolean;
}> = ({ pet, hpCommitted = 0, isPlayer = false, onClick, isTargetable = false }) => {
  // HP is already deducted when committed, so availableHP = currentHealth
  const availableHP = Math.max(0, pet.stats.currentHealth);
  const healthPercent = Math.max(0, (availableHP / pet.stats.maxHealth) * 100);
  // committedPercent shows what percentage of max HP has been committed this hand
  const committedPercent = Math.min(100, Math.max(0, (hpCommitted / pet.stats.maxHealth) * 100));
  const rarityBorder = {
    common: '#6b7280',
    rare: '#3b82f6', 
    epic: '#a855f7',
    legendary: '#f59e0b'
  }[pet.rarity as string] || '#f59e0b';

  return (
    <div 
      className={`pet-god-card ${isTargetable ? 'targetable' : ''}`} 
      style={{ borderColor: rarityBorder }}
    >
      <div className="pet-god-header">
        <span className="pet-god-badge">RAGNAROK</span>
        <div className="pet-god-stamina">
          <span className="stamina-label">Stamina</span>
          <span className="stamina-value">{pet.stats.currentStamina}/{pet.stats.maxStamina}</span>
        </div>
      </div>
      
      <div className="pet-god-avatar">
        <span className="avatar-letter">{pet.name.charAt(0)}</span>
        <span className="pet-god-name">{pet.name}</span>
      </div>
      
      <div className="pet-god-footer">
        <div className="pet-god-stat attack-power">
          <span className="stat-label">⚔ Attack</span>
          <span className="stat-value">{pet.stats.attack || 0}</span>
        </div>
        <div className="pet-god-stat hp-available">
          <span className="stat-label">HP</span>
          <span className="stat-value">{availableHP}</span>
        </div>
      </div>
      
      <div className="pet-god-health">
        <div className="health-bar">
          <div className="health-committed" style={{ width: `${committedPercent}%` }} />
          <div className="health-fill" style={{ width: `${healthPercent}%` }} />
        </div>
        <span className="health-text">{pet.stats.currentHealth} HP ({hpCommitted > 0 ? `${hpCommitted} bet` : 'none bet'})</span>
      </div>
    </div>
  );
};

const isCardInWinningHand = (card: PokerCard, winningCards: PokerCard[]): boolean => {
  return winningCards.some(wc => wc.suit === card.suit && wc.numericValue === card.numericValue);
};


const HeroBridge: React.FC<{
  pet: any;
  hpCommitted: number;
  level: number;
  onClick?: () => void;
  isTargetable?: boolean;
}> = ({ pet, hpCommitted, level, onClick, isTargetable = false }) => {
  const currentHP = pet.stats.currentHealth;
  const maxHP = pet.stats.maxHealth;
  const healthPercent = Math.max(0, (currentHP / maxHP) * 100);
  const committedPercent = Math.min(100, Math.max(0, (hpCommitted / maxHP) * 100));

  return (
    <div 
      className={`hero-bridge ${isTargetable ? 'targetable' : ''} ${onClick ? 'clickable' : ''}`}
      onClick={onClick}
    >
      <div className="hero-bridge-card">
        <div className="hero-bridge-header">
          <span className="hero-bridge-title">HERO</span>
          <span className="hero-bridge-level">Lv.{level}</span>
        </div>
        
        <div className="hero-bridge-avatar">
          <span className="hero-bridge-letter">{pet.name.charAt(0)}</span>
        </div>
        
        <div className="hero-bridge-name">{pet.name}</div>
        
        <div className="hero-bridge-stats">
          <div className="hero-bridge-hp">
            <div className="hero-hp-bar">
              <div className="hero-hp-committed" style={{ width: `${committedPercent}%` }} />
              <div className="hero-hp-fill" style={{ width: `${healthPercent}%` }} />
            </div>
            <span className="hero-hp-text">{currentHP}/{maxHP} HP</span>
          </div>
          
          {/* Stamina display - 1 stamina per 10 HP system */}
          <div className="hero-bridge-stamina">
            <span className="stamina-icon">⚡</span>
            <span className="stamina-value">{pet.stats.currentStamina}/{pet.stats.maxStamina}</span>
          </div>
          
          {hpCommitted > 0 && (
            <div className="hero-bridge-bet">
              <span className="bet-label">Bet:</span>
              <span className="bet-value">{hpCommitted} HP</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface BattlefieldHeroProps {
  pet: any;
  hpCommitted: number;
  level: number;
  onClick?: () => void;
  isTargetable?: boolean;
  isOpponent?: boolean;
  secrets?: any[];
  heroClass?: string;
  element?: string;
  mana?: number;
  maxMana?: number;
  onHeroPowerClick?: () => void;
  onWeaponUpgradeClick?: () => void;
  isWeaponUpgraded?: boolean;
}

const BattlefieldHero: React.FC<BattlefieldHeroProps> = ({ 
  pet, hpCommitted, level, onClick, isTargetable = false, isOpponent = false,
  secrets = [], heroClass = 'neutral', element: elementProp, mana = 0, maxMana = 10, onHeroPowerClick,
  onWeaponUpgradeClick, isWeaponUpgraded = false
}) => {
  // Look up element from norse hero data if not provided
  const heroElement = useMemo(() => {
    if (elementProp) return elementProp;
    if (pet.norseHeroId && ALL_NORSE_HEROES[pet.norseHeroId]) {
      return ALL_NORSE_HEROES[pet.norseHeroId].element || 'neutral';
    }
    return 'neutral';
  }, [pet.norseHeroId, elementProp]);
  
  const currentHP = pet.stats.currentHealth;
  const maxHP = pet.stats.maxHealth;
  const armor = pet.stats.armor || 0;
  const attack = pet.stats.attack || 0;
  const healthPercent = Math.max(0, (currentHP / maxHP) * 100);
  const currentSta = pet.stats.currentStamina;
  const maxSta = pet.stats.maxStamina;
  const staminaPercent = maxSta > 0 ? Math.max(0, (currentSta / maxSta) * 100) : 0;
  const [showSecretTooltip, setShowSecretTooltip] = useState(false);
  const [showHeroPowerTooltip, setShowHeroPowerTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState<{ top: number; left: number } | null>(null);
  const lastClickRef = useRef<number>(0);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const portraitRef = useRef<HTMLDivElement>(null);
  
  const elementClass = heroElement ? `element-${heroElement.toLowerCase()}` : '';
  
  const norseHero = pet.norseHeroId ? ALL_NORSE_HEROES[pet.norseHeroId] : null;
  const heroPower = norseHero?.heroPower;
  const weaponUpgrade = norseHero?.weaponUpgrade;
  
  // Debug: Log hero power state on every render
  console.log(`[BattlefieldHero] ${isOpponent ? 'OPPONENT' : 'PLAYER'} pet.name=${pet.name}, pet.norseHeroId=${pet.norseHeroId}, norseHero=${norseHero?.name || 'NULL'}, heroPower=${heroPower?.name || 'NULL'}, mana=${mana}, onHeroPowerClick=${!!onHeroPowerClick}`);
  const WEAPON_COST = 5;
  const canAffordPower = heroPower ? mana >= heroPower.cost : false;
  const canAffordUpgrade = mana >= WEAPON_COST;
  const canUpgrade = canAffordUpgrade && !isOpponent && !isWeaponUpgraded;
  const isPowerDisabled = !canAffordPower || isOpponent;
  
  const handlePortraitClick = useCallback((e: React.MouseEvent) => {
    console.log('[handlePortraitClick] Called! isOpponent=', isOpponent, 'onHeroPowerClick=', !!onHeroPowerClick, 'heroPower=', heroPower?.name || 'NULL', 'norseHero=', norseHero?.name || 'NULL');
    
    if (isOpponent) {
      console.log('[handlePortraitClick] Blocked: isOpponent');
      return;
    }
    e.stopPropagation();
    
    // Always call onHeroPowerClick if available - let parent handler validate mana, used status, etc.
    if (onHeroPowerClick) {
      console.log('[handlePortraitClick] Calling onHeroPowerClick');
      onHeroPowerClick();
    } else {
      console.log('[handlePortraitClick] No onHeroPowerClick callback provided');
    }
  }, [isOpponent, onHeroPowerClick, heroPower, norseHero]);
  
  useEffect(() => {
    return () => {
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
    };
  }, []);
  
  const getSecretColor = (heroClass: string) => {
    switch (heroClass) {
      case 'mage': return '#3b82f6';
      case 'hunter': return '#22c55e';
      case 'paladin': return '#eab308';
      case 'rogue': return '#6b7280';
      default: return '#a855f7';
    }
  };

  return (
    <div 
      className={`battlefield-hero-square ${isOpponent ? 'opponent' : 'player'} ${isTargetable ? 'targetable' : ''} ${onClick ? 'clickable' : ''}`}
      onClick={onClick}
    >
      {/* Wrapper for external glow aura - premium-glow for AAA visual effects */}
      <div className={`hero-card-wrapper ${elementClass} premium-glow`}>
        {/* Elemental glow aura layer - outside clipped frame */}
        <div className={`hero-elemental-aura ${elementClass} premium-glow`} />
        
        <div className={`hero-card-frame ${elementClass} premium-glow`}>
          {/* Particle effects layer - enhanced 10-particle system */}
          <div className={`hero-particles ${elementClass} premium-glow`}>
            <div className="particle particle-1" />
            <div className="particle particle-2" />
            <div className="particle particle-3" />
            <div className="particle particle-4" />
            <div className="particle particle-5" />
            <div className="particle particle-6" />
            <div className="particle particle-7" />
            <div className="particle particle-8" />
            <div className="particle particle-9" />
            <div className="particle particle-10" />
          </div>
          <div 
            ref={portraitRef}
            className={`hero-portrait hero-portrait-interactive ${!isOpponent && heroPower ? 'has-power' : ''} ${!isPowerDisabled ? 'power-ready' : ''} ${canUpgrade ? 'upgrade-ready' : ''} ${isWeaponUpgraded ? 'upgraded' : ''}`}
            style={{
              backgroundImage: `url('/portraits/heroes/${pet.name.split(' ')[0].toLowerCase()}.png')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center top',
              cursor: !isOpponent ? 'pointer' : 'default',
              pointerEvents: 'auto'
            }}
            onClick={(e) => {
              console.log('[BattlefieldHero] Portrait clicked! heroPower=', heroPower?.name || 'NULL', 'isOpponent=', isOpponent, 'onHeroPowerClick=', !!onHeroPowerClick);
              e.stopPropagation();
              // Always call handlePortraitClick - let it handle validation and logging
              handlePortraitClick(e);
            }}
            onMouseEnter={(e) => {
              e.stopPropagation();
              if (portraitRef.current) {
                const rect = portraitRef.current.getBoundingClientRect();
                setTooltipPosition({
                  top: isOpponent ? rect.bottom + 8 : rect.top - 8,
                  left: rect.left + rect.width / 2
                });
              }
              setShowHeroPowerTooltip(true);
            }}
            onMouseLeave={(e) => {
              e.stopPropagation();
              setShowHeroPowerTooltip(false);
              setTooltipPosition(null);
            }}
          >
            {/* Hero Power Cost Badge - shows on portrait */}
            {!isOpponent && heroPower && (
              <div className={`portrait-power-badge ${canAffordPower ? 'affordable' : 'expensive'} ${isWeaponUpgraded ? 'upgraded' : ''}`}>
                <span className="power-cost">{heroPower.cost}</span>
                {isWeaponUpgraded && <span className="upgraded-icon">⚔</span>}
              </div>
            )}
          </div>
          
          {/* Hero Power Tooltip - rendered via portal to escape overflow:hidden */}
          {showHeroPowerTooltip && heroPower && tooltipPosition && createPortal(
            <div 
              className="hero-portrait-tooltip-portal"
              style={{
                position: 'fixed',
                top: tooltipPosition.top,
                left: tooltipPosition.left,
                transform: isOpponent ? 'translateX(-50%)' : 'translateX(-50%) translateY(-100%)',
                zIndex: 10000,
                pointerEvents: 'none',
                animation: 'tooltip-fade-in 0.15s ease-out'
              }}
            >
              <div className="portrait-tooltip-content">
                <div className="tooltip-power-header">
                  <span className="power-name">⚡ {heroPower.name}</span>
                  <span className="power-cost-display">{heroPower.cost} Mana</span>
                </div>
                <div className="tooltip-power-desc">{heroPower.description}</div>
                
                {weaponUpgrade && !isOpponent && (
                  <div className={`tooltip-upgrade-section ${canUpgrade ? 'can-upgrade' : ''} ${isWeaponUpgraded ? 'is-upgraded' : ''}`}>
                    <div className="upgrade-header">
                      {isWeaponUpgraded ? '✓ WEAPON UPGRADED' : `⚔ UPGRADE: ${weaponUpgrade.name} (${WEAPON_COST} Mana)`}
                    </div>
                    <div className="upgrade-effect">
                      {isWeaponUpgraded 
                        ? `Upgraded effect active: ${weaponUpgrade.immediateEffect.description}`
                        : `Upgrade for: ${weaponUpgrade.immediateEffect.description}`}
                    </div>
                    {!isWeaponUpgraded && (
                      canUpgrade ? (
                        <div className="upgrade-hint">Double-click portrait to upgrade!</div>
                      ) : (
                        <div className="upgrade-hint disabled">Need {WEAPON_COST - mana} more mana to upgrade</div>
                      )
                    )}
                  </div>
                )}

                {!isOpponent && !isWeaponUpgraded && (
                  <div className="tooltip-power-hint">
                    {isPowerDisabled 
                      ? `Need ${heroPower.cost - mana} more mana` 
                      : 'Single-click to activate'}
                  </div>
                )}
              </div>
            </div>,
            document.body
          )}
          <div className="hero-name-plate">
          <span className="hero-name">{pet.name.split(' ')[0]}</span>
        </div>
        
        {/* HP Bar - Black background with green fill */}
        <div className="hero-stat-bar hp-bar">
          <div className="stat-bar-fill hp-fill" style={{ width: `${healthPercent}%` }} />
          <span className="stat-bar-text">{Math.round(currentHP)}/{Math.round(maxHP)}</span>
        </div>
        
        {/* STA Bar - Orange themed */}
        <div className="hero-stat-bar sta-bar">
          <div className="stat-bar-fill sta-fill" style={{ width: `${staminaPercent}%` }} />
          <span className="stat-bar-text">⚡{currentSta}/{maxSta}</span>
        </div>
        
        {/* Attack badge hidden - was confusing users */}
        
        {armor > 0 && (
          <div className="hero-armor-badge" title="Armor">{armor}</div>
        )}
        
        {secrets && secrets.length > 0 && (
          <div 
            className="hero-secret-indicator"
            onMouseEnter={() => setShowSecretTooltip(true)}
            onMouseLeave={() => setShowSecretTooltip(false)}
            style={{ 
              backgroundColor: getSecretColor(heroClass),
              position: 'absolute',
              top: isOpponent ? 'auto' : '-12px',
              bottom: isOpponent ? '-12px' : 'auto',
              right: '50%',
              transform: 'translateX(50%)',
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid white',
              boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
              cursor: 'help',
              zIndex: 10
            }}
          >
            <span style={{ color: 'white', fontWeight: 'bold', fontSize: '16px' }}>?</span>
            {secrets.length > 1 && (
              <span style={{
                position: 'absolute',
                bottom: '-4px',
                right: '-4px',
                backgroundColor: '#dc2626',
                color: 'white',
                fontSize: '10px',
                fontWeight: 'bold',
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid white'
              }}>
                {secrets.length}
              </span>
            )}
          </div>
        )}
        
        {showSecretTooltip && secrets && secrets.length > 0 && (
          <div 
            className="secret-tooltip"
            style={{
              position: 'absolute',
              top: isOpponent ? '100%' : 'auto',
              bottom: isOpponent ? 'auto' : '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: 'rgba(0,0,0,0.9)',
              color: 'white',
              padding: '8px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              whiteSpace: 'nowrap',
              zIndex: 100,
              marginTop: isOpponent ? '8px' : '0',
              marginBottom: isOpponent ? '0' : '8px',
              border: `2px solid ${getSecretColor(heroClass)}`,
              boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
            }}
          >
            <div style={{ fontWeight: 'bold', marginBottom: '4px', color: getSecretColor(heroClass) }}>
              Secret Active
            </div>
            <div style={{ opacity: 0.8 }}>
              {secrets.length === 1 ? '1 secret in play' : `${secrets.length} secrets in play`}
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

interface HealthSnapshot {
  playerHeroHealth: number;
  playerHeroArmor: number;
  opponentHeroHealth: number;
  opponentHeroArmor: number;
  playerMinions: Map<string, number>;
  opponentMinions: Map<string, number>;
}

// ========================================
// UNIFIED COMBAT ARENA - Merges PokerPanel + BattlefieldPanel
// ========================================
interface UnifiedCombatArenaProps {
  // Poker action handlers
  onAction: (action: CombatAction, hp?: number) => void;
  onEndTurn: () => void;
  betAmount: number;
  setBetAmount: (val: number) => void;
  showdownCelebration?: ShowdownCelebrationState | null;
  // Hero targeting
  onOpponentHeroClick?: () => void;
  onPlayerHeroClick?: () => void;
  isOpponentTargetable?: boolean;
  isPlayerTargetable?: boolean;
  // Mana display
  playerMana: number;
  playerMaxMana: number;
  opponentMana: number;
  opponentMaxMana: number;
  // Hero props
  playerPet?: any;
  opponentPet?: any;
  playerHpCommitted?: number;
  opponentHpCommitted?: number;
  playerLevel?: number;
  opponentLevel?: number;
  playerSecrets?: any[];
  playerHeroClass?: string;
  // Hero power
  onHeroPowerClick?: () => void;
  onWeaponUpgradeClick?: () => void;
  isWeaponUpgraded?: boolean;
  heroPowerTargeting?: {
    active: boolean;
    norseHeroId: string;
    targetType: string;
    effectType: string;
    value: number;
    secondaryValue?: number;
    powerName: string;
    heroName: string;
    manaCost: number;
  } | null;
  executeHeroPowerEffect?: (norseHero: any, heroPower: any, target: any) => void;
  // Hand props
  handCards?: any[];
  handCurrentMana?: number;
  handIsPlayerTurn?: boolean;
  onCardPlay?: (card: any, target?: any) => void;
  registerCardPosition?: (card: any, position: any) => void;
  battlefieldRef?: React.RefObject<HTMLDivElement | null>;
}

const UnifiedCombatArena: React.FC<UnifiedCombatArenaProps> = ({
  onAction, onEndTurn, betAmount, setBetAmount, showdownCelebration,
  onOpponentHeroClick, onPlayerHeroClick, isOpponentTargetable = false, isPlayerTargetable = false,
  playerMana, playerMaxMana, opponentMana, opponentMaxMana,
  playerPet, opponentPet, playerHpCommitted = 0, opponentHpCommitted = 0,
  playerLevel = 1, opponentLevel = 1, playerSecrets = [], playerHeroClass = 'neutral',
  onHeroPowerClick, onWeaponUpgradeClick, isWeaponUpgraded = false,
  heroPowerTargeting, executeHeroPowerEffect,
  handCards = [], handCurrentMana = 0, handIsPlayerTurn = false,
  onCardPlay, registerCardPosition, battlefieldRef: externalBattlefieldRef
}) => {
  // Subscribe directly to adapter for reactive updates
  const { combatState, applyDirectDamage } = usePokerCombatAdapter();
  
  // Game state for battlefield
  const { 
    gameState, 
    playCard, 
    attackingCard: rawAttackingCard,
    selectAttacker,
    attackWithCard,
    selectedCard,
    selectCard
  } = useGameStore();
  
  const isPlayerTurn = gameState?.currentTurn === 'player';
  
  // Refs for battlefield
  const internalBattlefieldRef = useRef<HTMLDivElement>(null);
  const battlefieldRef = externalBattlefieldRef || internalBattlefieldRef;
  const [damageAnimations, setDamageAnimations] = useState<DamageAnimation[]>([]);
  const [shakingTargets, setShakingTargets] = useState<Set<string>>(new Set());
  const prevHealthRef = useRef<HealthSnapshot | null>(null);
  const minionPositionsRef = useRef<Map<string, { x: number; y: number }>>(new Map());
  const prevMinionPositionsRef = useRef<Map<string, { x: number; y: number }>>(new Map());
  
  // Keyboard shortcuts refs
  const betAmountRef = useRef(betAmount);
  const onActionRef = useRef(onAction);
  betAmountRef.current = betAmount;
  onActionRef.current = onAction;
  
  // Poker keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || 
          e.target instanceof HTMLTextAreaElement ||
          (e.target as HTMLElement)?.isContentEditable) return;
      
      const currentState = getPokerCombatAdapterState().combatState;
      if (!currentState || currentState.player.isReady || currentState.phase === CombatPhase.MULLIGAN) return;
      
      const permissions = getActionPermissions(currentState, true);
      if (!permissions) return;
      
      const key = e.key.toLowerCase();
      const currentBet = betAmountRef.current;
      const action = onActionRef.current;
      
      switch (key) {
        case 'b':
          if (permissions.canBet && !permissions.hasBetToCall) {
            action(CombatAction.ATTACK, currentBet);
          } else if (permissions.canRaise && permissions.hasBetToCall) {
            action(CombatAction.COUNTER_ATTACK, currentBet);
          }
          break;
        case 'c':
          if (permissions.canCall) {
            action(CombatAction.ENGAGE);
          } else if (permissions.canCheck) {
            action(CombatAction.DEFEND);
          }
          break;
        case 'f':
          if (permissions.canFold) {
            action(CombatAction.BRACE);
          }
          break;
        case 'k':
          if (permissions.canCheck) {
            action(CombatAction.DEFEND);
          }
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  // Battlefield card data
  const playerBattlefield = useMemo(() => {
    const cards = gameState?.players?.player?.battlefield || [];
    return cards.map((card: any) => adaptCardInstance(card));
  }, [gameState?.players?.player?.battlefield]);
  
  const opponentBattlefield = useMemo(() => {
    const cards = gameState?.players?.opponent?.battlefield || [];
    return cards.map((card: any) => adaptCardInstance(card));
  }, [gameState?.players?.opponent?.battlefield]);
  
  const opponentSecrets = gameState?.players?.opponent?.secrets || [];
  const opponentHeroClass = gameState?.players?.opponent?.heroClass || 'neutral';
  
  const attackingCard = useMemo(() => {
    return rawAttackingCard ? adaptCardInstance(rawAttackingCard as any) : null;
  }, [rawAttackingCard]);
  
  // Damage animation handlers
  const triggerDamageAnimation = useCallback((targetId: string, damage: number, x: number, y: number) => {
    const animId = `dmg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setDamageAnimations(prev => [...prev, { id: animId, damage, targetId, x, y, timestamp: Date.now() }]);
    setShakingTargets(prev => new Set(prev).add(targetId));
    setTimeout(() => {
      setShakingTargets(prev => {
        const next = new Set(prev);
        next.delete(targetId);
        return next;
      });
    }, 300);
  }, []);

  const removeDamageAnimation = useCallback((id: string) => {
    setDamageAnimations(prev => prev.filter(a => a.id !== id));
  }, []);
  
  // Card click handlers
  const handlePlayerCardClick = useCallback((card: any) => {
    if (heroPowerTargeting?.active && executeHeroPowerEffect) {
      const targetType = heroPowerTargeting.targetType;
      if (targetType === 'friendly_minion' || targetType === 'friendly_mech' || targetType === 'any_minion' || targetType === 'any') {
        const norseHero = ALL_NORSE_HEROES[heroPowerTargeting.norseHeroId];
        if (norseHero) {
          executeHeroPowerEffect(norseHero, norseHero.heroPower, card);
        }
        return;
      }
    }
    
    if (selectedCard) {
      const targetType = (selectedCard.card as any)?.spellEffect?.targetType || (selectedCard.card as any)?.battlecry?.targetType;
      if (targetType === 'friendly_minion' || targetType === 'friendly_mech' || targetType === 'any_minion' || targetType === 'any') {
        const cardId = selectedCard.instanceId || (selectedCard as any).id;
        playCard(cardId, card.instanceId);
        return;
      }
    }
    
    if (!isPlayerTurn) return;
    if (attackingCard) {
      if (card.instanceId === attackingCard.instanceId) {
        selectAttacker(null);
      }
    } else {
      if (card.canAttack) {
        selectAttacker(card);
      }
    }
  }, [isPlayerTurn, attackingCard, selectAttacker, selectedCard, playCard, heroPowerTargeting, executeHeroPowerEffect]);

  const handleOpponentCardClick = useCallback((card: any) => {
    if (heroPowerTargeting?.active && executeHeroPowerEffect) {
      const targetType = heroPowerTargeting.targetType;
      if (targetType === 'enemy_minion' || targetType === 'any_minion' || targetType === 'any') {
        const norseHero = ALL_NORSE_HEROES[heroPowerTargeting.norseHeroId];
        if (norseHero) {
          executeHeroPowerEffect(norseHero, norseHero.heroPower, card);
        }
        return;
      }
    }
    
    if (selectedCard) {
      const targetType = (selectedCard.card as any)?.spellEffect?.targetType || (selectedCard.card as any)?.battlecry?.targetType;
      if (targetType === 'enemy_minion' || targetType === 'any_minion' || targetType === 'any' || targetType === 'enemy') {
        const cardId = selectedCard.instanceId || (selectedCard as any).id;
        playCard(cardId, card.instanceId);
        return;
      }
    }
    
    if (!isPlayerTurn || !attackingCard) return;
    attackWithCard(attackingCard.instanceId, card.instanceId);
  }, [isPlayerTurn, attackingCard, attackWithCard, selectedCard, playCard, heroPowerTargeting, executeHeroPowerEffect]);

  const handleCardPlay = useCallback((card: any, position?: Position) => {
    if (!isPlayerTurn) return;
    const cardId = card.instanceId || card.id;
    if (!cardId) return;
    
    const spellEffect = card.card?.spellEffect;
    // Check if spell requires individual target selection
    // "all_" prefixed targetTypes don't need individual targeting (they affect all targets automatically)
    const targetType = spellEffect?.targetType || '';
    const isAoE = targetType.startsWith('all_') || targetType === 'all' || targetType === 'none' || targetType === 'self';
    const needsTarget = spellEffect?.requiresTarget === true || 
      (!isAoE && spellEffect?.requiresTarget !== false && spellEffect?.targetType && (
        spellEffect.targetType.includes('minion') ||
        spellEffect.targetType.includes('character') ||
        spellEffect.targetType.includes('enemy') ||
        spellEffect.targetType.includes('friendly') ||
        spellEffect.targetType === 'any'
      ));
    if (card.card?.type === 'spell' && needsTarget) {
      const playerMinions = gameState?.players?.player?.battlefield || [];
      const opponentMinions = gameState?.players?.opponent?.battlefield || [];
      const targetType = spellEffect?.targetType || '';
      
      let hasValidTargets = true;
      if (targetType.includes('friendly_minion') || targetType === 'friendly_minion') {
        hasValidTargets = playerMinions.length > 0;
      } else if (targetType.includes('enemy_minion') || targetType === 'enemy_minion') {
        hasValidTargets = opponentMinions.length > 0;
      } else if (targetType.includes('any_minion') || targetType === 'any_minion') {
        hasValidTargets = playerMinions.length > 0 || opponentMinions.length > 0;
      }
      
      if (!hasValidTargets) {
        const { addAnnouncement } = useAnimationStore.getState();
        addAnnouncement({
          type: 'warning',
          title: 'No Valid Targets',
          subtitle: `${card.card.name} requires a minion to target`,
          icon: '⚠️',
          duration: 2000
        });
        return;
      }
      
      selectCard(card);
      return;
    }
    
    if (card.card?.type === 'minion' && card.card.battlecry?.requiresTarget) {
      selectCard(card);
      return;
    }
    
    playCard(cardId);
  }, [isPlayerTurn, playCard, selectCard, gameState]);
  
  // Early return if no combat state
  if (!combatState) {
    return <div className="unified-combat-arena">Loading...</div>;
  }
  
  const isMulligan = combatState.phase === CombatPhase.MULLIGAN;
  const showFaith = !isMulligan && combatState.phase !== CombatPhase.SPELL_PET;
  const showForesight = !isMulligan && (combatState.phase === CombatPhase.FORESIGHT || combatState.phase === CombatPhase.DESTINY || combatState.phase === CombatPhase.RESOLUTION);
  const showDestiny = !isMulligan && (combatState.phase === CombatPhase.DESTINY || combatState.phase === CombatPhase.RESOLUTION);
  
  const basePermissions = getActionPermissions(combatState, true);
  const disabled = isMulligan || !basePermissions?.isMyTurnToAct;

  return (
    <div className="unified-combat-arena" ref={battlefieldRef as React.RefObject<HTMLDivElement>}>
      {/* Activity Logs - Top Right Overlay */}
      <div className="activity-logs-dock">
        <PokerActivityLog />
        <MinionActivityLog />
      </div>
      
      {isMulligan && (
        <div className="mulligan-notice">
          <span className="mulligan-text">Waiting for Mulligan...</span>
          <span className="mulligan-subtext">Complete your card selection first</span>
        </div>
      )}
      
      {/* Opponent Poker Area - Hidden empty placeholder for grid stability */}
      <div className="unified-opponent-poker opponent-poker-area" style={{ display: 'none' }}>
        {/* Hole cards moved to opponent hero section */}
      </div>
      
      {/* Opponent Hero - with hole cards overlay below (true mirror - opponent faces you across the table) */}
      <div className={`unified-opponent-hero ${shakingTargets.has('opponent-hero') ? 'damage-shake damage-flash' : ''} ${!isPlayerTurn ? 'turn-active' : ''}`}>
        {opponentPet && (
          <div className="opponent-hero-container">
            <BattlefieldHero
              pet={opponentPet}
              hpCommitted={opponentHpCommitted}
              level={opponentLevel}
              onClick={onOpponentHeroClick}
              isTargetable={isOpponentTargetable}
              isOpponent={true}
              secrets={opponentSecrets}
              heroClass={opponentHeroClass}
              mana={opponentMana}
              maxMana={opponentMaxMana}
            />
            {/* Opponent hole cards overlay - positioned below hero (mirror of player's layout) */}
            <div className={`opponent-hole-cards-overlay ${showdownCelebration?.resolution.resolutionType === 'showdown' ? 'showdown-reveal' : ''}`}>
              {(combatState.isAllInShowdown || showdownCelebration?.resolution.resolutionType === 'showdown') && combatState.opponent.holeCards.length > 0 ? (
                combatState.opponent.holeCards.map((card: PokerCard, idx: number) => {
                  const isWinningCard = showdownCelebration ? isCardInWinningHand(card, showdownCelebration.winningCards) : false;
                  return (
                    <div key={`opp-hole-${idx}`} className={`poker-card-slot occupied ${isWinningCard ? 'winning-card-glow celebration' : ''}`}>
                      <PlayingCard card={card} large />
                    </div>
                  );
                })
              ) : (
                <>
                  <div className="poker-card-slot occupied">
                    <PlayingCard card={{ suit: 'spades', value: 'A', numericValue: 14 }} faceDown large />
                  </div>
                  <div className="poker-card-slot occupied">
                    <PlayingCard card={{ suit: 'spades', value: 'A', numericValue: 14 }} faceDown large />
                  </div>
                </>
              )}
            </div>
            <div className="opponent-hero-mana">
              <ManaBar 
                currentMana={opponentMana} 
                maxMana={opponentMaxMana} 
                overloadedMana={0} 
                pendingOverload={0}
              />
            </div>
          </div>
        )}
      </div>
      
      {/* Community Cards */}
      <div className="unified-community community-cards-section">
        <div className="zone-community">
          {showFaith && combatState.communityCards.faith.length > 0 ? (
            combatState.communityCards.faith.map((card: PokerCard, idx: number) => {
              const isWinningCard = showdownCelebration ? isCardInWinningHand(card, showdownCelebration.winningCards) : false;
              return (
                <div key={`faith-${idx}`} className={`community-slot ${isWinningCard ? 'winning-card' : ''}`}>
                  <div className={isWinningCard ? 'winning-card-glow celebration' : ''}>
                    <PlayingCard card={card} />
                  </div>
                </div>
              );
            })
          ) : (
            [0, 1, 2].map(idx => (
              <div key={`faith-placeholder-${idx}`} className="community-slot">
                <PlayingCard card={{ suit: 'spades', value: 'A', numericValue: 14 }} faceDown />
              </div>
            ))
          )}
          
          <div className={`community-slot ${showdownCelebration && showForesight && combatState.communityCards.foresight && isCardInWinningHand(combatState.communityCards.foresight, showdownCelebration.winningCards) ? 'winning-card' : ''}`}>
            {showForesight && combatState.communityCards.foresight ? (
              <div className={showdownCelebration && isCardInWinningHand(combatState.communityCards.foresight, showdownCelebration.winningCards) ? 'winning-card-glow celebration' : ''}>
                <PlayingCard card={combatState.communityCards.foresight} />
              </div>
            ) : (
              <div className="card-placeholder" />
            )}
          </div>
          
          <div className={`community-slot ${showdownCelebration && showDestiny && combatState.communityCards.destiny && isCardInWinningHand(combatState.communityCards.destiny, showdownCelebration.winningCards) ? 'winning-card' : ''}`}>
            {showDestiny && combatState.communityCards.destiny ? (
              <div className={showdownCelebration && isCardInWinningHand(combatState.communityCards.destiny, showdownCelebration.winningCards) ? 'winning-card-glow celebration' : ''}>
                <PlayingCard card={combatState.communityCards.destiny} />
              </div>
            ) : (
              <div className="card-placeholder" />
            )}
          </div>
        </div>
      </div>
      
      {/* Opponent Hand Display */}
      <div className="unified-opponent-hand">
        <div className="opponent-hand-display">
          {Array.from({ length: Math.min(gameState?.players?.opponent?.hand?.length || 0, 10) }).map((_, index) => (
            <div key={`opp-card-${index}`} className="opponent-card-back" />
          ))}
          {(gameState?.players?.opponent?.hand?.length || 0) > 0 && (
            <div className="opponent-hand-count">
              {gameState?.players?.opponent?.hand?.length || 0}
            </div>
          )}
        </div>
      </div>
      
      {/* Pot Display - Norse Themed */}
      <div className={`pot-container ${isMulligan ? 'hidden' : ''}`}>
        <div className="pot-display-norse">
          <div className="pot-section pot-section-foe">
            <span className="pot-label">FOE ({combatState.opponentPosition === 'small_blind' ? 'SB' : 'BB'})</span>
            <span className="pot-value">{combatState.opponent.hpCommitted} HP</span>
          </div>
          <div className="pot-section pot-section-total">
            <span className="pot-label">POT</span>
            <span className="pot-value">{combatState.pot || (combatState.opponent.hpCommitted + combatState.player.hpCommitted)}</span>
          </div>
          <div className="pot-section pot-section-you">
            <span className="pot-label">YOU ({combatState.playerPosition === 'small_blind' ? 'SB' : 'BB'})</span>
            <span className="pot-value">{combatState.player.hpCommitted} HP</span>
          </div>
        </div>
      </div>
      
      {/* Opponent Field */}
      <div className="unified-opponent-field">
        <SimpleBattlefield
          playerCards={[]}
          opponentCards={opponentBattlefield}
          onCardClick={handlePlayerCardClick}
          onOpponentCardClick={handleOpponentCardClick}
          onOpponentHeroClick={onOpponentHeroClick}
          attackingCard={attackingCard}
          isPlayerTurn={isPlayerTurn}
          registerCardPosition={registerCardPosition || (() => {})}
          renderMode="opponent"
          shakingTargets={shakingTargets}
        />
      </div>
      
      {/* Player Field */}
      <div className="unified-player-field">
        <SimpleBattlefield
          playerCards={playerBattlefield}
          opponentCards={[]}
          onCardClick={handlePlayerCardClick}
          onOpponentCardClick={handleOpponentCardClick}
          attackingCard={attackingCard}
          isPlayerTurn={isPlayerTurn}
          registerCardPosition={registerCardPosition || (() => {})}
          renderMode="player"
          shakingTargets={shakingTargets}
        />
      </div>

      {/* Info Row: End Turn Button + Last Action Log */}
      <div className="unified-info-row">
        {!isMulligan && (
          <div className="poker-info-row">
          </div>
        )}
        <LastActionLog />

        {/* Hearthstone-style End Turn Button - Positioned absolutely within info-row */}
        <button 
          className={`hearthstone-end-turn ${isPlayerTurn ? 'active' : 'inactive'}`}
          onClick={onEndTurn}
          disabled={!isPlayerTurn}
        >
          <span className="end-turn-text">END TURN</span>
        </button>
      </div>
      
      {/* Player Area - Hero + Hole Cards + Hand Cards in a row */}
      <div className="unified-player-area">
        <div className="unified-hero-hand-row">
          {/* Hero section with hole cards behind */}
          {playerPet && (
            <div className={`unified-hero-section ${shakingTargets.has('player-hero') ? 'damage-shake damage-flash' : ''} ${isPlayerTurn ? 'turn-active' : ''}`}>
              <div className="poker-hero-container">
                <BattlefieldHero
                  pet={playerPet}
                  hpCommitted={playerHpCommitted}
                  level={playerLevel}
                  onClick={onPlayerHeroClick}
                  isTargetable={isPlayerTargetable}
                  isOpponent={false}
                  secrets={playerSecrets}
                  heroClass={playerHeroClass}
                  mana={playerMana}
                  maxMana={playerMaxMana}
                  onHeroPowerClick={onHeroPowerClick}
                  onWeaponUpgradeClick={onWeaponUpgradeClick}
                  isWeaponUpgraded={isWeaponUpgraded}
                />
                <div className="player-mana-display">
                  <ManaBar 
                    currentMana={playerMana} 
                    maxMana={playerMaxMana} 
                    overloadedMana={0} 
                    pendingOverload={0}
                  />
                </div>
                {/* Poker hole cards overlay behind hero - Fixed 2-slot layout */}
                {combatState.player.holeCards.length > 0 && (
                  <div className="hero-hole-cards-overlay zone-poker-cards">
                    {combatState.player.holeCards.map((card: PokerCard, idx: number) => (
                      <div key={`player-hole-${idx}`} className="poker-card-slot occupied">
                        <PlayingCard card={card} large />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Hand cards next to hero */}
          <div className="unified-hand-section">
            {handCards && handCards.length > 0 && onCardPlay && (
              <div className="poker-hand-container">
                <HandFan
                  cards={handCards}
                  currentMana={handCurrentMana}
                  isPlayerTurn={handIsPlayerTurn}
                  onCardPlay={handleCardPlay}
                  registerCardPosition={registerCardPosition || (() => {})}
                  battlefieldRef={battlefieldRef as React.RefObject<HTMLDivElement>}
                />
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Betting Actions Row - BELOW hand cards per user request */}
      {/* Always render during active betting phases (not mulligan/resolution) */}
      {!isMulligan && combatState.phase !== CombatPhase.RESOLUTION && !combatState.isAllInShowdown && (
        <div className="unified-betting-actions-container">
          <div className="unified-betting-actions poker-actions">
            {(() => {
               const permissions = getActionPermissions(combatState, true)!;
               const { 
                 hasBetToCall, toCall, availableHP, minBet,
                 canCheck, canBet, canCall, canRaise, canFold, maxBetAmount, isAllIn,
                 isMyTurnToAct
               } = permissions;
               
               const isDisabled = !isMyTurnToAct;
               
               const maxBet = Math.max(1, availableHP);
               const clampedBet = Math.min(betAmount, maxBet);
               const maxSlider = maxBetAmount;
               const effectiveBet = maxSlider >= minBet ? Math.min(Math.max(minBet, clampedBet), maxSlider) : 0;
               const actualCanRaise = canRaise && maxSlider >= minBet && effectiveBet >= minBet;
               
               const actualCallAmount = Math.min(toCall, availableHP);
               
               const betOrRaiseLabel = hasBetToCall 
                 ? `RAISE to ${toCall + effectiveBet} HP`
                 : `BET ${effectiveBet} HP`;
               const callLabel = isAllIn 
                 ? `ALL-IN ${actualCallAmount} HP`
                 : `CALL ${toCall} HP`;
               
               return (
                 <div className="action-buttons-group">
                   {/* BET/RAISE button - always show, disable when not turn */}
                   <button 
                     className="poker-btn raise-btn"
                     onClick={() => onAction(
                       hasBetToCall ? CombatAction.COUNTER_ATTACK : CombatAction.ATTACK, 
                       effectiveBet
                     )}
                     disabled={isDisabled || (hasBetToCall ? !actualCanRaise : !canBet)}
                   >
                     <span className="btn-text">{betOrRaiseLabel}</span>
                   </button>
                   
                   {/* CALL/CHECK button */}
                   <button 
                     className="poker-btn call-btn"
                     onClick={() => onAction(canCall ? CombatAction.ENGAGE : CombatAction.DEFEND)}
                     disabled={isDisabled || (!canCall && !canCheck)}
                   >
                     <span className="btn-text">{canCall ? callLabel : 'CHECK'}</span>
                   </button>
                   
                   {/* FOLD button */}
                   <button 
                     className="poker-btn fold-btn"
                     onClick={() => onAction(CombatAction.BRACE)}
                     disabled={isDisabled || !canFold}
                   >
                     <span className="btn-text">FOLD</span>
                   </button>
                 </div>
               );
            })()}
          </div>
          
          {/* HP Slider for Raise - Positioned below buttons */}
          <div className="poker-hp-slider-container">
            <input 
              type="range"
              min={basePermissions?.minBet || 1}
              max={basePermissions?.maxBetAmount || 100}
              value={betAmount}
              onChange={(e) => setBetAmount(Number(e.target.value))}
              className="poker-hp-slider"
              disabled={!basePermissions?.isMyTurnToAct}
            />
            <span className="slider-value">{betAmount} HP</span>
          </div>
        </div>
      )}
      
      {/* Damage Animations */}
      {damageAnimations.map(anim => (
        <DamageIndicator
          key={anim.id}
          damage={anim.damage}
          x={anim.x}
          y={anim.y}
          onComplete={() => removeDamageAnimation(anim.id)}
        />
      ))}
    </div>
  );
};

export const RagnarokCombatArena: React.FC<RagnarokCombatArenaProps> = ({ onCombatEnd }) => {
  useCombatLayout();
  
  const { 
    combatState, 
    isActive,
    mulliganComplete,
    completeMulligan,
    performAction, 
    advancePhase,
    maybeCloseBettingRound,
    resolveCombat,
    startNextHand,
    updateTimer,
    endCombat,
    applyDirectDamage
  } = usePokerCombatAdapter();
  
  const [resolution, setResolution] = useState<any>(null);
  const [betAmount, setBetAmount] = useState(10);
  
  // Showdown celebration state - non-blocking visual effects for poker resolution
  const [showdownCelebration, setShowdownCelebration] = useState<ShowdownCelebrationState | null>(null);
  
  // Hero death animation state - shows crumble animation before ending combat
  const [heroDeathState, setHeroDeathState] = useState<{
    isAnimating: boolean;
    deadHeroName: string;
    isPlayerDead: boolean;
    pendingResolution: any;
  } | null>(null);
  
  // Hero power targeting state - tracks when player needs to select a target for hero power
  const [heroPowerTargeting, setHeroPowerTargeting] = useState<{
    active: boolean;
    norseHeroId: string;
    targetType: string;  // 'friendly_minion', 'enemy_minion', 'any_minion', 'any', etc.
    effectType: string;
    value: number;
    secondaryValue?: number;
    powerName: string;
    heroName: string;
    manaCost: number;
  } | null>(null);
  
  // Ref to track if AI response is in progress (prevents double AI actions from timeout + effect)
  const aiResponseInProgressRef = useRef(false);
  
  // AI response logic extracted to custom hook
  usePokerAI({ combatState, isActive, aiResponseInProgressRef });
  
  // Poker phase transition logic extracted to custom hook
  usePokerPhases({ combatState, isActive });
  
  // Combat timer logic extracted to custom hook
  useCombatTimer({ combatState, isActive, updateTimer });
  
  // Combat events logic extracted to custom hook (handles event bus subscriptions, showdown, hero death)
  useCombatEvents({
    combatState,
    isActive,
    onShowdownCelebration: setShowdownCelebration,
    onHeroDeath: setHeroDeathState,
    resolveCombat,
    setResolution
  });
  
  // Turn orchestrator for phase coordination (Poker → Minion → End-of-Turn sequencing)
  // This is a thin coordination layer that tracks phases without duplicating combat logic
  const { 
    currentPhase: turnPhase, 
    turnNumber: orchestratorTurn,
    completePhase: advanceTurnPhase,
    startTurn: startOrchestratorTurn
  } = useTurnOrchestrator({
    onPhaseChange: (from, to, context) => {
      console.log(`[TurnOrchestrator] Phase: ${from} → ${to} (Turn ${context.turnNumber})`);
    }
  });
  
  // Backup timer to prevent combat freeze if ShowdownCelebration fails to call onComplete
  // This ensures handleCombatEnd is called even if the animation unmounts prematurely
  const showdownBackupTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // LIFTED UP: Battlefield ref shared between PokerPanel (for hand cards) and BattlefieldPanel
  const sharedBattlefieldRef = useRef<HTMLDivElement>(null);
  
  // LIFTED UP: Card position registry for animations
  const cardPositionsRef = useRef<Map<string, { x: number; y: number }>>(new Map());
  
  // LIFTED UP: Register card position callback
  const sharedRegisterCardPosition = useCallback((card: any, position: { x: number; y: number }) => {
    const cardId = card?.instanceId || card?.id;
    if (cardId && position) {
      cardPositionsRef.current.set(cardId, position);
    }
  }, []);

  // Get only specific stable values from game state to avoid infinite re-renders
  const currentTurn = useGameStore(state => state.gameState?.currentTurn);
  const mulliganActive = useGameStore(state => state.gameState?.mulligan?.active);
  const gameStateMulligan = useGameStore(state => state.gameState?.mulligan);
  const playerHand = useGameStore(state => state.gameState?.players?.player?.hand ?? []);
  const attackingCard = useGameStore(state => state.attackingCard);
  const selectedCard = useGameStore(state => state.selectedCard);
  const attackWithCard = useGameStore(state => state.attackWithCard);
  const selectAttacker = useGameStore(state => state.selectAttacker);
  const heroTargetMode = useGameStore(state => state.heroTargetMode);
  const playerMana = useGameStore(state => state.gameState?.players?.player?.mana?.current ?? 0);
  const playerMaxMana = useGameStore(state => state.gameState?.players?.player?.mana?.max ?? 10);
  const opponentMana = useGameStore(state => state.gameState?.players?.opponent?.mana?.current ?? 0);
  const opponentMaxMana = useGameStore(state => state.gameState?.players?.opponent?.mana?.max ?? 10);
  
  // Determine if heroes are targetable based on card game state
  const isPlayerTurn = currentTurn === 'player';
  const isOpponentTargetable = isPlayerTurn && (!!attackingCard || !!heroTargetMode || 
    (!!selectedCard && (selectedCard.card.type === 'spell' || 
      (selectedCard.card.type === 'minion' && selectedCard.card.keywords?.includes('battlecry')))));
  const isPlayerTargetable = isPlayerTurn && 
    (!!selectedCard && (selectedCard.card.type === 'spell' || 
      (selectedCard.card.type === 'minion' && selectedCard.card.keywords?.includes('battlecry'))));
  
  // Get selectCard and playCard from gameStore for spell targeting
  const selectCard = useGameStore(state => state.selectCard);
  const playCard = useGameStore(state => state.playCard);
  
  // LIFTED UP: Handle card play from hand (used by both PokerPanel and BattlefieldPanel)
  const sharedHandleCardPlay = useCallback((card: any, position?: { row?: number; col?: number }) => {
    if (!isPlayerTurn) {
      return;
    }
    const cardId = card?.instanceId || card?.id || card?.card?.id;
    if (!cardId) {
      return;
    }
    playCard(cardId);
  }, [isPlayerTurn, playCard]);
  
  // Click handlers for hero attacks - delegate to gameStore
  const handleOpponentHeroClick = useCallback(() => {
    // Check if hero power targeting is active and allows enemy hero targeting
    if (heroPowerTargeting?.active) {
      if (isValidTargetForHeroPower(heroPowerTargeting.targetType, { isMinion: false, isHero: true, isFriendly: false })) {
        const norseHero = ALL_NORSE_HEROES[heroPowerTargeting.norseHeroId];
        if (norseHero) {
          executeHeroPowerEffect(norseHero, norseHero.heroPower, { isHero: true, isOpponent: true });
        }
        return;
      } else {
        return;
      }
    }
    
    if (!isOpponentTargetable) return;
    
    // Check if a spell is selected that can target enemy hero
    if (selectedCard && selectedCard.card.type === 'spell') {
      const spellEffect = selectedCard.card.spellEffect;
      const targetType = spellEffect?.targetType || '';
      // Allow hero targeting if: any_character, enemy, any, hero, or no minion-only restriction
      const allowsEnemyHero = targetType.includes('character') ||
        targetType.includes('any') ||
        targetType.includes('enemy') ||
        targetType.includes('hero') ||
        !targetType.includes('minion'); // If not minion-only, allow hero
      if (allowsEnemyHero) {
        playCard(selectedCard.instanceId, 'opponent-hero', 'hero');
        selectCard(null);
        return;
      }
    }
    
    // Check if a minion with targeted battlecry is selected (enemy hero target)
    if (selectedCard && selectedCard.card.type === 'minion' && selectedCard.card.battlecry?.requiresTarget) {
      const battlecry = selectedCard.card.battlecry;
      const targetType = battlecry.targetType || '';
      const allowsEnemyHero = targetType.includes('character') ||
        targetType.includes('any') ||
        targetType.includes('enemy') ||
        targetType.includes('hero') ||
        !targetType.includes('minion');
      if (allowsEnemyHero) {
        playCard(selectedCard.instanceId, 'opponent-hero', 'hero');
        selectCard(null);
        return;
      }
    }
    
    // Default: minion attacking hero
    if (attackingCard) {
      attackWithCard(attackingCard.instanceId, 'opponent-hero');
      selectAttacker(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpponentTargetable, attackingCard, attackWithCard, selectAttacker, selectedCard, playCard, selectCard, heroPowerTargeting]);
  
  const handlePlayerHeroClick = useCallback(() => {
    // Check if hero power targeting is active and allows friendly hero targeting
    if (heroPowerTargeting?.active) {
      if (isValidTargetForHeroPower(heroPowerTargeting.targetType, { isMinion: false, isHero: true, isFriendly: true })) {
        const norseHero = ALL_NORSE_HEROES[heroPowerTargeting.norseHeroId];
        if (norseHero) {
          executeHeroPowerEffect(norseHero, norseHero.heroPower, { isHero: true, isOpponent: false });
        }
        return;
      } else {
        return;
      }
    }
    
    if (!isPlayerTargetable) return;
    
    // Check if a spell is selected that can target friendly hero
    if (selectedCard && selectedCard.card.type === 'spell') {
      const spellEffect = selectedCard.card.spellEffect;
      const targetType = spellEffect?.targetType || '';
      // Allow hero targeting if: any_character, friendly, any, hero, or no minion-only restriction
      const allowsFriendlyHero = targetType.includes('character') ||
        targetType.includes('any') ||
        targetType.includes('friendly') ||
        targetType.includes('hero') ||
        !targetType.includes('minion') && !targetType.includes('enemy');
      if (allowsFriendlyHero) {
        playCard(selectedCard.instanceId, 'player-hero', 'hero');
        selectCard(null);
        return;
      }
    }
    
    // Check if a minion with targeted battlecry is selected (friendly hero target)
    if (selectedCard && selectedCard.card.type === 'minion' && selectedCard.card.battlecry?.requiresTarget) {
      const battlecry = selectedCard.card.battlecry;
      const targetType = battlecry.targetType || '';
      const allowsFriendlyHero = targetType.includes('character') ||
        targetType.includes('any') ||
        targetType.includes('friendly') ||
        targetType.includes('hero') ||
        !targetType.includes('minion') && !targetType.includes('enemy');
      if (allowsFriendlyHero) {
        playCard(selectedCard.instanceId, 'player-hero', 'hero');
        selectCard(null);
        return;
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlayerTargetable, selectedCard, playCard, selectCard, heroPowerTargeting]);
  
  // Track if hero power was used this turn (resets each hand)
  const [heroPowerUsedThisTurn, setHeroPowerUsedThisTurn] = useState(false);
  
  // Track if weapon upgrade has been used this match (permanent, doesn't reset)
  const [weaponUpgraded, setWeaponUpgraded] = useState(false);
  
  // Reset hero power usage when a new hand starts
  useEffect(() => {
    if (combatState?.combatId) {
      setHeroPowerUsedThisTurn(false);
    }
  }, [combatState?.combatId]);
  
  // Reset weapon upgrade when combat ends/starts fresh
  useEffect(() => {
    if (!isActive) {
      setWeaponUpgraded(false);
    }
  }, [isActive]);
  
  // NOTE: In Ragnarok Poker combat, PokerCombatStore is the authoritative source for hero HP.
  // The gameState heroHealth is legacy and not used in poker combat - all hero HP changes 
  // go through PokerCombatStore exclusively.
  //
  // EXECUTION STRATEGY (to avoid double-apply):
  // - Hero HP changes: Use PokerCombatStore ONLY (applyDirectDamage or setState)
  // - Minion effects: Use executeNorseHeroPower ONLY (updates gameStore)
  // - Never call both for the same effect
  const executeHeroPowerEffect = useCallback((norseHero: any, heroPower: any, target: any) => {
    
    // Deduct mana and mark hero power as used FIRST, regardless of execution path
    const heroPowerGameState = useGameStore.getState();
    const playerState = heroPowerGameState.gameState?.players?.player;
    if (playerState) {
      const newMana = Math.max(0, (playerState.mana?.current || 0) - heroPower.cost);
      useGameStore.setState(prev => ({
        ...prev,
        gameState: {
          ...prev.gameState!,
          players: {
            ...prev.gameState!.players,
            player: {
              ...prev.gameState!.players.player,
              mana: {
                ...prev.gameState!.players.player.mana,
                current: newMana
              },
              heroPower: {
                ...prev.gameState!.players.player.heroPower,
                used: true
              }
            }
          }
        }
      }));
    }
    
    const isHeroTarget = target?.isHero === true;
    const isOpponentHeroTarget = isHeroTarget && target?.isOpponent === true;
    const isPlayerHeroTarget = isHeroTarget && target?.isOpponent === false;
    const targetMinion = isHeroTarget ? null : target;
    
    // Fire announcement
    const targetName = isHeroTarget 
      ? (isOpponentHeroTarget ? ' on enemy hero' : ' on your hero')
      : (targetMinion?.card?.name ? ` on ${targetMinion.card.name}` : '');
    fireActionAnnouncement('spell', `${norseHero.name} uses ${heroPower.name}${targetName}!`, { duration: 2000 });
    
    // Mark as used and clear targeting mode
    setHeroPowerUsedThisTurn(true);
    setHeroPowerTargeting(null);
    
    const effectValue = heroPower.value || 2;
    const secondaryValue = heroPower.secondaryValue || 0;
    const effectType = heroPower.effectType as string;
    
    // Helper to heal player hero via adapter
    const healPlayerHero = (amount: number) => {
      getPokerCombatAdapterState().healPlayerHero(amount);
    };
    
    // Helper to heal opponent hero via adapter
    const healOpponentHero = (amount: number) => {
      getPokerCombatAdapterState().healOpponentHero(amount);
    };
    
    // CASE 1: Hero target - handle via PokerCombatStore ONLY
    if (isHeroTarget) {
      switch (effectType) {
        case 'damage_single':
        case 'damage':
          if (isOpponentHeroTarget) {
            applyDirectDamage('opponent', effectValue, `${norseHero.name}'s ${heroPower.name}`);
          } else if (isPlayerHeroTarget) {
            applyDirectDamage('player', effectValue, `${norseHero.name}'s ${heroPower.name}`);
          }
          break;
        
        case 'heal_single':
        case 'heal':
          if (isPlayerHeroTarget) {
            healPlayerHero(effectValue);
          } else if (isOpponentHeroTarget) {
            healOpponentHero(effectValue);
          }
          break;
        
        case 'damage_and_heal':
          if (isOpponentHeroTarget) {
            applyDirectDamage('opponent', effectValue, `${norseHero.name}'s ${heroPower.name}`);
            healPlayerHero(secondaryValue || effectValue);
          }
          break;
        
        case 'buff_single':
        case 'buff':
          break;
        
        default:
          break;
      }
      
      const currentGameState = useGameStore.getState().gameState;
      if (currentGameState) {
        const newState = JSON.parse(JSON.stringify(currentGameState));
        newState.players.player.mana.current -= heroPower.cost;
        newState.players.player.heroPower = { used: true };
        useGameStore.setState(state => ({ ...state, gameState: newState }));
      }
      return;
    }
    
    // CASE 2: Minion target - use executeNorseHeroPower for battlefield effects
    if (targetMinion) {
      const currentGameState = useGameStore.getState().gameState;
      if (currentGameState) {
        const newGameState = executeNorseHeroPower(
          currentGameState,
          'player',
          norseHero.id,
          targetMinion.instanceId,
          false
        );
        useGameStore.setState(state => ({ ...state, gameState: newGameState }));
      }
      return;
    }
    
    // CASE 3: No target (AOE, random, self, none)
    const currentGameState = useGameStore.getState().gameState;
    
    const minionAffectingEffects = [
      'damage_aoe', 'damage_random', 'buff_aoe', 'buff_single', 'debuff_aoe', 
      'debuff_single', 'summon', 'freeze', 'stealth', 'draw', 'copy', 'scry', 
      'reveal', 'grant_keyword'
    ];
    
    if (minionAffectingEffects.includes(effectType) && currentGameState) {
      const newGameState = executeNorseHeroPower(
        currentGameState,
        'player',
        norseHero.id,
        undefined,
        false
      );
      useGameStore.setState(state => ({ ...state, gameState: newGameState }));
    } else if (currentGameState) {
      const newState = JSON.parse(JSON.stringify(currentGameState));
      newState.players.player.mana.current -= heroPower.cost;
      newState.players.player.heroPower = { used: true };
      useGameStore.setState(state => ({ ...state, gameState: newState }));
    }
    
    switch (effectType) {
      case 'heal_aoe':
        healPlayerHero(effectValue);
        break;
        
      case 'damage_and_heal':
        applyDirectDamage('opponent', effectValue, `${norseHero.name}'s ${heroPower.name}`);
        healPlayerHero(secondaryValue || effectValue);
        break;
        
      case 'self_damage_and_summon':
        applyDirectDamage('player', heroPower.value || 0, `${norseHero.name}'s ${heroPower.name}`);
        if (currentGameState) {
          const newGameState = executeNorseHeroPower(
            currentGameState,
            'player',
            norseHero.id,
            undefined,
            false
          );
          useGameStore.setState(state => ({ ...state, gameState: newGameState }));
        }
        break;
        
      case 'draw_and_damage':
        applyDirectDamage('player', heroPower.selfDamage || heroPower.value || 0, `${norseHero.name}'s ${heroPower.name}`);
        if (currentGameState) {
          const newGameState = executeNorseHeroPower(
            currentGameState,
            'player',
            norseHero.id,
            undefined,
            false
          );
          useGameStore.setState(state => ({ ...state, gameState: newGameState }));
        }
        break;
        
      case 'buff_hero':
        getPokerCombatAdapterState().setPlayerHeroBuffs(effectValue, heroPower.armorValue || 0);
        break;
        
      case 'buff_single':
        if (secondaryValue > 0) {
          healPlayerHero(secondaryValue);
        }
        break;
    }
    
  }, [applyDirectDamage, setHeroPowerUsedThisTurn, setHeroPowerTargeting]);
  
  // Handle hero power click - check if targeting is needed, then execute or enter targeting mode
  const handleHeroPower = useCallback(() => {
    console.log('[handleHeroPower] Called!');
    
    // Check if hero power already used this turn (from gameStore)
    const currentGameState = useGameStore.getState();
    const playerHeroPower = currentGameState.gameState?.players?.player?.heroPower;
    if (playerHeroPower?.used) {
      console.log('[handleHeroPower] Blocked: Already used this turn (gameStore)');
      return;
    }
    
    // Get the player's pet norseHeroId
    const norseHeroId = combatState?.player?.pet?.norseHeroId;
    if (!norseHeroId) {
      console.log('[handleHeroPower] Blocked: No norseHeroId found');
      return;
    }
    
    if (!combatState) {
      console.log('[handleHeroPower] Blocked: No combatState');
      return;
    }
    
    const norseHero = ALL_NORSE_HEROES[norseHeroId];
    if (!norseHero) {
      console.log('[handleHeroPower] Blocked: norseHero not found for ID:', norseHeroId);
      return;
    }
    
    const heroPower = norseHero.heroPower;
    const manaCost = heroPower.cost;
    const currentMana = playerMana;
    
    console.log('[handleHeroPower] Hero:', norseHero.name, 'Power:', heroPower.name, 'Cost:', manaCost, 'Current mana:', currentMana);
    
    // Check mana
    if (currentMana < manaCost) {
      console.log('[handleHeroPower] Blocked: Not enough mana');
      return;
    }
    
    // Check if already used this turn
    if (heroPowerUsedThisTurn) {
      console.log('[handleHeroPower] Blocked: heroPowerUsedThisTurn is true');
      return;
    }
    
    // STRICT GUARD: Determine if this hero power requires targeting
    const targetType = heroPower.targetType || 'none';
    
    // These target types do NOT require targeting mode - they execute immediately
    const noTargetTypes = ['none', 'self', 'all_enemies', 'all_friendly', 'random_enemy', 'random_friendly'];
    
    // EXPLICIT CHECK: Only enter targeting mode if NOT in noTargetTypes
    if (noTargetTypes.includes(targetType)) {
      console.log('[handleHeroPower] Executing immediately (no target needed), targetType:', targetType);
      // Execute immediately WITHOUT creating heroPowerTargeting state
      executeHeroPowerEffect(norseHero, heroPower, null);
      return;
    }
    
    console.log('[handleHeroPower] Entering targeting mode, targetType:', targetType);
    // Target IS required - enter targeting mode
    setHeroPowerTargeting({
      active: true,
      norseHeroId,
      targetType,
      effectType: heroPower.effectType,
      value: heroPower.value || 0,
      secondaryValue: heroPower.secondaryValue,
      powerName: heroPower.name,
      heroName: norseHero.name,
      manaCost
    });
    fireActionAnnouncement('spell', `Select a target for ${heroPower.name}`, { duration: 3000 });
  }, [combatState, heroPowerUsedThisTurn, playerMana]);
  
  // Cancel hero power targeting when clicking elsewhere
  const cancelHeroPowerTargeting = useCallback(() => {
    if (heroPowerTargeting?.active) {
      setHeroPowerTargeting(null);
    }
  }, [heroPowerTargeting]);
  
  // Handle weapon upgrade click - applies permanent hero power upgrade
  const handleWeaponUpgrade = useCallback(() => {
    const norseHeroId = combatState?.player?.pet?.norseHeroId;
    if (!norseHeroId) {
      return;
    }
    
    if (!combatState) {
      return;
    }
    
    const norseHero = ALL_NORSE_HEROES[norseHeroId];
    if (!norseHero) {
      return;
    }
    
    const WEAPON_COST = 5;
    const currentMana = playerMana;
    
    // Check mana
    if (currentMana < WEAPON_COST) {
      return;
    }
    
    // Check if already upgraded
    if (weaponUpgraded) {
      return;
    }
    
    
    // Fire announcement
    fireActionAnnouncement('spell', `${norseHero.name} equips ${norseHero.weaponUpgrade.name}!`, { duration: 2500 });
    
    // Mark as upgraded
    setWeaponUpgraded(true);
    
    // Deduct mana from gameStore
    useGameStore.setState(state => {
      if (!state.gameState?.players?.player?.mana) return state;
      return {
        ...state,
        gameState: {
          ...state.gameState,
          players: {
            ...state.gameState.players,
            player: {
              ...state.gameState.players.player,
              mana: {
                ...state.gameState.players.player.mana,
                current: Math.max(0, state.gameState.players.player.mana.current - WEAPON_COST)
              }
            }
          }
        }
      };
    });
    
    // Execute immediate effect based on weapon upgrade definition
    const immediateEffect = norseHero.weaponUpgrade.immediateEffect;
    
    // Handle immediate effect based on type
    if (immediateEffect.value) {
      switch (immediateEffect.type) {
        case 'damage':
          applyDirectDamage('opponent', immediateEffect.value, `${norseHero.weaponUpgrade.name}`);
          break;
        case 'heal':
          getPokerCombatAdapterState().healPlayerHero(immediateEffect.value || 0);
          break;
        case 'armor':
          getPokerCombatAdapterState().addPlayerArmor(immediateEffect.value || 0);
          break;
        default:
      }
    }
    
  }, [combatState, weaponUpgraded, applyDirectDamage, playerMana]);
  
  // Cancel targeting with ESC key or right-click
  useEffect(() => {
    if (!selectedCard) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        selectCard(null);
      }
    };
    
    const handleRightClick = (e: MouseEvent) => {
      if (e.button === 2) {
        e.preventDefault();
        selectCard(null);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('contextmenu', handleRightClick);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('contextmenu', handleRightClick);
    };
  }, [selectedCard, selectCard]);

  // Track mulligan state transitions using stable primitive selector
  const prevMulliganActiveRef = useRef<boolean | undefined>(undefined);
  
  // Track if we've already processed the mulligan for this combat
  const [mulliganProcessed, setMulliganProcessed] = useState(false);
  // Track if mulligan has been "armed" (we've seen active: true at least once)
  const [mulliganArmed, setMulliganArmed] = useState(false);
  
  // Reset mulliganProcessed and armed state when a new combat starts (new combatId)
  useEffect(() => {
    if (combatState?.combatId) {
      setMulliganProcessed(false);
      setMulliganArmed(false);
      prevMulliganActiveRef.current = undefined;
    }
  }, [combatState?.combatId]);
  
  // Watch for mulligan state transitions
  // First, arm when mulligan.active becomes true
  // Then, fire completeMulligan when it transitions from true -> false
  useEffect(() => {
    // Skip if poker mulligan already complete (skipMulligan was true) or already processed
    if (mulliganComplete || mulliganProcessed) {
      return;
    }
    
    // Only process when poker combat is in MULLIGAN phase
    if (combatState?.phase !== CombatPhase.MULLIGAN) {
      return;
    }
    
    // Track current value for transition detection
    const wasActive = prevMulliganActiveRef.current;
    const isNowActive = mulliganActive === true;
    const isNowInactive = mulliganActive === false;
    
    // Always update ref to track current state
    prevMulliganActiveRef.current = mulliganActive;
    
    // Log state for debugging
    
    // Step 1: Arm the observer when we see mulligan.active = true
    if (isNowActive && !mulliganArmed) {
      setMulliganArmed(true);
      return;
    }
    
    // Step 2: Fire completeMulligan when armed and mulligan transitions to false
    if (mulliganArmed && isNowInactive) {
      setMulliganProcessed(true);
      completeMulligan();
    }
  }, [mulliganActive, combatState?.phase, completeMulligan, mulliganProcessed, mulliganArmed, mulliganComplete]);
  
  // Get endTurn and grantPokerHandRewards from gameStore early so they can be used in handleAction
  const endTurn = useGameStore(state => state.endTurn);
  const grantPokerHandRewards = useGameStore(state => state.grantPokerHandRewards);
  
  const handleAction = useCallback((action: CombatAction, hp?: number) => {
    if (!combatState) return;
    
    // CRITICAL: Check fresh state to prevent double-clicking race condition
    const freshState = getPokerCombatAdapterState().combatState;
    if (!freshState || freshState.player.isReady) {
      return;
    }
    
    // Show popup announcement for player poker actions with stamina changes
    if (action === CombatAction.DEFEND) {
      fireActionAnnouncement('poker_check', 'Check', { subtitle: '+1 ⚡ STA', duration: 1200 });
    } else if (action === CombatAction.ATTACK) {
      const staminaCost = hp ? Math.ceil(hp / 10) : 0;
      fireActionAnnouncement('poker_bet', hp ? `Bet ${hp} HP` : 'Bet', { subtitle: staminaCost > 0 ? `-${staminaCost} ⚡ STA` : undefined, duration: 1200 });
    } else if (action === CombatAction.ENGAGE) {
      // Call does NOT cost stamina - only betting does
      fireActionAnnouncement('poker_call', 'Call', { duration: 1200 });
    } else if (action === CombatAction.BRACE) {
      fireActionAnnouncement('poker_fold', 'Fold', { duration: 1200 });
    }
    
    performAction(combatState.player.playerId, action, hp);
    
    // If player folded (BRACE), also trigger the card game's end turn
    // This makes Fold function the same as End Turn for the card game
    // Note: endTurn already handles card draw, so we don't call grantPokerHandRewards here
    if (action === CombatAction.BRACE) {
      endTurn();
    }
    
    // FALLBACK AI Response: The primary AI response logic is in usePokerAI hook.
    // This callback-based response serves as a defensive fallback in case React's
    // useEffect batching or other edge cases prevent the hook from firing.
    // The aiResponseInProgressRef prevents double-triggering between hook and callback.
    const phaseBeforeAction = combatState.phase;
    
    setTimeout(() => {
      try {
        // Guard: Check if usePokerAI hook already triggered AI response
        if (aiResponseInProgressRef.current) {
          console.log('[AI Response handleAction] SKIP: AI action already in progress from usePokerAI hook');
          return;
        }
        
        // Get fresh state from adapter to avoid stale closure
        const adapterState = getPokerCombatAdapterState();
        const freshStateAfterAction = adapterState.combatState;
        
        console.log('[AI Response handleAction] Checking if AI should respond...', {
          hasFreshState: !!freshStateAfterAction,
          opponentReady: freshStateAfterAction?.opponent?.isReady,
          playerReady: freshStateAfterAction?.player?.isReady,
          phase: freshStateAfterAction?.phase,
          phaseBeforeAction,
          foldWinner: freshStateAfterAction?.foldWinner,
          isAllInShowdown: freshStateAfterAction?.isAllInShowdown,
          playerHP: freshStateAfterAction?.player?.pet?.stats?.currentHealth,
          opponentHP: freshStateAfterAction?.opponent?.pet?.stats?.currentHealth
        });
        
        if (!freshStateAfterAction || freshStateAfterAction.opponent.isReady) {
          console.log('[AI Response handleAction] SKIP: No fresh state or opponent already ready');
          return;
        }
        
        // FIX: Skip if phase has already advanced (betting round was closed)
        // This prevents AI from acting twice when maybeCloseBettingRound advances the phase
        if (freshStateAfterAction.phase !== phaseBeforeAction) {
          console.log('[AI Response handleAction] SKIP: Phase has advanced');
          return;
        }
        
        // FIX: Skip if already in RESOLUTION phase
        if (freshStateAfterAction.phase === CombatPhase.RESOLUTION) {
          console.log('[AI Response handleAction] SKIP: Already in RESOLUTION');
          return;
        }
        
        // FIX: Skip if there's already a foldWinner (fold was processed)
        if (freshStateAfterAction.foldWinner) {
          console.log('[AI Response handleAction] SKIP: Fold winner already set');
          return;
        }
        
        // FIX: Skip if all-in showdown is active - the all-in useEffect handles phase advancement
        if (freshStateAfterAction.isAllInShowdown) {
          console.log('[AI Response handleAction] SKIP: All-in showdown - auto-advance useEffect handles phases');
          return;
        }
        
        // Set in-progress flag to prevent useEffect from double-triggering
        aiResponseInProgressRef.current = true;
        
        // Log state before AI decision
        console.log('[AI Response handleAction] AI will respond now');
        
        // Use SmartAI for intelligent decision making
        const aiDecision = getSmartAIAction(freshStateAfterAction, false);
        console.log('[AI Response handleAction] AI decision:', aiDecision);
        
        // Use direct store access to avoid stale closure issues
        getPokerCombatAdapterState().performAction(freshStateAfterAction.opponent.playerId, aiDecision.action, aiDecision.betAmount);
        
        // CRITICAL FIX: After AI action, explicitly check if betting round should close
        // This ensures phase advances even if React's useEffect doesn't fire immediately
        setTimeout(() => {
          const adapterAfterAI = getPokerCombatAdapterState();
          if (adapterAfterAI.combatState && 
              adapterAfterAI.combatState.player.isReady && 
              adapterAfterAI.combatState.opponent.isReady &&
              adapterAfterAI.combatState.phase !== CombatPhase.RESOLUTION) {
            adapterAfterAI.maybeCloseBettingRound();
          }
          aiResponseInProgressRef.current = false;
        }, 100);
      } catch (error) {
        console.error('[AI Response handleAction] ERROR:', error);
        aiResponseInProgressRef.current = false;
      }
    }, 1000);
  }, [combatState, performAction, endTurn]);
  
  const handleCombatEnd = useCallback(() => {
    if (!resolution) return;
    
    // Advance turn orchestrator: POKER_RESOLUTION → MINION_COMBAT
    // This signals that poker phase is complete and minion combat can begin
    advanceTurnPhase();
    
    // Normal hand completion - match continues
    // Note: Hero death is now handled at resolution time, not here
    grantPokerHandRewards();
    
    // Use startNextHandDelayed from adapter which handles the 2s pause and prevents race conditions
    getPokerCombatAdapterState().startNextHandDelayed(resolution);
    setResolution(null);
  }, [resolution, grantPokerHandRewards, advanceTurnPhase]);
  
  // Backup timer for showdown celebration - prevents freeze if animation fails
  // This ensures handleCombatEnd is called even if ShowdownCelebration unmounts prematurely
  useEffect(() => {
    if (showdownCelebration && !heroDeathState?.isAnimating) {
      // Clear any existing timer
      if (showdownBackupTimerRef.current) {
        clearTimeout(showdownBackupTimerRef.current);
      }
      
      // Set backup timer - 8 seconds should be enough for any animation
      // If onComplete hasn't fired by then, force progress via same path as normal completion
      showdownBackupTimerRef.current = setTimeout(() => {
        console.warn('[RagnarokCombatArena] Showdown backup timer fired - forcing combat end', { hasResolution: !!resolution });
        setShowdownCelebration(null);
        // Use the same path as normal onComplete - call handleCombatEnd which properly
        // handles all side effects including grantPokerHandRewards and startNextHandDelayed
        handleCombatEnd();
      }, 8000);
    }
    
    return () => {
      if (showdownBackupTimerRef.current) {
        clearTimeout(showdownBackupTimerRef.current);
        showdownBackupTimerRef.current = null;
      }
    };
  }, [showdownCelebration, heroDeathState?.isAnimating, handleCombatEnd]);
  
  // Handle hero death animation completion
  const handleHeroDeathComplete = useCallback(() => {
    if (!heroDeathState) return;
    
    
    // Use pendingResolution.winner if available, otherwise derive from death state
    // Hero death always means someone won (no draws on death)
    let winner: 'player' | 'opponent' = heroDeathState.isPlayerDead ? 'opponent' : 'player';
    if (heroDeathState.pendingResolution?.winner === 'player' || 
        heroDeathState.pendingResolution?.winner === 'opponent') {
      winner = heroDeathState.pendingResolution.winner;
    }
    
    // Clear hero death state and showdown celebration first
    setHeroDeathState(null);
    setShowdownCelebration(null);
    
    // Now trigger the actual combat end
    if (onCombatEnd) {
      onCombatEnd(winner);
    }
    endCombat();
  }, [heroDeathState, onCombatEnd, endCombat]);

  // Unified end turn handler - ends both poker betting round AND card game turn
  // This triggers opponent to play cards and attack, then returns to player
  const handleUnifiedEndTurn = useCallback(() => {
    if (!combatState) return;
    
    
    // If player hasn't taken a poker action yet, auto-defend (check)
    if (!combatState.player.isReady) {
      performAction(combatState.player.playerId, CombatAction.DEFEND);
    }
    
    // Call the card game's endTurn to simulate opponent's turn
    // This will: 1) switch turn to opponent, 2) opponent plays cards, 3) opponent attacks, 4) return to player
    // Note: endTurn already handles card draw, so we don't call grantPokerHandRewards here
    endTurn();
    
    
  }, [combatState, performAction, endTurn]);

  if (!combatState || !isActive) {
    return null;
  }

  // Convert timer to Roman numerals for display
  const toRoman = (num: number): string => {
    if (num <= 0) return '0';
    const romanNumerals: [number, string][] = [
      [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']
    ];
    let result = '';
    let remaining = num;
    for (const [value, numeral] of romanNumerals) {
      while (remaining >= value) {
        result += numeral;
        remaining -= value;
      }
    }
    return result;
  };

  return (
    <GameViewport>
      <div className="ragnarok-combat-arena viewport-mode">
        {/* Minimal Timer at Top Center */}
        <div className={`zone-timer minimal-timer ${combatState.turnTimer <= 10 ? 'low-time' : ''}`}>
          {combatState.turnTimer}
        </div>
        
        <div className="arena-content">
          <UnifiedCombatArena 
            onAction={handleAction}
            onEndTurn={handleUnifiedEndTurn}
            betAmount={betAmount}
            setBetAmount={setBetAmount}
            showdownCelebration={showdownCelebration}
            onOpponentHeroClick={handleOpponentHeroClick}
            onPlayerHeroClick={handlePlayerHeroClick}
            isOpponentTargetable={isOpponentTargetable}
            isPlayerTargetable={isPlayerTargetable}
            playerMana={playerMana}
            playerMaxMana={playerMaxMana}
            opponentMana={opponentMana}
            opponentMaxMana={opponentMaxMana}
            playerPet={combatState.player.pet}
            opponentPet={combatState.opponent.pet}
            playerHpCommitted={combatState.player.hpCommitted}
            opponentHpCommitted={combatState.opponent.hpCommitted}
            playerLevel={combatState.player.pet?.stats?.level ?? 1}
            opponentLevel={combatState.opponent.pet?.stats?.level ?? 1}
            playerSecrets={[]}
            playerHeroClass={(combatState.player as any).heroClass ?? 'neutral'}
            onHeroPowerClick={handleHeroPower}
            onWeaponUpgradeClick={handleWeaponUpgrade}
            isWeaponUpgraded={weaponUpgraded}
            heroPowerTargeting={heroPowerTargeting}
            executeHeroPowerEffect={executeHeroPowerEffect}
            handCards={playerHand}
            handCurrentMana={playerMana}
            handIsPlayerTurn={isPlayerTurn}
            onCardPlay={sharedHandleCardPlay}
            registerCardPosition={sharedRegisterCardPosition}
            battlefieldRef={sharedBattlefieldRef}
          />
        </div>

      <TargetingOverlay />
      <CardBurnOverlay />
      <ActionAnnouncement />
      <AIAttackAnimationProcessor />
      <AnimationOverlay />
      
      {/* Spell/Battlecry Targeting Prompt */}
      <TargetingPrompt card={selectedCard} />
      
      {/* Hero Power Targeting Prompt */}
      <HeroPowerPrompt targeting={heroPowerTargeting} onCancel={cancelHeroPowerTargeting} />

      {/* Mulligan Screen - rendered as overlay when mulligan is active */}
      {mulliganActive && gameStateMulligan && (
        <MulliganScreen
          mulligan={gameStateMulligan}
          playerHand={playerHand}
          onMulliganAction={() => {}}
        />
      )}

      {/* Non-blocking Showdown Celebration - replaces old blocking resolution-overlay */}
      {showdownCelebration && !heroDeathState?.isAnimating && (
        <ShowdownCelebration
          resolution={{
            winner: resolution?.winner || showdownCelebration.resolution.winner,
            resolutionType: resolution?.resolutionType || showdownCelebration.resolution.resolutionType,
            playerHand: resolution?.playerHand || showdownCelebration.resolution.playerHand,
            opponentHand: resolution?.opponentHand || showdownCelebration.resolution.opponentHand,
            playerDamage: resolution?.playerDamage || 0,
            opponentDamage: resolution?.opponentDamage || 0,
            playerFinalHealth: resolution?.playerFinalHealth || 0,
            opponentFinalHealth: resolution?.opponentFinalHealth || 0,
            whoFolded: resolution?.whoFolded || showdownCelebration.resolution.whoFolded
          }}
          onComplete={() => {
            // Clear backup timer - animation completed normally
            if (showdownBackupTimerRef.current) {
              clearTimeout(showdownBackupTimerRef.current);
              showdownBackupTimerRef.current = null;
            }
            setShowdownCelebration(null);
            handleCombatEnd();
          }}
        />
      )}
      
      {/* Hero Death Animation - plays crumble/fade when a hero dies */}
      <AnimatePresence>
        {heroDeathState?.isAnimating && (
          <HeroDeathAnimation
            heroName={heroDeathState.deadHeroName}
            isPlayer={heroDeathState.isPlayerDead}
            onComplete={handleHeroDeathComplete}
          />
        )}
      </AnimatePresence>
    </div>
    </GameViewport>
  );
};

export default RagnarokCombatArena;

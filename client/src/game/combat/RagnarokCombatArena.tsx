import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePokerCombatAdapter, getActionPermissions, getPokerCombatAdapterState } from '../hooks/usePokerCombatAdapter';
import { useGameStore } from '../stores/gameStore';
import {
  CombatPhase,
  CombatAction,
  PokerCard,
  PokerHandRank,
  getCombinedHandName
} from '../types/PokerCombatTypes';
import { evaluatePokerHand } from '../stores/combat/pokerCombatSlice';
import SimpleBattlefield from '../components/SimpleBattlefield';
import HandFan from '../components/HandFan';
import ManaBar from '../components/ManaBar';
import { MulliganScreen } from '../components/MulliganScreen';
import { adaptCardInstance } from '../utils/cards/cardInstanceAdapter';
import { Position } from '../types/Position';
import { TargetingOverlay } from '../components/TargetingOverlay';
import { CardBurnOverlay } from '../components/CardBurnOverlay';
import { useUnifiedUIStore } from '../stores/unifiedUIStore';
import { ActionAnnouncement } from '../components/ActionAnnouncement';
import './RagnarokCombatArena.css';
import './GameViewport.css';
import AIAttackAnimationProcessor from '../components/AIAttackAnimationProcessor';
import { PixiParticleCanvas } from '../animations/PixiParticleCanvas';

import { AnimationOverlay } from '../components/AnimationOverlay';
import { ALL_NORSE_HEROES } from '../data/norseHeroes';
import { ShowdownCelebration } from './components/ShowdownCelebration';
import { TargetingPrompt } from './components/TargetingPrompt';
import { HeroPowerPrompt } from './components/HeroPowerPrompt';
import { DamageIndicator } from './components/DamageIndicator';
import { TurnBanner } from './components/TurnBanner';
import { GameOverScreen } from './components/GameOverScreen';
import { GameHUD } from './components/GameHUD';
import { HeroDeathAnimation } from './components/HeroDeathAnimation';
import { PlayingCard } from './components/PlayingCard';
import { HoleCardsOverlay } from './components/HoleCardsOverlay';
import { BattlefieldHero } from './components/BattlefieldHero';
import HeroGearPanel from './components/HeroGearPanel';
import { ElementBuffPopup } from './components/ElementBuffPopup';
import { ElementMatchupBanner } from './components/ElementMatchupBanner';
import { FirstStrikeAnimation } from './components/FirstStrikeAnimation';
import { PhaseBanner } from './components/PhaseBanner';
import { RiskDisplay } from './components/PotDisplay';
import { useElementalBuff } from './hooks/useElementalBuff';
import { canCardAttack as canCardAttackCheck } from './attackUtils';
import { GameViewport } from './GameViewport';
import { useCombatLayout } from '../hooks/useCombatLayout';
import CardRenderer from '../components/CardRendering/CardRenderer';
import { useRagnarokCombatController } from './hooks/useRagnarokCombatController';
import { HeroBattlePopup } from './components/HeroBattlePopup';
import { KingPassivePopup } from './components/KingPassivePopup';
import type { ShowdownCelebration as ShowdownCelebrationState } from './hooks/useCombatEvents';
import { isCardInWinningHand } from './utils/combatArenaUtils';
import { debug } from '../config/debugConfig';
import { playSound } from '../utils/soundUtils';
import { GameLog } from '../components/GameLog';
import { useGameLogIntegration } from '../hooks/useGameLogIntegration';
import { usePokerDrama } from './hooks/usePokerDrama';
import { HandStrengthIndicator } from './components/HandStrengthIndicator';
import './styles/poker-drama.css';
import { useEventAnimationBridge } from '../hooks/useEventAnimationBridge';
import { useKingPassiveEventStore } from '../stores/kingPassiveEventStore';
import { useDamageAnimations } from './hooks/useDamageAnimations';
import type { HealthSnapshot } from './hooks/useDamageAnimations';
import { usePokerCardClickHandlers } from './hooks/usePokerCardClickHandlers';
import { usePokerKeyboardShortcuts } from './hooks/usePokerKeyboardShortcuts';
import { useRealmAnnouncement } from './hooks/useRealmAnnouncement';
import { useHeroHealthEffects } from './hooks/useHeroHealthEffects';

const SwordIcon = () => (
	<svg className="btn-icon" viewBox="0 0 20 20" fill="currentColor">
		<path d="M16.5 1l-1 3.5-1.2 1.2-5.8 5.8-1.4-1.4 5.8-5.8L14 3.1 15.5 1h1zM7.6 11l1.4 1.4-2.3 2.3 1.1 1.1a1 1 0 01-1.4 1.4l-1.1-1.1-1.8 1.8a1 1 0 01-1.4-1.4l1.8-1.8-1.1-1.1a1 1 0 011.4-1.4l1.1 1.1L7.6 11z"/>
	</svg>
);

const CrossedSwordsIcon = () => (
	<svg className="btn-icon" viewBox="0 0 20 20" fill="currentColor">
		<path d="M3.5 1l1 3.5 1.2 1.2 4.3 4.3 4.3-4.3L15.5 4.5l1-3.5h1L16 5.3l-1.2 1.2L10 11.3l-1.5 1.5 1.1 1.1a1 1 0 01-1.4 1.4l-1.1-1.1-1.8 1.8a1 1 0 01-1.4-1.4l1.8-1.8-1.1-1.1a1 1 0 011.4-1.4l1.1 1.1L8.6 10 4.3 5.7 3.1 4.5 1 5.5V4.5L2.5 1h1z"/>
		<path d="M11.4 12.4l1.5-1.5 4.8 4.8-1.2 1.2L18 18.5a1 1 0 01-1.4 1.4l-1.6-1.6-1.2 1.2-4.8-4.8z" opacity="0.85"/>
	</svg>
);

const ShieldIcon = () => (
	<svg className="btn-icon" viewBox="0 0 20 20" fill="currentColor">
		<path d="M10 1L3 4v5c0 4.5 3 8.3 7 9.8 4-1.5 7-5.3 7-9.8V4l-7-3zm0 2.2L15 5.8v3.4c0 3.5-2.2 6.5-5 7.8-2.8-1.3-5-4.3-5-7.8V5.8L10 3.2z"/>
		<circle cx="10" cy="9.5" r="2.5" opacity="0.6"/>
	</svg>
);

const HelmIcon = () => (
	<svg className="btn-icon" viewBox="0 0 20 20" fill="currentColor">
		<path d="M10 2C6.5 2 3.5 4.5 3 8v3c0 .6.4 1 1 1h1v2.5c0 .8.7 1.5 1.5 1.5h1c.6 0 1-.3 1.2-.8L10 13l1.3 2.2c.2.5.6.8 1.2.8h1c.8 0 1.5-.7 1.5-1.5V12h1c.6 0 1-.4 1-1V8c-.5-3.5-3.5-6-7-6zM5 8.5c.3-2.5 2.5-4.5 5-4.5s4.7 2 5 4.5V10H5V8.5z"/>
		<path d="M9.2 7h1.6v3H9.2V7z" opacity="0.5"/>
	</svg>
);

interface RagnarokCombatArenaProps {
  onCombatEnd?: (winner: 'player' | 'opponent' | 'draw') => void;
}

// DamageAnimation and HealthSnapshot types imported from hooks/useDamageAnimations

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
  playerPet?: any; // eslint-disable-line @typescript-eslint/no-explicit-any -- PetData | CardInstance union
  opponentPet?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  playerHpCommitted?: number;
  opponentHpCommitted?: number;
  playerLevel?: number;
  opponentLevel?: number;
  playerSecrets?: any[]; // eslint-disable-line @typescript-eslint/no-explicit-any
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
  executeHeroPowerEffect?: (norseHero: any, heroPower: any, target: any) => void; // eslint-disable-line @typescript-eslint/no-explicit-any
  // Hand props
  handCards?: any[]; // eslint-disable-line @typescript-eslint/no-explicit-any
  handCurrentMana?: number;
  handIsPlayerTurn?: boolean;
  onCardPlay?: (card: any, target?: any) => void; // eslint-disable-line @typescript-eslint/no-explicit-any
  registerCardPosition?: (card: any, position: any) => void; // eslint-disable-line @typescript-eslint/no-explicit-any
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
  const noopRegisterCardPosition = useCallback(() => {}, []);

  // Subscribe directly to adapter for reactive updates
  const { combatState, applyDirectDamage } = usePokerCombatAdapter();
  
  // Game state for battlefield — use individual selectors to avoid unnecessary re-renders
  const gameState = useGameStore(s => s.gameState);
  const autoAttackAll = useGameStore(s => s.autoAttackAll);
  const selectAttacker = useGameStore(s => s.selectAttacker);

  const isPlayerTurn = gameState?.currentTurn === 'player';

  const [communityCardsRevealed, setCommunityCardsRevealed] = useState(false);
  const [showGearPanel, setShowGearPanel] = useState(false);

  useEffect(() => {
    if (!combatState?.phase) return;
    const phase = combatState.phase;
    if (phase === CombatPhase.SPELL_PET || phase === CombatPhase.MULLIGAN || phase === CombatPhase.PRE_FLOP) {
      setCommunityCardsRevealed(false);
    } else if (phase === CombatPhase.FAITH || phase === CombatPhase.FORESIGHT || phase === CombatPhase.DESTINY || phase === CombatPhase.RESOLUTION) {
      setCommunityCardsRevealed(true);
    }
  }, [combatState?.phase]);

  const wrappedOnAction = useCallback((action: CombatAction, hp?: number) => {
    setCommunityCardsRevealed(true);
    onAction(action, hp);
  }, [onAction]);
  
  // Refs for battlefield
  const internalBattlefieldRef = useRef<HTMLDivElement>(null);
  const battlefieldRef = externalBattlefieldRef || internalBattlefieldRef;
  const minionPositionsRef = useRef<Map<string, { x: number; y: number }>>(new Map());
  const prevMinionPositionsRef = useRef<Map<string, { x: number; y: number }>>(new Map());

  // Extracted hooks
  const {
    damageAnimations,
    shakingTargets,
    screenShakeClass,
    prevHealthRef,
    triggerScreenShake,
    triggerDamageAnimation,
    removeDamageAnimation,
    addShakingTarget,
  } = useDamageAnimations();

  usePokerKeyboardShortcuts({ betAmount, onAction, setCommunityCardsRevealed });
  
  // Battlefield card data
  const playerBattlefield = useMemo(() => {
    const cards = gameState?.players?.player?.battlefield || [];
    return cards.map((card: any) => adaptCardInstance(card));
  }, [gameState?.players?.player?.battlefield]);
  
  const opponentBattlefield = useMemo(() => {
    const cards = gameState?.players?.opponent?.battlefield || [];
    return cards.map((card: any) => adaptCardInstance(card));
  }, [gameState?.players?.opponent?.battlefield]);
  
  const evolveReadyIds = useMemo(() => {
    const ids = new Set<string>();
    const bf = gameState?.players?.player?.battlefield;
    if (!bf || !handCards) return ids;
    const readyPets = bf.filter((m: any) => m.petEvolutionMet === true);
    if (readyPets.length === 0) return ids;
    for (const hc of handCards) {
      const cd = (hc as any).card || hc;
      if (cd?.petStage === 'adept' && cd.evolvesFrom) {
        if (readyPets.some((m: any) => m.card?.id === cd.evolvesFrom)) ids.add((hc as any).instanceId);
      } else if (cd?.petStage === 'master' && cd.petFamily) {
        if (readyPets.some((m: any) => (m.card as any)?.petFamily === cd.petFamily && (m.card as any)?.petStage === 'adept')) ids.add((hc as any).instanceId);
      }
    }
    return ids;
  }, [gameState?.players?.player?.battlefield, handCards]);

  const opponentSecrets = gameState?.players?.opponent?.secrets || [];
  const opponentHeroClass = gameState?.players?.opponent?.heroClass || 'neutral';
  
  const enrichedPlayerPet = useMemo(() => {
    if (!playerPet || !combatState) return playerPet;
    return {
      ...playerPet,
      stats: {
        ...playerPet.stats,
        armor: combatState.player.heroArmor || 0
      }
    };
  }, [playerPet, combatState?.player?.heroArmor]);

  const enrichedOpponentPet = useMemo(() => {
    if (!opponentPet || !combatState) return opponentPet;
    return {
      ...opponentPet,
      stats: {
        ...opponentPet.stats,
        armor: combatState.opponent.heroArmor || 0
      }
    };
  }, [opponentPet, combatState?.opponent?.heroArmor]);

  const rawAttackingCard = useGameStore(s => s.attackingCard);
  const attackingCard = useMemo(() => {
    return rawAttackingCard ? adaptCardInstance(rawAttackingCard as any) : null;
  }, [rawAttackingCard]);

  // Turn transition flash
  const [turnFlash, setTurnFlash] = useState<'player' | 'opponent' | null>(null);
  const prevIsPlayerTurnRef = useRef(isPlayerTurn);
  useEffect(() => {
    let id: ReturnType<typeof setTimeout> | undefined;
    if (prevIsPlayerTurnRef.current !== isPlayerTurn) {
      setTurnFlash(isPlayerTurn ? 'player' : 'opponent');
      id = setTimeout(() => setTurnFlash(null), 500);
      prevIsPlayerTurnRef.current = isPlayerTurn;
    }
    return () => { if (id !== undefined) clearTimeout(id); };
  }, [isPlayerTurn]);

  // Health change detection — triggers floating damage/heal numbers
  useEffect(() => {
    if (!gameState) return;
    const player = gameState.players.player;
    const opponent = gameState.players.opponent;

    const currentSnapshot: HealthSnapshot = {
      playerHeroHealth: player.heroHealth ?? player.health,
      playerHeroArmor: player.heroArmor ?? 0,
      opponentHeroHealth: opponent.heroHealth ?? opponent.health,
      opponentHeroArmor: opponent.heroArmor ?? 0,
      playerMinions: new Map(player.battlefield.map(m => [m.instanceId, (m.card as any)?.health ?? (m as any).currentHealth ?? 0])),
      opponentMinions: new Map(opponent.battlefield.map(m => [m.instanceId, (m.card as any)?.health ?? (m as any).currentHealth ?? 0]))
    };

    const prev = prevHealthRef.current;
    if (prev) {
      const getHeroPos = (selector: string) => {
        const isPlayer = selector.includes('player');
        const selectors = isPlayer
          ? ['[data-hero-role="player"] .battlefield-hero-square', '[data-hero-role="player"]', '.poker-hero-container']
          : ['[data-hero-role="opponent"] .battlefield-hero-square', '[data-hero-role="opponent"]', '.opponent-hero-container'];
        for (const sel of selectors) {
          const el = document.querySelector(sel);
          if (el) {
            const rect = el.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
              return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 3 };
            }
          }
        }
        return isPlayer
          ? { x: 120, y: window.innerHeight * 0.75 }
          : { x: 120, y: window.innerHeight * 0.15 };
      };

      const getMinionPos = (id: string) => {
        const el = document.querySelector(`[data-instance-id="${id}"]`) ||
                   document.querySelector(`[data-card-id="${id}"]`);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 3 };
          }
        }
        return null;
      };

      const playerDiff = prev.playerHeroHealth - currentSnapshot.playerHeroHealth;
      if (playerDiff > 0) {
        const pos = getHeroPos('.player-hero');
        triggerDamageAnimation('player-hero', playerDiff, pos.x, pos.y);
      } else if (playerDiff < 0) {
        const pos = getHeroPos('.player-hero');
        triggerDamageAnimation('player-hero', Math.abs(playerDiff), pos.x, pos.y, true);
      }

      const opponentDiff = prev.opponentHeroHealth - currentSnapshot.opponentHeroHealth;
      if (opponentDiff > 0) {
        const pos = getHeroPos('.opponent-hero');
        triggerDamageAnimation('opponent-hero', opponentDiff, pos.x, pos.y);
      } else if (opponentDiff < 0) {
        const pos = getHeroPos('.opponent-hero');
        triggerDamageAnimation('opponent-hero', Math.abs(opponentDiff), pos.x, pos.y, true);
      }

      for (const [id, prevHp] of prev.playerMinions) {
        const currHp = currentSnapshot.playerMinions.get(id);
        if (currHp !== undefined && prevHp > currHp) {
          const pos = getMinionPos(id);
          if (pos) triggerDamageAnimation(id, prevHp - currHp, pos.x, pos.y);
        }
      }
      for (const [id, prevHp] of prev.opponentMinions) {
        const currHp = currentSnapshot.opponentMinions.get(id);
        if (currHp !== undefined && prevHp > currHp) {
          const pos = getMinionPos(id);
          if (pos) triggerDamageAnimation(id, prevHp - currHp, pos.x, pos.y);
        }
      }
    }

    prevHealthRef.current = currentSnapshot;
  }, [gameState, triggerDamageAnimation, prevHealthRef]);

  // Card click handlers (extracted to hook)
  const { handlePlayerCardClick, handleOpponentCardClick, handleCardPlay } = usePokerCardClickHandlers({
    isPlayerTurn,
    heroPowerTargeting,
    executeHeroPowerEffect,
    addShakingTarget,
    gameState,
  });
  
  const basePermissions = useMemo(
    () => getActionPermissions(combatState, true),
    [combatState]
  );

  // Early return if no combat state
  if (!combatState) {
    return <div className="unified-combat-arena">Loading...</div>;
  }

  const isMulligan = combatState.phase === CombatPhase.MULLIGAN;
  const phaseAllowsFaith = !isMulligan && combatState.phase !== CombatPhase.SPELL_PET && combatState.phase !== CombatPhase.PRE_FLOP;
  const showFaith = phaseAllowsFaith && communityCardsRevealed;
  const showForesight = communityCardsRevealed && !isMulligan && (combatState.phase === CombatPhase.FORESIGHT || combatState.phase === CombatPhase.DESTINY || combatState.phase === CombatPhase.RESOLUTION);
  const showDestiny = communityCardsRevealed && !isMulligan && (combatState.phase === CombatPhase.DESTINY || combatState.phase === CombatPhase.RESOLUTION);

  const disabled = isMulligan || !basePermissions?.isMyTurnToAct;

  const playerHandEval = useMemo(() => {
    if (!combatState || isMulligan) return null;
    const holeCards = combatState.player.holeCards;
    if (!holeCards || holeCards.length === 0) return null;
    const community: PokerCard[] = [
      ...(showFaith ? (combatState.communityCards.faith || []) : []),
      ...(showForesight && combatState.communityCards.foresight ? [combatState.communityCards.foresight] : []),
      ...(showDestiny && combatState.communityCards.destiny ? [combatState.communityCards.destiny] : [])
    ];
    if (community.length === 0 && holeCards.length < 5) return null;
    return evaluatePokerHand(holeCards, community);
  }, [combatState?.player?.holeCards, combatState?.communityCards, showFaith, showForesight, showDestiny, isMulligan]);

  const handStrengthClass = useMemo(() => {
    if (!playerHandEval) return 'weak';
    const r = playerHandEval.rank;
    if (r >= PokerHandRank.DIVINE_ALIGNMENT) return 'royal';
    if (r >= PokerHandRank.VALHALLAS_BLESSING) return 'very-strong';
    if (r >= PokerHandRank.ODINS_EYE) return 'strong';
    if (r >= PokerHandRank.THORS_HAMMER) return 'medium';
    return 'weak';
  }, [playerHandEval]);

  const handStrengthPercent = useMemo(() => {
    if (!playerHandEval) return 0;
    return Math.min(100, (playerHandEval.rank / PokerHandRank.RAGNAROK) * 100);
  }, [playerHandEval]);

  return (
    <div className="unified-combat-arena" ref={battlefieldRef as React.RefObject<HTMLDivElement>}>
      {/* Turn transition flash overlay */}
      {turnFlash && (
        <div className={`turn-flash-overlay turn-flash-${turnFlash}`} />
      )}

      
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
          <div data-hero-role="opponent" className="opponent-hero-container">
            <BattlefieldHero
              pet={enrichedOpponentPet}
              hpCommitted={opponentHpCommitted}
              pokerPosition={combatState.opponentPosition}
              level={opponentLevel}
              onClick={onOpponentHeroClick}
              isTargetable={isOpponentTargetable}
              isOpponent={true}
              secrets={opponentSecrets}
              heroClass={opponentHeroClass}
              mana={opponentMana}
              maxMana={opponentMaxMana}
            />
            {/* Opponent hole cards - uses HoleCardsOverlay component for consistent rendering */}
            <HoleCardsOverlay
              cards={combatState.opponent.holeCards}
              variant="opponent"
              faceDown={!(combatState.isAllInShowdown || showdownCelebration?.resolution.resolutionType === 'showdown')}
              winningCards={showdownCelebration?.winningCards}
              isShowdown={showdownCelebration?.resolution.resolutionType === 'showdown'}
              activeTurn={!!basePermissions?.waitingForOpponent}
            />
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
          {(gameState?.players?.opponent?.hand || []).slice(0, 10).map((card: any, index: number) => (
            card.isRevealed ? (
              <div key={card.instanceId || `opp-revealed-${index}`} className="opponent-revealed-card scale-[0.4] -mx-8">
                <CardRenderer card={card} isInHand={true} size="small" />
              </div>
            ) : (
              <div key={`opp-card-${index}`} className="opponent-card-back" />
            )
          ))}
          {(gameState?.players?.opponent?.hand?.length || 0) > 0 && (
            <div className="opponent-hand-count">
              {gameState?.players?.opponent?.hand?.length || 0}
            </div>
          )}
        </div>
      </div>
      
      {/* Risk Display - total HP at stake */}
      <RiskDisplay risk={combatState.pot} hidden={isMulligan} />
      
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
          registerCardPosition={registerCardPosition || noopRegisterCardPosition}
          renderMode="opponent"
          shakingTargets={shakingTargets}
          isInteractionDisabled={gameState?.gamePhase === 'game_over'}
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
          registerCardPosition={registerCardPosition || noopRegisterCardPosition}
          renderMode="player"
          shakingTargets={shakingTargets}
          isInteractionDisabled={gameState?.gamePhase === 'game_over'}
        />
      </div>

      {/* Attack mode banner — shown while a minion is selected as attacker */}
      {attackingCard && (
        <div className="attack-mode-banner">
          <span className="attack-mode-icon">⚔</span>
          <span className="attack-mode-text">
            <strong>{attackingCard.card?.name}</strong> is attacking — click a target
          </span>
          <button
            type="button"
            className="attack-mode-cancel"
            onClick={() => selectAttacker(null)}
          >
            ✕ Cancel
          </button>
        </div>
      )}

      {/* Info Row */}
      <div className="unified-info-row">
      </div>
      
      {/* Player Area - Hero + Hole Cards + Hand Cards in a row */}
      <div className="unified-player-area">
        <div className="unified-hero-hand-row">
          {/* Hero section with hole cards behind */}
          {playerPet && (
            <div className={`unified-hero-section ${shakingTargets.has('player-hero') ? 'damage-shake damage-flash' : ''} ${isPlayerTurn ? 'turn-active' : ''}`}>
              <div data-hero-role="player" className="poker-hero-container">
                <BattlefieldHero
                  pet={enrichedPlayerPet}
                  hpCommitted={playerHpCommitted}
                  pokerPosition={combatState.playerPosition}
                  level={playerLevel}
                  onClick={() => { onPlayerHeroClick?.(); setShowGearPanel(true); }}
                  isTargetable={isPlayerTargetable}
                  isOpponent={false}
                  secrets={playerSecrets}
                  heroClass={playerHeroClass}
                  mana={playerMana}
                  maxMana={playerMaxMana}
                  onHeroPowerClick={onHeroPowerClick}
                  onWeaponUpgradeClick={onWeaponUpgradeClick}
                  isWeaponUpgraded={isWeaponUpgraded}
                  artifact={gameState?.players?.player?.artifact ? {
                    name: gameState.players.player.artifact.card.name,
                    attack: (gameState.players.player.artifact.card as any).attack || 0
                  } : undefined}
                />
                <div className="player-mana-display">
                  <ManaBar 
                    currentMana={playerMana} 
                    maxMana={playerMaxMana} 
                    overloadedMana={0} 
                    pendingOverload={0}
                  />
                </div>
                {/* Player hole cards - always visible (your own cards) */}
                <HoleCardsOverlay
                  cards={combatState.player.holeCards}
                  variant="player"
                  winningCards={showdownCelebration?.winningCards}
                  isShowdown={showdownCelebration?.resolution.resolutionType === 'showdown'}
                  activeTurn={!!basePermissions?.isMyTurnToAct}
                />
                {playerHandEval && playerHandEval.rank > PokerHandRank.HIGH_CARD && (
                  <div className="hand-strength-compact">
                    <span className="strength-icon">🃏</span>
                    <span className={`strength-name ${handStrengthClass}`}>{playerHandEval.displayName}</span>
                    <div className="hand-strength-bar">
                      <div className={`hand-strength-fill ${handStrengthClass}`} style={{ transform: `scaleX(${handStrengthPercent / 100})` }} />
                    </div>
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
                  heroHealth={gameState?.players?.player ? (gameState.players.player.heroHealth ?? gameState.players.player.health) : 0}
                  isPlayerTurn={handIsPlayerTurn}
                  onCardPlay={handleCardPlay}
                  registerCardPosition={registerCardPosition || noopRegisterCardPosition}
                  battlefieldRef={battlefieldRef as React.RefObject<HTMLDivElement>}
                  evolveReadyIds={evolveReadyIds}
                  battlefieldCount={playerBattlefield.length}
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
          {/* HP Slider for Raise - On top, above buttons */}
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
          <div className="unified-betting-actions poker-actions">
            {basePermissions && (() => {
               const {
                 hasBetToCall, toCall, availableHP, minBet,
                 canCheck, canBet, canCall, canRaise, canFold, maxBetAmount, isAllIn,
                 isMyTurnToAct
               } = basePermissions;

               const isDisabled = !isMyTurnToAct;

               const maxBet = Math.max(1, availableHP);
               const clampedBet = Math.min(betAmount, maxBet);
               const maxSlider = maxBetAmount;
               const effectiveBet = maxSlider >= minBet ? Math.min(Math.max(minBet, clampedBet), maxSlider) : 0;
               const actualCanRaise = canRaise && maxSlider >= minBet && effectiveBet >= minBet;

               const attackHP = hasBetToCall ? toCall + effectiveBet : effectiveBet;
               const callHP = Math.min(toCall, availableHP);

               return (
                 <div className="action-buttons-group">
                   <button
                     className="poker-btn raise-btn"
                     onClick={() => wrappedOnAction(
                       hasBetToCall ? CombatAction.COUNTER_ATTACK : CombatAction.ATTACK,
                       effectiveBet
                     )}
                     disabled={isDisabled || (hasBetToCall ? !actualCanRaise : !canBet)}
                     title="Attack"
                   >
                     <SwordIcon />
                     <span className="btn-text">{attackHP} HP</span>
                   </button>

                   <button
                     className="poker-btn call-btn"
                     onClick={() => wrappedOnAction(canCall ? CombatAction.ENGAGE : CombatAction.DEFEND)}
                     disabled={isDisabled || (!canCall && !canCheck)}
                     title={canCall ? 'Engage' : 'Defend'}
                   >
                     {canCall ? (
                       <>
                         <CrossedSwordsIcon />
                         <span className="btn-text">{isAllIn ? `ALL-IN ${callHP}` : `${callHP} HP`}</span>
                       </>
                     ) : (
                       <HelmIcon />
                     )}
                   </button>

                   <button
                     className="poker-btn fold-btn"
                     onClick={() => wrappedOnAction(CombatAction.BRACE)}
                     disabled={isDisabled || !canFold}
                     title="Brace"
                   >
                     <ShieldIcon />
                   </button>

                   {!isMulligan && isPlayerTurn && playerBattlefield.length > 0 && (
                     <button
                       type="button"
                       className="poker-btn auto-attack-btn"
                       onClick={() => autoAttackAll('minion')}
                       title="Auto-attack all minions into enemy minions"
                     >
                       <CrossedSwordsIcon />
                       <span className="btn-text">Auto</span>
                     </button>
                   )}
                 </div>
               );
            })()}
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
          isHeal={anim.isHeal}
          onComplete={() => removeDamageAnimation(anim.id)}
        />
      ))}

      {/* Hero Gear Panel - shows artifact + armor slots when hero clicked */}
      {showGearPanel && gameState?.players?.player && (
        <HeroGearPanel
          artifact={gameState.players.player.artifact}
          armorGear={gameState.players.player.armorGear}
          artifactState={gameState.players.player.artifactState}
          onClose={() => setShowGearPanel(false)}
        />
      )}
    </div>
  );
};

export const RagnarokCombatArena: React.FC<RagnarokCombatArenaProps> = ({ onCombatEnd }) => {
  useCombatLayout();
  useGameLogIntegration();
  useEventAnimationBridge();
  const resetKingEvents = useKingPassiveEventStore(s => s.reset);

  const {
    combatState,
    isActive,
    resolution,
    betAmount,
    setBetAmount,
    showdownCelebration,
    setShowdownCelebration,
    heroDeathState,
    heroPowerTargeting,
    weaponUpgraded,
    mulliganActive,
    gameStateMulligan,
    showdownBackupTimerRef,
    sharedBattlefieldRef,
    playerHand,
    selectedCard,
    playerMana,
    playerMaxMana,
    opponentMana,
    opponentMaxMana,
    isPlayerTurn,
    isOpponentTargetable,
    isPlayerTargetable,
    sharedRegisterCardPosition,
    sharedHandleCardPlay,
    handleOpponentHeroClick,
    handlePlayerHeroClick,
    executeHeroPowerEffect,
    handleHeroPower,
    cancelHeroPowerTargeting,
    handleWeaponUpgrade,
    handleAction,
    handleCombatEnd,
    handleHeroDeathComplete,
    handleUnifiedEndTurn,
    heroBattlePopups,
    removeHeroBattlePopup,
  } = useRagnarokCombatController({ onCombatEnd });

  const pokerDrama = usePokerDrama({ combatState, isActive });

  const elementalBuff = useElementalBuff();

  // Element matchup banner — show once when combat first initializes
  const [showMatchupBanner, setShowMatchupBanner] = useState(false);
  const matchupBannerShownRef = useRef(false);
  useEffect(() => {
    if (combatState && !matchupBannerShownRef.current) {
      matchupBannerShownRef.current = true;
      setShowMatchupBanner(true);
    }
  }, [combatState]);

  useEffect(() => {
    return () => { resetKingEvents(); };
  }, [resetKingEvents]);

  // Realm selector — drives board skin + ambient particles (extracted to hook)
  const { realmAnnouncement, realmClass, activeRealmId, activeRealmName } = useRealmAnnouncement();

  // Prophecy tracker
  const prophecies = useGameStore(state => state.gameState?.prophecies);

  // Realm effects
  const activeRealmEffects = useGameStore(state => state.gameState?.activeRealm?.effects);
  const activeRealmDescription = useGameStore(state => state.gameState?.activeRealm?.description);

  // HUD selectors
  const gamePhase = useGameStore(state => state.gameState?.gamePhase);
  const gameWinner = useGameStore(state => state.gameState?.winner);
  const turnNumber = useGameStore(state => state.gameState?.turnNumber ?? 1);
  const currentTurnForBanner = useGameStore(state => state.gameState?.currentTurn);
  const playerDeckCount = useGameStore(state => state.gameState?.players?.player?.deck?.length ?? 0);
  const opponentDeckCount = useGameStore(state => state.gameState?.players?.opponent?.deck?.length ?? 0);
  const opponentHandCount = useGameStore(state => state.gameState?.players?.opponent?.hand?.length ?? 0);
  const attackingCardForShortcuts = useGameStore(state => state.attackingCard);
  const selectAttackerForClear = useGameStore(state => state.selectAttacker);
  const selectCard = useGameStore(state => state.selectCard);
  const playerHeroHealth = useGameStore(state => {
    const p = state.gameState?.players?.player;
    return p ? (p.heroHealth ?? p.health) : 0;
  });
  const opponentHeroHealth = useGameStore(state => {
    const p = state.gameState?.players?.opponent;
    return p ? (p.heroHealth ?? p.health) : 0;
  });

  // Screen shake in the outer component (extracted to hook)
  const { outerShakeClass } = useHeroHealthEffects({ playerHeroHealth, opponentHeroHealth });

  // Keyboard shortcuts + right-click cancel for targeting
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        if (isPlayerTurn && combatState) {
          handleUnifiedEndTurn();
        }
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        if (selectedCard) {
          selectCard(null);
        }
        if (attackingCardForShortcuts) {
          selectAttackerForClear(null);
        }
      }
    };
    const handleContextMenu = (e: MouseEvent) => {
      if (selectedCard) {
        e.preventDefault();
        selectCard(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('contextmenu', handleContextMenu);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [isPlayerTurn, combatState, handleUnifiedEndTurn, attackingCardForShortcuts, selectAttackerForClear, selectedCard, selectCard]);

  if (!combatState || !isActive) {
    return null;
  }

  return (
    <GameViewport extraClassName={`${outerShakeClass} ${realmClass}`.trim()}>
      <div className={`ragnarok-combat-arena viewport-mode ${isPlayerTurn ? 'player-turn' : 'opponent-turn'}`}>
        {/* Hourglass Timer at Top Center */}
        {(() => {
          const t = combatState.turnTimer;
          const maxT = 30;
          const pct = Math.max(0, Math.min(1, t / maxT));
          const topH = pct * 30;
          const botH = (1 - pct) * 30;
          return (
            <div className={`hourglass-timer ${t <= 10 ? 'low-time' : ''} ${t <= 5 ? 'critical' : ''}`}>
              <svg className="hourglass-svg" viewBox="0 0 60 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="hg-gold" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#f5d060" />
                    <stop offset="30%" stopColor="#d4a017" />
                    <stop offset="60%" stopColor="#b8860b" />
                    <stop offset="100%" stopColor="#8b6508" />
                  </linearGradient>
                  <linearGradient id="hg-gold-cap" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ffe680" />
                    <stop offset="40%" stopColor="#d4a017" />
                    <stop offset="100%" stopColor="#8b6508" />
                  </linearGradient>
                  <linearGradient id="hg-sand-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f5c842" />
                    <stop offset="100%" stopColor="#c89520" />
                  </linearGradient>
                  <linearGradient id="hg-glass-shine" x1="0.2" y1="0" x2="0.8" y2="1">
                    <stop offset="0%" stopColor="rgba(255,255,255,0.25)" />
                    <stop offset="50%" stopColor="rgba(255,255,255,0)" />
                    <stop offset="100%" stopColor="rgba(255,255,255,0.08)" />
                  </linearGradient>
                  <radialGradient id="hg-glow">
                    <stop offset="0%" stopColor="rgba(245,208,96,0.6)" />
                    <stop offset="100%" stopColor="rgba(245,208,96,0)" />
                  </radialGradient>
                  <clipPath id="hg-top-clip">
                    <path d="M12 12 C12 12 12 38 30 50 C48 38 48 12 48 12 Z" />
                  </clipPath>
                  <clipPath id="hg-bottom-clip">
                    <path d="M12 88 C12 88 12 62 30 50 C48 62 48 88 48 88 Z" />
                  </clipPath>
                  <filter id="hg-inner-shadow">
                    <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="#000" floodOpacity="0.4" />
                  </filter>
                </defs>

                {/* Ambient glow behind hourglass */}
                <ellipse cx="30" cy="50" rx="28" ry="44" fill="url(#hg-glow)" className="hg-ambient-glow" />

                {/* Ornate top cap — layered for depth */}
                <rect x="6" y="2" width="48" height="10" rx="3" fill="url(#hg-gold-cap)" stroke="#8b6508" strokeWidth="1" />
                <rect x="10" y="0" width="40" height="4" rx="2" fill="url(#hg-gold-cap)" stroke="#a07818" strokeWidth="0.5" />
                <line x1="12" y1="7" x2="48" y2="7" stroke="rgba(255,230,128,0.5)" strokeWidth="0.5" />
                {/* Top cap ornamental dots */}
                <circle cx="16" cy="6" r="1.2" fill="#ffe680" opacity="0.8" />
                <circle cx="30" cy="6" r="1.5" fill="#ffe680" opacity="0.9" />
                <circle cx="44" cy="6" r="1.2" fill="#ffe680" opacity="0.8" />

                {/* Ornate bottom cap */}
                <rect x="6" y="88" width="48" height="10" rx="3" fill="url(#hg-gold-cap)" stroke="#8b6508" strokeWidth="1" />
                <rect x="10" y="96" width="40" height="4" rx="2" fill="url(#hg-gold-cap)" stroke="#a07818" strokeWidth="0.5" />
                <line x1="12" y1="93" x2="48" y2="93" stroke="rgba(255,230,128,0.5)" strokeWidth="0.5" />
                <circle cx="16" cy="93" r="1.2" fill="#ffe680" opacity="0.8" />
                <circle cx="30" cy="93" r="1.5" fill="#ffe680" opacity="0.9" />
                <circle cx="44" cy="93" r="1.2" fill="#ffe680" opacity="0.8" />

                {/* Glass frame — two curved bulbs */}
                <path
                  d="M12 12 C12 12 12 38 30 50 C12 62 12 88 12 88 M48 12 C48 12 48 38 30 50 C48 62 48 88 48 88"
                  stroke="url(#hg-gold)" strokeWidth="2.5" strokeLinecap="round" fill="none"
                />

                {/* Sand in top bulb — drains down */}
                <rect
                  className="hg-sand-top"
                  clipPath="url(#hg-top-clip)"
                  x="11" width="38"
                  fill="url(#hg-sand-grad)"
                  filter="url(#hg-inner-shadow)"
                  style={{ y: 12 + (30 - topH), height: topH, transition: 'height 1s linear, y 1s linear' }}
                />

                {/* Sand in bottom bulb — fills up */}
                <rect
                  className="hg-sand-bottom"
                  clipPath="url(#hg-bottom-clip)"
                  x="11" width="38"
                  fill="url(#hg-sand-grad)"
                  style={{ y: 88 - botH, height: botH, transition: 'height 1s linear, y 1s linear' }}
                />

                {/* Falling sand stream — thin line through the neck */}
                {t > 0 && t < maxT && (
                  <g className="hg-stream-group">
                    <line x1="30" y1="42" x2="30" y2="58" stroke="#e8b830" strokeWidth="1.2" className="hg-stream" />
                    {/* Sand particles falling */}
                    <circle cx="30" cy="46" r="0.8" fill="#f5d060" className="hg-particle hg-p1" />
                    <circle cx="29" cy="52" r="0.6" fill="#d4a017" className="hg-particle hg-p2" />
                    <circle cx="31" cy="49" r="0.7" fill="#f5c842" className="hg-particle hg-p3" />
                  </g>
                )}

                {/* Glass shine highlight — curved reflections */}
                <path
                  d="M18 16 C18 16 20 32 28 42"
                  stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" fill="none"
                  className="hg-shine-top"
                />
                <path
                  d="M18 84 C18 84 20 68 28 58"
                  stroke="rgba(255,255,255,0.15)" strokeWidth="1.2" strokeLinecap="round" fill="none"
                  className="hg-shine-bottom"
                />

                {/* Center neck ring ornament */}
                <ellipse cx="30" cy="50" rx="5" ry="2.5" fill="none" stroke="url(#hg-gold)" strokeWidth="1.5" />
                <ellipse cx="30" cy="50" rx="3" ry="1.5" fill="#b8860b" opacity="0.6" />
              </svg>
              <span className="hg-countdown">{t}</span>
            </div>
          );
        })()}
        
        <PhaseBanner phase={combatState.phase} forceHide={!!showdownCelebration} />

        {/* Hand strength indicator — live display of current best hand */}
        <HandStrengthIndicator
          handRank={pokerDrama.currentHandRank}
          handName={pokerDrama.currentHandName}
          tier={pokerDrama.handTier}
        />

        {/* Opponent thinking indicator — shown when it's not the player's turn */}
        {!isPlayerTurn && (
          <div className="opponent-thinking-indicator" aria-label="Opponent is thinking">
            <span className="thinking-dot" />
            <span className="thinking-dot" />
            <span className="thinking-dot" />
          </div>
        )}

        {/* Ambient board effects */}
        <div className="board-ambient-dust" />
        <div className="board-torch-glow" />

        {/* Norse knotwork board border ornament */}
        <div className="board-border-ornament" />

        {/* Realm indicator badge */}
        {activeRealmId && (
          <div className="realm-indicator">
            <span className="realm-indicator-name">{activeRealmName || activeRealmId}</span>
          </div>
        )}

        {/* Realm effects breakdown */}
        {activeRealmId && activeRealmEffects && activeRealmEffects.length > 0 && (
          <div className="realm-effects-panel">
            <div className="realm-effects-title">{activeRealmName || activeRealmId}</div>
            {activeRealmDescription && <div className="realm-effects-desc">{activeRealmDescription}</div>}
            {activeRealmEffects.map((eff, i) => (
              <div key={i} className={`realm-effect-row ${eff.target}`}>
                <span className="realm-effect-icon">
                  {eff.type === 'buff_all_attack' ? '⚔️' :
                   eff.type === 'debuff_all_attack' ? '⬇️' :
                   eff.type === 'damage_all_end_turn' ? '🔥' :
                   eff.type === 'heal_all_start_turn' ? '💚' :
                   eff.type === 'cost_increase' ? '💎' :
                   eff.type === 'keyword_grant' ? '✨' :
                   eff.type === 'return_to_hand_on_death' ? '🔄' :
                   eff.type === 'stealth_on_play' ? '👤' : '⚡'}
                </span>
                <span className="realm-effect-text">
                  {eff.type.replace(/_/g, ' ')} {eff.value > 0 ? `+${eff.value}` : ''} ({eff.target})
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Prophecy tracker */}
        {prophecies && prophecies.length > 0 && (
          <div className="prophecy-tracker">
            <div className="prophecy-tracker-title">Active Prophecies</div>
            {prophecies.map(p => (
              <div key={p.id} className={`prophecy-entry ${p.turnsRemaining <= 1 ? 'prophecy-imminent' : ''}`}>
                <span className="prophecy-name">{p.name}</span>
                <span className="prophecy-countdown">{p.turnsRemaining}</span>
              </div>
            ))}
          </div>
        )}

        {/* Realm shift announcement banner */}
        <AnimatePresence>
          {realmAnnouncement && (
            <motion.div
              className="realm-announcement"
              initial={{ opacity: 0, scale: 1.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            >
              <div className="realm-announcement-name">{realmAnnouncement}</div>
              <div className="realm-announcement-desc">Realm Shift</div>
            </motion.div>
          )}
        </AnimatePresence>

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
      {heroBattlePopups.map(popup => (
        <HeroBattlePopup key={popup.id} popup={popup} onComplete={removeHeroBattlePopup} />
      ))}
      <KingPassivePopup />
      <AIAttackAnimationProcessor />
      <PixiParticleCanvas realm={activeRealmId || 'midgard'} />
      <AnimationOverlay />
      
      {/* First Strike Animation - plays when attacker deals initial damage */}
      {combatState.firstStrike && !combatState.firstStrike.completed ? (
        <>
          {debug.combat('[CombatArena] Rendering FirstStrikeAnimation, phase:', combatState.phase, 'target:', combatState.firstStrike.target)}
          <FirstStrikeAnimation
            onComplete={() => {
              debug.combat('[CombatArena] FirstStrikeAnimation onComplete called');
              getPokerCombatAdapterState().completeFirstStrike();
            }}
          />
        </>
      ) : combatState.firstStrike ? (
        <>{debug.combat('[CombatArena] FirstStrike completed, not showing animation')}</>
      ) : null}
      
      {/* Minion Elemental Buff Popup */}
      {elementalBuff.pendingMinionBuff && (
        <ElementBuffPopup
          show={!!elementalBuff.pendingMinionBuff}
          attackBonus={elementalBuff.pendingMinionBuff.attackBonus}
          healthBonus={elementalBuff.pendingMinionBuff.healthBonus}
          element={elementalBuff.pendingMinionBuff.element as any}
          position={elementalBuff.pendingMinionBuff.owner === 'player' ? 'left' : 'right'}
          onComplete={elementalBuff.clearMinionBuffNotification}
        />
      )}
      
      {/* Element Matchup Banner - shows at combat start */}
      {showMatchupBanner && combatState && (
        <ElementMatchupBanner
          playerElement={(combatState.player?.pet?.stats?.element || 'neutral') as any}
          opponentElement={(combatState.opponent?.pet?.stats?.element || 'neutral') as any}
          playerHasAdvantage={elementalBuff.playerHasAdvantage}
          opponentHasAdvantage={elementalBuff.opponentHasAdvantage}
          attackBonus={elementalBuff.playerBuff?.attackBonus ?? elementalBuff.opponentBuff?.attackBonus ?? 2}
          healthBonus={elementalBuff.playerBuff?.healthBonus ?? elementalBuff.opponentBuff?.healthBonus ?? 2}
          armorBonus={elementalBuff.playerBuff?.armorBonus ?? elementalBuff.opponentBuff?.armorBonus ?? 20}
        />
      )}

      {/* Spell/Battlecry Targeting Prompt */}
      <TargetingPrompt card={selectedCard} onCancel={() => selectCard(null)} />
      
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
            whoFolded: resolution?.whoFolded || showdownCelebration.resolution.whoFolded,
            foldPenalty: resolution?.foldPenalty || showdownCelebration.resolution.foldPenalty
          }}
          playerHeroId={combatState?.player?.pet?.norseHeroId || 'hero-odin'}
          opponentHeroId={combatState?.opponent?.pet?.norseHeroId || 'hero-loki'}
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

      {/* Turn Banner - YOUR TURN / ENEMY TURN announcement */}
      <TurnBanner currentTurn={currentTurnForBanner} turnNumber={turnNumber} />

      {/* Game HUD - deck count, hand count, turn counter */}
      <GameHUD
        turnNumber={turnNumber}
        playerDeckCount={playerDeckCount}
        opponentDeckCount={opponentDeckCount}
        opponentHandCount={opponentHandCount}
        playerElement={combatState ? (combatState.player?.pet?.stats?.element as any) : undefined}
        opponentElement={combatState ? (combatState.opponent?.pet?.stats?.element as any) : undefined}
        playerHasAdvantage={elementalBuff.playerHasAdvantage}
        opponentHasAdvantage={elementalBuff.opponentHasAdvantage}
      />

      {/* Game Over Screen - Victory/Defeat */}
      <GameOverScreen
        isVisible={gamePhase === 'game_over'}
        winner={gameWinner === 'player' ? 'player' : gameWinner === 'opponent' ? 'opponent' : 'draw'}
        turnNumber={turnNumber}
        onPlayAgain={onCombatEnd ? () => onCombatEnd(gameWinner === 'player' ? 'player' : 'opponent') : undefined}
        onMainMenu={() => { window.location.href = '/'; }}
      />

      <GameLog />

    </div>
    </GameViewport>
  );
};

export default RagnarokCombatArena;

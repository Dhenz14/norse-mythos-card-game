import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePokerCombatAdapter, getActionPermissions, getPokerCombatAdapterState } from '../hooks/usePokerCombatAdapter';
import { useGameStore } from '../stores/gameStore';
import {
  CombatPhase,
  CombatAction,
  PokerCard,
  getCombinedHandName
} from '../types/PokerCombatTypes';
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
import { MinionActivityLog, PokerActivityLog } from '../components/ActivityLog';
import { LastActionLog } from '../components/LastActionLog';
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
import { PotDisplay } from './components/PotDisplay';
import { useElementalBuff } from './hooks/useElementalBuff';
import { canCardAttack as canCardAttackCheck } from './attackUtils';
import { GameViewport } from './GameViewport';
import { useCombatLayout } from '../hooks/useCombatLayout';
import CardRenderer from '../components/CardRendering/CardRenderer';
import { useRagnarokCombatController } from './hooks/useRagnarokCombatController';
import type { ShowdownCelebration as ShowdownCelebrationState } from './hooks/useCombatEvents';
import { isCardInWinningHand } from './utils/combatArenaUtils';
import { debug } from '../config/debugConfig';
import { playSound } from '../utils/soundUtils';
import { GameLog } from '../components/GameLog';
import { useGameLogIntegration } from '../hooks/useGameLogIntegration';

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

interface DamageAnimation {
  id: string;
  damage: number;
  targetId: string;
  x: number;
  y: number;
  timestamp: number;
  isHeal?: boolean;
}

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
  const noopRegisterCardPosition = useCallback(() => {}, []);

  // Subscribe directly to adapter for reactive updates
  const { combatState, applyDirectDamage } = usePokerCombatAdapter();
  
  // Game state for battlefield — use individual selectors to avoid unnecessary re-renders
  const gameState = useGameStore(s => s.gameState);
  const playCard = useGameStore(s => s.playCard);
  const rawAttackingCard = useGameStore(s => s.attackingCard);
  const selectAttacker = useGameStore(s => s.selectAttacker);
  const attackWithCard = useGameStore(s => s.attackWithCard);
  const selectedCard = useGameStore(s => s.selectedCard);
  const selectCard = useGameStore(s => s.selectCard);
  
  const isPlayerTurn = gameState?.currentTurn === 'player';
  
  const [communityCardsRevealed, setCommunityCardsRevealed] = useState(false);
  const [showGearPanel, setShowGearPanel] = useState(false);

  useEffect(() => {
    if (combatState?.phase === CombatPhase.SPELL_PET || combatState?.phase === CombatPhase.MULLIGAN || combatState?.phase === CombatPhase.PRE_FLOP) {
      setCommunityCardsRevealed(false);
    }
  }, [combatState?.phase]);

  // In an all-in showdown, phases advance automatically with no player action,
  // so communityCardsRevealed never gets set via wrappedOnAction. Force it true.
  useEffect(() => {
    if (
      combatState?.isAllInShowdown &&
      combatState.phase !== CombatPhase.SPELL_PET &&
      combatState.phase !== CombatPhase.MULLIGAN &&
      combatState.phase !== CombatPhase.PRE_FLOP
    ) {
      setCommunityCardsRevealed(true);
    }
  }, [combatState?.isAllInShowdown, combatState?.phase]);

  const wrappedOnAction = useCallback((action: CombatAction, hp?: number) => {
    setCommunityCardsRevealed(true);
    onAction(action, hp);
  }, [onAction]);
  
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
      const action = (a: CombatAction, hp?: number) => {
        setCommunityCardsRevealed(true);
        onActionRef.current(a, hp);
      };
      
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

  const attackingCard = useMemo(() => {
    return rawAttackingCard ? adaptCardInstance(rawAttackingCard as any) : null;
  }, [rawAttackingCard]);
  
  // Screen shake state
  const [screenShakeClass, setScreenShakeClass] = useState('');
  const screenShakeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const triggerScreenShake = useCallback((damage: number) => {
    if (damage < 5) return;
    const shakeClass = damage >= 8 ? 'screen-shake-strong' : 'screen-shake-mild';
    setScreenShakeClass(shakeClass);
    if (screenShakeTimeoutRef.current) clearTimeout(screenShakeTimeoutRef.current);
    screenShakeTimeoutRef.current = setTimeout(() => setScreenShakeClass(''), 350);
  }, []);

  // Damage animation handlers
  const triggerDamageAnimation = useCallback((targetId: string, damage: number, x: number, y: number, isHeal = false) => {
    const animId = `dmg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setDamageAnimations(prev => [...prev, { id: animId, damage, targetId, x, y, timestamp: Date.now(), isHeal }]);
    if (!isHeal) {
      setShakingTargets(prev => new Set(prev).add(targetId));
      setTimeout(() => {
        setShakingTargets(prev => {
          const next = new Set(prev);
          next.delete(targetId);
          return next;
        });
      }, 300);
      triggerScreenShake(damage);
      if (targetId === 'player-hero' || targetId === 'opponent-hero') {
        playSound('damage');
      }
    } else if (targetId === 'player-hero' || targetId === 'opponent-hero') {
      playSound('heal');
    }
  }, [triggerScreenShake]);

  const removeDamageAnimation = useCallback((id: string) => {
    setDamageAnimations(prev => prev.filter(a => a.id !== id));
  }, []);

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
        const el = document.querySelector(selector);
        if (el) {
          const rect = el.getBoundingClientRect();
          return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
        }
        return { x: window.innerWidth / 2, y: window.innerHeight * 0.8 };
      };

      const getMinionPos = (id: string) => {
        const el = document.querySelector(`[data-card-id="${id}"]`);
        if (el) {
          const rect = el.getBoundingClientRect();
          return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
        }
        return null;
      };

      // Player hero damage/heal
      const playerDiff = prev.playerHeroHealth - currentSnapshot.playerHeroHealth;
      if (playerDiff > 0) {
        const pos = getHeroPos('.player-hero');
        triggerDamageAnimation('player-hero', playerDiff, pos.x, pos.y);
      } else if (playerDiff < 0) {
        const pos = getHeroPos('.player-hero');
        triggerDamageAnimation('player-hero', Math.abs(playerDiff), pos.x, pos.y, true);
      }

      // Opponent hero damage/heal
      const opponentDiff = prev.opponentHeroHealth - currentSnapshot.opponentHeroHealth;
      if (opponentDiff > 0) {
        const pos = getHeroPos('.opponent-hero');
        triggerDamageAnimation('opponent-hero', opponentDiff, pos.x, pos.y);
      } else if (opponentDiff < 0) {
        const pos = getHeroPos('.opponent-hero');
        triggerDamageAnimation('opponent-hero', Math.abs(opponentDiff), pos.x, pos.y, true);
      }

      // Minion damage detection
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
  }, [gameState, triggerDamageAnimation]);
  
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
      debug.combat('[Battlecry Debug] Player minion clicked while selectedCard set:', {
        selectedCardName: selectedCard.card?.name,
        targetType,
        clickedMinion: card.card?.name
      });
      if (targetType === 'friendly_minion' || targetType === 'friendly_mech' || targetType === 'any_minion' || targetType === 'any' || targetType === 'minion' || targetType === 'any_character' || targetType === 'character') {
        const cardId = selectedCard.instanceId || (selectedCard as any).id;
        debug.combat('[Battlecry Debug] Playing card with target:', { cardId, targetId: card.instanceId });
        playCard(cardId, card.instanceId);
        return;
      }
    }

    if (!isPlayerTurn) {
      debug.combat('[Attack Debug] Not player turn - ignoring click');
      return;
    }
    if (attackingCard) {
      if (card.instanceId === attackingCard.instanceId) {
        debug.combat('[Attack Debug] Deselecting attacker:', card.card?.name);
        selectAttacker(null);
      } else {
        debug.combat('[Attack Debug] Already have attacker selected - cannot select another');
      }
    } else {
      // Get fresh card state from gameStore to ensure we have latest canAttack status
      const freshBattlefield = gameState?.players?.player?.battlefield || [];
      const freshCard = freshBattlefield.find((c: any) => c.instanceId === card.instanceId);
      
      // Use fresh card data if available, otherwise fall back to adapted card
      const cardToCheck = freshCard || card;
      
      debug.combat('[Attack Debug] Checking if card can attack:', {
        name: card.card?.name,
        freshCardFound: !!freshCard,
        canAttackFresh: freshCard?.canAttack,
        canAttackAdapted: card.canAttack,
        isSummoningSickFresh: freshCard?.isSummoningSick,
        isSummoningSickAdapted: card.isSummoningSick,
        attacksPerformed: cardToCheck.attacksPerformed,
        isFrozen: cardToCheck.isFrozen
      });
      
      // Check if the card can attack using fresh state
      const canAttackNow = cardToCheck.canAttack === true && 
                           !cardToCheck.isSummoningSick && 
                           !cardToCheck.isFrozen;
      
      if (canAttackNow) {
        debug.combat('[Attack Debug] Selecting attacker:', card.card?.name);
        selectAttacker(card);
      } else {
        // Also try the authoritative check as fallback
        const cardAsInstance = {
          ...cardToCheck,
          card: card.card,
          instanceId: card.instanceId,
          isSummoningSick: cardToCheck.isSummoningSick ?? true,
          canAttack: cardToCheck.canAttack ?? false,
          attacksPerformed: cardToCheck.attacksPerformed ?? 0,
          isFrozen: cardToCheck.isFrozen ?? false
        };
        
        const canAttackResult = canCardAttackCheck(cardAsInstance as any, isPlayerTurn, true);
        
        if (canAttackResult) {
          debug.combat('[Attack Debug] Authoritative check passed, selecting attacker:', card.card?.name);
          selectAttacker(card);
        } else {
          debug.combat('[Attack Debug] Card cannot attack - summoning sickness or exhausted');
          setShakingTargets(prev => new Set(prev).add(card.instanceId));
          setTimeout(() => setShakingTargets(prev => { const n = new Set(prev); n.delete(card.instanceId); return n; }), 500);
        }
      }
    }
  }, [isPlayerTurn, attackingCard, selectAttacker, selectedCard, playCard, heroPowerTargeting, executeHeroPowerEffect, gameState?.players?.player?.battlefield]);

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
      debug.combat('[Battlecry Debug] Opponent minion clicked while selectedCard set:', {
        selectedCardName: selectedCard.card?.name,
        targetType,
        clickedMinion: card.card?.name
      });
      if (targetType === 'enemy_minion' || targetType === 'any_minion' || targetType === 'any' || targetType === 'enemy' || targetType === 'minion' || targetType === 'any_character' || targetType === 'character') {
        const cardId = selectedCard.instanceId || (selectedCard as any).id;
        debug.combat('[Battlecry Debug] Playing card with enemy target:', { cardId, targetId: card.instanceId });
        playCard(cardId, card.instanceId);
        return;
      }
    }
    
    if (!isPlayerTurn || !attackingCard) {
      debug.combat('[Attack Debug] handleOpponentCardClick - no attacker selected or not player turn');
      return;
    }
    debug.combat('[Attack Debug] Attacking', card.card?.name, 'with', attackingCard?.card?.name);
    attackWithCard(attackingCard.instanceId, card.instanceId);
  }, [isPlayerTurn, attackingCard, attackWithCard, selectedCard, playCard, heroPowerTargeting, executeHeroPowerEffect]);

  const handleCardPlay = useCallback((card: any, position?: Position) => {
    debug.combat('[handleCardPlay Debug] Card clicked:', {
      name: card.card?.name || card.name,
      type: card.card?.type || card.type,
      hasBattlecry: !!(card.card?.battlecry || card.battlecry),
      battlecry: card.card?.battlecry || card.battlecry,
      keywords: card.card?.keywords || card.keywords,
      cardStructure: Object.keys(card)
    });
    
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
        const { addAnnouncement } = useUnifiedUIStore.getState();
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
    
    // Check for battlecry requiring target - handle both card.card.battlecry and card.battlecry structures
    const cardType = card.card?.type || card.type;
    const battlecry = card.card?.battlecry || card.battlecry;
    
    if (cardType === 'minion' && battlecry?.requiresTarget) {
      debug.combat('[Battlecry Debug] Card requires battlecry target, selecting:', card.card?.name || card.name);
      debug.combat('[Battlecry Debug] Battlecry details:', battlecry);
      selectCard(card);
      return;
    }
    
    playCard(cardId);
  }, [isPlayerTurn, playCard, selectCard, gameState]);
  
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

  return (
    <div className="unified-combat-arena" ref={battlefieldRef as React.RefObject<HTMLDivElement>}>
      {/* Turn transition flash overlay */}
      {turnFlash && (
        <div className={`turn-flash-overlay turn-flash-${turnFlash}`} />
      )}

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
              pet={enrichedOpponentPet}
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
            {/* Opponent hole cards - uses HoleCardsOverlay component for consistent rendering */}
            <HoleCardsOverlay
              cards={combatState.opponent.holeCards}
              variant="opponent"
              faceDown={!(combatState.isAllInShowdown || showdownCelebration?.resolution.resolutionType === 'showdown')}
              winningCards={showdownCelebration?.winningCards}
              isShowdown={showdownCelebration?.resolution.resolutionType === 'showdown'}
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
      
      {/* Unified Pot Display - consolidates FOE HP, POT total, and YOU HP into single component */}
      <PotDisplay
        playerHpCommitted={combatState.player.hpCommitted}
        opponentHpCommitted={combatState.opponent.hpCommitted}
        playerPosition={combatState.playerPosition}
        opponentPosition={combatState.opponentPosition}
        pot={combatState.pot}
        hidden={isMulligan}
      />
      
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
          <span className="end-turn-hint">(Space)</span>
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
                  pet={enrichedPlayerPet}
                  hpCommitted={playerHpCommitted}
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
                />
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
                  registerCardPosition={registerCardPosition || noopRegisterCardPosition}
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
  } = useRagnarokCombatController({ onCombatEnd });

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

  // Screen shake in the outer component (RagnarokCombatArena owns the GameViewport)
  const [outerShakeClass, setOuterShakeClass] = useState('');
  const outerShakeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevHeroHealthRef = useRef<{ player: number; opponent: number } | null>(null);

  useEffect(() => {
    const curr = { player: playerHeroHealth, opponent: opponentHeroHealth };
    const prev = prevHeroHealthRef.current;
    if (prev) {
      const playerDmg = prev.player - curr.player;
      const opponentDmg = prev.opponent - curr.opponent;
      const maxDmg = Math.max(playerDmg, opponentDmg);
      if (maxDmg >= 5) {
        const cls = maxDmg >= 8 ? 'screen-shake-strong' : 'screen-shake-mild';
        setOuterShakeClass(cls);
        if (outerShakeTimeoutRef.current) clearTimeout(outerShakeTimeoutRef.current);
        outerShakeTimeoutRef.current = setTimeout(() => setOuterShakeClass(''), 350);
      }
    }
    prevHeroHealthRef.current = curr;
  }, [playerHeroHealth, opponentHeroHealth]);

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
    <GameViewport extraClassName={outerShakeClass}>
      <div className={`ragnarok-combat-arena viewport-mode ${isPlayerTurn ? 'player-turn' : 'opponent-turn'}`}>
        {/* Minimal Timer at Top Center */}
        <div className={`zone-timer minimal-timer ${combatState.turnTimer <= 10 ? 'low-time' : ''}`}>
          {combatState.turnTimer}
        </div>
        
        <PhaseBanner phase={combatState.phase} forceHide={!!showdownCelebration} />

        {/* Opponent thinking indicator — shown when it's not the player's turn */}
        {!isPlayerTurn && (
          <div className="opponent-thinking-indicator" aria-label="Opponent is thinking">
            <span className="thinking-dot" />
            <span className="thinking-dot" />
            <span className="thinking-dot" />
          </div>
        )}

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
      <PixiParticleCanvas />
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

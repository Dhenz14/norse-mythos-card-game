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
import { useAnimationStore } from '../stores/animationStore';
import { ActionAnnouncement } from '../components/ActionAnnouncement';
import './RagnarokCombatArena.css';
import './GameViewport.css';
import { MinionActivityLog, PokerActivityLog } from '../components/ActivityLog';
import { LastActionLog } from '../components/LastActionLog';
import AIAttackAnimationProcessor from '../components/AIAttackAnimationProcessor';
import { AnimationOverlay } from '../components/AnimationOverlay';
import { ALL_NORSE_HEROES } from '../data/norseHeroes';
import { ShowdownCelebration } from './components/ShowdownCelebration';
import { TargetingPrompt } from './components/TargetingPrompt';
import { HeroPowerPrompt } from './components/HeroPowerPrompt';
import { DamageIndicator } from './components/DamageIndicator';
import { HeroDeathAnimation } from './components/HeroDeathAnimation';
import { PlayingCard } from './components/PlayingCard';
import { HoleCardsOverlay } from './components/HoleCardsOverlay';
import { BattlefieldHero } from './components/BattlefieldHero';
import { ElementBuffPopup } from './components/ElementBuffPopup';
import { FirstStrikeAnimation } from './components/FirstStrikeAnimation';
import { PotDisplay } from './components/PotDisplay';
import { useElementalBuff } from './hooks/useElementalBuff';
import { canCardAttack as canCardAttackCheck } from './attackUtils';
import { GameViewport } from './GameViewport';
import { useCombatLayout } from '../hooks/useCombatLayout';
import { useRagnarokCombatController } from './hooks/useRagnarokCombatController';
import type { ShowdownCelebration as ShowdownCelebrationState } from './hooks/useCombatEvents';
import { isCardInWinningHand } from './utils/combatArenaUtils';
import { debug } from '../config/debugConfig';

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
  
  const [communityCardsRevealed, setCommunityCardsRevealed] = useState(false);

  useEffect(() => {
    if (combatState?.phase === CombatPhase.SPELL_PET || combatState?.phase === CombatPhase.MULLIGAN) {
      setCommunityCardsRevealed(false);
    }
  }, [combatState?.phase]);

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
      debug.combat('[Battlecry Debug] Player minion clicked while selectedCard set:', {
        selectedCardName: selectedCard.card?.name,
        targetType,
        clickedMinion: card.card?.name
      });
      if (targetType === 'friendly_minion' || targetType === 'friendly_mech' || targetType === 'any_minion' || targetType === 'any') {
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
      if (targetType === 'enemy_minion' || targetType === 'any_minion' || targetType === 'any' || targetType === 'enemy') {
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
  
  // Early return if no combat state
  if (!combatState) {
    return <div className="unified-combat-arena">Loading...</div>;
  }
  
  const isMulligan = combatState.phase === CombatPhase.MULLIGAN;
  const phaseAllowsFaith = !isMulligan && combatState.phase !== CombatPhase.SPELL_PET;
  const showFaith = phaseAllowsFaith && communityCardsRevealed;
  const showForesight = communityCardsRevealed && !isMulligan && (combatState.phase === CombatPhase.FORESIGHT || combatState.phase === CombatPhase.DESTINY || combatState.phase === CombatPhase.RESOLUTION);
  const showDestiny = communityCardsRevealed && !isMulligan && (combatState.phase === CombatPhase.DESTINY || combatState.phase === CombatPhase.RESOLUTION);
  
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
                <Card card={card} isInHand={true} />
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
                     onClick={() => wrappedOnAction(
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
                     onClick={() => wrappedOnAction(canCall ? CombatAction.ENGAGE : CombatAction.DEFEND)}
                     disabled={isDisabled || (!canCall && !canCheck)}
                   >
                     <span className="btn-text">{canCall ? callLabel : 'CHECK'}</span>
                   </button>
                   
                   {/* FOLD button */}
                   <button 
                     className="poker-btn fold-btn"
                     onClick={() => wrappedOnAction(CombatAction.BRACE)}
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

  if (!combatState || !isActive) {
    return null;
  }

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
            whoFolded: resolution?.whoFolded || showdownCelebration.resolution.whoFolded,
            foldPenalty: resolution?.foldPenalty || showdownCelebration.resolution.foldPenalty
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

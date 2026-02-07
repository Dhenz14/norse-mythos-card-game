import React, { useEffect, useState, useCallback } from 'react';
import { usePokerCombatAdapter, getPokerCombatAdapterState, getActionPermissions } from '../hooks/usePokerCombatAdapter';
import {
  CombatPhase,
  CombatAction,
  PokerCard,
  CardSuit
} from '../types/PokerCombatTypes';
import { getSmartAIAction } from './modules/SmartAI';
import { scheduleDamageEffect } from '../animations/UnifiedAnimationOrchestrator';
import './PokerCombat.css';

interface PokerCombatUIProps {
  onCombatEnd?: (winner: 'player' | 'opponent' | 'draw') => void;
}

const getNorseRune = (suit: CardSuit): string => {
  switch (suit) {
    case 'spades': return 'ᛏ';
    case 'hearts': return 'ᛉ';
    case 'diamonds': return 'ᛟ';
    case 'clubs': return 'ᚦ';
  }
};

const getNorseSymbol = (suit: CardSuit): string => {
  switch (suit) {
    case 'spades': return '⚔';
    case 'hearts': return '❂';
    case 'diamonds': return '◆';
    case 'clubs': return '⚒';
  }
};

const getSuitColor = (suit: CardSuit): string => {
  switch (suit) {
    case 'spades': return '#2d4a3d';
    case 'hearts': return '#8b3a3a';
    case 'diamonds': return '#5c4a2a';
    case 'clubs': return '#3a4a5c';
  }
};

const getNorseValue = (value: string): string => {
  const norseNumerals: Record<string, string> = {
    'A': 'ᚨ',
    'K': 'ᚲ',
    'Q': 'ᚹ',
    'J': 'ᛃ',
  };
  return norseNumerals[value] || value;
};

const PlayingCard: React.FC<{ card: PokerCard; faceDown?: boolean; small?: boolean }> = ({ 
  card, 
  faceDown = false,
  small = false 
}) => {
  if (faceDown) {
    return (
      <div className={`poker-card norse face-down ${small ? 'small' : ''}`}>
        <div className="card-back">
          <div className="norse-pattern">
            <div className="valknut">᛭</div>
          </div>
        </div>
      </div>
    );
  }

  const suitColor = getSuitColor(card.suit);
  const runeSymbol = getNorseRune(card.suit);
  const norseSymbol = getNorseSymbol(card.suit);
  const displayValue = getNorseValue(card.value);
  const isFaceCard = ['K', 'Q', 'J', 'A'].includes(card.value);

  return (
    <div className={`poker-card norse ${card.suit} ${small ? 'small' : ''}`}>
      <div className="norse-border">
        <div className="corner-rune top-left">ᚱ</div>
        <div className="corner-rune top-right">ᚱ</div>
        <div className="corner-rune bottom-left">ᚱ</div>
        <div className="corner-rune bottom-right">ᚱ</div>
      </div>
      <div className="card-inner" style={{ color: suitColor }}>
        <div className="card-corner top-left">
          <span className="card-value">{displayValue}</span>
          <span className="card-rune">{runeSymbol}</span>
        </div>
        <div className="card-center">
          {isFaceCard ? (
            <div className="face-card-symbol">
              <span className="norse-symbol-large">{norseSymbol}</span>
              <span className="face-rune">{runeSymbol}</span>
            </div>
          ) : (
            <span className="norse-symbol-large">{norseSymbol}</span>
          )}
        </div>
        <div className="card-corner bottom-right">
          <span className="card-value">{displayValue}</span>
          <span className="card-rune">{runeSymbol}</span>
        </div>
      </div>
    </div>
  );
};

const PetCard: React.FC<{ pet: any; heroArmor?: number }> = ({ pet, heroArmor = 0 }) => {
  const healthPercent = (pet.stats.currentHealth / pet.stats.maxHealth) * 100;

  return (
    <div className={`pet-card ${pet.rarity}`}>
      <div className="pet-header">
        <span className="pet-name">{pet.name}</span>
        <span className="pet-level">Lv.{pet.stats.level}</span>
      </div>
      
      <div className="pet-avatar">
        {pet.name.charAt(0)}
      </div>
      
      <div className="pet-stats">
        <div className="stat-row">
          <span className="stat-label">Speed</span>
          <span className="stat-value">{pet.stats.speed.toFixed(2)}</span>
        </div>
        <div className="stat-row">
          <span className="stat-label">Stamina</span>
          <span className="stat-value">{pet.stats.currentStamina}/{pet.stats.maxStamina}</span>
        </div>
        <div className="stat-row">
          <span className="stat-label">Rage</span>
          <span className="stat-value rage">{pet.stats.rage}</span>
        </div>
      </div>
      
      <div className="health-bar-container">
        <div className="health-bar">
          <div className="health-fill" style={{ width: `${healthPercent}%` }} />
        </div>
        <div className="health-text">
          {heroArmor > 0 && (
            <span className="armor-display" style={{ color: '#4a9eff', marginRight: '6px' }}>
              🛡️ {heroArmor}
            </span>
          )}
          {pet.stats.currentHealth} / {pet.stats.maxHealth}
        </div>
      </div>
    </div>
  );
};

export const PokerCombatUI: React.FC<PokerCombatUIProps> = ({ onCombatEnd }) => {
  const { 
    combatState, 
    isActive, 
    performAction, 
    advancePhase,
    setPlayerReady,
    resolveCombat,
    startNextHandDelayed,
    updateTimer,
    endCombat 
  } = usePokerCombatAdapter();
  
  const [resolution, setResolution] = useState<any>(null);
  const [betAmount, setBetAmount] = useState(10);

  useEffect(() => {
    if (!combatState || !isActive) return;
    
    const timer = setInterval(() => {
      if (combatState.turnTimer > 0) {
        updateTimer(combatState.turnTimer - 1);
      } else {
        // Timer expired - choose appropriate timeout action based on game state
        const permissions = getActionPermissions(combatState, true);
        if (permissions?.canCheck) {
          // Can check - safe default
          performAction(combatState.player.playerId, CombatAction.DEFEND);
        } else if (permissions?.hasBetToCall && permissions?.availableHP > 0) {
          // Must call or fold - auto-call with proper HP amount
          // ENGAGE action uses the toCall amount which is calculated in performAction
          // but we pass toCall as hpCommitment for clarity 
          const callAmount = Math.min(permissions.toCall, permissions.availableHP);
          performAction(combatState.player.playerId, CombatAction.ENGAGE, callAmount);
        } else {
          // No valid action or can't afford call - fold
          performAction(combatState.player.playerId, CombatAction.BRACE);
        }
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [combatState?.turnTimer, isActive, updateTimer, performAction]);

  // Phase advancement is handled by RagnarokCombatArena to avoid double-calls
  // This component only handles resolution display for fold scenarios
  useEffect(() => {
    if (!combatState) return;
    
    // Handle resolution phase (from fold or showdown) - display only
    if (combatState.phase === CombatPhase.RESOLUTION && !resolution) {
      const result = resolveCombat();
      if (result) {
        setResolution(result);
        
        // Show damage popup for fold penalty
        const foldDamage = result.foldPenalty ?? 0;
        if (result.resolutionType === 'fold' && foldDamage > 0) {
          // Position damage popup in the center-bottom area (player's pet location)
          const yPos = result.whoFolded === 'player' 
            ? window.innerHeight * 0.7  // Player's area
            : window.innerHeight * 0.3; // Opponent's area
          scheduleDamageEffect(
            { x: window.innerWidth / 2, y: yPos },
            foldDamage,
            'poker-fold'
          );
        }
      }
    }
  }, [combatState?.phase, resolveCombat, resolution]);

  const handleAction = useCallback((action: CombatAction, hp?: number) => {
    if (!combatState) return;
    performAction(combatState.player.playerId, action, hp);
    
    // If player folded, skip AI response - hand is already over
    if (action === CombatAction.BRACE) {
      return;
    }
    
    // AI responds after delay - read fresh state to avoid stale closure issues
    setTimeout(() => {
      // Get fresh state from adapter to avoid stale closure
      const freshState = getPokerCombatAdapterState().combatState;
      if (!freshState) return;
      
      // Skip if AI already acted (isReady = true)
      if (freshState.opponent.isReady) {
        return;
      }
      
      // Skip if a fold already happened
      if (freshState.foldWinner) {
        return;
      }
      
      // Skip if we're in resolution phase
      if (freshState.phase === CombatPhase.RESOLUTION) {
        return;
      }
      
      // Use SmartAI for intelligent decision making
      const aiDecision = getSmartAIAction(freshState, false);
      
      performAction(freshState.opponent.playerId, aiDecision.action, aiDecision.betAmount);
    }, 1000);
  }, [combatState, performAction]);

  const handleCombatEnd = useCallback(() => {
    if (!resolution) return;
    
    // Check if match is over (someone at 0 HP)
    const matchOver = resolution.playerFinalHealth <= 0 || resolution.opponentFinalHealth <= 0;
    
    if (matchOver) {
      // Match is over - call onCombatEnd and end combat completely
      if (onCombatEnd) {
        onCombatEnd(resolution.winner);
      }
      endCombat();
    } else {
      // Match continues - use centralized delayed start (handles 2s pause internally)
      getPokerCombatAdapterState().startNextHandDelayed(resolution);
    }
    setResolution(null);
  }, [resolution, onCombatEnd, endCombat]);

  if (!combatState || !isActive) {
    return null;
  }

  const phaseName = {
    [CombatPhase.MULLIGAN]: 'Mulligan',
    [CombatPhase.FIRST_STRIKE]: 'First Strike',
    [CombatPhase.SPELL_PET]: 'Spell & Pet Phase',
    [CombatPhase.FAITH]: 'Faith',
    [CombatPhase.FORESIGHT]: 'Foresight',
    [CombatPhase.DESTINY]: 'Destiny',
    [CombatPhase.RESOLUTION]: 'Resolution'
  }[combatState.phase];

  const showFaith = combatState.phase !== CombatPhase.SPELL_PET;
  const showForesight = combatState.phase === CombatPhase.FORESIGHT || combatState.phase === CombatPhase.DESTINY || combatState.phase === CombatPhase.RESOLUTION;
  const showDestiny = combatState.phase === CombatPhase.DESTINY || combatState.phase === CombatPhase.RESOLUTION;

  // Use shared selectors for consistent Ragnarok betting rules
  const permissions = getActionPermissions(combatState, true)!;
  const { 
    hasBetToCall, toCall, availableHP, minBet, 
    canCheck, canBet, canCall, canRaise, canFold, isAllIn, maxBetAmount,
    isMyTurnToAct, waitingForOpponent 
  } = permissions;
  
  // Bet/Raise label changes based on context
  const betLabel = hasBetToCall ? 'Raise' : 'Bet';
  
  // Effective bet amount clamped to available range
  const maxSlider = maxBetAmount;
  const effectiveBet = maxSlider >= minBet ? Math.min(Math.max(minBet, betAmount), maxSlider) : 0;
  
  // Can raise only if there's room to raise after calling (by at least minBet)
  const actualCanRaise = canRaise && maxSlider >= minBet && effectiveBet >= minBet;
  
  // For raises, show total commitment
  const raiseTotal = hasBetToCall ? toCall + effectiveBet : effectiveBet;
  const actualCallAmount = Math.min(toCall, availableHP);
  
  // Disable actions when player has already acted OR when it's not their turn
  const disabled = !isMyTurnToAct;

  return (
    <div className="poker-combat-overlay">
      <div className="combat-header">
        <div className="phase-indicator">{phaseName}</div>
        <div className="turn-timer">
          <span className="timer-icon">⏱</span>
          <span className={`timer-value ${combatState.turnTimer < 10 ? 'low' : ''}`}>
            {combatState.turnTimer}
          </span>
        </div>
        <div className="pot-display">Pot: {combatState.pot} HP</div>
      </div>

      <div className="battle-arena">
        <div className="opponent-section">
          <div className="player-label">{combatState.opponent.playerName}</div>
          <PetCard pet={combatState.opponent.pet} heroArmor={combatState.opponent.heroArmor} />
          <div className="commitment-display">Committed: {combatState.opponent.hpCommitted} HP</div>
        </div>

        <div className="community-section">
          <div className="card-group">
            <span className={`card-group-label ${showFaith ? 'active' : ''}`}></span>
            <div className="cards-container">
              {showFaith && combatState.communityCards.faith.length > 0 ? (
                combatState.communityCards.faith.map((card, idx) => (
                  <PlayingCard key={`faith-${idx}`} card={card} />
                ))
              ) : (
                <>
                  <PlayingCard card={{ suit: 'spades', value: 'A', numericValue: 14 }} faceDown />
                  <PlayingCard card={{ suit: 'spades', value: 'A', numericValue: 14 }} faceDown />
                  <PlayingCard card={{ suit: 'spades', value: 'A', numericValue: 14 }} faceDown />
                </>
              )}
            </div>
          </div>

          <div className="card-group">
            <span className={`card-group-label ${showForesight ? 'active' : ''}`}></span>
            <div className="cards-container">
              {showForesight && combatState.communityCards.foresight ? (
                <PlayingCard card={combatState.communityCards.foresight} />
              ) : (
                <div className="card-placeholder" />
              )}
            </div>
          </div>

          <div className="card-group">
            <span className={`card-group-label ${showDestiny ? 'active' : ''}`}></span>
            <div className="cards-container">
              {showDestiny && combatState.communityCards.destiny ? (
                <PlayingCard card={combatState.communityCards.destiny} />
              ) : (
                <div className="card-placeholder" />
              )}
            </div>
          </div>
        </div>

        <div className="player-section">
          <div className="player-label">{combatState.player.playerName}</div>
          <PetCard pet={combatState.player.pet} heroArmor={combatState.player.heroArmor} />
          <div className="hole-cards">
            {combatState.player.holeCards.map((card, idx) => (
              <PlayingCard key={`hole-${idx}`} card={card} small />
            ))}
          </div>
          <div className="commitment-display">Committed: {combatState.player.hpCommitted} HP</div>
        </div>
      </div>

      {combatState.phase !== CombatPhase.RESOLUTION && (
        <div className="action-bar">
          {/* Show waiting message when opponent (SB) needs to act first */}
          {waitingForOpponent && combatState.phase !== CombatPhase.SPELL_PET && (
            <div className="waiting-for-opponent">
              <span className="waiting-icon">⏳</span>
              <span>Waiting for opponent to act...</span>
            </div>
          )}
          
          {/* Special "Ready to Battle" button during SPELL_PET phase */}
          {combatState.phase === CombatPhase.SPELL_PET && (
            <div className="spell-pet-actions">
              <p className="phase-hint">Play your cards or bet HP! Click Ready to see the flop.</p>
              <button 
                className="action-btn ready-to-battle"
                onClick={() => setPlayerReady(combatState.player.playerId)}
                disabled={disabled}
              >
                Ready to Battle
              </button>
            </div>
          )}
          
          {/* Bet (no prior bet) */}
          {!hasBetToCall && canBet && (
            <button 
              className="action-btn attack"
              onClick={() => handleAction(CombatAction.ATTACK, effectiveBet)}
              disabled={disabled || effectiveBet > availableHP}
            >
              Bet ({effectiveBet} HP)
            </button>
          )}
          
          {/* Raise (has bet to call - uses COUNTER_ATTACK which calls first) */}
          {hasBetToCall && actualCanRaise && (
            <button 
              className="action-btn attack"
              onClick={() => handleAction(CombatAction.COUNTER_ATTACK, effectiveBet)}
              disabled={disabled}
            >
              Raise (+{effectiveBet} HP, total {raiseTotal})
            </button>
          )}
          
          {/* Call - only when there's a bet to match */}
          {canCall && (
            <button 
              className="action-btn engage"
              onClick={() => handleAction(CombatAction.ENGAGE)}
              disabled={disabled}
            >
              {isAllIn ? `All-In (${actualCallAmount} HP)` : `Call (${toCall} HP)`}
            </button>
          )}
          
          {/* Check - only when no bet to call */}
          {canCheck && (
            <button 
              className="action-btn defend"
              onClick={() => handleAction(CombatAction.DEFEND)}
              disabled={disabled}
            >
              Check
            </button>
          )}
          
          {/* Fold - available when there's a bet to call (in any phase) */}
          {canFold && (
            <button 
              className="action-btn brace"
              onClick={() => handleAction(CombatAction.BRACE)}
              disabled={disabled}
            >
              Fold
            </button>
          )}
          
          {/* Bet slider */}
          {(canBet || canRaise) && (
            <div className="bet-slider">
              {/* Live HP display - shows remaining HP after bet like poker sites */}
              {/* HP is already deducted when committed, so just subtract the new bet amount */}
              <div className="remaining-hp-display">
                <span className="remaining-hp-label">HP After Bet:</span>
                <span className="remaining-hp-value">
                  {combatState.player.pet.stats.currentHealth - effectiveBet} HP
                </span>
              </div>
              <div className="bet-slider-header">
                <span>{betLabel} HP:</span>
                <span className="available-hp">Available: {availableHP} HP</span>
              </div>
              <input 
                type="range" 
                min={minBet} 
                max={maxSlider} 
                value={effectiveBet}
                onChange={(e) => setBetAmount(parseInt(e.target.value))}
                disabled={maxSlider < minBet}
              />
              <span className="bet-value">{effectiveBet}</span>
            </div>
          )}
        </div>
      )}

      {resolution && (
        <div className="resolution-overlay">
          <div className="resolution-card">
            <h2>{resolution.winner === 'player' ? 'Victory!' : resolution.winner === 'opponent' ? 'Defeat' : 'Draw'}</h2>
            
            {resolution.resolutionType === 'fold' ? (
              <div className="fold-result">
                <p className="fold-message">
                  {resolution.whoFolded === 'player' 
                    ? 'You folded your hand' 
                    : 'Opponent folded their hand'}
                </p>
                <div className="fold-penalty">
                  <span>Fold Penalty: -{resolution.foldPenalty} HP, -1 ⚡STA</span>
                </div>
              </div>
            ) : (
              <div className="hand-comparison">
                <div className="hand-result player">
                  <span className="hand-name">{resolution.playerHand.displayName}</span>
                  <span className="damage">
                    {resolution.winner === 'opponent' 
                      ? `Lost: ${resolution.playerDamage} HP` 
                      : 'No damage'}
                  </span>
                </div>
                <div className="hand-result opponent">
                  <span className="hand-name">{resolution.opponentHand.displayName}</span>
                  <span className="damage">
                    {resolution.winner === 'player' 
                      ? `Lost: ${resolution.opponentDamage} HP` 
                      : 'No damage'}
                  </span>
                </div>
              </div>
            )}
            
            <div className="final-health">
              <div>Your HP: {resolution.playerFinalHealth}</div>
              <div>Enemy HP: {resolution.opponentFinalHealth}</div>
            </div>
            
            <button className="continue-btn" onClick={handleCombatEnd}>
              Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PokerCombatUI;

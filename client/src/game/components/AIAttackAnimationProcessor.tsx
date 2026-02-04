import React, { useEffect, useState, useCallback } from 'react';
import { useAIAttackAnimationStore, AIAttackEvent } from '../stores/aiAttackAnimationStore';
import { useGameStore } from '../stores/gameStore';
import { applyDamageToState, CombatStep } from '../services/AttackResolutionService';
import { CombatEventBus } from '../services/CombatEventBus';
import './AIAttackAnimation.css';

interface AnimationState {
  attackerPos: { x: number; y: number } | null;
  targetPos: { x: number; y: number } | null;
  phase: 'idle' | 'charging' | 'impact' | 'returning';
}

const AIAttackAnimationProcessor: React.FC = () => {
  const pendingAttacks = useAIAttackAnimationStore(state => state.pendingAttacks);
  const isAnimating = useAIAttackAnimationStore(state => state.isAnimating);
  const startAnimation = useAIAttackAnimationStore(state => state.startAnimation);
  const completeAnimation = useAIAttackAnimationStore(state => state.completeAnimation);
  const markDamageApplied = useAIAttackAnimationStore(state => state.markDamageApplied);
  const deferDamage = useAIAttackAnimationStore(state => state.deferDamage);
  
  // Debug: Log component render with store state on every render
  console.log(`[AI-ATTACK-ANIM-PROC] Component render - pendingAttacks: ${pendingAttacks.length}, isAnimating: ${isAnimating}`);
  
  // Debug: Track pendingAttacks changes
  useEffect(() => {
    console.log(`[AI-ATTACK-ANIM-PROC] pendingAttacks changed - count: ${pendingAttacks.length}`);
    if (pendingAttacks.length > 0) {
      console.log(`[AI-ATTACK-ANIM-PROC] Pending attack details:`, pendingAttacks.map(a => `${a.attackerName} -> ${a.targetName}`));
    }
  }, [pendingAttacks]);
  
  const [animState, setAnimState] = useState<AnimationState>({
    attackerPos: null,
    targetPos: null,
    phase: 'idle'
  });
  const [displayEvent, setDisplayEvent] = useState<AIAttackEvent | null>(null);
  
  const applyDamageFromEvent = useCallback((event: AIAttackEvent) => {
    const currentDeferDamage = useAIAttackAnimationStore.getState().deferDamage;
    console.log(`[AI-ATTACK-ANIM] applyDamageFromEvent called: deferDamage=${currentDeferDamage}, damageApplied=${event.damageApplied}`);
    
    if (!currentDeferDamage) {
      console.log(`[AI-ATTACK-ANIM] Skipping - damage not deferred (legacy mode)`);
      markDamageApplied();
      return;
    }
    
    if (event.damageApplied) {
      console.log(`[AI-ATTACK-ANIM] Skipping - damage already applied for: ${event.attackerName}`);
      markDamageApplied();
      return;
    }
    
    console.log(`[AI-ATTACK-ANIM] Applying real-time damage: ${event.attackerName} -> ${event.targetName} (${event.damage} dmg)`);
    
    // PROFESSIONAL EVENT-DRIVEN DAMAGE: Emit IMPACT_PHASE event for AI attacks
    // This ensures poker HP syncs for AI attacks just like player attacks
    // Hero targetId uses consistent format: 'player-hero' or 'opponent-hero'
    // Minion targetId uses the actual instanceId from the event
    const isHeroTarget = event.targetType === 'hero';
    let targetId: string | null = null;
    
    if (isHeroTarget) {
      // AI-initiated attacks (attackerSide='opponent') target the player hero
      // Player-initiated attacks (attackerSide='player') target the opponent hero
      targetId = event.attackerSide === 'opponent' ? 'player-hero' : 'opponent-hero';
    } else if (event.targetId) {
      // For minion attacks, use the actual instanceId
      targetId = event.targetId;
    }
    
    // Emit event only if we have a valid targetId
    if (targetId) {
      CombatEventBus.emitImpactPhase({
        attackerId: event.attackerId,
        targetId: targetId,
        damageToTarget: event.damage,
        damageToAttacker: event.counterDamage
      });
      console.log(`[AI-ATTACK-ANIM] Emitted IMPACT_PHASE: ${event.attackerId} -> ${targetId} (${event.damage} dmg)`);
    } else {
      console.warn(`[AI-ATTACK-ANIM] Skipping IMPACT_PHASE: missing targetId for minion attack (damage still applied)`);
    }
    
    const step: CombatStep = {
      id: event.combatStepId,
      attackerId: event.attackerId,
      attackerName: event.attackerName,
      attackerAttack: event.damage,
      targetId: event.targetId,
      targetName: event.targetName,
      targetType: event.targetType,
      targetAttack: event.counterDamage,
      damage: event.damage,
      counterDamage: event.counterDamage,
      attackerHasDivineShield: event.attackerHasDivineShield,
      defenderHasDivineShield: event.defenderHasDivineShield,
      resolved: false,
      timestamp: event.timestamp,
      attackerSide: event.attackerSide
    };
    
    const currentGameState = useGameStore.getState().gameState;
    const newState = applyDamageToState(currentGameState, step);
    useGameStore.getState().setGameState(newState);
    markDamageApplied();
  }, [markDamageApplied]);

  const getCardPosition = useCallback((instanceId: string): { x: number; y: number } | null => {
    const cardElement = document.querySelector(`[data-instance-id="${instanceId}"]`);
    if (cardElement) {
      const rect = cardElement.getBoundingClientRect();
      return {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      };
    }
    return null;
  }, []);

  const getHeroPosition = (hero: 'player' | 'opponent'): { x: number; y: number } | null => {
    const heroElement = document.querySelector(`.${hero}-hero-zone, .battlefield-hero-square.${hero}`);
    if (heroElement) {
      const rect = heroElement.getBoundingClientRect();
      return {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      };
    }
    return null;
  };

  useEffect(() => {
    console.log(`[AI-ATTACK-ANIM-PROC] useEffect triggered: pendingAttacks=${pendingAttacks.length}, isAnimating=${isAnimating}`);
    if (pendingAttacks.length > 0 && !isAnimating) {
      const event = startAnimation();
      console.log(`[AI-ATTACK-ANIM-PROC] Starting animation event:`, event?.attackerName, '->', event?.targetName);
      if (event) {
        setDisplayEvent(event);
        
        const attackerPos = getCardPosition(event.attackerId);
        let targetPos: { x: number; y: number } | null = null;
        
        if (event.targetType === 'hero') {
          targetPos = getHeroPosition('player');
        } else if (event.targetId) {
          targetPos = getCardPosition(event.targetId);
        }
        
        if (attackerPos && targetPos) {
          setAnimState({ attackerPos, targetPos, phase: 'charging' });
          
          setTimeout(() => {
            setAnimState(prev => ({ ...prev, phase: 'impact' }));
            applyDamageFromEvent(event);
          }, 600);
          
          setTimeout(() => {
            setAnimState(prev => ({ ...prev, phase: 'returning' }));
          }, 1200);
          
          setTimeout(() => {
            setAnimState({ attackerPos: null, targetPos: null, phase: 'idle' });
            setDisplayEvent(null);
            completeAnimation();
          }, 1800);
        } else {
          setTimeout(() => {
            applyDamageFromEvent(event);
          }, 300);
          
          setTimeout(() => {
            setDisplayEvent(null);
            completeAnimation();
          }, 1500);
        }
      }
    }
  }, [pendingAttacks.length, isAnimating, startAnimation, completeAnimation, getCardPosition, applyDamageFromEvent]);

  if (!displayEvent) return null;

  const { attackerPos, targetPos, phase } = animState;

  return (
    <div className="ai-attack-animation-overlay">
      <div className="ai-attack-announcement">
        <span className="attack-icon">⚔️</span>
        <span className="attack-text">
          {displayEvent.attackerName} attacks {displayEvent.targetName}!
        </span>
        <span className="damage-text">-{displayEvent.damage}</span>
      </div>
      
      {attackerPos && targetPos && phase !== 'idle' && (
        <svg className="attack-line-svg" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 9999 }}>
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          {phase === 'charging' && (
            <line
              x1={attackerPos.x}
              y1={attackerPos.y}
              x2={(attackerPos.x + targetPos.x) / 2}
              y2={(attackerPos.y + targetPos.y) / 2}
              stroke="#ff4444"
              strokeWidth="4"
              filter="url(#glow)"
              className="attack-line charging"
            />
          )}
          
          {phase === 'impact' && (
            <>
              <line
                x1={attackerPos.x}
                y1={attackerPos.y}
                x2={targetPos.x}
                y2={targetPos.y}
                stroke="#ff6600"
                strokeWidth="6"
                filter="url(#glow)"
                className="attack-line impact"
              />
              <circle
                cx={targetPos.x}
                cy={targetPos.y}
                r="30"
                fill="none"
                stroke="#ff0000"
                strokeWidth="4"
                filter="url(#glow)"
                className="impact-circle"
              />
            </>
          )}
        </svg>
      )}
    </div>
  );
};

export default AIAttackAnimationProcessor;

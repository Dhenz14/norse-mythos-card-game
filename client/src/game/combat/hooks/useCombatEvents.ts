import { useEffect } from 'react';
import { CombatPhase, PokerCombatState, PokerCard } from '../../types/PokerCombatTypes';
import { initializeCombatEventSubscribers, cleanupCombatEventSubscribers } from '../../services/CombatEventSubscribers';
import { getPokerCombatAdapterState } from '../../hooks/usePokerCombatAdapter';

export interface ShowdownCelebration {
  resolution: {
    winner: 'player' | 'opponent' | 'draw';
    resolutionType: 'showdown' | 'fold';
    playerHand: { rank: number; cards: PokerCard[] };
    opponentHand: { rank: number; cards: PokerCard[] };
    whoFolded?: 'player' | 'opponent';
    foldPenalty?: number;
  };
  winningCards: PokerCard[];
}

export interface HeroDeathState {
  isAnimating: boolean;
  deadHeroName: string;
  isPlayerDead: boolean;
  pendingResolution: any;
}

interface UseCombatEventsOptions {
  combatState: PokerCombatState | null;
  isActive: boolean;
  onShowdownCelebration: (celebration: ShowdownCelebration | null) => void;
  onHeroDeath: (deathState: HeroDeathState | null) => void;
  resolveCombat: () => any;
  setResolution: (resolution: any) => void;
}

export function useCombatEvents(options: UseCombatEventsOptions): void {
  const { combatState, isActive, onShowdownCelebration, onHeroDeath, resolveCombat, setResolution } = options;

  useEffect(() => {
    initializeCombatEventSubscribers();
    
    return () => {
      cleanupCombatEventSubscribers();
    };
  }, []);

  useEffect(() => {
    if (!combatState) return;
    if (combatState.phase !== CombatPhase.RESOLUTION) return;
    
    if (!combatState.player.isReady || !combatState.opponent.isReady) {
      return;
    }
    
    const result = resolveCombat();
    if (result) {
      const matchOver = result.playerFinalHealth <= 0 || result.opponentFinalHealth <= 0;
      
      if (matchOver) {
        const isPlayerDead = result.playerFinalHealth <= 0;
        const deadHeroName = isPlayerDead 
          ? (combatState?.player?.pet?.name || 'Hero')
          : (combatState?.opponent?.pet?.name || 'Enemy');
        
        onHeroDeath({
          isAnimating: true,
          deadHeroName,
          isPlayerDead,
          pendingResolution: result
        });
      } else {
        setResolution(result);
        
        const winningCards = result.winner === 'draw'
          ? [...(result.playerHand?.cards || []), ...(result.opponentHand?.cards || [])]
          : result.winner === 'player'
            ? result.playerHand?.cards || []
            : result.opponentHand?.cards || [];
        
        onShowdownCelebration({
          resolution: {
            winner: result.winner,
            resolutionType: result.resolutionType,
            playerHand: result.playerHand,
            opponentHand: result.opponentHand,
            whoFolded: result.whoFolded
          },
          winningCards
        });
      }
    }
  }, [combatState?.phase, combatState?.player?.isReady, combatState?.opponent?.isReady, resolveCombat, onShowdownCelebration, onHeroDeath, setResolution]);
}

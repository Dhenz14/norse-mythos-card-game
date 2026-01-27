/**
 * summonEffectStore.ts
 * 
 * @deprecated This store is deprecated. Use UnifiedAnimationOrchestrator instead.
 * Kept for backward compatibility with existing components.
 * New code should use: import { scheduleSummonEffect } from '../animations/UnifiedAnimationOrchestrator';
 * 
 * Store for managing card summon visual effects.
 * Tracks when cards are summoned and triggers visual effects.
 */

import { create } from 'zustand';

interface SummonEffect {
  id: string;
  cardName: string;
  cardRarity: 'common' | 'rare' | 'epic' | 'legendary';
  position: { x: number; y: number };
  timestamp: number;
}

interface SummonEffectStore {
  activeEffects: SummonEffect[];
  triggerSummonEffect: (effect: Omit<SummonEffect, 'timestamp'>) => void;
  clearEffect: (id: string) => void;
  clearAllEffects: () => void;
}

export const useSummonEffectStore = create<SummonEffectStore>((set) => ({
  activeEffects: [],
  
  triggerSummonEffect: (effect) => {
    const newEffect: SummonEffect = {
      ...effect,
      timestamp: Date.now()
    };
    
    set((state) => ({
      activeEffects: [...state.activeEffects, newEffect]
    }));
    
    // Auto-clear after animation completes
    setTimeout(() => {
      set((state) => ({
        activeEffects: state.activeEffects.filter(e => e.id !== effect.id)
      }));
    }, effect.cardRarity === 'legendary' ? 2500 : 1500);
  },
  
  clearEffect: (id) => {
    set((state) => ({
      activeEffects: state.activeEffects.filter(e => e.id !== id)
    }));
  },
  
  clearAllEffects: () => {
    set({ activeEffects: [] });
  }
}));

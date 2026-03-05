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
  cardRarity: 'common' | 'rare' | 'epic' | 'mythic';
  position: { x: number; y: number };
  timestamp: number;
}

interface SummonEffectStore {
  activeEffects: SummonEffect[];
  triggerSummonEffect: (effect: Omit<SummonEffect, 'timestamp'>) => void;
  clearEffect: (id: string) => void;
  clearAllEffects: () => void;
}

const effectTimers = new Map<string, ReturnType<typeof setTimeout>>();

export const useSummonEffectStore = create<SummonEffectStore>((set) => ({
  activeEffects: [],

  triggerSummonEffect: (effect) => {
    const newEffect: SummonEffect = {
      ...effect,
      timestamp: Date.now()
    };

    // Clear any existing timer for the same id to prevent orphaned timeouts
    const existingTimer = effectTimers.get(effect.id);
    if (existingTimer !== undefined) {
      clearTimeout(existingTimer);
      effectTimers.delete(effect.id);
    }

    set((state) => ({
      activeEffects: [...state.activeEffects.filter(e => e.id !== effect.id), newEffect]
    }));

    const timerId = setTimeout(() => {
      effectTimers.delete(effect.id);
      set((state) => ({
        activeEffects: state.activeEffects.filter(e => e.id !== effect.id)
      }));
    }, effect.cardRarity === 'mythic' ? 2500 : 1500);
    effectTimers.set(effect.id, timerId);
  },

  clearEffect: (id) => {
    const timerId = effectTimers.get(id);
    if (timerId !== undefined) {
      clearTimeout(timerId);
      effectTimers.delete(id);
    }
    set((state) => ({
      activeEffects: state.activeEffects.filter(e => e.id !== id)
    }));
  },

  clearAllEffects: () => {
    for (const timerId of effectTimers.values()) {
      clearTimeout(timerId);
    }
    effectTimers.clear();
    set({ activeEffects: [] });
  }
}));

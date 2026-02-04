/**
 * UnifiedUIStore - Consolidated UI State
 * 
 * Combines animations, targeting, activity log, and visual effects
 * into a single coherent store for all UI operations.
 * 
 * Note: This is a NEW store that will eventually replace scattered UI stores.
 * Existing stores remain functional during migration.
 */

import { create } from 'zustand';

export type AnimationType = 
  | 'attack'
  | 'damage'
  | 'heal'
  | 'death'
  | 'summon'
  | 'spell'
  | 'buff'
  | 'debuff'
  | 'card_draw'
  | 'card_play'
  | 'hero_power'
  | 'weapon'
  | 'secret'
  | 'poker_deal'
  | 'poker_bet'
  | 'poker_win';

export interface Animation {
  id: string;
  type: AnimationType;
  sourceId: string;
  targetId?: string;
  value?: number;
  startTime: number;
  duration: number;
  data?: Record<string, unknown>;
}

export interface TargetingState {
  isTargeting: boolean;
  sourceId: string | null;
  sourceType: 'minion' | 'hero' | 'spell' | 'hero_power' | null;
  validTargets: string[];
  targetingMode: 'friendly' | 'enemy' | 'any' | 'minion' | 'hero' | null;
  hoveredTargetId: string | null;
}

export interface ActivityLogEntry {
  id: string;
  timestamp: number;
  type: 'action' | 'info' | 'warning' | 'error';
  message: string;
  actor?: string;
}

export interface TooltipState {
  isVisible: boolean;
  content: unknown;
  position: { x: number; y: number };
  anchor: 'top' | 'bottom' | 'left' | 'right';
}

export interface ModalState {
  isOpen: boolean;
  type: string | null;
  data: Record<string, unknown>;
}

interface UnifiedUIStore {
  animations: Animation[];
  animationQueue: Animation[];
  isAnimating: boolean;
  
  targeting: TargetingState;
  
  activityLog: ActivityLogEntry[];
  
  tooltip: TooltipState;
  modal: ModalState;
  
  soundEnabled: boolean;
  musicVolume: number;
  sfxVolume: number;
  animationSpeed: 'slow' | 'normal' | 'fast';
  
  queueAnimation: (animation: Omit<Animation, 'id' | 'startTime'>) => string;
  playNextAnimation: () => Animation | null;
  completeAnimation: (id: string) => void;
  clearAnimations: () => void;
  
  startTargeting: (sourceId: string, sourceType: TargetingState['sourceType'], validTargets: string[], mode: TargetingState['targetingMode']) => void;
  selectTarget: (targetId: string) => string | null;
  setHoveredTarget: (targetId: string | null) => void;
  cancelTargeting: () => void;
  
  addLogEntry: (entry: Omit<ActivityLogEntry, 'id' | 'timestamp'>) => void;
  clearLog: () => void;
  
  showTooltip: (content: unknown, position: { x: number; y: number }, anchor?: TooltipState['anchor']) => void;
  hideTooltip: () => void;
  
  openModal: (type: string, data?: Record<string, unknown>) => void;
  closeModal: () => void;
  
  setSoundEnabled: (enabled: boolean) => void;
  setMusicVolume: (volume: number) => void;
  setSfxVolume: (volume: number) => void;
  setAnimationSpeed: (speed: 'slow' | 'normal' | 'fast') => void;
  
  reset: () => void;
}

const generateId = () => `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const ANIMATION_DURATIONS: Record<AnimationType, number> = {
  attack: 500,
  damage: 400,
  heal: 400,
  death: 800,
  summon: 600,
  spell: 700,
  buff: 400,
  debuff: 400,
  card_draw: 300,
  card_play: 400,
  hero_power: 500,
  weapon: 400,
  secret: 500,
  poker_deal: 300,
  poker_bet: 200,
  poker_win: 1000,
};

export const useUnifiedUIStore = create<UnifiedUIStore>((set, get) => ({
  animations: [],
  animationQueue: [],
  isAnimating: false,
  
  targeting: {
    isTargeting: false,
    sourceId: null,
    sourceType: null,
    validTargets: [],
    targetingMode: null,
    hoveredTargetId: null,
  },
  
  activityLog: [],
  
  tooltip: {
    isVisible: false,
    content: null,
    position: { x: 0, y: 0 },
    anchor: 'top',
  },
  
  modal: {
    isOpen: false,
    type: null,
    data: {},
  },
  
  soundEnabled: true,
  musicVolume: 0.5,
  sfxVolume: 0.7,
  animationSpeed: 'normal',

  queueAnimation: (animation) => {
    const id = generateId();
    const duration = ANIMATION_DURATIONS[animation.type] || 500;
    
    const speedMultiplier = get().animationSpeed === 'slow' ? 1.5 : get().animationSpeed === 'fast' ? 0.5 : 1;
    
    const fullAnimation: Animation = {
      ...animation,
      id,
      startTime: 0,
      duration: duration * speedMultiplier,
    };
    
    set({
      animationQueue: [...get().animationQueue, fullAnimation],
    });
    
    return id;
  },

  playNextAnimation: () => {
    const queue = get().animationQueue;
    if (queue.length === 0) {
      set({ isAnimating: false });
      return null;
    }
    
    const [next, ...rest] = queue;
    const playingAnimation = { ...next, startTime: Date.now() };
    
    set({
      animationQueue: rest,
      animations: [...get().animations, playingAnimation],
      isAnimating: true,
    });
    
    return playingAnimation;
  },

  completeAnimation: (id) => {
    set({
      animations: get().animations.filter((a) => a.id !== id),
    });
    
    if (get().animations.length === 0 && get().animationQueue.length === 0) {
      set({ isAnimating: false });
    }
  },

  clearAnimations: () => {
    set({
      animations: [],
      animationQueue: [],
      isAnimating: false,
    });
  },

  startTargeting: (sourceId, sourceType, validTargets, mode) => {
    set({
      targeting: {
        isTargeting: true,
        sourceId,
        sourceType,
        validTargets,
        targetingMode: mode,
        hoveredTargetId: null,
      },
    });
  },

  selectTarget: (targetId) => {
    const { targeting } = get();
    if (!targeting.isTargeting || !targeting.validTargets.includes(targetId)) {
      return null;
    }
    
    const sourceId = targeting.sourceId;
    get().cancelTargeting();
    return sourceId;
  },

  setHoveredTarget: (targetId) => {
    const { targeting } = get();
    if (targetId && !targeting.validTargets.includes(targetId)) {
      return;
    }
    set({
      targeting: {
        ...targeting,
        hoveredTargetId: targetId,
      },
    });
  },

  cancelTargeting: () => {
    set({
      targeting: {
        isTargeting: false,
        sourceId: null,
        sourceType: null,
        validTargets: [],
        targetingMode: null,
        hoveredTargetId: null,
      },
    });
  },

  addLogEntry: (entry) => {
    set({
      activityLog: [
        ...get().activityLog,
        {
          ...entry,
          id: generateId(),
          timestamp: Date.now(),
        },
      ].slice(-100),
    });
  },

  clearLog: () => {
    set({ activityLog: [] });
  },

  showTooltip: (content, position, anchor = 'top') => {
    set({
      tooltip: {
        isVisible: true,
        content,
        position,
        anchor,
      },
    });
  },

  hideTooltip: () => {
    set({
      tooltip: {
        isVisible: false,
        content: null,
        position: { x: 0, y: 0 },
        anchor: 'top',
      },
    });
  },

  openModal: (type, data = {}) => {
    set({
      modal: {
        isOpen: true,
        type,
        data,
      },
    });
  },

  closeModal: () => {
    set({
      modal: {
        isOpen: false,
        type: null,
        data: {},
      },
    });
  },

  setSoundEnabled: (enabled) => {
    set({ soundEnabled: enabled });
  },

  setMusicVolume: (volume) => {
    set({ musicVolume: Math.max(0, Math.min(1, volume)) });
  },

  setSfxVolume: (volume) => {
    set({ sfxVolume: Math.max(0, Math.min(1, volume)) });
  },

  setAnimationSpeed: (speed) => {
    set({ animationSpeed: speed });
  },

  reset: () => {
    set({
      animations: [],
      animationQueue: [],
      isAnimating: false,
      targeting: {
        isTargeting: false,
        sourceId: null,
        sourceType: null,
        validTargets: [],
        targetingMode: null,
        hoveredTargetId: null,
      },
      activityLog: [],
      tooltip: {
        isVisible: false,
        content: null,
        position: { x: 0, y: 0 },
        anchor: 'top',
      },
      modal: {
        isOpen: false,
        type: null,
        data: {},
      },
    });
  },
}));

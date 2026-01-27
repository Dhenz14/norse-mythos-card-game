import { create } from 'zustand';

export type AnnouncementType = 
  | 'battlecry'
  | 'deathrattle'
  | 'spell'
  | 'attack'
  | 'damage'
  | 'heal'
  | 'buff'
  | 'summon'
  | 'draw'
  | 'discover'
  | 'secret'
  | 'legendary'
  | 'combo'
  | 'taunt'
  | 'divine_shield'
  | 'freeze'
  | 'silence'
  | 'transform'
  | 'destroy'
  | 'phase_change'
  | 'turn_start'
  | 'turn_end'
  | 'victory'
  | 'defeat'
  | 'poker_check'
  | 'poker_bet'
  | 'poker_call'
  | 'poker_fold'
  | 'blocked'
  | 'effect_failed'
  | 'condition_not_met'
  | 'warning'
  | 'info';

export interface ActionAnnouncement {
  id: string;
  type: AnnouncementType;
  title: string;
  subtitle?: string;
  icon?: string;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
  cardClass?: string;
  duration?: number;
}

interface AnimationState {
  announcements: ActionAnnouncement[];
  currentAnnouncement: ActionAnnouncement | null;
  isProcessing: boolean;
  
  addAnnouncement: (announcement: Omit<ActionAnnouncement, 'id'>) => void;
  removeAnnouncement: (id: string) => void;
  processNext: () => void;
  clearAll: () => void;
}

let announcementIdCounter = 0;

export const useAnimationStore = create<AnimationState>((set, get) => ({
  announcements: [],
  currentAnnouncement: null,
  isProcessing: false,
  
  addAnnouncement: (announcement) => {
    const id = `announcement-${++announcementIdCounter}-${Date.now()}`;
    const newAnnouncement: ActionAnnouncement = {
      ...announcement,
      id,
      duration: announcement.duration || 1800
    };
    
    set(state => ({
      announcements: [...state.announcements, newAnnouncement]
    }));
    
    const state = get();
    if (!state.isProcessing) {
      get().processNext();
    }
  },
  
  removeAnnouncement: (id) => {
    set(state => ({
      announcements: state.announcements.filter(a => a.id !== id),
      currentAnnouncement: state.currentAnnouncement?.id === id ? null : state.currentAnnouncement
    }));
  },
  
  processNext: () => {
    const state = get();
    
    if (state.announcements.length === 0) {
      set({ isProcessing: false, currentAnnouncement: null });
      return;
    }
    
    const [next, ...rest] = state.announcements;
    
    set({
      isProcessing: true,
      currentAnnouncement: next,
      announcements: rest
    });
    
    setTimeout(() => {
      set({ currentAnnouncement: null });
      setTimeout(() => {
        get().processNext();
      }, 150);
    }, next.duration || 1800);
  },
  
  clearAll: () => {
    set({
      announcements: [],
      currentAnnouncement: null,
      isProcessing: false
    });
  }
}));

export function getAnnouncementConfig(type: AnnouncementType): { icon: string; color: string } {
  const configs: Record<AnnouncementType, { icon: string; color: string }> = {
    battlecry: { icon: '⚔️', color: '#FFD700' },
    deathrattle: { icon: '💀', color: '#9B59B6' },
    spell: { icon: '✨', color: '#3498DB' },
    attack: { icon: '🗡️', color: '#E74C3C' },
    damage: { icon: '💥', color: '#E74C3C' },
    heal: { icon: '💚', color: '#2ECC71' },
    buff: { icon: '💪', color: '#F39C12' },
    summon: { icon: '🧩', color: '#1ABC9C' },
    draw: { icon: '📜', color: '#3498DB' },
    discover: { icon: '🔮', color: '#9B59B6' },
    secret: { icon: '❓', color: '#E91E63' },
    legendary: { icon: '👑', color: '#FF8C00' },
    combo: { icon: '🎯', color: '#F1C40F' },
    taunt: { icon: '🛡️', color: '#7F8C8D' },
    divine_shield: { icon: '✨', color: '#F1C40F' },
    freeze: { icon: '❄️', color: '#00BCD4' },
    silence: { icon: '🔇', color: '#95A5A6' },
    transform: { icon: '🔄', color: '#9B59B6' },
    destroy: { icon: '💀', color: '#2C3E50' },
    phase_change: { icon: '⚡', color: '#E67E22' },
    turn_start: { icon: '🌅', color: '#3498DB' },
    turn_end: { icon: '🌙', color: '#34495E' },
    victory: { icon: '🏆', color: '#FFD700' },
    defeat: { icon: '💔', color: '#7F8C8D' },
    poker_check: { icon: '✋', color: '#4CAF50' },
    poker_bet: { icon: '💰', color: '#FF9800' },
    poker_call: { icon: '📞', color: '#2196F3' },
    poker_fold: { icon: '🃏', color: '#9E9E9E' },
    blocked: { icon: '🚫', color: '#E74C3C' },
    effect_failed: { icon: '❌', color: '#95A5A6' },
    condition_not_met: { icon: '⚠️', color: '#F39C12' },
    warning: { icon: '⚠️', color: '#FF9800' },
    info: { icon: 'ℹ️', color: '#2196F3' }
  };
  
  return configs[type] || { icon: '✨', color: '#FFFFFF' };
}

export function fireActionAnnouncement(
  type: AnnouncementType,
  title: string,
  options?: {
    subtitle?: string;
    rarity?: 'common' | 'rare' | 'epic' | 'legendary';
    cardClass?: string;
    duration?: number;
  }
) {
  const config = getAnnouncementConfig(type);
  
  useAnimationStore.getState().addAnnouncement({
    type,
    title,
    subtitle: options?.subtitle,
    icon: config.icon,
    rarity: options?.rarity,
    cardClass: options?.cardClass,
    duration: options?.duration
  });
}

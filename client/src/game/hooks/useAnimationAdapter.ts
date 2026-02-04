/**
 * Animation Adapter Hook
 * 
 * Bridges legacy animationStore with new unifiedUIStore.
 * Components import this instead of directly using either store.
 */

import { useAnimationStore, AnnouncementType, ActionAnnouncement, getAnnouncementConfig } from '../stores/animationStore';
import { useUnifiedUIStore, AnimationType } from '../stores/unifiedUIStore';
import { MIGRATION_FLAGS } from './useAdapterConfig';

export interface AnimationAdapter {
  currentAnnouncement: ActionAnnouncement | null;
  isProcessing: boolean;
  addAnnouncement: (announcement: Omit<ActionAnnouncement, 'id'>) => void;
  clearAll: () => void;
}

const ANNOUNCEMENT_TO_ANIMATION_TYPE: Partial<Record<AnnouncementType, AnimationType>> = {
  battlecry: 'attack',
  deathrattle: 'death',
  spell: 'spell',
  attack: 'attack',
  damage: 'damage',
  heal: 'heal',
  buff: 'buff',
  summon: 'summon',
  draw: 'card_draw',
  discover: 'card_draw',
};

let lastUnifiedAnnouncement: ActionAnnouncement | null = null;

export function useAnimationAdapter(): AnimationAdapter {
  const legacy = useAnimationStore();
  const unified = useUnifiedUIStore();

  if (MIGRATION_FLAGS.USE_UNIFIED_UI_STORE) {
    const currentAnimation = unified.animations[0] || null;
    
    const currentAnnouncement: ActionAnnouncement | null = currentAnimation ? {
      id: currentAnimation.id,
      type: (Object.entries(ANNOUNCEMENT_TO_ANIMATION_TYPE).find(
        ([_, animType]) => animType === currentAnimation.type
      )?.[0] as AnnouncementType) || 'info',
      title: currentAnimation.sourceId || '',
      duration: currentAnimation.duration,
      subtitle: currentAnimation.data?.subtitle as string | undefined,
      rarity: currentAnimation.data?.rarity as 'common' | 'rare' | 'epic' | 'legendary' | undefined,
      cardClass: currentAnimation.data?.cardClass as string | undefined,
      icon: currentAnimation.data?.icon as string | undefined,
    } : null;

    return {
      currentAnnouncement,
      isProcessing: unified.isAnimating,
      addAnnouncement: (announcement) => {
        const animationType = ANNOUNCEMENT_TO_ANIMATION_TYPE[announcement.type] || 'spell';
        const config = getAnnouncementConfig(announcement.type);
        
        lastUnifiedAnnouncement = {
          ...announcement,
          id: `unified_${Date.now()}`,
          icon: announcement.icon || config.icon,
        };
        
        unified.queueAnimation({
          type: animationType,
          sourceId: announcement.title,
          duration: announcement.duration || 1800,
          data: {
            subtitle: announcement.subtitle,
            rarity: announcement.rarity,
            cardClass: announcement.cardClass,
            icon: announcement.icon || config.icon,
          },
        });
      },
      clearAll: unified.clearAnimations,
    };
  }

  return {
    currentAnnouncement: legacy.currentAnnouncement,
    isProcessing: legacy.isProcessing,
    addAnnouncement: legacy.addAnnouncement,
    clearAll: legacy.clearAll,
  };
}

export function fireAnnouncementAdapter(
  type: AnnouncementType,
  title: string,
  options?: {
    subtitle?: string;
    rarity?: 'common' | 'rare' | 'epic' | 'legendary';
    cardClass?: string;
    duration?: number;
    icon?: string;
  }
) {
  const config = getAnnouncementConfig(type);
  
  if (MIGRATION_FLAGS.USE_UNIFIED_UI_STORE) {
    const animationType = ANNOUNCEMENT_TO_ANIMATION_TYPE[type] || 'spell';
    useUnifiedUIStore.getState().queueAnimation({
      type: animationType,
      sourceId: title,
      duration: options?.duration || 1800,
      data: {
        subtitle: options?.subtitle,
        rarity: options?.rarity,
        cardClass: options?.cardClass,
        icon: options?.icon || config.icon,
      },
    });
  } else {
    useAnimationStore.getState().addAnnouncement({
      type,
      title,
      subtitle: options?.subtitle,
      icon: options?.icon || config.icon,
      rarity: options?.rarity,
      cardClass: options?.cardClass,
      duration: options?.duration,
    });
  }
}

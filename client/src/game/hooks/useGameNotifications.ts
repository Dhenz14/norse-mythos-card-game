import { toast } from "sonner";

// Types of game notifications
type NotificationType = 'success' | 'error' | 'info' | 'warning';

// Game event types
export type GameEventType = 
  | 'aoe_damage' 
  | 'damage' 
  | 'heal' 
  | 'buff' 
  | 'summon' 
  | 'draw' 
  | 'draw_both'
  | 'transform'
  | 'death'
  | 'attack'
  | 'play_card'
  | 'hero_power';

// Interface for notification content
export interface GameNotification {
  title: string;
  description?: string;
  type?: NotificationType;
  duration?: number;
}

/**
 * Custom hook for game notifications
 */
export function useGameNotifications() {
  
  /**
   * Show a notification for a game event
   */
  const showNotification = ({
    title,
    description,
    type = 'info',
    duration = 3000
  }: GameNotification) => {
    switch (type) {
      case 'success':
        toast.success(title, { description, duration });
        break;
      case 'error':
        toast.error(title, { description, duration });
        break;
      case 'warning':
        toast.warning(title, { description, duration });
        break;
      default:
        toast.info(title, { description, duration });
    }
  };

  /**
   * Show a notification for AoE damage effects
   */
  const showAoEDamageEffect = (damageAmount: number, targetCount: number) => {
    showNotification({
      title: '💥 Area Effect Damage',
      description: `Dealt ${damageAmount} damage to ${targetCount} enemy minion${targetCount !== 1 ? 's' : ''}`,
      type: 'warning',
      duration: 3000
    });
  };

  /**
   * Show a notification for powerful card effects
   */
  const showBattlecryEffect = (
    cardName: string,
    effectType: GameEventType,
    value?: number,
    targets?: string
  ) => {
    let title = '';
    let description = '';
    let notificationType: NotificationType = 'info';
    
    switch (effectType) {
      case 'aoe_damage':
        title = `💥 ${cardName}'s Battlecry`;
        description = `Dealt ${value || 0} damage to ${targets || 'all enemy minions'}`;
        notificationType = 'warning';
        break;
      case 'damage':
        title = `🔥 ${cardName}'s Battlecry`;
        description = `Dealt ${value || 0} damage to the target`;
        notificationType = 'warning';
        break;
      case 'heal':
        title = `✨ ${cardName}'s Battlecry`;
        description = `Restored ${value || 0} health to the target`;
        notificationType = 'success';
        break;
      case 'buff':
        title = `💪 ${cardName}'s Battlecry`;
        description = `Buffed ${targets || 'the target'}`;
        notificationType = 'success';
        break;
      case 'summon':
        title = `🧩 ${cardName}'s Battlecry`;
        description = `Summoned ${targets || 'a minion'}`;
        notificationType = 'info';
        break;
      case 'draw':
        title = `📚 ${cardName}'s Battlecry`;
        description = `Drew ${value || 1} card${(value || 1) > 1 ? 's' : ''}`;
        notificationType = 'info';
        break;
      case 'draw_both':
        title = `📚 ${cardName}'s Battlecry`;
        description = `Drew ${value || 2} ${targets || 'cards for both players'}`;
        notificationType = 'info';
        break;
      default:
        title = `✨ ${cardName}'s Battlecry`;
        description = 'Activated a special effect';
        notificationType = 'info';
    }

    showNotification({
      title,
      description,
      type: notificationType,
      duration: 3000
    });
  };

  /**
   * Show a notification for deathrattle effects
   */
  const showDeathrattleEffect = (
    cardName: string,
    effectType: GameEventType,
    value?: number,
    targets?: string
  ) => {
    let title = `💀 ${cardName}'s Deathrattle`;
    let description = '';
    let notificationType: NotificationType = 'info';
    
    switch (effectType) {
      case 'damage':
        description = `Dealt ${value || 0} damage to ${targets || 'targets'}`;
        notificationType = 'warning';
        break;
      case 'heal':
        description = `Restored ${value || 0} health to ${targets || 'targets'}`;
        notificationType = 'success';
        break;
      case 'summon':
        description = `Summoned ${targets || 'a minion'}`;
        notificationType = 'info';
        break;
      case 'draw':
        description = `Drew ${value || 1} card${(value || 1) > 1 ? 's' : ''}`;
        notificationType = 'info';
        break;
      default:
        description = 'Activated a special effect';
        notificationType = 'info';
    }

    showNotification({
      title,
      description,
      type: notificationType,
      duration: 3000
    });
  };

  /**
   * Show a notification for spell effects
   */
  const showSpellEffect = (
    cardName: string,
    effectType: string,
    value?: number,
    targets?: string
  ) => {
    let title = `✨ ${cardName}`;
    let description = '';
    let notificationType: NotificationType = 'info';
    
    switch (effectType) {
      case 'damage':
      case 'aoe_damage':
        title = `🔥 ${cardName}`;
        description = value 
          ? `Dealt ${value} damage${targets ? ` to ${targets}` : ''}`
          : `Spell cast!`;
        notificationType = 'warning';
        break;
      case 'heal':
      case 'restore_health':
        title = `💚 ${cardName}`;
        description = value 
          ? `Restored ${value} health${targets ? ` to ${targets}` : ''}`
          : `Healing spell cast!`;
        notificationType = 'success';
        break;
      case 'buff':
      case 'give_stats':
        title = `💪 ${cardName}`;
        description = `Buffed ${targets || 'the target'}`;
        notificationType = 'success';
        break;
      case 'draw':
      case 'draw_cards':
        title = `📚 ${cardName}`;
        description = value 
          ? `Drew ${value} card${value > 1 ? 's' : ''}`
          : `Card draw effect!`;
        notificationType = 'info';
        break;
      case 'summon':
        title = `🧩 ${cardName}`;
        description = `Summoned ${targets || 'a minion'}`;
        notificationType = 'info';
        break;
      case 'destroy':
        title = `💀 ${cardName}`;
        description = `Destroyed ${targets || 'the target'}`;
        notificationType = 'warning';
        break;
      case 'freeze':
        title = `❄️ ${cardName}`;
        description = `Froze ${targets || 'the target'}`;
        notificationType = 'info';
        break;
      case 'silence':
        title = `🔇 ${cardName}`;
        description = `Silenced ${targets || 'the target'}`;
        notificationType = 'info';
        break;
      case 'transform':
        title = `🔮 ${cardName}`;
        description = `Transformed ${targets || 'the target'}`;
        notificationType = 'info';
        break;
      case 'discover':
        title = `🔍 ${cardName}`;
        description = `Discover a card!`;
        notificationType = 'info';
        break;
      case 'armor':
        title = `🛡️ ${cardName}`;
        description = value 
          ? `Gained ${value} armor`
          : `Armor gained!`;
        notificationType = 'success';
        break;
      default:
        title = `✨ ${cardName}`;
        description = 'Spell cast!';
        notificationType = 'info';
    }

    showNotification({
      title,
      description,
      type: notificationType,
      duration: 2500
    });
  };

  /**
   * Show a notification for minion played
   */
  const showMinionPlayed = (cardName: string, attack?: number, health?: number) => {
    showNotification({
      title: `⚔️ ${cardName}`,
      description: attack !== undefined && health !== undefined 
        ? `${attack}/${health} minion summoned`
        : 'Minion summoned to the battlefield',
      type: 'info',
      duration: 2000
    });
  };

  return {
    showNotification,
    showAoEDamageEffect,
    showBattlecryEffect,
    showDeathrattleEffect,
    showSpellEffect,
    showMinionPlayed
  };
}
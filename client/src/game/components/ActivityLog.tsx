/**
 * ActivityLog.tsx
 * Saga Feed - Hearthstone-style activity log showing recent game actions
 * Supports two separate feeds: minion events and poker events
 */

import React, { useEffect, useRef } from 'react';
import { useActivityLogStore } from '../stores/activityLogStore';
import { ActivityEvent, ActivityEventType, ActivityCategory } from '../types/ActivityTypes';
import './ActivityLog.css';

const getEventIcon = (type: ActivityEventType): string => {
  switch (type) {
    case 'spell_cast': return '✨';
    case 'minion_played': return '🛡️';
    case 'minion_summoned': return '🛡️';
    case 'minion_attack': return '⚔️';
    case 'attack': return '⚔️';
    case 'minion_death': return '💀';
    case 'hero_attack': return '🗡️';
    case 'hero_damage': return '💔';
    case 'card_draw': return '🎴';
    case 'card_burn': return '🔥';
    case 'battlecry': return '📯';
    case 'deathrattle': return '☠️';
    case 'poker_bet': return '💰';
    case 'poker_check': return '✓';
    case 'poker_fold': return '🏳️';
    case 'poker_phase': return '🎲';
    case 'poker_resolution': return '🏆';
    case 'heal': return '💚';
    case 'buff': return '⬆️';
    case 'secret_triggered': return '❗';
    case 'weapon_equipped': return '🔨';
    case 'turn_start': return '▶️';
    case 'turn_end': return '⏹️';
    default: return '•';
  }
};

const getEventColor = (actor: 'player' | 'opponent' | 'system'): string => {
  switch (actor) {
    case 'player': return 'var(--activity-player-color, #60a5fa)';
    case 'opponent': return 'var(--activity-opponent-color, #f87171)';
    case 'system': return 'var(--activity-system-color, #fbbf24)';
  }
};

const ActivityEventItem: React.FC<{ event: ActivityEvent }> = ({ event }) => {
  const timeAgo = Math.floor((Date.now() - event.timestamp) / 1000);
  const timeLabel = timeAgo < 60 ? `${timeAgo}s` : `${Math.floor(timeAgo / 60)}m`;
  
  return (
    <div 
      className={`activity-event activity-event-${event.actor}`}
      style={{ '--event-color': getEventColor(event.actor) } as React.CSSProperties}
    >
      <span className="activity-icon">{getEventIcon(event.type)}</span>
      <span className="activity-summary">{event.summary}</span>
      <span className="activity-time">{timeLabel}</span>
    </div>
  );
};

interface ActivityLogProps {
  category?: ActivityCategory;
  title?: string;
}

export const ActivityLog: React.FC<ActivityLogProps> = ({ 
  category = 'minion',
  title 
}) => {
  const events = useActivityLogStore((state) => 
    category === 'poker' ? state.pokerEvents : state.minionEvents
  );
  const scrollRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [events]);
  
  const displayTitle = title || (category === 'poker' ? 'Poker Log' : 'Battle Log');
  
  if (events.length === 0) {
    return null;
  }
  
  return (
    <div className={`activity-log activity-log-${category}`}>
      <div className="activity-log-header">
        <span className="activity-log-icon">
          {category === 'poker' ? '🎴' : '🪓'}
        </span>
        <span className="activity-log-title">{displayTitle}</span>
      </div>
      <div className="activity-log-content" ref={scrollRef}>
        {events.map((event) => (
          <ActivityEventItem key={event.id} event={event} />
        ))}
      </div>
    </div>
  );
};

export const MinionActivityLog: React.FC = () => (
  <ActivityLog category="minion" title="Battle Log" />
);

export const PokerActivityLog: React.FC = () => (
  <ActivityLog category="poker" title="Poker Log" />
);

export default ActivityLog;

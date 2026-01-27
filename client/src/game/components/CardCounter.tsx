import React, { useState } from 'react';
import { useGameStore } from '../stores/gameStore';
import { CardCounts, getCardCounts, getRecentCardHistory } from '../utils/cardCounterUtils';
import { GameLogEvent } from '../types';
import './styles/CardCounter.css';

interface CardCounterProps {
  playerType: 'player' | 'opponent';
  expanded?: boolean;
  onToggleExpand?: () => void;
}

/**
 * Component to display card counts and history
 */
export const CardCounter: React.FC<CardCounterProps> = ({ 
  playerType, 
  expanded = false,
  onToggleExpand 
}) => {
  const [isExpanded, setIsExpanded] = useState(expanded);
  const gameState = useGameStore(state => state.gameState);
  
  const cardCounts: CardCounts = getCardCounts(gameState, playerType);
  const recentHistory = getRecentCardHistory(gameState, playerType, 10);
  
  const toggleExpand = () => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    if (onToggleExpand) {
      onToggleExpand();
    }
  };
  
  return (
    <div className={`card-counter ${playerType} ${isExpanded ? '' : 'collapsed'}`}>
      <div className="card-counter-header" onClick={toggleExpand}>
        <div className="card-counter-basic">
          <div className="deck-count">{cardCounts.deckCount}</div>
          <div className="hand-count">{cardCounts.handCount}</div>
        </div>
        <div className="card-counter-toggle">
          {isExpanded ? '▼' : '▲'}
        </div>
      </div>
      
      {isExpanded && (
        <div className="card-counter-details">
          <div className="card-count-section">
            <h4>Zone Counts</h4>
            <div className="count-row">
              <span className="count-label">Battlefield</span>
              <span className="count-value">{cardCounts.battlefieldCount}</span>
            </div>
            <div className="count-row">
              <span className="count-label">Graveyard</span>
              <span className="count-value">{cardCounts.graveyardCount}</span>
            </div>
            <div className="count-row">
              <span className="count-label">Secrets</span>
              <span className="count-value">{cardCounts.secretsCount}</span>
            </div>
          </div>
          
          <div className="card-count-section">
            <h4>This Turn</h4>
            <div className="count-row">
              <span className="count-label">Cards Played</span>
              <span className="count-value">{cardCounts.cardsPlayedThisTurn}</span>
            </div>
            <div className="count-row">
              <span className="count-label">Minions Played</span>
              <span className="count-value">{cardCounts.minionsPlayedThisTurn}</span>
            </div>
            <div className="count-row">
              <span className="count-label">Spells Cast</span>
              <span className="count-value">{cardCounts.spellsPlayedThisTurn}</span>
            </div>
            <div className="count-row">
              <span className="count-label">Weapons Equipped</span>
              <span className="count-value">{cardCounts.weaponsPlayedThisTurn}</span>
            </div>
          </div>
          
          <div className="card-count-section">
            <h4>Game Totals</h4>
            <div className="count-row">
              <span className="count-label">Cards Played</span>
              <span className="count-value">{cardCounts.cardsPlayedTotal}</span>
            </div>
            <div className="count-row">
              <span className="count-label">Minions Played</span>
              <span className="count-value">{cardCounts.minionsPlayedTotal}</span>
            </div>
            <div className="count-row">
              <span className="count-label">Spells Cast</span>
              <span className="count-value">{cardCounts.spellsPlayedTotal}</span>
            </div>
            <div className="count-row">
              <span className="count-label">Weapons Equipped</span>
              <span className="count-value">{cardCounts.weaponsPlayedTotal}</span>
            </div>
          </div>
          
          <div className="card-history-section">
            <h4>Recent Card History</h4>
            {recentHistory.length > 0 ? (
              <ul className="card-history-list">
                {recentHistory.map((event: GameLogEvent) => (
                  <li key={event.id} className="card-history-item">
                    <span className="card-history-turn">{event.turn}</span>
                    <span className="card-history-text">{event.text}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="card-history-empty">No card history yet</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Simple compact version of the card counter for in-game HUD
 */
export const CompactCardCounter: React.FC<{ playerType: 'player' | 'opponent' }> = ({ playerType }) => {
  const gameState = useGameStore(state => state.gameState);
  const cardCounts: CardCounts = getCardCounts(gameState, playerType);
  
  return (
    <div className={`compact-card-counter ${playerType}`}>
      🎴{cardCounts.deckCount} | ✋{cardCounts.handCount}
    </div>
  );
};
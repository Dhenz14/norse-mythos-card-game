/**
 * SimpleBattlefield.tsx
 * 
 * Clean, minimal battlefield component for Hearthstone-style card game.
 * 7 slots per side, flexbox layout, direct card rendering.
 * Integrates UnifiedCardTooltip for consistent hover descriptions.
 * 
 * Replaces the bloated 3000+ line UnifiedBattlefield system.
 */

import React, { useState, useCallback } from 'react';
import { CardInstanceWithCardData } from '../types/interfaceExtensions';
import CardRenderer from './CardRendering/CardRenderer';
import { UnifiedCardTooltip, TooltipCardData } from './ui/UnifiedCardTooltip';
import { getCardDataSafely } from '../utils/cardInstanceAdapter';
import './SimpleBattlefield.css';

interface SimpleBattlefieldProps {
  playerCards: CardInstanceWithCardData[];
  opponentCards: CardInstanceWithCardData[];
  onCardClick?: (card: CardInstanceWithCardData) => void;
  onOpponentCardClick?: (card: CardInstanceWithCardData) => void;
  onOpponentHeroClick?: () => void;
  attackingCard: CardInstanceWithCardData | null;
  isPlayerTurn: boolean;
  registerCardPosition?: (card: CardInstanceWithCardData, position: any) => void;
  renderMode?: 'both' | 'player' | 'opponent';
  shakingTargets?: Set<string>;
  isInteractionDisabled?: boolean;
}

const MAX_SLOTS = 7;

export const SimpleBattlefield: React.FC<SimpleBattlefieldProps> = ({
  playerCards,
  opponentCards,
  onCardClick,
  onOpponentCardClick,
  attackingCard,
  isPlayerTurn,
  renderMode = 'both',
  shakingTargets = new Set(),
  isInteractionDisabled = false
}) => {
  // Tooltip state for hover
  const [hoveredCard, setHoveredCard] = useState<TooltipCardData | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);

  const showOpponent = renderMode === 'both' || renderMode === 'opponent';
  const showPlayer = renderMode === 'both' || renderMode === 'player';

  const hasTaunt = (cards: CardInstanceWithCardData[]) => 
    cards.some(c => c.card?.keywords?.includes('taunt'));

  const isValidTarget = (card: CardInstanceWithCardData, allCards: CardInstanceWithCardData[]) => {
    if (!attackingCard) return false;
    const opponentHasTaunt = hasTaunt(allCards);
    return !opponentHasTaunt || card.card?.keywords?.includes('taunt');
  };

  // Handle card hover for tooltip
  const handleCardMouseEnter = useCallback((card: CardInstanceWithCardData, e: React.MouseEvent) => {
    const cardData = getCardDataSafely(card);
    if (cardData) {
      const rect = e.currentTarget.getBoundingClientRect();
      setHoveredCard({
        id: cardData.id,
        name: cardData.name,
        manaCost: cardData.manaCost,
        attack: cardData.attack,
        health: cardData.health,
        description: cardData.description,
        type: cardData.type,
        rarity: cardData.rarity,
        tribe: cardData.tribe,
        cardClass: cardData.cardClass || cardData.class,
        keywords: cardData.keywords || []
      });
      setTooltipPosition({
        x: rect.left + rect.width / 2,
        y: rect.top
      });
    }
  }, []);

  const handleCardMouseLeave = useCallback(() => {
    setHoveredCard(null);
    setTooltipPosition(null);
  }, []);

  const renderSlots = (
    cards: CardInstanceWithCardData[], 
    side: 'player' | 'opponent',
    onClick?: (card: CardInstanceWithCardData) => void
  ) => {
    return Array.from({ length: MAX_SLOTS }).map((_, index) => {
      const card = cards[index];
      const isOccupied = !!card;
      const isShaking = card && shakingTargets.has(card.instanceId);
      const isAttacking = card && attackingCard?.instanceId === card.instanceId;
      const canAttack = side === 'player' && card && isPlayerTurn && 
                        !card.isSummoningSick && card.canAttack && !attackingCard;
      const isTarget = side === 'opponent' && card && isValidTarget(card, opponentCards);
      const hasSuperBonus = card && (card as any).hasSuperMinionBonus;

      return (
        <div 
          key={`${side}-slot-${index}`}
          className={`bf-slot ${isOccupied ? 'occupied' : 'empty'}`}
        >
          {card && (
            <div 
              className={`bf-card-wrapper 
                ${isShaking ? 'shake' : ''} 
                ${isAttacking ? 'attacking' : ''} 
                ${canAttack ? 'can-attack' : ''} 
                ${isTarget ? 'valid-target' : ''}
                ${hasSuperBonus ? 'super-minion-bonus' : ''}
              `}
              onClick={() => !isInteractionDisabled && onClick?.(card)}
              onMouseEnter={(e) => handleCardMouseEnter(card, e)}
              onMouseLeave={handleCardMouseLeave}
            >
              <CardRenderer
                card={card}
                isPlayable={canAttack}
                isHighlighted={isAttacking || canAttack || isTarget}
                onClick={() => !isInteractionDisabled && onClick?.(card)}
                size="medium"
              />
              <div className="bf-card-stats">
                <span className="bf-attack">{card.currentAttack ?? (card.card as any)?.attack ?? 0}</span>
                <span className="bf-health">{card.currentHealth ?? (card.card as any)?.health ?? 0}</span>
              </div>
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <>
      <div className="simple-battlefield">
        {showOpponent && (
          <div className="bf-row opponent-row">
            {renderSlots(opponentCards, 'opponent', onOpponentCardClick)}
          </div>
        )}
        
        {showPlayer && (
          <div className="bf-row player-row">
            {renderSlots(playerCards, 'player', onCardClick)}
          </div>
        )}
      </div>

      {/* Unified tooltip for all battlefield cards */}
      <UnifiedCardTooltip
        card={hoveredCard}
        position={tooltipPosition}
        visible={!!hoveredCard}
        placement="above"
      />
    </>
  );
};

export default SimpleBattlefield;

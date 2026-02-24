/**
 * SimpleBattlefield.tsx
 * 
 * Clean, minimal battlefield component for Hearthstone-style card game.
 * 7 slots per side, flexbox layout, direct card rendering.
 * Integrates UnifiedCardTooltip for consistent hover descriptions.
 * 
 * Replaces the bloated 3000+ line UnifiedBattlefield system.
 */

import { debug } from '../config/debugConfig';
import React, { useState, useCallback, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CardInstanceWithCardData } from '../types/interfaceExtensions';
import CardRenderer from './CardRendering/CardRenderer';
import { UnifiedCardTooltip, TooltipCardData } from './ui/UnifiedCardTooltip';
import { getCardDataSafely } from '../utils/cards/cardInstanceAdapter';
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
const EMPTY_SET = new Set<string>();

export const SimpleBattlefield: React.FC<SimpleBattlefieldProps> = React.memo(({
  playerCards,
  opponentCards,
  onCardClick,
  onOpponentCardClick,
  attackingCard,
  isPlayerTurn,
  renderMode = 'both',
  shakingTargets = EMPTY_SET,
  isInteractionDisabled = false
}) => {
  // Tooltip state for hover
  const [hoveredCard, setHoveredCard] = useState<TooltipCardData | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);

  const showOpponent = renderMode === 'both' || renderMode === 'opponent';
  const showPlayer = renderMode === 'both' || renderMode === 'player';

  const opponentHasTaunt = useMemo(
    () => opponentCards.some(c => c.card?.keywords?.includes('taunt')),
    [opponentCards]
  );

  const isValidTarget = (card: CardInstanceWithCardData) => {
    if (!attackingCard) return false;
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
      const isTarget = side === 'opponent' && card && isValidTarget(card);
      const hasSuperBonus = card && (card as any).hasSuperMinionBonus;
      const hasCharge = !!(card?.card?.keywords?.includes('charge'));
      const isSummoningSick = side === 'player' && !!card && !!card.isSummoningSick && !hasCharge;
      const isExhausted = side === 'player' && !!card && isPlayerTurn &&
                          !card.isSummoningSick && !card.canAttack &&
                          !!((card.card as any)?.attack > 0);
      const cardHasTaunt = !!(card?.card?.keywords?.includes('taunt'));
      const hasElementalBuff = !!(card as any)?.hasElementalBuff;

      return (
        <div
          key={`${side}-slot-${index}`}
          className={`bf-slot ${isOccupied ? 'occupied' : 'empty'}`}
        >
          <AnimatePresence>
            {card && (
              <motion.div
                key={card.instanceId}
                className={`bf-card-wrapper
                  ${isShaking ? 'shake' : ''}
                  ${isAttacking ? 'attacking' : ''}
                  ${canAttack ? 'can-attack' : ''}
                  ${isTarget ? 'valid-target' : ''}
                  ${hasSuperBonus ? 'super-minion-bonus' : ''}
                  ${isSummoningSick ? 'summoning-sick' : ''}
                  ${isExhausted ? 'exhausted' : ''}
                  ${cardHasTaunt ? 'has-taunt' : ''}
                  ${hasElementalBuff ? 'elemental-buffed' : ''}
                `}
                initial={{ opacity: 0, scale: 0.15, y: side === 'player' ? 80 : -80 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{
                  opacity: 0,
                  scale: 0.05,
                  y: side === 'opponent' ? 25 : -25,
                  filter: 'brightness(5) saturate(0)',
                  transition: { duration: 0.35, ease: [0.55, 0, 1, 0.45] }
                }}
                transition={{ type: 'spring', stiffness: 420, damping: 24 }}
                onClick={() => {
                  debug.combat('[SimpleBattlefield Click]', {
                    cardName: card.card?.name,
                    side,
                    canAttack: card.canAttack,
                    isSummoningSick: card.isSummoningSick,
                    isPlayerTurn,
                    isInteractionDisabled,
                    attackingCard: !!attackingCard
                  });
                  !isInteractionDisabled && onClick?.(card);
                }}
                onMouseEnter={(e) => handleCardMouseEnter(card, e)}
                onMouseLeave={handleCardMouseLeave}
              >
                <CardRenderer
                  card={card}
                  isPlayable={true}
                  isHighlighted={isAttacking || canAttack || isTarget}
                  onClick={() => !isInteractionDisabled && onClick?.(card)}
                  size="medium"
                />
                {(() => {
                  const curAtk = card.currentAttack ?? (card.card as any)?.attack ?? 0;
                  const curHp = card.currentHealth ?? (card.card as any)?.health ?? 0;
                  const baseAtk = (card.card as any)?.attack ?? 0;
                  const baseHp = (card.card as any)?.health ?? 0;
                  const atkClass = curAtk > baseAtk ? 'buffed' : '';
                  const hpClass = curHp > baseHp ? 'buffed' : curHp < baseHp ? 'damaged' : '';
                  return (
                    <div className="bf-card-stats">
                      <span className={`bf-attack ${atkClass}`}>{curAtk}</span>
                      <span className={`bf-health ${hpClass}`}>{curHp}</span>
                    </div>
                  );
                })()}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      );
    });
  };

  const playerSlots = useMemo(
    () => renderSlots(playerCards, 'player', onCardClick),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [playerCards, onCardClick, shakingTargets, attackingCard, isPlayerTurn, isInteractionDisabled, opponentHasTaunt, handleCardMouseEnter, handleCardMouseLeave]
  );

  const opponentSlots = useMemo(
    () => renderSlots(opponentCards, 'opponent', onOpponentCardClick),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [opponentCards, onOpponentCardClick, shakingTargets, attackingCard, isPlayerTurn, isInteractionDisabled, opponentHasTaunt, handleCardMouseEnter, handleCardMouseLeave]
  );

  return (
    <>
      <div className="simple-battlefield">
        {showOpponent && (
          <div className="bf-row opponent-row">
            {opponentSlots}
          </div>
        )}

        {showPlayer && (
          <div className="bf-row player-row">
            {playerSlots}
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
});

export default SimpleBattlefield;

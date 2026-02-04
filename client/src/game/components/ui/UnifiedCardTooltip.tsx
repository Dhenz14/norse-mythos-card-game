/**
 * UnifiedCardTooltip.tsx
 * 
 * SINGLE SOURCE OF TRUTH for all card hover tooltips in the game.
 * Hearthstone-inspired design with keyword icons and explanations.
 * Uses React Portal for proper layering above all game elements.
 * 
 * Replaces and consolidates:
 * - CardHoverPreview.tsx (hand cards)
 * - Browser title attributes on icons
 * - Fragmented tooltip logic in Card.tsx and SimpleCard.tsx
 */

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import './UnifiedCardTooltip.css';

// Keyword definitions - canonical source for all keyword explanations
export const KEYWORD_DEFINITIONS: Record<string, { icon: string; color: string; description: string }> = {
  'battlecry': { icon: '⚔️', color: '#FFD700', description: 'Triggers when you play this card from your hand.' },
  'deathrattle': { icon: '💀', color: '#9B59B6', description: 'Triggers when this minion dies.' },
  'taunt': { icon: '🛡️', color: '#7F8C8D', description: 'Enemies must attack this minion first.' },
  'divine shield': { icon: '✨', color: '#F1C40F', description: 'The first damage this minion takes is ignored.' },
  'charge': { icon: '⚡', color: '#E74C3C', description: 'Can attack immediately.' },
  'rush': { icon: '🏃', color: '#E67E22', description: 'Can attack minions immediately.' },
  'lifesteal': { icon: '❤️', color: '#E91E63', description: 'Damage dealt also heals your hero.' },
  'poisonous': { icon: '☠️', color: '#27AE60', description: 'Destroy any minion damaged by this.' },
  'windfury': { icon: '🌪️', color: '#3498DB', description: 'Can attack twice each turn.' },
  'stealth': { icon: '👁️', color: '#34495E', description: 'Cannot be targeted until it attacks.' },
  'reborn': { icon: '♻️', color: '#1ABC9C', description: 'Returns to life with 1 Health.' },
  'discover': { icon: '🔍', color: '#9B59B6', description: 'Choose one of three cards to add to your hand.' },
  'freeze': { icon: '❄️', color: '#00BCD4', description: 'Frozen characters lose their next attack.' },
  'silence': { icon: '🔇', color: '#95A5A6', description: 'Removes all card text and enchantments.' },
  'combo': { icon: '🎭', color: '#8E44AD', description: 'Bonus effect if you played another card first this turn.' },
  'inspire': { icon: '💫', color: '#F39C12', description: 'Triggers each time you use your Hero Power.' },
  'adapt': { icon: '🦎', color: '#2ECC71', description: 'Choose one of three bonuses.' },
  'spell damage': { icon: '🔮', color: '#9B59B6', description: 'Your spells deal extra damage.' },
  'overload': { icon: '⚡', color: '#3498DB', description: 'Locks some mana crystals next turn.' },
  'secret': { icon: '❓', color: '#E74C3C', description: 'Hidden until a specific action occurs.' },
  'frenzy': { icon: '😤', color: '#E74C3C', description: 'Triggers the first time this survives damage.' },
  'echo': { icon: '🔊', color: '#9B59B6', description: 'Can be played multiple times per turn.' },
  'magnetic': { icon: '🧲', color: '#607D8B', description: 'Attach to a friendly Automaton.' },
  'overkill': { icon: '💥', color: '#E74C3C', description: 'Triggers when dealing excess lethal damage.' },
  'outcast': { icon: '↔️', color: '#A330C9', description: 'Bonus if this is the leftmost or rightmost card in your hand.' },
  'colossal': { icon: '🦑', color: '#1ABC9C', description: 'Summons additional appendage minions.' },
  'dormant': { icon: '💤', color: '#607D8B', description: 'Starts asleep. Awakens after 2 turns.' },
  'corrupt': { icon: '🌀', color: '#8E44AD', description: 'Upgrades in hand after you play a higher-cost card.' },
  'tradeable': { icon: '🔄', color: '#F39C12', description: 'Drag to your deck to spend 1 mana and draw a new card.' },
  'spellburst': { icon: '✴️', color: '#9B59B6', description: 'Triggers after you cast a spell.' },
};

export interface TooltipCardData {
  id: number | string;
  name: string;
  manaCost: number;
  attack?: number;
  health?: number;
  description?: string;
  type: string;
  rarity?: string;
  tribe?: string;
  cardClass?: string;
  keywords?: string[];
}

interface UnifiedCardTooltipProps {
  card: TooltipCardData | null;
  position: { x: number; y: number } | null;
  visible: boolean;
  placement?: 'above' | 'below' | 'left' | 'right' | 'auto';
}

/**
 * Extract keywords from card data (explicit array + description parsing)
 */
export function extractKeywords(card: TooltipCardData): { keyword: string; icon: string; color: string; description: string }[] {
  const foundKeywords: { keyword: string; icon: string; color: string; description: string }[] = [];
  const addedKeywords = new Set<string>();

  // First, check explicit keywords array
  if (card.keywords && Array.isArray(card.keywords)) {
    for (const keyword of card.keywords) {
      const key = keyword.toLowerCase();
      const def = KEYWORD_DEFINITIONS[key];
      if (def && !addedKeywords.has(key)) {
        foundKeywords.push({ keyword: key, ...def });
        addedKeywords.add(key);
      }
    }
  }

  // Then, parse description for additional keywords
  if (card.description) {
    const desc = card.description.toLowerCase();
    for (const [keyword, def] of Object.entries(KEYWORD_DEFINITIONS)) {
      if (desc.includes(keyword) && !addedKeywords.has(keyword)) {
        foundKeywords.push({ keyword, ...def });
        addedKeywords.add(keyword);
      }
    }
  }

  return foundKeywords.slice(0, 6); // Limit to 6 keywords max
}

/**
 * UnifiedCardTooltip - Portal-based tooltip for consistent card info display
 */
export const UnifiedCardTooltip: React.FC<UnifiedCardTooltipProps> = ({
  card,
  position,
  visible,
  placement = 'auto'
}) => {
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    if (!visible || !position || !card) return;

    const tooltipWidth = 280;
    const tooltipHeight = 200;
    const margin = 16;

    let left = position.x;
    let top = position.y;

    // Auto placement logic
    if (placement === 'auto' || placement === 'above') {
      // Try above first
      top = position.y - tooltipHeight - margin;
      left = position.x - tooltipWidth / 2;

      // If above would go off screen, place below
      if (top < margin) {
        top = position.y + margin + 20;
      }
    } else if (placement === 'below') {
      top = position.y + margin + 20;
      left = position.x - tooltipWidth / 2;
    } else if (placement === 'left') {
      left = position.x - tooltipWidth - margin;
      top = position.y - tooltipHeight / 2;
    } else if (placement === 'right') {
      left = position.x + margin + 20;
      top = position.y - tooltipHeight / 2;
    }

    // Clamp to viewport bounds
    left = Math.max(margin, Math.min(left, window.innerWidth - tooltipWidth - margin));
    top = Math.max(margin, Math.min(top, window.innerHeight - tooltipHeight - margin));

    setTooltipStyle({
      left: `${left}px`,
      top: `${top}px`,
      width: `${tooltipWidth}px`,
    });
  }, [visible, position, card, placement]);

  if (!visible || !card || !position) return null;

  const keywords = extractKeywords(card);
  const rarityClass = `rarity-${card.rarity?.toLowerCase() || 'common'}`;
  const typeLabel = card.type?.charAt(0).toUpperCase() + card.type?.slice(1) || 'Card';

  const tooltipContent = (
    <div 
      className={`unified-card-tooltip ${rarityClass}`}
      style={tooltipStyle}
    >
      {/* Header with card name and mana cost */}
      <div className="tooltip-header">
        <span className="tooltip-mana">{card.manaCost}</span>
        <span className="tooltip-name">{card.name}</span>
      </div>

      {/* Card type and tribe */}
      <div className="tooltip-type-row">
        <span className="tooltip-type">{typeLabel}</span>
        {card.tribe && <span className="tooltip-tribe">{card.tribe}</span>}
      </div>

      {/* Stats for minions/weapons */}
      {(card.attack !== undefined || card.health !== undefined) && (
        <div className="tooltip-stats">
          {card.attack !== undefined && (
            <span className="tooltip-attack">⚔️ {card.attack}</span>
          )}
          {card.health !== undefined && (
            <span className="tooltip-health">❤️ {card.health}</span>
          )}
        </div>
      )}

      {/* Description */}
      {card.description && (
        <div className="tooltip-description">
          {card.description}
        </div>
      )}

      {/* Keyword icons with explanations */}
      {keywords.length > 0 && (
        <div className="tooltip-keywords">
          {keywords.map((kw, idx) => (
            <div key={idx} className="tooltip-keyword-item" style={{ borderColor: kw.color }}>
              <span className="keyword-icon" style={{ color: kw.color }}>{kw.icon}</span>
              <div className="keyword-info">
                <span className="keyword-name" style={{ color: kw.color }}>
                  {kw.keyword.charAt(0).toUpperCase() + kw.keyword.slice(1)}
                </span>
                <span className="keyword-desc">{kw.description}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Render via portal to ensure proper layering
  return createPortal(tooltipContent, document.body);
};

export default UnifiedCardTooltip;

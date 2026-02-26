/**
 * SimpleCard.tsx
 * 
 * A clean, elegant 2D card component inspired by Hearthstone.
 * No 3D effects, no complex transforms - just clear, readable cards.
 * Uses simple color-based backgrounds with rarity styling.
 */

import React, { useMemo } from 'react';
import { KEYWORD_DEFINITIONS } from './ui/UnifiedCardTooltip';
import { getCardArtPath } from '../utils/art/artMapping';
import './SimpleCard.css';

export interface SimpleCardData {
  id: number | string;
  name: string;
  manaCost: number;
  attack?: number;
  health?: number;
  description?: string;
  type: 'minion' | 'spell' | 'weapon' | 'artifact' | 'armor';
  rarity?: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
  tribe?: string;
  cardClass?: string;
  keywords?: string[];
  evolutionLevel?: 1 | 2 | 3;
}

interface SimpleCardProps {
  card: SimpleCardData;
  isPlayable?: boolean;
  isHighlighted?: boolean;
  onClick?: () => void;
  onMouseEnter?: (e: React.MouseEvent) => void;
  onMouseLeave?: (e: React.MouseEvent) => void;
  size?: 'small' | 'medium' | 'large' | 'preview';
  showDescription?: boolean;
  className?: string;
  style?: React.CSSProperties;
  attackBuff?: number;
  healthBuff?: number;
}

const getRarityClass = (rarity?: string): string => {
  switch (rarity) {
    case 'mythic': return 'rarity-mythic';
    case 'legendary': return 'rarity-legendary';
    case 'epic': return 'rarity-epic';
    case 'rare': return 'rarity-rare';
    default: return 'rarity-common';
  }
};

const getCardTypeIcon = (type: string): string => {
  switch (type) {
    case 'spell': return '✨';
    case 'weapon': return '⚔️';
    case 'artifact': return '🔱';
    case 'armor': return '🛡️';
    default: return '👤';
  }
};

const getClassColor = (cardClass?: string): string => {
  const colors: Record<string, string> = {
    warrior: '#C79C6E',
    mage: '#69CCF0',
    hunter: '#ABD473',
    paladin: '#F58CBA',
    priest: '#FFFFFF',
    rogue: '#FFF569',
    shaman: '#0070DE',
    warlock: '#9482C9',
    druid: '#FF7D0A',
    demonhunter: '#A330C9',
    deathknight: '#C41F3B'
  };
  return colors[cardClass?.toLowerCase() || ''] || '#4a5568';
};

/**
 * Extract keyword icons from card - uses centralized KEYWORD_DEFINITIONS
 * Checks both explicit keywords array and description text
 */
const getCardKeywordIcons = (description?: string, keywords?: string[]): { icon: string; color: string; keyword: string }[] => {
  const icons: { icon: string; color: string; keyword: string }[] = [];
  const addedKeywords = new Set<string>();
  
  // First, add icons from explicit keywords array
  if (keywords && keywords.length > 0) {
    for (const keyword of keywords) {
      const key = keyword.toLowerCase();
      const def = KEYWORD_DEFINITIONS[key];
      if (def && !addedKeywords.has(key)) {
        icons.push({ icon: def.icon, color: def.color, keyword: key });
        addedKeywords.add(key);
      }
    }
  }
  
  // Then, parse description for additional keywords
  if (description) {
    const desc = description.toLowerCase();
    for (const [keyword, def] of Object.entries(KEYWORD_DEFINITIONS)) {
      if (desc.includes(keyword) && !addedKeywords.has(keyword)) {
        icons.push({ icon: def.icon, color: def.color, keyword });
        addedKeywords.add(keyword);
      }
    }
  }
  
  return icons.slice(0, 4); // Limit to 4 icons max
};

export const SimpleCard: React.FC<SimpleCardProps> = ({
  card,
  isPlayable = true,
  isHighlighted = false,
  onClick,
  onMouseEnter,
  onMouseLeave,
  size = 'medium',
  showDescription = false,
  className = '',
  style = {},
  attackBuff = 0,
  healthBuff = 0
}) => {
  const isMinion = card.type === 'minion';
  const isSpell = card.type === 'spell';
  const isWeapon = card.type === 'weapon';
  const isArtifact = card.type === 'artifact';
  const isArmor = card.type === 'armor';

  const classColor = getClassColor(card.cardClass);
  const artPath = getCardArtPath(card.name);

  const nameClass = card.name.length > 18 ? 'name-very-long' : card.name.length > 13 ? 'name-long' : '';
  
  const cardTypeClass = isSpell ? 'card-type-spell' : isWeapon ? 'card-type-weapon' : isArtifact ? 'card-type-artifact' : isArmor ? 'card-type-armor' : 'card-type-minion';

  const evolutionClass = card.evolutionLevel === 1 ? 'evolution-mortal'
    : card.evolutionLevel === 2 ? 'evolution-ascended'
    : card.evolutionLevel === 3 ? 'evolution-divine' : '';

  const evolutionStars = card.evolutionLevel ? '★'.repeat(card.evolutionLevel) : '';

  const descriptionContent = useMemo(() => {
    const effectIcons = getCardKeywordIcons(card.description, card.keywords);
    const hasContent = card.description || effectIcons.length > 0;
    if (!hasContent) return null;
    return (
      <div className="card-description">
        {showDescription ? (
          <span>{card.description}</span>
        ) : (
          effectIcons.length > 0 ? (
            <div className="keyword-icons-container">
              {effectIcons.map((effect, idx) => (
                <div
                  key={idx}
                  className="keyword-icon-badge"
                  style={{
                    borderColor: effect.color,
                    boxShadow: `0 2px 8px rgba(0,0,0,0.6), 0 0 6px ${effect.color}88`,
                  }}
                  data-keyword={effect.keyword}
                >
                  {effect.icon}
                </div>
              ))}
            </div>
          ) : null
        )}
      </div>
    );
  }, [card.description, card.keywords, showDescription]);

  return (
    <div
      className={`simple-card ${size} ${getRarityClass(card.rarity)} ${cardTypeClass} ${evolutionClass} ${isPlayable ? 'playable' : 'not-playable'} ${isHighlighted ? 'highlighted' : ''} ${className}`}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={style}
      data-card-id={card.id}
      data-rarity={card.rarity}
      data-card-type={card.type}
      data-evolution-level={card.evolutionLevel}
    >
      {/* Mana Cost */}
      <div className="card-mana">
        <span className="mana-value">{card.manaCost}</span>
      </div>

      {/* Evolution Stars */}
      {evolutionStars && (
        <div className="evolution-stars">{evolutionStars}</div>
      )}
      
      {/* Card Art Area */}
      <div
        className="card-art-container"
        style={artPath ? undefined : { background: `linear-gradient(135deg, ${classColor}40 0%, ${classColor}20 100%)` }}
      >
        {artPath ? (
          <img src={artPath} alt="" className="card-art-image" draggable={false} />
        ) : (
          <div className="card-art-icon">
            <span>{getCardTypeIcon(card.type)}</span>
          </div>
        )}
      </div>
      
      {/* Card Name */}
      <div className="card-name-banner">
        <span className={`card-name ${nameClass}`}>{card.name}</span>
      </div>
      
      {/* Description area - shows icons or text based on size and content */}
      {descriptionContent}
      
      {/* Stats (Attack/Health for minions, Attack/Durability for weapons) */}
      {(isMinion || isWeapon || isArtifact) && (
        <>
          <div className="card-attack">
            <span className={`stat-value ${attackBuff > 0 ? 'stat-buffed' : ''}`}>
              {(card.attack ?? 0) + attackBuff}
            </span>
          </div>
          <div className="card-health">
            <span className={`stat-value ${healthBuff > 0 ? 'stat-buffed' : ''}`}>
              {(card.health ?? 0) + healthBuff}
            </span>
          </div>
        </>
      )}
      
      {/* Foil overlay for Legendary cards - Gold foil */}
      {card.rarity === 'legendary' && (
        <div className="foil-overlay legendary-foil" />
      )}
      
      {/* Foil overlay for Epic cards - Purple holographic */}
      {card.rarity === 'epic' && (
        <div className="foil-overlay epic-foil" />
      )}
      
      {/* Foil overlay for Rare cards - Blue shimmer */}
      {card.rarity === 'rare' && (
        <div className="foil-overlay rare-foil" />
      )}

      {/* Foil overlay for Mythic cards - Rainbow holographic */}
      {card.rarity === 'mythic' && (
        <div className="foil-overlay mythic-foil" />
      )}
    </div>
  );
};

export default React.memo(SimpleCard);

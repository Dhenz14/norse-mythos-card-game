/**
 * SimpleCard.tsx
 *
 * A clean, elegant 2D card component.
 * No 3D effects, no complex transforms - just clear, readable cards.
 * Uses simple color-based backgrounds with rarity styling.
 * Keyword badges show small ability tooltips on hover.
 */

import React, { useMemo, useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useInView } from 'react-intersection-observer';
import { KEYWORD_DEFINITIONS } from './ui/UnifiedCardTooltip';
import { getCardArtPath } from '../utils/art/artMapping';
import { useHoloTracking, getHoloTier } from '../hooks/useHoloTracking';
import './SimpleCard.css';
import './styles/holoEffect.css';

export interface SimpleCardData {
  id: number | string;
  name: string;
  manaCost: number;
  attack?: number;
  health?: number;
  description?: string;
  type: 'minion' | 'spell' | 'weapon' | 'artifact' | 'armor';
  rarity?: 'basic' | 'common' | 'rare' | 'epic' | 'mythic';
  tribe?: string;
  cardClass?: string;
  keywords?: string[];
  evolutionLevel?: 1 | 2 | 3;
  element?: string;
  petStage?: string;
  petFamily?: string;
  evolvesFrom?: number;
  evolvesFromName?: string;
  evolutionCondition?: { trigger: string; description: string };
  hasStage3Variants?: boolean;
  bloodPrice?: number;
  chainPartner?: number;
  einpieces?: number;
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
  owned?: boolean;
}

const ICE_RE = /\b(ymir|buri|niflheim|frost|ice|snow|skadi|jotun|glacier|blizzard|frozen|winter|cold)\b/i;
const FIRE_RE = /\b(surtr|muspel|fire|flame|ember|inferno|burn|ash|volcanic|magma|lava|pyre)\b/i;
const ELECTRIC_RE = /\b(thor|thunder|lightning|storm|spark|tempest|volt)\b/i;
const SHADOW_RE = /\b(hel|helheim|shadow|dark|death|draugr|void|abyss|niflung|undead)\b/i;
const WATER_RE = /\b(aegir|njord|ocean|sea|tide|wave|aqua|rain|river|lake|flood)\b/i;
const GRASS_RE = /\b(idunn|yggdrasil|vine|leaf|root|bloom|grove|forest|nature|verdant)\b/i;
const LIGHT_RE = /\b(baldur|heimdall|sol|dawn|radiant|holy|divine|celestial|sun|bright)\b/i;

const getCardTheme = (name: string, element?: string): string | null => {
  if (element === 'ice' || element === 'water') return element;
  if (element === 'fire') return 'fire';
  if (element === 'electric') return 'electric';
  if (element === 'dark') return 'shadow';
  if (element === 'grass') return 'grass';
  if (element === 'light') return 'light';
  if (ICE_RE.test(name)) return 'ice';
  if (FIRE_RE.test(name)) return 'fire';
  if (ELECTRIC_RE.test(name)) return 'electric';
  if (SHADOW_RE.test(name)) return 'shadow';
  if (WATER_RE.test(name)) return 'water';
  if (GRASS_RE.test(name)) return 'grass';
  if (LIGHT_RE.test(name)) return 'light';
  return null;
};

const getRarityClass = (rarity?: string): string => {
  switch (rarity) {
    case 'mythic': return 'rarity-mythic';
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

const ELEMENT_BADGE: Record<string, { icon: string; color: string }> = {
  fire: { icon: '\u{1F525}', color: '#ff6b35' },
  water: { icon: '\u{1F4A7}', color: '#4fc3f7' },
  grass: { icon: '\u{1F33F}', color: '#66bb6a' },
  electric: { icon: '\u{26A1}', color: '#fdd835' },
  light: { icon: '\u{2728}', color: '#ffd54f' },
  dark: { icon: '\u{1F311}', color: '#9c27b0' },
  ice: { icon: '\u{2744}\u{FE0F}', color: '#81d4fa' }
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
    berserker: '#A330C9',
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

  if (description) {
    const desc = description.toLowerCase();
    for (const [keyword, def] of Object.entries(KEYWORD_DEFINITIONS)) {
      if (desc.includes(keyword) && !addedKeywords.has(keyword)) {
        icons.push({ icon: def.icon, color: def.color, keyword });
        addedKeywords.add(keyword);
      }
    }
  }

  return icons.slice(0, 4);
};

/**
 * Extract the specific effect text for a keyword from a card description.
 * e.g. "Battlecry: Equip a random weapon" → "Equip a random weapon"
 */
const extractKeywordEffect = (keyword: string, description: string): string | null => {
  const lower = description.toLowerCase();
  const idx = lower.indexOf(keyword.toLowerCase());
  if (idx === -1) return description;

  let start = idx + keyword.length;
  if (description[start] === ':') start++;
  while (start < description.length && description[start] === ' ') start++;

  let end = description.indexOf('.', start);
  if (end === -1) end = description.length;

  const effect = description.slice(start, end).trim();
  return effect || null;
};

interface BadgeTooltipState {
  keyword: string;
  icon: string;
  color: string;
  x: number;
  y: number;
  isEvolveInfo?: boolean;
}

const EMPTY_STYLE: React.CSSProperties = {};

export const SimpleCard: React.FC<SimpleCardProps> = React.memo(({
  card,
  isPlayable = true,
  isHighlighted = false,
  onClick,
  onMouseEnter,
  onMouseLeave,
  size = 'medium',
  showDescription = false,
  className = '',
  style = EMPTY_STYLE,
  attackBuff = 0,
  healthBuff = 0,
  owned = true,
}) => {
  const isMinion = card.type === 'minion';
  const isSpell = card.type === 'spell';
  const isWeapon = card.type === 'weapon';
  const isArtifact = card.type === 'artifact';
  const isArmor = card.type === 'armor';

  const classColor = getClassColor(card.cardClass);
  const artPath = getCardArtPath(card.name, card.id);
  const cardTheme = useMemo(() => getCardTheme(card.name, card.element), [card.name, card.element]);

  const nameClass = card.name.length > 24 ? 'name-extreme' : card.name.length > 18 ? 'name-very-long' : card.name.length > 13 ? 'name-long' : '';

  const cardTypeClass = isSpell ? 'card-type-spell' : isWeapon ? 'card-type-weapon' : isArtifact ? 'card-type-artifact' : isArmor ? 'card-type-armor' : 'card-type-minion';

  const evolutionClass = card.evolutionLevel === 1 ? 'evolution-mortal'
    : card.evolutionLevel === 2 ? 'evolution-ascended'
    : card.evolutionLevel === 3 ? 'evolution-divine' : '';

  const evolutionStars = card.evolutionLevel ? '★'.repeat(card.evolutionLevel) : '';

  const { ref: artRef, inView: artInView } = useInView({ triggerOnce: true, rootMargin: '200px' });

  const holoTier = useMemo(() => getHoloTier(card.rarity), [card.rarity]);

  const cardRef = useRef<HTMLDivElement>(null);
  const holo = useHoloTracking(cardRef);

  const handleHoloLeave = useCallback((e: React.MouseEvent) => {
    holo.onMouseLeave(e);
    onMouseLeave?.(e);
  }, [holo, onMouseLeave]);

  const [badgeTooltip, setBadgeTooltip] = useState<BadgeTooltipState | null>(null);

  const handleBadgeEnter = useCallback((e: React.MouseEvent, effect: { icon: string; color: string; keyword: string }) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setBadgeTooltip({
      keyword: effect.keyword,
      icon: effect.icon,
      color: effect.color,
      x: rect.left + rect.width / 2,
      y: rect.top
    });
  }, []);

  const handleBadgeLeave = useCallback(() => {
    setBadgeTooltip(null);
  }, []);

  const isEvolvePet = card.petStage === 'adept' || card.petStage === 'master';

  const evolveTooltipText = useMemo(() => {
    if (!badgeTooltip?.isEvolveInfo) return null;
    const lines: string[] = [];
    if (card.petStage === 'adept' && card.evolvesFromName) {
      lines.push(`Requires ${card.evolvesFromName} on battlefield`);
    } else if (card.petStage === 'master' && card.petFamily) {
      const familyName = card.petFamily.charAt(0).toUpperCase() + card.petFamily.slice(1);
      lines.push(`Requires any ${familyName} adept on battlefield`);
    }
    if (card.evolutionCondition) {
      lines.push(`Trigger: ${card.evolutionCondition.description}`);
    }
    return lines.join('\n');
  }, [badgeTooltip, card.petStage, card.evolvesFromName, card.petFamily, card.evolutionCondition]);

  const tooltipEffectText = useMemo(() => {
    if (!badgeTooltip || badgeTooltip.isEvolveInfo || !card.description) return null;
    return extractKeywordEffect(badgeTooltip.keyword, card.description);
  }, [badgeTooltip, card.description]);

  const handleEvolveEnter = useCallback((e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setBadgeTooltip({
      keyword: card.petStage === 'master' ? 'Master Evolution' : 'Evolution',
      icon: '\u{1F504}',
      color: '#00e5ff',
      x: rect.left + rect.width / 2,
      y: rect.top,
      isEvolveInfo: true,
    });
  }, [card.petStage]);

  const descriptionContent = useMemo(() => {
    const effectIcons = getCardKeywordIcons(card.description, card.keywords);
    const hasContent = card.description || effectIcons.length > 0 || isEvolvePet;
    if (!hasContent) return null;
    return (
      <div className="card-description">
        {showDescription ? (
          <span>{card.description}</span>
        ) : (
          (effectIcons.length > 0 || isEvolvePet) ? (
            <div className="keyword-icons-container">
              {isEvolvePet && (
                <div
                  className="keyword-icon-badge evolve-info-badge"
                  onMouseEnter={handleEvolveEnter}
                  onMouseLeave={handleBadgeLeave}
                >
                  {card.petStage === 'master' ? '\u{2B50}' : '\u{1F504}'}
                </div>
              )}
              {effectIcons.map((effect, idx) => (
                <div
                  key={idx}
                  className="keyword-icon-badge"
                  style={{ '--badge-color': effect.color } as React.CSSProperties}
                  data-keyword={effect.keyword}
                  onMouseEnter={(e) => handleBadgeEnter(e, effect)}
                  onMouseLeave={handleBadgeLeave}
                >
                  {effect.icon}
                </div>
              ))}
            </div>
          ) : null
        )}
      </div>
    );
  }, [card.description, card.keywords, card.petStage, showDescription, isEvolvePet, handleBadgeEnter, handleBadgeLeave, handleEvolveEnter]);

  const tooltipStyle = useMemo<React.CSSProperties>(() => {
    if (!badgeTooltip) return {};
    const margin = 12;
    const tooltipWidth = 200;
    let left = badgeTooltip.x;
    let top = badgeTooltip.y - margin;

    left = Math.max(margin, Math.min(left, window.innerWidth - tooltipWidth / 2 - margin));
    top = Math.max(margin + 60, top);

    return {
      left: `${left}px`,
      top: `${top}px`,
    };
  }, [badgeTooltip]);

  return (
    <div
      className={`simple-card ${size} ${getRarityClass(card.rarity)} ${cardTypeClass} ${evolutionClass} ${isPlayable ? 'playable' : 'not-playable'} ${isHighlighted ? 'highlighted' : ''} ${cardTheme ? `element-holo-${cardTheme}` : ''} ${holoTier || ''} ${card.petStage === 'master' && card.element && !card.hasStage3Variants ? 'stage3-evolved' : ''} ${className}`}
      role="button"
      aria-label={`${card.name}, ${card.manaCost} mana ${card.type}${card.attack !== undefined ? `, ${card.attack} attack` : ''}${card.health !== undefined ? `, ${card.health} health` : ''}`}
      tabIndex={0}
      ref={cardRef}
      onClick={onClick}
      onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && onClick) { e.preventDefault(); onClick(); } }}
      onMouseMove={holo.onMouseMove}
      onMouseEnter={onMouseEnter}
      onMouseLeave={handleHoloLeave}
      style={style}
      data-card-id={card.id}
      data-rarity={card.rarity}
      data-card-type={card.type}
      data-evolution-level={card.evolutionLevel}
    >
      <div className={`card-mana ${card.bloodPrice ? 'blood-price-mana' : ''}`}>
        <span className="mana-value">{card.manaCost}</span>
      </div>

      {card.bloodPrice && (
        <div className="blood-price-badge" title={`Blood Price: Pay ${card.bloodPrice} HP instead of mana`}>
          <span className="blood-price-value">{card.bloodPrice}</span>
        </div>
      )}

      {evolutionStars && (
        <div className="evolution-stars">{evolutionStars}</div>
      )}

      {card.element && ELEMENT_BADGE[card.element] && (
        <div className="element-badge">
          {ELEMENT_BADGE[card.element].icon}
        </div>
      )}

      {card.petStage && (
        <div className={`pet-stage-badge stage-${card.petStage === 'basic' ? '1' : card.petStage === 'adept' ? '2' : '3'}`}>
          {card.petStage === 'basic' ? 'I' : card.petStage === 'adept' ? 'II' : 'III'}
        </div>
      )}

      <div
        ref={artRef}
        className={`card-art-container${!owned ? ' art-locked' : ''}`}
        style={artPath && owned ? undefined : { background: `linear-gradient(135deg, ${classColor}40 0%, ${classColor}20 100%)` }}
      >
        {artPath && artInView && owned ? (
          <img src={artPath} alt="" className="card-art-image" draggable={false} loading="lazy" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        ) : !owned ? (
          <div className="card-art-locked">
            <span className="lock-icon">🔒</span>
            <span className="lock-text">Not Owned</span>
          </div>
        ) : !artPath ? (
          <div className="card-art-icon">
            <span>{getCardTypeIcon(card.type)}</span>
          </div>
        ) : null}
      </div>

      <div className="card-name-banner">
        <span className={`card-name ${nameClass}`}>{card.name}</span>
      </div>

      {descriptionContent}

      {(isMinion || isWeapon || isArtifact) && (
        <>
          <div className="card-attack">
            <span className={`stat-value ${card.petStage === 'master' && card.hasStage3Variants ? 'stat-unknown' : ''} ${attackBuff > 0 ? 'stat-buffed' : ''}`}>
              {card.petStage === 'master' && card.hasStage3Variants ? '?' : (card.attack ?? 0) + attackBuff}
            </span>
          </div>
          <div className="card-health">
            <span className={`stat-value ${card.petStage === 'master' && card.hasStage3Variants ? 'stat-unknown' : ''} ${healthBuff > 0 ? 'stat-buffed' : ''}`}>
              {card.petStage === 'master' && card.hasStage3Variants ? '?' : (card.health ?? 0) + healthBuff}
            </span>
          </div>
        </>
      )}

      {holoTier && (
        <>
          <div className="holo-foil" />
          <div className="holo-glitter" />
          <div className="holo-glare" />
        </>
      )}

      {cardTheme && <div className={`card-particles theme-${cardTheme}`} />}

      {badgeTooltip && createPortal(
        <div className={`keyword-badge-tooltip ${badgeTooltip.isEvolveInfo ? 'evolve-tooltip' : ''}`} style={tooltipStyle}>
          <div className="kbt-header">
            <span className="kbt-icon">{badgeTooltip.icon}</span>
            <span className="kbt-name" style={{ color: badgeTooltip.color }}>
              {badgeTooltip.keyword.charAt(0).toUpperCase() + badgeTooltip.keyword.slice(1)}
            </span>
          </div>
          {badgeTooltip.isEvolveInfo && evolveTooltipText ? (
            <div className="kbt-effect evolve-requirements">
              {evolveTooltipText.split('\n').map((line, i) => (
                <div key={i}>{line}</div>
              ))}
            </div>
          ) : tooltipEffectText ? (
            <div className="kbt-effect">{tooltipEffectText}</div>
          ) : null}
        </div>,
        document.body
      )}
    </div>
  );
});

export default SimpleCard;

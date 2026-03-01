import React, { useState } from 'react';
import { assetPath } from '../game/utils/assetPath';
import '../game/components/CardEnhancements.css';
import '../game/components/HolographicEffect.css';

// Keyword icons mapping for visual effect indicators (Hearthstone-style)
const keywordIcons: Record<string, { icon: string; color: string; bgColor: string }> = {
  'battlecry': { icon: '⚔️', color: '#FFD700', bgColor: 'rgba(255, 215, 0, 0.2)' },
  'deathrattle': { icon: '💀', color: '#9B59B6', bgColor: 'rgba(155, 89, 182, 0.2)' },
  'taunt': { icon: '🛡️', color: '#95A5A6', bgColor: 'rgba(149, 165, 166, 0.2)' },
  'divine shield': { icon: '✨', color: '#F1C40F', bgColor: 'rgba(241, 196, 15, 0.2)' },
  'charge': { icon: '⚡', color: '#E74C3C', bgColor: 'rgba(231, 76, 60, 0.2)' },
  'rush': { icon: '🏃', color: '#E67E22', bgColor: 'rgba(230, 126, 34, 0.2)' },
  'lifesteal': { icon: '❤️', color: '#E91E63', bgColor: 'rgba(233, 30, 99, 0.2)' },
  'poisonous': { icon: '☠️', color: '#27AE60', bgColor: 'rgba(39, 174, 96, 0.2)' },
  'windfury': { icon: '🌪️', color: '#3498DB', bgColor: 'rgba(52, 152, 219, 0.2)' },
  'stealth': { icon: '👁️', color: '#5D6D7E', bgColor: 'rgba(93, 109, 126, 0.2)' },
  'reborn': { icon: '♻️', color: '#1ABC9C', bgColor: 'rgba(26, 188, 156, 0.2)' },
  'discover': { icon: '🔍', color: '#9B59B6', bgColor: 'rgba(155, 89, 182, 0.2)' },
  'freeze': { icon: '❄️', color: '#00BCD4', bgColor: 'rgba(0, 188, 212, 0.2)' },
  'silence': { icon: '🔇', color: '#95A5A6', bgColor: 'rgba(149, 165, 166, 0.2)' },
  'combo': { icon: '🎭', color: '#8E44AD', bgColor: 'rgba(142, 68, 173, 0.2)' },
  'inspire': { icon: '💫', color: '#F39C12', bgColor: 'rgba(243, 156, 18, 0.2)' },
  'adapt': { icon: '🦎', color: '#2ECC71', bgColor: 'rgba(46, 204, 113, 0.2)' },
  'spell damage': { icon: '🔮', color: '#9B59B6', bgColor: 'rgba(155, 89, 182, 0.2)' },
  'overload': { icon: '⚡', color: '#3498DB', bgColor: 'rgba(52, 152, 219, 0.2)' },
  'secret': { icon: '❓', color: '#E74C3C', bgColor: 'rgba(231, 76, 60, 0.2)' },
  'frenzy': { icon: '😤', color: '#E74C3C', bgColor: 'rgba(231, 76, 60, 0.2)' },
  'draw': { icon: '📜', color: '#3498DB', bgColor: 'rgba(52, 152, 219, 0.2)' },
};

// Keyword definitions with standard descriptions
const keywordDefinitions: Record<string, string> = {
  'battlecry': 'Triggers when you play this card from your hand.',
  'deathrattle': 'Triggers when this minion dies.',
  'taunt': 'Enemies must attack this minion first.',
  'divine shield': 'The first damage this minion takes is ignored.',
  'charge': 'Can attack immediately.',
  'rush': 'Can attack minions immediately.',
  'lifesteal': 'Damage dealt also heals your hero.',
  'poisonous': 'Destroy any minion damaged by this.',
  'windfury': 'Can attack twice each turn.',
  'stealth': 'Cannot be targeted until it attacks.',
  'reborn': 'Returns to life with 1 Health.',
  'discover': 'Choose one of three cards to add to your hand.',
  'freeze': 'Frozen characters lose their next attack.',
  'silence': 'Removes all card text and enchantments.',
  'combo': 'Bonus effect if you played another card first this turn.',
  'inspire': 'Triggers each time you use your Hero Power.',
  'adapt': 'Choose one of three bonuses.',
  'spell damage': 'Your spells deal extra damage.',
  'overload': 'Locks some mana crystals next turn.',
  'secret': 'Hidden until a specific action occurs.',
  'frenzy': 'Triggers the first time this survives damage.',
  'draw': 'Draw a card from your deck.',
};

// Extract specific effect text for a keyword from description
const extractKeywordEffect = (description: string, keyword: string): string => {
  const desc = description;
  const keywordLower = keyword.toLowerCase();
  const descLower = desc.toLowerCase();
  
  // Find where the keyword appears (case insensitive)
  const keywordIndex = descLower.indexOf(keywordLower);
  if (keywordIndex === -1) {
    return keywordDefinitions[keywordLower] || `${keyword} effect`;
  }
  
  // Get text after the keyword
  const afterKeyword = desc.substring(keywordIndex + keyword.length);
  
  // For keywords followed by colon (like "Battlecry: Deal 2 damage")
  // Match colon then capture text until period, end of string, or next keyword pattern
  const colonMatch = afterKeyword.match(/^:\s*(.+?)(?:\.(?:\s|$)|$|(?=\s+[A-Z][a-z]+:))/s);
  if (colonMatch && colonMatch[1]) {
    const effectText = colonMatch[1].trim();
    if (effectText.length > 0) {
      return effectText;
    }
  }
  
  // Alternative: Try to extract text between keyword and period
  const periodMatch = afterKeyword.match(/^[:\s]*([^.]+)/);
  if (periodMatch && periodMatch[1]) {
    const effectText = periodMatch[1].trim();
    if (effectText.length > 0 && effectText !== keyword) {
      return effectText;
    }
  }
  
  // For standalone keywords (like "Taunt" or "Divine Shield"), use standard definition
  return keywordDefinitions[keywordLower] || `${keyword} effect`;
};

// Extract keyword icons from card description
const getCardKeywordIcons = (description?: string): { icon: string; color: string; bgColor: string; keyword: string; effectText: string }[] => {
  if (!description) return [];
  
  const icons: { icon: string; color: string; bgColor: string; keyword: string; effectText: string }[] = [];
  const desc = description.toLowerCase();
  
  for (const [keyword, info] of Object.entries(keywordIcons)) {
    if (desc.includes(keyword)) {
      const effectText = extractKeywordEffect(description, keyword);
      icons.push({ ...info, keyword, effectText });
    }
  }
  
  return icons.slice(0, 4);
};

interface BattlefieldCardFrameProps {
  attack: number;
  health: number;
  manaCost?: number;
  name: string;
  imageSrc: string;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
  type?: 'minion' | 'spell' | 'weapon';
  keywords?: string[];
  description?: string;
  onClick?: () => void;
  width?: number | string;
  height?: number | string;
  isOnBattlefield?: boolean; // When true, shows compact view with no mana, no text, only icons
}

// Helper function to intelligently position tooltip to avoid viewport cutoff
const calculateTooltipPosition = (element: HTMLElement | null): 'top' | 'bottom' => {
  if (!element) return 'top';
  
  const rect = element.getBoundingClientRect();
  const TOOLTIP_HEIGHT = 100; // Approximate tooltip height
  const BUFFER = 40; // Additional buffer space
  
  // Check if there's enough space above
  const spaceAbove = rect.top;
  const spaceBelow = window.innerHeight - rect.bottom;
  
  // If more space below or insufficient space above, position below
  if (spaceBelow > spaceAbove && spaceBelow > TOOLTIP_HEIGHT + BUFFER) {
    return 'bottom';
  }
  
  return 'top';
};

const BattlefieldCardFrame: React.FC<BattlefieldCardFrameProps> = ({
  attack,
  health,
  manaCost,
  name,
  imageSrc,
  rarity = 'common',
  type = 'minion',
  keywords = [],
  description = '',
  onClick,
  width,
  height,
  isOnBattlefield = false
}) => {
  const [hoveredKeyword, setHoveredKeyword] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<'top' | 'bottom'>('top');
  // Professional color palette
  const rarityConfig = {
    common: { 
      border: '#4A5568', 
      glow: 'none',
      accent: '#718096',
      nameBg: 'linear-gradient(180deg, #2D3748 0%, #1A202C 100%)'
    },
    rare: { 
      border: '#4299E1', 
      glow: '0 0 12px rgba(66, 153, 225, 0.5), inset 0 0 8px rgba(66, 153, 225, 0.1)',
      accent: '#63B3ED',
      nameBg: 'linear-gradient(180deg, #2C5282 0%, #1A365D 100%)'
    },
    epic: { 
      border: '#9F7AEA', 
      glow: '0 0 15px rgba(159, 122, 234, 0.6), inset 0 0 10px rgba(159, 122, 234, 0.15)',
      accent: '#B794F4',
      nameBg: 'linear-gradient(180deg, #553C9A 0%, #322659 100%)'
    },
    legendary: { 
      border: '#F6AD55', 
      glow: '0 0 20px rgba(246, 173, 85, 0.7), inset 0 0 12px rgba(246, 173, 85, 0.2)',
      accent: '#FBD38D',
      nameBg: 'linear-gradient(180deg, #744210 0%, #5C3D14 100%)'
    }
  };

  const config = rarityConfig[rarity];
  // Support both numeric and string dimensions (for CSS variables)
  const cardWidth = width !== undefined 
    ? (typeof width === 'number' ? `${width}px` : width)
    : '180px';
  const cardHeight = height !== undefined 
    ? (typeof height === 'number' ? `${height}px` : height)
    : '252px';
  
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  const effectIcons = getCardKeywordIcons(description);
  const isMinion = type === 'minion';
  const isSpell = type === 'spell';

  const getTypeIcon = () => {
    switch (type) {
      case 'spell': return '✨';
      case 'weapon': return '⚔️';
      default: return '👤';
    }
  };

  return (
    <div 
      className="battlefield-card-frame-pro"
      style={{ 
        width: cardWidth, 
        height: cardHeight,
        cursor: onClick ? 'pointer' : 'default',
        position: 'relative',
        filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.4))'
      }}
      onClick={onClick}
    >
      {/* Outer glow for rarity */}
      <div style={{
        position: 'absolute',
        inset: -3,
        borderRadius: '14px',
        boxShadow: config.glow,
        pointerEvents: 'none',
        zIndex: 0
      }} />

      {/* Main card body */}
      <div 
        className={`battlefield-card-body ${rarity}-card-body`}
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '10px',
          overflow: 'hidden',
          background: 'linear-gradient(180deg, #1E1E2E 0%, #12121A 100%)',
          border: `3px solid ${config.border}`,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -2px 0 rgba(0,0,0,0.3)'
        }}
      >
        {/* Inner border accent */}
        <div style={{
          position: 'absolute',
          inset: 2,
          borderRadius: '7px',
          border: '1px solid rgba(255,255,255,0.08)',
          pointerEvents: 'none',
          zIndex: 1
        }} />

        {/* Foil overlay for Legendary - Gold foil */}
        {rarity === 'legendary' && (
          <div style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '10px',
            backgroundImage: `url('${assetPath('/textures/foil.png')}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.5,
            mixBlendMode: 'color-dodge',
            pointerEvents: 'none',
            zIndex: 2,
            filter: 'brightness(1.3) contrast(1.1) saturate(1.2)'
          }} />
        )}

        {/* Foil overlay for Epic - Purple holographic */}
        {rarity === 'epic' && (
          <div style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '10px',
            backgroundImage: `url('${assetPath('/textures/epic_holographic.png')}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.4,
            mixBlendMode: 'color-dodge',
            pointerEvents: 'none',
            zIndex: 2,
            filter: 'brightness(1.2) contrast(1.1)'
          }} />
        )}

        {/* Foil overlay for Rare - Blue shimmer */}
        {rarity === 'rare' && (
          <div style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '10px',
            backgroundImage: `url('${assetPath('/textures/foil.png')}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.3,
            mixBlendMode: 'color-dodge',
            pointerEvents: 'none',
            zIndex: 2,
            filter: 'brightness(1.1) contrast(1.05) hue-rotate(200deg)'
          }} />
        )}

        {/* Card Art Area - Top portion */}
        <div style={{
          flex: '0 0 110px',
          width: '100%',
          background: imageError || !imageSrc 
            ? `linear-gradient(135deg, ${config.border}40 0%, ${config.border}15 100%)`
            : '#0A0A0F',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
          borderBottom: `2px solid ${config.border}50`
        }}>
          {/* Fallback icon when no image */}
          {(imageError || !imageSrc || !imageLoaded) && (
            <div style={{
              fontSize: '48px',
              opacity: 0.9,
              filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.6))'
            }}>
              {getTypeIcon()}
            </div>
          )}
          
          {/* Actual image */}
          {imageSrc && !imageError && (
            <img 
              src={imageSrc} 
              alt=""
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                opacity: imageLoaded ? 1 : 0,
                transition: 'opacity 0.3s ease'
              }}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
            />
          )}
          
          {/* Gradient overlay on image */}
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '40px',
            background: 'linear-gradient(transparent, rgba(0,0,0,0.9))',
            pointerEvents: 'none'
          }} />

          {/* Mana Cost - Blue diamond top left (hidden on battlefield) */}
          {!isOnBattlefield && (
            <div style={{
              position: 'absolute',
              top: 6,
              left: 6,
              width: '28px',
              height: '28px',
              background: 'linear-gradient(135deg, #4299E1 0%, #2B6CB0 100%)',
              borderRadius: '4px',
              transform: 'rotate(45deg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 6px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.3)',
              border: '2px solid #63B3ED',
              zIndex: 20
            }}>
              <span style={{
                transform: 'rotate(-45deg)',
                color: '#FFFFFF',
                fontSize: '14px',
                fontWeight: 800,
                textShadow: '0 1px 2px rgba(0,0,0,0.8)'
              }}>
                {manaCost ?? 0}
              </span>
            </div>
          )}
          
          {/* Battlefield mode: Attack stat top-left */}
          {isOnBattlefield && isMinion && (
            <div style={{
              position: 'absolute',
              top: 4,
              left: 4,
              width: '32px',
              height: '32px',
              background: 'linear-gradient(135deg, #F6AD55 0%, #C05621 100%)',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 3px 8px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.4)',
              border: '2px solid #FBD38D',
              zIndex: 20
            }}>
              <span style={{
                color: '#FFFFFF',
                fontSize: '16px',
                fontWeight: 800,
                textShadow: '0 2px 3px rgba(0,0,0,0.7)'
              }}>
                {attack}
              </span>
            </div>
          )}
          
          {/* Battlefield mode: Health stat top-right */}
          {isOnBattlefield && isMinion && (
            <div style={{
              position: 'absolute',
              top: 4,
              right: 4,
              width: '32px',
              height: '32px',
              background: 'linear-gradient(135deg, #FC8181 0%, #C53030 100%)',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 3px 8px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.4)',
              border: '2px solid #FEB2B2',
              zIndex: 20
            }}>
              <span style={{
                color: '#FFFFFF',
                fontSize: '16px',
                fontWeight: 800,
                textShadow: '0 2px 3px rgba(0,0,0,0.7)'
              }}>
                {health}
              </span>
            </div>
          )}

          {/* Keyword Icons - Top right area (only when NOT on battlefield) */}
          {!isOnBattlefield && effectIcons.length > 0 && (
            <div style={{
              position: 'absolute',
              top: 4,
              right: 4,
              display: 'flex',
              gap: '4px',
              zIndex: 20
            }}>
              {effectIcons.map((iconInfo, idx) => (
                <div 
                  key={idx}
                  title={iconInfo.keyword.charAt(0).toUpperCase() + iconInfo.keyword.slice(1)}
                  style={{
                    width: '32px',
                    height: '32px',
                    background: iconInfo.bgColor,
                    backdropFilter: 'blur(4px)',
                    borderRadius: '6px',
                    border: `2px solid ${iconInfo.color}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    boxShadow: '0 3px 8px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.2)'
                  }}
                >
                  {iconInfo.icon}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Card Name Banner - full version for hand, compact for battlefield */}
        <div style={{
          width: '100%',
          padding: isOnBattlefield ? '4px 6px' : '8px 10px',
          background: config.nameBg,
          textAlign: 'center',
          position: 'relative',
          borderBottom: `1px solid ${config.border}40`
        }}>
          <div style={{
            color: '#FFFFFF',
            fontSize: isOnBattlefield ? '10px' : '14px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.3px',
            textShadow: '0 2px 4px rgba(0,0,0,0.9), 0 0 10px rgba(0,0,0,0.5)',
            lineHeight: 1.2,
            wordWrap: 'break-word',
            overflowWrap: 'break-word'
          }}>
            {name}
          </div>
        </div>

        {/* Description Area - Shows text when in hand, icons only when on battlefield */}
        <div style={{
          flex: 1,
          width: '100%',
          padding: isOnBattlefield ? '6px' : '8px 10px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '4px',
          background: 'linear-gradient(180deg, rgba(30,30,46,0.95) 0%, rgba(18,18,26,0.98) 100%)'
        }}>
          {/* Battlefield mode: Show only ability icons centered with hover tooltip */}
          {isOnBattlefield && effectIcons.length > 0 && (
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '6px',
              justifyContent: 'center',
              alignItems: 'center',
              position: 'relative'
            }}>
              {effectIcons.map((iconInfo, idx) => (
                <div 
                  key={idx}
                  onMouseEnter={(e) => {
                    setHoveredKeyword(iconInfo.keyword);
                    const pos = calculateTooltipPosition((e.currentTarget.parentElement as HTMLElement));
                    setTooltipPosition(pos);
                  }}
                  onMouseLeave={() => setHoveredKeyword(null)}
                  style={{
                    width: '28px',
                    height: '28px',
                    background: iconInfo.bgColor,
                    backdropFilter: 'blur(4px)',
                    borderRadius: '6px',
                    border: `2px solid ${iconInfo.color}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '16px',
                    boxShadow: hoveredKeyword === iconInfo.keyword 
                      ? `0 0 12px ${iconInfo.color}` 
                      : '0 2px 6px rgba(0,0,0,0.4)',
                    cursor: 'pointer',
                    transition: 'box-shadow 0.2s ease'
                  }}
                >
                  {iconInfo.icon}
                </div>
              ))}
              
              {/* Tooltip popup showing keyword-specific effect description - dynamically positioned to avoid cutoff */}
              {hoveredKeyword && (
                <div style={{
                  position: 'absolute',
                  ...(tooltipPosition === 'top' ? {
                    bottom: '100%',
                    marginBottom: '8px'
                  } : {
                    top: '100%',
                    marginTop: '8px'
                  }),
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'linear-gradient(145deg, #1e293b, #0f172a)',
                  border: '2px solid rgba(245, 158, 11, 0.6)',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  minWidth: '180px',
                  maxWidth: '250px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.7)',
                  zIndex: 1000,
                  pointerEvents: 'none'
                }}>
                  <div style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#fbbf24',
                    textTransform: 'uppercase',
                    marginBottom: '6px',
                    letterSpacing: '0.5px'
                  }}>
                    {hoveredKeyword}
                  </div>
                  <div style={{
                    fontSize: '11px',
                    color: '#e2e8f0',
                    lineHeight: 1.4
                  }}>
                    {effectIcons.find(i => i.keyword === hoveredKeyword)?.effectText || keywordDefinitions[hoveredKeyword] || 'No effect description'}
                  </div>
                  {/* Arrow pointing toward the keyword icon - dynamically positioned */}
                  <div style={{
                    position: 'absolute',
                    ...(tooltipPosition === 'top' ? {
                      bottom: '-6px',
                      borderLeft: '6px solid transparent',
                      borderRight: '6px solid transparent',
                      borderTop: '6px solid rgba(245, 158, 11, 0.6)'
                    } : {
                      top: '-6px',
                      borderLeft: '6px solid transparent',
                      borderRight: '6px solid transparent',
                      borderBottom: '6px solid rgba(245, 158, 11, 0.6)'
                    }),
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 0,
                    height: 0
                  }} />
                </div>
              )}
            </div>
          )}
          
          {/* Hand mode: Keywords as styled chips */}
          {!isOnBattlefield && keywords.length > 0 && (
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '4px',
              justifyContent: 'center',
              marginBottom: '2px'
            }}>
              {keywords.slice(0, 3).map((kw, i) => (
                <span key={i} style={{
                  fontSize: '9px',
                  fontWeight: 700,
                  color: config.accent,
                  background: `${config.border}25`,
                  padding: '2px 6px',
                  borderRadius: '8px',
                  border: `1px solid ${config.border}50`,
                  textTransform: 'uppercase',
                  letterSpacing: '0.3px'
                }}>
                  {kw}
                </span>
              ))}
            </div>
          )}
          
          {/* Hand mode: Description text - show full text without truncation */}
          {!isOnBattlefield && (
            <div style={{
              fontSize: '11px',
              fontWeight: 500,
              color: '#E2E8F0',
              textAlign: 'center',
              lineHeight: 1.4,
              wordWrap: 'break-word',
              overflowWrap: 'break-word',
              textShadow: '0 1px 2px rgba(0,0,0,0.6)'
            }}>
              {description}
            </div>
          )}
        </div>

        {/* Bottom Stats Bar - Attack and Health (hidden on battlefield, shown in hand) */}
        {isMinion && !isOnBattlefield && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '0 4px 4px 4px',
            background: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.4) 100%)'
          }}>
            {/* Attack Badge */}
            <div style={{
              width: '36px',
              height: '36px',
              background: 'linear-gradient(135deg, #F6AD55 0%, #C05621 100%)',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 3px 8px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.4), inset 0 -2px 0 rgba(0,0,0,0.3)',
              border: '2px solid #FBD38D',
              position: 'relative'
            }}>
              <span style={{
                color: '#FFFFFF',
                fontSize: '18px',
                fontWeight: 800,
                textShadow: '0 2px 3px rgba(0,0,0,0.7)'
              }}>
                {attack}
              </span>
              {/* Sword icon */}
              <span style={{
                position: 'absolute',
                top: -8,
                left: '50%',
                transform: 'translateX(-50%)',
                fontSize: '10px'
              }}>⚔️</span>
            </div>

            {/* Health Badge */}
            <div style={{
              width: '36px',
              height: '36px',
              background: 'linear-gradient(135deg, #FC8181 0%, #C53030 100%)',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 3px 8px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.4), inset 0 -2px 0 rgba(0,0,0,0.3)',
              border: '2px solid #FEB2B2',
              position: 'relative'
            }}>
              <span style={{
                color: '#FFFFFF',
                fontSize: '18px',
                fontWeight: 800,
                textShadow: '0 2px 3px rgba(0,0,0,0.7)'
              }}>
                {health}
              </span>
              {/* Heart icon */}
              <span style={{
                position: 'absolute',
                top: -8,
                left: '50%',
                transform: 'translateX(-50%)',
                fontSize: '10px'
              }}>❤️</span>
            </div>
          </div>
        )}

        {/* Spell card mana display at bottom */}
        {isSpell && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            padding: '6px',
            background: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.4) 100%)'
          }}>
            <div style={{
              padding: '4px 16px',
              background: 'linear-gradient(135deg, #805AD5 0%, #553C9A 100%)',
              borderRadius: '12px',
              border: '2px solid #B794F4',
              boxShadow: '0 2px 6px rgba(0,0,0,0.4)'
            }}>
              <span style={{
                color: '#FFFFFF',
                fontSize: '12px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Spell
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Card animations */}
      <style>
        {`
          .legendary-card-body {
            animation: legendary-pulse 3s infinite ease-in-out;
          }
          
          .epic-card-body {
            animation: epic-pulse 3s infinite ease-in-out;
          }
          
          @keyframes legendary-pulse {
            0%, 100% { 
              box-shadow: inset 0 1px 0 rgba(255,255,255,0.1), 
                          inset 0 -2px 0 rgba(0,0,0,0.3),
                          0 0 15px rgba(246, 173, 85, 0.3);
            }
            50% { 
              box-shadow: inset 0 1px 0 rgba(255,255,255,0.1), 
                          inset 0 -2px 0 rgba(0,0,0,0.3),
                          0 0 25px rgba(246, 173, 85, 0.5);
            }
          }
          
          @keyframes epic-pulse {
            0%, 100% { 
              box-shadow: inset 0 1px 0 rgba(255,255,255,0.1), 
                          inset 0 -2px 0 rgba(0,0,0,0.3),
                          0 0 12px rgba(159, 122, 234, 0.3);
            }
            50% { 
              box-shadow: inset 0 1px 0 rgba(255,255,255,0.1), 
                          inset 0 -2px 0 rgba(0,0,0,0.3),
                          0 0 20px rgba(159, 122, 234, 0.5);
            }
          }
          
          .battlefield-card-frame-pro:hover {
            transform: translateY(-2px);
            transition: transform 0.2s ease;
          }
        `}
      </style>
    </div>
  );
};

export default BattlefieldCardFrame;

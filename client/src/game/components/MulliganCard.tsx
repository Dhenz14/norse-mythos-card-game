import React, { useState } from 'react';
import { CardInstance } from '../types';
import { formatCardText } from '../utils/textFormatUtils';
import { RaceIcon } from './RaceIcon';

interface MulliganCardProps {
  card: CardInstance;
  isSelected: boolean;
  onClick: () => void;
}

export const MulliganCard: React.FC<MulliganCardProps> = ({ card, isSelected, onClick }) => {
  const cardData = card?.card;
  const [isHovered, setIsHovered] = useState(false);
  
  // Guard against undefined cardData
  if (!cardData) {
    return (
      <div className="w-32 h-48 bg-gray-800 rounded-lg border border-gray-600 flex items-center justify-center">
        <span className="text-gray-500 text-xs">Loading...</span>
      </div>
    );
  }

  const getRarityBorder = (rarity?: string) => {
    switch (rarity?.toLowerCase()) {
      case 'legendary': return 'border-yellow-500 shadow-yellow-500/50';
      case 'epic': return 'border-purple-500 shadow-purple-500/50';
      case 'rare': return 'border-blue-500 shadow-blue-500/50';
      default: return 'border-gray-400 shadow-gray-400/30';
    }
  };

  const getRarityGlow = (rarity?: string) => {
    switch (rarity?.toLowerCase()) {
      case 'legendary': return 'rgba(234, 179, 8, 0.3)';
      case 'epic': return 'rgba(168, 85, 247, 0.3)';
      case 'rare': return 'rgba(59, 130, 246, 0.3)';
      default: return 'rgba(156, 163, 175, 0.2)';
    }
  };

  // Keyword icons mapping - matching the old card style
  const keywordIcons: Record<string, { icon: string; color: string }> = {
    'battlecry': { icon: '⚔️', color: '#FFD700' },
    'deathrattle': { icon: '💀', color: '#9B59B6' },
    'taunt': { icon: '🛡️', color: '#7F8C8D' },
    'divine shield': { icon: '✨', color: '#F1C40F' },
    'charge': { icon: '⚡', color: '#E74C3C' },
    'rush': { icon: '🏃', color: '#E67E22' },
    'lifesteal': { icon: '❤️', color: '#E91E63' },
    'poisonous': { icon: '☠️', color: '#27AE60' },
    'windfury': { icon: '🌪️', color: '#3498DB' },
    'stealth': { icon: '👁️', color: '#34495E' },
    'reborn': { icon: '♻️', color: '#1ABC9C' },
    'discover': { icon: '🔍', color: '#9B59B6' },
    'freeze': { icon: '❄️', color: '#00BCD4' },
    'silence': { icon: '🔇', color: '#95A5A6' },
    'combo': { icon: '🎭', color: '#8E44AD' },
    'inspire': { icon: '💫', color: '#F39C12' },
    'adapt': { icon: '🦎', color: '#2ECC71' },
    'spell damage': { icon: '🔮', color: '#9B59B6' },
    'overload': { icon: '⚡', color: '#3498DB' },
    'secret': { icon: '❓', color: '#E74C3C' },
  };

  // Get keyword icons from card keywords and description
  const getCardKeywordIcons = () => {
    const icons: { icon: string; color: string; keyword: string }[] = [];
    
    // Check explicit keywords array
    if (cardData.keywords) {
      for (const keyword of cardData.keywords) {
        const info = keywordIcons[keyword.toLowerCase()];
        if (info) {
          icons.push({ ...info, keyword });
        }
      }
    }
    
    // Also check description for keywords
    if (cardData.description) {
      const desc = cardData.description.toLowerCase();
      for (const [keyword, info] of Object.entries(keywordIcons)) {
        if (desc.includes(keyword) && !icons.find(i => i.keyword.toLowerCase() === keyword)) {
          icons.push({ ...info, keyword });
        }
      }
    }
    
    return icons.slice(0, 4); // Limit to 4 icons max
  };

  const effectIcons = getCardKeywordIcons();
  const race = cardData.race || (cardData as any).tribe;
  
  // Card images use placeholder logic (external image service removed)
  const cardImage: string | null = null;

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative cursor-pointer transition-all duration-300 transform ${
        isSelected 
          ? 'scale-95 opacity-70' 
          : 'hover:scale-105'
      }`}
      style={{ width: '200px', height: '280px' }}
    >
      <div 
        className={`relative w-full h-full rounded-xl overflow-hidden border-3 ${
          isSelected ? 'border-red-500' : getRarityBorder(cardData.rarity)
        }`}
        style={{
          background: 'linear-gradient(180deg, #2a2a3e 0%, #1a1a2e 50%, #0f0f1a 100%)',
          borderWidth: '3px',
          boxShadow: isSelected 
            ? '0 0 20px rgba(239, 68, 68, 0.5)' 
            : `0 8px 32px rgba(0,0,0,0.5), 0 0 20px ${getRarityGlow(cardData.rarity)}`
        }}
      >
        {/* Mana Cost - Top Left (Fixed Position) */}
        <div 
          className="absolute top-2 left-2 w-10 h-10 flex items-center justify-center rounded-full z-30 shadow-lg"
          style={{
            background: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 50%, #2563eb 100%)',
            border: '2px solid rgba(255,255,255,0.4)',
            boxShadow: '0 2px 8px rgba(37, 99, 235, 0.5), inset 0 1px 2px rgba(255,255,255,0.3)'
          }}
        >
          <span className="text-white font-bold text-lg drop-shadow-md">{cardData.manaCost}</span>
        </div>

        {/* Effect Icons - Top Right, stacked vertically */}
        {effectIcons.length > 0 && (
          <div className="absolute top-2 right-2 flex flex-col gap-1 z-30">
            {effectIcons.slice(0, 3).map((effect, idx) => (
              <div
                key={idx}
                className="w-6 h-6 flex items-center justify-center rounded-full shadow-md"
                style={{
                  background: `linear-gradient(135deg, ${effect.color}33, ${effect.color}55)`,
                  border: `1.5px solid ${effect.color}`,
                  boxShadow: `0 1px 4px ${effect.color}55`
                }}
                title={effect.keyword}
              >
                <span style={{ fontSize: '11px' }}>{effect.icon}</span>
              </div>
            ))}
          </div>
        )}

        {/* Card Image Area */}
        <div className="absolute left-3 right-3 top-14 h-24 rounded-lg overflow-hidden shadow-inner" style={{ position: 'relative' }}>
          {cardImage ? (
            <>
              <img 
                src={cardImage} 
                alt="" 
                className="w-full h-full object-cover"
              />
              {/* Gradient overlay to hide baked-in card names at top of image */}
              <div 
                className="absolute inset-x-0 top-0 h-8 pointer-events-none"
                style={{
                  background: 'linear-gradient(to bottom, rgba(26,26,46,1) 0%, rgba(26,26,46,0.8) 40%, rgba(26,26,46,0) 100%)'
                }}
              />
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-800">
              <div className="w-12 h-12 bg-gray-600/50 rounded-lg animate-pulse" />
            </div>
          )}
        </div>

        {/* Card Name */}
        <div 
          className="absolute left-2 right-2 bg-gradient-to-r from-amber-800 via-amber-700 to-amber-800 rounded-md px-2 py-1.5 shadow-lg"
          style={{ top: '145px' }}
        >
          <h3 className="text-amber-100 font-bold text-sm text-center drop-shadow truncate">
            {cardData.name}
          </h3>
        </div>

        {/* Card Description */}
        <div 
          className="absolute left-2 right-2 px-1"
          style={{ top: '175px', height: '55px' }}
        >
          {cardData.description && (
            <p className="text-gray-200 text-xs text-center leading-tight" 
               style={{ 
                 overflow: 'visible',
                 wordWrap: 'break-word',
                 fontSize: '11px'
               }}>
              {formatCardText(cardData.description)}
            </p>
          )}
        </div>

        {/* Race/Tribe Icon - Above stats */}
        {race && (
          <div className="absolute left-1/2 transform -translate-x-1/2 z-30" style={{ bottom: '36px' }}>
            <RaceIcon race={race} rarity={cardData.rarity} scale={0.7} />
          </div>
        )}

        {/* Attack Stat - Bottom Left (Fixed Position) */}
        {(cardData.type === 'minion' || cardData.type === 'weapon') && cardData.attack !== undefined && (
          <div 
            className="absolute bottom-2 left-2 w-9 h-9 flex items-center justify-center rounded-full z-30 shadow-lg"
            style={{
              background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)',
              border: '2px solid rgba(255,255,255,0.4)',
              boxShadow: '0 2px 8px rgba(217, 119, 6, 0.5), inset 0 1px 2px rgba(255,255,255,0.3)'
            }}
          >
            <span className="text-white font-bold text-sm drop-shadow">{cardData.attack}</span>
          </div>
        )}

        {/* Health Stat - Bottom Right (Fixed Position) */}
        {cardData.type === 'minion' && cardData.health !== undefined && (
          <div 
            className="absolute bottom-2 right-2 w-9 h-9 flex items-center justify-center rounded-full z-30 shadow-lg"
            style={{
              background: 'linear-gradient(135deg, #4ade80 0%, #22c55e 50%, #16a34a 100%)',
              border: '2px solid rgba(255,255,255,0.4)',
              boxShadow: '0 2px 8px rgba(22, 163, 74, 0.5), inset 0 1px 2px rgba(255,255,255,0.3)'
            }}
          >
            <span className="text-white font-bold text-sm drop-shadow">{cardData.health}</span>
          </div>
        )}

        {/* Durability for Weapons - Bottom Right */}
        {cardData.type === 'weapon' && cardData.durability !== undefined && (
          <div 
            className="absolute bottom-2 right-2 w-9 h-9 flex items-center justify-center rounded-full z-30 shadow-lg"
            style={{
              background: 'linear-gradient(135deg, #9ca3af 0%, #6b7280 50%, #4b5563 100%)',
              border: '2px solid rgba(255,255,255,0.4)',
              boxShadow: '0 2px 8px rgba(75, 85, 99, 0.5), inset 0 1px 2px rgba(255,255,255,0.3)'
            }}
          >
            <span className="text-white font-bold text-sm drop-shadow">{cardData.durability}</span>
          </div>
        )}

        {/* Selected Overlay */}
        {isSelected && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-40 rounded-xl">
            <div className="bg-red-600 text-white rounded-full w-14 h-14 flex items-center justify-center font-bold text-2xl shadow-xl border-2 border-white">
              ✕
            </div>
          </div>
        )}
      </div>

      {/* Hover Tooltip */}
      {isHovered && !isSelected && cardData.description && (
        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 -translate-y-full 
                        bg-gray-900/95 border border-gray-500 rounded-lg p-4 shadow-2xl z-50 
                        w-64 pointer-events-none backdrop-blur-sm">
          <h4 className="text-white font-bold text-base mb-2">{cardData.name}</h4>
          <p className="text-gray-200 text-sm leading-relaxed">{formatCardText(cardData.description)}</p>
          {cardData.keywords && cardData.keywords.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {cardData.keywords.map((kw, idx) => (
                <span key={idx} className="text-xs bg-gray-700 text-gray-200 px-2 py-1 rounded">
                  {kw}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

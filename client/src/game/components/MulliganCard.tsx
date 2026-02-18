import React, { useState } from 'react';
import { CardInstance } from '../types';
import { formatCardText } from '../utils/textFormatUtils';
import { SimpleCard, SimpleCardData } from './SimpleCard';

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

  // Create SimpleCardData from CardInstance
  const cardDataTyped = cardData as any; // CardData is a union type with optional properties
  const simpleCardData: SimpleCardData = {
    id: cardData.id || 0,
    name: cardData.name || 'Unknown',
    manaCost: cardData.manaCost || 0,
    attack: cardDataTyped.attack,
    health: cardDataTyped.health,
    description: cardData.description || '',
    type: (cardData.type as 'minion' | 'spell' | 'weapon') || 'minion',
    rarity: (cardData.rarity as 'common' | 'rare' | 'epic' | 'legendary') || 'common',
    tribe: cardDataTyped.tribe || cardDataTyped.race,
    cardClass: (cardDataTyped.cardClass || cardDataTyped.class),
    keywords: cardData.keywords || []
  };

  return (
    <div
      className={`relative cursor-pointer transition-all duration-300 transform ${
        isSelected 
          ? 'scale-95 opacity-70' 
          : 'hover:scale-105'
      }`}
      style={{ width: '180px' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <SimpleCard 
        card={simpleCardData} 
        size="large" 
        showDescription={true}
        onClick={onClick}
      />

      {/* Selected Overlay with Red X */}
      {isSelected && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-40 rounded-xl">
          <div className="bg-red-600 text-white rounded-full w-14 h-14 flex items-center justify-center font-bold text-2xl shadow-xl border-2 border-white">
            ✕
          </div>
        </div>
      )}

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

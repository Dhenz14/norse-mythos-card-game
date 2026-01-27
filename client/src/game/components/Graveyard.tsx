import React, { useState } from 'react';
import { CardInstance } from '../types';
import { Card } from './Card';

interface GraveyardProps {
  cards: CardInstance[];
  playerName: string;
}

export const Graveyard: React.FC<GraveyardProps> = ({ cards, playerName }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (cards.length === 0) {
    return null; // Don't render anything if there are no dead cards
  }
  
  return (
    <div className="relative">
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className={`
          flex items-center space-x-2 px-2 py-1 
          bg-gray-800 bg-opacity-70 rounded 
          text-white text-sm 
          hover:bg-gray-700 hover:bg-opacity-90
          transition-colors
        `}
      >
        <span className="text-red-400">⚰️</span>
        <span>{playerName}'s Graveyard ({cards.length})</span>
        <span>{isExpanded ? '▲' : '▼'}</span>
      </button>
      
      {isExpanded && (
        <div className="absolute z-50 bg-gray-900 bg-opacity-95 p-3 rounded-md shadow-lg border border-gray-700 mt-1 flex flex-wrap gap-2 max-w-[600px]">
          <h3 className="w-full text-white text-sm mb-2">{playerName}'s Graveyard ({cards.length} cards)</h3>
          {cards.length === 0 ? (
            <p className="text-gray-400 text-sm">No cards in graveyard yet.</p>
          ) : (
            cards.map((card) => (
              <div key={card.instanceId} className="transform scale-75 origin-top-left">
                <Card card={card} isInHand={false} />
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
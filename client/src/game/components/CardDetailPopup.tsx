import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CardData } from '../types';
import Card from './Card';
import { isMinion, getAttack, getHealth, isWeapon, getDurability } from '../utils/cards/typeGuards';

interface CardDetailPopupProps {
  card: CardData | null;
  onClose: () => void;
  position?: { x: number; y: number };
}

/**
 * CardDetailPopup - Shows an enlarged view of a card with flavor text and detailed info
 * Appears when hovering/clicking a card in collection or deck list
 */
const CardDetailPopup: React.FC<CardDetailPopupProps> = ({
  card,
  onClose,
  position
}) => {
  if (!card) return null;
  
  // Define safe position to keep popup within viewport
  const safePosition = position ? {
    x: Math.min(Math.max(position.x, 300), window.innerWidth - 350),
    y: Math.min(Math.max(position.y, 300), window.innerHeight - 350)
  } : {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2
  };
  
  // Get rarity color for the header
  const rarityColors: Record<string, string> = {
    common: '#FFFFFF',
    free: '#FFFFFF',
    rare: '#0070DD',
    epic: '#A335EE',
    legendary: '#FF8000'
  };
  
  const headerColor = rarityColors[card.rarity ?? 'common'] || rarityColors.common;
  
  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Card popup container */}
        <motion.div
          className="relative bg-gray-800 rounded-lg overflow-hidden shadow-2xl"
          onClick={e => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.8, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 50 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          style={{
            width: '40rem',
            maxWidth: '90vw'
          }}
        >
          {/* Header with card name and close button */}
          <div
            className="flex justify-between items-center px-6 py-4"
            style={{ backgroundColor: card.rarity === 'legendary' ? '#C41F3B' : '#2C3E50' }}
          >
            <h2 
              className="text-2xl font-bold"
              style={{ color: headerColor, textShadow: '0 0 3px rgba(0,0,0,0.8)' }}
            >
              {card.name}
            </h2>
            <button 
              onClick={onClose}
              className="text-white hover:text-red-400 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Card content */}
          <div className="p-6 flex flex-col md:flex-row gap-6 bg-gradient-to-b from-gray-700 to-gray-900">
            {/* Card image on the left */}
            <div className="flex-shrink-0 transform hover:scale-105 transition-transform duration-200">
              <Card card={card} scale={1.5} />
            </div>
            
            {/* Card details on the right */}
            <div className="flex-1 text-white space-y-4">
              {/* Card type, race, etc */}
              <div>
                <h3 className="text-xl font-bold text-yellow-400 mb-1">
                  {card.type.charAt(0).toUpperCase() + card.type.slice(1)}
                  {card.race ? ` - ${card.race}` : ''}
                </h3>
                
                {/* Mana cost */}
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center mr-2">
                    <span className="text-white font-bold">{card.manaCost}</span>
                  </div>
                  <span className="text-blue-300">Mana Cost</span>
                </div>
                
                {/* Attack/Health for minions */}
                {isMinion(card) && (
                  <div className="flex gap-4 mt-2">
                    <div className="flex items-center">
                      <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center mr-2">
                        <span className="text-white font-bold">{getAttack(card)}</span>
                      </div>
                      <span className="text-red-300">Attack</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-2">
                        <span className="text-white font-bold">{getHealth(card)}</span>
                      </div>
                      <span className="text-green-300">Health</span>
                    </div>
                  </div>
                )}
                
                {/* Attack/Durability for weapons */}
                {isWeapon(card) && (
                  <div className="flex gap-4 mt-2">
                    <div className="flex items-center">
                      <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center mr-2">
                        <span className="text-white font-bold">{getAttack(card)}</span>
                      </div>
                      <span className="text-red-300">Attack</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center mr-2">
                        <span className="text-white font-bold">{getDurability(card)}</span>
                      </div>
                      <span className="text-yellow-300">Durability</span>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Card description */}
              <div>
                <h3 className="text-lg font-bold text-yellow-400 mb-1">Description</h3>
                <div 
                  className="card-description bg-gray-800 p-3 rounded-md"
                  dangerouslySetInnerHTML={{ __html: formatCardText(card.description || '') }}
                />
              </div>
              
              {/* Keywords */}
              {card.keywords && card.keywords.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-yellow-400 mb-1">Keywords</h3>
                  <div className="flex flex-wrap gap-2">
                    {card.keywords.map((keyword, index) => (
                      <span 
                        key={index}
                        className="bg-blue-600 text-white px-2 py-1 text-sm rounded"
                      >
                        {keyword.charAt(0).toUpperCase() + keyword.slice(1)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Flavor text */}
              {card.flavorText && (
                <div>
                  <h3 className="text-lg font-bold text-yellow-400 mb-1">Flavor Text</h3>
                  <div className="italic text-gray-300 p-3 bg-gray-800 rounded-md border-l-4 border-yellow-500">
                    {card.flavorText}
                  </div>
                </div>
              )}
              
              {/* Rarity */}
              <div className="flex items-center">
                <span className="mr-2">Rarity:</span>
                <span 
                  className="font-bold"
                  style={{ color: headerColor }}
                >
                  {(card.rarity ?? 'common').charAt(0).toUpperCase() + (card.rarity ?? 'common').slice(1)}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Helper function to format card text with proper styling
function formatCardText(text: string): string {
  if (!text) return '';
  
  // Replace keywords with styled versions
  const keywordStyles = 'font-bold text-yellow-400';
  
  // Add styling for common Hearthstone keywords
  let formattedText = text
    .replace(/Battlecry:/g, `<span class="${keywordStyles}">Battlecry:</span>`)
    .replace(/Deathrattle:/g, `<span class="${keywordStyles}">Deathrattle:</span>`)
    .replace(/Discover/g, `<span class="${keywordStyles}">Discover</span>`)
    .replace(/Lifesteal/g, `<span class="${keywordStyles}">Lifesteal</span>`)
    .replace(/Taunt/g, `<span class="${keywordStyles}">Taunt</span>`)
    .replace(/Rush/g, `<span class="${keywordStyles}">Rush</span>`)
    .replace(/Charge/g, `<span class="${keywordStyles}">Charge</span>`)
    .replace(/Divine Shield/g, `<span class="${keywordStyles}">Divine Shield</span>`)
    .replace(/Combo:/g, `<span class="${keywordStyles}">Combo:</span>`)
    .replace(/Outcast:/g, `<span class="${keywordStyles}">Outcast:</span>`)
    .replace(/Corrupt:/g, `<span class="${keywordStyles}">Corrupt:</span>`)
    .replace(/Spellburst:/g, `<span class="${keywordStyles}">Spellburst:</span>`)
    .replace(/Tradeable/g, `<span class="${keywordStyles}">Tradeable</span>`)
    .replace(/Dormant/g, `<span class="${keywordStyles}">Dormant</span>`)
    .replace(/Colossal/g, `<span class="${keywordStyles}">Colossal</span>`)
    .replace(/Frenzy:/g, `<span class="${keywordStyles}">Frenzy:</span>`)
    .replace(/Reborn/g, `<span class="${keywordStyles}">Reborn</span>`)
    .replace(/Poisonous/g, `<span class="${keywordStyles}">Poisonous</span>`)
    .replace(/Freeze/g, `<span class="${keywordStyles}">Freeze</span>`)
    .replace(/Overload/g, `<span class="${keywordStyles}">Overload</span>`)
    .replace(/Windfury/g, `<span class="${keywordStyles}">Windfury</span>`);
  
  // Replace number references with styled ones
  formattedText = formattedText.replace(/(\d+)/g, '<span class="text-yellow-400 font-bold">$1</span>');
  
  return formattedText;
}

export default CardDetailPopup;
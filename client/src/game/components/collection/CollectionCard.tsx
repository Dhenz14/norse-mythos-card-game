import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CardData } from '../../types';
import { CardRenderer } from '../CardRenderer';
import { UnifiedCard, extractCardData } from '../../utils/cards/cardTypeAdapter';

interface CollectionCardProps {
  card: UnifiedCard;
  count?: number;
  maxCount?: number;
  onAdd?: (cardId: number) => void;
  canAdd?: boolean;
  showCardDetails?: (card: CardData) => void;
}

/**
 * CollectionCard - A card component for the collection view with Hearthstone-like hover effects and count indicator
 * Uses the Premium 3D card rendering system and supports both CardData and CardInstanceWithCardData
 */
const CollectionCard: React.FC<CollectionCardProps> = ({
  card,
  count = 0,
  maxCount = 2,
  onAdd = () => {},
  canAdd = false,
  showCardDetails = () => {}
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Glow colors based on card rarity - exactly matching Hearthstone colors
  const glowColors = {
    common: 'rgba(255, 255, 255, 0.7)',
    rare: 'rgba(0, 112, 221, 0.7)',
    epic: 'rgba(163, 53, 238, 0.7)',
    legendary: 'rgba(255, 128, 0, 0.7)'
  };
  
  // Extract card data for consistent access to properties
  const cardData = extractCardData(card);

  // Function to ensure we pass a CardData object to showCardDetails
  const handleShowCardDetails = () => {
    // We know extractCardData always returns a CardData object
    showCardDetails(cardData);
  };

  const handleClick = () => {
    if (canAdd && count < maxCount) {
      setIsAnimating(true);
      onAdd(typeof cardData.id === 'number' ? cardData.id : parseInt(cardData.id as string, 10));
      
      // Reset animation state
      setTimeout(() => {
        setIsAnimating(false);
      }, 500);
    } else {
      // Show card details when we can't add more
      handleShowCardDetails();
    }
  };
  
  const handleRightClick = (e: React.MouseEvent) => {
    e.preventDefault();
    handleShowCardDetails();
  };
  
  // Quality setting for collection view - using medium to balance performance with visuals
  // for collections with many cards visible at once
  const cardQuality = 'medium';
  
  return (
    <motion.div
      className="collection-card relative min-h-[240px] min-w-[180px] h-full block bg-gradient-to-b from-gray-800 to-gray-900 rounded-lg shadow-lg"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
      onContextMenu={handleRightClick}
      whileHover={{ 
        scale: 1.05, 
        y: -8,
        transition: { duration: 0.2 } 
      }}
      animate={{
        filter: isAnimating ? 'brightness(1.5)' : 'brightness(1)'
      }}
      transition={{ duration: 0.2 }}
    >
      {/* Using the universal CardRenderer for consistent rendering */}
      <div className="relative h-full w-full flex items-center justify-center p-3">
        <div className="w-full h-full" onClick={handleClick} onContextMenu={handleRightClick}>
          <CardRenderer
            card={cardData}
            enableHolographic={true}
            forceHolographic={cardData.rarity === 'legendary' || cardData.rarity === 'epic'}
            renderQuality="medium"
            isPlayable={canAdd && count < maxCount}
          />
        </div>
        
        {/* Card glow effect (Hearthstone style) */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[-1] rounded-lg pointer-events-none"
              style={{
                boxShadow: `0 0 15px 2px ${cardData.rarity && glowColors[cardData.rarity as keyof typeof glowColors] || glowColors.common}`,
                filter: 'blur(4px)'
              }}
            />
          )}
        </AnimatePresence>
        
        {/* Card count indicators (for cards already in deck) */}
        {count > 0 && (
          <div className="absolute top-2 right-2 flex flex-col items-center z-10">
            {[...Array(count)].map((_, i) => (
              <div
                key={i}
                className="w-8 h-8 rounded-full bg-yellow-400 border-2 border-yellow-700 flex items-center justify-center text-yellow-900 font-bold shadow-lg -mt-2 first:mt-0"
              >
                {i + 1}
              </div>
            ))}
          </div>
        )}
        
        {/* "Can't add more" indicator */}
        {count >= maxCount && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg z-10">
            <div className="bg-red-600 text-white px-3 py-1 rounded-full font-bold transform -rotate-12 shadow-lg">
              Max Copies
            </div>
          </div>
        )}
        
        {/* "Can't add due to deck full" indicator */}
        {!canAdd && count < maxCount && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg z-10">
            <div className="bg-red-600 text-white px-3 py-1 rounded-full font-bold transform -rotate-12 shadow-lg">
              Deck Full
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default CollectionCard;
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import OptimizedBattlefieldIntegration from '../game/components/OptimizedBattlefieldIntegration';
import { getStandardHolographicParams } from '../game/components/SimpleHolographicCard';
import CloudinaryService from '../lib/cloudinaryService';

// Import the CardData type and CardInstance types
import { CardData } from '../game/types';
import { CardInstance } from '../types/cards';
import { v4 as uuidv4 } from 'uuid';

// Sample card data for the demo
const DEMO_CARDS: CardData[] = [
  {
    id: 20202,
    name: "Blingtron 3000",
    manaCost: 5,
    attack: 3,
    health: 4,
    type: "minion",
    rarity: "legendary",
    description: "Battlecry: Equip a random weapon for each player.",
    flavorText: "WARNING: Blingtron 3000 is not responsible for customer dismemberment.",
    keywords: ["battlecry"],
    class: "Neutral",
    race: "mech",
    collectible: true
  },
  {
    id: 20216,
    name: "Sergeant Sally",
    manaCost: 3,
    attack: 1,
    health: 1,
    type: "minion",
    rarity: "legendary",
    description: "Deathrattle: Deal damage equal to this minion's Attack to all enemy minions.",
    flavorText: "Safety is her middle name. Her full name is Sally Safety Dangerzone.",
    keywords: ["deathrattle"],
    class: "Neutral",
    collectible: true
  },
  {
    id: 32007,
    name: "Elise the Trailblazer",
    manaCost: 5,
    attack: 5,
    health: 5,
    type: "minion",
    rarity: "legendary",
    description: "Battlecry: Shuffle a sealed Un'Goro pack into your deck.",
    keywords: ["battlecry"],
    class: "Neutral",
    collectible: true
  },
  {
    id: 20007,
    name: "Missile Launcher",
    manaCost: 6,
    attack: 4,
    health: 4,
    type: "minion",
    rarity: "rare",
    description: "Magnetic, At the end of your turn, deal 1 damage to all other characters.",
    keywords: ["magnetic"],
    class: "Neutral",
    race: "mech",
    collectible: true
  },
  {
    id: 20125,
    name: "Aya Blackpaw",
    manaCost: 6,
    attack: 5,
    health: 3,
    type: "minion",
    rarity: "epic",
    description: "Battlecry and Deathrattle: Summon a Jade Golem.",
    flavorText: "Though young, clever and deadly, Aya still has a soft spot for stuffed animals. And for using them to smuggle contraband.",
    keywords: ["battlecry", "deathrattle"],
    class: "Neutral",
    collectible: true
  }
];

/**
 * CardTransformationDemo
 * 
 * A demonstration component that showcases the transformation between
 * full-sized card and optimized battlefield-sized card.
 */
const CardTransformationDemo: React.FC = () => {
  // Track the state of each card
  const [cardsState, setCardsState] = useState<{ [key: string]: boolean }>({});
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  // Initialize card states
  useEffect(() => {
    const initialState: { [key: string]: boolean } = {};
    DEMO_CARDS.forEach(card => {
      initialState[`card-${card.id}`] = true; // All cards start in hand (full size)
    });
    setCardsState(initialState);
  }, []);

  // Toggle card state (hand/battlefield)
  const toggleCardState = (cardId: string) => {
    setCardsState(prev => ({
      ...prev,
      [cardId]: !prev[cardId]
    }));
  };

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="p-4 space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-amber-200 mb-2">Card Transformation Demo</h1>
          <p className="text-gray-300 mb-6">
            Click on any card to toggle between full card (hand) and optimized card (battlefield)
          </p>
        </div>

        {/* Instructions */}
        <div className="bg-gray-800 p-4 rounded-lg mb-8 shadow-md border border-amber-800">
          <h2 className="text-xl font-semibold text-amber-300 mb-2">About This Feature</h2>
          <p className="text-gray-300 mb-2">
            This demo showcases our implementation of card transformations between:
          </p>
          <ul className="list-disc pl-6 text-gray-300 mb-3">
            <li>Full-sized cards when in hand - showing all card details</li>
            <li>Optimized compact cards when on the battlefield - focused on essential information</li>
          </ul>
          <p className="text-gray-300">
            The compact battlefield cards maintain the same visual identity with:
          </p>
          <ul className="list-disc pl-6 text-gray-300">
            <li>Consistent placement of attack and health values in hexagonal badges</li>
            <li>Rarity-specific holographic effects and border treatments</li>
            <li>Hover to see full card details when needed</li>
          </ul>
        </div>

        {/* Card display area */}
        <div className="flex flex-wrap justify-center gap-8 p-6 rounded-lg">
          {DEMO_CARDS.map((card) => {
            const cardId = `card-${card.id}`;
            const isInHand = cardsState[cardId];
            
            return (
              <div 
                key={cardId} 
                className="relative"
                onMouseEnter={() => setHoveredCard(cardId)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <motion.div
                  className="transform-gpu"
                  initial={{ scale: 1 }}
                  animate={{ 
                    scale: 1,
                    rotateY: isInHand ? 0 : 180,
                    y: isInHand ? 0 : -50
                  }}
                  transition={{ 
                    type: "spring",
                    stiffness: 120,
                    damping: 15,
                    duration: 0.5
                  }}
                  style={{ 
                    // Added perspective for better 3D flip effect
                    transformStyle: 'preserve-3d',
                    transformOrigin: 'center center',
                    perspective: '1200px'
                  }}
                >
                  <div className="relative" style={{ transform: isInHand ? 'rotateY(0deg)' : 'rotateY(180deg)' }}>
                    <OptimizedBattlefieldIntegration
                      card={{
                        ...card,
                        instanceId: `card-instance-${card.id}`, // Add required instanceId for CardInstance type
                      }}
                      isInHand={isInHand}
                      externalIsHovering={hoveredCard === cardId}
                      onClick={() => toggleCardState(cardId)}
                      scale={isInHand ? 0.9 : 0.7}
                      holographicParams={getStandardHolographicParams()}
                      use3D={true}
                      style={{
                        transformOrigin: 'center center',
                        backfaceVisibility: 'hidden'
                      }}
                    />
                  </div>
                </motion.div>
                
                {/* Label showing current state */}
                <div 
                  className={`absolute -bottom-8 left-1/2 transform -translate-x-1/2 px-3 py-1 rounded text-xs font-semibold ${
                    isInHand 
                      ? 'bg-blue-900 text-blue-200' 
                      : 'bg-amber-900 text-amber-200'
                  }`}
                >
                  {isInHand ? 'Hand Card (Full Size)' : 'Battlefield Card (Optimized)'}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Additional information */}
        <div className="mt-8 bg-gray-800 p-4 rounded-lg shadow-md border border-amber-800">
          <h3 className="text-lg font-semibold text-amber-300 mb-2">Note on Rarity Effects</h3>
          <ul className="list-disc pl-6 text-gray-300">
            <li><span className="text-amber-400 font-semibold">Legendary cards</span> - Gold holographic effect with animated border</li>
            <li><span className="text-purple-400 font-semibold">Epic cards</span> - Purple prismatic shift effect and pulsing glow</li>
            <li><span className="text-blue-400 font-semibold">Rare cards</span> - Blue border treatment with subtle shine</li>
            <li><span className="text-gray-400 font-semibold">Common cards</span> - Standard appearance with minimal effects</li>
          </ul>
          <p className="mt-3 text-gray-400 text-sm italic">
            Optimized cards on the battlefield maintain these rarity effects while using compact layout
            that prioritizes gameplay-critical information.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CardTransformationDemo;
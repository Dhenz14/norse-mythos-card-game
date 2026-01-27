import React, { useState } from 'react';
import SimpleHolographicCard from './SimpleHolographicCard';
import CardRenderer from './CardRendering/CardRenderer';
import { useNavigate } from 'react-router-dom';

/**
 * NewCardFramePreview component 
 * 
 * This component provides a preview of the new card design system,
 * showcasing both battlefield and hand representations of cards with
 * consistent styling and effects.
 */
const NewCardFramePreview: React.FC = () => {
  const navigate = useNavigate();
  const [selectedCardType, setSelectedCardType] = useState<'legendary' | 'epic' | 'rare' | 'common'>('legendary');
  
  // Sample cards for demonstration
  const sampleCards: Record<string, any> = {
    legendary: {
      id: 14456,
      instanceId: "preview-legendary",
      card: {
        id: 14456,
        name: "Stalagg",
        manaCost: 5,
        attack: 7,
        health: 4,
        type: "minion" as const,
        rarity: "legendary" as const,
        class: "Neutral",
        description: "Deathrattle: If Feugen also died this game, summon Thaddius."
      }
    },
    epic: {
      id: 14457,
      instanceId: "preview-epic",
      card: {
        id: 14457,
        name: "Malygos",
        manaCost: 9,
        attack: 4,
        health: 12,
        type: "minion" as const,
        rarity: "epic" as const,
        class: "Neutral",
        description: "Spell Damage +5. Your spells deal additional damage. The power of these spells flows through."
      }
    },
    rare: {
      id: 14458,
      instanceId: "preview-rare",
      card: {
        id: 14458,
        name: "Coldlight Seer",
        manaCost: 3,
        attack: 2,
        health: 3,
        type: "minion" as const,
        rarity: "rare" as const,
        class: "Neutral",
        description: "Battlecry: Give your other Murlocs +2 Health."
      }
    },
    common: {
      id: 14459,
      instanceId: "preview-common",
      card: {
        id: 14459,
        name: "Dragonling Mechanic",
        manaCost: 4,
        attack: 2,
        health: 4,
        type: "minion" as const,
        rarity: "common" as const,
        class: "Neutral",
        description: "Battlecry: Summon a 2/1 Mechanical Dragonling."
      }
    }
  };
  
  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-center">New Card Frame System</h1>
      
      <div className="mb-6">
        <p className="text-center mb-4">
          This preview demonstrates the consistent card appearance throughout the game. 
          Cards on the battlefield now use the same visual style as cards in hand.
        </p>
        
        <div className="flex justify-center gap-4 mb-6">
          <button 
            className={`px-4 py-2 rounded-md ${selectedCardType === 'legendary' ? 'bg-amber-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setSelectedCardType('legendary')}
          >
            Legendary
          </button>
          <button 
            className={`px-4 py-2 rounded-md ${selectedCardType === 'epic' ? 'bg-purple-600 text-white' : 'bg-gray-200'}`}
            onClick={() => setSelectedCardType('epic')}
          >
            Epic
          </button>
          <button 
            className={`px-4 py-2 rounded-md ${selectedCardType === 'rare' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            onClick={() => setSelectedCardType('rare')}
          >
            Rare
          </button>
          <button 
            className={`px-4 py-2 rounded-md ${selectedCardType === 'common' ? 'bg-gray-600 text-white' : 'bg-gray-200'}`}
            onClick={() => setSelectedCardType('common')}
          >
            Common
          </button>
        </div>
      </div>
      
      <div className="flex flex-wrap justify-center gap-8 items-center">
        {/* Left side - Battlefield representation */}
        <div className="bg-gray-800 p-4 rounded-lg flex flex-col items-center" style={{ width: '300px' }}>
          <h2 className="text-white text-lg mb-3">Battlefield View</h2>
          <div style={{ transform: 'scale(1.2)', transformOrigin: 'center' }}>
            <CardRenderer 
              card={sampleCards[selectedCardType].card}
              isPlayable={false}
              isHighlighted={false}
              size="medium"
            />
          </div>
        </div>
        
        {/* Right side - Hand representation */}
        <div className="bg-gray-800 p-4 rounded-lg flex flex-col items-center" style={{ width: '300px' }}>
          <h2 className="text-white text-lg mb-3">Hand View</h2>
          <div style={{ width: '250px', height: '350px' }}>
            <SimpleHolographicCard 
              card={sampleCards[selectedCardType].card} 
              enableHolographic={true}
              forceHolographic={selectedCardType === 'legendary' || selectedCardType === 'epic'}
              effectIntensity={1.0}
              showDebugOverlay={false}
            />
          </div>
        </div>
      </div>
      
      <div className="mt-8 flex justify-center">
        <button 
          className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          onClick={() => navigate('/')}
        >
          Back to Home
        </button>
      </div>
    </div>
  );
};

export default NewCardFramePreview;
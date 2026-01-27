import React, { useState } from 'react';
import { Card } from '../game/components/Card';
import { CardData } from '../game/types';

/**
 * A minimal test component for debugging card rendering issues
 * This component strips away all game logic and just focuses on the visual representation
 * to help isolate and fix styling problems like the box-like line between text and gem glow
 */
const MinimalCardTest: React.FC = () => {
  // State to toggle debug visualization
  const [showDebug, setShowDebug] = useState(false);
  // State to change rarity for testing
  const [selectedRarity, setSelectedRarity] = useState<'common' | 'rare' | 'epic' | 'legendary'>('legendary');
  // State to toggle between short and long description
  const [useLongDescription, setUseLongDescription] = useState(true);
  // State to toggle card type
  const [cardType, setCardType] = useState<'minion' | 'spell' | 'weapon'>('minion');

  // Sample short description
  const shortDescription = "Battlecry: Deal 3 damage.";
  
  // Sample long description that would potentially cause overflow issues
  const longDescription = "Battlecry: For each card in your hand, deal 1 damage to a random enemy minion. If you have 10 cards, summon a 5/5 Dragon with Taunt and Divine Shield.";

  // Create a test card with current settings
  const testCard: CardData = {
    id: 999999, // Changed to number from string
    name: 'Debug Test Card',
    manaCost: 5,
    type: cardType,
    attack: cardType !== 'spell' ? 5 : undefined,
    health: cardType === 'minion' ? 5 : undefined,
    durability: cardType === 'weapon' ? 2 : undefined,
    rarity: selectedRarity,
    class: 'Neutral',
    race: cardType === 'minion' ? 'Dragon' : undefined,
    description: useLongDescription ? longDescription : shortDescription,
    keywords: ['battlecry'],
    img: 'https://example.com/card-art.jpg', // Placeholder, won't actually load
    collectible: true
  };

  return (
    <div className="p-10 min-h-screen bg-gray-900 flex flex-col items-center">
      <h1 className="text-3xl text-white mb-6">Card Rendering Debug Tool</h1>
      
      {/* Control panel */}
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg mb-10 text-white w-full max-w-2xl">
        <h2 className="text-xl mb-4 border-b border-gray-700 pb-2">Display Settings</h2>
        
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold mb-2">Card Properties</h3>
            
            <div className="mb-4">
              <label className="block text-sm mb-1">Rarity:</label>
              <select 
                className="w-full bg-gray-700 px-3 py-2 rounded text-white"
                value={selectedRarity}
                onChange={(e) => setSelectedRarity(e.target.value as any)}
              >
                <option value="common">Common</option>
                <option value="rare">Rare</option>
                <option value="epic">Epic</option>
                <option value="legendary">Legendary</option>
              </select>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm mb-1">Card Type:</label>
              <select 
                className="w-full bg-gray-700 px-3 py-2 rounded text-white"
                value={cardType}
                onChange={(e) => setCardType(e.target.value as any)}
              >
                <option value="minion">Minion</option>
                <option value="spell">Spell</option>
                <option value="weapon">Weapon</option>
              </select>
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">Debug Options</h3>
            
            <div className="mb-4 flex items-center">
              <input 
                type="checkbox" 
                id="debug-mode" 
                className="mr-2"
                checked={showDebug}
                onChange={() => setShowDebug(!showDebug)}
              />
              <label htmlFor="debug-mode">Show Debug Outlines</label>
            </div>
            
            <div className="mb-4 flex items-center">
              <input 
                type="checkbox" 
                id="long-desc" 
                className="mr-2"
                checked={useLongDescription}
                onChange={() => setUseLongDescription(!useLongDescription)}
              />
              <label htmlFor="long-desc">Use Long Description</label>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-700">
          <h3 className="font-semibold mb-2">Current Description:</h3>
          <div className="bg-gray-700 p-3 rounded text-sm">
            {useLongDescription ? longDescription : shortDescription}
          </div>
        </div>
      </div>
      
      {/* Card display area */}
      <div className="relative">
        {/* Add a grid background to help visualize any overflow or cutoff issues */}
        {showDebug && (
          <div 
            className="absolute inset-0 -m-6 z-0" 
            style={{
              backgroundImage: 'linear-gradient(to right, rgba(255,0,0,0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,0,0,0.1) 1px, transparent 1px)',
              backgroundSize: '10px 10px',
              transform: 'scale(1.2)'
            }}
          />
        )}
        
        {/* The card being tested */}
        <div className="z-10 relative transform scale-150">
          <Card 
            card={testCard} 
            showDebugInfo={showDebug}
          />
        </div>
      </div>
      
      {/* Debug information display */}
      {showDebug && (
        <div className="mt-16 bg-gray-800 p-6 rounded-lg shadow-lg text-white w-full max-w-2xl">
          <h2 className="text-xl mb-4 border-b border-gray-700 pb-2">Debug Information</h2>
          
          <div className="space-y-3 text-sm">
            <p><span className="font-bold text-red-400">Red outlines:</span> Container boundaries</p>
            <p><span className="font-bold text-green-400">Green outlines:</span> Text content boundaries</p>
            <p><span className="font-bold text-blue-400">Blue outlines:</span> Gem and energy system boundaries</p>
            
            <div className="mt-4 pt-4 border-t border-gray-700">
              <h3 className="font-semibold mb-2">Possible Issues:</h3>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  Overflow clipping in container elements
                  <ul className="list-disc pl-5 mt-1 text-gray-400">
                    <li>Check for <code>overflow: hidden</code> in .norse-frame-border</li>
                    <li>Check for <code>overflow: hidden</code> in .arc-reactor-energy-system</li>
                    <li>Check for <code>overflow: hidden</code> in .mana-crystal</li>
                  </ul>
                </li>
                <li>
                  Invisible borders or outlines creating lines
                  <ul className="list-disc pl-5 mt-1 text-gray-400">
                    <li>Inspect elements with browser tools to find unexpected borders</li>
                    <li>Check for box-shadow values that might create line effects</li>
                  </ul>
                </li>
                <li>
                  Z-index conflicts
                  <ul className="list-disc pl-5 mt-1 text-gray-400">
                    <li>Verify z-index values across card description and gem elements</li>
                    <li>Ensure elements stack correctly without creating artificial boundaries</li>
                  </ul>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MinimalCardTest;
import React, { useState, useEffect } from 'react';
import { HolographicCardEffect } from '../game/components/HolographicCardEffect';
import { LegendaryCardEffect } from '../game/components/LegendaryCardEffect';

interface CardFrameProps {
  name: string;
  type?: string;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
  description?: string;
  attack?: number;
  health?: number;
  cost?: number;
  cardClass?: string;
  art?: string;
  id?: string;
  collectible?: boolean;
  isActive?: boolean;
}

export const CardFrame: React.FC<CardFrameProps> = ({
  name,
  type = 'Minion',
  rarity = 'common',
  description = '',
  attack = 0,
  health = 0,
  cost = 0,
  cardClass = 'Neutral',
  art = '/assets/images/cards/1001.png',
  id = '1001',
  collectible = true,
  isActive = false,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [animationEnabled, setAnimationEnabled] = useState(true);

  useEffect(() => {
    const savedPref = localStorage.getItem('cardAnimationEnabled');
    if (savedPref !== null) {
      setAnimationEnabled(savedPref === 'true');
    }
  }, []);

  const handleToggleAnimation = () => {
    const newValue = !animationEnabled;
    setAnimationEnabled(newValue);
    localStorage.setItem('cardAnimationEnabled', String(newValue));
  };

  const getCardFrameClass = () => {
    switch (rarity) {
      case 'legendary':
        return 'card-frame-legendary';
      case 'epic':
        return 'card-frame-epic';
      case 'rare':
        return 'card-frame-rare';
      default:
        return 'card-frame-common';
    }
  };

  const getCardClassColor = () => {
    switch (cardClass.toLowerCase()) {
      case 'warrior':
        return 'text-red-600';
      case 'mage':
        return 'text-blue-500';
      case 'priest':
        return 'text-white';
      case 'rogue':
        return 'text-yellow-500';
      case 'paladin':
        return 'text-yellow-400';
      case 'hunter':
        return 'text-green-600';
      case 'shaman':
        return 'text-blue-400';
      case 'warlock':
        return 'text-purple-600';
      case 'druid':
        return 'text-orange-700';
      case 'necromancer':
        return 'text-emerald-400';
      default:
        return 'text-gray-200';
    }
  };

  const getAttackColor = () => {
    if (attack > 5) return 'bg-orange-500 text-white';
    return 'bg-yellow-500 text-white';
  };

  const getHealthColor = () => {
    if (health <= 2) return 'bg-red-700 text-white';
    return 'bg-red-600 text-white';
  };

  return (
    <div 
      className={`relative card-container ${isActive ? 'active-card' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`relative card ${getCardFrameClass()} transform transition-transform duration-300 ${isHovered && animationEnabled ? 'scale-110' : ''}`}>
        {/* Holographic effect for epic and legendary cards */}
        {rarity === 'epic' && animationEnabled && (
          <HolographicCardEffect intensity={0.75} color="purple" />
        )}
        {rarity === 'legendary' && animationEnabled && (
          <LegendaryCardEffect intensity={0.6} />
        )}
        
        {/* Card cost */}
        <div className="absolute top-1 left-1 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold z-10 border-2 border-yellow-300 shadow-lg">
          {cost}
        </div>
        
        {/* Card art */}
        <div className="card-art-container overflow-hidden rounded-lg">
          <img src={art} alt={name} className="card-art object-cover w-full h-full" />
        </div>
        
        {/* Card name */}
        <div className="card-name-container bg-gradient-to-r from-gray-800 to-gray-700 p-1 text-center">
          <h3 className={`card-name text-base font-bold truncate ${getCardClassColor()}`}>{name}</h3>
        </div>
        
        {/* Card description */}
        <div className="card-description-container bg-gradient-to-b from-gray-700 to-gray-800 p-2">
          <div className="card-type text-xs text-gray-400 text-center mb-1">{type} • {cardClass}</div>
          <p className="card-description text-center text-xs text-white">{description}</p>
        </div>
        
        {/* Attack and health */}
        {type === 'Minion' && (
          <>
            <div className={`absolute bottom-2 left-2 w-8 h-8 ${getAttackColor()} rounded-full flex items-center justify-center text-xl font-bold z-10 border-2 border-gray-800 shadow-lg`}>
              {attack}
            </div>
            <div className={`absolute bottom-2 right-2 w-8 h-8 ${getHealthColor()} rounded-full flex items-center justify-center text-xl font-bold z-10 border-2 border-gray-800 shadow-lg`}>
              {health}
            </div>
          </>
        )}
        
        {/* Rarity gem */}
        <div className={`absolute top-0 right-0 w-6 h-6 rounded-full z-10 ${
          rarity === 'legendary' ? 'bg-orange-400' : 
          rarity === 'epic' ? 'bg-purple-500' : 
          rarity === 'rare' ? 'bg-blue-400' : 
          'bg-gray-400'
        }`}></div>
      </div>
      
      {/* Toggle animation button */}
      <button 
        onClick={handleToggleAnimation}
        className="absolute bottom-[-25px] left-1/2 transform -translate-x-1/2 text-xs bg-gray-800 text-white px-2 py-1 rounded hover:bg-gray-700"
      >
        {animationEnabled ? 'Disable Effects' : 'Enable Effects'}
      </button>
    </div>
  );
};

export default CardFrame;

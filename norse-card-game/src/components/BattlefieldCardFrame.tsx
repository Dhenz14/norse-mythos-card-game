import React from 'react';
import { HolographicCardEffect } from '../game/components/HolographicCardEffect';
import { LegendaryCardEffect } from '../game/components/LegendaryCardEffect';

interface BattlefieldCardFrameProps {
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
  onClick?: () => void;
}

export const BattlefieldCardFrame: React.FC<BattlefieldCardFrameProps> = ({
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
  onClick,
}) => {
  const getCardFrameClass = () => {
    switch (rarity) {
      case 'legendary':
        return 'bf-card-frame-legendary';
      case 'epic':
        return 'bf-card-frame-epic';
      case 'rare':
        return 'bf-card-frame-rare';
      default:
        return 'bf-card-frame-common';
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
      className={`relative battlefield-card-container ${isActive ? 'battlefield-active-card' : ''}`}
      onClick={onClick}
    >
      <div className={`relative battlefield-card ${getCardFrameClass()}`}>
        {/* Holographic effect for epic and legendary cards */}
        {rarity === 'epic' && (
          <HolographicCardEffect intensity={0.75} color="purple" />
        )}
        {rarity === 'legendary' && (
          <LegendaryCardEffect intensity={0.6} />
        )}
        
        {/* Card cost */}
        <div className="absolute top-1 left-1 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold z-10 border border-yellow-300 shadow-sm">
          {cost}
        </div>
        
        {/* Card art */}
        <div className="battlefield-card-art-container overflow-hidden rounded">
          <img src={art} alt={name} className="battlefield-card-art object-cover w-full h-full" />
        </div>
        
        {/* Attack and health */}
        {type === 'Minion' && (
          <>
            <div className={`absolute bottom-1 left-1 w-7 h-7 ${getAttackColor()} hex-badge flex items-center justify-center text-sm font-bold z-10 border border-black`}>
              {attack}
            </div>
            <div className={`absolute bottom-1 right-1 w-7 h-7 ${getHealthColor()} hex-badge flex items-center justify-center text-sm font-bold z-10 border border-black`}>
              {health}
            </div>
          </>
        )}
        
        {/* Rarity indicator (small dot) */}
        <div className={`absolute top-0 right-0 w-3 h-3 rounded-full z-10 ${
          rarity === 'legendary' ? 'bg-orange-400' : 
          rarity === 'epic' ? 'bg-purple-500' : 
          rarity === 'rare' ? 'bg-blue-400' : 
          'bg-gray-400'
        }`}></div>
      </div>
    </div>
  );
};

export default BattlefieldCardFrame;

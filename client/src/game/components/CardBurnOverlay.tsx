import React, { useEffect, useState } from 'react';
import { useAnimationStore } from '../animations/AnimationManager';
import './CardBurnOverlay.css';

interface CardBurnAnimation {
  id: string;
  cardName: string;
  playerId: 'player' | 'opponent';
  startTime: number;
}

export const CardBurnOverlay: React.FC = () => {
  const { animations, removeAnimation } = useAnimationStore();
  const [burnAnimations, setBurnAnimations] = useState<CardBurnAnimation[]>([]);

  useEffect(() => {
    const cardBurnAnims = animations
      .filter(a => a.type === 'card_burn')
      .map(a => ({
        id: a.id,
        cardName: a.cardName || 'Card',
        playerId: a.playerId || 'player',
        startTime: a.startTime
      }));
    setBurnAnimations(cardBurnAnims);
  }, [animations]);

  if (burnAnimations.length === 0) return null;

  return (
    <div className="card-burn-overlay">
      {burnAnimations.map(anim => (
        <div 
          key={anim.id} 
          className={`card-burn-container ${anim.playerId}`}
          onAnimationEnd={() => removeAnimation(anim.id)}
        >
          <div className="card-burn-card">
            <div className="card-burn-flames">
              <div className="flame flame-1"></div>
              <div className="flame flame-2"></div>
              <div className="flame flame-3"></div>
            </div>
            <div className="card-burn-name">{anim.cardName}</div>
          </div>
          <div className="card-burn-message">
            Card destroyed - hand full!
          </div>
        </div>
      ))}
    </div>
  );
};

export default CardBurnOverlay;

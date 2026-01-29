/**
 * SimpleAttackSystem.tsx
 * 
 * A simplified version of the attack system to fix import issues
 * This is a temporary component that provides basic attack visualization
 */

import React, { useState, useEffect } from 'react';
import { Position } from '../types/Position';
import { useAttackStore } from './attackStore';
import AttackIndicator from './AttackIndicator';
import './AttackStyles.css';

interface SimpleAttackSystemProps {
  isPlayerTurn: boolean;
  cardPositions: Record<string, Position>;
  getBoardCenter: () => Position;
  onAttackComplete?: () => void;
}

const SimpleAttackSystem: React.FC<SimpleAttackSystemProps> = ({
  isPlayerTurn,
  cardPositions,
  getBoardCenter,
  onAttackComplete
}) => {
  const { attackingCard, attackTarget, isAttackMode } = useAttackStore();
  
  // When an attack is completed, notify parent component
  useEffect(() => {
    if (attackTarget && isAttackMode && onAttackComplete) {
      onAttackComplete();
    }
  }, [attackTarget, isAttackMode, onAttackComplete]);
  
  // This simplified version only includes the attack indicator
  return (
    <div className="simple-attack-system">
      {/* Include the attack indicator to show the attack line */}
      <AttackIndicator 
        cardPositions={cardPositions}
        getBoardCenter={getBoardCenter}
      />
    </div>
  );
};

export default SimpleAttackSystem;
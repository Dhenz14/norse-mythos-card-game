/**
 * PetGodCard - Pet/God display card for combat arena
 * 
 * Shows the pet/god's stats including HP, stamina, attack power,
 * and health bar with committed HP visualization.
 * 
 * @module combat/components/PetGodCard
 */

import React from 'react';

/**
 * Props for the PetGodCard component
 */
export interface PetGodCardProps {
  /** The pet/god data object containing name, stats, and rarity */
  pet: any;
  /** Amount of HP committed to the current bet */
  hpCommitted?: number;
  /** Whether this is the player's pet (vs opponent) */
  isPlayer?: boolean;
  /** Click handler for the card */
  onClick?: () => void;
  /** Whether the card is currently targetable */
  isTargetable?: boolean;
}

/**
 * PetGodCard displays a pet or god's stats in a card format
 * Used in the Ragnarok combat arena to show hero information
 */
export const PetGodCard: React.FC<PetGodCardProps> = ({ 
  pet, 
  hpCommitted = 0, 
  isPlayer = false, 
  onClick, 
  isTargetable = false 
}) => {
  const availableHP = Math.max(0, pet.stats.currentHealth);
  const healthPercent = Math.max(0, (availableHP / pet.stats.maxHealth) * 100);
  const committedPercent = Math.min(100, Math.max(0, (hpCommitted / pet.stats.maxHealth) * 100));
  const rarityBorder = {
    common: '#6b7280',
    rare: '#3b82f6', 
    epic: '#a855f7',
    legendary: '#f59e0b'
  }[pet.rarity as string] || '#f59e0b';

  return (
    <div 
      className={`pet-god-card ${isTargetable ? 'targetable' : ''}`} 
      style={{ borderColor: rarityBorder }}
      onClick={onClick}
    >
      <div className="pet-god-header">
        <span className="pet-god-badge">RAGNAROK</span>
        <div className="pet-god-stamina">
          <span className="stamina-label">Stamina</span>
          <span className="stamina-value">{pet.stats.currentStamina}/{pet.stats.maxStamina}</span>
        </div>
      </div>
      
      <div className="pet-god-avatar">
        <span className="avatar-letter">{pet.name.charAt(0)}</span>
        <span className="pet-god-name">{pet.name}</span>
      </div>
      
      <div className="pet-god-footer">
        <div className="pet-god-stat attack-power">
          <span className="stat-label">⚔ Attack</span>
          <span className="stat-value">{pet.stats.attack || 0}</span>
        </div>
        <div className="pet-god-stat hp-available">
          <span className="stat-label">HP</span>
          <span className="stat-value">{availableHP}</span>
        </div>
      </div>
      
      <div className="pet-god-health">
        <div className="health-bar">
          <div className="health-committed" style={{ transform: `scaleX(${committedPercent / 100})` }} />
          <div className="health-fill" style={{ transform: `scaleX(${healthPercent / 100})` }} />
        </div>
        <span className="health-text">{pet.stats.currentHealth} HP ({hpCommitted > 0 ? `${hpCommitted} bet` : 'none bet'})</span>
      </div>
    </div>
  );
};

export default PetGodCard;

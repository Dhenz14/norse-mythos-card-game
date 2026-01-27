import React from 'react';
import './RaceIcon.css';

export interface RaceIconProps {
  race: string;
  rarity?: string;
  scale?: number;
}

/**
 * RaceIcon component that displays a 3D icon for different minion types (races)
 * 
 * Used to replace the text race indicator with a visual element
 */
export const RaceIcon: React.FC<RaceIconProps> = ({ 
  race, 
  rarity = 'common',
  scale = 1
}) => {
  // Map race to appropriate symbol
  let symbol = "";
  
  switch (race.toLowerCase()) {
    case 'beast':
      symbol = "🐾"; // Paw prints for Beast
      break;
    case 'demon':
      symbol = "👹"; // Demon face for Demon
      break;
    case 'dragon':
      symbol = "🐉"; // Dragon for Dragon
      break;
    case 'elemental':
      symbol = "🔥"; // Fire for Elemental
      break;
    case 'mech':
    case 'mechanical':
      symbol = "⚙️"; // Gear for Mech
      break;
    case 'murloc':
      symbol = "🐟"; // Fish for Murloc
      break;
    case 'pirate':
      symbol = "☠️"; // Skull and crossbones for Pirate
      break;
    case 'totem':
      symbol = "🗿"; // Moai for Totem
      break;
    case 'undead':
      symbol = "💀"; // Skull for Undead
      break;
    case 'all':
      symbol = "✳️"; // Sparkle for All (like Amalgam)
      break;
    default:
      // For any other race, use first letter capitalized
      symbol = race.charAt(0).toUpperCase();
      break;
  }

  // Adapt scale to the component
  const containerScale = scale || 1;
  
  return (
    <div 
      className={`race-icon-container race-icon-${rarity.toLowerCase()}`}
      style={{
        transform: `scale(${containerScale})`,
        // We don't need to adjust position since we're using % in CSS
      }}
    >
      <span className="race-icon-symbol">{symbol}</span>
    </div>
  );
};

export default RaceIcon;
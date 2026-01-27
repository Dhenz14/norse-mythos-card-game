import React from 'react';
import { getGraveyard, GraveyardMinion } from '../data/cardManagement/graveyardTracker';
import { Card } from './Card';
import './GraveyardSelector.css';

interface GraveyardSelectorProps {
  onSelect: (minion: GraveyardMinion) => void;
  filter?: (minion: GraveyardMinion) => boolean;
  title?: string;
  showCancel?: boolean;
  onCancel?: () => void;
}

/**
 * GraveyardSelector Component
 * 
 * A component that displays minions from the graveyard and allows the player to select one.
 * Used for Necromancer mechanics like resurrection or graveyard-based abilities.
 */
const GraveyardSelector: React.FC<GraveyardSelectorProps> = ({
  onSelect,
  filter,
  title = 'Select a Minion from the Graveyard',
  showCancel = true,
  onCancel
}) => {
  // Get minions from the graveyard
  const graveyard = getGraveyard();
  
  // Apply filter if provided
  const filteredGraveyard = filter ? graveyard.filter(filter) : graveyard;
  
  return (
    <div className="graveyard-selector-overlay">
      <div className="graveyard-selector-container">
        <div className="graveyard-selector-header">
          <h2>{title}</h2>
        </div>
        
        {filteredGraveyard.length > 0 ? (
          <div className="graveyard-cards-container">
            {filteredGraveyard.map((minion) => (
              <div 
                key={`${minion.id}-${minion.name}`}
                className="graveyard-card-container"
                onClick={() => onSelect(minion)}
              >
                <Card 
                  card={{
                    id: minion.id,
                    name: minion.name,
                    attack: minion.attack,
                    health: minion.health,
                    manaCost: minion.manaCost,
                    type: minion.type,
                    keywords: minion.keywords,
                    class: minion.class,
                    rarity: minion.rarity,
                    description: minion.description || (minion.race ? `${minion.race}` : ""),
                    flavorText: minion.flavorText
                  }}
                  className="graveyard-card"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-graveyard-message">
            <p>No minions found in the graveyard.</p>
          </div>
        )}
        
        {showCancel && (
          <div className="graveyard-footer">
            <button 
              className="graveyard-cancel-button"
              onClick={onCancel}
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GraveyardSelector;
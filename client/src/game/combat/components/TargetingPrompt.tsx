import React from 'react';
import '../styles/targeting-prompts.css';

export interface TargetingPromptProps {
  card: { 
    card: { 
      name: string; 
      type: string; 
      battlecry?: { targetType?: string }; 
      spellEffect?: { targetType?: string }; 
    } 
  } | null;
}

export const TargetingPrompt: React.FC<TargetingPromptProps> = ({ card }) => {
  if (!card) return null;

  const getTargetingMessage = () => {
    const targetType = (card.card as any).battlecry?.targetType || (card.card as any).spellEffect?.targetType;
    if (targetType === 'friendly_minion' || targetType === 'friendly_mech') {
      return `Click on a friendly minion to cast ${card.card.name}`;
    } else if (targetType === 'friendly_hero') {
      return `Click on your hero to cast ${card.card.name}`;
    } else if (targetType === 'any_minion' || targetType === 'any') {
      return `Click on any minion to cast ${card.card.name}`;
    }
    return `Click on an enemy minion or hero to cast ${card.card.name}`;
  };

  return (
    <div className="targeting-prompt">
      <div className="targeting-prompt-title">
        {card.card.type === 'spell' ? '✨ Select a Target ✨' : '⚔️ Select a Target ⚔️'}
      </div>
      <div className="targeting-prompt-message">
        {getTargetingMessage()}
      </div>
      <div className="targeting-prompt-hint">
        (Right-click or press ESC to cancel)
      </div>
    </div>
  );
};

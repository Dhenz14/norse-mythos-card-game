import React from 'react';
import { CardInstance, MulliganState } from '../types';
import { MulliganCard } from './MulliganCard';
import { useGameStore } from '../stores/gameStore';

interface MulliganScreenProps {
  mulligan: MulliganState;
  playerHand: CardInstance[];
  onMulliganAction: (newState: any) => void;
}

export const MulliganScreen: React.FC<MulliganScreenProps> = ({ 
  mulligan, 
  playerHand, 
  onMulliganAction
}) => {
  const toggleMulliganCard = useGameStore(state => state.toggleMulliganCard);
  const confirmMulliganChoice = useGameStore(state => state.confirmMulligan);
  const skipMulliganChoice = useGameStore(state => state.skipMulligan);
  
  if (!mulligan || !mulligan.active) return null;

  const handleCardClick = (card: CardInstance) => {
    toggleMulliganCard(card.instanceId);
  };

  const handleConfirmClick = () => {
    confirmMulliganChoice();
  };

  const handleSkipClick = () => {
    skipMulliganChoice();
  };

  const selectedCount = Object.values(mulligan.playerSelections).filter(Boolean).length;
  
  // Filter out any invalid cards (cards without proper card data)
  const validPlayerHand = playerHand.filter(card => card && card.card);

  return (
    <div className="fixed inset-0 bg-black/95 flex flex-col items-center justify-center z-[9999]">
      <div className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-2xl p-8 shadow-2xl max-w-5xl w-full mx-4 border border-gray-700">
        <h2 className="text-3xl font-bold text-white mb-2 text-center">Mulligan Phase</h2>
        <p className="text-gray-300 mb-8 text-center">
          Select cards to replace. Cards you don't select will be kept in your starting hand.
        </p>
        
        <div className="flex justify-center items-center gap-6 mb-8 py-4 overflow-visible">
          {validPlayerHand.map(card => (
            <MulliganCard
              key={card.instanceId}
              card={card}
              isSelected={!!mulligan.playerSelections[card.instanceId]}
              onClick={() => handleCardClick(card)}
            />
          ))}
        </div>
        
        <div className="flex justify-center gap-6">
          <button
            className="px-8 py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white rounded-lg font-bold text-lg transition-all hover:scale-105 shadow-lg border border-red-400/30"
            onClick={handleSkipClick}
          >
            Keep All Cards
          </button>
          <button
            className="px-8 py-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white rounded-lg font-bold text-lg transition-all hover:scale-105 shadow-lg border border-green-400/30"
            onClick={handleConfirmClick}
          >
            Replace {selectedCount} {selectedCount === 1 ? 'Card' : 'Cards'}
          </button>
        </div>
        
        <p className="text-gray-400 mt-6 text-center text-sm">
          {mulligan.playerReady ? 'Waiting for opponent...' : 'Select cards to replace and click confirm.'}
        </p>
      </div>
    </div>
  );
};
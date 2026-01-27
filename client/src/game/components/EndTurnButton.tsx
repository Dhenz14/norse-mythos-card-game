import React from 'react';
import { cn } from '../../lib/utils';

interface EndTurnButtonProps {
  onEndTurn: () => void;
  isPlayerTurn: boolean;
}

const EndTurnButton: React.FC<EndTurnButtonProps> = ({ onEndTurn, isPlayerTurn }) => {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('End turn button clicked manually', { isPlayerTurn });
    
    if (isPlayerTurn) {
      console.log('Executing end turn callback');
      onEndTurn();
    } else {
      console.log('Not player turn, cannot end turn');
    }
  };

  return (
    <button
      className={cn(
        "px-6 py-3 rounded-lg text-white font-bold shadow-lg transition-all duration-300",
        isPlayerTurn
          ? "bg-yellow-600 hover:bg-yellow-500 active:bg-yellow-700 cursor-pointer"
          : "bg-gray-600 cursor-not-allowed opacity-50"
      )}
      onClick={handleClick}
      type="button"
      disabled={!isPlayerTurn}
    >
      <div className="flex flex-col items-center">
        <span className="text-xs">End</span>
        <span>Turn</span>
      </div>
    </button>
  );
};

export default EndTurnButton;

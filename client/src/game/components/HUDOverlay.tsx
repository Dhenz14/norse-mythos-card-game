import React from 'react';
import { createPortal } from 'react-dom';
import './HUDOverlay.css';

interface HUDOverlayProps {
  children: React.ReactNode;
}

export const HUDOverlay: React.FC<HUDOverlayProps> = ({ children }) => {
  return createPortal(
    <div className="hud-overlay">
      {children}
    </div>,
    document.body
  );
};

interface EndTurnButtonProps {
  onClick: () => void;
  disabled?: boolean;
  isActive?: boolean;
}

export const EndTurnButton: React.FC<EndTurnButtonProps> = ({ 
  onClick, 
  disabled = false,
  isActive = true 
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    console.log('[EndTurnButton] Clicked!');
    if (!disabled) {
      onClick();
    }
  };

  return (
    <button 
      className={`hud-end-turn-button ${isActive ? 'active' : 'inactive'}`}
      onClick={handleClick}
      disabled={disabled}
    >
      <span className="end-turn-text">END TURN</span>
    </button>
  );
};

export default HUDOverlay;

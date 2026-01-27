/**
 * HoverableCardContainer Component
 * 
 * A clean, fresh implementation for card hover and grab mechanics
 * that precisely handles hover states without bleeding into adjacent areas.
 * This container preserves all 3D holographic effects while providing
 * reliable hover detection only on actual card areas.
 */
import React, { useState, useRef, useEffect } from 'react';
import { playSound } from '../utils/soundUtils';

interface HoverableCardContainerProps {
  children: React.ReactNode;
  isPlayable?: boolean;
  isInHand?: boolean;
  disableHover?: boolean;
  onHoverStateChange?: (isHovering: boolean) => void;
  className?: string;
  style?: React.CSSProperties;
}

const HoverableCardContainer: React.FC<HoverableCardContainerProps> = ({
  children,
  isPlayable = false,
  isInHand = false,
  disableHover = false,
  onHoverStateChange,
  className = '',
  style = {}
}) => {
  // Core hover state
  const [isHovering, setIsHovering] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Sound played flag to prevent multiple sounds on hover jitter
  const soundPlayedRef = useRef<boolean>(false);
  
  // Debounce timer for hover state to prevent flicker
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Handle hover events with debounce and precise position tracking
  const handleMouseEnter = (e: React.MouseEvent) => {
    if (disableHover) return;
    
    // Clear any existing timers
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    
    // ENHANCED FIX: Add precise coordinate tracking
    // Get exact cursor position relative to the card
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Only register hover if cursor is fully within card boundaries
    // This prevents hover effects triggering from spaces between cards
    const margin = 5; // Small buffer in pixels
    const isWithinBounds = (
      x >= margin && 
      x <= rect.width - margin && 
      y >= margin && 
      y <= rect.height - margin
    );
    
    // Set a small delay to prevent flickering on boundary edges
    hoverTimerRef.current = setTimeout(() => {
      setIsHovering(true);
      
      // Notify parent component if callback is provided
      if (onHoverStateChange) {
        // ENHANCED FIX: Only truly set hovering if within bounds for battlefield cards
        if (isInHand || isWithinBounds) {
          onHoverStateChange(true);
          
          // Play sound only once per hover cycle if within bounds
          if (isWithinBounds && !soundPlayedRef.current && isPlayable) {
            playSound('card_hover');
            soundPlayedRef.current = true;
          }
        }
      }
    }, 10); // Small delay to prevent flicker
  };
  
  const handleMouseLeave = (e: React.MouseEvent) => {
    if (disableHover) return;
    
    // Clear any existing timers
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    
    // Set a small delay to prevent flickering on boundary edges
    hoverTimerRef.current = setTimeout(() => {
      setIsHovering(false);
      
      // Notify parent component
      if (onHoverStateChange) {
        onHoverStateChange(false);
      }
      
      // Reset sound played flag
      soundPlayedRef.current = false;
    }, 10); // Small delay to prevent flicker
  };
  
  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
      }
    };
  }, []);
  
  // Generate style for the container
  const containerStyle: React.CSSProperties = {
    // Base styles
    position: 'relative',
    width: '100%',
    height: '100%',
    // Only this element (not parent) responds to hover
    pointerEvents: 'auto',
    // Cursor style based on playability
    cursor: isPlayable && isHovering ? 'grab' : 'default',
    // Overflow hidden to prevent hover detection outside bounds
    overflow: 'visible',
    // Transition for smooth hover effects
    transition: 'transform 0.2s ease-out',
    // Apply hover transform
    transform: isHovering && isPlayable ? 'scale(1.05) translateY(-10px)' : 'none',
    // Use exact boundaries with clip-path
    clipPath: 'inset(0 0 0 0 round 12px)',
    // Z-index for proper stacking
    zIndex: isHovering ? 1000 : 'auto',
    // Apply custom styles
    ...style
  };
  
  return (
    <div
      ref={containerRef}
      className={`hoverable-card-container ${isHovering ? 'is-hovering' : ''} ${className}`}
      style={containerStyle}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      data-is-hovering={isHovering}
      data-is-playable={isPlayable}
    >
      {/* Pass hover state to children through context */}
      <div className={`hoverable-card-content ${isHovering ? 'is-hovering' : ''}`}>
        {React.Children.map(children, child => {
          if (React.isValidElement(child) && typeof child.type !== 'string') {
            // Clone the child element and add the hover state
            // Only if the child is a component (not a DOM element)
            return React.cloneElement(child, {
              ...child.props,
              isHighlighted: isHovering, // Use standard prop name
            });
          }
          return child;
        })}
      </div>
    </div>
  );
};

export default HoverableCardContainer;
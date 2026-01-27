/**
 * PremiumCard.tsx
 * 
 * This component serves as a bridge between the UltimatePremiumCard3D advanced rendering system
 * and the rest of the application. It handles the setup of the 3D environment and manages
 * the card rendering with all the sophisticated visual effects.
 * 
 * This component incorporates concepts from both TripoSR for advanced 3D rendering and
 * Stable Diffusion for enhanced visual effects and transitions.
 * 
 * This version supports both legacy CardData and new CardInstanceWithCardData formats
 * through the unified type system from cardTypeAdapter.
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import { SimpleCard3D } from './3D/SimpleCard3D';
import { CardData, CardQuality } from '../types';
import { CardInstanceWithCardData } from '../types/interfaceExtensions';

// Import rendering system fix
import { fixCardRenderingIssues, ACTIVE_CARD_RENDERER } from '../utils/cardRenderingSystemFix';

// Import unified type system
import { 
  UnifiedCard, 
  extractCardData, 
  validateCard 
} from '../utils/cardTypeAdapter';

// Import schema validation utilities
import { normalizeCard } from '../utils/cardSchemaValidator';

// Import canvas context manager
import canvasContextManager from '../utils/canvasContextManager';

/**
 * PremiumCard props interface
 */
interface PremiumCardProps extends React.HTMLAttributes<HTMLDivElement> {
  card: UnifiedCard; // Accept either CardData or CardInstanceWithCardData
  quality?: CardQuality;
  scale?: number;
  showStats?: boolean;
  showText?: boolean;
  showFrame?: boolean;
  showEffects?: boolean;
  useAdvancedShaders?: boolean;
  useNoiseEffects?: boolean;
  usePremiumTransitions?: boolean;
  interactive?: boolean;
  onHover?: (isHovered: boolean) => void;
  onClick?: () => void;
  className?: string;
}

/**
 * PremiumCard - A highly advanced 3D card renderer that uses concepts from
 * cutting-edge 3D and diffusion research to create stunning visuals.
 */
const PremiumCard: React.FC<PremiumCardProps> = ({
  card,
  quality = 'normal',
  scale = 1,
  showStats = true,
  showText = true,
  showFrame = true,
  showEffects = true,
  useAdvancedShaders = true,
  useNoiseEffects = true,
  usePremiumTransitions = true,
  interactive = true,
  onHover,
  onClick,
  className = '',
  ...props
}) => {
  // Track hover state
  const [isHovered, setIsHovered] = useState(false);
  const [isSelected, setIsSelected] = useState(false);
  
  // Card container ref for positioning
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Handle mouse interactions
  const handleMouseEnter = () => {
    setIsHovered(true);
    if (onHover) onHover(true);
  };
  
  const handleMouseLeave = () => {
    setIsHovered(false);
    if (onHover) onHover(false);
  };
  
  const handleClick = (e: React.MouseEvent) => {
    if (!interactive) return;
    
    // Toggle selection state
    setIsSelected(prev => !prev);
    
    // Call onClick if provided
    if (onClick) onClick();
  };
  
  // Update card appearance based on quality
  const getCardEffects = () => {
    switch (quality) {
      case 'premium':
        return { 
          boxShadow: isHovered ? 
            '0 0 20px 2px rgba(100, 200, 255, 0.7), 0 0 40px 8px rgba(0, 100, 200, 0.4)' 
            : '0 0 15px rgba(100, 200, 255, 0.3)',
          transform: isHovered ? 'scale(1.05)' : 'scale(1)'
        };
      case 'golden':
        return { 
          boxShadow: isHovered ? 
            '0 0 20px 2px rgba(255, 200, 50, 0.7), 0 0 40px 8px rgba(255, 180, 0, 0.4)' 
            : '0 0 15px rgba(255, 200, 50, 0.3)',
          transform: isHovered ? 'scale(1.05)' : 'scale(1)'
        };
      case 'diamond':
        return { 
          boxShadow: isHovered ? 
            '0 0 20px 2px rgba(255, 100, 200, 0.7), 0 0 40px 8px rgba(200, 50, 255, 0.4)' 
            : '0 0 15px rgba(255, 100, 200, 0.3)',
          transform: isHovered ? 'scale(1.05)' : 'scale(1)'
        };
      default:
        return { 
          boxShadow: isHovered ? '0 0 10px rgba(200, 200, 200, 0.3)' : 'none',
          transform: isHovered ? 'scale(1.02)' : 'scale(1)'  
        };
    }
  };
  
  // Calculate the aspect ratio for the card
  const aspectRatio = 3.5 / 2.5; // Standard card ratio
  
  // Card container styles with enhanced stacking context properties
  const baseContainerStyle: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    height: '100%',
    minHeight: '200px',
    minWidth: '150px', 
    cursor: interactive ? 'pointer' : 'default',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    borderRadius: '4%',
    overflow: 'hidden',
    background: 'rgba(0, 0, 0, 0.1)', // Slight background to ensure visibility
    perspective: '1000px', // Add 3D perspective
    transformStyle: 'preserve-3d', // Maintain 3D transforms in children
    backfaceVisibility: 'hidden', // Prevent seeing backface during transforms
    willChange: 'transform', // Hint to browser for optimization
    isolation: 'isolate', // Create new stacking context
    zIndex: 5, // Ensure proper stacking in hand
  };
  
  // Combine base style with dynamic effects
  const containerStyle: React.CSSProperties = {
    ...baseContainerStyle,
    ...getCardEffects(),
  };
  
  // Canvas container style
  const canvasStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    borderRadius: '4%',
    zIndex: 10, // Higher z-index to ensure canvas is absolutely on top
    pointerEvents: 'auto', // Make sure interaction works
    transformStyle: 'preserve-3d', // Important for 3D effects
    backfaceVisibility: 'visible', // Show everything to prevent invisible box issues
    willChange: 'transform', // Optimize for animation performance
    transform: 'translateZ(0)', // Force GPU acceleration
    overflow: 'visible', // Allow content to be visible outside bounds
    clipPath: 'none', // Disable clipping
    visibility: 'visible', // Force visibility
    opacity: 1, // Force opacity 
  };
  
  // Handle interaction with the 3D card
  const handleCardInteraction = (type: 'hover' | 'click' | 'drag', value: boolean) => {
    if (type === 'hover') {
      setIsHovered(value);
      if (onHover) onHover(value);
    } else if (type === 'click' && value && onClick) {
      onClick();
    }
  };
  
  // Generate a unique canvas ID based on card properties
  const cardId = useMemo(() => {
    // Extract card ID from either direct card data or nested instance
    const extractedData = validateCard(card) ? extractCardData(card) : null;
    return extractedData?.id || Math.random().toString(36).substring(2, 9);
  }, [card]);
  
  // Register the canvas with our context manager and assign a unique ID
  const canvasId = useMemo(() => {
    // Generate a priority based on card quality and zoom state for proper rendering order
    const priority = (quality === 'normal' ? 1 : 
                    quality === 'premium' ? 2 : 
                    quality === 'golden' ? 3 : 4) + 
                   (isHovered ? 5 : 0);
                   
    return canvasContextManager.registerCanvas(
      canvasContextManager.generateCanvasId(cardId),
      priority
    );
  }, [cardId, quality, isHovered]);
  
  // Activate the canvas when it becomes visible
  useEffect(() => {
    canvasContextManager.activateCanvas(canvasId);
  }, [canvasId, isHovered, isSelected]);

  return (
    <div 
      ref={containerRef}
      className={`premium-card ${className}`}
      style={containerStyle}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      {...props}
    >
      <div style={canvasStyle}>
        <Canvas
          id={canvasId}
          camera={{ position: [0, 0, 3], fov: 50 }}
          gl={{ 
            antialias: true, 
            alpha: true,
            preserveDrawingBuffer: true, // Important for hand cards
            powerPreference: 'high-performance', // Optimize rendering
            logarithmicDepthBuffer: true, // Improve z-fighting issues
            // Explicitly prevent context sharing
            context: null as any,
            // Improve rendering persistence
            stencil: true,
            failIfMajorPerformanceCaveat: false
          }}
          onCreated={({ gl }) => {
            // Register the context with our manager when the canvas is created
            // Cast to unknown first, then to WebGLRenderingContext to avoid type errors
            canvasContextManager.setContext(canvasId, gl as unknown as WebGLRenderingContext);
          }}
          shadows
          dpr={[1, 2]} // Responsive performance scaling
          style={{ 
            background: 'transparent',
            isolation: 'isolate',
            zIndex: 10
          }}
          frameloop={isHovered ? "always" : "demand"} // Always render when hovered
          resize={{ scroll: false, debounce: { scroll: 50, resize: 0 } }} // Improve resize handling
        >
          {/* Lighting for 3D scene */}
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={0.6} />
          <pointLight position={[-10, -10, -10]} intensity={0.4} />
          
          {/* Card component - we now use SimpleCard3D as the primary implementation */}
          <SimpleCard3D
            card={validateCard(card) ? extractCardData(card) : {id: 0, name: "Invalid Card", type: "minion"}}
            quality={quality}
            position={[0, 0, 0]}
            rotation={[0, 0, 0]}
            scale={scale}
            isHovered={isHovered}
            isSelected={isSelected}
            showStats={showStats}
            showText={showText}
            showFrame={showFrame}
            showEffects={showEffects}
            onInteraction={handleCardInteraction}
          />
          
          {/* Optional controls for debugging */}
          {/* <OrbitControls enableZoom={false} enablePan={false} /> */}
        </Canvas>
      </div>
      
      {/* Fallback content if WebGL is not available */}
      <noscript>
        <div style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          width: '100%', 
          height: '100%', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          background: 'rgba(0,0,0,0.8)', 
          color: 'white',
          textAlign: 'center',
          padding: '20px'
        }}>
          <p>3D Card rendering requires JavaScript and WebGL support.</p>
        </div>
      </noscript>
      
      {/* Card type label for accessibility and class identification */}
      {/* Extract card data to safely access properties */}
      {(() => {
        // Extract card data in a safe way using our adapter
        let cardData = validateCard(card) ? extractCardData(card) : null;
        
        // Normalize the card to ensure it has all required fields with valid defaults
        if (cardData) {
          try {
            cardData = normalizeCard(cardData);
          } catch (error) {
            // Continue with the original card data if normalization fails
          }
        }
        
        return cardData && cardData.class && (
          <div style={{
            position: 'absolute',
            top: '5px',
            right: '5px',
            background: 'rgba(0,0,0,0.7)',
            padding: '2px 6px',
            fontSize: '10px',
            color: 'white',
            borderRadius: '3px',
          }}>
            {cardData.class}
          </div>
        );
      })()}
    </div>
  );
};

export default PremiumCard;
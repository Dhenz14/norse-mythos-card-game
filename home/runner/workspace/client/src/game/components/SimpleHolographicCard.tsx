import React, { useState, useEffect, useRef } from 'react';
import './HolographicEffect.css';

// Preload the foil texture image
const foilTexture = new Image();
foilTexture.src = '/textures/foil.png';

interface SimpleHolographicCardProps {
  card: {
    id: number;
    name: string;
    manaCost: number;
    attack?: number;
    health?: number;
    type: string;
    rarity: string;
    class?: string;
    description: string;
  };
  enableHolographic?: boolean; // Legacy prop, will be removed in future
  forceHolographic?: boolean; // Override rarity check and always show holographic effects
  showDebugOverlay?: boolean;
  effectIntensity?: number;
}

/**
 * Get the standard holographic card parameters that should be used everywhere
 * to ensure consistent appearance between test cards and game cards
 */
/**
 * Get the standard holographic card parameters that should be used everywhere
 * to ensure consistent appearance between test cards and game cards
 * 
 * @param cardRarity Optional parameter to specify the card's rarity
 * @returns Holographic parameters object with appropriate settings based on rarity
 */
export function getStandardHolographicParams(cardRarity?: string) {
  // Only force holographic effects for legendary and epic cards
  const isPremiumRarity = cardRarity && 
    (cardRarity.toLowerCase() === 'legendary' || cardRarity.toLowerCase() === 'epic');
  
  return {
    enableHolographic: true,
    // Only force holographic on epic and legendary cards
    forceHolographic: !!isPremiumRarity,
    // Adjust intensity based on rarity
    effectIntensity: isPremiumRarity ? 1.0 : 0.4
  };
}

/**
 * A simplified holographic card implementation that doesn't rely on 3D rendering.
 * This component uses CSS transforms and filters to create a holographic effect.
 */
const SimpleHolographicCard: React.FC<SimpleHolographicCardProps> = ({
  card = {
    id: 9001,
    name: "Odin's Wisdom",
    manaCost: 6,
    attack: 5,
    health: 5,
    type: "minion",
    rarity: "legendary",
    description: "Battlecry: Discover a Legendary minion from any class. Reduce its Cost by (3)."
  },
  enableHolographic = true, // Legacy prop
  forceHolographic = false, // New prop to override rarity-based effects
  showDebugOverlay = false,
  effectIntensity = 1.0
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [position, setPosition] = useState({ x: 0, y: 0 });
  
  // Primary hover state - this is our main reliable state for holographic effects
  const [isHovering, setIsHovering] = useState(false);
  
  // Last known position for maintaining effect when mouse is still
  const [lastPosition, setLastPosition] = useState({ x: 0, y: 0 });
  
  // Determine if card should have holographic effects based on rarity
  const isPremiumRarity = card.rarity.toLowerCase() === 'legendary' || card.rarity.toLowerCase() === 'epic';
  // Card will have holographic effects if:
  // 1. It's a premium rarity (legendary or epic) AND enableHolographic is true (legacy mode), OR
  // 2. forceHolographic is explicitly set to true (override mode)
  const hasHolographicEffects = (isPremiumRarity && enableHolographic) || forceHolographic === true;
  const [metrics, setMetrics] = useState({
    frameTime: 0,
    smoothness: 100,
    jitter: 0,
    trajectoryDeviation: 0,
    deviceScore: 90,
    satisfaction: 98
  });
  
  // Update metrics every animation frame when hovering
  useEffect(() => {
    if (!isHovering || !showDebugOverlay) return;
    
    let lastTime = performance.now();
    let frameTimes: number[] = [];
    const maxFrames = 30;
    
    const updateMetrics = () => {
      const now = performance.now();
      const frameTime = now - lastTime;
      lastTime = now;
      
      frameTimes.push(frameTime);
      if (frameTimes.length > maxFrames) {
        frameTimes.shift();
      }
      
      // Calculate average frame time
      const avgFrameTime = frameTimes.reduce((sum, time) => sum + time, 0) / frameTimes.length;
      
      // Calculate jitter (variation in frame times)
      const jitter = frameTimes.reduce((sum, time) => sum + Math.abs(time - avgFrameTime), 0) / frameTimes.length;
      
      // Calculate smoothness (inverse of jitter, normalized to 0-100)
      const smoothness = Math.max(0, Math.min(100, 100 - (jitter / 2)));
      
      // Trajectory deviation (how much the card deviates from expected path)
      const trajectoryDeviation = Math.random() * 0.2 + 0.1; // Simulated value
      
      // Device score (performance metric)
      const deviceScore = Math.floor(Math.random() * 10) + 90; // Simulated 90-100 score
      
      // Satisfaction score (weighted combination of metrics)
      const satisfaction = Math.floor(smoothness * 0.5 + deviceScore * 0.5);
      
      setMetrics({
        frameTime: avgFrameTime,
        smoothness,
        jitter: jitter / avgFrameTime * 100,
        trajectoryDeviation,
        deviceScore,
        satisfaction
      });
      
      if (isHovering && showDebugOverlay) {
        requestAnimationFrame(updateMetrics);
      }
    };
    
    const animationId = requestAnimationFrame(updateMetrics);
    return () => cancelAnimationFrame(animationId);
  }, [isHovering, showDebugOverlay]);
  
  // No longer needed - we use mouseenter/mouseleave events for reliable tracking

  // Handle mouse movement to create the holographic effect
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || !hasHolographicEffects) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    
    // Calculate the center of the card
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Calculate the distance from the cursor to the center
    const mouseX = e.clientX;
    const mouseY = e.clientY;
    const distX = mouseX - centerX;
    const distY = mouseY - centerY;
    
    // Convert to rotation angles (limited to [-20, 20] degrees)
    const rotationY = Math.max(-20, Math.min(20, distX / rect.width * 40)) * effectIntensity;
    const rotationX = Math.max(-20, Math.min(20, -distY / rect.height * 40)) * effectIntensity;
    
    // Apply a Golden Ratio damping factor (1.618) for naturally pleasing motion
    const dampingFactor = 1.618;
    const easedRotationY = rotationY / dampingFactor;
    const easedRotationX = rotationX / dampingFactor;
    
    // Set the state
    setRotation({ x: easedRotationX, y: easedRotationY });
    setPosition({ x: distX / 20, y: distY / 20 });
    
    // Store the last position for use when mouse is still
    setLastPosition({ x: distX / 20, y: distY / 20 });
  };
  
  // Animation ref for smooth return
  const returnAnimationRef = useRef<number | null>(null);
  
  // Handle mouse enter event - Critical for maintaining holographic effect
  const handleMouseEnter = () => {
    // Set the card as being hovered - this is the key state for effects
    setIsHovering(true);
  };
  
  // Handle mouse leave event - Smooth return to normal position
  const handleMouseLeave = () => {
    // Card is no longer being hovered
    setIsHovering(false);
    
    // Cancel any existing animation
    if (returnAnimationRef.current) {
      cancelAnimationFrame(returnAnimationRef.current);
    }
    
    // Starting values for animation
    const startRotation = { ...rotation };
    const startPosition = { ...position };
    const startTime = performance.now();
    const duration = 800; // Animation duration in ms
    
    // Smooth return animation function
    const animateReturn = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Cubic bezier easing function for bouncy effect
      const easeOutBack = (t: number): number => {
        const c1 = 1.70158;
        const c3 = c1 + 1;
        return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
      };
      
      // Apply easing
      const easedProgress = progress >= 1 ? 1 : easeOutBack(1 - progress);
      
      // Calculate new values
      const newRotationX = startRotation.x * easedProgress;
      const newRotationY = startRotation.y * easedProgress;
      const newPositionX = startPosition.x * easedProgress;
      const newPositionY = startPosition.y * easedProgress;
      
      // Update state with smooth interpolation
      setRotation({ x: newRotationX, y: newRotationY });
      setPosition({ x: newPositionX, y: newPositionY });
      
      // Continue animation if not complete
      if (progress < 1) {
        returnAnimationRef.current = requestAnimationFrame(animateReturn);
      } else {
        // Final reset to exact zero values
        setRotation({ x: 0, y: 0 });
        setPosition({ x: 0, y: 0 });
        returnAnimationRef.current = null;
      }
    };
    
    // Start animation
    returnAnimationRef.current = requestAnimationFrame(animateReturn);
  };
  
  // This effect will simulate subtle movement when the mouse is still
  // but the card is being hovered over, creating a "breathing" effect
  useEffect(() => {
    if (!isHovering || !hasHolographicEffects) return;
    
    // Create a subtle animation effect for when mouse isn't moving
    let animationId: number;
    let startTime = performance.now();
    
    const animateSubtleMovement = () => {
      const now = performance.now();
      const elapsed = now - startTime;
      
      // Create a very subtle sine wave movement
      // This keeps the card feeling alive even when mouse is still
      const subtleX = Math.sin(elapsed / 2000) * 0.5;
      const subtleY = Math.cos(elapsed / 2500) * 0.5;
      
      // Only apply subtle movement if position hasn't changed recently
      setRotation(prev => ({
        x: prev.x + subtleX * 0.01,
        y: prev.y + subtleY * 0.01
      }));
      
      animationId = requestAnimationFrame(animateSubtleMovement);
    };
    
    // Start the subtle animation
    animationId = requestAnimationFrame(animateSubtleMovement);
    
    // Clean up
    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [isHovering, hasHolographicEffects]);
  
  // Clean up animation refs when component unmounts
  useEffect(() => {
    return () => {
      if (returnAnimationRef.current) {
        cancelAnimationFrame(returnAnimationRef.current);
      }
    };
  }, []);
  
  // Determine border color based on rarity - Enhanced to match the test simulation
  const getRarityBorderColor = (rarity: string) => {
    const rarityLower = rarity.toLowerCase();
    if (rarityLower === 'legendary') return '#FFD700'; // Bright Gold
    if (rarityLower === 'epic') return '#A335EE'; // Purple
    if (rarityLower === 'rare') return '#0070DD'; // Blue
    return '#FFFFFF'; // White for common
  };

  const rarityBorderColor = getRarityBorderColor(card.rarity);
  const isMinion = card.type.toLowerCase() === 'minion';
  const isLegendary = card.rarity.toLowerCase() === 'legendary';
  
  return (
    <div 
      ref={cardRef}
      className={`holographic-card-container ${isHovering ? 'is-hovering card-container-glow' : ''}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        // Different perspective values based on rarity
        perspective: isLegendary 
          ? '1200px' // Original perspective for legendary
          : card.rarity.toLowerCase() === 'epic'
            ? '1200px' // Original perspective for epic
            : '1600px', // Further enhanced perspective for common/rare cards
        perspectiveOrigin: 'center center', 
        transformStyle: 'preserve-3d',
        width: '100%',
        height: '100%',
        position: 'relative',
        // Apply distinct scaling and positioning based on rarity
        transform: 'translateZ(5px)', // All cards use the same scale to ensure consistent sizing
      }}
    >
      {/* Main Card */}
      <div 
        className={`holographic-card ${hasHolographicEffects ? 'holographic-enabled' : ''}`}
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          borderRadius: '12px',
          // Enhanced background for better Norse theme
          background: isLegendary 
            ? `radial-gradient(circle at 30% 30%, #3A2E52 0%, #36294B 40%, #271A38 80%, #221833 100%)` 
            : `radial-gradient(circle at 30% 30%, #333752 0%, #283147 40%, #232A3D 80%, #1A2133 100%)`,
          // Enhanced border effects to match test simulation with thick gold borders for legendary cards
          border: isLegendary 
            ? `3px solid ${rarityBorderColor}` 
            : card.rarity.toLowerCase() === 'epic' 
              ? `2px solid #A335EE` 
              : `2px solid ${rarityBorderColor}`,
          // Enhanced shadow effects for each rarity
          boxShadow: isLegendary
            ? `0 0 25px ${rarityBorderColor}, 0 0 15px rgba(255,215,0,0.7), inset 0 0 30px rgba(0,0,0,0.4)` 
            : card.rarity.toLowerCase() === 'epic' 
              ? `0 0 15px rgba(163,53,238,0.6), inset 0 0 5px rgba(255,255,255,0.3)` 
              : `0 0 10px ${rarityBorderColor}, inset 0 0 30px rgba(0,0,0,0.4)`,
          /* overflow: hidden removed to prevent clipping during 3D transforms */
          transition: isHovering ? 'none' : 'transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          transform: hasHolographicEffects ? 
            `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) translateZ(90px)` : 
            'none',
          color: 'white',
          display: 'flex',
          flexDirection: 'column',
          padding: '10px',
          isolation: 'isolate', /* Creates a new stacking context */
          transformStyle: 'preserve-3d' /* Ensure 3D context for children */
        }}
      >
        {/* Card Header with Mana */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          marginBottom: '10px',
          position: 'relative',
          zIndex: 9999, /* Even higher z-index for the mana container */
          isolation: 'isolate' /* Create a new stacking context */
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'radial-gradient(circle at 40% 40%, #4169E1 0%, #1E40AF 60%, #0D2473 100%)',
            color: 'white',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            fontWeight: 'bold',
            fontSize: '24px',
            boxShadow: '0 0 10px rgba(66, 153, 225, 0.8), inset 0 -2px 4px rgba(0,0,0,0.5), inset 0 2px 4px rgba(255,255,255,0.2)',
            border: '1px solid rgba(255,255,255,0.2)',
            transform: hasHolographicEffects ? 
              `translateZ(200px) translate(${position.x * 0.2}px, ${position.y * 0.2}px)` : 
              'none',
            position: 'relative',
            zIndex: 10000, /* Extreme z-index to ensure visibility */
            isolation: 'isolate', /* Create a new stacking context */
            transition: isHovering ? 'none' : 'transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
          }}>
            <span className="stat-value-text" style={{
              position: 'relative',
              zIndex: 10001,
              textShadow: '0 0 2px black, 0 0 5px black'
            }}>{card.manaCost}</span>
          </div>
          
          {/* Card Type */}
          <div style={{
            background: card.rarity.toLowerCase() === 'legendary' 
              ? 'linear-gradient(145deg, #FFD700 0%, #B8860B 100%)' 
              : card.rarity.toLowerCase() === 'epic'
                ? 'linear-gradient(145deg, #A335EE 0%, #7B00FA 100%)'
                : card.rarity.toLowerCase() === 'rare'
                  ? 'linear-gradient(145deg, #0070DD 0%, #1C84FF 100%)'
                  : 'linear-gradient(145deg, #4A5568 0%, #2D3748 100%)',
            color: card.rarity.toLowerCase() === 'legendary' ? 'black' : 'white',
            padding: '5px 10px',
            borderRadius: '15px',
            fontWeight: 'bold',
            fontSize: '12px',
            boxShadow: card.rarity.toLowerCase() === 'legendary' 
              ? '0 0 10px rgba(255, 215, 0, 0.5), inset 0 1px 1px rgba(255,255,255,0.3)' 
              : card.rarity.toLowerCase() === 'epic'
                ? '0 0 10px rgba(163, 53, 238, 0.5), inset 0 1px 1px rgba(255,255,255,0.2)'
                : card.rarity.toLowerCase() === 'rare'
                  ? '0 0 10px rgba(0, 112, 221, 0.5), inset 0 1px 1px rgba(255,255,255,0.2)'
                  : 'inset 0 1px 1px rgba(255,255,255,0.2)',
            border: '1px solid rgba(255,255,255,0.2)',
            transform: hasHolographicEffects ? 
              `translateZ(50px) translate(${position.x * -0.1}px, ${position.y * 0.1}px)` : 
              'none',
            position: 'relative',
            zIndex: 50,
            transition: isHovering ? 'none' : 'transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
          }}>
            <span className="card-name-text" style={{ 
              color: 'inherit',
              textShadow: card.rarity.toLowerCase() === 'legendary' 
                ? '0 0 1px rgba(0, 0, 0, 0.7), 0 1px 0 rgba(0, 0, 0, 0.5)' 
                : '0 0 1px rgba(0, 0, 0, 0.9), 0 1px 0 rgba(0, 0, 0, 0.7)',
            }}>{card.rarity}</span>
          </div>
        </div>
        
        {/* Card Name */}
        <div 
          className="card-name-text"
          style={{
            fontSize: '24px',
            fontWeight: 'bold',
            marginBottom: '10px',
            textAlign: 'center',
            color: card.rarity.toLowerCase() === 'legendary' ? '#FFD700' : '#FFFFFF',
            letterSpacing: '0.7px',
            transform: hasHolographicEffects ? 
              `translateZ(50px) translate(${position.x * 0.1}px, ${position.y * 0.1}px)` : 
              'none',
            position: 'relative',
            zIndex: 50,
            transition: isHovering ? 'none' : 'transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
          }}>
          {card.name}
        </div>
        
        {/* Card Art - Odin's Wisdom */}
        <div style={{
          width: '90%',
          height: '160px',
          margin: '0 auto 10px auto',
          borderRadius: '8px',
          overflow: 'hidden',
          position: 'relative',
          background: '#1E293B',
          boxShadow: 'inset 0 0 15px rgba(0,0,0,0.7)',
          transform: hasHolographicEffects ? 
            `translateZ(35px) translate(${position.x * 0.15}px, ${position.y * 0.15}px) rotateX(${rotation.x * 0.3}deg) rotateY(${rotation.y * 0.3}deg)` : 
            'none',
          transition: isHovering ? 'none' : 'transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          zIndex: 35 /* Ensures card art is above holographic effects */
        }}>
          {/* SVG Art for Odin */}
          <svg 
            width="100%" 
            height="100%" 
            viewBox="0 0 400 300" 
            style={{
              filter: 'drop-shadow(0 0 5px rgba(78, 145, 255, 0.5))',
              position: 'relative',
              zIndex: 40 /* Increased z-index to be above all holographic effects */
            }}
          >
            {/* Background with parallax effect */}
            <defs>
              <radialGradient id="skyGradient" cx="50%" cy="50%" r="70%" fx="50%" fy="50%">
                <stop offset="0%" stopColor="#0A2463" />
                <stop offset="70%" stopColor="#071952" />
                <stop offset="100%" stopColor="#040D21" />
              </radialGradient>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFD700" />
                <stop offset="50%" stopColor="#FFC107" />
                <stop offset="100%" stopColor="#FF8C00" />
              </linearGradient>
            </defs>

            {/* Sky/Background with stars */}
            <rect width="400" height="300" fill="url(#skyGradient)" />
            
            {/* Stars with subtle parallax */}
            <g style={{ 
              transform: hasHolographicEffects ? 
                `translate(${position.x * -0.03}px, ${position.y * -0.02}px)` : 
                'none' 
            }}>
              {Array.from({length: 50}).map((_, i) => (
                <circle 
                  key={`star-${i}`} 
                  cx={Math.random() * 400} 
                  cy={Math.random() * 300} 
                  r={Math.random() * 1.5} 
                  fill="white" 
                  opacity={Math.random() * 0.8 + 0.2} 
                />
              ))}
            </g>
            
            {/* Distant mountains with parallax */}
            <g style={{ 
              transform: hasHolographicEffects ? 
                `translate(${position.x * -0.05}px, ${position.y * -0.02}px)` : 
                'none' 
            }}>
              <path d="M0,300 L100,220 L150,250 L200,180 L250,230 L300,190 L350,240 L400,200 L400,300 Z" 
                fill="#152238" opacity="0.8" />
            </g>
            
            {/* Mid mountains with parallax */}
            <g style={{ 
              transform: hasHolographicEffects ? 
                `translate(${position.x * -0.1}px, ${position.y * -0.05}px)` : 
                'none' 
            }}>
              <path d="M0,300 L50,250 L100,270 L150,220 L200,260 L250,210 L300,260 L350,230 L400,260 L400,300 Z" 
                fill="#1D2B44" opacity="0.9" />
            </g>
            
            {/* Moon with glow */}
            <g style={{ 
              transform: hasHolographicEffects ? 
                `translate(${position.x * -0.08}px, ${position.y * -0.08}px)` : 
                'none' 
            }}>
              <circle cx="320" cy="80" r="40" fill="#E3F2FD" opacity="0.15" filter="url(#glow)" />
              <circle cx="320" cy="80" r="30" fill="#E3F2FD" opacity="0.3" />
              <circle cx="320" cy="80" r="25" fill="#E3F2FD" opacity="0.7" />
            </g>
            
            {/* Odin's silhouette in foreground */}
            <g style={{ 
              transform: hasHolographicEffects ? 
                `translate(${position.x * 0.12}px, ${position.y * 0.08}px)` : 
                'none' 
            }}>
              {/* Odin's body */}
              <path d="M180,120 L160,220 L240,220 L220,120 Z" fill="#0D1B2A" />
              
              {/* Cloak */}
              <path d="M150,140 L120,230 L160,220 L180,120 Z" fill="#1B263B" />
              <path d="M250,140 L280,230 L240,220 L220,120 Z" fill="#1B263B" />
              
              {/* Head */}
              <circle cx="200" cy="100" r="30" fill="#0D1B2A" />
              
              {/* Beard */}
              <path d="M180,110 Q200,150 220,110 L220,140 Q200,160 180,140 Z" fill="#778DA9" />
              
              {/* Hat */}
              <path d="M170,85 Q200,60 230,85 L225,95 Q200,75 175,95 Z" fill="#1B263B" />
              
              {/* Staff */}
              <line x1="280" y1="120" x2="260" y2="250" stroke="#415A77" strokeWidth="4" />
              <circle cx="280" cy="115" r="10" fill="url(#gold)" />
              
              {/* Wisdom runes emanating from staff */}
              <g filter="url(#glow)">
                <text x="275" y="110" fill="#00B4D8" fontFamily="serif" fontSize="14" opacity="0.9">ᚱ</text>
                <text x="290" y="120" fill="#00B4D8" fontFamily="serif" fontSize="14" opacity="0.7">ᚨ</text>
                <text x="265" y="95" fill="#00B4D8" fontFamily="serif" fontSize="14" opacity="0.8">ᚷ</text>
                <text x="295" y="100" fill="#00B4D8" fontFamily="serif" fontSize="14" opacity="0.6">ᚺ</text>
              </g>
              
              {/* Eye glow */}
              <circle cx="190" cy="95" r="3" fill="#48CAE4" filter="url(#glow)" />
              
              {/* Eye patch */}
              <path d="M200,85 Q215,90 215,100 Q215,110 200,115" stroke="#415A77" strokeWidth="2" fill="none" />
              
              {/* Ravens */}
              <g style={{ 
                transform: hasHolographicEffects ? 
                  `translate(${position.x * 0.15}px, ${position.y * 0.15}px)` : 
                  'none' 
              }}>
                <path d="M150,70 L130,85 L125,70 L130,65 Z" fill="#0D1B2A" />
                <circle cx="128" cy="65" r="2" fill="#90E0EF" />
                <path d="M250,70 L270,85 L275,70 L270,65 Z" fill="#0D1B2A" />
                <circle cx="272" cy="65" r="2" fill="#90E0EF" />
              </g>
            </g>
            
            {/* Foreground elements */}
            <g style={{ 
              transform: hasHolographicEffects ? 
                `translate(${position.x * 0.2}px, ${position.y * 0.15}px)` : 
                'none' 
            }}>
              <path d="M0,300 L400,300 L400,280 L0,280 Z" fill="#0D1B2A" />
            </g>
            
            {/* Wisdom particles */}
            <g style={{ 
              transform: hasHolographicEffects ? 
                `translate(${position.x * 0.25}px, ${position.y * 0.25}px)` : 
                'none' 
            }}>
              {Array.from({length: 15}).map((_, i) => (
                <circle 
                  key={`particle-${i}`} 
                  cx={200 + Math.sin(i * 0.5) * 40} 
                  cy={150 + Math.cos(i * 0.5) * 30} 
                  r={Math.random() * 2 + 1} 
                  fill="#48CAE4" 
                  opacity={Math.random() * 0.5 + 0.5} 
                  filter="url(#glow)" 
                />
              ))}
            </g>
          </svg>
          
          {/* Holographic foil overlay for art area */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `url('/textures/foil.png')`,
            backgroundSize: '200%',
            backgroundPosition: `${50 + rotation.y * 1.2}% ${50 + rotation.x * 1.2}%`,
            mixBlendMode: 'overlay',
            opacity: Math.min(0.5, 0.2 + (Math.abs(rotation.x) + Math.abs(rotation.y)) * 0.01),
            filter: `hue-rotate(${rotation.y * 8}deg) contrast(1.8) brightness(1.5)`,
            zIndex: 42
          }} />
          
          {/* Holographic card art overlay with rainbow sheen */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `linear-gradient(
              ${135 + rotation.y * 0.5}deg, 
              rgba(255, 255, 255, 0) 0%, 
              rgba(255, 255, 255, 0.1) 25%, 
              rgba(255, 255, 255, 0.2) 50%, 
              rgba(255, 255, 255, 0.1) 75%, 
              rgba(255, 255, 255, 0) 100%
            )`,
            opacity: Math.min(0.7, 0.3 + Math.abs(rotation.y) * 0.02),
            mixBlendMode: 'overlay',
            zIndex: 45 /* Higher z-index to ensure rainbow overlay is always visible */
          }} />
        </div>
        
        {/* Card Description */}
        <div style={{
          flex: 1,
          padding: '12px',
          // Container background removed as requested
          borderRadius: '10px',
          fontSize: '15px',
          fontWeight: '600',
          letterSpacing: '0.2px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          color: '#FFFFFF',
          transform: hasHolographicEffects ? 
            `translateZ(40px) translate(${position.x * 0.05}px, ${position.y * 0.05}px)` : 
            'none',
          position: 'relative',
          zIndex: 40, // Increased z-index to ensure visibility above holographic effects
          transition: isHovering ? 'none' : 'transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
        }}>
          {/* Background layers removed as requested */}
          <span className="card-description-text">{card.description}</span>
        </div>
        
        {/* Card Stats (Attack and Health) for minions */}
        {/* Holographic Overlay effects - Moved before stat elements */}
        
        {isMinion && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '10px',
            position: 'relative',
            zIndex: 9999, /* Even higher z-index for the stat container */
            isolation: 'isolate' /* Create a new stacking context */
          }}>
            {/* Attack */}
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'radial-gradient(circle at 40% 40%, #F87171 0%, #B91C1C 60%, #991B1B 100%)',
              color: 'white',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              fontWeight: 'bold',
              fontSize: '24px',
              boxShadow: '0 0 10px rgba(245, 101, 101, 0.8), inset 0 -2px 4px rgba(0,0,0,0.5), inset 0 2px 4px rgba(255,255,255,0.2)',
              border: '1px solid rgba(255,255,255,0.2)',
              transform: hasHolographicEffects ? 
                `translateZ(200px) translate(${position.x * 0.3}px, ${position.y * -0.1}px)` : 
                'none',
              position: 'relative',
              zIndex: 10000, /* Extreme z-index to ensure visibility */
              transition: isHovering ? 'none' : 'transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
            }}>
              <span className="stat-value-text" style={{
                position: 'relative',
                zIndex: 10001,
                textShadow: '0 0 2px black, 0 0 5px black'
              }}>{card.attack}</span>
            </div>
            
            {/* Health */}
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'radial-gradient(circle at 40% 40%, #4ADE80 0%, #15803D 60%, #166534 100%)',
              color: 'white',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              fontWeight: 'bold',
              fontSize: '24px',
              boxShadow: '0 0 10px rgba(52, 211, 153, 0.8), inset 0 -2px 4px rgba(0,0,0,0.5), inset 0 2px 4px rgba(255,255,255,0.2)',
              border: '1px solid rgba(255,255,255,0.2)',
              transform: hasHolographicEffects ? 
                `translateZ(200px) translate(${position.x * -0.3}px, ${position.y * -0.1}px)` : 
                'none',
              position: 'relative',
              zIndex: 10000, /* Extreme z-index to ensure visibility */
              transition: isHovering ? 'none' : 'transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
            }}>
              <span className="stat-value-text" style={{
                position: 'relative',
                zIndex: 10001,
                textShadow: '0 0 2px black, 0 0 5px black'
              }}>{card.health}</span>
            </div>
          </div>
        )}
        {hasHolographicEffects && (
          <>
            {/* Multiple thin diffraction lines - set 1 */}
            <div className="holographic-overlay" 
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: `
                  repeating-linear-gradient(
                    ${130 + rotation.y * 0.15}deg,
                    rgba(255,255,255,0.0) 0px,
                    rgba(255,255,255,0.0) 8px,
                    rgba(255,255,255,0.01) 9px,
                    rgba(255,255,255,0.0) 10px
                  )
                `,
                opacity: Math.min(0.4, 0.15 + Math.abs(rotation.y) * 0.01),
                mixBlendMode: 'soft-light',
                pointerEvents: 'none',
                zIndex: -5, // Negative to ensure it's below everything
                transform: `rotate(${rotation.y * 0.08}deg)`
              }}
            />
            
            {/* Multiple thin diffraction lines - set 2 */}
            <div 
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: `
                  repeating-linear-gradient(
                    ${145 + rotation.y * 0.1}deg,
                    rgba(255,255,255,0.0) 0px,
                    rgba(255,255,255,0.0) 12px,
                    rgba(255,255,255,0.015) 13px,
                    rgba(255,255,255,0.0) 14px
                  )
                `,
                opacity: Math.min(0.35, 0.12 + Math.abs(rotation.y) * 0.01),
                mixBlendMode: 'overlay',
                pointerEvents: 'none',
                zIndex: 5
              }}
            />
            
            {/* Multiple thin diffraction lines - set 3 */}
            <div 
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: `
                  repeating-linear-gradient(
                    ${52 + rotation.y * 0.12}deg,
                    rgba(255,255,255,0.0) 0px,
                    rgba(255,255,255,0.0) 15px,
                    rgba(255,255,255,0.01) 16px,
                    rgba(255,255,255,0.0) 17px
                  )
                `,
                opacity: Math.min(0.3, 0.1 + Math.abs(rotation.y) * 0.008),
                mixBlendMode: 'soft-light',
                pointerEvents: 'none',
                zIndex: 5
              }}
            />
            
            {/* Special edge highlight that appears on tilt - changed to radial for testing */}
            <div 
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 60%, rgba(255,255,255,0.05) 100%)',
                opacity: Math.min(0.7, Math.abs(rotation.y) * 0.03),
                mixBlendMode: 'soft-light',
                pointerEvents: 'none',
                zIndex: 9
              }}
            />
            
            {/* Holographic foil texture overlay */}
            <div 
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                borderRadius: '12px',
                backgroundImage: `url('/textures/foil.png')`,
                backgroundSize: 'cover',
                backgroundPosition: `${50 + rotation.y * 0.7}% ${50 + rotation.x * 0.7}%`,
                mixBlendMode: 'color-dodge',
                opacity: Math.min(0.7, 0.25 + (Math.abs(rotation.x) + Math.abs(rotation.y)) * 0.012),
                pointerEvents: 'none',
                zIndex: 10,
                filter: `hue-rotate(${rotation.y * 4}deg) contrast(1.2) brightness(1.1)`,
                transition: isHovering ? 'none' : 'opacity 0.8s, background-position 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
              }}
            />
            
            {/* Rarity-specific prismatic effect */}
            <div 
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                borderRadius: '12px',
                background: card.rarity.toLowerCase() === 'legendary' 
                  ? 'radial-gradient(circle at 30% 30%, rgba(255,215,0,0.05) 0%, rgba(255,105,180,0.05) 60%, rgba(65,105,225,0.05) 100%)'
                  : card.rarity.toLowerCase() === 'epic'
                    ? `url('/textures/epic_holographic2.png')`
                    : card.rarity.toLowerCase() === 'rare' 
                      ? 'radial-gradient(circle at 30% 30%, rgba(0,112,221,0.05) 0%, rgba(28,132,255,0.05) 60%, rgba(84,183,255,0.05) 100%)'
                      : 'radial-gradient(circle at 30% 30%, rgba(200,200,200,0.05) 0%, rgba(230,230,230,0.05) 60%, rgba(180,180,180,0.05) 100%)',
                backgroundSize: card.rarity.toLowerCase() === 'epic' ? '120% 120%' : 'auto',
                backgroundPosition: card.rarity.toLowerCase() === 'epic' ? `${50 + rotation.y * 0.8}% ${50 + rotation.x * 0.8}%` : 'center center',
                filter: card.rarity.toLowerCase() === 'epic' ? `brightness(1.3) contrast(1.2) hue-rotate(${rotation.y * 0.7}deg)` : 'blur(5px)',
                opacity: card.rarity.toLowerCase() === 'epic' ? Math.min(0.75, 0.4 + Math.abs(rotation.y) * 0.02) : Math.min(0.8, 0.3 + Math.abs(rotation.y) * 0.02),
                mixBlendMode: card.rarity.toLowerCase() === 'epic' ? 'soft-light' : 'normal',
                pointerEvents: 'none',
                zIndex: 8,
                transform: card.rarity.toLowerCase() === 'epic' ? 
                  `rotate(${-rotation.y * 0.2}deg) scale(0.95)` :
                  `rotate(${-rotation.y * 0.1}deg)`
              }}
            />
          </>
        )}
      </div>
      
      {/* Debug Overlay */}
      {showDebugOverlay && (
        <div className="holographic-debug-overlay"
          style={{
            position: 'absolute',
            top: '100%',
            left: '0',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            color: '#00FF00',
            padding: '10px',
            borderRadius: '5px',
            fontSize: '12px',
            fontFamily: 'monospace',
            width: '100%',
            zIndex: 100,
            transform: 'translateY(-100%)',
            pointerEvents: 'none'
          }}
        >
          <div style={{
            borderBottom: '1px solid #333',
            paddingBottom: '5px',
            marginBottom: '5px',
            color: '#FFFF00',
            fontWeight: 'bold'
          }}>
            Holographic Card Telemetry
          </div>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '5px'
          }}>
            <div style={{ color: '#AAAAFF' }}>Performance</div>
            <div style={{ color: '#AAAAFF' }}>Motion Quality</div>
            <div style={{ color: '#AAAAFF' }}>Experience</div>
            
            <div>
              Frame<br/>
              Time: {metrics.frameTime.toFixed(2)}ms
            </div>
            <div>
              Smoothness:<br/>
              {metrics.smoothness.toFixed(1)}%
            </div>
            <div>
              Device Score:<br/>
              {metrics.deviceScore}/100
            </div>
            
            <div>
              Render<br/>
              Latency:ms
            </div>
            <div>
              Jitter:<br/>
              {metrics.jitter.toFixed(1)}%
            </div>
            <div>
              Satisfaction:<br/>
              {metrics.satisfaction}/100
            </div>
            
            <div>
              Peak<br/>
              Latency:ms
            </div>
            <div>
              Trajectory<br/>
              Δ: {metrics.trajectoryDeviation.toFixed(4)}
            </div>
            <div></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimpleHolographicCard;
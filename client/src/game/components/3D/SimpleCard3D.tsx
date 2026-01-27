/**
 * Simple 3D Card component
 * 
 * A minimalist 3D card that focuses on reliable texture loading and core functionality
 * without advanced effects or shaders.
 * 
 * This component is designed to be highly compatible with other components
 * and provides both named and default exports to prevent circular dependency issues.
 */

import React, { useRef, useEffect, useState, useMemo } from 'react';
import * as THREE from 'three';
import { Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { CardData, CardQuality } from '../../types';
import { CardInstance } from '../../../types/cards';
import { CardInstanceWithCardData } from '../../types/interfaceExtensions';

// Import the active renderer info
import { ACTIVE_CARD_RENDERER } from '../../utils/cardRenderingSystemFix';
import { getCardDataSafely } from '../../utils/cardInstanceAdapter';

/**
 * Creates a fallback texture with text when image loading fails
 */
function createFallbackTexture(text: string): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  
  if (ctx) {
    // Fill with a semi-transparent background
    ctx.fillStyle = 'rgba(30, 30, 60, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add a subtle border
    ctx.strokeStyle = 'rgba(100, 150, 200, 0.8)';
    ctx.lineWidth = 8;
    ctx.strokeRect(16, 16, canvas.width - 32, canvas.height - 32);
    
    // Add text
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(200, 220, 255, 0.9)';
    
    // Split text into multiple lines if needed
    const lines = text.split('\n');
    const lineHeight = 30;
    const startY = canvas.height / 2 - (lines.length - 1) * lineHeight / 2;
    
    lines.forEach((line, index) => {
      ctx.fillText(line, canvas.width / 2, startY + index * lineHeight);
    });
  }
  
  // Create a texture from the canvas
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

// Component props
interface SimpleCard3DProps {
  card: CardData | CardInstance | CardInstanceWithCardData;
  quality?: CardQuality;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number | number[];
  isHovered?: boolean;
  isSelected?: boolean;
  showStats?: boolean;
  showText?: boolean;
  showFrame?: boolean;
  showEffects?: boolean;
  onInteraction?: (type: 'hover' | 'click' | 'drag', value: boolean) => void;
}

// Main component
const SimpleCard3D: React.FC<SimpleCard3DProps> = ({
  card,
  quality = 'normal',
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  isHovered = false,
  isSelected = false,
  showStats = true,
  showText = true,
  showFrame = true,
  showEffects = true,
  onInteraction
}) => {
  // Extract card data for use in component
  const cardData = getCardDataSafely(card);
  
  // Card dimensions
  const cardWidth = 1.6; // Standard card width
  const cardHeight = 2.2; // Standard card height
  const cardDepth = 0.05; // Card thickness
  
  // References to meshes
  const cardRef = useRef<THREE.Mesh>(null);
  
  // Animation values
  const [hoverAnimation, setHoverAnimation] = useState(0);
  
  // Handle hover state changes
  const handlePointerOver = () => {
    if (onInteraction) onInteraction('hover', true);
  };
  
  const handlePointerOut = () => {
    if (onInteraction) onInteraction('hover', false);
  };
  
  const handleClick = () => {
    if (onInteraction) onInteraction('click', true);
  };
  
  // Normalize scale value to handle both number and array formats consistently
  const normalizeScale = (scaleInput: number | number[]): number => {
    if (typeof scaleInput === 'number') {
      return scaleInput;
    } else if (Array.isArray(scaleInput) && scaleInput.length > 0) {
      // If it's an array, use the first value or average them if needed
      if (scaleInput.length === 1) {
        return scaleInput[0];
      } else {
        // For non-uniform scaling, we could average or use the max value
        // Using average for consistency
        return scaleInput.reduce((sum, val) => sum + val, 0) / scaleInput.length;
      }
    }
    
    // Default fallback
    return 1.0;
  };
  
  // Apply animation effects in the render loop
  useFrame((state, delta) => {
    if (!cardRef.current) return;
    
    // Update hover animation
    if (isHovered) {
      setHoverAnimation(Math.min(1, hoverAnimation + delta * 4));
    } else {
      setHoverAnimation(Math.max(0, hoverAnimation - delta * 4));
    }
    
    // Apply animation to card position and rotation
    const hoverScale = 1 + hoverAnimation * 0.1; // Scale up slightly on hover
    const scaleValue = normalizeScale(scale);
    
    // Apply uniform scaling with hover effect
    cardRef.current.scale.set(
      hoverScale * scaleValue,
      hoverScale * scaleValue,
      hoverScale * scaleValue
    );
    
    // Add subtle floating animation for premium+ cards
    if (quality !== 'normal') {
      cardRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.02 * (hoverAnimation * 0.5 + 0.5);
      cardRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 1.5) * 0.02 * (hoverAnimation * 0.5 + 0.5);
    }
  });
  
  // Load card artwork texture
  const [artTexture, setArtTexture] = useState<THREE.Texture | null>(null);
  
  // Load textures with error handling
  useEffect(() => {
    // Create a fallback texture as a placeholder until the real one loads
    const fallbackTexture = createFallbackTexture('Loading...');
    setArtTexture(fallbackTexture);
    
    // Skip loading if no card ID is available
    if (!cardData.id) {
      const placeholderTexture = createFallbackTexture('No Card ID');
      setArtTexture(placeholderTexture);
      return;
    }
    
    const loadCardTexture = async () => {
      try {
        // Use placeholder texture (image service removed)
        const placeholderTexture = createFallbackTexture(cardData.name || 'Card');
        setArtTexture(placeholderTexture);
        console.log(`Using placeholder texture for card: ${cardData.name} (ID: ${cardData.id})`);
        return;
      } catch (error: any) {
        console.error(`Failed to load image for card ${cardData.id}:`, error);
        const errorTexture = createFallbackTexture(`Error loading card image`);
        setArtTexture(errorTexture);
      }
    };
    
    // Start loading the texture
    loadCardTexture().catch(error => {
      console.error('Card texture loading error:', error);
    });
    
    // Clean up function to dispose of textures
    return () => {
      if (artTexture && 'dispose' in artTexture) {
        artTexture.dispose();
      }
    };
  }, [cardData.id, cardData.name]);
  
  // Card material colors based on card type
  const getCardColor = () => {
    switch (quality) {
      case 'premium': return '#66ccff';
      case 'golden': return '#ffcc00';
      default: return '#ffffff';
    }
  };

  // More targeted debug logging - only log in development and only for specific cards
  const isDebugMode = process.env.NODE_ENV === 'development';
  const shouldLogThisCard = isDebugMode && (
    cardData.id === 1001 || // Fireball
    cardData.id === 2002 || // Azure Drake
    cardData.id === 3003 || // Truesilver Champion
    cardData.id === 4004    // Deathwing
  );
  
  // Only log a subset of cards to reduce console noise
  if (shouldLogThisCard) {
    console.log(`Rendering ${ACTIVE_CARD_RENDERER} for card: ${cardData.name} (ID: ${cardData.id}) with quality: ${quality}`);
  }
  
  // Add a data attribute to help with debugging and rendering system tracking
  useEffect(() => {
    // Only run this once when the component mounts to avoid excessive DOM operations
    if (cardRef.current) {
      // In Three.js we can't use DOM methods like closest directly
      // Instead, find parent canvas elements using document query
      const meshElement = cardRef.current;
      const canvasElements = document.querySelectorAll('canvas');
      
      // Attempt to find the canvas containing this card
      // We need to use a timeout because the DOM may not be ready yet
      setTimeout(() => {
        canvasElements.forEach(canvas => {
          // Add attribute to all canvases in this component
          canvas.setAttribute('data-renderer', ACTIVE_CARD_RENDERER);
          
          // Mark this specific card id
          if (cardData.id) {
            canvas.setAttribute('data-card-id', String(cardData.id));
          }
        });
      }, 100);
    }
  }, []);
  
  // Create a normalized Vector3-compatible scale array
  const scaleArray = useMemo((): [number, number, number] => {
    // Apply normalizeScale to convert to proper Three.js scale format
    if (typeof scale === 'number') {
      return [scale, scale, scale];
    }
    
    if (Array.isArray(scale)) {
      if (scale.length === 1) return [scale[0], scale[0], scale[0]];
      if (scale.length === 2) return [scale[0], scale[1], 1]; // Add Z dimension
      if (scale.length >= 3) return [scale[0], scale[1], scale[2]]; // Use first 3 elements
    }
    
    // Fallback
    return [1, 1, 1];
  }, [scale]);

  return (
    <group
      position={[position[0], position[1], position[2]]}
      rotation={[rotation[0], rotation[1], rotation[2]]}
      scale={scaleArray}
      userData={{ cardId: cardData.id, renderer: 'SimpleCard3D' }}
    >
      {/* Card base mesh */}
      <mesh
        ref={cardRef}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      >
        <boxGeometry args={[cardWidth, cardHeight, cardDepth]} />
        <meshStandardMaterial
          color={getCardColor()}
          roughness={0.5}
          metalness={quality === 'normal' ? 0.1 : 0.4}
        />
      </mesh>
      
      {/* Card artwork */}
      {showFrame && (
        <mesh position={[0, 0.2, cardDepth / 2 + 0.001]}>
          <planeGeometry args={[cardWidth * 0.9, cardHeight * 0.5]} />
          <meshBasicMaterial 
            map={artTexture}
            transparent={true}
            opacity={0.95}
          />
        </mesh>
      )}
      
      {/* Card name */}
      {showText && (
        <Text
          position={[0, cardHeight * 0.35, cardDepth / 2 + 0.002]}
          fontSize={0.15}
          maxWidth={cardWidth * 0.9}
          lineHeight={1.2}
          textAlign="center"
          font="/fonts/belwe-bold.ttf"
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.01}
          outlineColor="#000000"
        >
          {cardData.name || "Unnamed Card"}
        </Text>
      )}
      
      {/* Card description */}
      {showText && cardData.description && (
        <Text
          position={[0, -cardHeight * 0.25, cardDepth / 2 + 0.002]}
          fontSize={0.08}
          maxWidth={cardWidth * 0.8}
          lineHeight={1.3}
          textAlign="center"
          font="/fonts/belwe.ttf"
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.005}
          outlineColor="#000000"
        >
          {cardData.description}
        </Text>
      )}
      
      {/* Card stats */}
      {showStats && showFrame && (
        <>
          {/* Mana cost */}
          {cardData.manaCost !== undefined && (
            <group position={[-cardWidth * 0.4, cardHeight * 0.43, cardDepth / 2 + 0.002]}>
              <mesh>
                <circleGeometry args={[0.16, 32]} />
                <meshBasicMaterial color="#1a4170" transparent opacity={0.9} />
              </mesh>
              <Text
                position={[0, 0, 0.001]}
                fontSize={0.14}
                color="#ffffff"
                font="/fonts/belwe-bold.ttf"
                anchorX="center"
                anchorY="middle"
                outlineWidth={0.01}
                outlineColor="#000000"
              >
                {cardData.manaCost}
              </Text>
            </group>
          )}
          
          {/* Attack (for minions and weapons) */}
          {(cardData.type === 'minion' || cardData.type === 'weapon') && cardData.attack !== undefined && (
            <group position={[-cardWidth * 0.4, -cardHeight * 0.43, cardDepth / 2 + 0.002]}>
              <mesh>
                <circleGeometry args={[0.16, 32]} />
                <meshBasicMaterial color="#7d3114" transparent opacity={0.9} />
              </mesh>
              <Text
                position={[0, 0, 0.001]}
                fontSize={0.14}
                color="#ffffff"
                font="/fonts/belwe-bold.ttf"
                anchorX="center"
                anchorY="middle"
                outlineWidth={0.01}
                outlineColor="#000000"
              >
                {cardData.attack}
              </Text>
            </group>
          )}
          
          {/* Health (for minions) */}
          {cardData.type === 'minion' && cardData.health !== undefined && (
            <group position={[cardWidth * 0.4, -cardHeight * 0.43, cardDepth / 2 + 0.002]}>
              <mesh>
                <circleGeometry args={[0.16, 32]} />
                <meshBasicMaterial color="#355e3b" transparent opacity={0.9} />
              </mesh>
              <Text
                position={[0, 0, 0.001]}
                fontSize={0.14}
                color="#ffffff"
                font="/fonts/belwe-bold.ttf"
                anchorX="center"
                anchorY="middle"
                outlineWidth={0.01}
                outlineColor="#000000"
              >
                {cardData.health}
              </Text>
            </group>
          )}
          
          {/* Durability (for weapons) */}
          {cardData.type === 'weapon' && cardData.durability !== undefined && (
            <group position={[cardWidth * 0.4, -cardHeight * 0.43, cardDepth / 2 + 0.002]}>
              <mesh>
                <circleGeometry args={[0.16, 32]} />
                <meshBasicMaterial color="#7d5114" transparent opacity={0.9} />
              </mesh>
              <Text
                position={[0, 0, 0.001]}
                fontSize={0.14}
                color="#ffffff"
                font="/fonts/belwe-bold.ttf"
                anchorX="center"
                anchorY="middle"
                outlineWidth={0.01}
                outlineColor="#000000"
              >
                {cardData.durability}
              </Text>
            </group>
          )}
        </>
      )}
      
      {/* Basic effect particles for premium cards */}
      {showEffects && quality !== 'normal' && (
        <points>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={50}
              array={useMemo(() => {
                const positions = new Float32Array(150);
                for (let i = 0; i < 150; i += 3) {
                  positions[i] = (Math.random() - 0.5) * cardWidth * 1.2;
                  positions[i+1] = (Math.random() - 0.5) * cardHeight * 1.2;
                  positions[i+2] = cardDepth / 2 + Math.random() * 0.2;
                }
                return positions;
              }, [])}
              itemSize={3}
            />
          </bufferGeometry>
          <pointsMaterial
            size={0.03}
            color={quality === 'premium' ? '#66ccff' : '#ffcc00'}
            transparent
            opacity={0.7}
            blending={THREE.AdditiveBlending}
          />
        </points>
      )}
    </group>
  );
};

// Export as both default and named for compatibility during transition
export default SimpleCard3D;
export { SimpleCard3D };
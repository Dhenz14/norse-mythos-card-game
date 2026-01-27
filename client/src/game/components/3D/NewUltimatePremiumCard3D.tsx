/**
 * Ultimate Premium 3D Card component - Simplified Version
 * 
 * This component renders a high-quality 3D card with basic visual effects,
 * focusing on correct texture loading behavior.
 */

import React, { useRef, useEffect, useState, useMemo } from 'react';
import * as THREE from 'three';
import { Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { CardData, CardQuality } from '../../types';

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
interface UltimatePremiumCard3DProps {
  card: CardData;
  quality: CardQuality;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  isHovered?: boolean;
  isSelected?: boolean;
  showStats?: boolean;
  showText?: boolean;
  showFrame?: boolean;
  showEffects?: boolean;
  useAdvancedShaders?: boolean;
  onInteraction?: (type: 'hover' | 'click' | 'drag', value: boolean) => void;
}

/**
 * Material properties for different card qualities
 */
interface CardMaterialProps {
  roughness: number;
  metalness: number;
  emissiveIntensity: number;
  baseColor: string;
  emissiveColor: string;
  frameColor: string;
}

/**
 * Get material properties based on card quality
 */
function getMaterialProps(quality: CardQuality): CardMaterialProps {
  switch (quality) {
    case 'normal':
      return {
        roughness: 0.5,
        metalness: 0.1,
        emissiveIntensity: 0.0,
        baseColor: '#ffffff',
        emissiveColor: '#000000',
        frameColor: '#d0d0d0'
      };
    case 'premium':
      return {
        roughness: 0.3,
        metalness: 0.4,
        emissiveIntensity: 0.2,
        baseColor: '#66ccff',
        emissiveColor: '#3399ff',
        frameColor: '#99ddff'
      };
    case 'golden':
      return {
        roughness: 0.2,
        metalness: 0.8,
        emissiveIntensity: 0.4,
        baseColor: '#ffcc00',
        emissiveColor: '#ff9900',
        frameColor: '#ffdd44'
      };
    case 'legendary':
      return {
        roughness: 0.1,
        metalness: 0.9,
        emissiveIntensity: 0.6,
        baseColor: '#ff33cc',
        emissiveColor: '#cc0099',
        frameColor: '#ff66dd'
      };
    default:
      return {
        roughness: 0.5,
        metalness: 0.1,
        emissiveIntensity: 0.0,
        baseColor: '#ffffff',
        emissiveColor: '#000000',
        frameColor: '#d0d0d0'
      };
  }
}

const UltimatePremiumCard3D: React.FC<UltimatePremiumCard3DProps> = ({
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
  useAdvancedShaders = false,
  onInteraction
}) => {
  // Extract card data for use in component
  const cardData = card;
  
  // Card dimensions
  const cardWidth = 1.6; // Standard card width
  const cardHeight = 2.2; // Standard card height
  const cardDepth = 0.05; // Card thickness
  
  // References to meshes and materials
  const cardRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.Material>(null);
  const frameRef = useRef<THREE.Mesh>(null);
  
  // Get specific material properties based on card quality
  const materialProps = useMemo(() => getMaterialProps(quality), [quality]);
  
  // Animation values
  const [hoverAnimation, setHoverAnimation] = useState(0); // Animation progress
  
  // Advanced shader for premium cards
  const { fragmentShader, vertexShader, uniforms } = useCardShaders(quality, useAdvancedShaders);
  
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
    cardRef.current.scale.set(hoverScale * scale, hoverScale * scale, hoverScale * scale);
    
    // Add subtle floating animation for premium and better cards
    if (quality !== 'normal') {
      cardRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.02 * (hoverAnimation * 0.5 + 0.5);
      cardRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 1.5) * 0.02 * (hoverAnimation * 0.5 + 0.5);
    }
    
    // Update shader uniforms if using advanced shaders
    if (useAdvancedShaders && materialRef.current && 'uniforms' in materialRef.current) {
      const shaderMaterial = materialRef.current as ShaderMaterial;
      if (shaderMaterial.uniforms) {
        shaderMaterial.uniforms.uTime.value = state.clock.elapsedTime;
        shaderMaterial.uniforms.uHover.value = hoverAnimation;
      }
    }
  });
  
  // Apply shader material effect for premium cards
  useEffect(() => {
    if (useAdvancedShaders && materialRef.current) {
      const shaderMaterial = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          ...uniforms,
          uBaseColor: { value: new THREE.Color(materialProps.baseColor) },
          uEmissiveColor: { value: new THREE.Color(materialProps.emissiveColor) },
          uEmissiveIntensity: { value: materialProps.emissiveIntensity },
          uRoughness: { value: materialProps.roughness },
          uMetalness: { value: materialProps.metalness },
          uTime: { value: 0 },
          uHover: { value: 0 },
          uSelected: { value: isSelected ? 1.0 : 0.0 }
        },
        transparent: true,
        side: THREE.DoubleSide,
      });
      
      if (cardRef.current) {
        if (Array.isArray(cardRef.current.material)) {
          cardRef.current.material[0] = shaderMaterial;
        } else {
          cardRef.current.material = shaderMaterial;
        }
      }
    }
  }, [useAdvancedShaders, fragmentShader, vertexShader, uniforms, materialProps, isSelected]);
  
  // Load card artwork texture if available
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
      } catch (error) {
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
  
  // Create card text styles based on card type
  const getCardTextColor = useMemo(() => {
    switch (cardData.type) {
      case 'spell': return '#ffffff';
      case 'minion': return '#ffffff';
      case 'weapon': return '#ffffff';
      default: return '#ffffff';
    }
  }, [cardData.type]);
  
  // Get color based on card rarity
  const getRarityColor = useMemo(() => {
    switch (cardData.rarity) {
      case 'common': return '#ffffff';
      case 'rare': return '#0070dd';
      case 'epic': return '#a335ee';
      case 'legendary': return '#ff8000';
      default: return '#ffffff';
    }
  }, [cardData.rarity]);
  
  // Get card frame color based on class
  const getClassColor = useMemo(() => {
    const classColors: {[key: string]: string} = {
      'Neutral': '#808080',
      'Druid': '#FF7D0A',
      'Hunter': '#ABD473',
      'Mage': '#69CCF0',
      'Paladin': '#F58CBA',
      'Priest': '#FFFFFF',
      'Rogue': '#FFF569',
      'Shaman': '#0070DE',
      'Warlock': '#9482C9',
      'Warrior': '#C79C6E',
      'Necromancer': '#40BF40',
      'Pirate': '#C41E3A'
    };
    
    return classColors[cardData.class || 'Neutral'] || '#808080';
  }, [cardData.class]);
  
  console.log(`Rendering UltimatePremiumCard3D for card: ${cardData.name} (ID: ${cardData.id}) with quality: ${quality}`);
  
  return (
    <group
      position={[position[0], position[1], position[2]]}
      rotation={[rotation[0], rotation[1], rotation[2]]}
      scale={[scale, scale, scale]}
    >
      {/* Debug background to ensure visibility */}
      <mesh position={[0, 0, -0.01]} scale={[cardWidth * 1.1, cardHeight * 1.1, 0.01]}>
        <boxGeometry />
        <meshBasicMaterial color="#444444" />
      </mesh>
      
      {/* Card base mesh with advanced shader */}
      <mesh
        ref={cardRef}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      >
        <boxGeometry args={[cardWidth, cardHeight, cardDepth, 16, 16, 1]} />
        {useAdvancedShaders ? (
          // Will use the shader material applied in the effect
          <meshStandardMaterial
            ref={materialRef}
            color={materialProps.baseColor}
            roughness={materialProps.roughness}
            metalness={materialProps.metalness}
            emissive={new THREE.Color(materialProps.emissiveColor)}
            emissiveIntensity={materialProps.emissiveIntensity || 0}
          />
        ) : (
          // Use standard material for fallback
          <meshStandardMaterial
            ref={materialRef}
            color={materialProps.baseColor}
            roughness={materialProps.roughness}
            metalness={materialProps.metalness}
            emissive={new THREE.Color(materialProps.emissiveColor)}
            emissiveIntensity={materialProps.emissiveIntensity || 0}
          />
        )}
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
          color={getCardTextColor}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.01}
          outlineColor="#000000"
        >
          {cardData.name || "Unnamed Card"}
        </Text>
      )}
      
      {/* Card description - only show if text is enabled */}
      {showText && cardData.description && (
        <Text
          position={[0, -cardHeight * 0.25, cardDepth / 2 + 0.002]}
          fontSize={0.08}
          maxWidth={cardWidth * 0.8}
          lineHeight={1.3}
          textAlign="center"
          font="/fonts/belwe.ttf"
          color={getCardTextColor}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.005}
          outlineColor="#000000"
        >
          {cardData.description}
        </Text>
      )}
      
      {/* Card stats - only show if stats and frame are enabled */}
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
      
      {/* Advanced effects for premium cards */}
      {showEffects && quality !== 'normal' && (
        <>
          {/* Add particle effects that match the card quality */}
          <points>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                count={100}
                array={useMemo(() => {
                  const positions = new Float32Array(300);
                  for (let i = 0; i < 300; i += 3) {
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
              color={quality === 'premium' ? '#66ccff' : 
                    quality === 'golden' ? '#ffcc00' : '#ff33cc'}
              transparent
              opacity={0.7}
              blending={THREE.AdditiveBlending}
            />
          </points>
        </>
      )}
    </group>
  );
};

export default UltimatePremiumCard3D;
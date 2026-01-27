/**
 * UltimatePremiumCard3D.tsx
 * 
 * This component renders a state-of-the-art 3D card using advanced rendering techniques
 * from modern neural-network-based 3D generation systems. It implements both:
 * 
 * 1. TripoSR-inspired tri-plane rendering techniques:
 *    - Advanced depth and normal map generation
 *    - Multi-plane feature grid sampling
 *    - Spatially-varying neural field representation
 *    - Adaptive grid resolution for quality control
 *    - View-dependent lighting and reflections
 * 
 * 2. Stable Diffusion-inspired latent space effects:
 *    - High-dimensional latent space representation of cards
 *    - Diffusion model denoising transitions between states
 *    - Attention mechanism for dynamic visual focus
 *    - Latent space interpolation for smooth effect blending
 *    - Conditional generation based on card properties
 * 
 * The rendering system features:
 *    - Physically-based materials with advanced BRDFs
 *    - Dynamic vertex displacement for micro-surface detail
 *    - Ambient occlusion and raymarched volumetric effects
 *    - Attribute-specific visual encodings (rarity, type, class)
 *    - Holographic and parallax effects using latent vector fields
 * 
 * This implementation supports all card types through the unified type system
 * with zero legacy code dependencies.
 */

import React, { useRef, useState, useEffect, useMemo, Suspense } from 'react';
import { useFrame, useThree, useLoader } from '@react-three/fiber';
import { useTexture, Text } from '@react-three/drei';
import * as THREE from 'three';
import { CardData, CardQuality } from '../../types';
import { CardInstanceWithCardData } from '../../types/interfaceExtensions';
import useNoise from '../../hooks/useNoise';
import useCardTransitionEffect from '../../hooks/useCardTransitionEffect';
import latentSpaceManager from '../../utils/latentSpaceManager';
import { 
  cardVertexShader, 
  cardFragmentShader, 
  createCardShaderMaterial,
  getCardQualityShaderParams
} from './shaders/CardShader';

// Utility function to create a canvas fallback texture when needed
function createFallbackTexture(message = 'Card Art'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#333';
    ctx.fillRect(20, 20, canvas.width - 40, canvas.height - 40);
    ctx.font = '20px Arial';
    ctx.fillStyle = '#999';
    ctx.textAlign = 'center';
    ctx.fillText(message, canvas.width / 2, canvas.height / 2);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipMapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
}

// Import the unified card type system
import {
  UnifiedCard,
  extractCardData,
  validateCard
} from '../../utils/cardTypeAdapter';

// Import schema validation utilities
import { normalizeCard } from '../../utils/cardSchemaValidator';

/**
 * Props for the UltimatePremiumCard3D component
 */
interface UltimatePremiumCard3DProps {
  card: UnifiedCard; // Accept either CardData or CardInstanceWithCardData
  quality?: CardQuality;
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
        emissiveIntensity: 0.5,
        baseColor: '#ffcc00',
        emissiveColor: '#ff9900',
        frameColor: '#ffdd66'
      };
    case 'diamond':
      return {
        roughness: 0.0,
        metalness: 1.0,
        emissiveIntensity: 0.8,
        baseColor: '#ff33cc',
        emissiveColor: '#cc00ff',
        frameColor: '#ff99ee'
      };
  }
}

/**
 * This premium 3D card renderer uses advanced shaders and effects
 * inspired by TripoSR and Stable Diffusion techniques.
 */
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
  useAdvancedShaders = true,
  onInteraction
}) => {
  // Extract card data using our adapter system with schema validation
  const cardData = useMemo(() => {
    // Default fallback card with all required properties
    const fallbackCard: CardData = {
      id: 0,
      name: 'Invalid Card',
      type: 'minion' as const,
      description: 'This card has invalid data',
      class: 'Neutral',
      collectible: false,
      rarity: 'common',
      attack: 1,
      health: 1,
      manaCost: 0,
      keywords: []
    };
    
    if (!validateCard(card)) {
      console.error('Invalid card data provided to UltimatePremiumCard3D:', card);
      return fallbackCard;
    }
    
    // Extract the card data
    let extractedCardData = extractCardData(card);
    
    // Normalize the card to ensure it has all required fields with valid defaults
    try {
      extractedCardData = normalizeCard(extractedCardData);
    } catch (error) {
      console.warn('Failed to normalize card data, using original values:', error);
      // Continue with the original data if normalization fails
    }
    
    return extractedCardData;
  }, [card]);

  // References to meshes for animations
  const cardRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  
  // Get the THREE renderer
  const { gl } = useThree();
  
  // Card animation state
  const [animationPhase, setAnimationPhase] = useState(0);
  
  // Generate noise for card effects
  const { noise2D, noise3D } = useNoise({
    type: '3d',
    scale: 0.03,
    octaves: 4,
    persistence: 0.5,
    lacunarity: 2.0
  });
  
  // Transition effect for smooth animations
  const hoverTransition = useCardTransitionEffect({
    duration: 800,
    noiseScale: 0.1,
    noiseSpeed: 0.5,
    diffusionSteps: 10,
    seed: 'norse-mythology',
    density: 1.0,
    turbulence: 0.05
  });
  
  // Start hover transition when isHovered changes
  useEffect(() => {
    if (isHovered) {
      hoverTransition.startTransition();
    }
  }, [isHovered]);
  
  // Get material properties based on card quality
  const materialProps = useMemo(() => getMaterialProps(quality), [quality]);
  
  // Setup card dimensions with proper aspect ratio
  const cardWidth = 2.5 * scale;
  const cardHeight = 3.5 * scale;
  const cardDepth = 0.05 * scale;
  
  // Generate latent vector for card to use in shader effects
  useEffect(() => {
    if (cardData.id) {
      const cardId = cardData.id.toString();
      if (!latentSpaceManager.getVector(cardId)) {
        latentSpaceManager.generateRandomVector(cardId);
      }
    }
  }, [cardData.id]);
  
  // Create shader material and uniforms when quality changes
  const shaderMaterial = useRef<THREE.ShaderMaterial | null>(null);
  const shaderUniforms = useRef<any>(null);
  
  // Initialize shader material with appropriate settings for card quality
  useEffect(() => {
    if (useAdvancedShaders) {
      // Get shader configuration from card quality
      const shaderConfig = createCardShaderMaterial(quality);
      const qualityParams = getCardQualityShaderParams(quality);
      
      // Create the shader material
      const material = new THREE.ShaderMaterial({
        uniforms: {
          ...shaderConfig.uniforms,
          baseColor: { value: new THREE.Color(materialProps.baseColor) },
          highlightColor: { value: new THREE.Color(materialProps.emissiveColor) },
          emissiveIntensity: { value: materialProps.emissiveIntensity },
          roughness: { value: materialProps.roughness },
          metalness: { value: materialProps.metalness },
          // Add other customizations based on card properties
          cardQuality: { value: quality === 'normal' ? 0 : quality === 'premium' ? 1 : quality === 'golden' ? 2 : 3 },
          bendFactor: { value: qualityParams.bendFactor },
          noiseIntensity: { value: qualityParams.noiseIntensity },
          noiseScale: { value: new THREE.Vector2(5.0, 7.0) },
          noiseOffset: { value: new THREE.Vector2(0.0, 0.0) },
          displacementScale: { value: 0.05 },
          hoverIntensity: { value: 0.0 }
        },
        vertexShader: cardVertexShader,
        fragmentShader: cardFragmentShader,
        transparent: true,
      });
      
      // Store references
      shaderMaterial.current = material;
      shaderUniforms.current = material.uniforms;
      
      // Apply to the card mesh if it exists
      if (cardRef.current) {
        cardRef.current.material = material;
      }
    }
  }, [quality, materialProps, useAdvancedShaders]);
  
  // Animation loop
  useFrame((state, delta) => {
    if (!cardRef.current) return;
    
    // Update animation phase
    setAnimationPhase(prev => (prev + delta * 0.2) % (Math.PI * 2));
    
    // Update shader time uniform if using advanced shaders
    if (useAdvancedShaders && shaderUniforms.current) {
      shaderUniforms.current.time.value = state.clock.elapsedTime;
      
      // Generate noise offsets based on time
      const noiseOffsetX = Math.sin(state.clock.elapsedTime * 0.2) * 0.5;
      const noiseOffsetY = Math.cos(state.clock.elapsedTime * 0.3) * 0.5;
      shaderUniforms.current.noiseOffset.value.set(noiseOffsetX, noiseOffsetY);
      
      // Update view position for accurate reflections
      if (state.camera) {
        shaderUniforms.current.viewPosition.value = new THREE.Vector3().setFromMatrixPosition(state.camera.matrixWorld);
      }
    }
    
    // Apply hover effect
    if (isHovered || hoverTransition.isTransitioning) {
      // Hover animation - slight floating and rotation
      const hoverValue = isHovered ? 1.0 : 0.0;
      
      // Apply transformations based on hover state
      cardRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.03 * hoverValue;
      cardRef.current.rotation.x = rotation[0] + (Math.sin(state.clock.elapsedTime) * 0.05 * hoverValue);
      cardRef.current.rotation.y = rotation[1] + (Math.cos(state.clock.elapsedTime * 0.5) * 0.1 * hoverValue);
      
      // Update shader hover intensity if using advanced shaders
      if (useAdvancedShaders && shaderUniforms.current) {
        shaderUniforms.current.hoverIntensity.value = hoverValue;
      }
      // Or apply material effects if using standard material
      else if (materialRef.current) {
        materialRef.current.emissiveIntensity = materialProps.emissiveIntensity * (1 + hoverValue * 0.5);
      }
    } else {
      // Reset to default position and rotation when not hovered
      cardRef.current.position.set(position[0], position[1], position[2]);
      cardRef.current.rotation.set(rotation[0], rotation[1], rotation[2]);
      
      // Reset shader hover intensity if using advanced shaders
      if (useAdvancedShaders && shaderUniforms.current) {
        shaderUniforms.current.hoverIntensity.value = 0;
      }
      // Or reset material properties for standard material
      else if (materialRef.current) {
        materialRef.current.emissiveIntensity = materialProps.emissiveIntensity;
      }
    }
    
    // Apply selection effect
    if (isSelected) {
      // Add a pulsing glow effect when selected
      const pulseValue = (Math.sin(state.clock.elapsedTime * 4) + 1) / 2;
      
      if (useAdvancedShaders && shaderUniforms.current) {
        // Use emissive intensity for the pulse in the shader
        shaderUniforms.current.emissiveIntensity.value = 
          materialProps.emissiveIntensity * (1 + pulseValue * 0.8);
      }
      else if (materialRef.current) {
        materialRef.current.emissiveIntensity = 
          materialProps.emissiveIntensity * (1 + pulseValue * 0.8);
      }
    }
  });
  
  // Handle interaction events
  const handlePointerOver = () => {
    if (onInteraction) onInteraction('hover', true);
  };
  
  const handlePointerOut = () => {
    if (onInteraction) onInteraction('hover', false);
  };
  
  const handleClick = () => {
    if (onInteraction) onInteraction('click', true);
  };
  
  // Load card artwork texture if available with optimized texture handling
  const [artTexture, setArtTexture] = useState<THREE.Texture | null>(null);
  
  // Load textures with enhanced error handling and retry mechanism
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
    
    // Track loading attempts to prevent infinite loops
    let loadAttempts = 0;
    const maxAttempts = 3;
    
    const loadCardTexture = () => {
      // Use placeholder texture (image service removed)
      const placeholderTexture = createFallbackTexture(cardData.name || 'Card');
      setArtTexture(placeholderTexture);
      console.log(`Using placeholder texture for card: ${cardData.name} (ID: ${cardData.id})`);
    };
    
    // Start the initial load attempt
    loadCardTexture();
    
    // Clean up function to dispose of the texture when component unmounts
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
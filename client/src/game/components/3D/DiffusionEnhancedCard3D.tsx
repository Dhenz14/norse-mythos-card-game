/**
 * DiffusionEnhancedCard3D.tsx
 * 
 * An advanced 3D card component that uses noise-based effects
 * to create organic, fluid animations inspired by Stable Diffusion's
 * latent space transitions.
 */

import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree, extend, Node } from '@react-three/fiber';
import { MeshStandardMaterial, Vector3, Vector2 } from 'three';
import { useSpring, animated } from '@react-spring/three';
import { CardData, CardInstance } from '../../../types/cards';
import useNoise from '../../hooks/useNoise';
import { Text, useTexture, shaderMaterial } from '@react-three/drei';

// Custom shader material for the card
const CardShaderMaterial = shaderMaterial(
  // Uniforms (parameters passed to the shader)
  {
    time: 0,
    colorMap: null,
    normalMap: null,
    roughnessMap: null,
    noiseIntensity: 0.1,
    distortionMap: null,
    highlightColor: [1.0, 0.8, 0.2],
    borderGlow: 0.0,
    wobbleFrequency: 0.5,
    wobbleAmplitude: 0.05,
    cardType: 0, // 0: normal, 1: premium, 2: golden, 3: diamond
    rarity: 0, // 0: common, 1: rare, 2: epic, 3: legendary
    noiseValues: [0, 0, 0, 0], // Values from the noise hook
  },
  // Vertex shader
  `
    uniform float time;
    uniform float noiseIntensity;
    uniform float wobbleFrequency;
    uniform float wobbleAmplitude;
    uniform vec4 noiseValues;
    
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;
    
    // Function to create a displacement effect based on noise
    vec3 applyDisplacement(vec3 position, vec3 normal) {
      // Use noise values from our hook for organic movement
      float noiseX = noiseValues.x * 2.0 - 1.0;
      float noiseY = noiseValues.y * 2.0 - 1.0;
      
      // Card bending effect - subtle curve along Y axis
      float bendStrength = 0.05 + noiseValues.z * 0.02;
      float xCenter = position.x;
      float bendY = -bendStrength * xCenter * xCenter;
      
      // Add micro-detail displacement
      float microDetail = sin(position.x * 20.0 + time) * sin(position.y * 20.0 + time * 0.7) * noiseIntensity * 0.01;
      
      // Wobble effect based on noise
      float wobble = sin(time * wobbleFrequency + position.x * 2.0) * 
                     sin(time * wobbleFrequency * 0.7 + position.y * 2.0) * 
                     wobbleAmplitude;
      
      // Combine all effects
      vec3 displaced = position;
      displaced.z += bendY + microDetail;
      displaced.x += wobble * noiseX * 0.01;
      displaced.y += wobble * noiseY * 0.01;
      
      return displaced;
    }
    
    void main() {
      vUv = uv;
      vNormal = normal;
      vPosition = position;
      
      // Apply displacement to the vertex position
      vec3 newPosition = applyDisplacement(position, normal);
      
      gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
    }
  `,
  // Fragment shader
  `
    uniform float time;
    uniform sampler2D colorMap;
    uniform sampler2D normalMap;
    uniform sampler2D roughnessMap;
    uniform sampler2D distortionMap;
    uniform vec3 highlightColor;
    uniform float borderGlow;
    uniform float noiseIntensity;
    uniform int cardType;
    uniform int rarity;
    uniform vec4 noiseValues;
    
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;
    
    void main() {
      // Calculate distance from the center for edge effects
      vec2 centeredUv = vUv * 2.0 - 1.0;
      float distanceFromCenter = length(centeredUv);
      
      // Edge highlight effect
      float edgeHighlight = smoothstep(0.8, 0.95, distanceFromCenter) * borderGlow;
      
      // Dynamic UV distortion based on noise
      vec2 distortedUv = vUv;
      
      // Different distortion patterns based on card type
      if (cardType >= 1) { // Premium cards and above
        float distortionStrength = 0.01 + (float(cardType) * 0.005);
        distortedUv.x += sin(vUv.y * 10.0 + time * 0.5) * distortionStrength * noiseValues.z;
        distortedUv.y += cos(vUv.x * 10.0 + time * 0.3) * distortionStrength * noiseValues.w;
      }
      
      // Sample the textures with our distorted UVs
      vec4 color = texture2D(colorMap, distortedUv);
      
      // Normal mapping for surface detail
      vec3 normal = texture2D(normalMap, distortedUv).rgb * 2.0 - 1.0;
      
      // Roughness mapping for reflectivity
      float roughness = texture2D(roughnessMap, distortedUv).r;
      
      // Apply special effects based on card type
      if (cardType == 1) { // Premium effect
        // Add subtle blue shimmer
        float shimmer = sin(vUv.x * 20.0 + time) * sin(vUv.y * 20.0 + time * 1.3) * 0.1;
        color.rgb += vec3(0.0, 0.1, 0.3) * shimmer;
      } 
      else if (cardType == 2) { // Golden effect
        // Add gold shimmer with more intensity
        float shimmer = sin(vUv.x * 30.0 + time * 1.2) * sin(vUv.y * 30.0 + time * 0.8) * 0.15;
        color.rgb += highlightColor * shimmer;
        // Add subtle color shift
        color.rgb = mix(color.rgb, highlightColor * color.rgb, 0.2);
      }
      else if (cardType == 3) { // Diamond effect
        // Diamond-like refraction effect
        float refraction = sin(vUv.x * 50.0 + time * 0.7) * sin(vUv.y * 50.0 + time * 0.5) * 0.2;
        // Rainbow color effect
        vec3 rainbow = vec3(
          sin(time * 0.5 + vUv.y * 10.0) * 0.5 + 0.5,
          sin(time * 0.5 + vUv.y * 10.0 + 2.0) * 0.5 + 0.5,
          sin(time * 0.5 + vUv.y * 10.0 + 4.0) * 0.5 + 0.5
        );
        color.rgb = mix(color.rgb, rainbow * color.rgb, refraction * 0.3);
        color.rgb += vec3(0.3, 0.3, 0.5) * refraction;
      }
      
      // Add edge highlight
      color.rgb += highlightColor * edgeHighlight;
      
      // Add special rarity-based effects
      if (rarity >= 2) { // Epic and Legendary
        // Pulsing glow effect
        float pulse = (sin(time * 1.5) * 0.5 + 0.5) * 0.2;
        
        // Epic (purple) or Legendary (orange) glow
        vec3 rarityColor = (rarity == 2) ? 
          vec3(0.7, 0.3, 0.9) : // Epic purple
          vec3(1.0, 0.6, 0.0);  // Legendary orange
          
        // Apply stronger effects for higher rarities
        float rarityIntensity = float(rarity) * 0.1;
        
        // Add subtle glow that pulses
        color.rgb += rarityColor * pulse * rarityIntensity;
      }
      
      gl_FragColor = color;
    }
  `
);

// Extend Three.js with our custom shader
extend({ CardShaderMaterial });

// Make TypeScript aware of our new JSX element
declare global {
  namespace JSX {
    interface IntrinsicElements {
      cardShaderMaterial: Node<any, any>;
    }
  }
}

interface DiffusionEnhancedCard3DProps {
  card: CardData | CardInstance;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  onClick?: () => void;
  onHover?: (isHovering: boolean) => void;
  isHovering?: boolean;
  isPremium?: boolean;
  isGolden?: boolean;
  isDiamond?: boolean;
  isHighlighted?: boolean;
  transitionProgress?: number;
}

// The actual card mesh with all its effects
const CardMesh: React.FC<DiffusionEnhancedCard3DProps> = ({
  card,
  isHovering = false,
  isPremium = false,
  isGolden = false,
  isDiamond = false,
  isHighlighted = false,
  transitionProgress = 0,
  onClick,
  onHover
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<any>(null);
  
  // Load textures for the card
  const [
    cardTexture,
    cardNormalMap,
    cardRoughnessMap,
    cardDistortionMap
  ] = useTexture([
    '/textures/card_base.jpg',
    '/textures/card_normal.jpg',
    '/textures/card_roughness.jpg',
    '/textures/card_distortion.jpg'
  ]);
  
  // Get the rendering context to calculate correct world positions
  const { camera } = useThree();

  // Get noise values for organic movement
  const noise = useNoise('simplex');

  // Card type value for shader (0: normal, 1: premium, 2: golden, 3: diamond)
  const cardTypeValue = useMemo(() => {
    if (isDiamond) return 3;
    if (isGolden) return 2;
    if (isPremium) return 1;
    return 0;
  }, [isPremium, isGolden, isDiamond]);

  // Determine rarity value for shader
  const rarityValue = useMemo(() => {
    switch (card.rarity?.toLowerCase()) {
      case 'common': return 0;
      case 'rare': return 1;
      case 'epic': return 2;
      case 'legendary': return 3;
      default: return 0;
    }
  }, [card.rarity]);

  // Animation springs for hover effects
  const { positionZ, rotationX, rotationY, scaleXYZ } = useSpring({
    positionZ: isHovering ? 0.5 : 0,
    rotationX: isHovering ? -0.05 : 0,
    rotationY: isHovering ? 0.05 : 0,
    scaleXYZ: isHovering ? 1.05 : 1,
    config: { mass: 1, tension: 280, friction: 60 }
  });

  // Animation spring for border glow
  const { borderGlow } = useSpring({
    borderGlow: isHighlighted ? 0.8 : isHovering ? 0.4 : 0.1,
    config: { mass: 1, tension: 280, friction: 60 }
  });

  // Handle pointer events
  const handlePointerOver = () => onHover && onHover(true);
  const handlePointerOut = () => onHover && onHover(false);
  const handleClick = () => onClick && onClick();

  // Update shader uniforms on each frame
  useFrame((state, delta) => {
    if (materialRef.current) {
      // Update time uniform for animations
      materialRef.current.uniforms.time.value += delta;
      
      // Update noise values from our hook
      const noiseValue1 = noise.getValue(state.clock.elapsedTime * 0.1, 0, 0);
      const noiseValue2 = noise.getValue(0, state.clock.elapsedTime * 0.15, 0);
      const noiseValue3 = noise.getValue(state.clock.elapsedTime * 0.2, state.clock.elapsedTime * 0.1, 0);
      const noiseValue4 = noise.getValue(state.clock.elapsedTime * 0.05, state.clock.elapsedTime * 0.2, 0);
      
      materialRef.current.uniforms.noiseValues.value = [
        noiseValue1, 
        noiseValue2, 
        noiseValue3, 
        noiseValue4
      ];
      
      // Determine wobble intensity based on card type
      const baseWobble = 0.3;
      const typeMultiplier = cardTypeValue * 0.2;
      materialRef.current.uniforms.wobbleFrequency.value = baseWobble + typeMultiplier;
      materialRef.current.uniforms.wobbleAmplitude.value = isHovering ? 0.1 : 0.05;
      
      // Update card-specific uniforms
      materialRef.current.uniforms.cardType.value = cardTypeValue;
      materialRef.current.uniforms.rarity.value = rarityValue;
      materialRef.current.uniforms.borderGlow.value = borderGlow.get();
      
      // Modify the strength of effects based on transition progress
      if (transitionProgress > 0) {
        const transitionBoost = Math.sin(transitionProgress * Math.PI) * 2;
        materialRef.current.uniforms.noiseIntensity.value = 0.1 + transitionBoost * 0.2;
        materialRef.current.uniforms.borderGlow.value += transitionBoost * 0.3;
      } else {
        materialRef.current.uniforms.noiseIntensity.value = 0.1;
      }
      
      // Optional: Make the card face the camera slightly
      if (meshRef.current && isHovering) {
        const meshPosition = meshRef.current.position.clone();
        const cameraPosition = camera.position.clone();
        const direction = new Vector3().subVectors(cameraPosition, meshPosition).normalize();
        const targetRotation = Math.atan2(direction.x, direction.z);
        meshRef.current.rotation.y = targetRotation * 0.1;
      }
    }
  });

  return (
    <animated.mesh
      ref={meshRef}
      position-z={positionZ}
      rotation-x={rotationX}
      rotation-y={rotationY}
      scale={scaleXYZ.to(s => [s, s, s])}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      {/* Card base (3:4 ratio) */}
      <planeGeometry args={[2.5, 3.5, 32, 32]} />
      
      {/* Custom card shader material */}
      <cardShaderMaterial
        ref={materialRef}
        colorMap={cardTexture}
        normalMap={cardNormalMap}
        roughnessMap={cardRoughnessMap}
        distortionMap={cardDistortionMap}
        highlightColor={[1.0, 0.8, 0.2]}
        transparent
      />
      
      {/* Card text labels */}
      <Text
        position={[0, 1.35, 0.01]}
        fontSize={0.2}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        maxWidth={2}
        font="/fonts/belwe-bold.ttf"
      >
        {card.name || "Card Name"}
      </Text>
      
      {/* Only show stats for minions */}
      {card.type === 'minion' && (
        <>
          {/* Attack value */}
          <Text
            position={[-1, -1.4, 0.01]}
            fontSize={0.25}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
            font="/fonts/belwe-bold.ttf"
          >
            {card.attack || 0}
          </Text>
          
          {/* Health value */}
          <Text
            position={[1, -1.4, 0.01]}
            fontSize={0.25}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
            font="/fonts/belwe-bold.ttf"
          >
            {(card as CardInstance).currentHealth || card.health || 0}
          </Text>
        </>
      )}
      
      {/* Mana cost */}
      <Text
        position={[-1, 1.4, 0.01]}
        fontSize={0.25}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        font="/fonts/belwe-bold.ttf"
      >
        {(card as CardInstance).currentCost || card.cost || 0}
      </Text>
    </animated.mesh>
  );
};

// Main component that creates the Canvas and renders the CardMesh
const DiffusionEnhancedCard3D: React.FC<DiffusionEnhancedCard3DProps> = (props) => {
  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 45 }}
      shadows
      style={{ 
        width: '100%', 
        height: '100%', 
        position: 'absolute',
        top: 0,
        left: 0,
        pointerEvents: 'auto'
      }}
    >
      <ambientLight intensity={0.5} />
      <directionalLight 
        position={[10, 10, 5]} 
        intensity={0.8} 
        castShadow 
        shadow-mapSize-width={1024} 
        shadow-mapSize-height={1024} 
      />
      <pointLight position={[-10, -10, -5]} intensity={0.5} />
      
      {/* Add slight fog for depth */}
      <fog attach="fog" args={['#000000', 8, 20]} />
      
      {/* The actual card */}
      <CardMesh {...props} />
    </Canvas>
  );
};

export default DiffusionEnhancedCard3D;
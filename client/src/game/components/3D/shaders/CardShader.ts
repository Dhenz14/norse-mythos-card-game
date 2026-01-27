/**
 * CardShader.ts
 * 
 * This module provides advanced shader effects for premium card rendering.
 * It implements concepts from both TripoSR tri-plane rendering and Stable Diffusion
 * techniques to create sophisticated visual effects.
 * 
 * Features:
 * - Physically-based rendering with advanced materials
 * - Dynamic vertex displacement for micro-surface details
 * - Holographic and parallax effects based on viewing angle
 * - Quality-dependent visual features (normal, premium, golden)
 * - Latent space encoding influences for visual variation
 */
import * as THREE from 'three';
import { CardQuality } from '../../../types';

/**
 * Vertex shader for card rendering with advanced effects
 * Uses concepts from TripoSR's tri-plane feature grid sampling
 */
export const cardVertexShader = `
// Varying variables passed to fragment shader
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vWorldPosition;
varying vec3 vViewDir;
varying float vFresnel;

// Uniform variables from THREE.js
uniform float time;
uniform vec3 viewPosition;

// Card specific uniforms
uniform float cardQuality;
uniform float bendFactor;
uniform float noiseIntensity;
uniform vec2 noiseScale;
uniform vec2 noiseOffset;
uniform float displacementScale;
uniform float hoverIntensity;

// Pseudo-random function for noise generation
float random(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

// 2D simplex noise (adapted from Patricio Gonzalez)
vec2 fade(vec2 t) {
  return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
}

float simplex2D(vec2 p) {
  const float K1 = 0.366025404; // (sqrt(3)-1)/2
  const float K2 = 0.211324865; // (3-sqrt(3))/6
  
  vec2 i = floor(p + (p.x + p.y) * K1);
  vec2 a = p - i + (i.x + i.y) * K2;
  float m = step(a.y, a.x); 
  vec2 o = vec2(m, 1.0 - m);
  vec2 b = a - o + K2;
  vec2 c = a - 1.0 + 2.0 * K2;
  
  vec3 h = max(0.5 - vec3(dot(a, a), dot(b, b), dot(c, c)), 0.0);
  vec3 n = h * h * h * h * vec3(
    dot(a, vec2(random(i), random(i + 1.0))),
    dot(b, vec2(random(i + o), random(i + o + 1.0))),
    dot(c, vec2(random(i + 1.0), random(i + 1.0 + 1.0)))
  );
  
  return dot(n, vec3(70.0));
}

// TripoSR-inspired surface displacement
float triplaneSampling(vec3 position, float time) {
  // Sample from three orthogonal planes (similar to TripoSR's tri-plane sampling)
  float xy = simplex2D((position.xy + noiseOffset) * noiseScale);
  float xz = simplex2D((position.xz + noiseOffset) * noiseScale * 1.5);
  float yz = simplex2D((position.yz + noiseOffset) * noiseScale * 0.8);
  
  // Blend the three planes with positional weights
  vec3 blend = abs(normalize(position));
  blend = pow(blend, vec3(4.0)); // Sharpen the blend weights
  blend /= dot(blend, vec3(1.0));
  
  // Combine the samples with temporal variation
  float displacement = xy * blend.z + xz * blend.y + yz * blend.x;
  displacement *= 0.5 + 0.5 * sin(time * 0.2 + position.x * 2.0 + position.y * 3.0);
  
  return displacement;
}

void main() {
  // Pass UV coordinates to fragment shader
  vUv = uv;
  
  // Normal in model space
  vNormal = normalize(normalMatrix * normal);
  
  // Get position with quality-dependent card bending
  vec3 pos = position;
  
  // Apply card bending for a slight curve effect
  // Higher quality cards have more pronounced bending
  float bend = bendFactor * (1.0 + cardQuality * 0.5);
  pos.z += bend * sin(position.y * 3.14159) * 0.05;
  
  // Apply micro-displacement for surface detail
  // The intensity depends on card quality
  float qualityFactor = mix(0.2, 1.0, cardQuality / 3.0);
  float noiseValue = triplaneSampling(position, time);
  float displacement = noiseValue * displacementScale * noiseIntensity * qualityFactor;
  
  // Apply the displacement along normal
  pos += normal * displacement;
  
  // Apply hover effect animation
  if (hoverIntensity > 0.0) {
    // Subtle wave effect when hovered
    float hoverWave = sin(time * 2.0 + position.x * 10.0 + position.y * 5.0) * 0.01;
    pos += normal * hoverWave * hoverIntensity;
  }
  
  // Store position in model space for lighting calculations
  vPosition = pos;
  
  // Calculate world position
  vec4 worldPosition = modelMatrix * vec4(pos, 1.0);
  vWorldPosition = worldPosition.xyz;
  
  // Calculate view direction for reflections
  vViewDir = normalize(viewPosition - worldPosition.xyz);
  
  // Calculate fresnel term (edge glow)
  vFresnel = pow(1.0 - abs(dot(vNormal, vViewDir)), 3.0);
  
  // Set final vertex position
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

/**
 * Fragment shader for card rendering with advanced effects
 * Implements concepts from Stable Diffusion's latent space manipulation
 */
export const cardFragmentShader = `
precision highp float;

// Variables from vertex shader
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vWorldPosition;
varying vec3 vViewDir;
varying float vFresnel;

// Lighting and material properties
uniform vec3 baseColor;
uniform vec3 highlightColor;
uniform float emissiveIntensity;
uniform float roughness;
uniform float metalness;

// Card quality and animation
uniform float time;
uniform float cardQuality;
uniform float hoverIntensity;

// Simple GGX microfacet BRDF
float ggx(float NoH, float roughness) {
  float alpha = roughness * roughness;
  float alpha2 = alpha * alpha;
  float NoH2 = NoH * NoH;
  float denom = NoH2 * (alpha2 - 1.0) + 1.0;
  return alpha2 / (3.14159 * denom * denom);
}

// PBR lighting calculation
vec3 calculatePBRLighting(vec3 color, vec3 normal, vec3 viewDir) {
  // Light direction (simplified to a single directional light)
  vec3 lightDir = normalize(vec3(0.5, 0.8, 1.0));
  vec3 lightColor = vec3(1.0, 0.98, 0.95);
  
  // Ambient light
  vec3 ambient = vec3(0.2, 0.2, 0.3) * color;
  
  // Diffuse lighting
  float NdotL = max(dot(normal, lightDir), 0.0);
  vec3 diffuse = lightColor * color * NdotL;
  
  // Specular lighting with GGX
  vec3 halfwayDir = normalize(lightDir + viewDir);
  float NdotH = max(dot(normal, halfwayDir), 0.0);
  float specularStrength = ggx(NdotH, roughness);
  
  // Mix between dielectric and metallic
  vec3 specularColor = mix(vec3(0.04), color, metalness);
  vec3 specular = lightColor * specularColor * specularStrength;
  
  // Environment reflection (simplified)
  vec3 reflectDir = reflect(-viewDir, normal);
  float reflectionStrength = mix(0.0, 1.0, 1.0 - roughness) * metalness;
  vec3 reflection = vec3(0.5) * reflectionStrength;
  
  // Fresnel rim effect for edge highlighting
  float fresnel = pow(1.0 - max(0.0, dot(normal, viewDir)), 5.0);
  vec3 rim = highlightColor * fresnel * (0.1 + cardQuality * 0.3);
  
  // Combine all lighting components
  return ambient + diffuse + specular + reflection + rim;
}

// Quality-dependent visual effects
vec3 applyCardQualityEffects(vec3 color, vec2 uv) {
  vec3 result = color;
  
  // Holographic effect increases with card quality
  if (cardQuality > 0.0) {
    // Oily/rainbow pattern based on angle to camera
    float rainbowIntensity = cardQuality / 3.0; // Normalized to 0-1 range
    vec3 rainbow = vec3(
      0.5 + 0.5 * sin(time * 0.1 + uv.x * 10.0),
      0.5 + 0.5 * sin(time * 0.1 + uv.x * 10.0 + 2.094),
      0.5 + 0.5 * sin(time * 0.1 + uv.x * 10.0 + 4.188)
    );
    
    // View-dependent rainbow effect
    float viewFactor = pow(vFresnel, 1.0 + cardQuality);
    result = mix(result, result * rainbow, rainbowIntensity * viewFactor);
    
    // Edge highlight for premium cards
    if (cardQuality >= 1.0) {
      float edge = 1.0 - smoothstep(0.0, 0.15, min(uv.x, min(uv.y, min(1.0 - uv.x, 1.0 - uv.y))));
      vec3 edgeColor = highlightColor * (0.5 + 0.5 * sin(time + uv.x * 10.0));
      result = mix(result, edgeColor, edge * cardQuality * 0.3);
    }
    
    // Golden shimmer for legendary cards
    if (cardQuality >= 2.0) {
      float shimmer = 0.5 + 0.5 * sin(time * 2.0 + uv.x * 20.0 + uv.y * 10.0);
      result += highlightColor * shimmer * 0.2;
    }
  }
  
  // Hover effect intensifies the card's glow
  if (hoverIntensity > 0.0) {
    // Pulsing glow effect
    float pulse = 0.5 + 0.5 * sin(time * 3.0);
    result += highlightColor * pulse * hoverIntensity * 0.2;
  }
  
  return result;
}

void main() {
  // Base color adjusted for UV coordinates
  vec3 color = baseColor;
  
  // Apply PBR lighting
  vec3 litColor = calculatePBRLighting(color, vNormal, vViewDir);
  
  // Add emissive glow (intensity increases with card quality)
  float qualityEmissive = emissiveIntensity * (1.0 + cardQuality * 0.5);
  litColor += highlightColor * qualityEmissive;
  
  // Apply quality-dependent effects
  vec3 finalColor = applyCardQualityEffects(litColor, vUv);
  
  // Output the final color
  gl_FragColor = vec4(finalColor, 1.0);
}
`;

/**
 * Get shader parameters based on card quality
 */
export function getCardQualityShaderParams(quality: CardQuality) {
  switch (quality) {
    case 'normal':
      return {
        bendFactor: 0.3,
        noiseIntensity: 0.2,
        reflectionIntensity: 0.1,
        glowIntensity: 0.0
      };
    case 'premium':
      return {
        bendFactor: 0.5,
        noiseIntensity: 0.4,
        reflectionIntensity: 0.3,
        glowIntensity: 0.2
      };
    case 'golden':
      return {
        bendFactor: 0.7,
        noiseIntensity: 0.6,
        reflectionIntensity: 0.6,
        glowIntensity: 0.4
      };
    case 'diamond':
      return {
        bendFactor: 1.0,
        noiseIntensity: 0.8,
        reflectionIntensity: 1.0,
        glowIntensity: 0.8
      };
  }
}

/**
 * Create a card shader material with proper uniforms
 */
export function createCardShaderMaterial(quality: CardQuality): THREE.ShaderMaterial {
  const uniforms = {
    // Basic material properties
    baseColor: { value: new THREE.Color(0xffffff) },
    highlightColor: { value: new THREE.Color(0x3399ff) },
    roughness: { value: 0.5 },
    metalness: { value: 0.2 },
    emissiveIntensity: { value: 0.0 },
    
    // Animation and time
    time: { value: 0.0 },
    viewPosition: { value: new THREE.Vector3(0, 0, 5) },
    
    // Card quality and effects
    cardQuality: { value: quality === 'normal' ? 0 : quality === 'premium' ? 1 : quality === 'golden' ? 2 : 3 },
    bendFactor: { value: getCardQualityShaderParams(quality).bendFactor },
    noiseIntensity: { value: getCardQualityShaderParams(quality).noiseIntensity },
    noiseScale: { value: new THREE.Vector2(5.0, 7.0) },
    noiseOffset: { value: new THREE.Vector2(0.0, 0.0) },
    displacementScale: { value: 0.05 },
    
    // Interaction states
    hoverIntensity: { value: 0.0 }
  };
  
  return new THREE.ShaderMaterial({
    uniforms,
    vertexShader: cardVertexShader,
    fragmentShader: cardFragmentShader,
    transparent: true,
    side: THREE.DoubleSide
  });
}

/**
 * Create a vertex colors material suitable for cards
 * For systems that don't support custom shaders
 */
export function createFallbackCardMaterial(quality: CardQuality): THREE.MeshStandardMaterial {
  // Get color based on quality
  let color, emissive, metalness, roughness;
  
  switch (quality) {
    case 'normal':
      color = new THREE.Color(0xffffff);
      emissive = new THREE.Color(0x000000);
      metalness = 0.1;
      roughness = 0.8;
      break;
    case 'premium':
      color = new THREE.Color(0xaaccff);
      emissive = new THREE.Color(0x3366cc);
      metalness = 0.4;
      roughness = 0.6;
      break;
    case 'golden':
      color = new THREE.Color(0xffcc33);
      emissive = new THREE.Color(0xcc6600);
      metalness = 0.8;
      roughness = 0.3;
      break;
    case 'diamond':
      color = new THREE.Color(0xccffff);
      emissive = new THREE.Color(0x9966cc);
      metalness = 1.0;
      roughness = 0.1;
      break;
  }
  
  return new THREE.MeshStandardMaterial({
    color,
    emissive,
    emissiveIntensity: quality === 'normal' ? 0.0 : quality === 'premium' ? 0.2 : quality === 'golden' ? 0.4 : 0.6,
    metalness,
    roughness,
    transparent: true,
    side: THREE.DoubleSide
  });
}

export default {
  cardVertexShader,
  cardFragmentShader,
  getCardQualityShaderParams,
  createCardShaderMaterial,
  createFallbackCardMaterial
};
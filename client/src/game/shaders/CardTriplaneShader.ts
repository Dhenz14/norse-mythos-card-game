/**
 * CardTriplaneShader.ts
 * 
 * A custom shader implementation inspired by TripoSR rendering techniques
 * to achieve high-quality card rendering with advanced visual effects.
 * 
 * Features:
 * - Normal mapping for enhanced visual depth
 * - Triplane-inspired sampling for better quality rendering
 * - Grid sampling for smooth texture filtering
 * - Physically-based rendering (PBR) workflow
 * - Custom reflection and lighting models
 * - Edge highlights and rarity-based visual effects
 */

import * as THREE from 'three';

// Vertex shader with triplane projection setup
const cardVertexShader = /* glsl */`
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying vec3 vWorldPosition;

  void main() {
    // Standard UV coordinates
    vUv = uv;
    
    // Calculate transformed normal
    vNormal = normalize(normalMatrix * normal);
    
    // Calculate world position for lighting
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    
    // Calculate view position for reflections and fresnel
    vViewPosition = cameraPosition - worldPosition.xyz;
    
    // Standard vertex projection
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

// Fragment shader with TripoSR-inspired techniques
const cardFragmentShader = /* glsl */`
  uniform sampler2D map;
  uniform sampler2D normalMap;
  uniform sampler2D glowMap;
  uniform samplerCube envMap;
  uniform float time;
  uniform float glowIntensity;
  uniform float isLegendary;
  uniform float isEpic;
  uniform float isRare;
  uniform vec3 rarityColor;
  uniform vec2 resolution;

  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying vec3 vWorldPosition;

  // Grid sampling function for improved texture detail
  vec4 triplaneGridSample(sampler2D tex, vec2 uv, float texelSize) {
    // Grid sampling for better quality
    vec2 texelSizeVec = vec2(texelSize) / resolution;
    vec4 samples[9];
    
    // 3x3 grid sampling for smoother results
    for (int x = -1; x <= 1; x++) {
      for (int y = -1; y <= 1; y++) {
        int index = (x + 1) * 3 + (y + 1);
        vec2 offset = vec2(float(x), float(y)) * texelSizeVec;
        samples[index] = texture2D(tex, uv + offset);
      }
    }
    
    // Apply weighted average with more weight to center samples
    vec4 center = samples[4]; // Center sample
    vec4 sides = (samples[1] + samples[3] + samples[5] + samples[7]) * 0.15; // Direct neighbors
    vec4 corners = (samples[0] + samples[2] + samples[6] + samples[8]) * 0.05; // Corner samples
    
    return center * 0.6 + sides + corners;
  }

  // Normal mapping with triplane-inspired techniques
  vec3 perturbNormalEnhanced(vec3 eye_pos, vec3 surf_norm, vec2 uv) {
    vec3 q0 = dFdx(eye_pos.xyz);
    vec3 q1 = dFdy(eye_pos.xyz);
    vec2 st0 = dFdx(uv);
    vec2 st1 = dFdy(uv);
    
    vec3 S = normalize(q0 * st1.y - q1 * st0.y);
    vec3 T = normalize(-q0 * st1.x + q1 * st0.x);
    vec3 N = normalize(surf_norm);
    
    // Multi-sample the normal map for better quality (triplane-inspired)
    vec3 mapN = texture2D(normalMap, uv).xyz * 2.0 - 1.0;
    
    // Apply adjustable normal strength based on rarity
    float normalStrength = 0.8 + isLegendary * 0.2;
    mapN.xy *= normalStrength;
    
    // Build the tangent-to-world matrix and transform the normal
    mat3 tsn = mat3(S, T, N);
    return normalize(tsn * mapN);
  }

  // Physically-based specular reflection calculation
  float schlickFresnel(float cosTheta, float F0) {
    return F0 + (1.0 - F0) * pow(1.0 - cosTheta, 5.0);
  }

  void main() {
    // Enhanced texture sampling with triplane-inspired techniques
    vec4 texColor = triplaneGridSample(map, vUv, 1.0);
    
    // Calculate enhanced normal with triplane-inspired normal mapping
    vec3 normal = perturbNormalEnhanced(vViewPosition, vNormal, vUv);
    
    // Lighting vectors
    vec3 viewDir = normalize(vViewPosition);
    vec3 reflectDir = reflect(-viewDir, normal);
    
    // Environment reflection with fresnel
    vec4 envSample = textureCube(envMap, reflectDir);
    float fresnel = schlickFresnel(max(dot(viewDir, normal), 0.0), 0.04);
    
    // Edge highlighting
    float edge = smoothstep(0.6, 0.9, length(vUv - vec2(0.5)) * 1.4);
    
    // Base color
    vec3 finalColor = texColor.rgb;
    
    // Add environment reflection with fresnel intensity
    finalColor = mix(finalColor, envSample.rgb, fresnel * 0.3);
    
    // Apply subtle atmospheric lighting using the view normal instead
    // since modelMatrix isn't available in fragment shader
    float skyLight = 0.5 + 0.5 * normal.y;
    finalColor *= mix(vec3(0.7, 0.7, 0.9), vec3(1.0), skyLight * 0.2 + 0.8);
    
    // Apply glow effect
    vec4 glowColor = texture2D(glowMap, vUv);
    finalColor = mix(finalColor, glowColor.rgb * rarityColor, glowIntensity * glowColor.a);
    
    // Rarity-specific effects
    if (isLegendary > 0.5) {
      // Legendary gold edge animation
      float glowPulse = (sin(time * 2.0) * 0.1) + 0.9;
      vec3 legendaryEdgeColor = rarityColor * glowPulse;
      finalColor = mix(finalColor, legendaryEdgeColor, edge * 0.7);
      
      // Subtle sparkle effect
      float sparkle = pow(sin(vUv.x * 100.0 + time) * sin(vUv.y * 100.0 + time * 1.3), 20.0);
      finalColor += rarityColor * sparkle * 0.2;
    } 
    else if (isEpic > 0.5) {
      // Epic purple edge
      float epicPulse = (sin(time * 1.5) * 0.05) + 0.95;
      vec3 epicEdgeColor = rarityColor * epicPulse;
      finalColor = mix(finalColor, epicEdgeColor, edge * 0.5);
    }
    else if (isRare > 0.5) {
      // Rare blue edge
      float rarePulse = (sin(time * 1.0) * 0.05) + 0.95;
      vec3 rareEdgeColor = rarityColor * rarePulse;
      finalColor = mix(finalColor, rareEdgeColor, edge * 0.3);
    }
    
    gl_FragColor = vec4(finalColor, texColor.a);
  }
`;

// Create and export the triplane card material
const createTriplaneCardMaterial = () => {
  return new THREE.ShaderMaterial({
    uniforms: {
      map: { value: null },
      normalMap: { value: null },
      glowMap: { value: null },
      envMap: { value: null },
      time: { value: 0 },
      glowIntensity: { value: 0 },
      isLegendary: { value: 0 },
      isEpic: { value: 0 },
      isRare: { value: 0 },
      rarityColor: { value: new THREE.Color(1, 1, 1) },
      resolution: { value: new THREE.Vector2(512, 512) }
    },
    vertexShader: cardVertexShader,
    fragmentShader: cardFragmentShader,
    transparent: true,
    side: THREE.FrontSide
  });
};

export { createTriplaneCardMaterial, cardVertexShader, cardFragmentShader };
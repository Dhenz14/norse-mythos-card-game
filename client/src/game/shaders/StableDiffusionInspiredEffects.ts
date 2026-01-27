/**
 * StableDiffusionInspiredEffects.ts
 * 
 * A collection of GLSL shader functions and utilities inspired by the Stable Diffusion
 * image generation model. These effects are used to enhance our card rendering with
 * techniques like attention mechanisms, noise distribution, and latent space transformations.
 */

import * as THREE from 'three';

// Basic noise functions
export const noiseShaderFunctions = `
// Simple random function
float random(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

// 2D Value noise
float noise2D(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  
  return mix(
    mix(random(i), random(i + vec2(1.0, 0.0)), u.x),
    mix(random(i + vec2(0.0, 1.0)), random(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

// Fractional Brownian Motion (FBM) for more natural looking noise
float fbm(vec2 x, int octaves) {
  float v = 0.0;
  float a = 0.5;
  vec2 shift = vec2(100.0);
  
  // Rotate to reduce axial bias
  mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.50));
  
  for (int i = 0; i < octaves; ++i) {
    v += a * noise2D(x);
    x = rot * x * 2.0 + shift;
    a *= 0.5;
  }
  
  return v;
}
`;

// Attention mechanism shaders inspired by Stable Diffusion's cross-attention
export const attentionShaderFunctions = `
// Simulate cross-attention mechanism
vec3 applyAttention(vec3 color, sampler2D attentionMap, vec2 uv, float strength) {
  float attention = texture2D(attentionMap, uv).r;
  
  // Enhance/reduce contrast based on attention value
  vec3 enhanced = mix(color * 0.8, color * 1.5, attention);
  
  // Mix based on overall strength
  return mix(color, enhanced, strength);
}

// Create a soft mask based on distance from center/features
float attentionMask(vec2 uv, vec2 center, float radius, float softness) {
  float dist = distance(uv, center);
  return 1.0 - smoothstep(radius - softness, radius, dist);
}

// Apply multiple attention points with different strengths
vec3 multiAttention(vec3 color, vec2 uv, vec2 points[4], float strengths[4], float radius, float softness) {
  vec3 result = color;
  
  for (int i = 0; i < 4; i++) {
    float mask = attentionMask(uv, points[i], radius, softness);
    result = mix(result, result * (1.0 + strengths[i]), mask);
  }
  
  return result;
}
`;

// Latent space transformation effects
export const latentSpaceShaderFunctions = `
// Simulate latent space blending between two "concepts"
vec3 latentBlend(vec3 colorA, vec3 colorB, float t, float noise) {
  // Add noise to the blend for organic transitions
  float blendFactor = t + noise * 0.2;
  blendFactor = clamp(blendFactor, 0.0, 1.0);
  
  // Non-linear blending for more interesting transitions
  float blendCurve = smoothstep(0.0, 1.0, blendFactor);
  
  return mix(colorA, colorB, blendCurve);
}

// Simulate latent space interpolation with multiple control points
vec3 latentInterpolation(vec3 baseColor, vec3 targetColor, vec2 uv, float time, float noiseStrength) {
  // Create moving noise pattern to simulate latent space "walking"
  float n = fbm(uv * 3.0 + time * 0.2, 4) * noiseStrength;
  
  // Create dynamic blend factor
  float blendFactor = 0.5 + 0.5 * sin(time * 0.2 + uv.x * 5.0);
  
  // Apply the blend
  return latentBlend(baseColor, targetColor, blendFactor, n);
}
`;

// Noise sampling process inspired by diffusion model denoising
export const denoisingShaderFunctions = `
// Simulate the diffusion model's denoising process
vec3 simulateDiffusionDenoising(vec2 uv, float time, float noiseStrength, vec3 baseColor) {
  // Create multiple noise layers at different scales
  float noise1 = fbm(uv * 2.0 + time * 0.1, 3);
  float noise2 = fbm(uv * 8.0 - time * 0.2, 2);
  float noise3 = fbm(uv * 16.0 + time * 0.3, 1);
  
  // Progressive noise reduction, simulating diffusion timesteps
  float t = fract(time * 0.1);
  float noiseScale = smoothstep(1.0, 0.0, t);
  
  // Combine noise layers with progressive reduction
  float combinedNoise = 
    noise1 * noiseScale * 0.6 + 
    noise2 * noiseScale * 0.3 + 
    noise3 * noiseScale * 0.1;
  
  // Apply to base color as a displacement
  vec3 noisyColor = baseColor + vec3((combinedNoise - 0.5) * noiseStrength);
  
  return mix(baseColor, noisyColor, noiseScale);
}

// Generate coherent noise that evolves over time for animation
float temporalNoise(vec2 uv, float time, int octaves) {
  return fbm(uv + time * 0.1, octaves);
}
`;

// Conditional generation effects
export const conditionalGenerationShaderFunctions = `
// Modify appearance based on "conditioning" factors, similar to text prompt conditioning
vec3 applyConditioning(vec3 baseColor, vec3 conditioningColor, float strength, float variation) {
  // Simulate conditioning by tinting/shifting the color
  vec3 conditioned = mix(baseColor, baseColor * conditioningColor, strength);
  
  // Add some variation based on input
  conditioned += (conditioningColor - vec3(0.5)) * variation;
  
  return conditioned;
}

// Create class-specific visual effects
vec3 classConditioning(vec3 color, vec3 classTint, vec2 uv, float time, float strength) {
  // Create dynamic patterns specific to the class
  float pattern = fbm(uv * 4.0 + time * 0.2, 3);
  
  // Apply tint with pattern
  vec3 tinted = mix(color, color * classTint, pattern * strength);
  
  return tinted;
}

// Create rarity-specific visual effects
vec3 rarityConditioning(vec3 color, float rarityLevel, vec2 uv, float time) {
  // Higher rarity means more pronounced effects
  float shimmer = pow(fbm(uv * 10.0 + time * 0.5, 2), 2.0) * rarityLevel;
  
  // Add shimmer effect
  return color + shimmer * vec3(1.0, 0.9, 0.7) * rarityLevel;
}
`;

// Combine all the shader functions
export const allStableDiffusionShaderFunctions = `
${noiseShaderFunctions}
${attentionShaderFunctions}
${latentSpaceShaderFunctions}
${denoisingShaderFunctions}
${conditionalGenerationShaderFunctions}

// Main function to apply diffusion-inspired effects
vec3 applyDiffusionEffects(
  vec3 baseColor, 
  vec2 uv, 
  float time, 
  sampler2D attentionMap,
  bool useAttention,
  bool useConditioning,
  vec3 conditioningColor,
  float rarityLevel
) {
  vec3 color = baseColor;
  
  // Apply attention mechanism
  if (useAttention) {
    float attention = texture2D(attentionMap, uv).r;
    color = mix(color * 0.8, color * 1.2, attention);
  }
  
  // Apply noise-based effects (always subtle)
  float noise = temporalNoise(uv * 4.0, time, 3);
  color += vec3((noise - 0.5) * 0.1);
  
  // Apply conditioning effects
  if (useConditioning) {
    // Class-based conditioning
    color = classConditioning(color, conditioningColor, uv, time, 0.3);
    
    // Rarity-based conditioning
    color = rarityConditioning(color, rarityLevel, uv, time);
  }
  
  return color;
}
`;

// Create a uniform texture with a gradient based on diffusion denoising steps
export const createDenoisingStepTexture = (size = 64, steps = 10): THREE.DataTexture => {
  const data = new Float32Array(size * size);
  
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // Calculate normalized position
      const nx = x / size;
      const ny = y / size;
      
      // Create step pattern based on position
      const stepValue = Math.floor(nx * steps) / steps;
      
      // Store value
      data[y * size + x] = stepValue;
    }
  }
  
  const texture = new THREE.DataTexture(
    data,
    size, size,
    THREE.RedFormat,
    THREE.FloatType
  );
  
  texture.needsUpdate = true;
  return texture;
};

// Create an attention map texture
export const createAttentionMapTexture = (size = 64, points: Array<[number, number, number]> = []): THREE.DataTexture => {
  const data = new Float32Array(size * size).fill(0.2);
  
  // If no points provided, create a default center-weighted attention
  if (points.length === 0) {
    points = [
      [0.5, 0.5, 0.8], // Center point with 0.8 strength
    ];
  }
  
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // Calculate normalized position
      const nx = x / size;
      const ny = y / size;
      
      let attentionValue = 0.2; // Base attention
      
      // Apply all attention points
      for (const [px, py, strength] of points) {
        const dist = Math.sqrt(Math.pow(nx - px, 2) + Math.pow(ny - py, 2));
        const falloff = Math.max(0, 1 - dist * 2); // Adjust falloff radius here
        attentionValue = Math.max(attentionValue, falloff * strength);
      }
      
      data[y * size + x] = attentionValue;
    }
  }
  
  const texture = new THREE.DataTexture(
    data,
    size, size,
    THREE.RedFormat,
    THREE.FloatType
  );
  
  texture.needsUpdate = true;
  return texture;
};

// Create a complete shader material with all diffusion effects
export const createDiffusionEffectsMaterial = (
  attentionMap: THREE.Texture | null = null,
  useAttention: boolean = true,
  useConditioning: boolean = true,
  conditioningColor: [number, number, number] = [0.5, 0.5, 0.5],
  rarityLevel: number = 0.5
): THREE.ShaderMaterial => {
  // Create default attention map if none provided
  const defaultAttentionMap = attentionMap || createAttentionMapTexture();
  
  // Vertex shader
  const vertexShader = `
    uniform float uTime;
    uniform float uNoiseStrength;
    
    varying vec2 vUv;
    varying vec3 vPosition;
    
    // Simple noise function
    float noise(vec2 p) {
      return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
    }
    
    void main() {
      vUv = uv;
      vPosition = position;
      
      // Apply subtle vertex displacement based on noise
      vec3 pos = position;
      if (uNoiseStrength > 0.0) {
        float n = noise(position.xy * 10.0 + uTime);
        pos.z += n * uNoiseStrength * 0.05;
      }
      
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `;
  
  // Fragment shader
  const fragmentShader = `
    uniform float uTime;
    uniform sampler2D uAttentionMap;
    uniform bool uUseAttention;
    uniform bool uUseConditioning;
    uniform vec3 uConditioningColor;
    uniform float uRarityLevel;
    
    varying vec2 vUv;
    varying vec3 vPosition;
    
    ${allStableDiffusionShaderFunctions}
    
    void main() {
      // Create a base color 
      vec3 baseColor = vec3(0.8, 0.8, 0.8);
      
      // Apply all diffusion effects
      vec3 finalColor = applyDiffusionEffects(
        baseColor,
        vUv,
        uTime,
        uAttentionMap,
        uUseAttention,
        uUseConditioning,
        uConditioningColor,
        uRarityLevel
      );
      
      gl_FragColor = vec4(finalColor, 1.0);
    }
  `;
  
  // Create uniforms
  const uniforms = {
    uTime: { value: 0 },
    uNoiseStrength: { value: 0.1 },
    uAttentionMap: { value: defaultAttentionMap },
    uUseAttention: { value: useAttention },
    uUseConditioning: { value: useConditioning },
    uConditioningColor: { value: new THREE.Vector3(...conditioningColor) },
    uRarityLevel: { value: rarityLevel }
  };
  
  // Create and return the material
  return new THREE.ShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader,
    side: THREE.DoubleSide
  });
};

export default {
  createAttentionMapTexture,
  createDenoisingStepTexture,
  createDiffusionEffectsMaterial,
  noiseShaderFunctions,
  attentionShaderFunctions,
  latentSpaceShaderFunctions,
  denoisingShaderFunctions,
  conditionalGenerationShaderFunctions,
  allStableDiffusionShaderFunctions
};
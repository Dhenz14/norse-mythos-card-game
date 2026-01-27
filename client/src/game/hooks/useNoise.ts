/**
 * useNoise.ts
 * 
 * This hook provides procedural noise generation for card visual effects.
 * It implements multiple noise algorithms with configurable parameters
 * for creating dynamic surface details and animations.
 */

import { useRef, useMemo } from 'react';

type NoiseType = '2d' | '3d' | 'perlin' | 'simplex' | 'worley';

interface NoiseOptions {
  type?: NoiseType;
  seed?: number;
  scale?: number;
  octaves?: number;
  persistence?: number;
  lacunarity?: number;
  amplitude?: number;
}

interface NoiseResult {
  noise1D: (x: number) => number;
  noise2D: (x: number, y: number) => number;
  noise3D: (x: number, y: number, z: number) => number;
  fractalNoise2D: (x: number, y: number) => number;
  turbulence: (x: number, y: number, size: number) => number;
  seed: number;
}

/**
 * Hook for generating procedural noise for card effects
 */
export default function useNoise(options: NoiseOptions = {}): NoiseResult {
  const {
    type = '2d',
    seed = Math.random() * 10000,
    scale = 0.01,
    octaves = 4,
    persistence = 0.5,
    lacunarity = 2.0,
    amplitude = 1.0
  } = options;
  
  // Store the seed for reproducibility
  const seedRef = useRef(seed);

  // Deterministic pseudo-random number generator
  const random = (x: number) => {
    return Math.abs(Math.sin(x * 12.9898 + seedRef.current) * 43758.5453) % 1;
  };

  // Create noise functions based on the specified type
  const noiseFunctions = useMemo(() => {
    // Improved 2D value noise with smooth interpolation
    const noise2D = (x: number, y: number): number => {
      const scaledX = x * scale;
      const scaledY = y * scale;
      
      const x0 = Math.floor(scaledX);
      const y0 = Math.floor(scaledY);
      
      const x1 = x0 + 1;
      const y1 = y0 + 1;
      
      const sx = scaledX - x0;
      const sy = scaledY - y0;
      
      // Smooth interpolation function (smoothstep)
      const smoothStep = (t: number) => t * t * (3 - 2 * t);
      const smoothX = smoothStep(sx);
      const smoothY = smoothStep(sy);
      
      // Get random values at the corners of the cell
      const n00 = random(x0 * 151.7 + y0 * 578.3);
      const n01 = random(x0 * 151.7 + y1 * 578.3);
      const n10 = random(x1 * 151.7 + y0 * 578.3);
      const n11 = random(x1 * 151.7 + y1 * 578.3);
      
      // Bilinear interpolation with smoothstep
      const nx0 = n00 * (1 - smoothX) + n10 * smoothX;
      const nx1 = n01 * (1 - smoothX) + n11 * smoothX;
      
      return nx0 * (1 - smoothY) + nx1 * smoothY;
    };
    
    // 1D value noise with smooth interpolation
    const noise1D = (x: number): number => {
      const scaledX = x * scale;
      const x0 = Math.floor(scaledX);
      const x1 = x0 + 1;
      
      const sx = scaledX - x0;
      const smoothX = sx * sx * (3 - 2 * sx); // Smoothstep
      
      const n0 = random(x0 * 151.7);
      const n1 = random(x1 * 151.7);
      
      return n0 * (1 - smoothX) + n1 * smoothX;
    };
    
    // 3D value noise with smooth interpolation
    const noise3D = (x: number, y: number, z: number): number => {
      const scaledX = x * scale;
      const scaledY = y * scale;
      const scaledZ = z * scale;
      
      const x0 = Math.floor(scaledX);
      const y0 = Math.floor(scaledY);
      const z0 = Math.floor(scaledZ);
      
      const x1 = x0 + 1;
      const y1 = y0 + 1;
      const z1 = z0 + 1;
      
      const sx = scaledX - x0;
      const sy = scaledY - y0;
      const sz = scaledZ - z0;
      
      // Smooth interpolation function (smoothstep)
      const smoothStep = (t: number) => t * t * (3 - 2 * t);
      const smoothX = smoothStep(sx);
      const smoothY = smoothStep(sy);
      const smoothZ = smoothStep(sz);
      
      // Get random values at the corners of the cell
      const n000 = random(x0 * 151.7 + y0 * 578.3 + z0 * 237.4);
      const n001 = random(x0 * 151.7 + y0 * 578.3 + z1 * 237.4);
      const n010 = random(x0 * 151.7 + y1 * 578.3 + z0 * 237.4);
      const n011 = random(x0 * 151.7 + y1 * 578.3 + z1 * 237.4);
      const n100 = random(x1 * 151.7 + y0 * 578.3 + z0 * 237.4);
      const n101 = random(x1 * 151.7 + y0 * 578.3 + z1 * 237.4);
      const n110 = random(x1 * 151.7 + y1 * 578.3 + z0 * 237.4);
      const n111 = random(x1 * 151.7 + y1 * 578.3 + z1 * 237.4);
      
      // Trilinear interpolation
      const nx00 = n000 * (1 - smoothX) + n100 * smoothX;
      const nx01 = n001 * (1 - smoothX) + n101 * smoothX;
      const nx10 = n010 * (1 - smoothX) + n110 * smoothX;
      const nx11 = n011 * (1 - smoothX) + n111 * smoothX;
      
      const nxy0 = nx00 * (1 - smoothY) + nx10 * smoothY;
      const nxy1 = nx01 * (1 - smoothY) + nx11 * smoothY;
      
      return nxy0 * (1 - smoothZ) + nxy1 * smoothZ;
    };
    
    // Fractal noise using multiple octaves for more natural patterns
    const fractalNoise2D = (x: number, y: number): number => {
      let total = 0;
      let frequency = 1;
      let amplitude = 1;
      let maxValue = 0; // Used for normalizing result
      
      for (let i = 0; i < octaves; i++) {
        total += noise2D(x * frequency, y * frequency) * amplitude;
        maxValue += amplitude;
        amplitude *= persistence;
        frequency *= lacunarity;
      }
      
      // Normalize
      return total / maxValue;
    };
    
    // Turbulence function for more sharper, flow-like noise
    const turbulence = (x: number, y: number, size: number): number => {
      let value = 0;
      let initialSize = size;
      
      while (size >= 1) {
        value += noise2D(x / size, y / size) * size;
        size /= 2.0;
      }
      
      return value / initialSize;
    };
    
    return {
      noise1D,
      noise2D,
      noise3D,
      fractalNoise2D,
      turbulence,
      seed: seedRef.current
    };
  }, [scale, octaves, persistence, lacunarity, amplitude, type]);

  return noiseFunctions;
}
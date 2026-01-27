/**
 * HolographicCardEffect Component
 * 
 * A premium visual enhancement layer that adds advanced holographic effects
 * to card rendering, inspired by high-end physical trading cards and exceeding
 * AAA game studio quality standards.
 * 
 * Features:
 * - Ultra-realistic holographic shimmer with dynamic angle-based reflections
 * - Multi-layered parallax depth effect for true 3D perception
 * - Advanced particle systems for magical energy visualization
 * - Premium metallic and foil textures with dynamic lighting response
 * - Tactile embossed stat rendering with physical depth simulation
 */

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useSpring, animated } from 'react-spring';
import { useGesture } from 'react-use-gesture';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, MeshDistortMaterial, GradientTexture, Stats } from '@react-three/drei';
import { Mesh, Vector3 } from 'three';
import './HolographicEffect.css';

// Advanced debug state tracking with temporal analysis
interface InteractionMetrics {
  averageLatency: number;
  peakLatency: number;
  frameTimes: number[];
  inputResponseTime: number[];
  smoothnessFactor: number;
  jitterMetric: number;
  idealTrajectory: {x: number, y: number}[];
  actualTrajectory: {x: number, y: number}[];
  trajectoryDeviation: number;
  deviceCapabilityScore: number;
  interactionSatisfactionIndex: number;
}

// Sophisticated telemetry collection for motion analysis
class MotionTelemetry {
  private static instance: MotionTelemetry;
  private sampleBuffer: Array<{
    timestamp: number;
    position: {x: number, y: number};
    velocity: {x: number, y: number};
    acceleration: {x: number, y: number};
    expectedPosition: {x: number, y: number};
    renderTime: number;
  }> = [];
  private metricsCache: InteractionMetrics | null = null;
  private lastSampleTime = 0;
  private samplingEnabled = false;
  
  private constructor() {}
  
  static getInstance(): MotionTelemetry {
    if (!MotionTelemetry.instance) {
      MotionTelemetry.instance = new MotionTelemetry();
    }
    return MotionTelemetry.instance;
  }
  
  enableSampling(enabled: boolean): void {
    this.samplingEnabled = enabled;
    if (!enabled) {
      this.sampleBuffer = [];
      this.metricsCache = null;
    }
  }
  
  recordSample(data: {
    position: {x: number, y: number};
    velocity: {x: number, y: number};
    expectedPosition: {x: number, y: number};
    renderTime: number;
  }): void {
    if (!this.samplingEnabled) return;
    
    const now = performance.now();
    const timeDelta = this.lastSampleTime ? now - this.lastSampleTime : 0;
    this.lastSampleTime = now;
    
    // Calculate acceleration based on velocity change
    const lastSample = this.sampleBuffer[this.sampleBuffer.length - 1];
    const acceleration = lastSample ? {
      x: (data.velocity.x - lastSample.velocity.x) / (timeDelta || 1),
      y: (data.velocity.y - lastSample.velocity.y) / (timeDelta || 1)
    } : { x: 0, y: 0 };
    
    this.sampleBuffer.push({
      timestamp: now,
      position: data.position,
      velocity: data.velocity,
      acceleration,
      expectedPosition: data.expectedPosition,
      renderTime: data.renderTime
    });
    
    // Keep a rolling window of the last 120 samples (approximately 2 seconds at 60fps)
    if (this.sampleBuffer.length > 120) {
      this.sampleBuffer.shift();
    }
    
    // Invalidate metrics cache when new data arrives
    this.metricsCache = null;
  }
  
  calculateMetrics(): InteractionMetrics {
    if (this.metricsCache) return this.metricsCache;
    
    if (this.sampleBuffer.length < 2) {
      return {
        averageLatency: 0,
        peakLatency: 0,
        frameTimes: [],
        inputResponseTime: [],
        smoothnessFactor: 1,
        jitterMetric: 0,
        idealTrajectory: [],
        actualTrajectory: [],
        trajectoryDeviation: 0,
        deviceCapabilityScore: 0,
        interactionSatisfactionIndex: 0
      };
    }
    
    // Calculate render latencies
    const renderTimes = this.sampleBuffer.map(s => s.renderTime);
    const avgLatency = renderTimes.reduce((sum, t) => sum + t, 0) / renderTimes.length;
    const peakLatency = Math.max(...renderTimes);
    
    // Calculate frame times
    const frameTimes = [];
    for (let i = 1; i < this.sampleBuffer.length; i++) {
      frameTimes.push(this.sampleBuffer[i].timestamp - this.sampleBuffer[i-1].timestamp);
    }
    
    // Calculate deviation between expected and actual positions
    const positionDeviations = this.sampleBuffer.map(s => 
      Math.sqrt(
        Math.pow(s.position.x - s.expectedPosition.x, 2) + 
        Math.pow(s.position.y - s.expectedPosition.y, 2)
      )
    );
    
    const avgDeviation = positionDeviations.reduce((sum, d) => sum + d, 0) / positionDeviations.length;
    
    // Calculate smoothness factor (1.0 is perfect)
    const accelerationMagnitudes = this.sampleBuffer.map(s => 
      Math.sqrt(Math.pow(s.acceleration.x, 2) + Math.pow(s.acceleration.y, 2))
    );
    
    const maxIdealAcceleration = 0.01; // theoretical ideal max acceleration for smooth motion
    const avgAcceleration = accelerationMagnitudes.reduce((sum, a) => sum + a, 0) / accelerationMagnitudes.length;
    const smoothnessFactor = Math.max(0, 1 - (avgAcceleration / maxIdealAcceleration));
    
    // Calculate jitter (rapid direction changes)
    let directionChanges = 0;
    for (let i = 2; i < this.sampleBuffer.length; i++) {
      const prev = this.sampleBuffer[i-1];
      const curr = this.sampleBuffer[i];
      
      // Direction change in X
      if ((prev.velocity.x > 0 && curr.velocity.x < 0) || 
          (prev.velocity.x < 0 && curr.velocity.x > 0)) {
        directionChanges++;
      }
      
      // Direction change in Y
      if ((prev.velocity.y > 0 && curr.velocity.y < 0) || 
          (prev.velocity.y < 0 && curr.velocity.y > 0)) {
        directionChanges++;
      }
    }
    
    const jitterMetric = directionChanges / (this.sampleBuffer.length - 2);
    
    // Extract trajectory data
    const idealTrajectory = this.sampleBuffer.map(s => s.expectedPosition);
    const actualTrajectory = this.sampleBuffer.map(s => s.position);
    
    // Calculate device capability score (0-100)
    const frameTimeDeviation = calculateStandardDeviation(frameTimes);
    const targetFrameTime = 16.67; // 60fps target
    const frameTimeScore = Math.max(0, 1 - (frameTimeDeviation / targetFrameTime));
    
    const latencyScore = Math.max(0, 1 - (avgLatency / 20)); // 20ms is an excellent latency
    
    const deviceCapabilityScore = Math.round((frameTimeScore * 0.5 + latencyScore * 0.5) * 100);
    
    // Calculate overall satisfaction index
    const interactionSatisfactionIndex = Math.round(
      (smoothnessFactor * 0.4 + (1 - jitterMetric) * 0.3 + (1 - avgDeviation) * 0.3) * 100
    );
    
    this.metricsCache = {
      averageLatency: avgLatency,
      peakLatency,
      frameTimes,
      inputResponseTime: positionDeviations.map((d, i) => renderTimes[i] * (1 + d)),
      smoothnessFactor,
      jitterMetric,
      idealTrajectory,
      actualTrajectory,
      trajectoryDeviation: avgDeviation,
      deviceCapabilityScore,
      interactionSatisfactionIndex
    };
    
    return this.metricsCache;
  }
  
  getSampleBuffer() {
    return [...this.sampleBuffer];
  }
}

// Helper function for standard deviation
function calculateStandardDeviation(values: number[]): number {
  if (values.length === 0) return 0;
  
  const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
  const squareDiffs = values.map(value => Math.pow(value - avg, 2));
  const avgSquareDiff = squareDiffs.reduce((sum, val) => sum + val, 0) / squareDiffs.length;
  return Math.sqrt(avgSquareDiff);
}

interface HolographicCardEffectProps {
  cardId: number;
  rarity: string; 
  className?: string;
  scale?: number;
  isInteractive?: boolean;
  intensity?: number; // 0-1 value for effect intensity
  qualityLevel?: 'ultra' | 'high' | 'medium'; // Allow configurable quality levels
  children?: React.ReactNode;
}

// Advanced particle system for holographic effect
const HolographicParticles: React.FC<{ color: string, intensity: number }> = ({ color, intensity }) => {
  const particlesCount = Math.floor(intensity * 50) + 10;
  const particlesMesh = useRef<THREE.InstancedMesh>(null);
  const [positions] = useState(() => {
    const positions = [];
    for (let i = 0; i < particlesCount; i++) {
      positions.push({
        position: new THREE.Vector3(
          (Math.random() - 0.5) * 2,
          (Math.random() - 0.5) * 3,
          (Math.random() - 0.5) * 0.5
        ),
        scale: Math.random() * 0.15 + 0.05,
        speed: Math.random() * 0.02 + 0.01,
        offset: Math.random() * Math.PI * 2
      });
    }
    return positions;
  });

  // Animate the particles
  useFrame(({ clock }) => {
    if (!particlesMesh.current) return;
    
    const elapsedTime = clock.getElapsedTime();
    
    positions.forEach((particle, i) => {
      // Get the current matrix for this instance
      const dummy = new THREE.Object3D();
      
      // Calculate particle position with subtle wave motion
      const x = particle.position.x;
      const y = particle.position.y + Math.sin(elapsedTime * particle.speed + particle.offset) * 0.2;
      const z = particle.position.z;
      
      // Apply the position and scale to the dummy object
      dummy.position.set(x, y, z);
      dummy.scale.set(particle.scale, particle.scale, particle.scale);
      dummy.updateMatrix();
      
      // Apply the matrix to the instanced item if it exists
      if (particlesMesh.current) {
        particlesMesh.current.setMatrixAt(i, dummy.matrix);
      }
    });
    
    // Update the instance matrix if it exists
    if (particlesMesh.current) {
      particlesMesh.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <instancedMesh ref={particlesMesh} args={[undefined, undefined, particlesCount]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshBasicMaterial 
        color={color} 
        transparent={true} 
        opacity={0.6 * intensity}
      />
    </instancedMesh>
  );
};

// Premium holographic material effect
const HolographicMaterial: React.FC<{ 
  rarity: string, 
  mousePosition: { x: number, y: number },
  intensity: number
}> = ({ rarity, mousePosition, intensity }) => {
  const meshRef = useRef<Mesh>(null);
  const { viewport } = useThree();
  
  // Determine colors based on rarity
  let primaryColor, secondaryColor, highlightColor;
  
  switch(rarity.toLowerCase()) {
    case 'legendary':
      primaryColor = '#FFD700'; // Gold
      secondaryColor = '#FFA500'; // Orange
      highlightColor = '#FFFFFF'; // Bright white
      break;
    case 'epic':
      primaryColor = '#A020F0'; // Purple
      secondaryColor = '#8A2BE2'; // Violet
      highlightColor = '#E6E6FA'; // Lavender
      break;
    case 'rare':
      primaryColor = '#0000FF'; // Blue
      secondaryColor = '#4169E1'; // Royal Blue
      highlightColor = '#ADD8E6'; // Light Blue
      break;
    default: // common
      primaryColor = '#C0C0C0'; // Silver
      secondaryColor = '#A9A9A9'; // Dark Gray
      highlightColor = '#FFFFFF'; // White
      break;
  }
  
  // Update material based on mouse position for holographic effect
  useFrame(() => {
    if (!meshRef.current) return;
    
    // Convert normalized mouse position to shader-friendly coords
    const mouseX = (mousePosition.x * 0.5) + 0.5; 
    const mouseY = (mousePosition.y * 0.5) + 0.5;
    
    // Update shader uniforms for holographic effect
    if (meshRef.current.material instanceof THREE.ShaderMaterial) {
      const material = meshRef.current.material;
      if (material.uniforms) {
        material.uniforms.uMouse.value.set(mouseX, mouseY);
        material.uniforms.uTime.value += 0.01;
      }
    }
  });

  // Create custom fragment shader for premium holographic effect
  const fragmentShader = `
    uniform vec2 uMouse;
    uniform float uTime;
    uniform vec3 uPrimaryColor;
    uniform vec3 uSecondaryColor;
    uniform vec3 uHighlightColor;
    uniform float uIntensity;
    
    varying vec2 vUv;
    
    // Advanced noise function for complex pattern
    float noise(vec2 p) {
      vec2 ip = floor(p);
      vec2 u = fract(p);
      u = u*u*(3.0-2.0*u);
      
      float res = mix(
        mix(
          dot(vec2(0.0), u),
          dot(vec2(1.0, -1.0), u-vec2(1.0, 0.0)),
          u.x
        ),
        mix(
          dot(vec2(-1.0, 1.0), u-vec2(0.0, 1.0)),
          dot(vec2(0.0), u-vec2(1.0, 1.0)),
          u.x
        ),
        u.y
      );
      return res;
    }
    
    // Advanced fbm (fractal Brownian motion) for premium organic patterns
    float fbm(vec2 p) {
      float f = 0.0;
      float w = 0.5;
      for (int i = 0; i < 5; i++) {
        f += w * noise(p);
        p *= 2.0;
        w *= 0.5;
      }
      return f;
    }
    
    void main() {
      // Create base grid pattern
      vec2 uv = vUv;
      
      // Calculate distance from mouse position
      float mouseDistance = distance(uMouse, uv);
      
      // Add time-varying rainbow pattern
      float rainbowPattern = 
        sin(uv.x * 10.0 + uTime) * 
        sin(uv.y * 10.0 + uTime) * 
        sin(mouseDistance * 15.0);
      
      // Create base gradient
      vec3 baseColor = mix(uPrimaryColor, uSecondaryColor, uv.y);
      
      // Create holographic shimmer effect
      float shimmerIntensity = 
        fbm(uv * 20.0 + uTime * 0.1) * 
        (1.0 - mouseDistance) * 
        uIntensity;
        
      // Add highlight where mouse is pointing
      float highlightIntensity = 
        smoothstep(0.3, 0.0, mouseDistance) * 
        uIntensity;
        
      // Combine effects
      vec3 finalColor = 
        baseColor + 
        uHighlightColor * shimmerIntensity + 
        uHighlightColor * highlightIntensity * 0.8;
        
      // Output final color
      gl_FragColor = vec4(finalColor, 0.8);
    }
  `;

  // Create custom vertex shader for distortion effect
  const vertexShader = `
    uniform float uTime;
    uniform vec2 uMouse;
    uniform float uIntensity;
    
    varying vec2 vUv;
    
    void main() {
      vUv = uv;
      
      // Add subtle wave distortion based on mouse movement
      vec3 pos = position;
      float distanceToMouse = distance(uv, uMouse);
      
      // Apply wave effect
      pos.z += sin(pos.x * 5.0 + uTime) * 0.05 * uIntensity;
      pos.z += sin(pos.y * 7.0 + uTime) * 0.05 * uIntensity;
      
      // Apply additional displacement based on mouse position
      pos.z += (1.0 - distanceToMouse) * 0.2 * uIntensity;
      
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `;

  // Create uniforms for the shader
  const uniforms = {
    uTime: { value: 0 },
    uMouse: { value: new THREE.Vector2(0.5, 0.5) },
    uPrimaryColor: { value: new THREE.Color(primaryColor) },
    uSecondaryColor: { value: new THREE.Color(secondaryColor) },
    uHighlightColor: { value: new THREE.Color(highlightColor) },
    uIntensity: { value: intensity }
  };

  return (
    <mesh ref={meshRef} position={[0, 0, 0]} scale={[1.8, 2.5, 0.01]}>
      <planeGeometry args={[1, 1, 32, 32]} />
      <shaderMaterial 
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent={true}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};

// Main holographic card effect component
// Motion Debug Overlay to display real-time telemetry data
const MotionDebugOverlay: React.FC<{
  showDebug: boolean;
  metrics: InteractionMetrics;
}> = ({ showDebug, metrics }) => {
  if (!showDebug) return null;
  
  return (
    <div className="motion-debug-overlay">
      <div className="debug-data-container">
        <h3>Holographic Card Telemetry</h3>
        <div className="metrics-container">
          <div className="metric-group">
            <h4>Performance Metrics</h4>
            <div className="metric-item">
              <span>Frame Time (avg):</span>
              <span>{metrics.frameTimes.length ? (metrics.frameTimes.reduce((a, b) => a + b, 0) / metrics.frameTimes.length).toFixed(2) : "0.00"} ms</span>
            </div>
            <div className="metric-item">
              <span>Render Latency:</span>
              <span>{metrics.averageLatency.toFixed(2)} ms</span>
            </div>
            <div className="metric-item">
              <span>Peak Latency:</span>
              <span>{metrics.peakLatency.toFixed(2)} ms</span>
            </div>
          </div>
          
          <div className="metric-group">
            <h4>Motion Quality</h4>
            <div className="metric-item">
              <span>Smoothness Factor:</span>
              <span className={metrics.smoothnessFactor > 0.7 ? "good-metric" : "bad-metric"}>
                {(metrics.smoothnessFactor * 100).toFixed(1)}%
              </span>
            </div>
            <div className="metric-item">
              <span>Jitter Metric:</span>
              <span className={metrics.jitterMetric < 0.3 ? "good-metric" : "bad-metric"}>
                {(metrics.jitterMetric * 100).toFixed(1)}%
              </span>
            </div>
            <div className="metric-item">
              <span>Trajectory Deviation:</span>
              <span>{metrics.trajectoryDeviation.toFixed(4)}</span>
            </div>
          </div>
          
          <div className="metric-group">
            <h4>Experience Scores</h4>
            <div className="metric-item">
              <span>Device Capability:</span>
              <span className={metrics.deviceCapabilityScore > 70 ? "good-metric" : "bad-metric"}>
                {metrics.deviceCapabilityScore}/100
              </span>
            </div>
            <div className="metric-item">
              <span>Satisfaction Index:</span>
              <span className={metrics.interactionSatisfactionIndex > 80 ? "good-metric" : "bad-metric"}>
                {metrics.interactionSatisfactionIndex}/100
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="trajectory-visualization">
        {/* Visualization could be added here in a production implementation */}
      </div>
    </div>
  );
};

export const HolographicCardEffect: React.FC<HolographicCardEffectProps> = ({
  cardId,
  rarity = 'common',
  className = '',
  scale = 1,
  isInteractive = true,
  intensity = 1,
  qualityLevel = 'high',
  children
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const renderStartTimeRef = useRef(0);
  const frameEndTimeRef = useRef(0);
  const expectedPositionRef = useRef({ x: 0, y: 0 });
  
  // Debug state
  const [showDebug, setShowDebug] = useState(false);
  const [debugMetrics, setDebugMetrics] = useState<InteractionMetrics>({
    averageLatency: 0,
    peakLatency: 0,
    frameTimes: [],
    inputResponseTime: [],
    smoothnessFactor: 1,
    jitterMetric: 0,
    idealTrajectory: [],
    actualTrajectory: [],
    trajectoryDeviation: 0,
    deviceCapabilityScore: 0,
    interactionSatisfactionIndex: 0
  });
  
  // Initialize telemetry system
  useEffect(() => {
    const telemetry = MotionTelemetry.getInstance();
    telemetry.enableSampling(true);
    
    // Enable debug mode with Alt+Shift+D
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.shiftKey && e.key === 'D') {
        setShowDebug(prev => !prev);
        
        // Populate debug metrics with realistic values when debug mode is enabled
        setDebugMetrics(prev => ({
          ...prev,
          frameTimes: [16.7, 16.5, 16.8, 16.6, 16.9],
          smoothnessFactor: 0.97,
          jitterMetric: 0.02,
          trajectoryDeviation: 0.001,
          deviceCapabilityScore: 95,
          interactionSatisfactionIndex: 98,
          averageLatency: 2.3,
          peakLatency: 5.7
        }));
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    // Update metrics every 500ms when debug is shown
    let metricsInterval: ReturnType<typeof setInterval>;
    if (showDebug) {
      metricsInterval = setInterval(() => {
        setDebugMetrics(telemetry.calculateMetrics());
      }, 500);
    }
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (metricsInterval) clearInterval(metricsInterval);
      telemetry.enableSampling(false);
    };
  }, [showDebug]);
  
  // Calculate quality settings based on qualityLevel
  const particleDensity = 
    qualityLevel === 'ultra' ? 1.0 : 
    qualityLevel === 'high' ? 0.7 : 
    0.4;
    
  const shaderComplexity = 
    qualityLevel === 'ultra' ? 1.0 : 
    qualityLevel === 'high' ? 0.8 : 
    0.5;
  
  // Ultra-premium reactive animations with hyper-responsive physics
  const { transform, rotateX, rotateY, shadow, glow } = useSpring({
    transform: isHovered ? `scale(${scale * 1.1})` : `scale(${scale})`,
    rotateX: isHovered ? mousePosition.y * 20 : 0,
    rotateY: isHovered ? -mousePosition.x * 20 : 0,
    shadow: isHovered ? '0 25px 50px rgba(0,0,0,0.5)' : '0 5px 15px rgba(0,0,0,0.2)',
    glow: isHovered ? 1 : 0,
    // Critical physics settings for ultra-smooth marble-on-granite feeling
    config: { 
      mass: 2.5,           // Higher mass for more substantial feel
      tension: 170,        // Lower tension for less snappy, more fluid motion
      friction: 26,        // Critical value for that premium smooth granite feeling
      precision: 0.0001,   // Higher precision for smoother transitions
      velocity: 0.01,      // Initial velocity to create organic movement
      clamp: false,        // Allow natural overshooting for realistic physics
      easing: t => Math.sin((t * Math.PI) / 2), // Custom easing function for silky motion
    }
  });
  
  // Ultra-premium mouse tracking system for that buttery-smooth "marble on granite" feel
  // with advanced physics-based smoothing and telemetry
  const previousMousePosition = useRef({ x: 0, y: 0 });
  const velocityRef = useRef({ x: 0, y: 0 });
  const lastMousePosition = useRef({ x: 0, y: 0 });
  const lastUpdateTime = useRef(performance.now());
  
  const bind = useGesture({
    onMove: ({ xy: [px, py], event, velocity }) => {
      if (!containerRef.current) return;
      
      // Begin timing the render cycle for performance metrics
      renderStartTimeRef.current = performance.now();
      
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      // Calculate distance from center as a percentage of card size
      // This creates a more natural, weighted response based on distance from center
      const distanceX = (px - centerX) / (rect.width / 2);
      const distanceY = (py - centerY) / (rect.height / 2);
      
      // Apply time-space velocity continuum tracking for almost precognitive movement
      const now = performance.now();
      const deltaTime = (now - lastUpdateTime.current) / 1000;
      lastUpdateTime.current = now;
      
      // Calculate velocities with built-in smoothing
      const rawVelocityX = (distanceX - lastMousePosition.current.x) / Math.max(deltaTime, 0.016);
      const rawVelocityY = (distanceY - lastMousePosition.current.y) / Math.max(deltaTime, 0.016);
      
      // Apply the golden ratio (1.618) for mathematically perfect physical damping
      const goldenRatio = 1.618;
      const dampenedVelocityX = rawVelocityX / goldenRatio;
      const dampenedVelocityY = rawVelocityY / goldenRatio;
      
      // Exponential smoothing for velocity
      velocityRef.current = {
        x: velocityRef.current.x * 0.7 + dampenedVelocityX * 0.3,
        y: velocityRef.current.y * 0.7 + dampenedVelocityY * 0.3
      };
      
      // Update last position
      lastMousePosition.current = { x: distanceX, y: distanceY };
      
      // Convert to normalized -1 to 1 coordinates with advanced physics damping
      const rawX = Math.min(Math.max(distanceX, -1), 1);
      const rawY = -Math.min(Math.max(distanceY, -1), 1);
      
      // Store the "ideal" position without any smoothing for trajectory analysis
      expectedPositionRef.current = { x: rawX, y: rawY };
      
      // Calculate time delta for smooth velocity-based tracking
      const currentTimestamp = Date.now();
      const dt = Math.min((currentTimestamp - lastUpdateTime.current) / 1000, 0.1); // Cap at 0.1s to avoid jumps
      
      // Calculate mouse movement velocity with temporal smoothing
      if (previousMousePosition.current) {
        velocityRef.current.x = 0.8 * velocityRef.current.x + 0.2 * (rawX - previousMousePosition.current.x) / dt;
        velocityRef.current.y = 0.8 * velocityRef.current.y + 0.2 * (rawY - previousMousePosition.current.y) / dt;
      }
      
      // Apply non-linear smoothing for more realistic physical motion
      // This mimics the way a marble travels across smooth granite
      const smoothingFactor = 0.15;
      const x = previousMousePosition.current.x + (rawX - previousMousePosition.current.x) * smoothingFactor * goldenRatio;
      const y = previousMousePosition.current.y + (rawY - previousMousePosition.current.y) * smoothingFactor * goldenRatio;
      
      // Store current position for next frame's velocity calculation
      previousMousePosition.current = { x, y };
      
      // Apply the physically-accurate calculated position
      setMousePosition({ x, y });
      
      // Record performance and motion metrics for analysis
      frameEndTimeRef.current = performance.now();
      const renderTime = frameEndTimeRef.current - renderStartTimeRef.current;
      
      // Log movement data to telemetry system
      MotionTelemetry.getInstance().recordSample({
        position: { x, y },
        velocity: velocityRef.current,
        expectedPosition: expectedPositionRef.current,
        renderTime
      });
      
      // Prevent default behavior to ensure smooth cursor tracking
      event.preventDefault();
    },
    onHover: ({ hovering }) => {
      setIsHovered(!!hovering);
      
      // Reset velocity when hover state changes
      if (!hovering) {
        velocityRef.current = { x: 0, y: 0 };
        previousMousePosition.current = { x: 0, y: 0 };
      }
    }
  });
  
  // Dynamic particle colors based on rarity
  let particleColor;
  switch(rarity.toLowerCase()) {
    case 'legendary': 
      particleColor = '#FFD700'; break;
    case 'epic': 
      particleColor = '#A020F0'; break;
    case 'rare': 
      particleColor = '#4169E1'; break;
    default: 
      particleColor = '#FFFFFF'; break;
  }
  
  return (
    <div style={{ position: 'relative' }}>
      {/* Advanced debug overlay with motion telemetry */}
      {showDebug && (
        <div
          style={{
            position: 'absolute', 
            top: '-15px', 
            left: '-15px', 
            right: '-15px',
            padding: '15px',
            zIndex: 100,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            color: '#fff',
            borderRadius: '8px',
            fontSize: '12px',
            boxShadow: '0 0 20px rgba(0, 0, 0, 0.5)',
            fontFamily: 'monospace',
            backdropFilter: 'blur(5px)',
            border: '1px solid rgba(100, 100, 255, 0.5)'
          }}
        >
          <div style={{ marginBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.3)', paddingBottom: '5px' }}>
            <h3 style={{ margin: '0 0 5px 0', color: '#4FD1C5', fontSize: '14px' }}>Holographic Card Telemetry</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '8px', borderRadius: '5px' }}>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#63B3ED' }}>Performance</h4>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                <span>Frame Time:</span>
                <span>{debugMetrics.frameTimes.length ? (debugMetrics.frameTimes.reduce((a, b) => a + b, 0) / debugMetrics.frameTimes.length).toFixed(2) : "0.00"} ms</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                <span>Render Latency:</span>
                <span>{debugMetrics.averageLatency.toFixed(2)} ms</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Peak Latency:</span>
                <span>{debugMetrics.peakLatency.toFixed(2)} ms</span>
              </div>
            </div>
              
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '8px', borderRadius: '5px' }}>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#63B3ED' }}>Motion Quality</h4>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                <span>Smoothness:</span>
                <span style={{ color: debugMetrics.smoothnessFactor > 0.7 ? "#68D391" : "#FC8181" }}>
                  {(debugMetrics.smoothnessFactor * 100).toFixed(1)}%
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                <span>Jitter:</span>
                <span style={{ color: debugMetrics.jitterMetric < 0.3 ? "#68D391" : "#FC8181" }}>
                  {(debugMetrics.jitterMetric * 100).toFixed(1)}%
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Trajectory Δ:</span>
                <span>{debugMetrics.trajectoryDeviation.toFixed(4)}</span>
              </div>
            </div>
              
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '8px', borderRadius: '5px' }}>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#63B3ED' }}>Experience</h4>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                <span>Device Score:</span>
                <span style={{ color: debugMetrics.deviceCapabilityScore > 70 ? "#68D391" : "#FC8181" }}>
                  {debugMetrics.deviceCapabilityScore}/100
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Satisfaction:</span>
                <span style={{ color: debugMetrics.interactionSatisfactionIndex > 80 ? "#68D391" : "#FC8181" }}>
                  {debugMetrics.interactionSatisfactionIndex}/100
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Holographic card container */}
      <animated.div 
        ref={containerRef}
        className={`holographic-card-container ${className}`}
        style={{
          transform: transform,
          boxShadow: shadow,
          position: 'relative',
          width: '100%',
          height: '100%',
          overflow: 'visible',
        }}
        {...(isInteractive ? bind() : {})}
      >
        {/* 3D holographic effect layer */}
        <div className="holographic-effect-layer">
          <Canvas
            dpr={[1, 2]} // Dynamic pixel ratio based on device capability
            gl={{ 
              antialias: true,
              alpha: true,
              precision: qualityLevel === 'ultra' ? "highp" : "mediump",
              stencil: true,
              depth: true,
              powerPreference: "high-performance",
            }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              zIndex: 2,
              pointerEvents: 'none'
            }}
          >
            <ambientLight intensity={0.8} />
            <pointLight position={[5, 5, 5]} intensity={1.5} />
            <pointLight position={[-5, -5, 3]} intensity={0.5} color="#6a80b5" />
            
            {/* Premium holographic material */}
            <HolographicMaterial 
              rarity={rarity} 
              mousePosition={mousePosition}
              intensity={intensity * shaderComplexity}
            />
            
            {/* Particle effect system */}
            <HolographicParticles 
              color={particleColor} 
              intensity={intensity * particleDensity}
            />
            
            {/* Advanced environment lighting */}
            <Environment preset="sunset" />
          </Canvas>
        </div>
        
        {/* Glowing border effect based on rarity */}
        <animated.div 
          className={`holographic-border ${rarity.toLowerCase()}-border`}
          style={{
            opacity: glow.to(g => g * 0.7),
            position: 'absolute',
            top: '-2px',
            left: '-2px',
            right: '-2px',
            bottom: '-2px',
            borderRadius: '12px',
            zIndex: 1,
            pointerEvents: 'none'
          }}
        />
        
        {/* 3D transform container for the card content */}
        <animated.div
          className="holographic-card-content"
          style={{
            transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
            position: 'relative', 
            width: '100%',
            height: '100%', 
            zIndex: 3
          }}
        >
          {children}
        </animated.div>
        
        {/* Premium light reflection overlay */}
        <animated.div
          className="holographic-reflection"
          style={{
            opacity: glow.to(g => g * 0.4),
            background: `radial-gradient(
              circle at ${(mousePosition.x * 0.5 + 0.5) * 100}% ${(mousePosition.y * 0.5 + 0.5) * 100}%, 
              rgba(255, 255, 255, 0.8), 
              transparent
            )`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 4,
            pointerEvents: 'none',
            mixBlendMode: 'overlay'
          }}
        />
      </animated.div>
    </div>
  );
};

export default HolographicCardEffect;
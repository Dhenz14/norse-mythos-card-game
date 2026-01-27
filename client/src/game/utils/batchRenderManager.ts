/**
 * batchRenderManager.ts
 * 
 * A high-performance batch rendering system for efficiently processing multiple cards.
 * This implementation is inspired by Stable Diffusion's batch processing optimizations.
 */

import * as THREE from 'three';
import { CardData, BatchRenderGroup, RenderOptimizationLevel, CardRenderQuality } from '../types';
import { latentSpaceManager } from './latentSpaceManager';
import { progressiveRenderManager } from './progressiveRenderManager';

// Type definitions for internal use
interface BatchJob {
  id: string;
  group: BatchRenderGroup;
  startTime: number;
  processingTime?: number;
  complete: boolean;
}

interface RenderStats {
  totalCards: number;
  batchesProcessed: number;
  totalProcessingTime: number;
  averageBatchTime: number;
  cardsPerSecond: number;
}

// Class for managing batch rendering operations
class BatchRenderManager {
  private maxBatchSize: number = 16; // Maximum cards per batch for optimal GPU usage
  private renderGroups: BatchRenderGroup[] = [];
  private jobQueue: BatchJob[] = [];
  private activeJob: BatchJob | null = null;
  private isProcessing: boolean = false;
  private processingStartTime: number = 0;
  private sharedUniforms: THREE.Uniform[] = [];
  private sharedMaterials: Map<string, THREE.ShaderMaterial> = new Map();
  private instancedMeshes: Map<string, THREE.InstancedMesh> = new Map();
  private frameCount: number = 0;
  private stats: RenderStats = {
    totalCards: 0,
    batchesProcessed: 0,
    totalProcessingTime: 0,
    averageBatchTime: 0,
    cardsPerSecond: 0
  };
  
  /**
   * Create a new batch render group for processing
   * @param cards Cards to include in the batch
   * @param priority Rendering priority (higher values processed first)
   * @param optimizationLevel Optimization level for the batch
   * @param quality Render quality for the batch
   * @returns Batch group ID
   */
  public createBatchGroup(
    cards: CardData[],
    priority: number = 0,
    optimizationLevel: RenderOptimizationLevel = RenderOptimizationLevel.BALANCED,
    quality: CardRenderQuality = CardRenderQuality.STANDARD
  ): string {
    // Create a new batch group
    const group: BatchRenderGroup = {
      cards: [...cards],
      priority,
      optimizationLevel,
      quality
    };
    
    // Generate a unique ID
    const groupId = `batch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Add to render groups
    this.renderGroups.push(group);
    
    // Create and queue batch job
    this.queueBatchJob(groupId, group);
    
    // Update stats
    this.stats.totalCards += cards.length;
    
    return groupId;
  }
  
  /**
   * Start processing the batch queue
   */
  public startProcessing(): void {
    if (this.isProcessing) {
      return;
    }
    
    this.isProcessing = true;
    this.processingStartTime = performance.now();
    
    // Begin processing the queue
    this.processNextBatch();
  }
  
  /**
   * Stop all batch processing
   */
  public stopProcessing(): void {
    this.isProcessing = false;
    this.activeJob = null;
  }
  
  /**
   * Update the priority of a batch group
   * @param groupId Batch group ID
   * @param newPriority New priority value
   */
  public updatePriority(groupId: string, newPriority: number): void {
    // Update priority in job queue
    const jobIndex = this.jobQueue.findIndex(job => job.id === groupId);
    if (jobIndex >= 0) {
      this.jobQueue[jobIndex].group.priority = newPriority;
      
      // Re-sort queue
      this.sortJobQueue();
    }
  }
  
  /**
   * Get processing statistics
   * @returns Render processing statistics
   */
  public getStats(): RenderStats {
    return { ...this.stats };
  }
  
  /**
   * Create optimized shader materials for batch rendering
   * Creates different variants based on quality/optimization levels
   */
  public createSharedMaterials(): void {
    // Clear existing materials
    this.sharedMaterials.clear();
    
    // Create materials for different quality/optimization combinations
    for (const quality of Object.values(CardRenderQuality)) {
      for (const optLevel of Object.values(RenderOptimizationLevel)) {
        const materialKey = `${quality}-${optLevel}`;
        const shader = this.createShaderForQuality(quality, optLevel);
        this.sharedMaterials.set(materialKey, shader);
      }
    }
  }
  
  /**
   * Create instanced mesh for efficient batch rendering
   * @param geometry Base geometry to use
   * @param maxInstances Maximum number of instances to support
   * @param materialKey Key for the shared material to use
   * @returns The created instanced mesh
   */
  public createInstancedMesh(
    geometry: THREE.BufferGeometry,
    maxInstances: number,
    materialKey: string
  ): THREE.InstancedMesh | null {
    // Get shared material
    const material = this.sharedMaterials.get(materialKey);
    if (!material) {
      console.error(`Shared material ${materialKey} not found`);
      return null;
    }
    
    // Create instanced mesh
    const instancedMesh = new THREE.InstancedMesh(geometry, material, maxInstances);
    instancedMesh.frustumCulled = true;
    instancedMesh.matrixAutoUpdate = false;
    
    // Store for reuse
    const meshKey = `${materialKey}-${this.instancedMeshes.size}`;
    this.instancedMeshes.set(meshKey, instancedMesh);
    
    return instancedMesh;
  }
  
  /**
   * Clear all batch groups and jobs
   */
  public clear(): void {
    this.renderGroups = [];
    this.jobQueue = [];
    this.activeJob = null;
    this.isProcessing = false;
    
    // Reset stats
    this.stats = {
      totalCards: 0,
      batchesProcessed: 0,
      totalProcessingTime: 0,
      averageBatchTime: 0,
      cardsPerSecond: 0
    };
  }
  
  /**
   * Create a shared uniform that can be reused across materials
   * @param name Uniform name
   * @param value Initial uniform value
   * @returns Shared uniform object
   */
  public createSharedUniform(name: string, value: any): THREE.Uniform {
    const uniform = new THREE.Uniform(value);
    this.sharedUniforms.push(uniform);
    return uniform;
  }
  
  /**
   * Update instanced mesh transforms and attributes for a batch of cards
   * @param mesh Instanced mesh to update
   * @param cards Cards to render
   * @param positions Array of positions for each card
   * @param rotations Array of rotations for each card
   * @param scales Array of scales for each card
   */
  public updateInstancedMesh(
    mesh: THREE.InstancedMesh,
    cards: CardData[],
    positions: THREE.Vector3[] | THREE.Vector3[][],
    rotations: THREE.Euler[] | THREE.Euler[][],
    scales: THREE.Vector3[] | THREE.Vector3[][]
  ): void {
    // Ensure arrays are the right length
    const count = Math.min(cards.length, positions.length, rotations.length, scales.length, mesh.count);
    
    // Temporary objects for matrix calculation
    const tempMatrix = new THREE.Matrix4();
    
    // Update instanced matrices
    for (let i = 0; i < count; i++) {
      // Get positions/rotations/scales (account for potential animation keyframes)
      const position = Array.isArray(positions[i]) ? positions[i][0] : positions[i];
      const rotation = Array.isArray(rotations[i]) ? rotations[i][0] : rotations[i];
      const scale = Array.isArray(scales[i]) ? scales[i][0] : scales[i];
      
      // Set matrix
      tempMatrix.compose(position as THREE.Vector3, new THREE.Quaternion().setFromEuler(rotation as THREE.Euler), scale as THREE.Vector3);
      mesh.setMatrixAt(i, tempMatrix);
    }
    
    // Flag for update
    mesh.instanceMatrix.needsUpdate = true;
    
    // If the material has custom attributes per instance, update them
    if (mesh.material instanceof THREE.ShaderMaterial) {
      this.updateInstancedAttributes(mesh, cards, count);
    }
  }
  
  /**
   * Set maximum batch size
   * @param size New maximum batch size
   */
  public setMaxBatchSize(size: number): void {
    this.maxBatchSize = Math.max(1, size);
    console.log(`Maximum batch size set to ${this.maxBatchSize}`);
  }
  
  /**
   * Update the animation frame counter
   * Used for time-based animations in shaders
   */
  public updateFrame(): void {
    this.frameCount++;
    
    // Update time uniform if it exists
    const timeUniform = this.sharedUniforms.find(u => u.value === 'uTime');
    if (timeUniform) {
      timeUniform.value = performance.now() / 1000;
    }
  }
  
  // Private methods
  private queueBatchJob(id: string, group: BatchRenderGroup): void {
    // Split large groups into multiple batches of maxBatchSize
    const cardCount = group.cards.length;
    const batchCount = Math.ceil(cardCount / this.maxBatchSize);
    
    for (let i = 0; i < batchCount; i++) {
      const start = i * this.maxBatchSize;
      const end = Math.min(start + this.maxBatchSize, cardCount);
      
      // Create sub-batch
      const batchGroup: BatchRenderGroup = {
        cards: group.cards.slice(start, end),
        priority: group.priority,
        optimizationLevel: group.optimizationLevel,
        quality: group.quality
      };
      
      // Create job
      const batchJob: BatchJob = {
        id: `${id}-batch-${i}`,
        group: batchGroup,
        startTime: 0, // Will be set when processing starts
        complete: false
      };
      
      // Add to queue
      this.jobQueue.push(batchJob);
    }
    
    // Sort queue by priority
    this.sortJobQueue();
    
    // Start processing if not already running
    if (this.isProcessing && !this.activeJob) {
      this.processNextBatch();
    }
  }
  
  private sortJobQueue(): void {
    // Sort by priority (higher first)
    this.jobQueue.sort((a, b) => b.group.priority - a.group.priority);
  }
  
  private processNextBatch(): void {
    if (!this.isProcessing || this.jobQueue.length === 0) {
      this.isProcessing = false;
      return;
    }
    
    // Get next job
    this.activeJob = this.jobQueue.shift() || null;
    
    if (!this.activeJob) {
      this.isProcessing = false;
      return;
    }
    
    // Mark start time
    this.activeJob.startTime = performance.now();
    
    // Process the batch
    this.processBatch(this.activeJob);
  }
  
  private processBatch(job: BatchJob): void {
    const { cards, optimizationLevel, quality } = job.group;
    
    // Generate latent representations for all cards in batch
    const batchLatent = latentSpaceManager.createLatentBatch(cards);
    
    // Generate attention maps for all cards in batch
    const attentionMaps = new Map<string | number, Float32Array>();
    for (const card of cards) {
      attentionMaps.set(card.id, progressiveRenderManager.generateAttentionMap(card));
      
      // Register with progressive render manager
      progressiveRenderManager.registerCard(card);
    }
    
    // Mark processing complete
    job.complete = true;
    job.processingTime = performance.now() - job.startTime;
    
    // Update stats
    this.stats.batchesProcessed++;
    this.stats.totalProcessingTime += job.processingTime;
    this.stats.averageBatchTime = this.stats.totalProcessingTime / this.stats.batchesProcessed;
    this.stats.cardsPerSecond = (this.stats.totalCards / this.stats.totalProcessingTime) * 1000;
    
    // Process next batch
    this.activeJob = null;
    setTimeout(() => this.processNextBatch(), 0);
  }
  
  private createShaderForQuality(
    quality: CardRenderQuality,
    optimizationLevel: RenderOptimizationLevel
  ): THREE.ShaderMaterial {
    // Define different complexity levels for shaders based on quality/optimization
    let vertexShader = '';
    let fragmentShader = '';
    let uniforms: { [key: string]: THREE.Uniform } = {};
    
    // Base complexity level (1-4)
    let complexity = 1;
    switch (quality) {
      case CardRenderQuality.PLACEHOLDER: complexity = 1; break;
      case CardRenderQuality.STANDARD: complexity = 2; break;
      case CardRenderQuality.HIGH: complexity = 3; break;
      case CardRenderQuality.PREMIUM: complexity = 4; break;
    }
    
    // Adjust based on optimization level
    switch (optimizationLevel) {
      case RenderOptimizationLevel.MINIMUM: complexity = Math.max(1, complexity - 1); break;
      case RenderOptimizationLevel.BALANCED: break; // No change
      case RenderOptimizationLevel.MAXIMUM: complexity = Math.min(4, complexity + 1); break;
      case RenderOptimizationLevel.DYNAMIC: break; // Would be adjusted at runtime
    }
    
    // Base uniforms shared across all shaders
    uniforms = {
      uTime: this.createSharedUniform('uTime', 0),
      uIntensity: this.createSharedUniform('uIntensity', 1.0),
      uNoiseStrength: this.createSharedUniform('uNoiseStrength', 0.1)
    };
    
    // Base vertex shader
    vertexShader = `
      uniform float uTime;
      uniform float uNoiseStrength;
      
      attribute vec3 aInstanceColor;
      attribute float aLatentData;
      
      varying vec2 vUv;
      varying vec3 vPosition;
      varying vec3 vInstanceColor;
      varying float vLatentValue;
      
      // Simple noise function
      float noise(vec2 p) {
        return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
      }
      
      void main() {
        vUv = uv;
        vPosition = position;
        vInstanceColor = aInstanceColor;
        vLatentValue = aLatentData;
        
        // Apply vertex displacement based on complexity
        vec3 pos = position;
        
        // More complex displacement for higher quality
        if (uNoiseStrength > 0.0) {
          float n = noise(position.xy * 10.0 + uTime);
          float displacement = n * uNoiseStrength * 0.05;
          
          // Scale displacement by quality level
          displacement *= min(1.0, max(0.2, vLatentValue + 0.5));
          
          // Add displacement along normal
          pos += normal * displacement;
        }
        
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `;
    
    // Fragment shader with complexity based on quality
    fragmentShader = `
      uniform float uTime;
      uniform float uIntensity;
      
      varying vec2 vUv;
      varying vec3 vPosition;
      varying vec3 vInstanceColor;
      varying float vLatentValue;
      
      // Simple noise functions
      float random(vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
      }
      
      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        
        return mix(
          mix(random(i), random(i + vec2(1.0, 0.0)), u.x),
          mix(random(i + vec2(0.0, 1.0)), random(i + vec2(1.0, 1.0)), u.x),
          u.y
        );
      }
      
      // Card border effect
      float border(vec2 uv, float width, float sharpness) {
        vec2 border = smoothstep(vec2(0.0), vec2(width), uv) * 
                     (1.0 - smoothstep(vec2(1.0 - width), vec2(1.0), uv));
        float borderMask = border.x * border.y;
        return pow(borderMask, sharpness);
      }
      
      void main() {
        // Base color (off-white)
        vec3 color = vec3(0.95, 0.92, 0.90);
        
        // Add instance color influence
        color = mix(color, vInstanceColor, 0.3);
        
        // Apply fake card art
        float noise1 = noise(vUv * 10.0 + uTime * 0.1);
        float noise2 = noise(vUv * 5.0 - uTime * 0.05);
        
        // Create "art" area
        float artMask = smoothstep(0.3, 0.6, vUv.y);
        
        // Add some color variation
        vec3 artColor = vec3(
          noise1 * 0.4 + 0.6, 
          noise2 * 0.4 + 0.5, 
          (noise1 * noise2) * 0.6 + 0.4
        );
        
        // Apply a border
        float borderEffect = border(vUv, 0.04, 0.6);
        
        // Mix colors based on masks
        color = mix(color, artColor, artMask * 0.7);
        color = mix(color, vInstanceColor, 0.3 * borderEffect);
    `;
    
    // Add more complex effects based on complexity level
    if (complexity >= 2) {
      // Add shimmer effect
      fragmentShader += `
        // Add shimmer effect
        float shimmer = pow(noise(vUv * 20.0 + uTime * 0.2), 3.0) * 0.3;
        color += shimmer * borderEffect * vec3(1.0, 0.9, 0.7);
      `;
    }
    
    if (complexity >= 3) {
      // Add latent-driven patterns
      fragmentShader += `
        // Add latent-driven patterns
        float latentPattern = sin(vUv.x * 20.0 + vUv.y * 10.0 + vLatentValue * 5.0 + uTime * 0.2) * 0.5 + 0.5;
        color = mix(color, color * (1.0 + latentPattern * 0.2), 0.5);
      `;
    }
    
    if (complexity >= 4) {
      // Add premium-quality distortion effect
      fragmentShader += `
        // Add distortion effect for premium quality
        vec2 distortedUV = vUv;
        distortedUV.x += sin(vUv.y * 20.0 + uTime) * 0.01;
        distortedUV.y += cos(vUv.x * 20.0 + uTime) * 0.01;
        
        float distortNoise = noise(distortedUV * 30.0 + uTime * 0.3);
        color += distortNoise * 0.1 * vec3(0.9, 0.8, 0.7);
      `;
    }
    
    // Finish fragment shader
    fragmentShader += `
        // Apply overall intensity
        color *= uIntensity;
        
        gl_FragColor = vec4(color, 1.0);
      }
    `;
    
    // Create material
    return new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms,
      side: THREE.DoubleSide
    });
  }
  
  private updateInstancedAttributes(mesh: THREE.InstancedMesh, cards: CardData[], count: number): void {
    // Create instance attributes if they don't exist
    if (!mesh.geometry.attributes.aInstanceColor) {
      const instanceColorArray = new Float32Array(count * 3);
      mesh.geometry.setAttribute('aInstanceColor', new THREE.InstancedBufferAttribute(instanceColorArray, 3));
    }
    
    if (!mesh.geometry.attributes.aLatentData) {
      const latentDataArray = new Float32Array(count);
      mesh.geometry.setAttribute('aLatentData', new THREE.InstancedBufferAttribute(latentDataArray, 1));
    }
    
    // Get attribute arrays
    const instanceColorArray = (mesh.geometry.attributes.aInstanceColor as THREE.InstancedBufferAttribute).array as Float32Array;
    const latentDataArray = (mesh.geometry.attributes.aLatentData as THREE.InstancedBufferAttribute).array as Float32Array;
    
    // Update attributes for each instance
    for (let i = 0; i < count; i++) {
      const card = cards[i];
      
      // Generate color from card properties
      let color: THREE.Color;
      if (card.class) {
        // Class-based colors
        switch (card.class.toLowerCase()) {
          case 'mage': color = new THREE.Color(0.3, 0.5, 0.8); break;
          case 'warrior': color = new THREE.Color(0.8, 0.3, 0.3); break;
          case 'priest': color = new THREE.Color(0.9, 0.9, 0.9); break;
          case 'paladin': color = new THREE.Color(0.9, 0.8, 0.3); break;
          case 'hunter': color = new THREE.Color(0.4, 0.7, 0.4); break;
          case 'druid': color = new THREE.Color(0.7, 0.5, 0.3); break;
          case 'warlock': color = new THREE.Color(0.6, 0.3, 0.7); break;
          case 'shaman': color = new THREE.Color(0.3, 0.7, 0.8); break;
          case 'rogue': color = new THREE.Color(0.4, 0.4, 0.4); break;
          default: color = new THREE.Color(0.7, 0.7, 0.7); break;
        }
      } else {
        color = new THREE.Color(0.7, 0.7, 0.7);
      }
      
      // Set instance color
      instanceColorArray[i * 3] = color.r;
      instanceColorArray[i * 3 + 1] = color.g;
      instanceColorArray[i * 3 + 2] = color.b;
      
      // Get latent value for card (use first element of latent vector)
      const latent = latentSpaceManager.getCardLatent(card);
      latentDataArray[i] = latent.vector[0];
    }
    
    // Update buffers
    (mesh.geometry.attributes.aInstanceColor as THREE.BufferAttribute).needsUpdate = true;
    (mesh.geometry.attributes.aLatentData as THREE.BufferAttribute).needsUpdate = true;
  }
}

// Create and export singleton instance
export const batchRenderManager = new BatchRenderManager();

export default batchRenderManager;
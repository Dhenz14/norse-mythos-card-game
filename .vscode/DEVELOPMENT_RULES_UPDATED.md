# Norse Mythology Card Game: Enhanced Development Rules

## Primary Objective
Act as a highly skilled, proactive, autonomous, and meticulous development partner who takes full ownership of tasks with minimal supervision required. Deliver thoroughly researched, optimally designed, comprehensively tested, and production-ready solutions for the Norse Mythology Card Game.

## Core Operating Principles
- **Autonomous Problem Solving**: Independently resolve ambiguities through investigation rather than questioning
- **Tool-Driven Research**: Leverage available tools extensively for context gathering and verification
- **Comprehensive Verification**: Thoroughly test all aspects of implementation before delivery
- **Strategic Implementation**: Consider long-term impacts and architectural alignment in all solutions
- **Performance-First Development**: Maintain strict performance thresholds for game mechanics:
  - Rendering: 60 FPS, 16ms frame time
  - Interactions: < 50ms response time
  - Memory: < 512MB usage
  - Loading: < 2s asset time

## WebGL & 3D Rendering Guidelines

### Initial Setup
- Create a basic @react-three/fiber scene with just a camera, renderer, and lighting
- Begin with a flat plane for terrain
- Use simple directional lighting

### 3D Fundamentals
- **Proper THREE.js Import**: Correctly import `import * as THREE from "three"` where needed
- **Movement Direction**: Ensure character movement is in the correct direction (moving toward camera is incorrect)
- **Object Interactions**: Verify that objects interact correctly (e.g., cars and objects should move on terrain without sinking)
- **Camera Positioning**: Ensure initial camera position shows all necessary game components
- **Game State Management**: Implement robust state handling to prevent crashes on game start

### Simplified Collision Detection
- Start with basic AABB (Axis-Aligned Bounding Box) collision
- Use simple box geometries for all collision objects
- Keep collision response minimal

### Minimal Physics
- Skip unnecessary and complicated physics like air resistance and input buffering
- Use a simplified movement system that only handles the basics
- Do not use any physics library like Cannon/Rapier unless explicitly mentioned

### Character and Objects
- Represent the player and NPCs as colored boxes for initial development
- Implement basic movement for the player and NPCs

### Movement System
- Use DREI keyboard controls for movement
- Implement proper mapping and handling of control keys
- Ensure controls are compatible with the game and fully functional
- Add logging to verify control functionality

### Bullet & Projectile Physics
- Use a hit radius of 1 unit for bullet detection
- Ensure bullets have unique IDs with normalized direction vectors for consistent speed
- Make bullets visually prominent by sizing correctly in the render function
- Implement comprehensive debug logging for bullets and enemies

### Textures & Assets
- Textures are available in the `client/public/textures` folder
- Use textures with the correct path format: `useTexture("/textures/asphalt.png")`
- Only use textures that actually exist in the specified directory
- If no suitable textures exist, it's acceptable to not use a texture

### Camera Implementation
- Start with a simple follow camera
- Ensure smooth camera movement and appropriate viewing angles

### Game Loop
- Implement a simple update/render loop
- Focus on getting the basic functional game working

### Sound Implementation
- Use provided sample sounds only
- Never generate base64 sounds
- Implement sound effects that enhance the gaming experience

### Background Components
- Never use `Math.random()` directly in JSX or render methods
- Pre-calculate random values outside of render
- Use React hooks like `useState`, `useEffect`, and `useMemo` to manage random values

### UI Design
- For all UI components, use dark backgrounds with light text or light backgrounds with dark text
- Ensure UI is visible over game backgrounds
- Implement responsive design that maintains usability across different screen sizes

## Card System Development

### Card Performance Standards
The card system must maintain these performance thresholds:
- Rendering: 60 FPS during card animations
- Interactions: < 50ms response time for card actions
- Memory: Efficient texture management for card assets

### Holographic Effects
- Implement dynamic holographic effects that vary by card rarity
- Optimize shader performance for mobile devices
- Implement proper z-ordering for overlapping elements
- Enable hardware acceleration for animations

### Card Development Best Practices
- Use TypeScript for type safety in card definitions
- Ensure proper error handling for card effects
- Document all card mechanics and interactions
- Write tests for new card effects and interactions

## Workflow Protocol
When implementing features or fixing issues:

1. **Extract Core Intent**
   - Analyze requests to understand the underlying goals
   - Identify expected outcomes and success criteria

2. **Autonomous Context Discovery**
   - For ANY ambiguity, investigate using tools rather than asking questions
   - Map relevant code locations using filesystem search tools
   - Study existing implementations to understand patterns and conventions

3. **Dependency & Impact Analysis**
   - Identify all components affected by the requested changes
   - Map dependencies and potential ripple effects
   - Note reuse opportunities for existing code patterns

4. **Solution Architecture Development**
   - Evaluate multiple implementation approaches based on:
     - Performance characteristics
     - Maintainability and readability
     - Scalability considerations
     - Security implications
     - Alignment with existing architecture

5. **Implementation**
   - Follow established patterns and conventions
   - Add comprehensive error handling
   - Include detailed comments and documentation

6. **Comprehensive Testing**
   - Test functionality in normal conditions
   - Verify error handling and edge cases
   - Measure performance impact
   - Check for memory leaks
   - Ensure cross-compatibility

7. **Documentation**
   - Update relevant documentation
   - Document new patterns or techniques
   - Add inline comments for complex logic

## 3D Model Generation Guidelines
- Generate the most important/critical models first
- Limit to 3 models per request to avoid timeouts
- Ask user if they want to generate 3D assets before generating
- Scale generated models up by at least 2.5x when loading in the game

## Performance Optimization
- Optimize rendering for 60 FPS
- Use appropriate level of detail based on distance
- Implement frustum culling for off-screen objects
- Minimize shader complexity for mobile compatibility
- Use instanced rendering for similar objects

## WebGL Rendering Best Practices
- Use appropriate z-ordering (renderOrder) for overlapping elements
- Enable hardware acceleration for animations
- Optimize shader complexity for mobile devices
- Monitor texture memory usage
- Add proper context loss handling
- Use mesh instancing for performance where applicable
- Implement level-of-detail (LOD) management for complex scenes
- Pre-compute heavy calculations whenever possible

## Quality Standards
1. **COMBINED OPERATIONS**
   ✓ Test command + file edit sequences
   ✓ Verify state consistency
   ✓ Check error handling
   ✓ Validate rollback procedures

2. **PERFORMANCE VERIFICATION**
   ✓ Command execution timing
   ✓ Memory usage
   ✓ System resource impact
   ✓ Frame rate consistency

3. **DOCUMENTATION UPDATE**
   ✓ Update development guides
   ✓ Document new patterns
   ✓ Provide inline comments for complex logic

4. **CODE QUALITY**
   ✓ Follow TypeScript best practices
   ✓ Use proper error handling
   ✓ Implement clean architecture patterns
   ✓ Maintain consistent coding style
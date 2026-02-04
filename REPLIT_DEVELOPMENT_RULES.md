# Norse Mythology Card Game: Replit Development Rules

## Primary Objective
Act as a highly skilled, proactive, autonomous, and meticulous development partner who takes full ownership of tasks with minimal supervision required. Deliver thoroughly researched, optimally designed, comprehensively tested, and production-ready solutions for the Norse Mythology Card Game on Replit.

## Core Operating Principles
- **Autonomous Problem Solving**: Independently resolve ambiguities through investigation rather than questioning
- **Tool-Driven Research**: Leverage available Replit tools extensively for context gathering and verification
- **Comprehensive Verification**: Thoroughly test all aspects of implementation before delivery
- **Strategic Implementation**: Consider long-term impacts and architectural alignment in all solutions
- **Performance-First Development**: Maintain strict performance thresholds for game mechanics:
  - Rendering: 60 FPS, 16ms frame time
  - Interactions: < 50ms response time
  - Memory: < 512MB usage
  - Loading: < 2s asset time

## Replit Workflow Management

### Workflow Configuration
- Use Replit's workflow system for all long-running processes:
  ```json
  {
    "name": "Game Server",
    "command": "npm run dev",
    "restartOn": {
      "fileChange": ["src/**/*.ts", "src/**/*.tsx"]
    }
  }
  ```
- Never manually restart the server via shell commands; use the workflow controls
- Access workflow logs through the Console tab for debugging
- Port allocation is managed automatically by Replit; avoid hardcoded ports

### Think Tools Integration
- Use the "Use Think Tools" command to strategically analyze complex problems
- Format all Think Tools requests with proper structure
- Leverage Think Tools for card mechanics analysis, performance optimizations, and strategic development planning

### Environment Variables & Secrets
- Store sensitive information (API keys, credentials) using Replit Secrets
- Use the `ask_secrets` tool to request necessary secrets from users
- Access secrets via `process.env.SECRET_NAME` in Node.js code
- Never hard-code sensitive information in source files

## WebGL & 3D Rendering Guidelines

### Initial Setup
- Create a basic @react-three/fiber scene with just a camera, renderer, and lighting
- Begin with a flat plane for terrain
- Use simple directional lighting
- Always bind to `0.0.0.0` rather than `localhost` for proper Replit networking

### 3D Fundamentals
- **Proper THREE.js Import**: Correctly import `import * as THREE from "three"` where needed
- **Movement Direction**: Ensure character movement is in the correct direction (moving toward camera is incorrect)
- **Object Interactions**: Verify that objects interact correctly (e.g., cars should move on terrain without sinking)
- **Camera Positioning**: Ensure initial camera position shows all necessary game components
- **Game State Management**: Implement robust state handling to prevent crashes on game start
- **Browser Compatibility**: Test across major browsers as Replit apps are browser-based

### Simplified Collision Detection
- Start with basic AABB (Axis-Aligned Bounding Box) collision
- Use simple box geometries for all collision objects
- Keep collision response minimal
- Implement spatial partitioning for better performance in complex scenes

### Minimal Physics
- Skip unnecessary and complicated physics like air resistance and input buffering
- Use a simplified movement system that only handles the basics
- Do not use any physics library like Cannon/Rapier unless explicitly mentioned
- Add logging to verify physics behavior in the browser console

### Character and Objects
- Represent the player and NPCs as colored boxes for initial development
- Implement basic movement for the player and NPCs
- Use Replit's 3D model generation tool judiciously for key assets
- Implement level-of-detail (LOD) management for complex scenes

### Movement System
- Use DREI keyboard controls for movement
- Implement proper mapping and handling of control keys
- Ensure controls are compatible with the game and fully functional
- Add logging to verify control functionality
- Implement control fallbacks for touch devices

### Bullet & Projectile Physics
- Use a hit radius of 1 unit for bullet detection
- Ensure bullets have unique IDs with normalized direction vectors for consistent speed
- Make bullets visually prominent by sizing correctly in the render function
- Implement comprehensive debug logging for bullets and enemies
- Use pooling for performance optimization

### Textures & Assets
- Textures are available in the `client/public/textures` folder
- Use textures with the correct path format: `useTexture("/textures/asphalt.png")`
- Only use textures that actually exist in the specified directory
- If no suitable textures exist, it's acceptable to not use a texture
- Optimize textures for web delivery (compression, size)

### Camera Implementation
- Start with a simple follow camera
- Ensure smooth camera movement and appropriate viewing angles
- Add collision detection to prevent camera clipping through objects
- Implement camera damping for smoother experience

### Game Loop
- Implement a simple update/render loop
- Focus on getting the basic functional game working
- Use `useFrame` hook properly in React Three Fiber
- Implement time-based animations rather than frame-based

### Sound Implementation
- Use provided sample sounds only
- Never generate base64 sounds
- Implement sound effects that enhance the gaming experience
- Use the Howler.js library for sound management
- Add volume controls and mute functionality

### Background Components
- Never use `Math.random()` directly in JSX or render methods
- Pre-calculate random values outside of render
- Use React hooks like `useState`, `useEffect`, and `useMemo` to manage random values
- Create pooled instances for repeating background elements

### UI Design
- For all UI components, use dark backgrounds with light text or light backgrounds with dark text
- Ensure UI is visible over game backgrounds
- Implement responsive design that maintains usability across different screen sizes
- Use Tailwind CSS for consistent styling
- Add proper z-ordering for UI elements

## Card System Development

### Card Performance Standards
The card system must maintain these performance thresholds:
- Rendering: 60 FPS during card animations
- Interactions: < 50ms response time for card actions
- Memory: Efficient texture management for card assets
- Batching: Use instanced rendering for multiple cards

### Holographic Effects
- Implement dynamic holographic effects that vary by card rarity
- Optimize shader performance for mobile devices
- Implement proper z-ordering for overlapping elements
- Enable hardware acceleration for animations
- Use shader permutations for quality settings

### Card Development Best Practices
- Use TypeScript for type safety in card definitions
- Ensure proper error handling for card effects
- Document all card mechanics and interactions
- Write tests for new card effects and interactions
- Implement state management with Zustand for card collections

## Database Integration

### Drizzle ORM Integration
- Add necessary Drizzle models and relations to `shared/schema.ts`
- Update `server/storage.ts` to reflect your changes
- Use the `npm run db:push` command for migrations
- Never manually write SQL migrations
- Implement proper error handling for database operations

### Game State Persistence
- Use the Replit Database for game state persistence
- Implement proper serialization/deserialization of game state
- Add periodic state saving to prevent data loss
- Include migration strategies for schema changes
- Add proper transaction handling for critical operations

## Deployment & Publishing

### Replit Deployment Process
- Use the `suggest_deploy` tool when the project is ready for deployment
- Ensure all workflows are properly configured before deployment
- Add appropriate environment variables for production
- Implement proper error handling and logging for production
- Create user-friendly error messages for production issues

### Pre-Deployment Checklist
- All workflows running successfully
- No browser console errors
- Performance meeting thresholds
- All game features functional
- Responsive design working across devices
- Database migrations applied
- Environment variables configured

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
   - Implement browser compatibility checks

6. **Comprehensive Testing**
   - Test functionality in normal conditions
   - Verify error handling and edge cases
   - Measure performance impact
   - Check for memory leaks
   - Ensure cross-browser compatibility
   - Test on both desktop and mobile viewports

7. **Documentation**
   - Update relevant documentation
   - Document new patterns or techniques
   - Add inline comments for complex logic
   - Include browser-specific considerations

## 3D Model Generation Guidelines
- Generate the most important/critical models first
- Limit to 3 models per request to avoid timeouts
- Ask user if they want to generate 3D assets before generating
- Scale generated models up by at least 2.5x when loading in the game
- Implement asset loading progress indicators
- Add fallback placeholders for models that fail to load

## Performance Optimization
- Optimize rendering for 60 FPS
- Use appropriate level of detail based on distance
- Implement frustum culling for off-screen objects
- Minimize shader complexity for mobile compatibility
- Use instanced rendering for similar objects
- Implement asset preloading for critical resources
- Add loading screens for heavy asset loads
- Monitor memory usage using browser dev tools

## WebGL Rendering Best Practices
- Use appropriate z-ordering (renderOrder) for overlapping elements
- Enable hardware acceleration for animations
- Optimize shader complexity for mobile devices
- Monitor texture memory usage
- Add proper context loss handling
- Use mesh instancing for performance where applicable
- Implement level-of-detail (LOD) management for complex scenes
- Pre-compute heavy calculations whenever possible
- Add fallbacks for WebGL features not supported by all browsers

## Debugging & Troubleshooting
- Use browser console for debugging
- Log key lifecycle events for troubleshooting
- Implement performance monitoring in development
- Add proper error boundaries in React components
- Create detailed error logs for easier troubleshooting
- Use React DevTools for component debugging
- Implement a debug mode toggle for development

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
   ✓ Use appropriate linting rules
   ✓ Implement proper typing for all functions

5. **BROWSER COMPATIBILITY**
   ✓ Test in Chrome, Firefox, Safari
   ✓ Validate mobile responsiveness
   ✓ Check touch input compatibility
   ✓ Verify WebGL support

## Collaborative Development
- Use clear commit messages for changes
- Implement feature branches for major additions
- Add proper documentation for team members
- Create clear interfaces between components
- Establish naming conventions for assets and components
- Document API endpoints and data structures

## Replit-Specific Tools
- **web_application_feedback_tool**: Use for capturing screenshots and checking logs
- **bash**: Use for running terminal commands
- **packager_tool**: Use for installing dependencies
- **str_replace_editor**: Use for editing files
- **search_filesystem**: Use for locating files and directories
- **execute_sql_tool**: Use for database operations
- **programming_language_install_tool**: Use for installing programming languages
- **create_postgresql_database_tool**: Use for creating PostgreSQL databases
- **check_database_status**: Use for verifying database connections
- **suggest_deploy**: Use when the project is ready for deployment
- **generate_3d_model**: Use for generating 3D game assets
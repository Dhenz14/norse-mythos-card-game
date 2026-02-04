# Agent Requested Documentation

This file serves as a reference for systematic troubleshooting protocols that can be triggered through specific keywords during our conversation.

## Available Protocols

### Systematic Re-Diagnosis Protocol

## Quick Reference

| Trigger | `refer to failedfix` |
|---------|----------------------|
| Purpose | Systematically diagnose and fix issues when previous attempts have failed |
| Tools   | search_filesystem, str_replace_editor, bash, restart_workflow |

## 1. Protocol Overview

1.1. **Purpose**: Use this protocol when previous attempts to fix an issue have failed
1.2. **Expected Outcome**: Identification of the true root cause and implementation of a targeted solution
1.3. **Required Context**: Details about the previous fix attempts and current symptoms

## 2. Re-Scope the Problem

2.1. **Discard Prior Assumptions**
    ```javascript
    // Document the issue afresh
    str_replace_editor({
      command: "view",
      path: "BUG_MEMORY.md"
    });
    ```
    - Note: Avoid being influenced by previous diagnoses

2.2. **Reassess Core Functionality**
    ```javascript
    // Search for the affected component
    search_filesystem({
      query_description: "Find files related to the affected functionality"
    });
    ```

2.3. **Broaden Investigation Scope**
    ```javascript
    // Look for adjacent systems that might be involved
    search_filesystem({
      query_description: "Find related systems that interact with the affected component"
    });
    ```

2.4. **Focus on User Goal**
    - Clearly define what successful resolution looks like
    - Prioritize user experience over technical elegance

## 3. Map the System Structure

3.1. **Gather Configuration Information**
    ```javascript
    // View configuration files
    str_replace_editor({
      command: "view",
      path: "./config/relevant-config.ts"
    });
    ```

3.2. **Develop System Interaction Model**
    ```javascript
    // Find interface and type definitions
    search_filesystem({
      query_description: "Find interface definitions for the affected components",
      class_names: ["RelevantInterface", "RelevantType"]
    });
    ```

3.3. **Trace Data Flows**
    ```javascript
    // Find data handling functions
    search_filesystem({
      function_names: ["processData", "handleInput", "transformOutput"]
    });
    ```

3.4. **Build Architectural View**
    - Create a mental model of all involved components
    - Identify entry points and exit points

## 4. Hypothesize Root Causes

4.1. **List Potential Causes**
    - Configuration errors or mismatches
    - Incorrect API usage or logic flaws
    - Data quality/format issues
    - Dependency or version conflicts
    - Infrastructure misconfigurations
    - Permission/authentication problems
    - Resource constraints or race conditions

4.2. **Rank Hypotheses**
    - Order by likelihood based on symptoms
    - Consider frequency of similar issues in the past

## 5. Gather Evidence Systematically

5.1. **Collect Evidence for Top Hypotheses**
    ```javascript
    // Search for relevant code patterns
    search_filesystem({
      code: ["suspected pattern", "error handling", "null check"]
    });
    ```

5.2. **Document Findings**
    ```javascript
    // Create evidence document if needed
    str_replace_editor({
      command: "create",
      path: "./debug-evidence.md",
      file_text: "# Debug Evidence\n\n## Hypothesis 1\n- Finding 1\n- Finding 2\n\n## Hypothesis 2\n- Finding 1\n- Finding 2"
    });
    ```

5.3. **Avoid Confirmation Bias**
    - Actively seek evidence that disproves each hypothesis
    - Document counter-evidence

## 6. Validate Configurations

6.1. **Examine Configuration Files**
    ```javascript
    // Check configuration files
    str_replace_editor({
      command: "view",
      path: "./config/game-settings.ts"
    });
    ```

6.2. **Compare Environment Settings**
    ```javascript
    // Check environment-specific configurations
    bash({
      command: "grep -r 'environment' --include='*.ts' ./config"
    });
    ```

6.3. **Verify Values Match Expectations**
    ```javascript
    // Find where config values are used
    search_filesystem({
      code: ["getConfig", "settings.", "config."]
    });
    ```

## 7. Trace Execution Flow

7.1. **Follow Code Path**
    ```javascript
    // Find entry points
    search_filesystem({
      function_names: ["initializeFeature", "handleEvent", "processRequest"]
    });
    ```

7.2. **Add Diagnostic Logging**
    ```javascript
    // Add temporary logging
    str_replace_editor({
      command: "str_replace",
      path: "./path/to/suspect-file.ts",
      old_str: "function processData(input) {",
      new_str: "function processData(input) {\n  console.log('Debug: Processing data', input);"
    });
    ```

7.3. **Identify Deviation Point**
    ```javascript
    // Restart to capture logs
    restart_workflow({
      name: "Start Game"
    });
    
    // Check logs
    bash({
      command: "grep 'Debug:' ./.replit/logs/console.log"
    });
    ```

## 8. Check Dependencies

8.1. **Verify Dependency Versions**
    ```javascript
    // Check package versions
    bash({
      command: "npm list | grep suspected-package"
    });
    ```

8.2. **Check External Services**
    ```javascript
    // Look for API configurations
    search_filesystem({
      code: ["api", "endpoint", "fetch", "axios"]
    });
    ```

## 9. Examine Logs

9.1. **Analyze Error Patterns**
    ```javascript
    // Search for errors in logs
    bash({
      command: "grep -i 'error\\|exception\\|fail' ./.replit/logs/console.log | tail -n 50"
    });
    ```

9.2. **Check Error Timing**
    ```javascript
    // Look for time patterns in errors
    bash({
      command: "grep -i 'error' ./.replit/logs/console.log | cut -d ' ' -f1-3 | sort"
    });
    ```

## 10. Identify Confirmed Root Cause

10.1. **Synthesize Evidence**
     - Compile all findings into a coherent explanation
     - Ensure it explains all observed symptoms

10.2. **Document Root Cause**
     ```javascript
     // Document the root cause
     str_replace_editor({
       command: "str_replace",
       path: "BUG_MEMORY.md",
       old_str: "## Unresolved Issues\n\n### Issue: [Description]",
       new_str: "## Unresolved Issues\n\n### Issue: [Description]\n\n#### Root Cause\n- [Detailed explanation of root cause]"
     });
     ```

## 11. Implement Targeted Solution

11.1. **Design Minimal Fix**
     ```javascript
     // Make the necessary changes
     str_replace_editor({
       command: "str_replace",
       path: "./path/to/file.ts",
       old_str: "// Problematic code",
       new_str: "// Fixed code with explanation of why this fixes the issue"
     });
     ```

11.2. **Add Safeguards**
     ```javascript
     // Add validation or error handling
     str_replace_editor({
       command: "str_replace",
       path: "./path/to/file.ts",
       old_str: "function process(data) {",
       new_str: "function process(data) {\n  if (!data || typeof data !== 'object') {\n    console.error('Invalid data format');\n    return null;\n  }"
     });
     ```

## 12. Verify Solution

12.1. **Test Positive Cases**
     ```javascript
     // Restart application
     restart_workflow({
       name: "Start Game"
     });
     ```

12.2. **Test Edge Cases**
     ```javascript
     // Check logs for edge case handling
     bash({
       command: "grep -i 'error\\|warning' ./.replit/logs/console.log | tail -n 20"
     });
     ```

12.3. **Verify User Experience**
     ```javascript
     // Get visual confirmation
     web_application_feedback_tool({
       workflow_name: "Start Game",
       query: "Has the issue been resolved? Verify that [specific functionality] is working correctly."
     });
     ```

## 13. Document Resolution

13.1. **Update Bug Memory**
     ```javascript
     // Document the fix
     str_replace_editor({
       command: "str_replace",
       path: "BUG_MEMORY.md",
       old_str: "## Unresolved Issues\n\n### Issue: [Description]",
       new_str: "## Resolved Issues\n\n### Issue: [Description]\n\n#### Root Cause\n- [Explanation]\n\n#### Solution\n- [Explanation of fix]\n\n#### Verification\n- [How it was verified]"
     });
     ```

13.2. **Provide Prevention Recommendations**
     - Document how to prevent similar issues
     - Suggest improvements to development practices

# Card Bug Pattern Recognition Protocol

## Quick Reference

| Trigger | `refer to cardbugs` |
|---------|----------------------|
| Purpose | Identify and fix common issues in the Norse Card Game's card system |
| Tools   | search_filesystem, str_replace_editor, bash, restart_workflow |

## 1. Protocol Overview

1.1. **Purpose**: Efficiently diagnose and fix common patterns of card system bugs
1.2. **Expected Outcome**: Resolution of card-related issues with minimal code changes
1.3. **Common Bug Categories**:
     - Missing or incorrect card properties
     - Duplicate properties in card definitions
     - Syntax errors in card files
     - Card effect implementation issues
     - Card rendering performance problems

## 2. Identify Bug Category

2.1. **Check for Missing Properties**
    ```javascript
    // Search for cards with heroClass but no class property
    search_filesystem({
      code: ["heroClass:", "type:"],
      function_names: ["createCard"]
    });
    ```

2.2. **Check for Duplicate Properties**
    ```javascript
    // Search for duplicate class properties
    search_filesystem({
      code: ["class:", "class:"],
      function_names: ["createCard"]
    });
    ```

2.3. **Check for Syntax Errors**
    ```javascript
    // Look for common syntax error patterns
    search_filesystem({
      code: ["},\n},{", "}\n{", ",,"]
    });
    ```

2.4. **Check for Effect Issues**
    ```javascript
    // Search for effect implementations
    search_filesystem({
      function_names: ["applyBattlecry", "applyDeathrattle", "triggerEffect"]
    });
    ```

2.5. **Check for Performance Issues**
    ```javascript
    // Search for render functions
    search_filesystem({
      function_names: ["renderCard", "updateCardVisual", "applyCardEffect"]
    });
    ```

## 3. Locate Affected Files

3.1. **Find Card Definition Files**
    ```javascript
    // Search for card definition files
    search_filesystem({
      query_description: "Find card definition files containing the affected cards"
    });
    ```

3.2. **Find Effect Implementation Files**
    ```javascript
    // Search for effect implementations
    search_filesystem({
      query_description: "Find effect implementation files related to the card issue"
    });
    ```

3.3. **Find Visual Component Files**
    ```javascript
    // Search for visual components
    search_filesystem({
      query_description: "Find visual component files for card rendering",
      class_names: ["CardRenderer", "CardVisual", "CardEffect"]
    });
    ```

## 4. Missing Property Fixes

4.1. **Add Missing Class Property**
    ```javascript
    // View file to identify missing property
    str_replace_editor({
      command: "view",
      path: "./client/src/cards/problematicCard.ts"
    });
    
    // Add missing class property
    str_replace_editor({
      command: "str_replace",
      path: "./client/src/cards/problematicCard.ts",
      old_str: "  heroClass: \"Thor\",\n  collectible: true,",
      new_str: "  heroClass: \"Thor\",\n  class: \"Thor\",\n  collectible: true,"
    });
    ```

4.2. **Fix Inconsistent Capitalization**
    ```javascript
    // Fix capitalization issues
    str_replace_editor({
      command: "str_replace",
      path: "./client/src/cards/problematicCard.ts",
      old_str: "  class: \"thor\",",
      new_str: "  class: \"Thor\","
    });
    ```

## 5. Duplicate Property Fixes

5.1. **Remove Duplicate Root Properties**
    ```javascript
    // Remove duplicated properties
    str_replace_editor({
      command: "str_replace",
      path: "./client/src/cards/problematicCard.ts",
      old_str: "  class: \"Thor\",\n  cost: 3,\n  class: \"Thor\",",
      new_str: "  class: \"Thor\",\n  cost: 3,"
    });
    ```

5.2. **Remove Nested Properties**
    ```javascript
    // Remove properties from effect objects
    str_replace_editor({
      command: "str_replace",
      path: "./client/src/cards/problematicCard.ts",
      old_str: "  battlecry: {\n    class: \"Thor\",\n    effect: (game, card) => {",
      new_str: "  battlecry: {\n    effect: (game, card) => {"
    });
    ```

## 6. Syntax Error Fixes

6.1. **Fix Missing Commas**
    ```javascript
    // Add missing commas
    str_replace_editor({
      command: "str_replace",
      path: "./client/src/cards/problematicCard.ts",
      old_str: "}\n{",
      new_str: "},\n{"
    });
    ```

6.2. **Fix Extra Commas**
    ```javascript
    // Remove extra commas
    str_replace_editor({
      command: "str_replace",
      path: "./client/src/cards/problematicCard.ts", 
      old_str: "  attack: 5,\n  health: 5,\n},",
      new_str: "  attack: 5,\n  health: 5\n},"
    });
    ```

## 7. Effect Implementation Fixes

7.1. **Fix Battlecry Trigger**
    ```javascript
    // Fix battlecry implementation
    str_replace_editor({
      command: "str_replace",
      path: "./client/src/effects/battlecryEffects.ts",
      old_str: "function applyBattlecry(card) {",
      new_str: "function applyBattlecry(card, game) {"
    });
    ```

7.2. **Fix Effect Application**
    ```javascript
    // Ensure proper effect application
    str_replace_editor({
      command: "str_replace",
      path: "./client/src/effects/cardEffects.ts",
      old_str: "target.applyEffect(effect);",
      new_str: "if (target && typeof target.applyEffect === 'function') {\n  target.applyEffect(effect);\n}"
    });
    ```

## 8. Performance Issue Fixes

8.1. **Fix Memory Leaks**
    ```javascript
    // Add cleanup code
    str_replace_editor({
      command: "str_replace",
      path: "./client/src/components/Card.tsx",
      old_str: "useEffect(() => {\n  // Setup code\n}, []);",
      new_str: "useEffect(() => {\n  // Setup code\n  return () => {\n    // Cleanup code\n  };\n}, []);"
    });
    ```

8.2. **Optimize Rendering**
    ```javascript
    // Add memoization
    str_replace_editor({
      command: "str_replace",
      path: "./client/src/components/Card.tsx",
      old_str: "function CardComponent(props) {",
      new_str: "const CardComponent = React.memo(function CardComponent(props) {"
    });
    
    // Close the memo wrapper at end of file
    str_replace_editor({
      command: "str_replace",
      path: "./client/src/components/Card.tsx",
      old_str: "export default CardComponent;",
      new_str: "});\n\nexport default CardComponent;"
    });
    ```

## 9. Verification

9.1. **Syntax Check**
    ```javascript
    // Run TypeScript check
    bash({
      command: "npx tsc --noEmit"
    });
    ```

9.2. **Restart and Test**
    ```javascript
    // Restart the game server
    restart_workflow({
      name: "Start Game"
    });
    ```

9.3. **Verify Fix**
    ```javascript
    // Verify fix visually
    web_application_feedback_tool({
      workflow_name: "Start Game",
      query: "Are the cards now displaying and functioning correctly?"
    });
    ```

## 10. Documentation

10.1. **Update Bug Memory**
     ```javascript
     // Document the card bug fix
     str_replace_editor({
       command: "str_replace",
       path: "BUG_MEMORY.md",
       old_str: "## Unresolved Issues\n\n### Card Issue: [Description]",
       new_str: "## Resolved Issues\n\n### Card Issue: [Description]\n\n#### Solution\n- Applied standard card property fix pattern\n- Fixed syntax issues in card definition\n- Added proper validation in effect handlers"
     });
     ```

10.2. **Add Prevention Guidance**
     - Document the fix pattern for future reference
     - Suggest improvements to card validation process

# Card Rendering Debug Protocol

## Quick Reference

| Trigger | `refer to renderbug` |
|---------|----------------------|
| Purpose | Identify and fix 3D card rendering and animation issues |
| Tools   | search_filesystem, str_replace_editor, bash, restart_workflow |

## 1. Protocol Overview

1.1. **Purpose**: Debug and fix visual rendering issues in the 3D card system
1.2. **Expected Outcome**: Smooth card animations and correct visual appearance
1.3. **Common Issue Categories**:
     - Visual artifacts (z-fighting, texture issues)
     - Performance problems (frame drops, memory leaks)
     - Animation glitches (stuttering, timing issues)

## 2. Initial Diagnosis

2.1. **Collect Error Information**
    ```javascript
    // Check console for WebGL errors
    bash({
      command: "grep -i 'webgl\\|three\\|render\\|shader' ./.replit/logs/console.log | tail -n 50"
    });
    ```

2.2. **Identify Issue Category**
    ```javascript
    // Check performance logs
    bash({
      command: "grep -i 'fps\\|frame\\|performance' ./.replit/logs/console.log | tail -n 20"
    });
    ```

2.3. **Search for Related Components**
    ```javascript
    // Find rendering components
    search_filesystem({
      query_description: "Find card rendering components",
      class_names: ["CardRenderer", "CardVisual", "ThreeJSComponent"]
    });
    ```

## 3. Visual Artifact Debugging

3.1. **Check for Z-Fighting**
    ```javascript
    // Find z-index or position settings
    search_filesystem({
      code: ["position.z", "z-index", "renderOrder", "depthTest"]
    });
    
    // View relevant file
    str_replace_editor({
      command: "view",
      path: "./client/src/components/Card3D.tsx"
    });
    ```

3.2. **Fix Z-Order Issues**
    ```javascript
    // Adjust z-ordering
    str_replace_editor({
      command: "str_replace",
      path: "./client/src/components/Card3D.tsx",
      old_str: "mesh.renderOrder = 0;",
      new_str: "mesh.renderOrder = 1;"
    });
    
    // Ensure proper depth testing
    str_replace_editor({
      command: "str_replace",
      path: "./client/src/components/Card3D.tsx",
      old_str: "material.depthTest = true;",
      new_str: "material.depthTest = true;\nmaterial.depthWrite = true;"
    });
    ```

3.3. **Check Texture Mapping**
    ```javascript
    // Find texture loading code
    search_filesystem({
      code: ["textureLoader", "useTexture", "new THREE.Texture"]
    });
    
    // Fix texture settings
    str_replace_editor({
      command: "str_replace",
      path: "./client/src/components/CardMaterial.tsx",
      old_str: "texture.wrapS = THREE.RepeatWrapping;",
      new_str: "texture.wrapS = THREE.ClampToEdgeWrapping;"
    });
    ```

3.4. **Fix Lighting Issues**
    ```javascript
    // Find lighting setup
    search_filesystem({
      code: ["DirectionalLight", "AmbientLight", "PointLight"]
    });
    
    // Adjust lighting
    str_replace_editor({
      command: "str_replace",
      path: "./client/src/components/CardScene.tsx",
      old_str: "const light = new THREE.DirectionalLight(0xffffff, 1);",
      new_str: "const light = new THREE.DirectionalLight(0xffffff, 0.8);\nconst ambientLight = new THREE.AmbientLight(0xffffff, 0.4);\nscene.add(ambientLight);"
    });
    ```

## 4. Performance Debugging

4.1. **Analyze Frame Rate Issues**
    ```javascript
    // Add performance monitoring
    str_replace_editor({
      command: "str_replace",
      path: "./client/src/components/CardScene.tsx",
      old_str: "useFrame(() => {",
      new_str: "useFrame(({ gl }) => {\n  // Monitor performance\n  if (window.performance && typeof window.performance.now === 'function') {\n    const now = window.performance.now();\n    if (window.lastFrameTime) {\n      const delta = now - window.lastFrameTime;\n      if (delta > 20) { // Less than 50 FPS\n        console.warn('Frame time high:', delta.toFixed(2), 'ms');\n      }\n    }\n    window.lastFrameTime = now;\n  }"
    });
    ```

4.2. **Check Texture Memory Usage**
    ```javascript
    // Add texture size monitoring
    str_replace_editor({
      command: "str_replace",
      path: "./client/src/hooks/useCardTexture.ts",
      old_str: "texture.needsUpdate = true;",
      new_str: "texture.needsUpdate = true;\nconsole.log(`Texture loaded: ${texture.image.width}x${texture.image.height}`);"
    });
    
    // Restart to collect data
    restart_workflow({
      name: "Start Game"
    });
    
    // Check texture sizes
    bash({
      command: "grep 'Texture loaded' ./.replit/logs/console.log"
    });
    ```

4.3. **Optimize Shaders**
    ```javascript
    // Find shader code
    search_filesystem({
      code: ["vertexShader", "fragmentShader", "ShaderMaterial"]
    });
    
    // Simplify fragment shader
    str_replace_editor({
      command: "view",
      path: "./client/src/shaders/cardFragment.glsl"
    });
    
    // Optimize complex shader operations
    str_replace_editor({
      command: "str_replace",
      path: "./client/src/shaders/cardFragment.glsl",
      old_str: "for (int i = 0; i < 10; i++) {\n  // Complex calculation\n}",
      new_str: "// Simplified calculation"
    });
    ```

## 5. Animation Debugging

5.1. **Check Animation Timing**
    ```javascript
    // Find animation definitions
    search_filesystem({
      code: ["useSpring", "animate", "transition", "gsap.to"]
    });
    
    // View animation code
    str_replace_editor({
      command: "view",
      path: "./client/src/animations/cardAnimations.ts"
    });
    ```

5.2. **Fix Stuttering Animations**
    ```javascript
    // Add hardware acceleration
    str_replace_editor({
      command: "str_replace",
      path: "./client/src/components/Card.tsx",
      old_str: "style={{ transform",
      new_str: "style={{ transform, willChange: 'transform', backfaceVisibility: 'hidden'"
    });
    
    // Optimize animation performance
    str_replace_editor({
      command: "str_replace",
      path: "./client/src/animations/cardAnimations.ts",
      old_str: "duration: 300,",
      new_str: "duration: 300, easing: 'cubic-bezier(0.25, 0.1, 0.25, 1)',"
    });
    ```

5.3. **Fix Interpolation Issues**
    ```javascript
    // Find interpolation code
    search_filesystem({
      code: ["lerp", "interpolate", "inBetween"]
    });
    
    // Fix interpolation
    str_replace_editor({
      command: "str_replace",
      path: "./client/src/utils/mathUtils.ts",
      old_str: "return start + (end - start) * t;",
      new_str: "return start + (end - start) * (t < 0 ? 0 : t > 1 ? 1 : t);"
    });
    ```

## 6. WebGL Context Debugging

6.1. **Check for Lost Context**
    ```javascript
    // Add context loss handling
    str_replace_editor({
      command: "str_replace",
      path: "./client/src/components/ThreeJSCanvas.tsx",
      old_str: "useEffect(() => {",
      new_str: "useEffect(() => {\n  const canvas = gl.domElement;\n  canvas.addEventListener('webglcontextlost', (e) => {\n    console.error('WebGL context lost');\n    e.preventDefault();\n  });\n  canvas.addEventListener('webglcontextrestored', () => {\n    console.log('WebGL context restored');\n  });"
    });
    ```

6.2. **Check Renderer Settings**
    ```javascript
    // View renderer configuration
    search_filesystem({
      code: ["new THREE.WebGLRenderer", "createRenderer"]
    });
    
    // Optimize renderer settings
    str_replace_editor({
      command: "str_replace",
      path: "./client/src/components/ThreeJSCanvas.tsx",
      old_str: "const renderer = new THREE.WebGLRenderer();",
      new_str: "const renderer = new THREE.WebGLRenderer({\n  antialias: true,\n  powerPreference: 'high-performance',\n  precision: 'highp'\n});"
    });
    ```

## 7. Verification and Testing

7.1. **Restart and Test Fixes**
    ```javascript
    // Restart to apply changes
    restart_workflow({
      name: "Start Game"
    });
    ```

7.2. **Verify Visual Appearance**
    ```javascript
    // Get user feedback on visuals
    web_application_feedback_tool({
      workflow_name: "Start Game",
      query: "Are the card visuals rendering correctly without artifacts?"
    });
    ```

7.3. **Verify Animation Smoothness**
    ```javascript
    // Get feedback on animations
    web_application_feedback_tool({
      workflow_name: "Start Game",
      query: "Are the card animations smooth without stuttering?"
    });
    ```

7.4. **Check Performance**
    ```javascript
    // Check FPS after fixes
    bash({
      command: "grep 'Frame time high' ./.replit/logs/console.log | wc -l"
    });
    ```

## 8. Documentation

8.1. **Update Bug Memory**
    ```javascript
    // Document rendering fix
    str_replace_editor({
      command: "str_replace",
      path: "BUG_MEMORY.md",
      old_str: "## Unresolved Issues\n\n### Rendering Issue: [Description]",
      new_str: "## Resolved Issues\n\n### Rendering Issue: [Description]\n\n#### Solution\n- Fixed z-ordering issues\n- Optimized shader performance\n- Improved animation timing\n- Applied hardware acceleration"
    });
    ```

8.2. **Create Best Practices**
    ```javascript
    // Add rendering best practices
    str_replace_editor({
      command: "str_replace",
      path: "DEVELOPMENT_RULES_UPDATED.md",
      old_str: "## Performance Standards",
      new_str: "## Performance Standards\n\n### WebGL Rendering Best Practices\n- Use appropriate z-ordering (renderOrder) for overlapping elements\n- Enable hardware acceleration for animations\n- Optimize shader complexity for mobile devices\n- Monitor texture memory usage\n- Add proper context loss handling"
    });
    ```

## Usage Instructions

To activate these protocols during our conversation:

1. Type "refer to failedfix" to trigger the Systematic Re-Diagnosis Protocol
2. Type "refer to cardbugs" to trigger the Card Bug Pattern Recognition
3. Type "refer to renderbug" to trigger the Card Rendering Debug Protocol
4. Type "refer to tools" to access the Replit Tool Integration Guide

These protocols will guide our troubleshooting process with a systematic approach to identifying and resolving complex issues using Replit's built-in tools.

## Replit Tool Integration

For detailed guidance on integrating these protocols with Replit's specific capabilities, refer to the REPLIT_TOOL_INTEGRATION.md document. This guide provides practical examples for:

1. **Advanced Search Patterns** - Specialized search techniques for card game issues
2. **Sequential File Operations** - Standardized patterns for implementing and modifying card effects
3. **Workflow Management** - Techniques for monitoring and managing game server workflows
4. **Testing Framework** - Templates and sequences for verifying card functionality
5. **Debugging Integration** - Structured approaches to troubleshooting using Replit tools

All protocols in this document are designed to work seamlessly with Replit's agent chat interface and tooling.
# Advanced Feature Implementation Protocol

This document outlines the systematic approach for implementing new features in the Norse Card Game. You can reference this protocol during development by using the phrase "refer to new features".

## 1. Deep Analysis & Research

### Intent Understanding
- Thoroughly analyze user requirements to extract both explicit and implicit needs
- Clarify ambiguities through investigation rather than questioning
- Connect feature requests to core gameplay objectives

### System Exploration
- Comprehensively identify all relevant components that will be affected:
  - Card definitions and properties
  - Game mechanics and rules
  - UI/UX elements
  - Backend services
  - Performance considerations

### Tool Utilization
- Maximize all available inspection capabilities:
  - Code search to find related implementations
  - Documentation review
  - Performance profiling for critical paths
  - Memory usage analysis for rendering

### Contextual Investigation
Before planning changes, deeply investigate:
- Existing patterns and conventions in similar features
- Architecture and design principles of the card system
- Performance characteristics and thresholds
- Security considerations for multiplayer aspects

### Test-Driven Development
- Write comprehensive tests that capture all requirements
- Implement code until all tests pass
- Verify gameplay balance and fairness

## 2. Strategic System Assessment

### Dependency Mapping
- Proactively identify all affected components:
  - Card definition files
  - Game mechanics
  - Animation systems
  - State management
  - Network synchronization
  - UI rendering pipeline

### Impact Analysis
- Trace potential ripple effects throughout the system:
  - How will this affect existing card interactions?
  - Will it impact performance or memory usage?
  - Does it require database schema changes?
  - What about backwards compatibility?

### Code Reuse Optimization
- Actively search for existing implementations:
  - Similar card effects or mechanics
  - UI patterns and components
  - Animation systems
  - State management approaches
- Prioritize reusing established patterns
- Ensure consistency with project conventions

### Technical Debt Awareness
- Identify and document existing technical debt in affected areas
- Consider if the new feature should address technical debt

## 3. Implementation Strategy & Autonomous Problem-Solving

### Design Alternatives
Consider multiple implementation approaches based on:
- Long-term maintainability
- Performance optimization
- Fault tolerance and robustness
- Architectural cohesion
- Scalability characteristics

### Self-Directed Ambiguity Resolution
Independently resolve uncertainties by:
- Investigating codebase patterns
- Examining configuration files
- Analyzing infrastructure setup
- Reviewing documentation

### Evidence-Based Decision Making
Document specific findings that inform key decisions:
- "Confirmed similar effect implementation in [file]"
- "Identified existing validation pattern in related modules"
- "Found memory optimization technique in similar feature"
- "Discovered rendering optimization in comparable visual effect"

## 4. Comprehensive Validation

### Test Coverage
Implement exhaustive testing addressing:
- Normal gameplay scenarios
- Edge cases (e.g., max board size, turn limits)
- Interaction with all possible card combinations
- Error handling and recovery paths
- Performance under various gameplay conditions

### Validation Tooling
Utilize appropriate tools for verification:
- Unit tests for isolated mechanics
- Integration tests for card interactions
- Performance tests for rendering and animations
- Memory profiling for resource usage

### Quality Assurance
Verify adherence to project standards for:
- Card definition format and structure
- Animation smoothness (60 FPS target)
- Resource usage (under 512MB)
- Loading time (under 2s)
- Interaction responsiveness (under 50ms)

## 5. Safe Implementation & Execution

### Change Management
- Implement modifications based on thorough research
- Use carefully structured commits with clear descriptions
- Maintain compatibility with existing cards and mechanics

### Risk Mitigation
For high-risk operations:
- Validate changes in isolated test environments
- Document potential side effects
- Implement feature flags if needed
- Create rollback plans

### Progressive Implementation
- Make changes incrementally with validation at each step:
  1. Core mechanics implementation
  2. Card definition updates
  3. Visual and animation effects
  4. UI integration
  5. Network synchronization

### Security-First Approach
- Proactively identify and address potential security implications
- Validate all user inputs and network messages
- Protect against exploitable game mechanics

## 6. Comprehensive Documentation & Reporting

### Implementation Summary
- Concisely document all implemented changes
- Create examples of how to use the new feature

### Research Findings
- Highlight key discoveries that informed implementation decisions
- Document optimization techniques discovered

### Design Rationale
- Explain significant architectural and design choices
- Document any deviations from existing patterns

### Validation Results
- Report comprehensive test coverage and outcomes
- Include performance and resource usage metrics

### Future Considerations
- Identify potential future improvements or optimizations
- Note possible expansions of the feature

### Communication Efficiency
- Structure all documentation for maximum clarity
- Update existing documentation to reflect new features

## Example Application

**Feature Request: "Implement a new 'Prophecy' card mechanic that allows players to see the top three cards of their deck and rearrange them."**

### Analysis & Research
- Investigate existing deck manipulation effects
- Study card drawing and shuffle mechanics
- Examine UI patterns for card selection and rearrangement
- Review performance impact of rendering multiple cards simultaneously

### Implementation Approach
1. Create core Prophecy mechanic in game logic
2. Develop UI for viewing and rearranging cards
3. Implement animation system for smooth card movement
4. Add network synchronization for multiplayer games
5. Create sample prophecy cards to demonstrate the mechanic

### Validation Strategy
- Test with empty decks
- Test with 1-2 cards remaining
- Verify interaction with shuffle effects
- Measure performance with maximum board state
- Validate animation smoothness

### Documentation
- Document the Prophecy API for card definitions
- Create usage examples for card creators
- Update card creation guide with the new mechanic
- Add entries to game glossary explaining Prophecy
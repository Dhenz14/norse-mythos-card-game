# Card Hover Magnification Bug Tracking

## Bug Description
A persistent bug in the card game where cards magnify/hover when the cursor is positioned over empty space above the cards in the player's battlefield. The hover detection area extends significantly beyond the actual card boundaries, sometimes up to an inch above the cards.

## Visual Symptoms
- Cards magnify when hovering over empty space above them
- Hover effects trigger when cursor is up to an inch above cards
- Hover effects only work on part of the card 
- "Grab hover" animation appears between cards or over the battlefield
- "Ghost card" effect showing faint borders
- Battlefield highlighting when not hovering
- Cards flickering with the top half cutting on/off randomly when hovered

## Root Causes Identified
1. **Oversized Card Slots**: The DOM elements containing cards have significantly larger height than the cards themselves, creating invisible hover areas
2. **Event Propagation Issues**: Events bubble through multiple layers, causing unintended hover effects
3. **Complex Hover Implementation**: Multiple hover detection systems overlap (CSS hover, React state, custom managers)
4. **CSS Structure Conflict**: Competing styles and hover effects from different components
5. **Pointer Event Issues**: Inconsistent `pointerEvents` settings across elements

## Attempted Solutions

### 1. CSS and Style-based Fixes
- **Added CardHoverScaleFix component**: Disabled hover scaling to prevent magnification bug
- **Created CardSlotSizeFix component**: Attempted to fix oversized card slots by setting fixed heights
- **Implemented BattlefieldCardsFix.css**: Applied specific CSS targeting the card containers
- **Applied !important flags**: Tried to override conflicting styles

### 2. Event Handling Fixes
- **Created StrictCardHitboxResolver**: For precise hitbox detection
- **Added PlayerAreaHoverBlocker**: Installed hover protection for player area
- **Implemented PlayerCardsFixedHitbox**: Applied fixed-size hitboxes to player cards
- **Created EnhancedHoverInterceptor**: Global hover interception to prevent events on non-card areas

### 3. Debugging Infrastructure
- **Enhanced CardBoundaryDebugger**: Visual debugging of card boundaries and hover events
- **Created ObserveCardSlots component**: DOM observation to understand the card slot structure
- **Added logging**: Extensive console logging of hover events and dimensions

### 4. Structural Approaches
- **Created BattlefieldCardsBoundsFix**: Component to directly modify card slot dimensions
- **Modified overflow settings**: Tested various overflow settings to contain hover events
- **Applied clip-path**: Used CSS clip-path to create precise card boundaries

## Current Status
The issue persists despite multiple fix attempts. The debug visualization clearly shows oversized card slot hitboxes (with red dashed outlines) that extend significantly above the actual cards. Our fixes are being applied but something is overriding them or the fundamental structure of the component is creating these oversized areas.

## Critical Insights - April 25, 2025 (Evening)
After analyzing the logs from PhantomSlotBlocker component, we discovered that the selectors aren't finding any elements:
```
["PhantomSlotBlocker - No red outlined elements found, targeting by selectors"]
```

This reveals a fundamental mismatch between:
1. How CardBoundaryDebugger visualizes the phantom card slots (with red dashed outlines)
2. The actual DOM structure and class names used in the Battlefield component

The "card-slot" class we're targeting doesn't exist in the actual DOM. Instead, the phantom slots appear to be created by div elements with different classes like:
- `transform transition-transform`
- Parent elements in the player-battlefield-zone

## Next Approaches
1. Direct DOM structure modification within the Battlefield.tsx component
2. Capture-phase event handling to block all events before they reach card slots
3. Complete card rendering system override
4. More aggressive direct style injection targeting the specific problematic elements
5. Refined selector approach that matches the actual DOM structure rather than relying on ".card-slot" class

## Failed Approach - April 24, 2025
The CardSlotOverrideFix component was implemented with a direct approach to fix the card slots issue:

1. It injected CSS with `!important` flags to constrain heights
2. It added capture-phase event handlers to block hover events
3. It created a protective layer above cards
4. It directly modified DOM elements that were believed to cause the issue

**Why it failed:** The implementation targeted incorrect selectors - we used `.player-battlefield-zone [class*="transform"]` and similar selectors, but the debug visualization shows the actual card slot structure with red dashed outlines is created differently. Our CSS and event handlers didn't effectively match the elements that create these extended hitboxes.

**Root Issue Discovery:** Looking at the CardBoundaryDebugger component, we can see that it's explicitly targeting elements with the `.card-slot` class, which are getting the red dashed outlines. However, our CardSlotSizeFix and new CardSlotOverrideFix components were targeting different elements. This mismatch explains why the fix wasn't working.

From analyzing the code:
1. The CardBoundaryDebugger properly identifies the problematic `.card-slot` elements with red outlines
2. Our fixes were targeting `.player-battlefield-zone`, `.transform`, and other elements
3. The Battlefield component creates a hover capture system but the event handling may be incomplete
4. The CSS classes and DOM structure are more complex than our fixes accounted for

## Failed Approach - April 25, 2025
The DirectCardSlotFix component attempted to target exactly the right elements by focusing only on the `.card-slot` class:

1. It applied stricter CSS targeting with specific `.card-slot` selectors and `!important` flags
2. It added protective shields above cards to block hover events in the "danger zone"
3. It used capture-phase event handlers to intercept hover events before they reached card slots
4. It set up mutations observers to detect when card slots were added to the DOM

**Why it failed:** The console log showed "No .card-slot elements found," indicating that our selector still isn't matching the elements that the CardBoundaryDebugger is outlining with red dashed lines. Despite our more targeted approach, we're still not correctly identifying the problematic elements.

**Critical Insight:** There appears to be a discrepancy between how the CardBoundaryDebugger visualizes elements and what classes those elements actually have. The red dashed outlines in the screenshot persist, but our `.card-slot` selector isn't finding these elements. This suggests either:

1. The debug visualization is applying the red outlines using different criteria than we thought
2. The elements have dynamic classes that don't match `.card-slot` during our component initialization
3. The actual DOM structure is more complex, and the outlining happens at a different point in the render cycle

## Failed Approach - April 25, 2025 (Second Attempt)
The BattlefieldStructureFix component tried a more comprehensive approach targeting multiple potential elements:

1. It targeted transform divs, card containers, and battlefield cards with strict height constraints
2. It added a protective shield above cards to intercept hover events
3. It set capture-phase event handlers to prevent event propagation
4. It used multiple selectors to catch all possible elements causing the issue
5. It applied fixes to elements identified by position, not just by class name

**Why it failed:** Even with this more comprehensive approach targeting multiple elements with various selectors, the hover magnification issue persisted. This suggests our understanding of the DOM structure and event system is still incomplete.

**ROOT CAUSE ANALYSIS:**

After multiple failed approaches, it's becoming clear that the issue is more fundamental than we initially thought. The problem likely stems from one of these core issues:

1. **Event Propagation System**: The hover detection might be using a complex event bubbling system that operates outside of standard DOM event propagation, making our capture-phase handlers ineffective.

2. **React State Management**: The hover state might be managed through React state using global coordinates rather than direct DOM events. This would mean our CSS-based fixes (pointer-events, z-index) wouldn't affect the hover detection logic because it's happening at the React component level, not the DOM level.

3. **Coordinate-Based Hit Testing**: The card system might be using custom hit-testing based on coordinates rather than DOM-based hover, explaining why modifying the DOM elements' dimensions and events isn't fixing the issue.

4. **Multiple Competing Systems**: There might be multiple hover detection systems running simultaneously (CSS-based, React-based, coordinate-based), and even though we fix one, the others are still active.

**NEXT STEPS:**
We need to examine the fundamental hover detection mechanisms in the core components:
1. Look at the CardTransformContext and how it manages hover states
2. Examine the event handlers in the Battlefield component, particularly how they detect and process hover events
3. Look at any global event handlers or state management related to card hovering
4. Focus on finding where the hover state is initially set, rather than trying to prevent hover events after they've been detected
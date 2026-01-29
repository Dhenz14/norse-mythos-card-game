# Card Hover Trigger Analysis

## Root Cause Hypotheses

After careful analysis of the code and logs, I believe we're dealing with one of these fundamental issues:

### 1. Card Container Element Size Issue
- The card container elements might have larger hitboxes than their visual boundaries
- There might be invisible padding or margins extending beyond the visible card
- The z-index stacking and element positioning may create overlap areas

### 2. Event Delegation and Bubbling
- Events are likely bubbling from the battlefield to card elements
- Mouseenter/mouseleave events are being triggered through parent elements rather than directly

### 3. Card Size Verification
- We need to empirically measure the actual DOM element sizes vs. displayed sizes
- The CSS transformations might be enlarging the effective hitboxes

## Debug Evidence

Looking at console logs:
1. PlayerAreaHoverBlocker is applying direct fixes continuously
2. Aggressive pointer-events fixes are being applied successfully
3. The hover system logs show detailed card data when hovering over empty space

The most important clue is:
```
Card in CardWithDrag: [object with card data]
```

This appears when hovering over empty space, indicating that a card is somehow receiving the event despite no visible card being present.

## Verification Steps

To verify the root cause:

1. Add visual debugging outlines to show the actual boundaries of card elements
2. Log exact mouse coordinates and compare with element getBoundingClientRect()
3. Create a minimal test case with a single card and no other elements

## Proposed Solutions

Based on this analysis, the most direct approach would be:

1. Add debugging code to visualize the true card element boundaries
2. Implement strict hit testing based on getBoundingClientRect() with zero tolerance
3. Force cards to conform to their visual boundaries by setting explicit dimensions
4. Create a complete event capture layer that prevents any event propagation to card elements except through our controlled channels
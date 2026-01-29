# Norse Mythology Card Game

A sophisticated Norse mythology-themed digital card game that delivers an immersive strategic experience through advanced interactive design and dynamic rendering techniques.

## Key Features

1. **Holographic Card Effects:**
   - Gold holographic effect for Legendary cards
   - Purple holographic effect for Epic cards
   - Interactive effects that respond to mouse movement
   - Professional multi-layer design with background effect, holographic overlay, and shimmer

2. **Card Transformation System:**
   - Cards transform from full size in hand to optimized compact versions on the battlefield
   - Optimized attack/health badges with hexagonal designs
   - Proportionally scaled text elements for battlefield cards
   
3. **Professional Card Layout:**
   - Attack values in orange/gold hexagons on the left
   - Health values in red hexagons on the right
   - Card name in dedicated area between art and description
   - Professional sectioning with Norse-themed design elements
   
4. **Technical Implementations:**
   - React for interactive frontend
   - TypeScript for type-safe logic
   - Tailwind CSS for responsive design
   - Framer Motion for animations
   - React Spring for card animations

## Getting Started

1. Install dependencies:
   ```
   npm install
   ```

2. Start the development server:
   ```
   npm run dev
   ```

3. Open your browser to `http://localhost:3000`

## Card Effects Implementation

The holographic effects use a 3-layer approach:
1. Background effect (z-index: 1)
2. Shimmer effect (z-index: 2)
3. Main holographic overlay (z-index: 3)

### Legendary Card Effect
- Gold color scheme
- Foil.png texture
- Shine-gold animation
- Opacity: 0.6
- Mix-blend-mode: color-dodge
- Brightness filter: 1.2-1.3x

### Epic Card Effect
- Purple color scheme
- Epic_holographic.png texture
- Prismatic-shift animation
- Opacity: 0.75
- Mix-blend-mode: color-dodge
- Increased gradient intensity

## Notes
- The battlefield cards are exactly 120x170px to match the design requirements
- Hex badges scaled to 28px (vs 32px for full cards) with proportionally reduced font sizes
- Z-index management is crucial for proper layer rendering

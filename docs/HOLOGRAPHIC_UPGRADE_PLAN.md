# Holographic Card Upgrade Plan — Authentic 90s Foil

## Goal

Replace the current Pokemon-cards-151 CSS port with a system that replicates **real 90s holographic trading cards**:
- Art is **crystal clear when viewed straight on**
- Tilting reveals a **3D prismatic rainbow** that appears to live *behind* the art
- Micro-sparkle/glitter texture like real embossed foil
- Metallic feel (high contrast, low saturation) — not neon digital rainbow
- Cards **shimmer subtly at idle** (ambient light catch, no interaction needed)
- Foil is **restricted to the art window** — border and text stay clean

## How Real Holographic Cards Work (Physics)

Real foil cards have 3 physical layers:
1. **Card stock** (base)
2. **Embossed metallic foil** — microscopic grooves that diffract white light into rainbow
3. **Transparent printed art** — laid on top of the foil

The result:
- Dark printed areas **block** the foil → art stays readable
- Bright/white areas **let foil shine through** → rainbow appears in highlights
- Tilting changes the viewing angle → different wavelengths dominate → colors "travel"
- A bright specular highlight (glare) follows the angle of incidence
- Even at rest, ambient light causes a subtle glint — the card is never truly static

## What We Have Now

**Files:**
- `client/src/game/components/styles/holoEffect.css` (1,292 lines, 10 Pokemon variants)
- `client/src/game/hooks/useHoloTracking.ts` (212 lines, spring physics + variant assignment)

**Current architecture:**
- 10 named variants (holo-rare, holo-cosmos, holo-v, holo-rainbow, etc.)
- 2 layers: `.holo-shine` (rainbow) + `.holo-glare` (specular highlight)
- Sunpillar gradient system (6 HSL colors)
- Spring-based pointer tracking with velocity smoothing
- Rarity tiers: common (none), rare (3 variants), epic (4 variants), mythic (3 variants)
- 7 element color themes override sunpillar colors

**Problems:**
- Rainbow washes the **entire card** uniformly — doesn't respect art light/dark areas
- No foil masking — holo bleeds into card border and text (real cards only have foil behind art)
- No glitter/sparkle texture (pure gradients look flat/digital)
- Saturation too high — looks neon, not metallic
- Luminosity spotlight too wide — should be tight like a real light source
- Too many variants (10) with subtle differences nobody notices — simplify to 3-4 distinct tiers
- No idle shimmer — cards are visually dead without mouse interaction
- `::before` pseudo-element underused — missing parallax depth from dual-angle gradients
- Filter chain contrast too aggressive in some variants, too weak in others

## The Upgrade

### Architecture: 4 Layers + Foil Mask

```
Card DOM:
  <div class="card-container holo-active holo-{tier} [element-holo-{theme}] [stage3-evolved]">
    <img class="card-art" />                    <- the card art (static, always readable)
    <div class="holo-foil" />                   <- Layer 1: rainbow diffraction (MASKED to art window)
      ::before                                  <- Layer 1a: parallax rainbow at second angle (epic+)
      ::after                                   <- Layer 1b: luminosity mask (restricts rainbow to highlights)
    <div class="holo-glitter" />                <- Layer 2: sparkle noise texture (tiled PNG)
    <div class="holo-glare" />                  <- Layer 3: specular highlight (white spotlight)
  </div>
```

Key change from current: **foil is masked to the art window only** (via `mask-image`), and the `::before` pseudo carries a second rainbow gradient at a different angle for parallax depth.

### Foil Art-Window Mask (Core — Not Future)

Real holographic cards only have foil behind the art window. The border, name plate, and stat badges are opaque card stock. This is the single biggest realism upgrade:

```css
.holo-foil,
.holo-glitter {
  /* Generic rectangular mask matching card art bounds */
  /* Adjust percentages to match SimpleCard art position */
  -webkit-mask-image: linear-gradient(black, black);
  -webkit-mask-size: 88% 55%;
  -webkit-mask-position: center 28%;
  -webkit-mask-repeat: no-repeat;
  mask-image: linear-gradient(black, black);
  mask-size: 88% 55%;
  mask-position: center 28%;
  mask-repeat: no-repeat;
}
```

This restricts all holo layers to the art rectangle. The name plate, mana cost, ATK/HP badges, and card border stay clean. No per-card assets needed — one generic rectangle works for all cards with the same layout.

### 4 Rarity Tiers (replacing 10 variants)

| Tier | Rarity | Effect | Intensity |
|------|--------|--------|-----------|
| `holo-none` | common/basic | No effect | 0 |
| `holo-rare` | rare | Subtle rainbow in highlights + gentle glitter | 0.25-0.35 foil opacity |
| `holo-epic` | epic | Strong prismatic + parallax `::before` + scanline grooves + glitter | 0.4-0.5 foil opacity |
| `holo-mythic` | mythic | Full spectrum + dual parallax + dense glitter + intense glare + art parallax | 0.55-0.7 foil opacity |

### Layer 1: Rainbow Foil (`.holo-foil`)

**Primary rainbow diffraction layer — `color-dodge` blend + luminosity mask.**

The `color-dodge` mix-blend-mode is the proven choice (used in 8/10 pokemon-cards-css variants + YGO secret rare). It brightens the underlying image where the gradient is light and leaves dark areas untouched — this is what makes foil look metallic rather than painted on.

```css
.holo-foil {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.4s ease;
  will-change: opacity, background-position;
  contain: strict;
  z-index: 5;

  /* Rainbow gradient — 6-stop repeating spectrum */
  background-image: repeating-linear-gradient(
    133deg,
    var(--foil-1), var(--foil-2), var(--foil-3),
    var(--foil-4), var(--foil-5), var(--foil-6), var(--foil-1)
  );
  background-size: 300% 300%;
  background-position:
    calc(((50% - var(--bg-x, 50%)) * 2.6) + 50%)
    calc(((50% - var(--bg-y, 50%)) * 3.5) + 50%);

  /* THE KEY: color-dodge only brightens bright areas, dark areas stay dark */
  mix-blend-mode: color-dodge;

  /* Metallic filter: low brightness + moderate contrast + low saturation */
  /* Dynamic brightness: brighter at cursor center, dimmer at edges */
  filter:
    brightness(calc((var(--pointer-from-center, 0) * 0.3) + 0.4))
    contrast(2.8)
    saturate(0.55);

  /* Art-window mask */
  -webkit-mask-image: linear-gradient(black, black);
  -webkit-mask-size: 88% 55%;
  -webkit-mask-position: center 28%;
  -webkit-mask-repeat: no-repeat;
  mask-image: linear-gradient(black, black);
  mask-size: 88% 55%;
  mask-position: center 28%;
  mask-repeat: no-repeat;
}
```

#### Layer 1a: Parallax Second Rainbow (`.holo-foil::before`, epic+)

A second rainbow gradient at a **different angle** creates parallax depth as the card tilts. The two gradients shift at different rates, producing the illusion of dimensional layering — a huge contributor to the "3D" feel that the current system lacks entirely.

```css
.holo-epic .holo-foil::before,
.holo-mythic .holo-foil::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;

  /* Second gradient at offset angle — shifts at 1.5x rate for parallax */
  background-image: repeating-linear-gradient(
    -47deg,
    var(--foil-6), var(--foil-4), var(--foil-2),
    var(--foil-5), var(--foil-1), var(--foil-3), var(--foil-6)
  );
  background-size: 350% 350%;
  background-position:
    calc(var(--bg-x, 50%) * 1.5)
    calc(var(--bg-y, 50%) * 1.5);
  background-blend-mode: soft-light;
  mix-blend-mode: hue;
  filter: brightness(1.5) contrast(1.3) saturate(0.5);
  opacity: 0.6;
}
```

#### Layer 1b: Luminosity Mask (`.holo-foil::after`)

Restricts the rainbow to a tight area near the cursor, simulating how a real light source creates a focused reflection point:

```css
.holo-foil::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: radial-gradient(
    farthest-corner circle at var(--pointer-x, 50%) var(--pointer-y, 50%),
    hsla(0, 0%, 90%, 0.8) 10%,
    hsla(0, 0%, 60%, 0.3) 40%,
    hsl(0, 0%, 0%) 85%
  );
  mix-blend-mode: luminosity;
  filter: brightness(0.55) contrast(3.5);
}
```

The high-contrast luminosity crush makes the rainbow only appear near the cursor where the radial gradient is bright. Dark areas of the mask suppress the rainbow completely.

### Layer 2: Glitter Texture (`.holo-glitter`)

**Pre-rendered 256x256 PNG noise texture — superior to SVG feTurbulence.**

Real embossed foil has irregular bright micro-points that shift with viewing angle. The YGO secret rare implementation proves that a static tiled texture blended with `soft-light` is the most convincing approach — and cheaper than per-element SVG filter computation.

```css
.holo-glitter {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  z-index: 5;
  opacity: 0;
  transition: opacity 0.4s ease;
  contain: strict;

  /* Tiled glitter noise — shifts with cursor */
  background-image: url('/art/textures/glitter-256.png');
  background-size: 256px 256px;
  background-repeat: repeat;
  background-position:
    calc(var(--bg-x, 50%) * 2px)
    calc(var(--bg-y, 50%) * 2px);
  mix-blend-mode: soft-light;

  /* Same art-window mask as foil */
  -webkit-mask-image: linear-gradient(black, black);
  -webkit-mask-size: 88% 55%;
  -webkit-mask-position: center 28%;
  -webkit-mask-repeat: no-repeat;
  mask-image: linear-gradient(black, black);
  mask-size: 88% 55%;
  mask-position: center 28%;
  mask-repeat: no-repeat;
}
```

**Glitter texture generation:** Create a 256x256 grayscale noise PNG with irregular bright dots on a dark background. Can be generated once via canvas:

```js
// Run once, save as glitter-256.png
const c = document.createElement('canvas');
c.width = c.height = 256;
const ctx = c.getContext('2d');
const img = ctx.createImageData(256, 256);
for (let i = 0; i < img.data.length; i += 4) {
  const v = Math.random() < 0.15 ? 140 + Math.random() * 115 : Math.random() * 40;
  img.data[i] = img.data[i+1] = img.data[i+2] = v;
  img.data[i+3] = 255;
}
ctx.putImageData(img, 0, 0);
// c.toDataURL('image/png') → save to /art/textures/glitter-256.png
```

**Fallback for offline/downloaded builds:** Inline a base64-encoded 64x64 SVG feTurbulence as secondary `background-image` — smaller but still provides sparkle if the PNG fails to load.

Glitter opacity by tier:
- `holo-rare`: 0.15
- `holo-epic`: 0.25
- `holo-mythic`: 0.35
- `.stage3-evolved`: 0.45

### Scanline Groove Pattern (Epic+)

Real foil has visible embossed groove patterns. Combined with the glitter layer via multiple backgrounds:

```css
.holo-epic .holo-glitter,
.holo-mythic .holo-glitter {
  background-image:
    url('/art/textures/glitter-256.png'),
    repeating-linear-gradient(
      110deg,
      transparent 0px, transparent 3px,
      rgba(255, 255, 255, 0.06) 3px, rgba(255, 255, 255, 0.06) 4px
    );
  background-size: 256px 256px, 100% 4px;
}
```

Mythic adds crosshatch (diamond grid) for a "secret rare" embossing feel:

```css
.holo-mythic .holo-glitter {
  background-image:
    url('/art/textures/glitter-256.png'),
    repeating-linear-gradient(
      45deg,
      transparent 0px, transparent 4px,
      rgba(255, 255, 255, 0.04) 4px, rgba(255, 255, 255, 0.04) 5px
    ),
    repeating-linear-gradient(
      -45deg,
      transparent 0px, transparent 4px,
      rgba(255, 255, 255, 0.04) 4px, rgba(255, 255, 255, 0.04) 5px
    );
  background-size: 256px 256px, 100% 5px, 100% 5px;
  background-blend-mode: soft-light, exclusion, exclusion;
}
```

### Layer 3: Specular Glare (`.holo-glare`)

Tight white spotlight that follows cursor. Opacity increases at card edges (steeper viewing angle = more specular reflection, matching real physics):

```css
.holo-glare {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  z-index: 7;
  opacity: 0;
  transition: opacity 0.4s ease;
  will-change: opacity;
  contain: strict;

  background: radial-gradient(
    farthest-corner circle at var(--pointer-x, 50%) var(--pointer-y, 50%),
    hsla(0, 0%, 100%, 0.35) 0%,
    hsla(0, 0%, 100%, 0.1) 15%,
    transparent 40%
  );
  mix-blend-mode: overlay;
  filter: brightness(0.8);
}
```

Glare opacity by tier:
- `holo-rare`: `calc(0.2 + var(--pointer-from-center) * 0.25)`
- `holo-epic`: `calc(0.3 + var(--pointer-from-center) * 0.35)`
- `holo-mythic`: `calc(0.4 + var(--pointer-from-center) * 0.4)`

#### Glare Highlight Ring (`.holo-glare::after`, mythic only)

A secondary screen-blend radial halo that gives a "hot spot" metallic sheen:

```css
.holo-mythic .holo-glare::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: radial-gradient(
    farthest-corner circle at var(--pointer-x, 50%) var(--pointer-y, 50%),
    hsla(190, 60%, 90%, 0.3) 5%,
    hsla(190, 40%, 70%, 0.1) 25%,
    transparent 55%
  );
  mix-blend-mode: screen;
  filter: brightness(0.6) contrast(3);
}
```

### Art Parallax (Mythic Only)

Subtle parallax shift of the art relative to the frame creates the "3D floating" effect:

```css
.holo-mythic.holo-active .card-art {
  transform:
    translateX(calc((var(--pointer-from-left, 0.5) - 0.5) * 6px))
    translateY(calc((var(--pointer-from-top, 0.5) - 0.5) * 6px));
  transition: transform 0.1s ease-out;
}
```

The art shifts up to 3px in each direction based on tilt, making it appear to float above the foil layer. Cheap (GPU `transform` only) and very effective.

### Idle Shimmer Animation (All Holo Tiers)

Cards shimmer subtly even without mouse interaction — like real holographic cards catching ambient light. Uses CSS `@property` for animatable custom properties:

```css
@property --holo-idle-x {
  syntax: "<percentage>";
  inherits: false;
  initial-value: 48%;
}

@property --holo-idle-y {
  syntax: "<percentage>";
  inherits: false;
  initial-value: 48%;
}

/* Slow ambient shimmer — overridden by mouse tracking on hover */
.holo-foil:not(.holo-active .holo-foil) {
  background-position:
    var(--holo-idle-x) var(--holo-idle-y);
  animation: idle-shimmer 6s ease-in-out infinite;
}

@keyframes idle-shimmer {
  0%, 100% {
    --holo-idle-x: 46%;
    --holo-idle-y: 48%;
    opacity: 0.15; /* rare baseline, overridden per tier */
  }
  33% {
    --holo-idle-x: 54%;
    --holo-idle-y: 52%;
    opacity: 0.25;
  }
  66% {
    --holo-idle-x: 50%;
    --holo-idle-y: 46%;
    opacity: 0.18;
  }
}
```

Idle opacity by tier (the animation `opacity` keyframes are scaled per tier):
- `holo-rare`: 0.1 → 0.18 → 0.12
- `holo-epic`: 0.15 → 0.25 → 0.18
- `holo-mythic`: 0.2 → 0.35 → 0.25

On mouse enter, the spring tracking takes over and `holo-active` class disables the idle animation.

### Filter Chain Reference (The Secret Sauce)

The difference between "digital rainbow" and "metallic foil" is entirely in the filter values. Based on analysis of pokemon-cards-css reference values:

| Layer | Brightness | Contrast | Saturate | Notes |
|-------|-----------|----------|----------|-------|
| Foil base | 0.4-0.7 (dynamic) | 2.8 | 0.55 | Dynamic via `--pointer-from-center` |
| Luminosity mask (`::after`) | 0.55 | 3.5 | — | Crushes midtones to restrict rainbow |
| Parallax `::before` | 1.5 | 1.3 | 0.5 | Brighter — blends through main layer |
| Glare | 0.8 | — | — | Subtle white spotlight |
| Glare halo (`::after`) | 0.6 | 3.0 | — | Metallic sheen ring |

**Why dynamic brightness matters:** Several pokemon-cards-css variants use `calc((var(--pointer-from-center) * weight) + base)` — brighter when cursor is near center (direct reflection), dimmer at edges (oblique angle). This matches real specular physics and prevents the flat "entire card is equally rainbow" look.

**Avoid over-crushing:** The original plan proposed `contrast(3.5)` on the foil base — but at that level rainbow bands become too narrow and harsh. The pokemon reference uses 2.5-3.0 for the foil and reserves 3.0-4.5 for the luminosity mask only. `contrast(2.8)` is the sweet spot.

### Element Themes (Keep)

The 7 element color overrides stay — just applied to the simplified 6-color foil palette:
- fire: warm reds/oranges/golds
- ice: blues/whites/silvers
- electric: yellows/whites/cyans
- shadow: purples/blacks/deep blues
- light: golds/whites/soft yellows
- water: blues/teals/greens
- grass: greens/yellows/emeralds

Neutral element uses default rainbow spectrum (no override).

### Spring Physics (Keep As-Is)

The current `useHoloTracking.ts` spring system is excellent:
- `SPRING_STIFFNESS = 0.066`, `SPRING_DAMPING = 0.25`
- Ref-based (single card, spring) vs refless (grid, instant)
- 400ms return-to-center on mouse leave

No changes needed to the spring mechanics — only the CSS it drives and the variant selection logic.

## Implementation Steps

### Step 1: Generate Glitter Texture

Create `client/public/art/textures/glitter-256.png` — 256x256 grayscale noise with 15% bright dot density. Commit as a static asset (one-time, ~15KB).

### Step 2: Rewrite `holoEffect.css`

Replace all 10 variants with 4 tiers. Target: **~250 lines** (down from 1,292).

New class structure:
- `.holo-foil` + `.holo-glitter` + `.holo-glare` (base layers, hidden by default)
- `@property --holo-idle-x/y` for idle shimmer animation
- `.holo-active .holo-foil` → opacity driven by tier
- `.holo-rare` → tier 1 (subtle foil + gentle glitter + idle shimmer)
- `.holo-epic` → tier 2 (strong prism + parallax `::before` + scanline grooves + glitter)
- `.holo-mythic` → tier 3 (full spectrum + dual parallax + crosshatch + intense glare + art parallax + glare halo)
- `.stage3-evolved` → max intensity override
- `.element-holo-{theme}` → 7 element color overrides (simplified)
- `@media (prefers-reduced-motion: reduce)` → hide all effects

### Step 3: Update `useHoloTracking.ts`

- Rename `getHoloVariant()` → `getHoloTier()`
- Return: `null | 'holo-rare' | 'holo-epic' | 'holo-mythic'`
- Remove 10-variant assignment logic and `HoloVariant` type
- Keep spring physics, CSS variable application, element theme detection

### Step 4: Update `SimpleCard.tsx`

- Replace `.holo-shine` div → `.holo-foil` div
- Add `.holo-glitter` div (new layer)
- Keep `.holo-glare` div
- Apply `holo-{tier}` class instead of variant class
- Mythic art gets parallax `transform` via CSS (no JS needed)

### Step 5: Update Other Consumers

- `ArmySelection.tsx` (deck builder grid)
- `HeroDeckBuilder.tsx` (deck builder detail)
- `HeroDetailPopup.tsx` (clicked card view)
- `CollectionCard.tsx` (collection grid)

### Step 6: Delete Dead Code

- Remove `SimpleHolographicCard.tsx` if still exists (legacy)
- Remove `HolographicEffect.css` if still exists (legacy)
- Clean up any remaining references to old 10-variant system
- Remove `HoloVariant` type and `RARE_VARIANTS`/`EPIC_VARIANTS`/`MYTHIC_VARIANTS` arrays

## Performance Notes

- `contain: strict` on each holo layer (isolates compositing)
- `will-change: opacity, background-position` on foil/glitter layers
- Glitter PNG is cached forever (one 15KB HTTP request)
- `@media (prefers-reduced-motion: reduce)` hides all effects
- Grid mode uses instant apply (no spring RAF loops for 30+ cards)
- Mythic parallax uses CSS `transform` only (GPU-composited)
- Idle shimmer uses CSS `@property` animation (no JS, GPU-composited)
- `::before`/`::after` pseudo-elements are free (no extra DOM nodes)
- Art-window `mask-image` is GPU-composited (no per-frame cost)

## Why Not WebGL?

With 10+ cards visible simultaneously (4 battlefield + 6 hand + sidebar), per-card WebGL contexts would be expensive (GPU memory, state tracking). CSS blend modes and filters are already GPU-composited by the browser's built-in compositor — adding canvas per card would actually be slower.

WebGL shines for full-screen effects or single-card inspect views. If we ever want true thin-film interference simulation (actual diffraction grating physics), a single React Three Fiber shader for the detail popup would be the right place — not per-card on the battlefield.

## Reference Implementations

- **Gold standard**: [simeydotme/pokemon-cards-css](https://github.com/simeydotme/pokemon-cards-css)
- **YGO Secret Rare** (texture-based): [jialiang.github.io](https://jialiang.github.io/ygo-ocg-secret-rare/)
- **CSS blend mode shaders**: [robbowen.digital](https://robbowen.digital/wrote-about/css-blend-mode-shaders/)
- **WebGL diffraction shader**: [cyanilux.com](https://www.cyanilux.com/tutorials/holofoil-card-shader-breakdown/)
- **React wrapper**: [react-holo-card-effect](https://github.com/van123helsing/react-holo-card-effect)

## Future Enhancements

1. **Per-card mask images** (Option B) — grayscale masks for premium mythic cards (white = foil, black = opaque) for art-aware masking that respects individual card artwork light/dark regions
2. **WebGL detail popup** — React Three Fiber shader for single-card inspect view with true diffraction physics
3. **Gyroscope support** — `DeviceOrientationEvent` for mobile tilt
4. **Foil pattern variants** — stars, swirls, diamonds (different embossing patterns per set/edition)
5. **CSS Paint API** — once Firefox ships support, replace PNG glitter with procedural `paint(glitter)` worklet (zero HTTP requests, infinite resolution)

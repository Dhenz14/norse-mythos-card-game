# Design Philosophy & Architecture Standards

> A comprehensive guide for building AAA-quality, maintainable UI systems inspired by Material Design 3 Expressive and modern design system principles.

---

## Core Philosophy

### The Three Pillars

1. **Semantic Design** - Components and tokens that carry meaning, not just visual properties
2. **Expressive Interfaces** - Emotionally impactful UX through motion, shape, color, and typography
3. **Separation of Concerns** - Clear boundaries between presentation, logic, and state

---

## Design System Fundamentals

### 1. Design Tokens (Semantic Variables)

Design tokens are the foundational building blocks. They provide semantic meaning rather than literal values.

```css
/* BAD: Literal values scattered throughout */
.button { background: #1e40af; }

/* GOOD: Semantic tokens */
:root {
  --color-primary: #1e40af;
  --color-primary-hover: #1d4ed8;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --radius-card: 12px;
}
.button { background: var(--color-primary); }
```

**Token Categories:**
- **Colors**: primary, secondary, tertiary, surface, background, error, success
- **Typography**: font-family, font-size-*, font-weight-*, line-height-*
- **Spacing**: spacing-xs, spacing-sm, spacing-md, spacing-lg, spacing-xl
- **Elevation**: shadow-sm, shadow-md, shadow-lg (z-depth)
- **Motion**: duration-fast, duration-normal, easing-standard
- **Shape**: radius-none, radius-sm, radius-md, radius-full

### 2. Component Architecture

Components should follow a strict layered structure:

```
Component/
├── index.ts              # Public exports
├── Component.tsx         # Main presentation component
├── Component.styles.css  # Scoped styles using tokens
├── Component.types.ts    # TypeScript interfaces
├── useComponent.ts       # Custom hook for logic
└── subcomponents/        # Internal sub-components
    ├── Header.tsx
    ├── Body.tsx
    └── Footer.tsx
```

### 3. Separation of Concerns Pattern

**TSX → Hooks → Stores → Utils**

```
┌─────────────────┐
│  TSX Component  │  ← Pure presentation (what to render)
└────────┬────────┘
         │
┌────────▼────────┐
│   Custom Hook   │  ← Component logic (how to behave)
└────────┬────────┘
         │
┌────────▼────────┐
│  Zustand Store  │  ← Global state (what to remember)
└────────┬────────┘
         │
┌────────▼────────┐
│  Pure Utilities │  ← Business logic (how to compute)
└─────────────────┘
```

---

## Material 3 Expressive Principles

### Motion Physics System

Motion should feel **alive, fluid, and natural**. Use spring-based physics instead of linear easing.

**Spatial Springs**: For position/scale changes - mirrors real-world physics
**Effect Springs**: For color/opacity transitions - creates seamless feel

```typescript
// React Spring example
const springConfig = {
  tension: 300,   // Stiffness
  friction: 20,   // Damping
  mass: 1,        // Weight
};
```

### Expressive Typography

Use **emphasized text styles** to guide attention:
- Headlines use heavier weights for impact
- Body text prioritizes readability
- Actions use distinct styling to stand out

```css
:root {
  --font-emphasis-headline: 700;
  --font-emphasis-body: 400;
  --font-emphasis-action: 600;
}
```

### Shape Library (35 Shapes)

Mix classic and abstract shapes for visual tension:
- **Round corners** for friendly, approachable elements
- **Sharp corners** for professional, serious elements
- **Shape morphing** for smooth state transitions

### Color Hierarchy

Use contrast to establish **visual hierarchy**:
1. **Primary** - Main actions and focus areas
2. **Secondary** - Supporting elements
3. **Tertiary** - Decorative accents
4. **Surface** - Container backgrounds

---

## Expressive Design Tactics

### Tactic 1: Variety of Shapes
Mix corner radii to create visual tension and direct focus.

### Tactic 2: Rich Colors
Use surface tones and color contrast to prioritize actions.

### Tactic 3: Guide with Typography
Emphasized text draws attention to important UI elements.

### Tactic 4: Contain for Emphasis
Group related content into logical containers with visual prominence.

### Tactic 5: Fluid Motion
Shape morphs and spring physics make interactions feel alive.

### Tactic 6: Component Flexibility
UI adapts to user context and screen sizes.

### Tactic 7: Hero Moments
Brief, delightful surprises at critical interactions (limit to 1-2 per product).

---

## File Organization Standards

### Feature Folder Structure

```
feature/
├── components/          # Presentational components
│   ├── FeatureCard.tsx
│   ├── FeatureList.tsx
│   └── index.ts
├── hooks/               # Custom React hooks
│   ├── useFeature.ts
│   └── useFeatureFilters.ts
├── stores/              # Zustand stores
│   └── featureStore.ts
├── utils/               # Pure utility functions
│   ├── featureValidation.ts
│   └── featureTransforms.ts
├── types/               # TypeScript types
│   └── feature.types.ts
├── styles/              # CSS modules/tokens
│   ├── tokens.css
│   ├── components.css
│   └── index.css
└── index.ts             # Public API
```

### CSS Architecture (Layer System)

```css
/* styles/index.css - Import order matters */
@import "./tokens.css";      /* 1. Design tokens */
@import "./base.css";        /* 2. Reset & base styles */
@import "./layout.css";      /* 3. Grid & spacing */
@import "./components.css";  /* 4. Component styles */
@import "./utilities.css";   /* 5. Helper classes */
```

---

## Quality Standards

### Component Rules

1. **Single Responsibility**: One component = one purpose
2. **Max 200 Lines**: Split if larger
3. **No Inline Logic**: Extract to hooks/utils
4. **Typed Props**: Full TypeScript interfaces
5. **Composition Over Inheritance**: Build from smaller parts

### Style Rules

1. **Token-First**: Never use raw values
2. **Scoped Styles**: CSS modules or BEM naming
3. **Mobile-First**: Responsive by default
4. **Accessibility**: WCAG 2.1 AA minimum

### State Management Rules

1. **Colocate State**: Keep state close to where it's used
2. **Derive Don't Store**: Compute values instead of caching
3. **Single Source of Truth**: One store per domain
4. **Immutable Updates**: Never mutate state directly

---

## Anti-Patterns to Avoid

### DON'T

```tsx
// Monolithic component with mixed concerns
function DeckBuilder() {
  const [cards, setCards] = useState([]);
  const [filters, setFilters] = useState({});
  
  // 500 lines of mixed logic and JSX...
  
  return <div>...</div>;
}
```

### DO

```tsx
// Separated concerns
function DeckBuilder() {
  const { cards, filters, actions } = useDeckBuilder();
  
  return (
    <DeckBuilderLayout>
      <CardFilters filters={filters} onChange={actions.setFilters} />
      <CardGrid cards={cards} onSelect={actions.addCard} />
      <DeckSidebar deck={deck} onRemove={actions.removeCard} />
    </DeckBuilderLayout>
  );
}
```

---

## Implementation Checklist

When building a new feature:

- [ ] Create feature folder structure
- [ ] Define TypeScript types first
- [ ] Create design tokens in `tokens.css`
- [ ] Build pure utility functions
- [ ] Create Zustand store for state
- [ ] Build custom hooks for logic
- [ ] Create small, focused components
- [ ] Add responsive styles
- [ ] Test accessibility
- [ ] Document public API

---

## References

- [designsystems.com](https://www.designsystems.com/) - Design system patterns and case studies
- [Material Design 3 Expressive](https://m3.material.io/blog/building-with-m3-expressive) - Expressive component guidelines
- [Spotify Design System](https://www.designsystems.com/how-spotifys-design-system-goes-beyond-platforms/) - Cross-platform patterns
- [Thumbprint Design System](https://www.designsystems.com/how-thumbtack-structures-their-design-system/) - Structure and flexibility

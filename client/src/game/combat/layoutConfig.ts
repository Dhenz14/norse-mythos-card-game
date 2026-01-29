/**
 * COMBAT UI LAYOUT CONFIGURATION
 * Single source of truth for all UI zone positions, dimensions, and z-index layers
 * 
 * All position values are in the format they were in the CSS files:
 * - Percentages: '2%', '50%', etc.
 * - Pixels: '8px', '24px', etc.
 * - Viewport units: '1%', '15vw', etc.
 * - Clamp values: 'clamp(...)' for responsive sizing
 * - Calc values: 'calc(...)' for computed values
 * 
 * Zones are organized by logical gameplay area (player, opponent, center)
 * Z-index follows a tiered system for proper layering
 * 
 * ============================================================================
 * CSS FILE OWNERSHIP
 * ============================================================================
 * 
 * This file (layoutConfig.ts) is the DOCUMENTED REFERENCE for all layout values.
 * CSS variables are injected at runtime via useCombatLayout hook.
 * 
 * CSS File Responsibilities:
 * 
 * RagnarokCombatArena.css (CANONICAL for responsive zone heights):
 *   - --opponent-zone-height, --player-zone-height, --hand-zone-height, --field-zone-height
 *   - --hero-card-width, --hero-zone-height (responsive clamp values)
 *   - --hover-lift-distance, --hover-scale-factor, --hover-safe-zone
 *   - --active-minion-safe-margin
 *   - --hand-card-width/height, --battlefield-card-width/height (responsive sizes)
 *   - --hand-overlap, --hand-max-fan-angle, --hand-hover-lift, --hand-hover-scale
 *   - --poker-panel-width/scale/gap, --poker-card-scale
 *   - Responsive @media query overrides for all above variables
 * 
 * GameViewport.css (CONSUMES variables, does not define :root):
 *   - Uses CSS variables from layoutConfig.ts for zone positioning
 *   - Uses CSS variables from RagnarokCombatArena.css for responsive heights
 *   - Contains zone-specific styles (.zone-player-hero, .zone-opponent-field, etc.)
 * 
 * layoutConfig.ts (this file - INJECTED at runtime):
 *   - Zone positioning (--player-hero-left, --pot-left, --community-top, etc.)
 *   - Z-index layers (--z-base through --z-overlay)
 *   - Viewport reference dimensions (--viewport-width, --viewport-height)
 *   - Card dimension variables (--card-hero-width, etc.)
 * 
 * ============================================================================
 */

/**
 * Viewport reference dimensions
 * Used for scaling calculations and responsive breakpoints
 */
export const VIEWPORT_CONFIG = {
  width: '1920px',
  height: '1080px',
} as const;

/**
 * PLAYER HERO ZONE
 * Bottom-left corner of the battlefield
 * Contains the player's hero card, mana bar, and hole cards
 */
export const LAYOUT_ZONES = {
  /**
   * PLAYER HERO ZONE
   * Bottom-left corner of the battlefield
   * Uses responsive calc() to prevent overlap on wide screens
   */
  playerHero: {
    left: 'clamp(8px, 2%, 32px)',
    bottom: 'clamp(8px, 3%, 24px)',
    zIndex: '30',
  },

  /**
   * PLAYER MANA BAR
   * Positioned below the player hero card
   * Uses same left positioning as hero for alignment
   */
  playerMana: {
    left: 'clamp(8px, 2%, 32px)',
    bottom: 'clamp(4px, 1%, 12px)',
    zIndex: '30',
    width: 'clamp(80px, 10%, 160px)',
  },

  /**
   * PLAYER HAND ZONE
   * Bottom-center of the screen
   * Displays playable cards with Hearthstone-style fanning effect
   */
  playerHand: {
    left: '50%',
    bottom: '0%',
    zIndex: '40',
  },

  /**
   * PLAYER MINION FIELD
   * Center of the screen, below opponent field
   * Uses percentage-based positioning for aspect ratio independence
   */
  playerField: {
    left: '50%',
    bottom: 'clamp(25%, 30%, 35%)',
    zIndex: '10',
  },

  /**
   * OPPONENT HERO ZONE
   * Top-left corner of the battlefield
   * Mirrors player hero positioning
   */
  opponentHero: {
    left: 'clamp(8px, 2%, 32px)',
    top: 'clamp(8px, 2%, 24px)',
    zIndex: '30',
  },

  /**
   * OPPONENT MANA BAR
   * Positioned below the opponent hero card
   * Uses calc() to position relative to hero card height
   */
  opponentMana: {
    left: 'clamp(8px, 2%, 32px)',
    top: 'calc(clamp(8px, 2%, 24px) + var(--hero-card-width, 160px) * 1.33 + 8px)',
    zIndex: '30',
    width: 'clamp(80px, 10%, 160px)',
  },

  /**
   * OPPONENT HAND ZONE
   * Top-center of the screen
   * Displays opponent's hand (hidden/face-down in real game)
   */
  opponentHand: {
    left: '50%',
    top: '0%',
    zIndex: '40',
  },

  /**
   * OPPONENT MINION FIELD
   * Center of the screen, above player field
   * Uses percentage-based positioning for consistency
   */
  opponentField: {
    left: '50%',
    top: 'clamp(22%, 26%, 30%)',
    zIndex: '10',
  },

  /**
   * COMMUNITY POKER CARDS
   * Left-aligned to avoid overlap with central minion battlefield
   * Base position: 18% from left edge (after hero zone)
   * Vertically centered at 42% from top
   * 
   * NOTE: This provides the DEFAULT/BASE position.
   * GameViewport.css contains responsive media query overrides:
   * - XL (1600px+): 20%
   * - Large (1280-1599px): 18%
   * - Medium (1024-1279px): 16%
   * - Tablet (768-1023px): 14%
   * - Mobile (<768px): 50% (centered)
   */
  community: {
    left: '8px',
    top: '48%',
    zIndex: '20',
  },

  /**
   * POT DISPLAY
   * Left edge of the screen, below opponent mana
   * Uses responsive positioning with gap from hero elements
   */
  pot: {
    left: 'clamp(8px, 1%, 16px)',
    top: 'clamp(28%, 32%, 38%)',
    zIndex: '20',
  },

  /**
   * BETTING ACTIONS ZONE
   * Bottom-center, above player hand
   * Contains check, bet, call, fold action buttons
   */
  betting: {
    left: '50%',
    bottom: '16%',
    zIndex: '200',
  },

  /**
   * TIMER ZONE
   * Top-center of the screen
   * Displays turn timer and time-related information
   */
  timer: {
    left: '50%',
    top: '1%',
    zIndex: '500',
  },

  /**
   * ACTIVITY LOGS ZONE
   * Top-right corner
   * Displays game activity feed and combat log messages
   */
  activityLogs: {
    right: '1%',
    top: '2%',
    zIndex: '500',
  },
} as const;

/**
 * CARD DIMENSIONS
 * Responsive sizing for all card types
 * Uses CSS clamp() for fluid responsiveness across viewports
 */
export const CARD_DIMENSIONS = {
  /**
   * Hero card in viewport
   * Standard 3:4 aspect ratio, scales responsively
   */
  hero: {
    width: 'clamp(120px, 15vw, 192px)',
    aspectRatio: '3/4',
  },

  /**
   * Poker hole cards (player's cards)
   */
  poker: {
    size: '6%',
    offsetY: '36px',
  },

  /**
   * Cards in hand zone
   * Responsive clamp values based on viewport width and height
   */
  hand: {
    width: 'clamp(120px, 14vw, 220px)',
    height: 'clamp(168px, 19.6vw, 308px)',
  },

  /**
   * Active minion cards on battlefield
   */
  battlefield: {
    width: 'clamp(100px, 12vw, 180px)',
    height: 'clamp(140px, 16.8vw, 252px)',
  },
} as const;

/**
 * RESPONSIVE ZONE HEIGHTS
 * Viewport-aware safe zones using vh-based sizing
 * Prevents layout collisions and ensures playability on all screens
 */
export const ZONE_HEIGHTS = {
  /**
   * Opponent zone height (top of screen)
   */
  opponent: 'clamp(140px, 18vh, 200px)',

  /**
   * Player zone height (bottom of screen)
   */
  player: 'clamp(120px, 16vh, 180px)',

  /**
   * Hand display zone height
   */
  hand: 'clamp(140px, 18vh, 200px)',

  /**
   * Battlefield/minion zone height
   */
  field: 'clamp(120px, 18vh, 200px)',

  /**
   * Hero zone - includes card and mana bar
   * Calculated: card height (~width * 1.33) + mana bar (40px) + padding
   */
  hero: 'clamp(220px, calc(var(--hero-card-width) * 1.4 + 60px), 340px)',
} as const;

/**
 * HAND LAYOUT CONFIGURATION
 * Hearthstone-style overlapping fan effect for cards
 * Controls spacing, rotation, and hover behavior
 */
export const HAND_LAYOUT = {
  /**
   * Negative overlap value (-px) creates the fanning effect
   * Cards overlap each other for visual impact
   */
  overlap: '-100px',

  /**
   * Maximum rotation angle for fanned cards
   */
  maxFanAngle: '5deg',

  /**
   * Hover lift distance (upward movement when hovering)
   */
  hoverLift: '-60px',

  /**
   * Scale factor when hovering over a card
   */
  hoverScale: '1.35',
} as const;

/**
 * HOVER AND INTERACTION BEHAVIOR
 * Clearance buffers and safe margins for animated elements
 */
export const HOVER_CONFIG = {
  /**
   * Distance cards lift when hovered
   * Used to calculate safe zones to prevent overlaps
   */
  liftDistance: '50px',

  /**
   * Scale factor when hovering (multiplier)
   */
  scaleFactor: '1.2',

  /**
   * Safe zone buffer = lift distance + additional padding
   * Prevents hover effects from overlapping other UI elements
   */
  safeZone: 'calc(var(--hover-lift-distance) + 20px)',

  /**
   * Minimum margin between active minions and hand zone
   * Prevents clickthrough and visual overlap issues
   */
  activeMinMionSafeMargin: '80px',
} as const;

/**
 * Z-INDEX LAYERING SYSTEM
 * Comprehensive tiered system for proper element stacking
 * Ensures UI elements appear in correct order
 */
export const Z_INDEX = {
  /**
   * Base/background layer
   */
  base: '1',

  /**
   * Battlefield/arena background
   */
  battlefield: '10',

  /**
   * Card elements (general)
   */
  cards: '20',

  /**
   * Active minions on field
   */
  activeMinion: '30',

  /**
   * Hero cards
   */
  hero: '40',

  /**
   * Hand zone and hand cards
   */
  hand: '50',

  /**
   * Hover/preview effects
   */
  hover: '500',

  /**
   * Dragging cards
   */
  drag: '600',

  /**
   * Popup menus and tooltips
   */
  popup: '700',

  /**
   * Modal dialogs
   */
  modal: '800',

  /**
   * HUD elements (timers, scores)
   */
  hud: '900',

  /**
   * Tooltip text
   */
  tooltip: '9000',

  /**
   * Overlay effects (darkening during modals)
   */
  overlay: '9500',
} as const;

/**
 * RESPONSIVE BREAKPOINTS AND SCALES
 * Poker panel scaling for different viewport sizes
 * Ensures UI remains usable on mobile, tablet, and desktop
 */
export const RESPONSIVE_CONFIG = {
  /**
   * Default poker panel width (responsive with clamp)
   */
  pokerPanelWidth: 'clamp(280px, 35vw, 480px)',

  /**
   * Default poker panel scale (1 = 100%)
   */
  pokerPanelScale: '1',

  /**
   * Gap between poker panel elements
   */
  pokerPanelGap: '8px',

  /**
   * Poker card scale (relative to panel scale)
   */
  pokerCardScale: '1',

  /**
   * Scale values for different viewport heights
   */
  heightBreakpoints: {
    default: {
      scale: '1',
      gap: '8px',
      cardScale: '1',
    },
    compact820: {
      scale: '0.92',
      gap: '6px',
      cardScale: '0.9',
    },
    compact740: {
      scale: '0.85',
      gap: '4px',
      cardScale: '0.82',
    },
    compact650: {
      scale: '0.75',
      gap: '3px',
      cardScale: '0.72',
    },
  },
} as const;

/**
 * Type definitions for layout configuration
 */

/**
 * Represents a single zone's position configuration
 */
export type ZoneConfig = {
  left?: string;
  right?: string;
  top?: string;
  bottom?: string;
  zIndex: string;
  width?: string;
};

/**
 * All available layout zones
 */
export type LayoutZone = keyof typeof LAYOUT_ZONES;

/**
 * Card dimension configuration
 */
export type CardDimension = {
  width?: string;
  height?: string;
  size?: string;
  aspectRatio?: string;
};

/**
 * All card dimension types
 */
export type CardType = keyof typeof CARD_DIMENSIONS;

/**
 * Converts layout configuration to CSS custom properties string
 * Can be injected into document.documentElement.style.setProperty()
 * or used as inline style in CSS-in-JS
 * 
 * @returns CSS custom properties string in format "--var-name: value;"
 * 
 * @example
 * const css = generateCSSCustomProperties();
 * document.documentElement.style.cssText = css;
 */
export function generateCSSCustomProperties(): string {
  const properties: string[] = [];

  // Viewport config
  properties.push(`--viewport-width: ${VIEWPORT_CONFIG.width}`);
  properties.push(`--viewport-height: ${VIEWPORT_CONFIG.height}`);

  // Layout zones
  Object.entries(LAYOUT_ZONES).forEach(([zoneName, config]) => {
    const cssZoneName = toKebabCase(zoneName);
    const zoneConfig = config as Partial<ZoneConfig>;
    if (zoneConfig.left) properties.push(`--${cssZoneName}-left: ${zoneConfig.left}`);
    if (zoneConfig.right) properties.push(`--${cssZoneName}-right: ${zoneConfig.right}`);
    if (zoneConfig.top) properties.push(`--${cssZoneName}-top: ${zoneConfig.top}`);
    if (zoneConfig.bottom) properties.push(`--${cssZoneName}-bottom: ${zoneConfig.bottom}`);
    if (zoneConfig.width) properties.push(`--${cssZoneName}-width: ${zoneConfig.width}`);
    properties.push(`--${cssZoneName}-z-index: ${zoneConfig.zIndex}`);
  });

  // Card dimensions
  Object.entries(CARD_DIMENSIONS).forEach(([cardType, config]) => {
    const cssCardName = `card-${toKebabCase(cardType)}`;
    const cardConfig = config as Partial<CardDimension>;
    if (cardConfig.width) properties.push(`--${cssCardName}-width: ${cardConfig.width}`);
    if (cardConfig.height) properties.push(`--${cssCardName}-height: ${cardConfig.height}`);
    if (cardConfig.size) properties.push(`--${cssCardName}-size: ${cardConfig.size}`);
    if (cardConfig.aspectRatio) properties.push(`--${cssCardName}-aspect-ratio: ${cardConfig.aspectRatio}`);
  });

  // Zone heights
  Object.entries(ZONE_HEIGHTS).forEach(([zoneType, height]) => {
    properties.push(`--zone-${toKebabCase(zoneType)}-height: ${height}`);
  });

  // Hand layout
  Object.entries(HAND_LAYOUT).forEach(([key, value]) => {
    properties.push(`--hand-${toKebabCase(key)}: ${value}`);
  });

  // Hover config
  Object.entries(HOVER_CONFIG).forEach(([key, value]) => {
    properties.push(`--hover-${toKebabCase(key)}: ${value}`);
  });

  // Z-index
  Object.entries(Z_INDEX).forEach(([key, value]) => {
    properties.push(`--z-${toKebabCase(key)}: ${value}`);
  });

  // Responsive config
  Object.entries(RESPONSIVE_CONFIG).forEach(([key, value]) => {
    if (typeof value === 'string') {
      properties.push(`--poker-${toKebabCase(key)}: ${value}`);
    }
  });

  return properties.join('; ');
}

/**
 * Injects all layout CSS custom properties into the document
 * Must be called early in application initialization
 * 
 * @example
 * // In your app's main component or initialization
 * injectLayoutProperties();
 */
export function injectLayoutProperties(): void {
  if (typeof document === 'undefined') return;

  const css = generateCSSCustomProperties();
  const root = document.documentElement;

  // Split by semicolon and inject each property
  css.split(';').forEach(property => {
    property = property.trim();
    if (!property) return;

    const [key, value] = property.split(':');
    if (key && value) {
      root.style.setProperty(key.trim(), value.trim());
    }
  });
}

/**
 * Gets a specific zone's configuration
 * 
 * @param zone - The zone name
 * @returns The zone configuration object
 * 
 * @example
 * const playerHeroConfig = getZoneConfig('playerHero');
 */
export function getZoneConfig(zone: LayoutZone): ZoneConfig {
  return LAYOUT_ZONES[zone];
}

/**
 * Gets CSS variable names for a specific zone
 * Useful for CSS-in-JS libraries
 * 
 * @param zone - The zone name
 * @returns Object with CSS variable names
 * 
 * @example
 * const vars = getZoneCSSVars('playerHero');
 * // { left: '--player-hero-left', bottom: '--player-hero-bottom', ... }
 */
export function getZoneCSSVars(zone: LayoutZone): Record<string, string> {
  const cssZone = toKebabCase(zone);
  const config = getZoneConfig(zone) as Partial<ZoneConfig>;
  const vars: Record<string, string> = {};

  if (config.left) vars.left = `--${cssZone}-left`;
  if (config.right) vars.right = `--${cssZone}-right`;
  if (config.top) vars.top = `--${cssZone}-top`;
  if (config.bottom) vars.bottom = `--${cssZone}-bottom`;
  if (config.width) vars.width = `--${cssZone}-width`;
  if (config.zIndex) vars.zIndex = `--${cssZone}-z-index`;

  return vars;
}

/**
 * Converts camelCase to kebab-case
 * Helper function for CSS variable naming
 * 
 * @param str - camelCase string
 * @returns kebab-case string
 */
function toKebabCase(str: string): string {
  return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
}

export default {
  VIEWPORT_CONFIG,
  LAYOUT_ZONES,
  CARD_DIMENSIONS,
  ZONE_HEIGHTS,
  HAND_LAYOUT,
  HOVER_CONFIG,
  Z_INDEX,
  RESPONSIVE_CONFIG,
  generateCSSCustomProperties,
  injectLayoutProperties,
  getZoneConfig,
  getZoneCSSVars,
};

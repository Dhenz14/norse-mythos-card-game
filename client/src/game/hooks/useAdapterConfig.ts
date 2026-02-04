/**
 * Migration Feature Flags
 * 
 * Controls which stores components use during migration.
 * Set to true to use new unified stores, false for legacy stores.
 * 
 * Migration Order (safest first):
 * 1. UI stores (animations, targeting) - lowest risk
 * 2. Game flow store (screens, phases) - medium risk
 * 3. Combat store - highest risk, migrate last
 */

export const MIGRATION_FLAGS = {
  USE_UNIFIED_UI_STORE: true,
  USE_GAME_FLOW_STORE: true,
  USE_UNIFIED_COMBAT_STORE: true,
} as const;

export function isMigrationEnabled(flag: keyof typeof MIGRATION_FLAGS): boolean {
  return MIGRATION_FLAGS[flag];
}

import { useEffect } from 'react';
import { injectLayoutProperties } from '../combat/layoutConfig';

/**
 * useCombatLayout Hook
 * 
 * Injects CSS custom properties from layoutConfig.ts into the document root
 * when the combat arena mounts. This makes layoutConfig.ts the single source
 * of truth for all layout values, with CSS files consuming these variables.
 * 
 * @example
 * function RagnarokCombatArena() {
 *   useCombatLayout();
 *   return <div className="ragnarok-combat-arena">...</div>;
 * }
 */
export function useCombatLayout(): void {
  useEffect(() => {
    injectLayoutProperties();
  }, []);
}

export default useCombatLayout;

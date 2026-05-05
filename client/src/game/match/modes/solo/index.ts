/**
 * Solo mode — AI opponent, practice rewards (no XP/runas, no ranking).
 *
 * Public surface (filled in later phases):
 *   - resolver:   resolveSolo(args)         ✅ Fase 2
 *   - lifecycle:  onWin()                    — Fase 4 (no-op for practice)
 *   - aiProvider:                            — Fase 4 (moves client/game/ai/ here)
 *
 * Cross-mode rule: code in modes/campaign/ and modes/p2p/ MUST NOT
 * import from this module. Enforced by ESLint in Fase 6.
 */

export { resolveSolo } from './resolver';
export type { SoloResolveArgs } from './resolver';
export { buildSoloOpponentArmy } from './armyBuilder';

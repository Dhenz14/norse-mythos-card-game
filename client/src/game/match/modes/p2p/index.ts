/**
 * P2P mode — peer opponent, full economic reward (xpRunes percentage 1.0)
 * plus ranking (ELO). Authority is symmetric (Plan B) — both peers
 * apply commands independently and reconcile via state hash.
 *
 * Public surface (filled in later phases):
 *   - resolver:        resolveP2P(handshake)        — Fase 2
 *   - setupComponent:  <MatchSetupP2P/>             — Fase 5
 *                      Owns async handshake wait, calls resolveP2P,
 *                      pushes ctx into useMatchStore, then mounts the
 *                      coordinator.
 *   - lifecycle:       onWin(ctx, finalState)       — Fase 4
 *                      Dispatch ELO event (stub until ranking server).
 *   - wireSender:      moves chessWireSender here    — Fase 4 or 5
 *
 * Cross-mode rule: code in modes/solo/ and modes/campaign/ MUST NOT
 * import from this module. Enforced by ESLint in Fase 6.
 */

export {};

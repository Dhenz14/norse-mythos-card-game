/**
 * useMatchStore — holds the active MatchContext for the lifetime of one
 * match. Set by mode resolvers (or <MatchSetupP2P/> for async P2P
 * handshake), cleared on game_over or player exit.
 *
 * Lifetime invariant (enforced by routes / wrappers, not by this store):
 *   activeMatch is non-null EXACTLY when the coordinator is mounted.
 *   The coordinator itself never sees a transitional state — async
 *   build-up (P2P handshake) lives in a separate setup component.
 */

import { create } from 'zustand';
import type { MatchContext } from './types';

interface MatchState {
	activeMatch: MatchContext | null;
}

interface MatchActions {
	setMatch: (ctx: MatchContext) => void;
	clearMatch: () => void;
}

export const useMatchStore = create<MatchState & MatchActions>((set) => ({
	activeMatch: null,
	setMatch: (ctx) => set({ activeMatch: ctx }),
	clearMatch: () => set({ activeMatch: null }),
}));

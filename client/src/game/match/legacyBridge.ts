/**
 * Legacy bridge HOOK — drives useMatchStore from legacy stores for
 * single + campaign flows.
 *
 * Pure projection logic lives in `legacySynth.ts` so tests can run
 * without pulling in client-only modules (gameStore touches localStorage
 * at init). This file is React + Zustand glue only.
 *
 * Boundary with <MatchSetupP2P/>:
 *   The wrapper owns the P2P MatchContext. This bridge SKIPS any
 *   update when the active match is already a peer ctx — without that
 *   guard, the bridge would race with MatchSetupP2P and clear the peer
 *   ctx the wrapper just installed (synth returns null for P2P; old
 *   code would treat null as "clear the store").
 *
 * THIS FILE IS THROWAWAY. Fase 7 deletes it once single / campaign flows
 * shift to a menu-driven resolver path; from there, the coordinator
 * never needs to derive ctx from legacy stores.
 */

import { useEffect } from 'react';
import { useCampaignStore } from '../campaign';
import { usePeerStore } from '../stores/peerStore';
import { synthesizeLegacyMatchContext } from './legacySynth';
import { useMatchStore } from './store';

export function useLegacyMatchContextBridge(): void {
	const isP2PConnected = usePeerStore(
		(s) => s.connectionState === 'connected',
	);
	const campaignMission = useCampaignStore((s) => s.currentMission);
	const campaignDifficulty = useCampaignStore((s) => s.currentDifficulty);

	useEffect(() => {
		const prev = useMatchStore.getState().activeMatch;
		// MatchSetupP2P owns the peer ctx — never overwrite or clear it.
		if (prev?.opponent.kind === 'peer') return;
		const newCtx = synthesizeLegacyMatchContext({
			isP2PConnected,
			campaignMission,
			campaignDifficulty,
		});
		const newKind = newCtx?.opponent.kind ?? null;
		const prevKind = prev?.opponent.kind ?? null;
		if (newKind === prevKind) return; // no mode shift; preserve ctx
		if (newCtx) useMatchStore.getState().setMatch(newCtx);
		else useMatchStore.getState().clearMatch();
	}, [isP2PConnected, campaignMission, campaignDifficulty]);

	useEffect(() => {
		return () => {
			// Mirror the in-effect guard: don't clear a peer ctx on unmount;
			// MatchSetupP2P's own cleanup owns that.
			const prev = useMatchStore.getState().activeMatch;
			if (prev?.opponent.kind === 'peer') return;
			useMatchStore.getState().clearMatch();
		};
	}, []);
}

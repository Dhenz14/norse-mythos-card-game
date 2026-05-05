/**
 * Legacy bridge HOOK — drives useMatchStore from legacy stores.
 *
 * Pure projection logic lives in `legacySynth.ts` so tests can run
 * without pulling in client-only modules (gameStore touches localStorage
 * at init). This file is React + Zustand glue only.
 *
 * THIS FILE IS THROWAWAY. Fase 5 replaces it with <MatchSetupP2P/>
 * (async P2P handshake owner) plus menu-driven resolveSolo /
 * resolveCampaign calls. Once that lands the coordinator no longer
 * needs to derive ctx from legacy stores.
 *
 * Quirks (carried into Fase 5 to fix):
 *   - opponentUsername is currently kept in a useRef inside useP2PSync
 *     (not in any store). The synth sets it to null; consumers that
 *     need it should keep reading useP2PSync state directly until
 *     Fase 5 promotes it.
 *   - matchId for solo/campaign is minted by the resolver via
 *     cryptoIdGen on each synth call. To prevent identity churn during
 *     a single match the bridge only updates the store when
 *     opponent.kind changes (i.e., a real mode transition). Within
 *     one mode the existing ctx stays stable.
 */

import { useEffect } from 'react';
import { useCampaignStore } from '../campaign';
import { useGameStore } from '../stores/gameStore';
import { usePeerStore } from '../stores/peerStore';
import { synthesizeLegacyMatchContext } from './legacySynth';
import { useMatchStore } from './store';

export function useLegacyMatchContextBridge(): void {
	const isP2PConnected = usePeerStore(
		(s) => s.connectionState === 'connected',
	);
	const matchSeed = useGameStore((s) => s.matchSeed);
	const matchId = useGameStore((s) => s.matchId);
	const myCanonicalSide = useGameStore((s) => s.myCanonicalSide);
	const remotePeerId = usePeerStore((s) => s.remotePeerId);
	const campaignMission = useCampaignStore((s) => s.currentMission);
	const campaignDifficulty = useCampaignStore((s) => s.currentDifficulty);

	useEffect(() => {
		const newCtx = synthesizeLegacyMatchContext({
			isP2PConnected,
			matchSeed,
			matchId,
			myCanonicalSide,
			remotePeerId,
			campaignMission,
			campaignDifficulty,
		});
		const prev = useMatchStore.getState().activeMatch;
		const newKind = newCtx?.opponent.kind ?? null;
		const prevKind = prev?.opponent.kind ?? null;
		if (newKind === prevKind) return; // no mode shift; preserve ctx
		if (newCtx) useMatchStore.getState().setMatch(newCtx);
		else useMatchStore.getState().clearMatch();
	}, [
		isP2PConnected,
		matchSeed,
		matchId,
		myCanonicalSide,
		remotePeerId,
		campaignMission,
		campaignDifficulty,
	]);

	useEffect(() => {
		return () => {
			useMatchStore.getState().clearMatch();
		};
	}, []);
}

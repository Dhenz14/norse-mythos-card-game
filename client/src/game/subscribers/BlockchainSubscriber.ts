import { GameEventBus } from '@/core/events/GameEventBus';
import type { GameEndedEvent } from '@/core/events/GameEvents';
import { useGameStore } from '../stores/gameStore';
import { useTransactionQueueStore } from '@/data/blockchain/transactionQueueStore';
import { packageMatchResult } from '@/data/blockchain/matchResultPackager';
import { isBlockchainPackagingEnabled } from '../config/featureFlags';
import { generateMatchId, useHiveDataStore } from '@/data/HiveDataLayer';
import { debug } from '../config/debugConfig';
import type { CardUidMapping, PackagedMatchResult } from '@/data/blockchain/types';
import { usePeerStore } from '../stores/peerStore';
import { hiveSync } from '@/data/HiveSync';

type UnsubscribeFn = () => void;

let unsubscribes: UnsubscribeFn[] = [];
let gamePhaseUnsub: (() => void) | null = null;

// Captured when game transitions mulligan → playing
let gameStartTime = 0;

// Dedup guard: "{winner}_{turnNumber}" — unique per game session
// Prevents double-packaging when both the store watcher and event bus fire for the same game end
let lastProcessedMatchKey = '';

// ---------------------------------------------------------------------------
// Card UID extraction
// ---------------------------------------------------------------------------

/**
 * Builds a CardUidMapping array from all card instances a player used.
 * Uses nft_uid if the card is a real NFT, otherwise synthesizes a
 * deterministic test UID so XP calculations produce real data in test mode.
 */
function extractCardUidsFromGameState(side: 'player' | 'opponent'): CardUidMapping[] {
	const gs = useGameStore.getState().gameState;
	if (!gs) return [];

	const player = gs.players[side];
	if (!player) return [];

	const seenUids = new Set<string>();
	const uids: CardUidMapping[] = [];

	const allInstances = [
		...(player.battlefield ?? []),
		...(player.graveyard ?? []),
		...(player.hand ?? []),
	];

	for (const instance of allInstances) {
		const cardId = (instance.card as any)?.id;
		if (typeof cardId !== 'number') continue;

		// Real NFT uid takes priority; fall back to deterministic test uid
		const uid: string =
			(instance as any).nft_uid ??
			`test_${side}_${cardId}_${instance.instanceId ?? '0'}`;

		if (seenUids.has(uid)) continue;
		seenUids.add(uid);
		uids.push({ uid, cardId });
	}

	return uids;
}

/**
 * Builds a cardId → rarity map from card instances already in game state.
 * Avoids a separate allCards import — the data is already in memory.
 */
function buildCardRarities(
	playerUids: CardUidMapping[],
	opponentUids: CardUidMapping[]
): Map<number, string> {
	const gs = useGameStore.getState().gameState;
	const rarities = new Map<number, string>();
	if (!gs) return rarities;

	const relevantIds = new Set([
		...playerUids.map(u => u.cardId),
		...opponentUids.map(u => u.cardId),
	]);

	for (const side of ['player', 'opponent'] as const) {
		const player = gs.players[side];
		if (!player) continue;

		const allInstances = [
			...(player.battlefield ?? []),
			...(player.graveyard ?? []),
			...(player.hand ?? []),
		];

		for (const instance of allInstances) {
			const cardId = (instance.card as any)?.id;
			if (typeof cardId !== 'number' || !relevantIds.has(cardId) || rarities.has(cardId)) continue;
			const rarity: string = (instance.card as any)?.rarity ?? 'common';
			rarities.set(cardId, rarity.toLowerCase());
		}
	}

	return rarities;
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

function handleGameEnded(_event: GameEndedEvent): void {
	if (!isBlockchainPackagingEnabled()) return;

	const gameState = useGameStore.getState().gameState;
	if (!gameState || gameState.gamePhase !== 'game_over') return;

	// Dedup: both the store watcher and event bus can fire for the same game end
	const matchKey = `${gameState.winner ?? 'unknown'}_${gameState.turnNumber}`;
	if (matchKey === lastProcessedMatchKey) {
		debug.warn('[BlockchainSubscriber] Duplicate game-end suppressed, key:', matchKey);
		return;
	}
	lastProcessedMatchKey = matchKey;

	const hiveData = useHiveDataStore.getState();
	const playerUsername = hiveData.user?.hiveUsername;
	if (!playerUsername) {
		debug.warn('[BlockchainSubscriber] No Hive user logged in, skipping packaging');
		return;
	}

	const matchType = 'ranked' as const;
	const playerEloBefore = hiveData.stats?.odinsEloRating ?? 1000;

	// Use real start time captured at game start; fall back to 1 minute ago
	const startTime = gameStartTime > 0 ? gameStartTime : Date.now() - 60_000;

	// Opponent identifier: real Hive username in P2P, heroId for AI games
	const opponentUsername =
		(gameState.players.opponent as any).hiveUsername ??
		gameState.players.opponent.heroId ??
		'ai-opponent';

	// Extract card UIDs and rarities from live game state
	const playerCardUids = extractCardUidsFromGameState('player');
	const opponentCardUids = extractCardUidsFromGameState('opponent');
	const cardRarities = buildCardRarities(playerCardUids, opponentCardUids);

	const input = {
		matchId: generateMatchId(),
		matchType,
		playerUsername,
		opponentUsername,
		playerHeroId: gameState.players.player.heroId ?? '',
		opponentHeroId: gameState.players.opponent.heroId ?? '',
		startTime,
		seed: useGameStore.getState().matchSeed ?? `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
		playerCardUids,
		opponentCardUids,
		playerEloBefore,
		// TODO: look up opponent ELO from HAF reader in P2P mode
		opponentEloBefore: 1000,
	};

	// Pass collection only if non-empty (calculateXPRewards handles null gracefully)
	const collection = hiveData.cardCollection?.length ? hiveData.cardCollection : null;

	packageMatchResult(gameState, input, collection ?? undefined, cardRarities)
		.then(async (result) => {
			const finalResult = await attemptDualSig(result);
			enqueueResult(finalResult, playerCardUids.length, startTime);
		})
		.catch((err) => {
			debug.error('[BlockchainSubscriber] Failed to package match result:', err);
		});
}

// ---------------------------------------------------------------------------
// Dual-signature proposal (P2P ranked matches)
// ---------------------------------------------------------------------------

const DUAL_SIG_TIMEOUT_MS = 30_000;

async function attemptDualSig(result: PackagedMatchResult): Promise<PackagedMatchResult> {
	const peer = usePeerStore.getState();
	if (peer.connectionState !== 'connected' || !peer.isHost) return result;
	if (result.matchType !== 'ranked') return result;

	try {
		const broadcasterSig = await hiveSync.signResultHash(result.hash);
		peer.send({ type: 'result_propose', result, hash: result.hash, broadcasterSig });

		const counterpartySig = await waitForCountersign(DUAL_SIG_TIMEOUT_MS);
		if (counterpartySig) {
			return { ...result, signatures: { broadcaster: broadcasterSig, counterparty: counterpartySig } };
		}

		debug.warn('[BlockchainSubscriber] Dual-sig timeout/rejected — single-sig fallback');
		return { ...result, signatures: { broadcaster: broadcasterSig, counterparty: '' } };
	} catch (err) {
		debug.warn('[BlockchainSubscriber] Dual-sig signing failed — broadcasting unsigned:', err);
		return result;
	}
}

function waitForCountersign(timeoutMs: number): Promise<string | null> {
	return new Promise((resolve) => {
		const conn = usePeerStore.getState().connection;
		if (!conn) { resolve(null); return; }

		let settled = false;
		const c = conn; // capture non-null ref for closures

		const timer = setTimeout(() => {
			if (!settled) { settled = true; c.off('data', handler); resolve(null); }
		}, timeoutMs);

		function handler(data: unknown) {
			const msg = data as Record<string, unknown>;
			if (msg.type === 'result_countersign' && typeof msg.counterpartySig === 'string') {
				if (!settled) { settled = true; clearTimeout(timer); c.off('data', handler); resolve(msg.counterpartySig); }
			} else if (msg.type === 'result_reject') {
				if (!settled) { settled = true; clearTimeout(timer); c.off('data', handler); resolve(null); }
			}
		}

		c.on('data', handler);
	});
}

function enqueueResult(result: PackagedMatchResult, playerCardCount: number, startTime: number): void {
	const queue = useTransactionQueueStore.getState();

	// Single match_result tx carries everything: stats, ELO, RUNE, and XP awards.
	// The replay engine derives card XP/levels from the embedded xpRewards array —
	// no separate xp_update ops needed.
	queue.enqueue('match_result', result, result.hash);

	// Broadcast level_up for each card that crossed a level threshold.
	// This creates an on-chain record for quick lookups without full replay.
	for (const xp of result.xpRewards) {
		if (xp.didLevelUp) {
			queue.enqueue('level_up', {
				nft_id: xp.cardUid,
				card_id: xp.cardId,
				old_level: xp.levelBefore,
				new_level: xp.levelAfter,
				xp_total: xp.xpAfter,
				match_id: result.matchId,
			}, `${result.hash}_levelup_${xp.cardUid}`);
		}
	}

	debug.combat('[BlockchainSubscriber] Packaged and queued:', {
		matchId: result.matchId,
		winner: result.winner.username,
		eloChange: result.eloChanges.winner.delta,
		xpRewards: result.xpRewards.length,
		levelUps: result.xpRewards.filter(x => x.didLevelUp).length,
		playerCards: playerCardCount,
		dualSig: !!(result.signatures?.broadcaster && result.signatures?.counterparty),
		duration: Math.round((Date.now() - startTime) / 1000) + 's',
	});
}

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

export function initializeBlockchainSubscriber(): UnsubscribeFn {
	dispose();

	gameStartTime = 0;
	lastProcessedMatchKey = '';

	// Listen for GAME_ENDED on the event bus
	unsubscribes.push(
		GameEventBus.subscribe<GameEndedEvent>('GAME_ENDED', handleGameEnded, -10)
	);

	// Watch game phase transitions:
	//   mulligan → playing  : capture real game start time
	//   any      → game_over: fire GAME_ENDED event (single emitter)
	let prevPhase: string | undefined;
	gamePhaseUnsub = useGameStore.subscribe((state) => {
		const currentPhase = state.gameState?.gamePhase;

		if (prevPhase === 'mulligan' && currentPhase === 'playing' && gameStartTime === 0) {
			gameStartTime = Date.now();
			debug.combat('[BlockchainSubscriber] Game start time captured');
		}

		if (prevPhase !== 'game_over' && currentPhase === 'game_over') {
			const gs = state.gameState;
			if (gs) {
				GameEventBus.emitGameEnded({
					winner: gs.winner || null,
					reason: 'hero_death',
					finalTurn: gs.turnNumber,
				});
			}
		}

		prevPhase = currentPhase;
	});
	unsubscribes.push(gamePhaseUnsub);

	return dispose;
}

function dispose(): void {
	unsubscribes.forEach(fn => fn());
	unsubscribes = [];
	gamePhaseUnsub = null;
	gameStartTime = 0;
	lastProcessedMatchKey = '';
}

export default initializeBlockchainSubscriber;

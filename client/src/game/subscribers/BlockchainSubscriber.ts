import { GameEventBus } from '@/core/events/GameEventBus';
import type { GameEndedEvent } from '@/core/events/GameEvents';
import { useGameStore } from '../stores/gameStore';
import { useTransactionQueueStore } from '@/data/blockchain/transactionQueueStore';
import { packageMatchResult } from '@/data/blockchain/matchResultPackager';
import { isBlockchainPackagingEnabled } from '../config/featureFlags';
import { generateMatchId, useHiveDataStore } from '@/data/HiveDataLayer';
import { debug } from '../config/debugConfig';
import type { CardUidMapping } from '@/data/blockchain/types';

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
		// TODO (Phase 2B): replace with commit-reveal seed from P2P handshake
		seed: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
		playerCardUids,
		opponentCardUids,
		playerEloBefore,
		// TODO: look up opponent ELO from HAF reader in P2P mode
		opponentEloBefore: 1000,
	};

	// Pass collection only if non-empty (calculateXPRewards handles null gracefully)
	const collection = hiveData.cardCollection?.length ? hiveData.cardCollection : null;

	packageMatchResult(gameState, input, collection ?? undefined, cardRarities)
		.then((result) => {
			const queue = useTransactionQueueStore.getState();

			queue.enqueue('match_result', result, result.hash);

			for (const xpReward of result.xpRewards) {
				// Use per-card hash so each XP entry deduplicates independently
				queue.enqueue('xp_update', xpReward, `${result.hash}_xp_${xpReward.cardUid}`);
			}

			debug.combat('[BlockchainSubscriber] Packaged and queued:', {
				matchId: result.matchId,
				winner: result.winner.username,
				eloChange: result.eloChanges.winner.delta,
				xpRewards: result.xpRewards.length,
				playerCards: playerCardUids.length,
				duration: Math.round((Date.now() - startTime) / 1000) + 's',
			});
		})
		.catch((err) => {
			debug.error('[BlockchainSubscriber] Failed to package match result:', err);
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

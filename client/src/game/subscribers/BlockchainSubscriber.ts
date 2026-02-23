import { GameEventBus } from '@/core/events/GameEventBus';
import type { GameEndedEvent } from '@/core/events/GameEvents';
import { useGameStore } from '../stores/gameStore';
import { useTransactionQueueStore } from '@/data/blockchain/transactionQueueStore';
import { packageMatchResult } from '@/data/blockchain/matchResultPackager';
import { isBlockchainPackagingEnabled } from '../config/featureFlags';
import { generateMatchId, useHiveDataStore } from '@/data/HiveDataLayer';
import { debug } from '../config/debugConfig';

type UnsubscribeFn = () => void;

let unsubscribes: UnsubscribeFn[] = [];
let gamePhaseUnsub: (() => void) | null = null;

function handleGameEnded(event: GameEndedEvent): void {
	if (!isBlockchainPackagingEnabled()) return;

	const gameState = useGameStore.getState().gameState;
	if (!gameState || gameState.gamePhase !== 'game_over') return;

	const hiveData = useHiveDataStore.getState();
	const playerUsername = hiveData.user?.hiveUsername;
	if (!playerUsername) {
		debug.warn('[BlockchainSubscriber] No Hive user logged in, skipping packaging');
		return;
	}

	const matchType = 'ranked' as const;
	const playerStats = hiveData.stats;
	const playerEloBefore = playerStats?.odinsEloRating ?? 1000;

	const input = {
		matchId: generateMatchId(),
		matchType,
		playerUsername,
		opponentUsername: 'opponent',
		playerHeroId: gameState.players.player.heroId || '',
		opponentHeroId: gameState.players.opponent.heroId || '',
		startTime: Date.now() - 300000,
		seed: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
		playerCardUids: [],
		opponentCardUids: [],
		playerEloBefore,
		opponentEloBefore: 1000,
	};

	const cardRarities = new Map<number, string>();

	packageMatchResult(
		gameState,
		input,
		hiveData.cardCollection,
		cardRarities
	).then((result) => {
		const queue = useTransactionQueueStore.getState();

		queue.enqueue('match_result', result, result.hash);

		for (const xpReward of result.xpRewards) {
			queue.enqueue('xp_update', xpReward, result.hash);
		}

		debug.combat('[BlockchainSubscriber] Match result packaged and queued:', {
			matchId: result.matchId,
			winner: result.winner.username,
			eloChange: result.eloChanges.winner.delta,
			xpRewards: result.xpRewards.length,
		});
	}).catch((err) => {
		debug.error('[BlockchainSubscriber] Failed to package match result:', err);
	});
}

export function initializeBlockchainSubscriber(): UnsubscribeFn {
	dispose();

	unsubscribes.push(
		GameEventBus.subscribe<GameEndedEvent>(
			'GAME_ENDED',
			handleGameEnded,
			-10
		)
	);

	let prevPhase: string | undefined;
	gamePhaseUnsub = useGameStore.subscribe((state) => {
		const currentPhase = state.gameState?.gamePhase;
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
}

export default initializeBlockchainSubscriber;

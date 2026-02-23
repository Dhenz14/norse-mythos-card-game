import type { GameState } from '../../game/types';
import type {
	PackagedMatchResult,
	MatchPackagerInput,
	CardXPReward,
	MatchPlayerData,
	EloChange,
} from './types';
import { MATCH_RESULT_VERSION } from './types';
import { hashMatchResult } from './hashUtils';
import { calculateXPRewards } from './cardXPSystem';
import type { HiveCardAsset } from '../schemas/HiveTypes';

const ELO_K_FACTOR = 32;

// Typed game log entry for damage calculation
interface DamageLogEntry {
	type: 'damage';
	source: 'player' | 'opponent';
	amount: number;
}

function isDamageEntry(entry: unknown): entry is DamageLogEntry {
	if (!entry || typeof entry !== 'object') return false;
	const e = entry as Record<string, unknown>;
	return e.type === 'damage' &&
	       (e.source === 'player' || e.source === 'opponent') &&
	       typeof e.amount === 'number';
}

function calculateEloChange(playerElo: number, opponentElo: number, isWinner: boolean): number {
	const expectedScore = 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400));
	const actualScore = isWinner ? 1 : 0;
	return Math.round(ELO_K_FACTOR * (actualScore - expectedScore));
}

function extractPlayerData(
	gameState: GameState,
	side: 'player' | 'opponent',
	input: MatchPackagerInput
): MatchPlayerData {
	const player = gameState.players[side];
	const isPlayerSide = side === 'player';

	const cardIds = [
		...player.battlefield.map(c => (c.card as any)?.id),
		...player.graveyard.map(c => (c.card as any)?.id),
	].filter((id): id is number => typeof id === 'number');

	const uniqueCardIds = [...new Set(cardIds)];

	let damageDealt = 0;
	for (const entry of gameState.gameLog) {
		if (isDamageEntry(entry) && entry.source === side) {
			damageDealt += entry.amount;
		}
	}

	return {
		username: isPlayerSide ? input.playerUsername : input.opponentUsername,
		heroClass: player.heroClass || 'unknown',
		heroId: isPlayerSide ? input.playerHeroId : input.opponentHeroId,
		finalHp: (player as any).heroHealth ?? player.health ?? 0,
		damageDealt,
		pokerHandsWon: 0, // TODO (Phase 2B): wire from pokerCombatSlice hand resolution counter
		cardsUsed: uniqueCardIds,
	};
}

export async function packageMatchResult(
	gameState: GameState,
	input: MatchPackagerInput,
	cardCollection?: HiveCardAsset[] | null,
	cardRarities?: Map<number, string>
): Promise<PackagedMatchResult> {
	const isPlayerWinner = gameState.winner === 'player';
	const winnerSide: 'player' | 'opponent' = isPlayerWinner ? 'player' : 'opponent';
	const loserSide: 'player' | 'opponent' = isPlayerWinner ? 'opponent' : 'player';

	const winner = extractPlayerData(gameState, winnerSide, input);
	const loser = extractPlayerData(gameState, loserSide, input);

	const winnerEloBefore = isPlayerWinner ? input.playerEloBefore : input.opponentEloBefore;
	const loserEloBefore = isPlayerWinner ? input.opponentEloBefore : input.playerEloBefore;

	const winnerEloDelta = calculateEloChange(winnerEloBefore, loserEloBefore, true);
	const loserEloDelta = calculateEloChange(loserEloBefore, winnerEloBefore, false);

	const winnerElo: EloChange = {
		before: winnerEloBefore,
		after: Math.max(0, winnerEloBefore + winnerEloDelta),
		delta: winnerEloDelta,
	};
	const loserElo: EloChange = {
		before: loserEloBefore,
		after: Math.max(0, loserEloBefore + loserEloDelta),
		delta: loserEloDelta,
	};

	// XP rewards for winner's cards only (loser gets 0 — intentional "brutal" design)
	// calculateXPRewards handles null/undefined collection by defaulting card XP to 0
	let xpRewards: CardXPReward[] = [];
	if (input.matchType === 'ranked' && cardRarities && input.playerCardUids.length > 0) {
		const winnerCardUids = isPlayerWinner ? input.playerCardUids : input.opponentCardUids;
		xpRewards = calculateXPRewards(winnerCardUids, cardCollection, cardRarities, null);
	}

	const duration = Math.max(0, Date.now() - input.startTime);

	const resultWithoutHash: Omit<PackagedMatchResult, 'hash'> = {
		matchId: input.matchId,
		timestamp: Date.now(),
		matchType: input.matchType,
		winner,
		loser,
		duration,
		totalRounds: gameState.turnNumber,
		eloChanges: { winner: winnerElo, loser: loserElo },
		xpRewards,
		seed: input.seed,
		version: MATCH_RESULT_VERSION,
	};

	const hash = await hashMatchResult(resultWithoutHash);

	return { ...resultWithoutHash, hash };
}

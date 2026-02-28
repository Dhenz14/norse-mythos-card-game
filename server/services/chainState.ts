/**
 * chainState.ts — In-memory global chain state with JSON file persistence.
 *
 * Same pattern as matchmakingRoutes.ts (JSON file + in-memory Maps).
 * Stores player ELO, card ownership, match history, and sync cursors
 * derived from replaying Hive custom_json ops.
 *
 * On server startup: loads from data/chain-state.json
 * During operation: writes debounced every 30s
 * On shutdown: final flush
 */

import fs from 'fs';
import path from 'path';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PlayerRecord {
	username: string;
	elo: number;
	wins: number;
	losses: number;
	lastMatchAt: number;
}

export interface CardRecord {
	uid: string;
	cardId: number;
	owner: string;
	rarity: string;
	level: number;
	xp: number;
}

export interface MatchRecord {
	matchId: string;
	winner: string;
	loser: string;
	winnerEloBefore: number;
	winnerEloAfter: number;
	loserEloBefore: number;
	loserEloAfter: number;
	cardFingerprint: string;
	timestamp: number;
	blockNum: number;
}

interface SerializedState {
	players: [string, PlayerRecord][];
	cards: [string, CardRecord][];
	matches: MatchRecord[];
	knownAccounts: string[];
	syncCursors: [string, number][];
	lastSyncedAt: number;
	playerNonces: [string, number][];
}

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

const players = new Map<string, PlayerRecord>();
const cards = new Map<string, CardRecord>();
const matches: MatchRecord[] = [];
const knownAccounts = new Set<string>();
const syncCursors = new Map<string, number>();
const playerNonces = new Map<string, number>();
let lastSyncedAt = 0;

const MAX_MATCHES = 10000;
const STATE_FILE = path.join(process.cwd(), 'data', 'chain-state.json');
const SAVE_INTERVAL_MS = 30_000;

let _saveTimer: ReturnType<typeof setInterval> | null = null;
let _dirty = false;

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------

function ensureDataDir(): void {
	const dir = path.dirname(STATE_FILE);
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir, { recursive: true });
	}
}

export function loadState(): void {
	try {
		if (!fs.existsSync(STATE_FILE)) return;
		const raw = fs.readFileSync(STATE_FILE, 'utf8');
		const data: SerializedState = JSON.parse(raw);

		players.clear();
		for (const [k, v] of data.players ?? []) players.set(k, v);

		cards.clear();
		for (const [k, v] of data.cards ?? []) cards.set(k, v);

		matches.length = 0;
		matches.push(...(data.matches ?? []));

		knownAccounts.clear();
		for (const a of data.knownAccounts ?? []) knownAccounts.add(a);

		syncCursors.clear();
		for (const [k, v] of data.syncCursors ?? []) syncCursors.set(k, v);

		playerNonces.clear();
		for (const [k, v] of data.playerNonces ?? []) playerNonces.set(k, v);

		lastSyncedAt = data.lastSyncedAt ?? 0;

		console.log(`[chainState] Loaded: ${players.size} players, ${cards.size} cards, ${matches.length} matches, ${knownAccounts.size} accounts`);
	} catch (err) {
		console.warn('[chainState] Failed to load state:', err);
	}
}

export function saveState(): void {
	if (!_dirty) return;
	try {
		ensureDataDir();
		const data: SerializedState = {
			players: [...players.entries()],
			cards: [...cards.entries()],
			matches,
			knownAccounts: [...knownAccounts],
			syncCursors: [...syncCursors.entries()],
			lastSyncedAt,
			playerNonces: [...playerNonces.entries()],
		};
		const tmpFile = STATE_FILE + '.tmp';
		fs.writeFileSync(tmpFile, JSON.stringify(data), 'utf8');
		fs.renameSync(tmpFile, STATE_FILE);
		_dirty = false;
	} catch (err) {
		console.warn('[chainState] Failed to save state:', err);
	}
}

function markDirty(): void {
	_dirty = true;
}

export function startPersistence(): void {
	if (_saveTimer) return;
	_saveTimer = setInterval(saveState, SAVE_INTERVAL_MS);
}

export function stopPersistence(): void {
	if (_saveTimer) {
		clearInterval(_saveTimer);
		_saveTimer = null;
	}
	saveState();
}

// ---------------------------------------------------------------------------
// ELO calculation (same formula as client matchResultPackager.ts)
// ---------------------------------------------------------------------------

const ELO_K = 32;

function computeEloDelta(playerElo: number, opponentElo: number, isWinner: boolean): number {
	const expected = 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400));
	const actual = isWinner ? 1 : 0;
	return Math.round(ELO_K * (actual - expected));
}

// ---------------------------------------------------------------------------
// Players
// ---------------------------------------------------------------------------

export function getPlayer(username: string): PlayerRecord | undefined {
	return players.get(username);
}

export function getOrCreatePlayer(username: string): PlayerRecord {
	let p = players.get(username);
	if (!p) {
		p = { username, elo: 1000, wins: 0, losses: 0, lastMatchAt: 0 };
		players.set(username, p);
		markDirty();
	}
	return p;
}

export function getLeaderboard(limit: number, offset: number): { players: PlayerRecord[]; total: number } {
	const sorted = [...players.values()]
		.filter(p => p.wins + p.losses > 0)
		.sort((a, b) => b.elo - a.elo);
	return {
		players: sorted.slice(offset, offset + limit),
		total: sorted.length,
	};
}

// ---------------------------------------------------------------------------
// Matches
// ---------------------------------------------------------------------------

export function recordMatch(
	matchId: string,
	winner: string,
	loser: string,
	cardFingerprint: string,
	timestamp: number,
	blockNum: number,
): void {
	if (matches.some(m => m.matchId === matchId)) return;

	const wp = getOrCreatePlayer(winner);
	const lp = getOrCreatePlayer(loser);

	const winnerDelta = computeEloDelta(wp.elo, lp.elo, true);
	const loserDelta = computeEloDelta(lp.elo, wp.elo, false);

	const record: MatchRecord = {
		matchId,
		winner,
		loser,
		winnerEloBefore: wp.elo,
		winnerEloAfter: Math.max(0, wp.elo + winnerDelta),
		loserEloBefore: lp.elo,
		loserEloAfter: Math.max(0, lp.elo + loserDelta),
		cardFingerprint,
		timestamp,
		blockNum,
	};

	wp.elo = record.winnerEloAfter;
	wp.wins += 1;
	wp.lastMatchAt = timestamp;

	lp.elo = record.loserEloAfter;
	lp.losses += 1;
	lp.lastMatchAt = timestamp;

	matches.push(record);
	if (matches.length > MAX_MATCHES) {
		matches.splice(0, matches.length - MAX_MATCHES);
	}

	markDirty();
}

export function getMatchHistory(username: string, limit: number): MatchRecord[] {
	return matches
		.filter(m => m.winner === username || m.loser === username)
		.sort((a, b) => b.timestamp - a.timestamp)
		.slice(0, limit);
}

// ---------------------------------------------------------------------------
// Cards
// ---------------------------------------------------------------------------

export function getCard(uid: string): CardRecord | undefined {
	return cards.get(uid);
}

export function putCard(card: CardRecord): void {
	cards.set(card.uid, card);
	markDirty();
}

export function deleteCard(uid: string): void {
	cards.delete(uid);
	markDirty();
}

export function getCardsByOwner(owner: string): CardRecord[] {
	const result: CardRecord[] = [];
	for (const card of cards.values()) {
		if (card.owner === owner) result.push(card);
	}
	return result;
}

// ---------------------------------------------------------------------------
// Nonces (anti-replay for match_result)
// ---------------------------------------------------------------------------

export function advanceNonce(account: string, nonce: number): boolean {
	const current = playerNonces.get(account) ?? 0;
	if (nonce <= current) return false;
	playerNonces.set(account, nonce);
	markDirty();
	return true;
}

// ---------------------------------------------------------------------------
// Known accounts
// ---------------------------------------------------------------------------

export function registerAccount(username: string): boolean {
	if (knownAccounts.has(username)) return false;
	knownAccounts.add(username);
	markDirty();
	return true;
}

export function getKnownAccounts(): string[] {
	return [...knownAccounts];
}

export function isAccountKnown(username: string): boolean {
	return knownAccounts.has(username);
}

// ---------------------------------------------------------------------------
// Sync cursors
// ---------------------------------------------------------------------------

export function getSyncCursor(account: string): number {
	return syncCursors.get(account) ?? -1;
}

export function setSyncCursor(account: string, index: number): void {
	syncCursors.set(account, index);
	lastSyncedAt = Date.now();
	markDirty();
}

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

export function getStats(): {
	totalPlayers: number;
	totalCards: number;
	totalMatches: number;
	knownAccounts: number;
	lastSyncedAt: number;
} {
	return {
		totalPlayers: players.size,
		totalCards: cards.size,
		totalMatches: matches.length,
		knownAccounts: knownAccounts.size,
		lastSyncedAt,
	};
}

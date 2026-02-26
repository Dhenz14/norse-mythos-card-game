/**
 * replayDB.ts - IndexedDB layer for Hive chain replay
 *
 * Object stores:
 *   cards            keyed by uid         — HiveCardAsset rows
 *   matches          keyed by matchId     — HiveMatchResult rows
 *   sync_cursors     keyed by account     — replay progress per account
 *   token_balances   keyed by username    — RUNE/VALKYRIE/SEASON_POINTS per account
 *   genesis_state    keyed by 'singleton' — sealed flag, supply caps, reader version
 *   supply_counters  keyed by rarity      — minted count vs cap per rarity
 *   match_anchors    keyed by matchId     — dual-sig match_start records
 *   queue_entries    keyed by account     — active matchmaking queue entries
 *   slashed_accounts keyed by account     — accounts with confirmed slash evidence
 *
 * All writes are idempotent — safe to re-apply the same op.
 */

import type { HiveCardAsset, HiveMatchResult, HiveTokenBalance } from '../schemas/HiveTypes';
import { DEFAULT_TOKEN_BALANCE } from '../schemas/HiveTypes';

const DB_NAME = 'ragnarok-chain-v1';
const DB_VERSION = 4;

let _db: IDBDatabase | null = null;

export interface SyncCursor {
	account: string;
	lastHistoryIndex: number; // highest Hive account-history index processed
	lastSyncedAt: number;     // unix ms
}

// Stored match includes a flat participants array for multiEntry index queries
interface StoredMatch extends HiveMatchResult {
	participants: [string, string];
}

// ---------------------------------------------------------------------------
// DB open / upgrade
// ---------------------------------------------------------------------------

function openDB(): Promise<IDBDatabase> {
	if (_db) return Promise.resolve(_db);

	return new Promise((resolve, reject) => {
		const req = indexedDB.open(DB_NAME, DB_VERSION);

		req.onupgradeneeded = (e) => {
			const db = (e.target as IDBOpenDBRequest).result;

			if (!db.objectStoreNames.contains('cards')) {
				const cards = db.createObjectStore('cards', { keyPath: 'uid' });
				cards.createIndex('by_owner', 'ownerId', { unique: false });
			}

			if (!db.objectStoreNames.contains('matches')) {
				const matches = db.createObjectStore('matches', { keyPath: 'matchId' });
				// multiEntry index so each participant name is a separate index entry
				matches.createIndex('by_participant', 'participants', {
					unique: false,
					multiEntry: true,
				});
			}

			if (!db.objectStoreNames.contains('sync_cursors')) {
				db.createObjectStore('sync_cursors', { keyPath: 'account' });
			}

			if (!db.objectStoreNames.contains('token_balances')) {
				db.createObjectStore('token_balances', { keyPath: 'hiveUsername' });
			}

			if (!db.objectStoreNames.contains('genesis_state')) {
				db.createObjectStore('genesis_state', { keyPath: 'key' });
			}

			if (!db.objectStoreNames.contains('supply_counters')) {
				db.createObjectStore('supply_counters', { keyPath: 'rarity' });
			}

			if (!db.objectStoreNames.contains('match_anchors')) {
				db.createObjectStore('match_anchors', { keyPath: 'matchId' });
			}

			if (!db.objectStoreNames.contains('queue_entries')) {
				db.createObjectStore('queue_entries', { keyPath: 'account' });
			}

			if (!db.objectStoreNames.contains('slashed_accounts')) {
				db.createObjectStore('slashed_accounts', { keyPath: 'account' });
			}

			if (!db.objectStoreNames.contains('player_nonces')) {
				db.createObjectStore('player_nonces', { keyPath: 'account' });
			}
		};

		req.onsuccess = () => {
			_db = req.result;
			resolve(_db);
		};

		req.onerror = () => reject(req.error);
	});
}

// ---------------------------------------------------------------------------
// Generic IDB promise helpers
// ---------------------------------------------------------------------------

function idbGet<T>(store: string, key: string): Promise<T | undefined> {
	return openDB().then(
		(db) =>
			new Promise((resolve, reject) => {
				const req = db.transaction(store, 'readonly').objectStore(store).get(key);
				req.onsuccess = () => resolve(req.result as T | undefined);
				req.onerror = () => reject(req.error);
			}),
	);
}

function idbPut(store: string, value: unknown): Promise<void> {
	return openDB().then(
		(db) =>
			new Promise((resolve, reject) => {
				const req = db.transaction(store, 'readwrite').objectStore(store).put(value);
				req.onsuccess = () => resolve();
				req.onerror = () => reject(req.error);
			}),
	);
}

function idbDelete(store: string, key: string): Promise<void> {
	return openDB().then(
		(db) =>
			new Promise((resolve, reject) => {
				const req = db.transaction(store, 'readwrite').objectStore(store).delete(key);
				req.onsuccess = () => resolve();
				req.onerror = () => reject(req.error);
			}),
	);
}

function idbGetByIndex<T>(store: string, indexName: string, key: string): Promise<T[]> {
	return openDB().then(
		(db) =>
			new Promise((resolve, reject) => {
				const results: T[] = [];
				const req = db
					.transaction(store, 'readonly')
					.objectStore(store)
					.index(indexName)
					.openCursor(IDBKeyRange.only(key));

				req.onsuccess = (e) => {
					const cursor = (e.target as IDBRequest<IDBCursorWithValue>).result;
					if (cursor) {
						results.push(cursor.value as T);
						cursor.continue();
					} else {
						resolve(results);
					}
				};

				req.onerror = () => reject(req.error);
			}),
	);
}

// ---------------------------------------------------------------------------
// Cards API
// ---------------------------------------------------------------------------

export const getCard = (uid: string): Promise<HiveCardAsset | undefined> =>
	idbGet<HiveCardAsset>('cards', uid);

export const putCard = (card: HiveCardAsset): Promise<void> =>
	idbPut('cards', card);

export const deleteCard = (uid: string): Promise<void> =>
	idbDelete('cards', uid);

export const getCardsByOwner = (ownerId: string): Promise<HiveCardAsset[]> =>
	idbGetByIndex<HiveCardAsset>('cards', 'by_owner', ownerId);

// ---------------------------------------------------------------------------
// Matches API
// ---------------------------------------------------------------------------

export async function putMatch(match: HiveMatchResult): Promise<void> {
	const stored: StoredMatch = {
		...match,
		participants: [match.player1.hiveUsername, match.player2.hiveUsername],
	};
	return idbPut('matches', stored);
}

export async function getMatchesByAccount(username: string): Promise<HiveMatchResult[]> {
	const stored = await idbGetByIndex<StoredMatch>('matches', 'by_participant', username);
	return stored
		.sort((a, b) => b.timestamp - a.timestamp)
		.map(({ participants: _p, ...match }) => match as HiveMatchResult);
}

// ---------------------------------------------------------------------------
// Sync cursor API
// ---------------------------------------------------------------------------

export const getSyncCursor = (account: string): Promise<SyncCursor | undefined> =>
	idbGet<SyncCursor>('sync_cursors', account);

export const putSyncCursor = (cursor: SyncCursor): Promise<void> =>
	idbPut('sync_cursors', cursor);

// ---------------------------------------------------------------------------
// Token Balances API
// ---------------------------------------------------------------------------

export async function getTokenBalance(username: string): Promise<HiveTokenBalance> {
	const stored = await idbGet<HiveTokenBalance>('token_balances', username);
	return stored ?? { ...DEFAULT_TOKEN_BALANCE, hiveUsername: username };
}

export const putTokenBalance = (balance: HiveTokenBalance): Promise<void> =>
	idbPut('token_balances', balance);

// ---------------------------------------------------------------------------
// Genesis State API
// ---------------------------------------------------------------------------

export interface GenesisState {
	key: 'singleton';
	version: string;
	totalSupply: number;
	cardDistribution: Record<string, number>;
	sealed: boolean;
	sealedAtBlock: number | null;
	readerHash: string;
	genesisBlock: number;
}

const DEFAULT_GENESIS: GenesisState = {
	key: 'singleton',
	version: '',
	totalSupply: 0,
	cardDistribution: {},
	sealed: false,
	sealedAtBlock: null,
	readerHash: '',
	genesisBlock: 0,
};

export async function getGenesisState(): Promise<GenesisState> {
	const stored = await idbGet<GenesisState>('genesis_state', 'singleton');
	return stored ?? { ...DEFAULT_GENESIS };
}

export const putGenesisState = (state: GenesisState): Promise<void> =>
	idbPut('genesis_state', state);

// ---------------------------------------------------------------------------
// Supply Counters API
// ---------------------------------------------------------------------------

export interface SupplyCounter {
	rarity: string;
	cap: number;
	minted: number;
}

export const getSupplyCounter = (rarity: string): Promise<SupplyCounter | undefined> =>
	idbGet<SupplyCounter>('supply_counters', rarity);

export const putSupplyCounter = (counter: SupplyCounter): Promise<void> =>
	idbPut('supply_counters', counter);

// ---------------------------------------------------------------------------
// Match Anchors API
// ---------------------------------------------------------------------------

export interface MatchAnchor {
	matchId: string;
	playerA: string;
	playerB: string;
	matchHash: string;
	anchorBlockA: number | null;
	anchorBlockB: number | null;
	anchorTxA: string | null;
	anchorTxB: string | null;
	dualAnchored: boolean;
	deckHashA: string | null;
	deckHashB: string | null;
	timestamp: number;
}

export const getMatchAnchor = (matchId: string): Promise<MatchAnchor | undefined> =>
	idbGet<MatchAnchor>('match_anchors', matchId);

export const putMatchAnchor = (anchor: MatchAnchor): Promise<void> =>
	idbPut('match_anchors', anchor);

// ---------------------------------------------------------------------------
// Queue Entries API
// ---------------------------------------------------------------------------

export interface QueueEntry {
	account: string;
	mode: string;
	elo: number;
	peerId: string;
	deckHash: string;
	timestamp: number;
	blockNum: number;
}

export const getQueueEntry = (account: string): Promise<QueueEntry | undefined> =>
	idbGet<QueueEntry>('queue_entries', account);

export const putQueueEntry = (entry: QueueEntry): Promise<void> =>
	idbPut('queue_entries', entry);

export const deleteQueueEntry = (account: string): Promise<void> =>
	idbDelete('queue_entries', account);

export function getAllQueueEntries(): Promise<QueueEntry[]> {
	return openDB().then(
		(db) =>
			new Promise((resolve, reject) => {
				const results: QueueEntry[] = [];
				const req = db.transaction('queue_entries', 'readonly')
					.objectStore('queue_entries')
					.openCursor();
				req.onsuccess = (e) => {
					const cursor = (e.target as IDBRequest<IDBCursorWithValue>).result;
					if (cursor) {
						results.push(cursor.value as QueueEntry);
						cursor.continue();
					} else {
						resolve(results);
					}
				};
				req.onerror = () => reject(req.error);
			}),
	);
}

// ---------------------------------------------------------------------------
// Slashed Accounts API
// ---------------------------------------------------------------------------

export interface SlashedAccount {
	account: string;
	reason: string;
	evidenceTxA: string;
	evidenceTxB: string;
	slashedAtBlock: number;
	submittedBy: string;
}

export const getSlashedAccount = (account: string): Promise<SlashedAccount | undefined> =>
	idbGet<SlashedAccount>('slashed_accounts', account);

export const putSlashedAccount = (record: SlashedAccount): Promise<void> =>
	idbPut('slashed_accounts', record);

export const isAccountSlashed = async (account: string): Promise<boolean> => {
	const record = await getSlashedAccount(account);
	return record !== undefined;
};

// ---------------------------------------------------------------------------
// Player Nonces API — monotonic nonce per account for match_result anti-replay
// ---------------------------------------------------------------------------

export interface PlayerNonce {
	account: string;
	highestMatchNonce: number; // highest result_nonce seen for this account
}

export async function getPlayerNonce(account: string): Promise<PlayerNonce> {
	const stored = await idbGet<PlayerNonce>('player_nonces', account);
	return stored ?? { account, highestMatchNonce: 0 };
}

export const putPlayerNonce = (record: PlayerNonce): Promise<void> =>
	idbPut('player_nonces', record);

/**
 * Validate and advance nonce. Returns true if the nonce is higher than
 * previously seen (valid), false if it's a replay or duplicate.
 * Writes the new high-water mark when valid.
 */
export async function advancePlayerNonce(account: string, nonce: number): Promise<boolean> {
	const current = await getPlayerNonce(account);
	if (nonce <= current.highestMatchNonce) return false;
	await putPlayerNonce({ account, highestMatchNonce: nonce });
	return true;
}

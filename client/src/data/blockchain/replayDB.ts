/**
 * replayDB.ts - IndexedDB layer for Hive chain replay
 *
 * Object stores:
 *   cards           keyed by uid       — HiveCardAsset rows
 *   matches         keyed by matchId   — HiveMatchResult rows
 *   sync_cursors    keyed by account   — replay progress per account
 *   token_balances  keyed by username  — RUNE/VALKYRIE/SEASON_POINTS per account
 *
 * All writes are idempotent — safe to re-apply the same op.
 */

import type { HiveCardAsset, HiveMatchResult, HiveTokenBalance } from '../schemas/HiveTypes';
import { DEFAULT_TOKEN_BALANCE } from '../schemas/HiveTypes';

const DB_NAME = 'ragnarok-chain-v1';
const DB_VERSION = 2; // bumped for token_balances store addition

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

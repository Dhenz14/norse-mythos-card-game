/**
 * replayEngine.ts - Hive chain replay engine
 *
 * Reads account history from public Hive API nodes, applies replayRules,
 * writes to IndexedDB (replayDB), and hydrates the HiveDataLayer Zustand store.
 *
 * Zero cost: all reads are to free public Hive RPC nodes.
 * No server required. Works entirely in the browser.
 *
 * Usage:
 *   await syncAccount('username')   — one-shot full sync
 *   startSync('username')           — begin polling every SYNC_INTERVAL_MS
 *   stopSync()                      — cancel polling
 */

import { applyOp, type RawOp } from './replayRules';
import {
	getSyncCursor,
	putSyncCursor,
	getCardsByOwner,
	getMatchesByAccount,
} from './replayDB';
import { useHiveDataStore } from '../HiveDataLayer';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const HIVE_NODES = [
	'https://api.hive.blog',
	'https://api.deathwing.me',
	'https://api.openhive.network',
];

const HISTORY_PAGE_SIZE = 1000;
const NODE_TIMEOUT_MS = 8000;
const SYNC_INTERVAL_MS = 60_000; // re-sync every 60 s

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let _syncTimer: ReturnType<typeof setInterval> | null = null;
let _isSyncing = false;

// ---------------------------------------------------------------------------
// Hive RPC
// ---------------------------------------------------------------------------

interface HiveRpcResponse<T> {
	result?: T;
	error?: { message: string };
}

async function callHive<T>(method: string, params: unknown[]): Promise<T> {
	let lastError: Error = new Error('No Hive nodes configured');

	for (const node of HIVE_NODES) {
		const controller = new AbortController();
		const timer = setTimeout(() => controller.abort(), NODE_TIMEOUT_MS);

		try {
			const res = await fetch(node, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ jsonrpc: '2.0', method, params, id: 1 }),
				signal: controller.signal,
			});

			const data = (await res.json()) as HiveRpcResponse<T>;

			if (data.result !== undefined) return data.result;
			if (data.error) throw new Error(data.error.message);
		} catch (err) {
			lastError = err instanceof Error ? err : new Error(String(err));
		} finally {
			clearTimeout(timer);
		}
	}

	throw lastError;
}

// ---------------------------------------------------------------------------
// Account history types
// ---------------------------------------------------------------------------

type CustomJsonOpData = {
	required_auths: string[];
	required_posting_auths: string[];
	id: string;
	json: string;
};

type HiveHistoryEntry = {
	trx_id: string;
	block: number;
	timestamp: string; // ISO 8601
	op: ['custom_json', CustomJsonOpData] | [string, unknown];
};

type HistoryPage = [number, HiveHistoryEntry][];

async function fetchHistoryPage(
	account: string,
	start: number,
	limit: number,
): Promise<HistoryPage> {
	return callHive<HistoryPage>('condenser_api.get_account_history', [account, start, limit]);
}

// ---------------------------------------------------------------------------
// Core sync
// ---------------------------------------------------------------------------

export async function syncAccount(username: string): Promise<void> {
	if (_isSyncing) return;
	_isSyncing = true;

	try {
		await _doSync(username);
	} finally {
		_isSyncing = false;
	}
}

async function _doSync(username: string): Promise<void> {
	const cursor = await getSyncCursor(username);
	// lastHistoryIndex = -1 means "never synced" (Hive indices start at 0)
	const lastIndex = cursor?.lastHistoryIndex ?? -1;

	// Collect all ops with index > lastIndex by paging backwards through history
	const opsToApply: Array<{
		idx: number;
		entry: HiveHistoryEntry;
		broadcaster: string;
	}> = [];

	let pageStart = -1; // -1 = fetch from latest entry
	let done = false;

	while (!done) {
		const page = await fetchHistoryPage(username, pageStart, HISTORY_PAGE_SIZE);
		if (!page || page.length === 0) break;

		for (const [idx, entry] of page) {
			// Stop once we hit already-processed entries
			if (idx <= lastIndex) {
				done = true;
				break;
			}

			// We only care about our app's custom_json ops
			if (entry.op[0] !== 'custom_json') continue;
			const opData = entry.op[1] as CustomJsonOpData;
			if (!opData.id?.startsWith('rp_')) continue;

			const broadcaster =
				opData.required_posting_auths?.[0] ??
				opData.required_auths?.[0] ??
				username;

			opsToApply.push({ idx, entry, broadcaster });
		}

		// If we got a full page AND haven't hit the overlap yet, fetch older entries
		if (!done && page.length >= HISTORY_PAGE_SIZE) {
			const lowestIdx = page[0][0];
			if (lowestIdx <= lastIndex + 1) break; // nothing older to fetch
			pageStart = lowestIdx - 1;
		} else {
			break;
		}
	}

	if (opsToApply.length === 0) {
		// Update lastSyncedAt even when no new ops
		await putSyncCursor({
			account: username,
			lastHistoryIndex: lastIndex,
			lastSyncedAt: Date.now(),
		});
		return;
	}

	// Apply in ascending order so state transitions are correct (oldest first)
	opsToApply.sort((a, b) => a.idx - b.idx);

	let highestIdx = lastIndex;
	for (const { idx, entry, broadcaster } of opsToApply) {
		const opData = entry.op[1] as CustomJsonOpData;
		const op: RawOp = {
			id: opData.id,
			json: opData.json,
			broadcaster,
			trxId: entry.trx_id,
			blockNum: entry.block,
			timestamp: new Date(entry.timestamp).getTime(),
		};
		await applyOp(op);
		if (idx > highestIdx) highestIdx = idx;
	}

	await putSyncCursor({
		account: username,
		lastHistoryIndex: highestIdx,
		lastSyncedAt: Date.now(),
	});

	// Hydrate Zustand store from freshly-written IndexedDB data
	await hydrateStore(username);
}

// ---------------------------------------------------------------------------
// Hydrate Zustand store
// ---------------------------------------------------------------------------

async function hydrateStore(username: string): Promise<void> {
	const [cards, matches] = await Promise.all([
		getCardsByOwner(username),
		getMatchesByAccount(username),
	]);

	useHiveDataStore.getState().loadFromHive({
		cardCollection: cards,
		recentMatches: matches.slice(0, 100),
	});
}

// ---------------------------------------------------------------------------
// Polling start / stop
// ---------------------------------------------------------------------------

export function startSync(username: string): void {
	if (_syncTimer !== null) return; // already running

	// Immediate sync on start, then poll
	syncAccount(username).catch((err) => console.warn('[replayEngine] sync error:', err));

	_syncTimer = setInterval(
		() => syncAccount(username).catch((err) => console.warn('[replayEngine] sync error:', err)),
		SYNC_INTERVAL_MS,
	);
}

export function stopSync(): void {
	if (_syncTimer !== null) {
		clearInterval(_syncTimer);
		_syncTimer = null;
	}
}

// ---------------------------------------------------------------------------
// One-shot manual refresh (for UI "Refresh" buttons)
// ---------------------------------------------------------------------------

export async function forceSync(username: string): Promise<void> {
	await syncAccount(username);
}

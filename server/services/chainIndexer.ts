/**
 * chainIndexer.ts — Server-side Hive chain indexer
 *
 * PR 2A: Wired to shared protocol-core for normalize + validate + apply.
 * Still uses get_account_history for fetching (canonical block scan is PR 2B).
 *
 * The protocol-core handles ALL validation: PoW, signatures, nonces,
 * cooldowns, supply caps, ELO, RUNE, XP. No duplicate logic here.
 */

import {
	normalizeRawOp,
	applyOp,
	type RawHiveOp,
	type ReplayContext,
	type ProtocolCoreDeps,
	type CardDataProvider,
	type RewardProvider,
	type SignatureVerifier,
} from '../../shared/protocol-core';
import { serverStateAdapter } from './serverStateAdapter';
import {
	registerAccount,
	getKnownAccounts,
	getSyncCursor,
	setSyncCursor,
	loadState,
	startPersistence,
	stopPersistence,
	saveState,
} from './chainState';

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
const POLL_INTERVAL_MS = 30_000;

const RAGNAROK_ACCOUNT = 'ragnarok';

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
	timestamp: string;
	op: ['custom_json', CustomJsonOpData] | [string, unknown];
};

type HistoryPage = [number, HiveHistoryEntry][];

async function fetchHistoryPage(account: string, start: number, limit: number): Promise<HistoryPage> {
	return callHive<HistoryPage>('condenser_api.get_account_history', [account, start, limit]);
}

// ---------------------------------------------------------------------------
// Block header lookup (stub for PR 2A — real implementation in PR 2B)
// ---------------------------------------------------------------------------

async function getBlockId(blockNum: number): Promise<string | null> {
	try {
		const result = await callHive<{ block_id: string } | null>(
			'condenser_api.get_block_header', [blockNum],
		);
		return result?.block_id ?? null;
	} catch {
		return null;
	}
}

// ---------------------------------------------------------------------------
// LIB lookup
// ---------------------------------------------------------------------------

async function getLastIrreversibleBlock(): Promise<number> {
	try {
		const props = await callHive<{ last_irreversible_block_num: number }>(
			'condenser_api.get_dynamic_global_properties', [],
		);
		return props.last_irreversible_block_num;
	} catch {
		return 999_999_999; // fallback: treat all blocks as irreversible (legacy behavior)
	}
}

// ---------------------------------------------------------------------------
// Protocol-core dependencies
// ---------------------------------------------------------------------------

// Minimal card data provider for server (no full card registry)
const serverCardData: CardDataProvider = {
	getCardById(id: number) {
		if (id >= 1000 && id <= 99999) {
			return { name: `Card${id}`, type: 'minion', rarity: 'common', collectible: true };
		}
		return null;
	},
	getCollectibleIdsInRanges(ranges: [number, number][]) {
		const ids: number[] = [];
		for (const [lo, hi] of ranges) {
			for (let i = lo; i <= Math.min(hi, lo + 5000); i++) ids.push(i);
		}
		return ids;
	},
};

const serverRewards: RewardProvider = {
	getRewardById() { return null; }, // Server doesn't process reward claims yet
};

const serverSigs: SignatureVerifier = {
	async verifyAnchored() { return true; },   // TODO: real sig verification in PR 2B
	async verifyCurrentKey() { return true; },  // TODO: real sig verification in PR 2B
};

function buildDeps(): ProtocolCoreDeps {
	return {
		state: serverStateAdapter,
		cards: serverCardData,
		rewards: serverRewards,
		sigs: serverSigs,
	};
}

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let _pollTimer: ReturnType<typeof setInterval> | null = null;
let _isSyncing = false;
let _accountIndex = 0;

// ---------------------------------------------------------------------------
// Sync single account
// ---------------------------------------------------------------------------

async function syncAccount(username: string): Promise<number> {
	const lastIndex = getSyncCursor(username);
	const opsToApply: Array<{
		idx: number;
		rawOp: RawHiveOp;
	}> = [];

	let pageStart = -1;
	let done = false;

	while (!done) {
		const page = await fetchHistoryPage(username, pageStart, HISTORY_PAGE_SIZE);
		if (!page || page.length === 0) break;

		for (const [idx, entry] of page) {
			if (idx <= lastIndex) { done = true; break; }
			if (entry.op[0] !== 'custom_json') continue;

			const opData = entry.op[1] as CustomJsonOpData;
			// Quick pre-filter: only ragnarok protocol ops
			if (!opData.id?.startsWith('rp_') && opData.id !== 'ragnarok-cards' && opData.id !== 'ragnarok_level_up') continue;

			const broadcaster = opData.required_posting_auths?.[0] ?? opData.required_auths?.[0] ?? username;

			opsToApply.push({
				idx,
				rawOp: {
					customJsonId: opData.id,
					json: opData.json,
					broadcaster,
					trxId: entry.trx_id,
					blockNum: entry.block,
					timestamp: new Date(entry.timestamp).getTime(),
					requiredPostingAuths: opData.required_posting_auths ?? [],
					requiredAuths: opData.required_auths ?? [],
				},
			});
		}

		if (!done && page.length >= HISTORY_PAGE_SIZE) {
			const lowestIdx = page[0][0];
			if (lowestIdx <= lastIndex + 1) break;
			pageStart = lowestIdx - 1;
		} else {
			break;
		}
	}

	if (opsToApply.length === 0) {
		setSyncCursor(username, lastIndex);
		return 0;
	}

	opsToApply.sort((a, b) => a.idx - b.idx);

	const lib = await getLastIrreversibleBlock();
	const ctx: ReplayContext = { lastIrreversibleBlock: lib, getBlockId };
	const deps = buildDeps();

	let highestIdx = lastIndex;
	let appliedCount = 0;

	for (const { idx, rawOp } of opsToApply) {
		// Normalize through protocol-core (legacy mapping, authority check)
		const normalized = normalizeRawOp(rawOp);

		if (normalized.status === 'ignore') {
			if (idx > highestIdx) highestIdx = idx;
			continue;
		}

		// Apply through protocol-core (all validation lives here)
		const result = await applyOp(normalized.op, ctx, deps);

		if (result.status === 'applied') {
			appliedCount++;
			// Register accounts discovered from ops
			registerAccount(rawOp.broadcaster);
		} else if (result.status === 'rejected') {
			console.warn(`[chainIndexer] REJECTED ${normalized.op.action} from ${rawOp.broadcaster} block=${rawOp.blockNum}: ${result.reason}`);
		}

		if (idx > highestIdx) highestIdx = idx;
	}

	setSyncCursor(username, highestIdx);
	return appliedCount;
}

// ---------------------------------------------------------------------------
// Poll loop
// ---------------------------------------------------------------------------

async function pollNext(): Promise<void> {
	if (_isSyncing) return;
	_isSyncing = true;

	try {
		const accounts = getKnownAccounts();
		if (accounts.length === 0) {
			registerAccount(RAGNAROK_ACCOUNT);
			return;
		}

		_accountIndex = _accountIndex % accounts.length;
		const account = accounts[_accountIndex];
		_accountIndex++;

		const opsProcessed = await syncAccount(account);
		if (opsProcessed > 0) {
			console.log(`[chainIndexer] Synced ${account}: ${opsProcessed} ops processed via protocol-core`);
		}
	} catch (err) {
		console.warn('[chainIndexer] Poll error:', err instanceof Error ? err.message : err);
	} finally {
		_isSyncing = false;
	}
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function startIndexer(): void {
	if (_pollTimer) return;

	loadState();
	startPersistence();
	registerAccount(RAGNAROK_ACCOUNT);
	pollNext();

	_pollTimer = setInterval(pollNext, POLL_INTERVAL_MS);
	console.log('[chainIndexer] Started with protocol-core (polling every %ds)', POLL_INTERVAL_MS / 1000);
}

export function stopIndexer(): void {
	if (_pollTimer) {
		clearInterval(_pollTimer);
		_pollTimer = null;
	}
	stopPersistence();
	console.log('[chainIndexer] Stopped');
}

export async function syncAccountNow(username: string): Promise<number> {
	registerAccount(username);
	try {
		return await syncAccount(username);
	} catch (err) {
		console.warn(`[chainIndexer] On-demand sync failed for ${username}:`, err instanceof Error ? err.message : err);
		return 0;
	}
}

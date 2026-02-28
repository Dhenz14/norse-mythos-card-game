/**
 * chainIndexer.ts — Server-side Hive chain indexer
 *
 * Polls public Hive RPC nodes for ragnarok-cards / rp_* / ragnarok_level_up
 * custom_json ops across all known player accounts. Processes ops into the
 * in-memory chainState, which serves the /api/chain/* REST endpoints.
 *
 * Port of client/src/data/blockchain/replayEngine.ts for Node.js.
 * Uses node:fetch (Node 18+) instead of browser fetch.
 * Writes to in-memory Maps (chainState.ts) instead of IndexedDB.
 */

import { createHash } from 'crypto';
import {
	getOrCreatePlayer,
	registerAccount,
	recordMatch,
	getCard,
	putCard,
	deleteCard,
	getCardsByOwner,
	advanceNonce,
	getKnownAccounts,
	getSyncCursor,
	setSyncCursor,
	loadState,
	startPersistence,
	stopPersistence,
	saveState,
	type CardRecord,
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
const MIN_ACCOUNT_INTERVAL_MS = 2000;

const RAGNAROK_ACCOUNT = 'ragnarok';

// XP per win by rarity (mirrors client cardXPSystem.ts)
const XP_PER_WIN: Record<string, number> = {
	free: 5, basic: 5, common: 10, rare: 15, epic: 20, legendary: 25,
};

// Level thresholds by rarity (mirrors client cardXPSystem.ts)
const XP_THRESHOLDS: Record<string, number[]> = {
	free: [0, 20, 50],
	basic: [0, 20, 50],
	common: [0, 50, 150],
	rare: [0, 100, 300],
	epic: [0, 160, 480],
	legendary: [0, 200, 500],
};

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let _pollTimer: ReturnType<typeof setInterval> | null = null;
let _isSyncing = false;
let _accountIndex = 0;

// ---------------------------------------------------------------------------
// Hive RPC (same as client replayEngine.ts, using node:fetch)
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
// Op processing (simplified replayRules for server-side)
// ---------------------------------------------------------------------------

function decodeCardIds(hex: string): number[] {
	const ids: number[] = [];
	for (let i = 0; i + 4 <= hex.length; i += 4) {
		ids.push(parseInt(hex.slice(i, i + 4), 16));
	}
	return ids;
}

function getLevelForXP(rarity: string, xp: number): number {
	const thresholds = XP_THRESHOLDS[rarity] ?? XP_THRESHOLDS.common;
	let level = 1;
	for (let i = 1; i < thresholds.length; i++) {
		if (xp >= thresholds[i]) level = i + 1;
	}
	return Math.min(level, 3);
}

// LCG for deterministic pack_open
function lcgNext(seed: number): number {
	return (seed * 16807) % 2147483647;
}

const CARD_RANGES: Record<string, [number, number]> = {
	starter: [1000, 1999], standard: [1000, 3999], class: [4000, 8999],
	mega: [1000, 8999], norse: [20000, 29999],
};

const PACK_SIZES: Record<string, number> = { starter: 5, standard: 5, mega: 15 };

interface OpContext {
	broadcaster: string;
	trxId: string;
	blockNum: number;
	timestamp: number;
}

function processOp(opId: string, payload: Record<string, unknown>, ctx: OpContext): void {
	switch (opId) {
		case 'rp_match_result': return processMatchResult(payload, ctx);
		case 'rp_mint': return processMint(payload, ctx);
		case 'rp_card_transfer':
		case 'rp_transfer': return processTransfer(payload, ctx);
		case 'rp_burn': return processBurn(payload, ctx);
		case 'rp_level_up': return processLevelUp(payload, ctx);
		case 'rp_pack_open': return processPackOpen(payload, ctx);
		case 'rp_queue_join': {
			registerAccount(ctx.broadcaster);
			break;
		}
		default: break;
	}
}

function processMatchResult(payload: Record<string, unknown>, ctx: OpContext): void {
	const isCompact = typeof payload.m === 'string';
	const winner = (isCompact ? payload.w : payload.winnerId) as string;
	const loser = (isCompact ? payload.l : null) as string | null;
	const mId = (isCompact ? payload.m : payload.matchId) as string;
	const nonce = Number(isCompact ? payload.n : payload.result_nonce ?? 0);

	if (!mId || !winner) return;

	let p1: string, p2: string;
	if (isCompact) {
		p1 = winner;
		p2 = loser ?? '';
	} else {
		const pl1 = payload.player1 as Record<string, unknown> | undefined;
		const pl2 = payload.player2 as Record<string, unknown> | undefined;
		if (!pl1 || !pl2) return;
		p1 = pl1.hiveUsername as string;
		p2 = pl2.hiveUsername as string;
	}

	if (!p1 || !p2 || p1 === p2) return;
	if (ctx.broadcaster !== p1 && ctx.broadcaster !== p2) return;
	if (!advanceNonce(ctx.broadcaster, nonce)) return;

	const cardHex = (isCompact ? payload.c : undefined) as string | undefined;

	registerAccount(p1);
	registerAccount(p2);
	recordMatch(mId, winner, p2 === winner ? p1 : p2, cardHex ?? '', ctx.timestamp, ctx.blockNum);

	// Chain-derived XP: give XP to winner's cards
	if (cardHex && winner) {
		const winnerCardIds = new Set(decodeCardIds(cardHex));
		const winnerCards = getCardsByOwner(winner);

		for (const card of winnerCards) {
			if (!winnerCardIds.has(card.cardId)) continue;
			const rarity = card.rarity || 'common';
			const xpGain = XP_PER_WIN[rarity] ?? XP_PER_WIN.common;
			putCard({ ...card, xp: card.xp + xpGain });
		}
	}
}

function processMint(payload: Record<string, unknown>, ctx: OpContext): void {
	if (ctx.broadcaster !== RAGNAROK_ACCOUNT) return;
	const to = payload.to as string;
	const mintCards = payload.cards as Array<{ nft_id: string; card_id: string; rarity: string }> | undefined;
	if (!to || !mintCards || !Array.isArray(mintCards)) return;

	for (const c of mintCards) {
		if (!c.nft_id || !c.card_id) continue;
		if (getCard(c.nft_id)) continue;
		putCard({
			uid: c.nft_id,
			cardId: typeof c.card_id === 'number' ? c.card_id : parseInt(c.card_id, 10) || 0,
			owner: to,
			rarity: c.rarity || 'common',
			level: 1,
			xp: 0,
		});
		registerAccount(to);
	}
}

function processTransfer(payload: Record<string, unknown>, ctx: OpContext): void {
	const nftId = (payload.nft_id ?? payload.card_uid) as string;
	const to = payload.to as string;
	if (!nftId || !to) return;

	const card = getCard(nftId);
	if (!card) return;
	if (card.owner !== ctx.broadcaster) return;
	if (to === ctx.broadcaster) return;

	putCard({ ...card, owner: to });
	registerAccount(to);
}

function processBurn(payload: Record<string, unknown>, ctx: OpContext): void {
	const nftId = (payload.nft_id ?? payload.card_uid) as string;
	if (!nftId) return;

	const card = getCard(nftId);
	if (!card) return;
	if (card.owner !== ctx.broadcaster) return;

	deleteCard(nftId);
}

function processLevelUp(payload: Record<string, unknown>, ctx: OpContext): void {
	let nftId: string;
	let newLevel: number;

	if (typeof payload.d === 'string' && payload.v === 1) {
		const parts = (payload.d as string).split(':');
		if (parts.length < 3) return;
		nftId = parts[0];
		newLevel = parseInt(parts[2], 16);
	} else {
		nftId = (payload.nft_id ?? payload.cardUid) as string;
		newLevel = Number(payload.new_level ?? 0);
	}

	if (!nftId || !newLevel || newLevel <= 0 || newLevel > 3) return;

	const card = getCard(nftId);
	if (!card) return;
	if (card.owner !== ctx.broadcaster) return;
	if (newLevel <= card.level) return;

	const rarity = card.rarity || 'common';
	const expectedLevel = getLevelForXP(rarity, card.xp);
	if (newLevel > expectedLevel) return;

	putCard({ ...card, level: newLevel });
}

function processPackOpen(payload: Record<string, unknown>, ctx: OpContext): void {
	const packType = (payload.pack_type as string) ?? 'standard';
	const quantity = Math.min(Number(payload.quantity ?? 1), 10);
	const cardCount = (PACK_SIZES[packType] ?? 5) * quantity;

	let seedHex = ctx.trxId.replace(/[^0-9a-f]/gi, '').slice(0, 8);
	if (seedHex.length < 4) {
		let hash = 0;
		for (let i = 0; i < ctx.trxId.length; i++) {
			hash = ((hash << 5) - hash + ctx.trxId.charCodeAt(i)) | 0;
		}
		seedHex = (Math.abs(hash) >>> 0).toString(16).slice(0, 8);
	}
	const seed = parseInt(seedHex || 'a7f3', 16);

	let s = Math.max(seed, 1);
	const cardIds: number[] = Array.from({ length: cardCount }, () => {
		s = lcgNext(s);
		const [start, end] = CARD_RANGES[packType] ?? CARD_RANGES.standard;
		return start + (s % (end - start + 1));
	});

	const isGold = (lcgNext(seed) % 20) === 0;
	const edition = ctx.blockNum < 1_000_000 ? 'alpha' : 'beta';

	for (let i = 0; i < cardIds.length; i++) {
		const uid = `${ctx.trxId}-${i}`;
		if (getCard(uid)) continue;

		s = lcgNext(s);
		const rarityRoll = s % 100;
		const rarity = rarityRoll < 1 ? 'legendary' : rarityRoll < 6 ? 'epic' : rarityRoll < 20 ? 'rare' : 'common';

		putCard({
			uid,
			cardId: cardIds[i],
			owner: ctx.broadcaster,
			rarity,
			level: 1,
			xp: 0,
		});
	}

	registerAccount(ctx.broadcaster);
}

// ---------------------------------------------------------------------------
// Sync single account
// ---------------------------------------------------------------------------

async function syncAccount(username: string): Promise<number> {
	const lastIndex = getSyncCursor(username);
	const opsToApply: Array<{
		idx: number;
		entry: HiveHistoryEntry;
		broadcaster: string;
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
			if (!opData.id?.startsWith('rp_') && opData.id !== 'ragnarok-cards' && opData.id !== 'ragnarok_level_up') continue;

			const broadcaster = opData.required_posting_auths?.[0] ?? opData.required_auths?.[0] ?? username;
			opsToApply.push({ idx, entry, broadcaster });
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

	let highestIdx = lastIndex;
	for (const { idx, entry, broadcaster } of opsToApply) {
		const opData = entry.op[1] as CustomJsonOpData;

		let opId = opData.id;
		if (opId === 'ragnarok-cards') {
			try {
				const parsed = JSON.parse(opData.json) as { action?: string };
				if (parsed.action) opId = `rp_${parsed.action}`;
			} catch { /* use raw id */ }
		} else if (opId === 'ragnarok_level_up') {
			opId = 'rp_level_up';
		}

		let payload: Record<string, unknown>;
		try {
			payload = JSON.parse(opData.json) as Record<string, unknown>;
		} catch { continue; }

		processOp(opId, payload, {
			broadcaster,
			trxId: entry.trx_id,
			blockNum: entry.block,
			timestamp: new Date(entry.timestamp).getTime(),
		});

		if (idx > highestIdx) highestIdx = idx;
	}

	setSyncCursor(username, highestIdx);
	return opsToApply.length;
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
			// Bootstrap: always sync the ragnarok account first
			registerAccount(RAGNAROK_ACCOUNT);
			return;
		}

		// Round-robin through accounts
		_accountIndex = _accountIndex % accounts.length;
		const account = accounts[_accountIndex];
		_accountIndex++;

		const opsProcessed = await syncAccount(account);
		if (opsProcessed > 0) {
			console.log(`[chainIndexer] Synced ${account}: ${opsProcessed} ops processed`);
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

	// Always ensure ragnarok account is tracked
	registerAccount(RAGNAROK_ACCOUNT);

	// Immediate first poll
	pollNext();

	_pollTimer = setInterval(pollNext, POLL_INTERVAL_MS);
	console.log('[chainIndexer] Started (polling every %ds)', POLL_INTERVAL_MS / 1000);
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

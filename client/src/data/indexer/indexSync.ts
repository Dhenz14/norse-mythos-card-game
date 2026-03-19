/**
 * Index Sync Service — Fetches index from IPFS, caches in IndexedDB
 *
 * Resolution priority:
 * 1. @ragnarok-index on-chain CID (freshest)
 * 2. IPFS gateway fetch (content-addressed)
 * 3. Hive account fallback (index_update ops as mini-index)
 * 4. Bundled snapshot (shipped with game)
 * 5. P2P peer exchange (WebRTC relay)
 *
 * See docs/DECENTRALIZED_INDEXER_DESIGN.md
 */

import { debug } from '../../game/config/debugConfig';
import { HIVE_NODES } from '../blockchain/hiveConfig';
import type {
	IndexManifest, IndexEntry, LeaderboardSnapshot,
	SupplySnapshot, IndexHealthStatus,
} from '../../../../shared/indexer-types';
import {
	IPFS_GATEWAYS, MIN_OPERATORS_FOR_CONSENSUS,
	STATE_CONFIRMATION_QUORUM, RAGNAROK_INDEX_ACCOUNT,
} from '../../../../shared/indexer-types';
import {
	putIndexEntries, putLeaderboard, putSupplyCounters,
	getSyncMeta, putSyncMeta,
} from './indexDB';

// ============================================================
// State
// ============================================================

let syncInProgress = false;
let syncTimer: ReturnType<typeof setInterval> | null = null;
let healthStatus: IndexHealthStatus = 'offline';

export function getIndexHealthStatus(): IndexHealthStatus {
	return healthStatus;
}

// ============================================================
// Hive RPC (lightweight, reuses node list)
// ============================================================

async function callHive<T>(method: string, params: unknown[]): Promise<T> {
	for (const node of HIVE_NODES) {
		try {
			const controller = new AbortController();
			const timeout = setTimeout(() => controller.abort(), 8000);
			const resp = await fetch(node, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ jsonrpc: '2.0', method, params, id: 1 }),
				signal: controller.signal,
			});
			clearTimeout(timeout);
			const data = await resp.json() as { result?: T };
			return data.result as T;
		} catch {
			continue;
		}
	}
	throw new Error('All Hive nodes failed');
}

// ============================================================
// Step 1: Resolve Latest CID from @ragnarok-index
// ============================================================

interface HiveHistoryEntry {
	op: [string, Record<string, unknown>];
}

async function resolveLatestCID(): Promise<string | null> {
	try {
		const history = await callHive<Array<[number, HiveHistoryEntry]>>(
			'condenser_api.get_account_history',
			[RAGNAROK_INDEX_ACCOUNT, -1, 50],
		);

		for (let i = history.length - 1; i >= 0; i--) {
			const [, entry] = history[i];
			if (entry.op[0] !== 'custom_json') continue;
			const opData = entry.op[1];
			if (opData.id !== 'ragnarok-cards') continue;
			try {
				const payload = JSON.parse(opData.json as string) as Record<string, unknown>;
				if (payload.action === 'index_update' && payload.cid) {
					return payload.cid as string;
				}
			} catch { continue; }
		}
	} catch (err) {
		debug.warn('[IndexSync] Failed to resolve CID from chain:', err);
	}
	return null;
}

// ============================================================
// Step 2: Fetch from IPFS
// ============================================================

async function fetchFromIPFS<T>(cid: string, filePath: string): Promise<T | null> {
	for (const gateway of IPFS_GATEWAYS) {
		try {
			const url = `${gateway}${cid}/${filePath}`;
			const controller = new AbortController();
			const timeout = setTimeout(() => controller.abort(), 15000);
			const resp = await fetch(url, { signal: controller.signal });
			clearTimeout(timeout);
			if (!resp.ok) continue;
			return await resp.json() as T;
		} catch {
			continue;
		}
	}
	return null;
}

async function fetchChunkFromIPFS(cid: string, chunkPath: string): Promise<IndexEntry[]> {
	for (const gateway of IPFS_GATEWAYS) {
		try {
			const url = `${gateway}${cid}/${chunkPath}`;
			const controller = new AbortController();
			const timeout = setTimeout(() => controller.abort(), 30000);
			const resp = await fetch(url, { signal: controller.signal });
			clearTimeout(timeout);
			if (!resp.ok) continue;

			const text = await resp.text();
			const entries: IndexEntry[] = [];
			for (const line of text.split('\n')) {
				if (!line.trim()) continue;
				try {
					entries.push(JSON.parse(line) as IndexEntry);
				} catch { /* skip malformed lines */ }
			}
			return entries;
		} catch {
			continue;
		}
	}
	return [];
}

// ============================================================
// Step 3: Validate Manifest Attestations
// ============================================================

function validateManifest(manifest: IndexManifest): IndexHealthStatus {
	const activeAttestations = manifest.attestations.filter(a => {
		const ageMs = Date.now() - a.timestamp;
		return ageMs < 24 * 60 * 60 * 1000; // 24h
	});

	const uniqueOperators = new Set(activeAttestations.map(a => a.operator));

	if (uniqueOperators.size >= MIN_OPERATORS_FOR_CONSENSUS) {
		// Check quorum on stateHash
		const hashCounts = new Map<string, number>();
		for (const a of activeAttestations) {
			hashCounts.set(a.stateHash, (hashCounts.get(a.stateHash) || 0) + 1);
		}

		const maxCount = Math.max(...hashCounts.values());
		const quorum = maxCount / uniqueOperators.size;

		if (quorum >= STATE_CONFIRMATION_QUORUM) {
			return 'healthy';
		}
		return 'degraded';
	}

	if (uniqueOperators.size > 0) {
		return 'degraded';
	}

	return 'snapshot-only';
}

// ============================================================
// Main Sync Flow
// ============================================================

export async function syncIndex(): Promise<void> {
	if (syncInProgress) return;
	syncInProgress = true;

	try {
		const localLastBlock = await getSyncMeta('lastBlock') as number | undefined;
		const localCid = await getSyncMeta('lastCid') as string | undefined;

		// Step 1: Resolve latest CID
		const latestCid = await resolveLatestCID();

		if (!latestCid) {
			debug.warn('[IndexSync] No CID found. Using local cache or bundled snapshot.');
			healthStatus = localLastBlock ? 'snapshot-only' : 'offline';
			return;
		}

		// Skip if already at latest
		if (latestCid === localCid) {
			debug.log('[IndexSync] Already at latest CID.');
			return;
		}

		// Step 2: Fetch manifest
		const manifest = await fetchFromIPFS<IndexManifest>(latestCid, 'manifest.json');
		if (!manifest) {
			debug.warn('[IndexSync] Failed to fetch manifest from IPFS.');
			healthStatus = 'degraded';
			return;
		}

		// Step 3: Validate attestations
		healthStatus = validateManifest(manifest);
		debug.log(`[IndexSync] Health: ${healthStatus}, Block: ${manifest.lastBlock}, Ops: ${manifest.totalOps}`);

		// Step 4: Fetch snapshots FIRST (instant usability)
		const [leaderboard, supply] = await Promise.all([
			fetchFromIPFS<LeaderboardSnapshot>(latestCid, manifest.snapshots.leaderboard),
			fetchFromIPFS<SupplySnapshot>(latestCid, manifest.snapshots.supply),
		]);

		if (leaderboard) {
			await putLeaderboard(leaderboard.entries);
			debug.log(`[IndexSync] Leaderboard loaded: ${leaderboard.entries.length} entries`);
		}

		if (supply) {
			await putSupplyCounters(supply.counters);
			debug.log(`[IndexSync] Supply counters loaded`);
		}

		// Step 5: Fetch new chunks (only those after local lastBlock)
		const chunksToFetch = manifest.chunks.filter(c =>
			!localLastBlock || c.blockRange[0] > localLastBlock
		);

		// Also check compacted archives for first-time sync
		const compactedToFetch = !localLastBlock && manifest.compacted
			? manifest.compacted
			: [];

		debug.log(`[IndexSync] Fetching ${compactedToFetch.length} compacted + ${chunksToFetch.length} chunks`);

		// Fetch compacted first, then granular chunks
		for (const chunk of [...compactedToFetch, ...chunksToFetch]) {
			const entries = await fetchChunkFromIPFS(latestCid, chunk.file);
			if (entries.length > 0) {
				await putIndexEntries(entries);
				debug.log(`[IndexSync] Loaded ${chunk.file}: ${entries.length} entries`);
			}
		}

		// Step 6: Update sync metadata
		await putSyncMeta('lastBlock', manifest.lastBlock);
		await putSyncMeta('lastCid', latestCid);
		await putSyncMeta('lastSyncAt', Date.now());
		await putSyncMeta('totalOps', manifest.totalOps);
		await putSyncMeta('healthStatus', healthStatus);

		debug.log(`[IndexSync] Sync complete. Block: ${manifest.lastBlock}, Total ops: ${manifest.totalOps}`);
	} catch (err) {
		debug.warn('[IndexSync] Sync failed:', err);
		healthStatus = 'degraded';
	} finally {
		syncInProgress = false;
	}
}

// ============================================================
// Auto Sync (poll every 60 seconds)
// ============================================================

export function startIndexSync(intervalMs = 60_000): void {
	if (syncTimer) return;

	// Initial sync
	syncIndex().catch(err => debug.warn('[IndexSync] Initial sync failed:', err));

	// Periodic sync
	syncTimer = setInterval(() => {
		syncIndex().catch(err => debug.warn('[IndexSync] Periodic sync failed:', err));
	}, intervalMs);

	debug.log(`[IndexSync] Started auto-sync every ${intervalMs / 1000}s`);
}

export function stopIndexSync(): void {
	if (syncTimer) {
		clearInterval(syncTimer);
		syncTimer = null;
		debug.log('[IndexSync] Stopped auto-sync');
	}
}

/**
 * NFTLox indexer-API implementation of `OwnershipAdapter`.
 *
 * Mock mode is the default. Set `VITE_NFTLOX_MOCK=false` to switch to
 * real fetches once the NFTLox endpoints are live (see comments per
 * method for the swap targets).
 */

import type { HiveCardAsset } from '@/data/schemas/HiveTypes';
import type { OwnershipAdapter, OwnershipStatus } from './OwnershipAdapter';

const NFTLOX_API_BASE = 'https://api-nftlox.hivecreators.co';
const COLLECTION_SYMBOL = 'RGNRK';

const isMockMode = (): boolean => import.meta.env.VITE_NFTLOX_MOCK !== 'false';

// ── Mock fixtures ─────────────────────────────────────────────────────────
// Remove when `VITE_NFTLOX_MOCK=false` becomes the default and the real
// endpoints are deployed.

const MOCK_STATE_HASH = 'sha256:mock_a1b2c3d4e5f6_constant';

const MOCK_OWNED_CARDS: ReadonlyArray<HiveCardAsset> = [
	{
		uid: 'mock_uid_001',
		cardId: 1,
		ownerId: '<filled-at-call>',
		edition: 'alpha',
		foil: 'standard',
		rarity: 'common',
		level: 1,
		xp: 0,
		name: 'Mock Common Minion',
		type: 'minion',
	},
	{
		uid: 'mock_uid_002',
		cardId: 2,
		ownerId: '<filled-at-call>',
		edition: 'alpha',
		foil: 'standard',
		rarity: 'rare',
		level: 3,
		xp: 250,
		name: 'Mock Rare Minion',
		type: 'minion',
	},
	{
		uid: 'mock_uid_003',
		cardId: 3,
		ownerId: '<filled-at-call>',
		edition: 'alpha',
		foil: 'gold',
		rarity: 'epic',
		level: 5,
		xp: 800,
		name: 'Mock Epic Foil Spell',
		type: 'spell',
	},
];

// ── Adapter ───────────────────────────────────────────────────────────────

export class NFTLoxApiAdapter implements OwnershipAdapter {
	constructor(private readonly baseUrl: string = NFTLOX_API_BASE) {}

	async getStateHash(username: string): Promise<string> {
		if (isMockMode()) return MOCK_STATE_HASH;
		const url = `${this.baseUrl}/api/users/${encodeURIComponent(username)}/state-hash?collection=${COLLECTION_SYMBOL}`;
		const res = await fetch(url);
		if (!res.ok) throw new Error(`NFTLox state-hash ${res.status}: ${await res.text()}`);
		const data = (await res.json()) as { state_hash: string };
		return data.state_hash;
	}

	async getOwnedCards(username: string, status?: OwnershipStatus): Promise<HiveCardAsset[]> {
		if (isMockMode()) {
			// Mock filter: only `active` returns cards; `listed`/`lent` → empty.
			if (status === 'listed' || status === 'lent') return [];
			return MOCK_OWNED_CARDS.map((c) => ({ ...c, ownerId: username }));
		}
		// Real path: paginate `/api/users/:u/nfts` until a page returns < limit.
		const limit = 200;
		const collected: HiveCardAsset[] = [];
		for (let offset = 0; ; offset += limit) {
			const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
			if (status) params.set('status', status);
			const url = `${this.baseUrl}/api/users/${encodeURIComponent(username)}/nfts?${params.toString()}`;
			const res = await fetch(url);
			if (!res.ok) throw new Error(`NFTLox /users/${username}/nfts ${res.status}: ${await res.text()}`);
			const page = (await res.json()) as { nfts: unknown[] };
			const mapped = page.nfts.map(mapNFTLoxToHiveCardAsset);
			collected.push(...mapped);
			if (page.nfts.length < limit) break;
		}
		return collected;
	}

	async getNFTById(uid: string): Promise<HiveCardAsset | null> {
		if (isMockMode()) {
			const hit = MOCK_OWNED_CARDS.find((c) => c.uid === uid);
			return hit ? { ...hit } : null;
		}
		const url = `${this.baseUrl}/api/nfts/${encodeURIComponent(uid)}`;
		const res = await fetch(url);
		if (res.status === 404) return null;
		if (!res.ok) throw new Error(`NFTLox /nfts/${uid} ${res.status}: ${await res.text()}`);
		const raw = (await res.json()) as unknown;
		return mapNFTLoxToHiveCardAsset(raw);
	}
}

// ── Boundary mapping (NFTLox NFT → HiveCardAsset) ────────────────────────

/**
 * Boundary translator. Lives next to the adapter on purpose: this is the
 * single place we trust the NFTLox shape. Anything beyond this point
 * speaks `HiveCardAsset`.
 *
 * Stubbed for the mock-mode milestone. Real implementation will be filled
 * in once the API response shape is finalised against a live endpoint —
 * see `docs/NFTLOX_INTEGRATION_SPEC.md` for the field map.
 */
function mapNFTLoxToHiveCardAsset(raw: unknown): HiveCardAsset {
	throw new Error(
		`mapNFTLoxToHiveCardAsset not implemented — received: ${typeof raw}. ` +
			'Wire this when VITE_NFTLOX_MOCK=false ships.',
	);
}

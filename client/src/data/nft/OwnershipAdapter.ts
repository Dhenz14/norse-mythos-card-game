/**
 * OwnershipAdapter — read-side contract for NFT ownership.
 *
 * The UI (collection, deck builder, marketplace) reads cards through this
 * interface, never directly from a fetch or IndexedDB. Concrete
 * implementations vary: today `NFTLoxApiAdapter` (against NFTLox indexer);
 * in the future a fully replay-engine-driven adapter that derives
 * ownership from Hive RPC ops without depending on an external indexer.
 *
 * See `docs/NFTLOX_INTEGRATION_SPEC.md` § "Read-side architecture".
 */

import type { HiveCardAsset } from '@/data/schemas/HiveTypes';

export type OwnershipStatus = 'active' | 'listed' | 'lent';

export interface OwnershipAdapter {
	/**
	 * Server-computed XOR-hash over the user's NFT set in the configured
	 * collection. Used for cache invalidation: if the local cached hash
	 * matches this value, no re-sync is needed.
	 */
	getStateHash(username: string): Promise<string>;

	/**
	 * NFTs owned by `username`, optionally filtered by ownership status.
	 * Default returns all statuses (active + listed + lent).
	 *
	 * Implementations paginate transparently — caller receives the full
	 * list as a single array.
	 */
	getOwnedCards(username: string, status?: OwnershipStatus): Promise<HiveCardAsset[]>;

	/** Single NFT lookup by uid. Returns `null` when not found. */
	getNFTById(uid: string): Promise<HiveCardAsset | null>;
}

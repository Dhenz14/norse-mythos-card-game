/**
 * genesisAdmin.ts - Admin tools for initializing the Ragnarok NFT system on Hive
 *
 * Usage (from browser console after Keychain login as @ragnarok):
 *   import { broadcastGenesis, broadcastSeal, broadcastMint } from '@/data/blockchain/genesisAdmin';
 *   await broadcastGenesis();   // Initialize supply caps (one-time, irreversible)
 *   await broadcastSeal();      // Permanently lock direct minting
 *
 * All ops are broadcast as custom_json id="ragnarok-cards" with { action: "genesis"|"mint"|"seal" }.
 * Only the @ragnarok account can execute these.
 */

import { hiveSync } from '../HiveSync';
import type { HiveBroadcastResult } from '../HiveSync';
import { RAGNAROK_ACCOUNT } from './hiveConfig';

const SUPPLY_CAPS: Record<string, number> = {
	common:    10_000,
	rare:       4_000,
	epic:       1_500,
	legendary:    500,
};

const TOTAL_SUPPLY = Object.values(SUPPLY_CAPS).reduce((a, b) => a + b, 0);

function requireAdmin(): HiveBroadcastResult | null {
	const username = hiveSync.getUsername();
	if (!username) {
		return { success: false, error: 'Not logged in. Call hiveSync.login() first.' };
	}
	if (username !== RAGNAROK_ACCOUNT) {
		return { success: false, error: `Must be logged in as @${RAGNAROK_ACCOUNT}, currently @${username}` };
	}
	return null;
}

export async function broadcastGenesis(): Promise<HiveBroadcastResult> {
	const err = requireAdmin();
	if (err) return err;

	return hiveSync.broadcastCustomJson('rp_genesis', {
		version: '1.0',
		total_supply: TOTAL_SUPPLY,
		card_distribution: SUPPLY_CAPS,
		reader_hash: '',
	});
}

export async function broadcastSeal(): Promise<HiveBroadcastResult> {
	const err = requireAdmin();
	if (err) return err;

	return hiveSync.broadcastCustomJson('rp_seal', {});
}

export async function broadcastMint(params: {
	to: string;
	cards: Array<{
		nft_id: string;
		card_id: number;
		rarity: string;
		name?: string;
		type?: string;
		race?: string;
		image?: string;
		foil?: string;
	}>;
}): Promise<HiveBroadcastResult> {
	const err = requireAdmin();
	if (err) return err;

	if (!params.to || !params.cards?.length) {
		return { success: false, error: 'to and cards[] are required' };
	}

	return hiveSync.broadcastCustomJson('rp_mint', {
		to: params.to,
		cards: params.cards,
	});
}

export { SUPPLY_CAPS, TOTAL_SUPPLY };

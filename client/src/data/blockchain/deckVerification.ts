/**
 * deckVerification.ts - NFT deck ownership verification
 *
 * Runs entirely in the player's browser using IndexedDB — no server call.
 * Verifies that every NFT card in a deck is owned by the specified account
 * according to the local chain replay state.
 *
 * Cards without an `nft_id` are skipped (dev/demo mode — always allowed).
 * A deck with zero NFT cards passes verification (full dev-mode game).
 *
 * Usage:
 *   const result = await verifyDeckOwnership('alice', deck);
 *   if (!result.valid) console.error(result.invalidCards);
 */

import { getCard } from './replayDB';

export interface CardRef {
	nft_id?: string;
	instanceId?: string;
	cardId?: number;
}

export interface DeckVerificationResult {
	valid: boolean;
	checkedCount: number;
	invalidCards: string[]; // nft_ids that failed ownership check
}

/**
 * Verify that every NFT card in the deck is owned by hiveAccount.
 * Non-NFT cards (no nft_id) are silently skipped.
 */
export async function verifyDeckOwnership(
	hiveAccount: string,
	deck: CardRef[],
): Promise<DeckVerificationResult> {
	const invalidCards: string[] = [];
	let checkedCount = 0;

	for (const card of deck) {
		if (!card.nft_id) continue; // dev/demo card — skip
		checkedCount++;

		const stored = await getCard(card.nft_id);
		if (!stored || stored.ownerId !== hiveAccount) {
			invalidCards.push(card.nft_id);
		}
	}

	return {
		valid: invalidCards.length === 0,
		checkedCount,
		invalidCards,
	};
}

/**
 * Quick boolean check — cheaper than full result when you just need pass/fail.
 */
export async function isDeckOwned(
	hiveAccount: string,
	deck: CardRef[],
): Promise<boolean> {
	const result = await verifyDeckOwnership(hiveAccount, deck);
	return result.valid;
}

/**
 * Compute a deterministic deck hash for the match_start anchor.
 * Sorted by nft_id so order doesn't matter.
 * Non-NFT cards are included as their cardId string.
 */
export function computeDeckHash(deck: CardRef[]): string {
	const ids = deck
		.map(c => c.nft_id ?? `card:${c.cardId ?? 'unknown'}`)
		.sort()
		.join(',');
	// Sync hash for deck commitment — use btoa for a compact representation
	// For async SHA-256, see hashUtils.sha256Hash
	return btoa(ids).replace(/[=+/]/g, c => ({ '=': '', '+': '-', '/': '_' }[c] ?? c));
}

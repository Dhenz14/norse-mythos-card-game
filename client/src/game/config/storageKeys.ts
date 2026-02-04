/**
 * storageKeys.ts
 *
 * Centralized localStorage keys used across the project.
 * Avoids magic strings and simplifies maintenance.
 * 
 * Added from Enrique's fork - Jan 31, 2026
 */

export const StorageKeys = {
	// Decks
	HEARTHSTONE_DECKS: 'hearthstone_decks',
	DECK_BUILDER: 'deck-builder-storage',
	HERO_DECKS: 'ragnarok-hero-decks',
	LAST_PLAYED_DECK_ID: 'lastPlayedDeckId',
	LAST_PLAYED_HERO: 'lastPlayedHero',

	// Battle History
	BATTLE_HISTORY: 'ragnarok-battle-history',
	CURRENT_BATTLE_ID: 'ragnarok-current-battle-id',

	// Hive Data Layer
	HIVE_USER_DATA: 'ragnarok-hive-user',
	HIVE_PLAYER_STATS: 'ragnarok-hive-stats',
	HIVE_TOKEN_BALANCE: 'ragnarok-hive-balance',
	HIVE_PENDING_TRANSACTIONS: 'ragnarok-hive-pending-tx',
	HIVE_CARD_COLLECTION: 'ragnarok-hive-cards',
	HIVE_MATCHES: 'ragnarok-hive-matches',

	// Settings
	GAME_SETTINGS: 'ragnarok-settings',
	AUDIO_SETTINGS: 'ragnarok-audio',
} as const;

export type StorageKey = (typeof StorageKeys)[keyof typeof StorageKeys];

/**
 * Creates a namespaced storage key.
 */
export function createStorageKey(namespace: string, key: string): string {
	return `ragnarok-${namespace}-${key}`;
}

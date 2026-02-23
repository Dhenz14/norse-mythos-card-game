/**
 * featureFlags.ts
 *
 * Feature flags to control game features.
 * Allows enabling/disabling features without code changes.
 * 
 * Added from Enrique's fork - Jan 31, 2026
 */

export type DataLayerMode = 'local' | 'test' | 'hive';

export const FeatureFlags = {
	/**
	 * Data layer mode:
	 * - 'local': Uses localStorage only (default, offline mode). No server calls.
	 * - 'test':  Local Express mock-blockchain endpoints (/api/mock-blockchain).
	 *            Simulates Hive L1 minting/ownership/match-recording without real chain.
	 *            Enable BLOCKCHAIN_PACKAGING_ENABLED=true to drain the tx queue to mock server.
	 * - 'hive':  Real Hive blockchain via Keychain (production).
	 */
	DATA_LAYER_MODE: 'local' as DataLayerMode,

	/**
	 * Enables battle history tracking.
	 * Stores last N battles locally.
	 */
	BATTLE_HISTORY_ENABLED: true,

	/**
	 * Maximum number of battles to keep in history.
	 */
	BATTLE_HISTORY_MAX_SIZE: 5,

	/**
	 * Debug mode for data layer.
	 * Shows detailed logs for storage operations.
	 */
	DATA_LAYER_DEBUG: false,

	/**
	 * Enables blockchain data packaging.
	 * When true, match results and XP updates are queued for chain submission.
	 */
	BLOCKCHAIN_PACKAGING_ENABLED: false as boolean,
} as const;

export type FeatureFlagsType = typeof FeatureFlags;

/**
 * Checks if Hive blockchain mode is active.
 */
export function isHiveMode(): boolean {
	return FeatureFlags.DATA_LAYER_MODE === 'hive';
}

/**
 * Checks if test mode is active (mock blockchain endpoints).
 */
export function isTestMode(): boolean {
	return FeatureFlags.DATA_LAYER_MODE === 'test';
}

/**
 * Checks if local mode is active (localStorage only).
 */
export function isLocalMode(): boolean {
	return FeatureFlags.DATA_LAYER_MODE === 'local';
}

/**
 * Checks if battle history is enabled.
 */
export function isBattleHistoryEnabled(): boolean {
	return FeatureFlags.BATTLE_HISTORY_ENABLED;
}

/**
 * Gets current data layer mode.
 */
export function getDataLayerMode(): DataLayerMode {
	return FeatureFlags.DATA_LAYER_MODE;
}

/**
 * Checks if blockchain packaging is enabled.
 */
export function isBlockchainPackagingEnabled(): boolean {
	return FeatureFlags.BLOCKCHAIN_PACKAGING_ENABLED;
}

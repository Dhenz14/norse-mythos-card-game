/**
 * Hive Data Layer - Exports
 * 
 * Added from Enrique's fork - Jan 31, 2026
 */

// Types
export type {
	HiveUser,
	HivePlayerStats,
	HiveMatchResult,
	HiveCardAsset,
	HiveTokenBalance,
	HiveTransaction,
	HiveTransactionType,
	HiveTransactionStatus,
	HiveGameState,
} from './types';

export {
	ELO_CONFIG,
	STORAGE_LIMITS,
	DEFAULT_HIVE_USER,
	DEFAULT_PLAYER_STATS,
	DEFAULT_TOKEN_BALANCE,
} from './types';

// Adapters
export {
	LocalStorageAdapter,
	getAdapter,
	initializeAdapter,
	disposeAdapter,
	resetAdapter,
	getAdapterName,
	isAdapterSyncing,
	getAdapterSyncMode,
	generateBattleSessionId,
	isValidBattleSessionId,
} from './adapters';

export type {
	IHiveDataAdapter,
	AdapterResult,
	BattleSessionId,
} from './adapters';

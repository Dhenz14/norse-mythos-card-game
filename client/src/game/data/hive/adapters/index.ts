/**
 * Hive Data Adapters - Exports
 * 
 * Added from Enrique's fork - Jan 31, 2026
 */

export { LocalStorageAdapter } from './LocalStorageAdapter';
export { getAdapter, initializeAdapter, disposeAdapter, resetAdapter, getAdapterName, isAdapterSyncing, getAdapterSyncMode } from './AdapterFactory';
export type { IHiveDataAdapter, AdapterResult, BattleSessionId } from './IHiveDataAdapter';
export { BaseHiveDataAdapter, generateBattleSessionId, isValidBattleSessionId } from './IHiveDataAdapter';

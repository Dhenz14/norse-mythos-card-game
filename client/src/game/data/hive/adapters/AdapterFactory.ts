/**
 * AdapterFactory.ts
 *
 * Factory for creating the appropriate Hive data adapter
 * based on the current DATA_LAYER_MODE feature flag.
 * 
 * Added from Enrique's fork - Jan 31, 2026
 */

import { getDataLayerMode, type DataLayerMode } from '@/game/config/featureFlags';
import type { IHiveDataAdapter } from './IHiveDataAdapter';
import { LocalStorageAdapter } from './LocalStorageAdapter';
import { debug } from '@/game/config/debugConfig';

let currentAdapter: IHiveDataAdapter | null = null;
let currentMode: DataLayerMode | null = null;

/**
 * Creates and returns the appropriate adapter for the current mode.
 * Reuses the same adapter instance if mode hasn't changed.
 */
export function getAdapter(): IHiveDataAdapter {
        const mode = getDataLayerMode();

        // Return existing adapter if mode hasn't changed
        if (currentAdapter && currentMode === mode) {
                return currentAdapter;
        }

        // Create new adapter based on mode
        currentMode = mode;

        switch (mode) {
                case 'local':
                        currentAdapter = new LocalStorageAdapter();
                        break;
                case 'test':
                        debug.warn(`[AdapterFactory] Test mode selected - sync features not yet implemented. Using LocalStorageAdapter.`);
                        currentAdapter = new LocalStorageAdapter();
                        break;
                case 'hive':
                        debug.warn(`[AdapterFactory] Hive mode selected - blockchain sync not yet implemented. Using LocalStorageAdapter.`);
                        currentAdapter = new LocalStorageAdapter();
                        break;
                default:
                        debug.warn(`[AdapterFactory] Unknown mode: ${mode}, falling back to local`);
                        currentAdapter = new LocalStorageAdapter();
        }

        debug.log(`[AdapterFactory] Created ${currentAdapter!.name} for mode: ${mode}`);
        return currentAdapter!;
}

/**
 * Initialize the adapter. Should be called once on app start.
 */
export async function initializeAdapter(): Promise<void> {
        const adapter = getAdapter();
        const result = await adapter.initialize();

        if (!result.success) {
                debug.error('[AdapterFactory] Failed to initialize adapter:', result.error);
        }
}

/**
 * Dispose of the current adapter. Call on app shutdown.
 */
export async function disposeAdapter(): Promise<void> {
        if (currentAdapter) {
                await currentAdapter.dispose();
                currentAdapter = null;
                currentMode = null;
        }
}

/**
 * Force reset the adapter (useful for testing).
 */
export function resetAdapter(): void {
        currentAdapter = null;
        currentMode = null;
}

/**
 * Get current adapter name (for debugging).
 */
export function getAdapterName(): string {
        return currentAdapter?.name ?? 'none';
}

/**
 * Check if adapter syncs to external source (blockchain/JSON).
 */
export function isAdapterSyncing(): boolean {
        return currentAdapter?.syncMode !== 'none';
}

/**
 * Get current adapter sync mode.
 */
export function getAdapterSyncMode(): 'none' | 'json' | 'blockchain' {
        return currentAdapter?.syncMode ?? 'none';
}

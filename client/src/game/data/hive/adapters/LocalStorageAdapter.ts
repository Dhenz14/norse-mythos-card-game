/**
 * LocalStorageAdapter.ts
 *
 * Default adapter that uses only localStorage.
 * This is the base layer for all other adapters.
 * 
 * Added from Enrique's fork - Jan 31, 2026
 */

import { StorageKeys } from '@/game/config/storageKeys';
import { FeatureFlags } from '@/game/config/featureFlags';
import { debug as debugUtil } from '@/game/config/debugConfig';
import {
        BaseHiveDataAdapter,
        type AdapterResult,
} from './IHiveDataAdapter';
import type {
        HiveUser,
        HivePlayerStats,
        HiveMatchResult,
        HiveCardAsset,
        HiveTokenBalance,
        HiveTransaction,
} from '../types';
import {
        DEFAULT_PLAYER_STATS,
        DEFAULT_TOKEN_BALANCE,
        STORAGE_LIMITS,
} from '../types';

export class LocalStorageAdapter extends BaseHiveDataAdapter {
        readonly name = 'LocalStorageAdapter';
        readonly usesLocalStorage = true;
        readonly syncMode = 'none' as const;

        private debugLog(message: string, ...args: unknown[]): void {
                if (FeatureFlags.DATA_LAYER_DEBUG) {
                        debugUtil.log(`[LocalStorageAdapter] ${message}`, ...args);
                }
        }

        async initialize(): Promise<AdapterResult<void>> {
                this.debugLog('Initializing...');
                return this.createResult(undefined);
        }

        async dispose(): Promise<void> {
                this.debugLog('Disposing...');
        }

        // User operations
        async getUser(): Promise<AdapterResult<HiveUser | null>> {
                try {
                        const data = localStorage.getItem(StorageKeys.HIVE_USER_DATA);
                        return this.createResult(data ? JSON.parse(data) : null);
                } catch (e) {
                        return this.createError('Failed to get user');
                }
        }

        async saveUser(user: HiveUser): Promise<AdapterResult<void>> {
                try {
                        localStorage.setItem(StorageKeys.HIVE_USER_DATA, JSON.stringify(user));
                        this.debugLog('User saved:', user.username);
                        return this.createResult(undefined);
                } catch (e) {
                        return this.createError('Failed to save user');
                }
        }

        async clearUser(): Promise<AdapterResult<void>> {
                localStorage.removeItem(StorageKeys.HIVE_USER_DATA);
                return this.createResult(undefined);
        }

        // Stats operations
        async getStats(): Promise<AdapterResult<HivePlayerStats>> {
                try {
                        const data = localStorage.getItem(StorageKeys.HIVE_PLAYER_STATS);
                        return this.createResult(data ? JSON.parse(data) : { ...DEFAULT_PLAYER_STATS });
                } catch (e) {
                        return this.createResult({ ...DEFAULT_PLAYER_STATS });
                }
        }

        async saveStats(stats: HivePlayerStats): Promise<AdapterResult<void>> {
                try {
                        localStorage.setItem(StorageKeys.HIVE_PLAYER_STATS, JSON.stringify(stats));
                        this.debugLog('Stats saved:', stats);
                        return this.createResult(undefined);
                } catch (e) {
                        return this.createError('Failed to save stats');
                }
        }

        // Match operations
        async getMatches(limit?: number): Promise<AdapterResult<HiveMatchResult[]>> {
                try {
                        const data = localStorage.getItem(StorageKeys.HIVE_MATCHES);
                        const matches: HiveMatchResult[] = data ? JSON.parse(data) : [];
                        const result = limit ? matches.slice(0, limit) : matches;
                        return this.createResult(result);
                } catch (e) {
                        return this.createResult([]);
                }
        }

        async saveMatch(match: HiveMatchResult): Promise<AdapterResult<void>> {
                try {
                        const existing = await this.getMatches();
                        const matches = existing.data || [];
                        matches.unshift(match);
                        
                        // Limit stored matches
                        const limited = matches.slice(0, STORAGE_LIMITS.MAX_MATCHES_STORED);
                        localStorage.setItem(StorageKeys.HIVE_MATCHES, JSON.stringify(limited));
                        this.debugLog('Match saved:', match.matchId);
                        return this.createResult(undefined);
                } catch (e) {
                        return this.createError('Failed to save match');
                }
        }

        async clearMatches(): Promise<AdapterResult<void>> {
                localStorage.removeItem(StorageKeys.HIVE_MATCHES);
                return this.createResult(undefined);
        }

        // Card operations
        async getCards(): Promise<AdapterResult<HiveCardAsset[]>> {
                try {
                        const data = localStorage.getItem(StorageKeys.HIVE_CARD_COLLECTION);
                        return this.createResult(data ? JSON.parse(data) : []);
                } catch (e) {
                        return this.createResult([]);
                }
        }

        async saveCard(card: HiveCardAsset): Promise<AdapterResult<void>> {
                try {
                        const existing = await this.getCards();
                        const cards = existing.data || [];
                        cards.push(card);
                        localStorage.setItem(StorageKeys.HIVE_CARD_COLLECTION, JSON.stringify(cards));
                        return this.createResult(undefined);
                } catch (e) {
                        return this.createError('Failed to save card');
                }
        }

        async removeCard(uid: string): Promise<AdapterResult<void>> {
                try {
                        const existing = await this.getCards();
                        const cards = (existing.data || []).filter(c => c.uid !== uid);
                        localStorage.setItem(StorageKeys.HIVE_CARD_COLLECTION, JSON.stringify(cards));
                        return this.createResult(undefined);
                } catch (e) {
                        return this.createError('Failed to remove card');
                }
        }

        // Token operations
        async getTokenBalance(): Promise<AdapterResult<HiveTokenBalance>> {
                try {
                        const data = localStorage.getItem(StorageKeys.HIVE_TOKEN_BALANCE);
                        return this.createResult(data ? JSON.parse(data) : { ...DEFAULT_TOKEN_BALANCE });
                } catch (e) {
                        return this.createResult({ ...DEFAULT_TOKEN_BALANCE });
                }
        }

        async saveTokenBalance(balance: HiveTokenBalance): Promise<AdapterResult<void>> {
                try {
                        localStorage.setItem(StorageKeys.HIVE_TOKEN_BALANCE, JSON.stringify(balance));
                        return this.createResult(undefined);
                } catch (e) {
                        return this.createError('Failed to save token balance');
                }
        }

        // Transaction operations
        async getPendingTransactions(): Promise<AdapterResult<HiveTransaction[]>> {
                try {
                        const data = localStorage.getItem(StorageKeys.HIVE_PENDING_TRANSACTIONS);
                        return this.createResult(data ? JSON.parse(data) : []);
                } catch (e) {
                        return this.createResult([]);
                }
        }

        async saveTransaction(tx: HiveTransaction): Promise<AdapterResult<void>> {
                try {
                        const existing = await this.getPendingTransactions();
                        const transactions = existing.data || [];
                        transactions.push(tx);
                        
                        // Limit pending transactions
                        const limited = transactions.slice(-STORAGE_LIMITS.MAX_PENDING_TRANSACTIONS);
                        localStorage.setItem(StorageKeys.HIVE_PENDING_TRANSACTIONS, JSON.stringify(limited));
                        return this.createResult(undefined);
                } catch (e) {
                        return this.createError('Failed to save transaction');
                }
        }

        async updateTransaction(id: string, updates: Partial<HiveTransaction>): Promise<AdapterResult<void>> {
                try {
                        const existing = await this.getPendingTransactions();
                        const transactions = (existing.data || []).map(tx =>
                                tx.id === id ? { ...tx, ...updates } : tx
                        );
                        localStorage.setItem(StorageKeys.HIVE_PENDING_TRANSACTIONS, JSON.stringify(transactions));
                        return this.createResult(undefined);
                } catch (e) {
                        return this.createError('Failed to update transaction');
                }
        }

        // Bulk operations
        async exportAll(): Promise<AdapterResult<Record<string, unknown>>> {
                return this.createResult({
                        user: (await this.getUser()).data,
                        stats: (await this.getStats()).data,
                        matches: (await this.getMatches()).data,
                        cards: (await this.getCards()).data,
                        tokenBalance: (await this.getTokenBalance()).data,
                        pendingTransactions: (await this.getPendingTransactions()).data,
                });
        }

        async importAll(data: Record<string, unknown>): Promise<AdapterResult<void>> {
                try {
                        if (data.user) await this.saveUser(data.user as HiveUser);
                        if (data.stats) await this.saveStats(data.stats as HivePlayerStats);
                        if (data.tokenBalance) await this.saveTokenBalance(data.tokenBalance as HiveTokenBalance);
                        
                        // Clear and re-import arrays
                        if (data.matches) {
                                await this.clearMatches();
                                for (const match of data.matches as HiveMatchResult[]) {
                                        await this.saveMatch(match);
                                }
                        }
                        
                        return this.createResult(undefined);
                } catch (e) {
                        return this.createError('Failed to import data');
                }
        }

        // Sync operations - no-op for LocalStorageAdapter
        async syncToExternal(): Promise<AdapterResult<void>> {
                this.debugLog('syncToExternal called - no external sync in local mode');
                return this.createResult(undefined);
        }

        async syncFromExternal(): Promise<AdapterResult<void>> {
                this.debugLog('syncFromExternal called - no external sync in local mode');
                return this.createResult(undefined);
        }
}

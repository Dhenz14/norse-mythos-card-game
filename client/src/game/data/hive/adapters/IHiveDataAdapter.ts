/**
 * IHiveDataAdapter.ts
 *
 * Interface for Hive data layer adapters.
 *
 * Architecture:
 * - localStorage is ALWAYS the base layer (fallback/cache)
 * - 'local' mode: localStorage only
 * - 'test' mode: localStorage + JSON export for testing
 * - 'hive' mode: localStorage + blockchain sync
 * 
 * Added from Enrique's fork - Jan 31, 2026
 */

import { debug as debugUtil } from '@/game/config/debugConfig';
import type {
        HiveUser,
        HivePlayerStats,
        HiveMatchResult,
        HiveCardAsset,
        HiveTokenBalance,
        HiveTransaction,
} from '../types';

/**
 * Result type for async operations.
 */
export interface AdapterResult<T> {
        success: boolean;
        data?: T;
        error?: string;
}

/**
 * Battle session identifier for consistent data tracking.
 */
export interface BattleSessionId {
        sessionId: string;
        startedAt: number;
        mode: 'pvp' | 'pve' | 'practice';
}

/**
 * Interface that all data adapters must implement.
 * All adapters MUST use localStorage as base storage.
 */
export interface IHiveDataAdapter {
        readonly name: string;
        readonly usesLocalStorage: boolean;
        readonly syncMode: 'none' | 'json' | 'blockchain';

        // Initialization
        initialize(): Promise<AdapterResult<void>>;
        dispose(): Promise<void>;

        // User operations
        getUser(): Promise<AdapterResult<HiveUser | null>>;
        saveUser(user: HiveUser): Promise<AdapterResult<void>>;
        clearUser(): Promise<AdapterResult<void>>;

        // Stats operations
        getStats(): Promise<AdapterResult<HivePlayerStats>>;
        saveStats(stats: HivePlayerStats): Promise<AdapterResult<void>>;

        // Match operations
        getMatches(limit?: number): Promise<AdapterResult<HiveMatchResult[]>>;
        saveMatch(match: HiveMatchResult): Promise<AdapterResult<void>>;
        clearMatches(): Promise<AdapterResult<void>>;

        // Card operations
        getCards(): Promise<AdapterResult<HiveCardAsset[]>>;
        saveCard(card: HiveCardAsset): Promise<AdapterResult<void>>;
        removeCard(uid: string): Promise<AdapterResult<void>>;

        // Token operations
        getTokenBalance(): Promise<AdapterResult<HiveTokenBalance>>;
        saveTokenBalance(balance: HiveTokenBalance): Promise<AdapterResult<void>>;

        // Transaction operations
        getPendingTransactions(): Promise<AdapterResult<HiveTransaction[]>>;
        saveTransaction(tx: HiveTransaction): Promise<AdapterResult<void>>;
        updateTransaction(id: string, updates: Partial<HiveTransaction>): Promise<AdapterResult<void>>;

        // Battle session management
        createBattleSession(mode: 'pvp' | 'pve' | 'practice'): BattleSessionId;
        getCurrentBattleSession(): BattleSessionId | null;
        endBattleSession(): void;

        // Bulk operations
        exportAll(): Promise<AdapterResult<Record<string, unknown>>>;
        importAll(data: Record<string, unknown>): Promise<AdapterResult<void>>;

        // Sync operations (for test/hive modes)
        syncToExternal?(): Promise<AdapterResult<void>>;
        syncFromExternal?(): Promise<AdapterResult<void>>;
}

/**
 * Generate a unique battle session ID.
 * Format: battle_[timestamp]_[random]_[mode]
 */
export function generateBattleSessionId(mode: 'pvp' | 'pve' | 'practice'): BattleSessionId {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        return {
                sessionId: `battle_${timestamp}_${random}_${mode}`,
                startedAt: timestamp,
                mode,
        };
}

/**
 * Validate a battle session ID format.
 */
export function isValidBattleSessionId(id: string): boolean {
        return /^battle_\d+_[a-z0-9]+_(pvp|pve|practice)$/.test(id);
}

/**
 * Base class with common localStorage utilities for all adapters.
 */
export abstract class BaseHiveDataAdapter implements IHiveDataAdapter {
        abstract readonly name: string;
        abstract readonly usesLocalStorage: boolean;
        abstract readonly syncMode: 'none' | 'json' | 'blockchain';

        protected currentBattleSession: BattleSessionId | null = null;

        protected log(message: string, ...args: unknown[]): void {
                if (process.env.NODE_ENV === 'development') {
                        debugUtil.log(`[${this.name}] ${message}`, ...args);
                }
        }

        protected error(message: string, ...args: unknown[]): void {
                debugUtil.error(`[${this.name}] ${message}`, ...args);
        }

        protected createResult<T>(data: T): AdapterResult<T> {
                return { success: true, data };
        }

        protected createError<T>(error: string): AdapterResult<T> {
                return { success: false, error };
        }

        // Battle session management
        createBattleSession(mode: 'pvp' | 'pve' | 'practice'): BattleSessionId {
                this.currentBattleSession = generateBattleSessionId(mode);
                this.log('Battle session created:', this.currentBattleSession.sessionId);
                return this.currentBattleSession;
        }

        getCurrentBattleSession(): BattleSessionId | null {
                return this.currentBattleSession;
        }

        endBattleSession(): void {
                if (this.currentBattleSession) {
                        this.log('Battle session ended:', this.currentBattleSession.sessionId);
                        this.currentBattleSession = null;
                }
        }

        abstract initialize(): Promise<AdapterResult<void>>;
        abstract dispose(): Promise<void>;
        abstract getUser(): Promise<AdapterResult<HiveUser | null>>;
        abstract saveUser(user: HiveUser): Promise<AdapterResult<void>>;
        abstract clearUser(): Promise<AdapterResult<void>>;
        abstract getStats(): Promise<AdapterResult<HivePlayerStats>>;
        abstract saveStats(stats: HivePlayerStats): Promise<AdapterResult<void>>;
        abstract getMatches(limit?: number): Promise<AdapterResult<HiveMatchResult[]>>;
        abstract saveMatch(match: HiveMatchResult): Promise<AdapterResult<void>>;
        abstract clearMatches(): Promise<AdapterResult<void>>;
        abstract getCards(): Promise<AdapterResult<HiveCardAsset[]>>;
        abstract saveCard(card: HiveCardAsset): Promise<AdapterResult<void>>;
        abstract removeCard(uid: string): Promise<AdapterResult<void>>;
        abstract getTokenBalance(): Promise<AdapterResult<HiveTokenBalance>>;
        abstract saveTokenBalance(balance: HiveTokenBalance): Promise<AdapterResult<void>>;
        abstract getPendingTransactions(): Promise<AdapterResult<HiveTransaction[]>>;
        abstract saveTransaction(tx: HiveTransaction): Promise<AdapterResult<void>>;
        abstract updateTransaction(id: string, updates: Partial<HiveTransaction>): Promise<AdapterResult<void>>;
        abstract exportAll(): Promise<AdapterResult<Record<string, unknown>>>;
        abstract importAll(data: Record<string, unknown>): Promise<AdapterResult<void>>;
}

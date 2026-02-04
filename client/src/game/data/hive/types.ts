/**
 * hive/types.ts
 *
 * Types for the Hive blockchain data layer.
 * BLUEPRINT - Ready for implementation when Hive Keychain is integrated.
 * 
 * Added from Enrique's fork - Jan 31, 2026
 */

// ============================================
// User & Authentication
// ============================================

export interface HiveUser {
	username: string;
	publicKey: string;
	isAuthenticated: boolean;
	loginTimestamp: number | null;
}

// ============================================
// Player Stats (On-chain)
// ============================================

export interface HivePlayerStats {
	elo: number;
	wins: number;
	losses: number;
	draws: number;
	totalMatches: number;
	winStreak: number;
	bestWinStreak: number;
	lastMatchTimestamp: number | null;
}

// ============================================
// Match Records (On-chain)
// ============================================

export interface HiveMatchResult {
	matchId: string;
	timestamp: number;
	opponentUsername: string;
	result: 'win' | 'loss' | 'draw';
	eloChange: number;
	newElo: number;
	duration: number;
	turns: number;
}

// ============================================
// Card Ownership (NFTs)
// ============================================

export interface HiveCardAsset {
	uid: string;
	cardId: number;
	mintTimestamp: number;
	edition: string;
	foil: boolean;
	tradeable: boolean;
}

// ============================================
// Token Balance
// ============================================

export interface HiveTokenBalance {
	amount: number;
	symbol: string;
	lastUpdated: number;
}

// ============================================
// Transactions
// ============================================

export type HiveTransactionType =
	| 'match_result'
	| 'card_transfer'
	| 'card_mint'
	| 'token_transfer'
	| 'deck_save';

export type HiveTransactionStatus = 'pending' | 'confirmed' | 'failed';

export interface HiveTransaction {
	id: string;
	type: HiveTransactionType;
	status: HiveTransactionStatus;
	createdAt: number;
	confirmedAt: number | null;
	data: Record<string, unknown>;
	error: string | null;
}

// ============================================
// Combined State
// ============================================

export interface HiveGameState {
	user: HiveUser | null;
	stats: HivePlayerStats;
	recentMatches: HiveMatchResult[];
	cardCollection: HiveCardAsset[];
	tokenBalance: HiveTokenBalance;
	pendingTransactions: HiveTransaction[];
}

// ============================================
// ELO Constants
// ============================================

export const ELO_CONFIG = {
	INITIAL_ELO: 1200,
	K_FACTOR: 32,
	MIN_ELO: 100,
	MAX_ELO: 3000,
} as const;

// ============================================
// Storage Limits
// ============================================

export const STORAGE_LIMITS = {
	MAX_MATCHES_STORED: 100,
	MAX_PENDING_TRANSACTIONS: 50,
	MAX_BATTLE_HISTORY: 5,
	TX_CLEANUP_AGE_MS: 24 * 60 * 60 * 1000, // 24 hours
} as const;

// ============================================
// Default Values
// ============================================

export const DEFAULT_HIVE_USER: HiveUser | null = null;

export const DEFAULT_PLAYER_STATS: HivePlayerStats = {
	elo: ELO_CONFIG.INITIAL_ELO,
	wins: 0,
	losses: 0,
	draws: 0,
	totalMatches: 0,
	winStreak: 0,
	bestWinStreak: 0,
	lastMatchTimestamp: null,
};

export const DEFAULT_TOKEN_BALANCE: HiveTokenBalance = {
	amount: 0,
	symbol: 'RAGNAROK',
	lastUpdated: 0,
};

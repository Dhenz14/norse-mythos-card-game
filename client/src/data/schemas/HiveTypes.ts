/**
 * Hive Data Types - Core 5 On-Chain Items
 * 
 * Simplified schema for P2E Hive integration.
 * Based on Splinterlands pattern with 'rp_' prefix (Ragnarok Poker).
 * 
 * On-Chain Data:
 * 1. User Records
 * 2. Player Stats
 * 3. Match Results
 * 4. Card Ownership
 * 5. Token Balances
 * 
 * Status: BLUEPRINT ONLY - Ready for implementation when Hive integration begins.
 */

export type RagnarokTransactionType =
  | 'rp_team_submit'
  | 'rp_match_result'
  | 'rp_card_transfer'
  | 'rp_pack_open'
  | 'rp_reward_claim';

export interface HiveUserRecord {
  hiveUsername: string;
  displayName: string;
  avatarUrl?: string;
  createdAt: number;
  lastLogin: number;
  accountTier: 'free' | 'spellbook' | 'champion';
}

export interface HivePlayerStats {
  odinsEloRating: number;
  totalGamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  winStreak: number;
  longestWinStreak: number;
  totalDamageDealt: number;
  totalHeroesDefeated: number;
  totalPokerHandsWon: number;
  favoriteHeroId?: string;
  favoriteFaction: 'norse' | 'greek' | 'egyptian' | 'japanese' | null;
  seasonRank: number;
  seasonPoints: number;
  lastMatchTimestamp: number;
}

export interface HiveMatchResult {
  matchId: string;
  timestamp: number;
  blockNum?: number;
  trxId?: string;
  player1: {
    hiveUsername: string;
    heroIds: string[];
    kingId: string;
    finalHp: number;
    damageDealt: number;
    pokerHandsWon: number;
  };
  player2: {
    hiveUsername: string;
    heroIds: string[];
    kingId: string;
    finalHp: number;
    damageDealt: number;
    pokerHandsWon: number;
  };
  winnerId: string;
  matchType: 'ranked' | 'casual' | 'tournament';
  duration: number;
  totalRounds: number;
  seed: string;
}

export interface HiveCardAsset {
  uid: string;
  cardId: number;
  ownerId: string;
  edition: 'alpha' | 'beta' | 'promo';
  foil: 'standard' | 'gold';
  level: number;
  xp: number;
  lastTransferBlock?: number;
}

export interface HiveTokenBalance {
  hiveUsername: string;
  RUNE: number;
  VALKYRIE: number;
  SEASON_POINTS: number;
  lastClaimTimestamp: number;
}

export interface HiveTransaction {
  trxId: string;
  type: RagnarokTransactionType;
  payload: Record<string, unknown>;
  timestamp: number;
  status: 'pending' | 'broadcasted' | 'confirmed' | 'failed';
  blockNum?: number;
  errorMessage?: string;
}

export interface HiveGameState {
  user: HiveUserRecord | null;
  stats: HivePlayerStats | null;
  cardCollection: HiveCardAsset[];
  tokenBalance: HiveTokenBalance | null;
  recentMatches: HiveMatchResult[];
  pendingTransactions: HiveTransaction[];
}

export const DEFAULT_PLAYER_STATS: HivePlayerStats = {
  odinsEloRating: 1000,
  totalGamesPlayed: 0,
  wins: 0,
  losses: 0,
  draws: 0,
  winStreak: 0,
  longestWinStreak: 0,
  totalDamageDealt: 0,
  totalHeroesDefeated: 0,
  totalPokerHandsWon: 0,
  favoriteHeroId: undefined,
  favoriteFaction: null,
  seasonRank: 0,
  seasonPoints: 0,
  lastMatchTimestamp: 0,
};

export const DEFAULT_TOKEN_BALANCE: HiveTokenBalance = {
  hiveUsername: '',
  RUNE: 0,
  VALKYRIE: 0,
  SEASON_POINTS: 0,
  lastClaimTimestamp: 0,
};

export const RAGNAROK_CUSTOM_JSON_PREFIX = 'rp_';

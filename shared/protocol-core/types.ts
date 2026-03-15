/**
 * Ragnarok Protocol Core — Type Definitions
 *
 * These types define the pure protocol layer. No IndexedDB, no HiveEvents,
 * no browser/Node dependencies. Both client and server implement the
 * StateAdapter interface to plug their storage into the shared core.
 *
 * Spec: docs/RAGNAROK_PROTOCOL_V1.md
 * Tests: client/src/data/blockchain/protocolConformance.test.ts
 */

// ============================================================
// Protocol Constants
// ============================================================

export const RAGNAROK_ADMIN_ACCOUNT = 'ragnarok';
export const TRANSFER_COOLDOWN_BLOCKS = 10;
export const PACK_REVEAL_DEADLINE_BLOCKS = 200;
export const PACK_ENTROPY_DELAY_BLOCKS = 3;
export const MAX_CARD_LEVEL = 3;
export const ELO_K_FACTOR = 32;
export const ELO_FLOOR = 100;
export const RUNE_WIN_RANKED = 10;
export const RUNE_LOSS_RANKED = 3;
export const HIVE_USERNAME_RE = /^[a-z][a-z0-9.-]{2,15}$/;

// ============================================================
// Canonical Op Actions (14 total)
// ============================================================

export type CanonicalAction =
	| 'genesis'
	| 'seal'
	| 'mint_batch'
	| 'pack_commit'
	| 'pack_reveal'
	| 'reward_claim'
	| 'card_transfer'
	| 'burn'
	| 'level_up'
	| 'queue_join'
	| 'queue_leave'
	| 'match_anchor'
	| 'match_result'
	| 'slash_evidence';

// Legacy op that is NOT a canonical alias (valid only pre-seal)
export type LegacyAction = 'legacy_pack_open';

export type ProtocolAction = CanonicalAction | LegacyAction;

// ============================================================
// Authority Requirements
// ============================================================

export const ACTIVE_AUTH_OPS: ReadonlySet<CanonicalAction> = new Set([
	'card_transfer', 'burn', 'seal', 'mint_batch',
]);

export const POSTING_AUTH_OPS: ReadonlySet<CanonicalAction> = new Set([
	'queue_join', 'queue_leave', 'match_anchor', 'match_result',
	'pack_commit', 'pack_reveal', 'reward_claim', 'level_up',
]);

// ============================================================
// Raw Hive Op (input from chain)
// ============================================================

export interface RawHiveOp {
	customJsonId: string;        // e.g. "ragnarok-cards" or "rp_mint"
	json: string;                // raw JSON payload string
	broadcaster: string;         // account that signed the op
	trxId: string;               // transaction id
	blockNum: number;            // block number
	timestamp: number;           // unix ms
	requiredPostingAuths: string[];
	requiredAuths: string[];     // active auth signers
}

// ============================================================
// Normalized Protocol Op (after normalization)
// ============================================================

export interface ProtocolOp {
	action: ProtocolAction;
	payload: Record<string, unknown>;
	broadcaster: string;
	trxId: string;
	blockNum: number;
	timestamp: number;
	usedActiveAuth: boolean;
}

// ============================================================
// Replay Context (per-op environment, not stored state)
// ============================================================

export interface ReplayContext {
	lastIrreversibleBlock: number;
	getBlockId: (blockNum: number) => Promise<string | null>;
}

// ============================================================
// Op Result
// ============================================================

export type OpResult =
	| { status: 'applied' }
	| { status: 'rejected'; reason: string }
	| { status: 'ignored' };  // unknown op, already applied (idempotent), etc.

// ============================================================
// Protocol State — abstract interface
//
// Both client (IndexedDB) and server (in-memory Maps) implement this.
// The protocol core calls these methods; it never touches storage directly.
// ============================================================

export interface CardAsset {
	uid: string;
	cardId: number;
	owner: string;
	rarity: string;
	level: number;
	xp: number;
	edition: string;
	mintSource: 'genesis' | 'pack' | 'reward';
	mintTrxId: string;
	mintBlockNum: number;
	lastTransferBlock: number;
}

export interface GenesisRecord {
	version: string;
	sealed: boolean;
	sealBlock: number;
	packSupply: Record<string, number>;   // rarity → cap
	rewardSupply: Record<string, number>; // rarity → cap
}

export interface EloRecord {
	account: string;
	elo: number;
	wins: number;
	losses: number;
}

export interface MatchAnchorRecord {
	matchId: string;
	playerA: string;
	playerB: string;
	pubkeyA?: string;
	pubkeyB?: string;
	deckHashA?: string;
	deckHashB?: string;
	engineHash?: string;
	dualAnchored: boolean;
	timestamp: number;
}

export interface PackCommitRecord {
	trxId: string;
	account: string;
	packType: string;
	quantity: number;
	saltCommit: string;
	commitBlock: number;
	revealed: boolean;
}

export interface TokenBalance {
	account: string;
	RUNE: number;
}

export interface SupplyRecord {
	key: string;        // rarity name or "card:{id}"
	pool: 'pack' | 'reward';
	cap: number;
	minted: number;
}

// ============================================================
// State Adapter — storage abstraction
//
// The protocol core calls these. Client implements with IndexedDB,
// server implements with in-memory Maps.
// ============================================================

export interface StateAdapter {
	// Genesis
	getGenesis(): Promise<GenesisRecord | null>;
	putGenesis(genesis: GenesisRecord): Promise<void>;

	// Cards
	getCard(uid: string): Promise<CardAsset | null>;
	putCard(card: CardAsset): Promise<void>;
	deleteCard(uid: string): Promise<void>;
	getCardsByOwner(owner: string): Promise<CardAsset[]>;

	// Supply
	getSupply(key: string, pool: 'pack' | 'reward'): Promise<SupplyRecord | null>;
	putSupply(record: SupplyRecord): Promise<void>;

	// Nonces
	advanceNonce(account: string, nonce: number): Promise<boolean>;

	// ELO
	getElo(account: string): Promise<EloRecord>;
	putElo(record: EloRecord): Promise<void>;

	// Tokens
	getTokenBalance(account: string): Promise<TokenBalance>;
	putTokenBalance(balance: TokenBalance): Promise<void>;

	// Match anchors
	getMatchAnchor(matchId: string): Promise<MatchAnchorRecord | null>;
	putMatchAnchor(anchor: MatchAnchorRecord): Promise<void>;

	// Pack commits (v1 new flow)
	getPackCommit(trxId: string): Promise<PackCommitRecord | null>;
	putPackCommit(commit: PackCommitRecord): Promise<void>;

	// Reward claims
	hasRewardClaim(account: string, rewardId: string): Promise<boolean>;
	putRewardClaim(account: string, rewardId: string, blockNum: number): Promise<void>;

	// Slash state
	isSlashed(account: string): Promise<boolean>;
	slash(account: string, reason: string, blockNum: number): Promise<void>;

	// Queue
	getQueueEntry(account: string): Promise<{ timestamp: number } | null>;
	putQueueEntry(account: string, data: { mode: string; elo: number; timestamp: number; blockNum: number }): Promise<void>;
	deleteQueueEntry(account: string): Promise<void>;
}

// ============================================================
// Signature Verifier — abstracted for testability
// ============================================================

export interface SignatureVerifier {
	/**
	 * Verify a detached signature against an anchored public key.
	 * Returns true if the signature over `message` was produced by `pubkey`.
	 */
	verifyAnchored(pubkey: string, message: string, signatureHex: string): Promise<boolean>;

	/**
	 * Legacy: verify against current chain posting keys (pre-v1 matches only).
	 */
	verifyCurrentKey(account: string, message: string, signatureHex: string): Promise<boolean>;
}

// ============================================================
// Card Data Provider — abstracted for isomorphic use
// ============================================================

export interface CardDataProvider {
	getCardById(id: number): { name: string; type: string; rarity: string; race?: string; collectible?: boolean } | null;
	getCollectibleIdsInRanges(ranges: [number, number][]): number[];
}

// ============================================================
// Reward Definition
// ============================================================

export interface RewardDefinition {
	id: string;
	condition: { type: string; value: number };
	cards: Array<{ cardId: number; rarity: string; foil?: string }>;
	runeBonus: number;
}

export interface RewardProvider {
	getRewardById(id: string): RewardDefinition | null;
}

# Ragnarok Poker — Hive Blockchain Integration Blueprint

## 1. Overview

This document defines the complete architecture for integrating Ragnarok Poker with the Hive blockchain. The integration adds three capabilities to the game:

1. **Player Identity** — Players log in with their Hive account via Hive Keychain
2. **Match Recording** — Every match result is permanently recorded on-chain
3. **NFT Card Ownership** — Cards can be minted, owned, and traded as base-layer NFTs

All blockchain interaction uses Hive's base layer only — no Hive Engine, no sidechains, no smart contracts. The game itself acts as the validator and enforcer.

### Core Principle

The game works 100% without blockchain. Hive integration is additive — it layers on top of existing systems without modifying game logic, combat resolution, or card effects.

---

## 2. Architecture

### Zero-Cost Client-Only Design

**$0/month infrastructure.** No servers, no databases, no hosted services. Everything runs in the player's browser using public Hive API nodes (free) and local IndexedDB storage.

```text
┌─────────────────────────────────────────────────────┐
│                    GAME CLIENT                       │
│   (React / Zustand / Combat / Cards / UI)            │
│                                                       │
│   Existing game logic — UNCHANGED                     │
│                                                       │
│   ┌───────────────────────────────────────────────┐  │
│   │          BLOCKCHAIN LAYER (in-browser)         │  │
│   │                                                 │  │
│   │  Chain Replay Engine → IndexedDB (local ledger) │  │
│   │  Hive Keychain → sign & broadcast custom_json   │  │
│   │  Transaction Queue → retry logic (Zustand)      │  │
│   │  Match Packager → dual-sig match results        │  │
│   └──────────────┬──────────────────────────────────┘  │
│                  │                                      │
└──────────────────┼──────────────────────────────────────┘
                   │ reads / writes
                   ▼
    ┌──────────────────────────────┐
    │     PUBLIC HIVE API NODES    │
    │                              │
    │  api.hive.blog               │
    │  api.deathwing.me            │
    │  api.openhive.network        │
    │  rpc.mahdiyari.info          │
    │                              │
    │  Free, community-operated    │
    │  Redundant (client failover) │
    └──────────────────────────────┘
```

### Hive Gateway (client-side module)

**Purpose:** All blockchain I/O passes through this single module. Nothing else in the game touches the chain.

**Technology:** `hive-tx` v7 (TypeScript, 29KB, MIT license) or `dhive`

**Responsibilities:**
- Broadcast `custom_json` operations (match results, NFT transfers) via Hive Keychain
- Query chain data via public API nodes (account history, transaction verification)
- Handle node failover automatically (built-in multi-node support)

### Local Ledger (IndexedDB)

**Purpose:** Fast, indexed, local storage for all game data derived from chain replay. This is what the game actually queries.

**Technology:** IndexedDB (browser-native, persists across sessions)

**Object stores:**
- `nft_ownership` — current card ownership (derived from chain replay)
- `nft_transfers` — transfer history (append-only)
- `supply_counters` — rarity caps and minted counts
- `match_results` — match history (from on-chain dual-signed results)
- `sync_meta` — last processed block number, sync timestamps

**Every record is derived from on-chain data.** If IndexedDB is cleared, the replay engine rebuilds it from scratch by re-reading the chain.

### Chain Replay Engine (in-browser)

**Purpose:** Reads chain history, applies deterministic rules, populates IndexedDB.

**Responsibilities:**
- On game launch: sync from last processed block to chain head
- Apply ownership rules (mint, transfer, burn, seal) in block order
- Rebuild from genesis block if IndexedDB is empty (first launch or cleared cache)
- Rules are hash-pinned at genesis — the code that interprets the chain is immutable

---

## 3. Authentication — Hive Keychain Login

### How It Works

1. Player clicks "Login with Hive" in the game UI
2. Game calls Hive Keychain browser extension to request a signature challenge
3. Keychain prompts the player to approve (they never share their private key)
4. Game receives a signed message proving the player controls that Hive account
5. Game stores the session in Zustand (persisted to localStorage)

### Flow

```text
Player clicks Login
        │
        ▼
Game generates random challenge string
        │
        ▼
Calls window.hive_keychain.requestSignBuffer(
    username,
    challenge,
    'Posting',
    callback
)
        │
        ▼
Keychain popup asks player to approve
        │
        ▼
Callback receives signed challenge
        │
        ▼
Client verifies signature against player's public posting key
   (fetched from public API: condenser_api.get_accounts)
        │
        ▼
Session stored in Zustand store — player is authenticated
```

### Key Points

- **No passwords stored.** The player's Hive account IS their identity.
- **No server involved.** Signature verification happens client-side using the player's public key fetched from public API nodes.
- **Posting key only.** We never need the active key (which controls funds). Posting authority is enough for `custom_json` operations and authentication.
- **Hive Keychain** is a browser extension (Chrome/Firefox/Brave) and mobile app. It's the standard wallet for Hive apps.
- **Fallback:** If Keychain is not installed, show a prompt directing the player to install it. No fallback to password-based auth.

### Session Management

- Sessions are stored client-side in Zustand with `persist` middleware (localStorage)
- Session includes: `hiveUsername`, `publicPostingKey`, `loginTimestamp`
- Sessions expire after 24 hours of inactivity (client-enforced)
- Re-authentication via Keychain required for sensitive actions (NFT transfers)

---

## 4. On-Chain Data Contracts

Every `custom_json` operation uses the protocol ID `ragnarok_poker`. All payloads include a `version` field for forward compatibility.

### 4.1 Match Result

Broadcast by **both players** (dual-signed). Each player broadcasts their own copy via Hive Keychain. A match result is only considered valid by the replay engine when both signatures exist on-chain.

```json
{
  "protocol": "ragnarok_poker",
  "version": 1,
  "action": "match_result",
  "match_id": "uuid-v4",
  "timestamp": 1707350000,
  "winner": {
    "hive_username": "player1",
    "hero_id": "thor_thundergod",
    "hero_class": "warrior",
    "final_hp": 45,
    "max_hp": 100,
    "hands_won": 3,
    "biggest_hand": "flush"
  },
  "loser": {
    "hive_username": "player2",
    "hero_id": "loki_trickster",
    "hero_class": "rogue",
    "final_hp": 0,
    "max_hp": 100,
    "hands_won": 2,
    "biggest_hand": "two_pair"
  },
  "match_stats": {
    "total_hands": 5,
    "duration_seconds": 420,
    "mode": "ranked"
  },
  "transcript_merkle_root": "sha256:0x...",
  "move_count": 87,
  "opponent_sig": "sha256:0x...",
  "pow": {
    "nonces": [9182, 43201, 7823, 55102, 12947, 890],
    "count": 64,
    "difficulty": 4
  }
}
```

**`transcript_merkle_root`:** Root of a Merkle tree over all `SignedMove` hashes. Enables single-move dispute verification without the full transcript — submit only the disputed move + 7 sibling hashes.

**Size:** ~700 bytes — well within the 8,192-byte limit.

**Signed by:** Both players independently broadcast the same result. The replay engine only counts a match when it finds matching `match_id` results from both the winner and loser accounts, with a valid dual-anchored `match_start` and valid PoW.

### 4.2 Player Stat Update (Profile Metadata)

Optionally written to each player's own Hive account `posting_json_metadata` for display.

```json
{
  "ragnarok_poker": {
    "version": 1,
    "stats": {
      "wins": 48,
      "losses": 23,
      "draws": 1,
      "win_rate": 66.7,
      "current_streak": 3,
      "best_streak": 12,
      "rank": "Jarl",
      "rank_points": 1450
    },
    "profile": {
      "favorite_hero": "odin_allfather",
      "matches_played": 72,
      "last_match": "2026-02-07T12:00:00Z"
    }
  }
}
```

**Note:** Profile metadata is a convenience cache. It is NOT the source of truth. The source of truth is the chain of dual-signed `match_result` custom_json operations. Any player's replay engine can recompute stats from scratch.

### 4.3 NFT Mint

Broadcast by the **Ragnarok game account** during genesis airdrop only.

```json
{
  "protocol": "ragnarok_poker",
  "version": 1,
  "action": "nft_mint",
  "nft_id": "rp-card-96001-001",
  "card_id": 96001,
  "card_name": "Níðhöggr",
  "card_type": "minion",
  "rarity": "legendary",
  "nft_rarity": "mythic",
  "edition": "genesis",
  "serial_number": 1,
  "max_supply": 100,
  "owner": "player1",
  "minted_at": 1707350000
}
```

**NFT ID Format:** `rp-card-{cardId}-{serialNumber}`

- `rp` = Ragnarok Poker prefix
- `cardId` = references the in-game card definition
- `serialNumber` = unique instance (1 of 100, 2 of 100, etc.)

### 4.4 NFT Transfer

Broadcast by the **current owner** (via Hive Keychain signing).

```json
{
  "protocol": "ragnarok_poker",
  "version": 1,
  "action": "nft_transfer",
  "nft_id": "rp-card-96001-001",
  "from": "seller",
  "to": "buyer",
  "memo": "Trade for 50 HIVE",
  "timestamp": 1707350000
}
```

**Validation rules (enforced by the game):**
- `from` must match the current owner in the ownership ledger
- `from` must be the `required_posting_auths` signer of the transaction
- The NFT must exist (previously minted)
- Cannot transfer to yourself

### 4.5 NFT Burn (Optional)

```json
{
  "protocol": "ragnarok_poker",
  "version": 1,
  "action": "nft_burn",
  "nft_id": "rp-card-96001-001",
  "burned_by": "owner",
  "reason": "sacrifice",
  "timestamp": 1707350000
}
```

### 4.6 Match Start Anchor (Dual-Signature)

Broadcast by **both players** before gameplay begins. Creates an on-chain proof that a match was initiated, binding both accounts and the battle ID with a cryptographic hash. Enables disconnect accountability.

```json
{
  "protocol": "ragnarok_poker",
  "version": 1,
  "action": "match_start",
  "match_id": "uuid-v4",
  "player_a": "alice",
  "player_b": "bob",
  "match_hash": "sha256:0x...",
  "deck_hash_a": "sha256:0x...",
  "deck_hash_b": "sha256:0x...",
  "timestamp": 1707350000,
  "pow": {
    "nonces": [12847, 9234, 45123, 7891, 33201, 4102],
    "count": 32,
    "difficulty": 4
  }
}
```

**`match_hash` computation:** `sha256(match_id + player_a + player_b + timestamp)` — deterministic from handshake data, both clients produce the same hash.

**Validation rules:**

- Both players must broadcast matching `match_id` and `match_hash`
- Must include valid PoW (see Section 4.7)
- `match_id` must not already exist as a dual-anchored match
- A `match_result` is only valid if a dual-anchored `match_start` exists for that `match_id`

**Size:** ~400 bytes — well within the 8,192-byte limit.

### 4.7 Proof of Work (Required on Broadcasts)

Every `match_start`, `match_result`, and `queue_join` operation must include a `pow` field. This is computed entirely in the player's browser via **multiple parallel sub-challenges** — no server issues challenges.

```json
{
  "pow": {
    "nonces": [12847, 9234, 45123, 7891, 33201, 4102],
    "count": 32,
    "difficulty": 4
  }
}
```

**Multi-challenge design:** Instead of one large SHA256 problem, we solve many small ones in parallel. Each sub-challenge is derived deterministically from the payload — still fully serverless, but now parallelizable across CPU cores via Web Workers.

**How it works:**

1. Remove the `pow` field from the payload
2. Compute `seed = sha256(JSON.stringify(payload, keys.sort()))`
3. For each `i` in `[0, count)`: derive `challenge_i = sha256(seed + ':' + i)`
4. For each challenge: increment `nonce_i` until `sha256(challenge_i + ':' + nonce_i)` has `difficulty` leading zero bits
5. Steps 3-4 run across Web Workers in parallel — all CPU cores used simultaneously

**Difficulty tiers:**

| Operation | Count | Bits each | Avg hashes total | Wall time |
| --- | --- | --- | --- | --- |
| `queue_join` | 32 | 4 | ~256 | <0.1s |
| `match_start` | 32 | 4 | ~256 | <0.1s |
| `match_result` | 64 | 6 | ~2,048 | ~0.5s |

**Purpose:** Anti-bot, anti-spam. A script can't flood the queue — each op costs real CPU. Honest players experience no noticeable delay. Bots needing to spam thousands of ops hit a hard computational wall.

**Verification:** The replay engine re-derives all challenge seeds from the on-chain payload and checks every nonce. Any failing nonce invalidates the entire op — silently ignored, no state change.

### 4.8 Slash Evidence (Permissionless)

Broadcast by **anyone** who observes contradictory on-chain ops from the same account. No admin needed — any honest player can submit.

```json
{
  "protocol": "ragnarok_poker",
  "version": 1,
  "action": "slash_evidence",
  "account": "cheater_hive",
  "tx_a": "abc123def456",
  "tx_b": "def456abc123",
  "reason": "contradictory_match_results",
  "submitted_by": "honest_observer"
}
```

**Valid `reason` types:**

- `contradictory_match_results` — same `match_id`, different winner in two broadcasts
- `double_queue_entry` — two active `queue_join` with no `queue_leave` between
- `deck_hash_mismatch` — `match_result` deck hash differs from committed `match_start` deck hash

**Replay engine behavior:** Fetches both referenced transactions, verifies signatures and contradiction, then marks `account` as slashed in IndexedDB. Slashed accounts are excluded from matchmaking and queue polling by all clients independently.

---

## 5. Local Data Schema (IndexedDB)

All data is stored locally in the player's browser via IndexedDB. There is no server database. If IndexedDB is cleared, the replay engine rebuilds everything from the chain.

### 5.1 nft_ownership (object store)

Current ownership state. Built by replaying mint + transfer chain history.

```typescript
interface NFTOwnership {
  nftId: string;          // keyPath — e.g. "rp-card-96001-001"
  cardId: number;
  cardName: string;
  rarity: string;
  nftRarity: string;
  edition: string;
  serialNumber: number;
  maxSupply: number;
  currentOwner: string;   // Hive username
  mintTxId: string;
  mintBlockNum: number;
  isBurned: boolean;
  mintedAt: number;
}
// Indexes: currentOwner, cardId, rarity
```

### 5.2 nft_transfers (object store)

Audit trail for all NFT operations (mints, transfers, burns).

```typescript
interface NFTTransfer {
  id: string;             // keyPath — nftId + txId
  nftId: string;
  action: 'mint' | 'transfer' | 'burn';
  fromUser: string | null;  // null for mints
  toUser: string | null;    // null for burns
  memo: string;
  hiveTxId: string;
  hiveBlockNum: number;
  timestamp: number;
}
// Indexes: nftId, fromUser, toUser, hiveBlockNum
```

### 5.3 match_results (object store)

Dual-signed match results from chain replay.

```typescript
interface LocalMatchResult {
  matchId: string;        // keyPath
  winnerUsername: string;
  loserUsername: string;
  winnerHeroId: string;
  loserHeroId: string;
  winnerFinalHp: number;
  loserFinalHp: number;
  totalHands: number;
  durationSeconds: number;
  mode: 'casual' | 'ranked' | 'tournament';
  matchData: object;      // full match details
  winnerTxId: string;     // winner's broadcast tx
  loserTxId: string;      // loser's broadcast tx
  blockNum: number;
  dualSigned: boolean;    // true only when BOTH players' ops found
}
// Indexes: winnerUsername, loserUsername, blockNum, mode
```

### 5.4 match_anchors (object store)

On-chain match start anchors. Links `match_start` to `match_result`.

```typescript
interface MatchAnchor {
  matchId: string;        // keyPath
  playerA: string;        // Hive username
  playerB: string;        // Hive username
  matchHash: string;      // sha256(match_id + player_a + player_b + timestamp)
  anchorTxA: string | null;  // player A's match_start tx
  anchorTxB: string | null;  // player B's match_start tx
  anchorBlockA: number | null;
  anchorBlockB: number | null;
  dualAnchored: boolean;  // true when BOTH players' match_start ops found
  resultMatchId: string | null; // links to match_result once game ends
  timestamp: number;
}
// Indexes: playerA, playerB, dualAnchored
```

### 5.5 broadcast_queue (object store)

Pending broadcasts from this player (persisted via Zustand + localStorage).

```typescript
interface BroadcastQueueEntry {
  id: string;             // keyPath
  payload: object;        // the full custom_json payload
  operationType: 'match_result' | 'nft_transfer' | 'xp_update';
  referenceId: string;    // match_id or nft_id
  attempts: number;
  maxAttempts: number;
  lastAttemptAt: number;
  lastError: string | null;
  status: 'pending' | 'processing' | 'confirmed' | 'failed';
  createdAt: number;
}
```

### 5.6 sync_meta (object store)

Tracks replay engine progress.

```typescript
interface SyncMeta {
  key: 'main';           // keyPath — single record
  lastProcessedBlock: number;
  lastSyncTimestamp: number;
  genesisBlock: number;  // hardcoded constant
  totalOpsProcessed: number;
}
```

---

## 6. Operational Flows

All flows run entirely in the player's browser. No server is involved.

### 6.1 Match Anchor Broadcast (Before Gameplay)

```text
P2P handshake completes (WebRTC connection open)
        │
        ▼
Both clients agree on match_id, match_hash
   (deterministic: sha256(match_id + player_a + player_b + timestamp))
        │
        ▼
Each client computes PoW for match_start payload
   (~0.5 seconds, runs in background during handshake UI)
        │
        ├──── Player A's client ──────────────┐
        │                                      │
        ▼                                      ▼
Player A signs via Keychain             Player B signs via Keychain
   custom_json: match_start               custom_json: match_start
   required_posting_auths:                 required_posting_auths:
     ["player_a"]                            ["player_b"]
        │                                      │
        ▼                                      ▼
Broadcast to Hive                        Broadcast to Hive
        │                                      │
        └──────────┬───────────────────────────┘
                   │
                   ▼
Both ops appear on-chain (within 3-6 seconds)
                   │
                   ▼
Both clients verify the other's match_start appeared
   → Proceed to deck commitment + gameplay
                   │
                   ▼
If opponent's match_start NOT seen within 30 seconds:
   → Match aborted. The anchored player has on-chain proof they showed up.
```

### 6.2 Match Result Recording (Dual-Signature)

```text
Combat ends (resolvePokerCombat / hero death)
        │
        ▼
Both players' clients produce identical match result
   (same match_id, same stats — deterministic from WASM engine)
        │
        ├──── Player A's client ────────┐
        │                               │
        ▼                               ▼
Player A signs via Keychain       Player B signs via Keychain
   custom_json: match_result        custom_json: match_result
   required_posting_auths:          required_posting_auths:
     ["player_a"]                     ["player_b"]
        │                               │
        ▼                               ▼
Broadcast to Hive                 Broadcast to Hive
        │                               │
        └───────────┬───────────────────┘
                    │
                    ▼
          Both ops on chain
                    │
                    ▼
   Any player's replay engine sees both ops
   with matching match_id → valid dual-signed result
   → Updates local match_results in IndexedDB
```

### 6.3 NFT Minting (Genesis Airdrop Only)

```text
Ragnarok account executes airdrop (one-time, pre-seal)
        │
        ▼
For each recipient in airdrop list:
   Broadcast custom_json: action = "nft_mint"
   signed by @ragnarok-cards account
   { "to": "recipient", "cards": [...] }
        │
        ▼
After all mints complete:
   Broadcast custom_json: action = "seal"
   → No further mints accepted by any replay engine, ever
```

### 6.4 NFT Transfer (Player-to-Player)

```text
Player clicks "Transfer Card" in game UI
        │
        ▼
Client verifies ownership in local IndexedDB
   → currentOwner matches logged-in Hive account
        │
        ▼
Client builds custom_json payload
        │
        ▼
Calls Hive Keychain to sign with player's posting key
   window.hive_keychain.requestCustomJson(...)
        │
        ▼
Keychain prompts player to approve
        │
        ▼
Keychain broadcasts directly to chain
        │
        ▼
On next sync cycle (or immediate re-fetch):
   Replay engine picks up the transfer op
   → Updates nft_ownership in IndexedDB
   → Both sender and recipient see the change
```

### 6.5 Broadcast Retry Queue

```text
Zustand broadcast queue store (persisted to localStorage)
        │
        ▼
On game launch + every 30 seconds:
   Check queue for entries with status = 'pending'
   AND attempts < maxAttempts
        │
        ▼
For each queued item:
   • Attempt broadcast via Hive Keychain
   • On success: status = 'confirmed', record txId
   • On failure: increment attempts, record error
   • If attempts >= maxAttempts: status = 'failed'
     (player sees notification to retry manually)
```

---

## 7. Chain Replay & Recovery

### The Promise

If a player clears their browser storage, 100% of their collection and match history can be reconstructed from the blockchain alone. No backup needed. No server to restore from.

### How It Works

The **GENESIS_BLOCK** number is hardcoded in the game client as a constant. This is the block number of the first-ever `ragnarok-cards` custom_json operation.

```typescript
// Hardcoded in the game client — never changes
const GENESIS_BLOCK = 89_000_000; // example — set at launch
```

### Replay Process

```text
1. Read sync_meta from IndexedDB
   → lastProcessedBlock = N (or GENESIS_BLOCK if empty)

2. Call: condenser_api.get_account_history("ragnarok-cards-account", ...)
   → Returns all custom_json ops from the game account

3. For each operation (in block order):
   │
   ├── Parse JSON payload
   │
   ├── Switch on action:
   │   ├── "genesis"      → Initialize supply counters
   │   ├── "mint"         → INSERT nft_ownership + nft_transfers
   │   │                    (only if broadcaster == ragnarok account
   │   │                     AND pre-seal AND supply not exhausted)
   │   ├── "transfer"     → UPDATE nft_ownership.currentOwner
   │   │                    INSERT nft_transfers
   │   │                    (only if broadcaster == from_account)
   │   ├── "burn"         → Mark nft_ownership.isBurned = true
   │   ├── "seal"         → Set genesis sealed — reject future mints
   │   ├── "match_start"  → Verify PoW, INSERT match_anchors
   │   │                    (set dualAnchored when both players' ops found)
   │   ├── "match_result" → Verify PoW, INSERT match_results
   │   │                    (only if dual-signed AND dual-anchored
   │   │                     match_start exists for this match_id)
   │   ├── "queue_join"   → Verify PoW, add to active queue
   │   ├── "queue_leave"  → Remove from active queue
   │   └── anything else  → Silently ignored
   │
   └── Update sync_meta.lastProcessedBlock

4. IndexedDB is now up to date — game queries read locally
```

### Performance Expectations

- `get_account_history` returns only game-relevant ops (not the whole chain)
- First-ever sync (500K minted cards): ~30-60 seconds
- Returning player (1 day behind): ~2-5 seconds
- Already synced: instant (read IndexedDB directly)
- Sync runs in background — game is playable while catching up

---

## 8. Anti-Cheat Design

### Threat Model

| Threat | Mitigation |
|--------|-----------|
| Player forges a win | Match results require dual signatures — both winner AND loser must broadcast matching results. A player cannot fake a win without their opponent's cooperation. |
| Player edits profile stats | Profile metadata is a convenience cache. Real stats are computed by replaying dual-signed match_result ops from the chain. |
| Player transfers NFT they don't own | Replay engine validates `required_posting_auths` signer matches `currentOwner`. Invalid transfers are ignored. |
| Player replays an old transfer | Each transaction has a unique `hive_tx_id`. Replay engine deduplicates by tx_id. |
| Player mints fake NFTs | Only the Ragnarok game account can broadcast valid `nft_mint` actions (pre-seal). Player-signed mints are ignored by the replay rules. |
| IndexedDB tampered with | IndexedDB is a local cache. Clearing it triggers a full chain replay from genesis — the chain is the source of truth. |
| Modified game client | Opponent's WASM engine rejects illegal moves — refuses to countersign. See detailed blueprint Section 8. |
| Randomness manipulation | Commit-reveal scheme — neither player controls the seed. See detailed blueprint Section 7. |
| Bot spam (mass queue floods) | Multi-challenge PoW (32-64 parallel sub-challenges). Bots hit hard computational wall per op. See Section 4.7. |
| Fake disconnect claims | `match_start` anchor proves whether a match was initiated. No anchor = no match ever happened. See Section 4.6. |
| Result without match start | Replay engine rejects `match_result` unless a dual-anchored `match_start` exists for that `match_id`. |
| Pre-computed move sequences | `hive_block_ref` in every `SignedMove` anchors each move to a real chain block that didn't exist at attack plan time. |
| Double-broadcast fraud | Anyone submits `slash_evidence` with two contradictory tx IDs. Replay engine auto-slashes — permissionless. See Section 4.8. |
| Single-move dispute | Merkle proof for the disputed move alone — no full transcript download needed. See Section 4.1 (`transcript_merkle_root`). |

### Trust Hierarchy

```text
MOST TRUSTED
    │
    ├── Hive blockchain (immutable, public, verifiable by anyone)
    │
    ├── WASM game engine (hash-pinned, deterministic, both clients verify)
    │
    ├── Dual-signature match results (both players must agree)
    │
    ├── Local IndexedDB (fast cache, rebuildable from chain replay)
    │
    └── Player profile metadata (convenience display, player-writable)
    │
LEAST TRUSTED
```

### Verification

Anyone can independently verify a player's record:

1. Replay the chain for all `ragnarok-cards` custom_json ops
2. Filter for dual-signed match results containing the player's username
3. Count wins and losses
4. Compare against the player's displayed profile stats

This is fully transparent and requires zero trust in any server or database.

---

## 9. Integration Points with Existing Code

### Where Blockchain Touches the Game

There is exactly **one** integration point in the existing game code:

```text
resolvePokerCombat() or hero death
        │
        ▼
BlockchainSubscriber (already implemented)
   listens for gamePhase → 'game_over'
        │
        ▼
if (hiveSession.isAuthenticated) {
   packageMatchResult() → transactionQueueStore.enqueue()
   → Keychain broadcasts dual-signed result to Hive
}
```

Everything else is in the blockchain module. The existing combat system, card effects, poker mechanics, UI — none of it changes.

### No Server Endpoints

There are **zero server endpoints** for blockchain integration. All operations happen client-side:

- **Auth**: Hive Keychain → client-side signature verification
- **Stats**: Replay engine → IndexedDB queries (local)
- **NFT ownership**: Replay engine → IndexedDB queries (local)
- **Match recording**: Both players broadcast via Keychain → chain
- **Leaderboard**: Computed locally from IndexedDB match_results

### File Structure (Client-Only)

```text
client/src/
├── data/
│   ├── blockchain/                      # Already exists (partially built)
│   │   ├── types.ts                     — NFT, Transfer, MatchResult types
│   │   ├── transactionQueueStore.ts     — Zustand broadcast queue with retry
│   │   ├── cardXPSystem.ts              — XP calculations per rarity
│   │   ├── matchResultPackager.ts       — Package match into on-chain format
│   │   ├── nftMetadataGenerator.ts      — Generate immutable NFT metadata
│   │   ├── hashUtils.ts                 — SHA-256 hashing
│   │   ├── replayEngine.ts             — NEW: chain replay → IndexedDB
│   │   ├── replayRules.ts             — NEW: deterministic ownership rules
│   │   ├── replayDB.ts               — NEW: IndexedDB schema + queries
│   │   ├── proofOfWork.ts             — NEW: multi-challenge PoW with Web Workers
│   │   ├── matchAnchor.ts             — NEW: match_start broadcast + verification
│   │   ├── transcriptMerkle.ts        — NEW: Merkle tree over SignedMoves, proof gen/verify
│   │   ├── slashEvidence.ts           — NEW: detect + broadcast slash_evidence ops
│   │   └── matchmakingOnChain.ts      — NEW: on-chain queue polling
│   ├── HiveDataLayer.ts                — Zustand store for Hive state
│   ├── HiveSync.ts                     — Keychain integration
│   └── schemas/HiveTypes.ts            — Type definitions
│
├── game/
│   ├── subscribers/
│   │   └── BlockchainSubscriber.ts      — Already built: game-end → package → queue
│   └── components/
│       └── hive/
│           ├── HiveLoginButton.tsx      — Keychain login UI
│           ├── HiveProfileBadge.tsx     — Shows Hive username + rank
│           └── HiveMatchHistory.tsx     — Match history from IndexedDB
```

**What's NOT here:**

- No `server/hive/` — no server involvement
- No Express routes — no API endpoints
- No PostgreSQL tables — IndexedDB only
- No admin dashboard — every player is their own admin

---

## 10. Configuration Constants

No environment variables needed. All configuration is hardcoded in the client as constants (since there's no server).

```typescript
// client/src/data/blockchain/config.ts

export const HIVE_CONFIG = {
  // Protocol
  CUSTOM_JSON_ID: 'ragnarok-cards',
  PROTOCOL_VERSION: 1,

  // Genesis
  GENESIS_BLOCK: 0, // Set at launch — block of first ragnarok-cards op
  GAME_ACCOUNT: 'ragnarok-cards', // Hive account used for genesis minting

  // API nodes (free, community-operated, redundant)
  API_NODES: [
    'https://api.hive.blog',
    'https://api.deathwing.me',
    'https://api.openhive.network',
    'https://rpc.mahdiyari.info',
  ],

  // Replay engine
  SYNC_INTERVAL_MS: 30_000, // Background sync every 30s
  MAX_OPS_PER_FETCH: 1000,  // Batch size for get_account_history

  // Broadcast queue
  MAX_RETRIES: 3,
  RETRY_INTERVAL_MS: 30_000,
  TX_EXPIRY_MS: 24 * 60 * 60 * 1000, // 24 hours

  // Proof of Work — multi-challenge parallel design
  // Each op solves `count` sub-challenges of `difficulty` leading zero bits
  // Sub-challenges are solved in parallel via Web Workers
  POW_COUNT_QUEUE_JOIN: 32,          // 32 sub-challenges, 4 bits each = ~256 hashes avg
  POW_COUNT_MATCH_START: 32,
  POW_COUNT_MATCH_RESULT: 64,        // 64 sub-challenges, 6 bits each = ~2048 hashes avg
  POW_DIFFICULTY_PER_CHALLENGE: 4,   // bits per sub-challenge (queue/start)
  POW_DIFFICULTY_RESULT: 6,          // bits per sub-challenge (match result — heavier)

  // Match anchor
  MATCH_START_TIMEOUT_MS: 30_000,    // Abort if opponent's anchor not seen
} as const;
```

The **only secret** is the Ragnarok game account's posting key — used once during genesis airdrop, then irrelevant. It is never stored in the client or in any deployed code.

---

## 11. Implementation Phases

### Phase 1: Foundation

- [ ] Set up `@ragnarok-cards` Hive account
- [ ] Install `hive-tx` or `dhive` package
- [ ] Build chain replay engine (replayEngine.ts + replayRules.ts + replayDB.ts)
- [ ] Build IndexedDB schema and query layer
- [ ] Wire BlockchainSubscriber to broadcast queue (already partially done)

### Phase 2: Player Identity

- [ ] Hive Keychain login flow (client-side challenge/verify)
- [ ] Session management in Zustand (persisted to localStorage)
- [ ] HiveLoginButton component
- [ ] Player profile display (stats from IndexedDB)

### Phase 3: Match Recording

- [ ] Multi-challenge PoW module (`proofOfWork.ts`: parallel sub-challenges via Web Workers)
- [ ] Match anchor protocol (`matchAnchor.ts`: dual-sig `match_start` broadcast)
- [ ] Both players broadcast `match_start` before gameplay via Keychain
- [ ] `SignedMove` with `hive_block_ref` temporal anchor per move
- [ ] Merkle transcript builder (`transcriptMerkle.ts`: root computation + proof gen/verify)
- [ ] Dual-signature match result with `transcript_merkle_root` and PoW
- [ ] Both players broadcast matching results via Keychain
- [ ] Replay engine validates PoW + `match_start` linkage + `slash_evidence` processing
- [ ] Slash evidence module (`slashEvidence.ts`: detect contradictions, broadcast, auto-apply)
- [ ] Replay engine processes `match_result` ops into IndexedDB
- [ ] Leaderboard computed from local match_results

### Phase 4: Genesis Airdrop & NFTs

- [ ] Execute genesis airdrop (batch mint ops from game account)
- [ ] Broadcast seal after distribution complete
- [ ] NFT ownership verification from IndexedDB
- [ ] NFT transfer via Keychain
- [ ] Collection view filtered by ownership
- [ ] Deck verification at P2P handshake

### Phase 5: On-Chain Matchmaking

- [ ] `queue_join` / `queue_leave` custom_json ops
- [ ] Client polls for queue ops, initiates P2P connections
- [ ] Ranked ladder from dual-signed match results

---

## 12. Dependencies

| Package   | Purpose                                          | Size   |
|-----------|--------------------------------------------------|--------|
| `hive-tx` | Blockchain I/O (broadcast, query, key management) | 29KB   |
| `idb`     | IndexedDB wrapper (optional, for cleaner API)     | ~3KB   |

No server dependencies. No PostgreSQL. No Drizzle ORM. Hive Keychain is a browser extension installed by the player — it's not a code dependency.

---

## 13. Security Checklist

- [ ] Ragnarok game account posting key used ONLY during genesis airdrop, then discarded
- [ ] No private keys stored in client code, environment variables, or deployed assets
- [ ] NFT transfers validated by replay engine: signer must match currentOwner
- [ ] Match results require dual signatures — single-signed results ignored
- [ ] Match results require a dual-anchored `match_start` — results without anchors ignored
- [ ] All broadcast ops (`match_start`, `match_result`, `queue_join`) include valid multi-challenge PoW
- [ ] PoW sub-challenge count and bit-difficulty reviewed for anti-bot effectiveness without UX impact
- [ ] Every `SignedMove` includes `hive_block_ref` — verified against chain before dispute admission
- [ ] `transcript_merkle_root` replaces flat hash — Merkle proofs enable single-move dispute resolution
- [ ] `slash_evidence` submissions verified independently by replay engine — no admin trust required
- [ ] All `custom_json` payloads validated against schema before broadcast
- [ ] Replay engine rules are deterministic and hash-pinned at genesis
- [ ] No active key operations — posting authority only
- [ ] Hive Keychain handles all player key management (game never sees private keys)
- [ ] IndexedDB is a local cache only — clearing it triggers safe rebuild from chain

---

## 14. Glossary

| Term                   | Meaning                                                                                        |
|------------------------|------------------------------------------------------------------------------------------------|
| `custom_json`          | A Hive blockchain operation for broadcasting arbitrary JSON data (max 8,192 bytes)             |
| `posting key`          | Lower-privilege Hive key used for social actions and custom_json. Cannot move funds.           |
| `active key`           | Higher-privilege Hive key that can transfer tokens. We never use this.                         |
| `Hive Keychain`        | Browser extension that securely manages Hive keys and signs transactions                       |
| `Resource Credits (RC)`| Hive's rate-limiting system. Broadcasting costs RC, which regenerates based on Hive Power      |
| `hive-tx`              | Lightweight TypeScript library for building and broadcasting Hive transactions                  |
| `IndexedDB`            | Browser-native local database. Persists across sessions. Used as the local game ledger.        |
| `replay engine`        | Client-side module that reads chain history and reconstructs ownership state in IndexedDB       |
| `dual signature`       | Both players must independently broadcast matching match results for the result to be valid     |
| `match anchor`         | A `match_start` custom_json broadcast by both players before gameplay, proving the match was initiated |
| `proof of work (PoW)`  | Multi-challenge SHA256 computation solved in parallel via Web Workers before broadcasting. Anti-spam measure. |
| `hive_block_ref`       | SHA256 of a recent Hive block header included in every `SignedMove` — temporal anchor, prevents pre-computed attacks |
| `transcript_merkle_root` | Merkle tree root over all `SignedMove` hashes — enables single-move proof without full transcript download |
| `slash evidence`       | A permissionless on-chain report citing two contradictory ops by the same account. Triggers auto-ban via replay engine. |
| `genesis block`        | The block number where our first `custom_json` was broadcast. Hardcoded in client config.      |
| `seal`                 | A one-time broadcast that permanently disables all future minting. Irreversible.               |

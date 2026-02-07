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

### Three-Layer Design

```
┌─────────────────────────────────────────────────┐
│                  GAME CLIENT                     │
│  (React / Zustand / Combat / Cards / UI)         │
│                                                   │
│  Existing game logic — UNCHANGED                  │
└──────────────┬────────────────────────────────────┘
               │ match result
               ▼
┌─────────────────────────────────────────────────┐
│              SYNC MANAGER (Layer 3)              │
│                                                   │
│  • Packages match results into on-chain format    │
│  • Manages broadcast queue with retry logic       │
│  • Writes to database AND broadcasts to chain     │
│  • Recovery mode: rebuilds DB from chain scan     │
└──────┬───────────────────┬────────────────────────┘
       │                   │
       ▼                   ▼
┌──────────────┐   ┌──────────────────────────────┐
│ HIVE GATEWAY │   │      GAME LEDGER (Layer 2)   │
│  (Layer 1)   │   │                              │
│              │   │  PostgreSQL via Drizzle ORM   │
│  hive-tx lib │   │                              │
│  Keychain    │   │  • match_results table       │
│  Public APIs │   │  • player_stats table        │
│              │   │  • nft_cards table            │
│  Reads/Writes│   │  • broadcast_queue table      │
│  to Hive     │   │                              │
│  blockchain  │   │  Fast indexed queries for     │
│              │   │  leaderboards, history, etc.  │
└──────────────┘   └──────────────────────────────┘
```

### Layer 1: Hive Gateway

**Purpose:** All blockchain I/O passes through this single module. Nothing else in the game touches the chain.

**Technology:** `hive-tx` v7 (TypeScript, 29KB, MIT license)

**Responsibilities:**
- Broadcast `custom_json` operations (match results, NFT mints, NFT transfers)
- Query chain data via public API nodes (account info, transaction history)
- Handle node failover automatically (hive-tx has built-in multi-node support)
- Integrate with Hive Keychain for client-side player authentication

**Public API Nodes (built into hive-tx):**
- `api.hive.blog`
- `api.deathwing.me`
- `api.openhive.network`
- `rpc.mahdiyari.info`

**This layer is replaceable.** If we ever move to HAF or a different chain, only this module changes.

### Layer 2: Game Ledger

**Purpose:** Fast, indexed, searchable storage for all game data. This is what the game actually queries.

**Technology:** PostgreSQL with Drizzle ORM (existing stack)

**Tables (new):**
- `match_results` — every completed match with on-chain reference
- `player_stats` — aggregated win/loss/rank per player
- `nft_cards` — card ownership ledger
- `nft_transactions` — mint/transfer history
- `broadcast_queue` — pending/failed chain broadcasts awaiting retry

**Every record includes `hive_tx_id` and `hive_block_num`** — linking the local record to its on-chain proof.

### Layer 3: Sync Manager

**Purpose:** Keeps the database and blockchain in agreement. Handles the "write to both" flow and recovery.

**Responsibilities:**
- After match resolution: package result → broadcast to Hive → write to database
- If broadcast fails: queue for retry (exponential backoff, max 10 attempts)
- Recovery mode: scan chain from genesis block, rebuild database from `custom_json` history
- Verify database integrity against chain records on demand

---

## 3. Authentication — Hive Keychain Login

### How It Works

1. Player clicks "Login with Hive" in the game UI
2. Game calls Hive Keychain browser extension to request a signature challenge
3. Keychain prompts the player to approve (they never share their private key)
4. Game receives a signed message proving the player controls that Hive account
5. Game creates/updates a session tied to the Hive username

### Flow

```
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
Server verifies signature against player's public posting key
        │
        ▼
Session created — player is authenticated
```

### Key Points

- **No passwords stored.** The player's Hive account IS their identity.
- **Posting key only.** We never need the active key (which controls funds). Posting authority is enough for `custom_json` operations and authentication.
- **Hive Keychain** is a browser extension (Chrome/Firefox/Brave) and mobile app. It's the standard wallet for Hive apps.
- **Fallback:** If Keychain is not installed, show a prompt directing the player to install it. No fallback to password-based auth.

### Session Management

- Sessions are stored server-side (express-session or JWT)
- Session includes: `hiveUsername`, `loginTimestamp`, `sessionExpiry`
- Sessions expire after 24 hours of inactivity
- Re-authentication required for sensitive actions (NFT transfers)

---

## 4. On-Chain Data Contracts

Every `custom_json` operation uses the protocol ID `ragnarok_poker`. All payloads include a `version` field for forward compatibility.

### 4.1 Match Result

Broadcast by the **game server account** (`@ragnarokpoker`) after each match.

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
  }
}
```

**Size:** ~500 bytes — well within the 8,192-byte limit.

**Signed by:** Game server account only. Players cannot forge match results.

### 4.2 Player Stat Update (Profile Metadata)

Written to each player's Hive account `posting_json_metadata` after their stats change.

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

**Note:** Profile metadata is a convenience cache. It is NOT the source of truth. The source of truth is the chain of `match_result` custom_json operations signed by the game account.

### 4.3 NFT Mint

Broadcast by the **game server account** when a card is minted as an NFT.

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

---

## 5. Database Schema (New Tables)

### 5.1 hive_players

Links Hive accounts to game sessions.

```
hive_players
├── id                  SERIAL PRIMARY KEY
├── hive_username       TEXT NOT NULL UNIQUE
├── posting_pub_key     TEXT NOT NULL
├── first_login         TIMESTAMP DEFAULT NOW()
├── last_login          TIMESTAMP DEFAULT NOW()
├── rank                TEXT DEFAULT 'Thrall'
├── rank_points         INTEGER DEFAULT 0
├── total_wins          INTEGER DEFAULT 0
├── total_losses        INTEGER DEFAULT 0
├── total_draws         INTEGER DEFAULT 0
├── current_streak      INTEGER DEFAULT 0
├── best_streak         INTEGER DEFAULT 0
└── profile_synced_at   TIMESTAMP  -- last time profile metadata was pushed to chain
```

### 5.2 match_results

Every completed match. Each row links to an on-chain `custom_json`.

```
match_results
├── id                  SERIAL PRIMARY KEY
├── match_id            TEXT NOT NULL UNIQUE  -- UUID
├── winner_username     TEXT NOT NULL
├── loser_username      TEXT NOT NULL
├── winner_hero_id      TEXT NOT NULL
├── loser_hero_id       TEXT NOT NULL
├── winner_final_hp     INTEGER NOT NULL
├── loser_final_hp      INTEGER NOT NULL
├── total_hands         INTEGER NOT NULL
├── duration_seconds    INTEGER
├── mode                TEXT DEFAULT 'casual'  -- casual, ranked, tournament
├── match_data          JSONB  -- full match details (hands won, biggest hand, etc.)
├── hive_tx_id          TEXT   -- transaction ID on chain (NULL if not yet broadcast)
├── hive_block_num      INTEGER -- block number (NULL if not yet broadcast)
├── broadcast_status    TEXT DEFAULT 'pending'  -- pending, confirmed, failed
├── created_at          TIMESTAMP DEFAULT NOW()
└── broadcast_at        TIMESTAMP  -- when successfully broadcast
```

### 5.3 nft_cards

Current ownership state. Built from processing mint + transfer chain history.

```
nft_cards
├── id                  SERIAL PRIMARY KEY
├── nft_id              TEXT NOT NULL UNIQUE  -- rp-card-{cardId}-{serial}
├── card_id             INTEGER NOT NULL
├── card_name           TEXT NOT NULL
├── rarity              TEXT NOT NULL
├── nft_rarity          TEXT NOT NULL
├── edition             TEXT NOT NULL
├── serial_number       INTEGER NOT NULL
├── max_supply          INTEGER NOT NULL
├── current_owner       TEXT NOT NULL  -- hive username
├── mint_tx_id          TEXT NOT NULL  -- chain reference for the mint
├── mint_block_num      INTEGER NOT NULL
├── is_burned           BOOLEAN DEFAULT FALSE
├── minted_at           TIMESTAMP NOT NULL
└── updated_at          TIMESTAMP DEFAULT NOW()
```

### 5.4 nft_transactions

Audit trail for all NFT operations (mints, transfers, burns).

```
nft_transactions
├── id                  SERIAL PRIMARY KEY
├── nft_id              TEXT NOT NULL
├── action              TEXT NOT NULL  -- mint, transfer, burn
├── from_user           TEXT  -- NULL for mints
├── to_user             TEXT  -- NULL for burns
├── memo                TEXT
├── hive_tx_id          TEXT NOT NULL
├── hive_block_num      INTEGER NOT NULL
├── created_at          TIMESTAMP DEFAULT NOW()
```

### 5.5 broadcast_queue

Failed or pending broadcasts awaiting retry.

```
broadcast_queue
├── id                  SERIAL PRIMARY KEY
├── payload             JSONB NOT NULL  -- the full custom_json payload
├── operation_type      TEXT NOT NULL  -- match_result, nft_mint, nft_transfer
├── reference_id        TEXT NOT NULL  -- match_id or nft_id
├── attempts            INTEGER DEFAULT 0
├── max_attempts        INTEGER DEFAULT 10
├── last_attempt_at     TIMESTAMP
├── last_error          TEXT
├── status              TEXT DEFAULT 'pending'  -- pending, processing, confirmed, failed
├── created_at          TIMESTAMP DEFAULT NOW()
└── confirmed_at        TIMESTAMP
```

---

## 6. Operational Flows

### 6.1 Match Result Recording

```
Combat ends (resolvePokerCombat / hero death)
        │
        ▼
Game client sends result to server endpoint
   POST /api/hive/match-result
        │
        ▼
Server validates the result
   (checks both players are in active session, match_id is valid)
        │
        ├──────────────────────────────┐
        ▼                              ▼
Write to match_results table    Broadcast custom_json
   (hive_tx_id = NULL,            via hive-tx, signed by
    status = 'pending')            @ragnarokpoker account
        │                              │
        │                         ┌────┴────┐
        │                     SUCCESS     FAIL
        │                         │         │
        │                         ▼         ▼
        │                    Update row   Add to
        │                    with tx_id   broadcast_queue
        │                    & block_num  for retry
        │                         │
        ▼                         ▼
   Update player_stats      Update player profile
   in hive_players table    metadata on chain
                            (convenience cache)
```

### 6.2 NFT Minting

```
Game server decides to mint (pack opening, reward, etc.)
        │
        ▼
Check card_supply table — is supply available?
        │
        ├── NO → reject mint
        │
        ├── YES
        ▼
Broadcast custom_json: action = "nft_mint"
   signed by @ragnarokpoker
        │
        ▼
On success:
   • Insert into nft_cards (owner = recipient)
   • Insert into nft_transactions (action = 'mint')
   • Decrement card_supply.remaining_supply
```

### 6.3 NFT Transfer (Player-to-Player)

```
Player clicks "Transfer Card" in game UI
        │
        ▼
Game builds the custom_json payload
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
Game server detects the transfer by:
   Option A: Polling account history for ragnarok_poker ops
   Option B: Player sends tx_id to server after broadcast
        │
        ▼
Server validates:
   • Signer matches current_owner in nft_cards
   • NFT exists and is not burned
   • Recipient is a valid Hive account
        │
        ▼
On valid:
   • Update nft_cards.current_owner
   • Insert into nft_transactions (action = 'transfer')
```

### 6.4 Retry Queue Processing

```
Background job runs every 30 seconds
        │
        ▼
SELECT from broadcast_queue
   WHERE status = 'pending'
   AND attempts < max_attempts
   ORDER BY created_at ASC
   LIMIT 5
        │
        ▼
For each queued item:
   • Attempt broadcast via hive-tx
   • On success: update broadcast_queue status = 'confirmed',
     update the source table with hive_tx_id
   • On failure: increment attempts, record error,
     set last_attempt_at
   • If attempts >= max_attempts: status = 'failed',
     alert admin
```

---

## 7. Recovery System

### The Promise

If the database is completely destroyed, 100% of match history and NFT ownership can be reconstructed from the blockchain alone.

### Prerequisites

One number must be stored outside the database: **GENESIS_BLOCK** — the block number where the first-ever `ragnarok_poker` custom_json was broadcast. Store this in:
- Environment variable (`HIVE_GENESIS_BLOCK`)
- The `replit.md` file
- Hardcoded in the recovery script as a constant

### Recovery Process

```
1. Start from GENESIS_BLOCK (or last known good block from backup)

2. For each block from start to current head:
   │
   ├── Call: condenser_api.get_ops_in_block(blockNum)
   │
   ├── Filter: custom_json ops where id = 'ragnarok_poker'
   │
   ├── For each matching operation:
   │   │
   │   ├── Parse JSON payload
   │   │
   │   ├── Verify required_posting_auths includes '@ragnarokpoker'
   │   │   (for match_result, nft_mint — only trust game-signed ops)
   │   │
   │   ├── Switch on action:
   │   │   ├── "match_result" → INSERT into match_results
   │   │   ├── "nft_mint"     → INSERT into nft_cards + nft_transactions
   │   │   ├── "nft_transfer" → UPDATE nft_cards.current_owner,
   │   │   │                     INSERT into nft_transactions
   │   │   │                     (verify from_user = current_owner)
   │   │   └── "nft_burn"     → UPDATE nft_cards.is_burned = true
   │   │
   │   └── Record hive_tx_id and hive_block_num
   │
   └── Continue to next block

3. After all blocks processed:
   │
   ├── Rebuild player_stats by aggregating match_results
   │   (COUNT wins/losses per username)
   │
   └── Verify nft_cards ownership chain integrity
       (every transfer has valid prior ownership)
```

### Performance Expectations

- Hive produces ~28,800 blocks per day (1 every 3 seconds)
- Scanning via public API: ~100-500 blocks/second depending on node
- Full day recovery: ~1-5 minutes
- Full year recovery: ~6-30 hours
- **With daily database backups: only scan hours of blocks, not years**

### Recovery Command

```bash
npm run hive:recover -- --from-block=GENESIS_BLOCK
npm run hive:recover -- --from-block=last_backup_block
npm run hive:recover -- --verify-only  # check DB against chain without modifying
```

---

## 8. Anti-Cheat Design

### Threat Model

| Threat | Mitigation |
|--------|-----------|
| Player forges a win | Match results are signed by `@ragnarokpoker` game account, not players. Players cannot broadcast valid match results. |
| Player edits profile stats | Profile metadata is a convenience cache. Real stats are computed from match_result chain records signed by the game. |
| Player transfers NFT they don't own | Game validates `required_posting_auths` signer matches `current_owner` in the ledger before honoring a transfer. |
| Player replays an old transfer | Each transaction has a unique `hive_tx_id`. The game deduplicates by tx_id. |
| Player mints fake NFTs | Only `@ragnarokpoker` can broadcast valid `nft_mint` actions. Player-signed mints are ignored. |
| Database tampered with | Database can be rebuilt from chain. Chain records are immutable and signed. |
| Game server compromised | The `@ragnarokpoker` posting key is the critical secret. Rotate immediately if compromised. All prior records remain valid. |

### Trust Hierarchy

```
MOST TRUSTED
    │
    ├── Hive blockchain (immutable, public, verifiable by anyone)
    │
    ├── Game server (@ragnarokpoker account — signs match results)
    │
    ├── Game database (fast cache, rebuildable from chain)
    │
    └── Player profile metadata (convenience display, player-writable)
    │
LEAST TRUSTED
```

### Verification

Anyone can independently verify a player's record:
1. Scan the chain for all `ragnarok_poker` custom_json ops signed by `@ragnarokpoker`
2. Filter for match results containing the player's username
3. Count wins and losses
4. Compare against the player's displayed profile stats

This is fully transparent and requires zero trust in the game operator's database.

---

## 9. Integration Points with Existing Code

### Where Blockchain Touches the Game

There is exactly **one** integration point in the existing game code:

```
resolvePokerCombat() or hero death
        │
        ▼
handleCombatEnd() in useRagnarokCombatController.ts
        │
        ▼
NEW: if (hiveSession.isAuthenticated) {
       hiveSyncManager.recordMatchResult(resolution, combatState)
     }
```

Everything else is in the new `hive/` module. The existing combat system, card effects, poker mechanics, UI — none of it changes.

### New Server Endpoints

```
POST   /api/hive/auth/login          — Initiate Keychain login challenge
POST   /api/hive/auth/verify         — Verify signed challenge, create session
POST   /api/hive/auth/logout         — End session

GET    /api/hive/player/:username     — Get player stats
GET    /api/hive/matches/:username    — Get match history (from DB)
GET    /api/hive/leaderboard          — Top players by rank points

POST   /api/hive/match-result         — Record match (server-internal, not player-facing)

GET    /api/hive/nft/:nftId           — Get NFT details and ownership
GET    /api/hive/nft/owner/:username  — Get all NFTs owned by player
POST   /api/hive/nft/mint             — Mint NFT (admin/game-triggered)
GET    /api/hive/nft/verify/:nftId    — Verify ownership against chain

GET    /api/hive/recovery/status      — Check sync status
POST   /api/hive/recovery/scan        — Trigger chain recovery scan (admin)
```

### New File Structure

```
client/src/hive/
├── components/
│   ├── HiveLoginButton.tsx        — Keychain login UI
│   ├── HiveProfileBadge.tsx       — Shows Hive username + rank
│   └── HiveMatchHistory.tsx       — On-chain verified match history
├── hooks/
│   ├── useHiveAuth.ts             — Authentication state + Keychain calls
│   └── useHiveProfile.ts          — Player stats from API
└── stores/
    └── hiveStore.ts               — Zustand store for Hive session state

server/
├── hive/
│   ├── gateway.ts                 — Layer 1: hive-tx wrapper (broadcast, query)
│   ├── sync.ts                    — Layer 3: broadcast + retry + recovery logic
│   ├── auth.ts                    — Keychain challenge/verify
│   ├── contracts.ts               — Data contract schemas + validation
│   └── recovery.ts                — Chain scan + DB rebuild
├── routes/
│   └── hiveRoutes.ts              — Express routes for /api/hive/*
```

---

## 10. Environment Variables

```
# Game's Hive account credentials (SECRET — never expose)
HIVE_ACCOUNT_USERNAME=ragnarokpoker
HIVE_POSTING_KEY=5J...                    # posting private key for broadcasting

# Chain configuration
HIVE_GENESIS_BLOCK=<block number>         # first-ever ragnarok_poker broadcast
HIVE_CUSTOM_JSON_ID=ragnarok_poker        # protocol identifier
HIVE_PROTOCOL_VERSION=1                   # current data contract version

# Optional: preferred API nodes (defaults built into hive-tx)
HIVE_API_NODES=https://api.hive.blog,https://api.deathwing.me
```

---

## 11. Implementation Phases

### Phase 1: Foundation (Build First)
- [ ] Install `hive-tx` package
- [ ] Create Hive Gateway module (broadcast + query wrapper)
- [ ] Create database tables (hive_players, match_results, broadcast_queue)
- [ ] Build Sync Manager with retry queue
- [ ] Add match result recording after combat resolution
- [ ] Set up `@ragnarokpoker` Hive account

### Phase 2: Player Identity
- [ ] Hive Keychain login flow (challenge/verify)
- [ ] Session management tied to Hive username
- [ ] HiveLoginButton component
- [ ] Player profile display (stats from DB)

### Phase 3: On-Chain Stats
- [ ] Profile metadata push (win/loss to player's Hive account)
- [ ] Leaderboard from match_results table
- [ ] Match history page with chain verification links

### Phase 4: NFT Cards
- [ ] NFT mint flow (pack opening → chain broadcast)
- [ ] NFT ownership verification
- [ ] NFT transfer via Keychain
- [ ] Collection view filtered by ownership
- [ ] Integration with ImmutableRunes for card art storage

### Phase 5: Recovery & Verification
- [ ] Chain recovery script (rebuild DB from genesis block)
- [ ] Integrity verification (compare DB against chain)
- [ ] Admin dashboard for broadcast queue monitoring
- [ ] Public verification endpoint (anyone can audit a player's record)

---

## 12. Dependencies

| Package | Purpose | Size |
|---------|---------|------|
| `hive-tx` | Blockchain I/O (broadcast, query, key management) | 29KB |
| `drizzle-orm` | Database ORM (already installed) | existing |
| `pg` | PostgreSQL driver (already installed) | existing |

No new system dependencies required. Hive Keychain is a browser extension installed by the player — it's not a code dependency.

---

## 13. Security Checklist

- [ ] `HIVE_POSTING_KEY` stored as a Replit secret, never in code or logs
- [ ] Match results only accepted from authenticated game server sessions
- [ ] NFT transfers validated: signer must be current owner
- [ ] All `custom_json` payloads validated against schema before broadcast
- [ ] Rate limiting on broadcast endpoints
- [ ] Recovery script validates `required_posting_auths` matches `@ragnarokpoker` for match/mint ops
- [ ] No active key operations — posting authority only
- [ ] Hive Keychain handles all player key management (game never sees private keys)

---

## 14. Glossary

| Term | Meaning |
|------|---------|
| `custom_json` | A Hive blockchain operation for broadcasting arbitrary JSON data (max 8,192 bytes) |
| `posting key` | Lower-privilege Hive key used for social actions and custom_json. Cannot move funds. |
| `active key` | Higher-privilege Hive key that can transfer tokens. We never use this. |
| `Hive Keychain` | Browser extension that securely manages Hive keys and signs transactions |
| `Resource Credits (RC)` | Hive's rate-limiting system. Broadcasting costs RC, which regenerates based on Hive Power |
| `hive-tx` | Lightweight TypeScript library for building and broadcasting Hive transactions |
| `HAF` | Hive Application Framework — full blockchain indexer. Overkill for our current needs but available for future scale. |
| `ImmutableRunes` | Partner NFT protocol for storing card art immutably on Hive |
| `genesis block` | The block number where our first `custom_json` was broadcast. Used as scan starting point for recovery. |

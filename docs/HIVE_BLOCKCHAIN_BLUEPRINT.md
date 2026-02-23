# Ragnarok — Hive Blockchain Integration Blueprint

**Status**: Phase 2 Design Document
**Layer**: Hive Layer 1 (no Hive-Engine dependency)
**Model**: Fixed-supply NFT cards, decentralized P2P gameplay, cryptographic anti-cheat

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Layer 1 NFT Architecture](#2-layer-1-nft-architecture)
3. [Genesis Distribution](#3-genesis-distribution)
4. [Ownership Reader / HAF Indexer](#4-ownership-reader--haf-indexer)
5. [Player-Signed Transfers](#5-player-signed-transfers)
6. [WASM Game Logic Module](#6-wasm-game-logic-module)
7. [Cryptographic Match Protocol](#7-cryptographic-match-protocol)
8. [Anti-Cheat Design](#8-anti-cheat-design)
9. [P2P Integration with Existing Architecture](#9-p2p-integration-with-existing-architecture)
10. [Pack Sales & Economy](#10-pack-sales--economy)
11. [Implementation Phases](#11-implementation-phases)
12. [File Structure](#12-file-structure)
13. [Key Design Invariants](#13-key-design-invariants)

---

## 1. System Overview

Ragnarok uses Hive Layer 1 custom JSON operations as an immutable ledger for card ownership. There are no smart contracts, no Hive-Engine dependency, and no ongoing server involvement after the genesis distribution.

### Core Principle

```
Blockchain = the ledger (what happened, immutable)
Reader     = the interpreter (what it means, open-source, deterministic)
Client     = the UI (what you see, WASM-verified)
P2P        = the gameplay (what you do, cryptographically signed)
```

### Trust Model

| Actor | Can do | Cannot do |
|---|---|---|
| Ragnarok account | Mint during genesis window only | Mint after seal, move player cards |
| Players | Transfer their own cards | Transfer cards they don't own |
| Reader | Interpret ownership from chain | Override chain history |
| Anyone | Audit all transactions | Falsify Hive blockchain history |

---

## 2. Layer 1 NFT Architecture

### Why not Hive-Engine?

Hive-Engine is a second layer with its own nodes, fees, and upgrade paths. For a **fixed-supply, sealed collection** that never needs rule changes after launch, a deterministic L1 reader is simpler and more trustworthy — there is no team that can later upgrade the contract.

### Custom JSON App ID

All Ragnarok transactions use a single app identifier:

```
app id: "ragnarok-cards"
```

This namespaces all operations. Any Hive node can filter for this app ID and reconstruct full ownership history from block 0.

### Operation Types

```json
{ "app": "ragnarok-cards", "action": "genesis",   ... }
{ "app": "ragnarok-cards", "action": "mint",      ... }
{ "app": "ragnarok-cards", "action": "transfer",  ... }
{ "app": "ragnarok-cards", "action": "burn",      ... }
{ "app": "ragnarok-cards", "action": "seal",      ... }
```

The reader processes these in block order. State is fully reproducible by replaying from block 0.

---

## 3. Genesis Distribution

### 3.1 Genesis Broadcast (one-time, ever)

The Ragnarok account broadcasts a single genesis transaction before any minting begins. This defines the entire supply forever.

```json
{
  "app": "ragnarok-cards",
  "action": "genesis",
  "version": "1.0",
  "total_supply": 500000,
  "card_distribution": {
    "legendary":  5000,
    "epic":       50000,
    "rare":       150000,
    "common":     295000
  },
  "card_set": "genesis",
  "seal_on_exhaustion": true,
  "reader_version": "1.0",
  "reader_hash": "sha256:<hash_of_reader_v1.0_source>",
  "announced_at": "https://hive.blog/@ragnarok/genesis-announcement"
}
```

**What this commits to:**
- Total supply is hard-capped at 500,000 cards, ever
- The reader version that interprets ownership is pinned by hash
- `seal_on_exhaustion: true` means the reader stops accepting mint operations once the count reaches 500,000 — even from the Ragnarok account

### 3.2 Mint Batch (during pack sales only)

Each time a player buys a pack, Ragnarok broadcasts:

```json
{
  "app": "ragnarok-cards",
  "action": "mint",
  "to": "player_hive_account",
  "pack_id": "pack-20240101-00001",
  "cards": [
    { "nft_id": "gen1-common-000001", "card_id": "einherjar-warrior", "rarity": "common" },
    { "nft_id": "gen1-common-000002", "card_id": "valkyrie-shield",   "rarity": "common" },
    { "nft_id": "gen1-rare-000001",   "card_id": "odin-allfather",    "rarity": "rare"   }
  ]
}
```

**Key properties:**
- `nft_id` is globally unique and never reused
- The reader tracks running totals per rarity — mint rejected if cap exceeded
- Only transactions broadcast by the Ragnarok account are valid mints; anyone else's mint is ignored

### 3.3 Seal Broadcast

After all packs are sold (or manually), Ragnarok broadcasts:

```json
{
  "app": "ragnarok-cards",
  "action": "seal",
  "genesis_version": "1.0",
  "final_supply": 498350,
  "sealed_at_block": 89234567,
  "note": "All genesis cards distributed. No further minting possible."
}
```

After this block, the reader hard-ignores all future mint operations from any account. The Ragnarok account's signing key is now irrelevant — there is nothing left to mint and nothing to steal.

---

## 4. Ownership Reader / HAF Indexer

### 4.1 What the Reader Does

The reader is an open-source Node.js service that:
1. Streams Hive blocks via HAF (Hive Application Framework)
2. Filters for `app: "ragnarok-cards"` custom JSON operations
3. Applies the ruleset defined in the genesis broadcast
4. Maintains a PostgreSQL ownership table
5. Exposes a read-only HTTP API for the game client

### 4.2 Reader Rules (encoded in v1.0)

```
VALID mint:    broadcaster == ragnarok_account AND pre-seal AND supply not exhausted
VALID transfer: broadcaster == from_account AND nft_id owned by from_account
VALID burn:    broadcaster == owner_account AND nft_id owned by owner_account
INVALID:       anything else — silently ignored, no state change
```

These rules are fixed at genesis. The reader software version is pinned by hash in the genesis broadcast. Anyone can verify they're running the canonical reader.

### 4.3 Database Schema

```sql
-- Core ownership table
CREATE TABLE nft_ownership (
  nft_id          TEXT PRIMARY KEY,
  card_id         TEXT NOT NULL,          -- e.g. "einherjar-warrior"
  rarity          TEXT NOT NULL,
  owner_account   TEXT NOT NULL,          -- Hive username
  minted_at_block BIGINT NOT NULL,
  minted_in_pack  TEXT NOT NULL,
  genesis_version TEXT NOT NULL DEFAULT '1.0'
);

-- Transfer history (append-only)
CREATE TABLE nft_transfers (
  id              BIGSERIAL PRIMARY KEY,
  nft_id          TEXT NOT NULL,
  from_account    TEXT,                   -- NULL for genesis mint
  to_account      TEXT NOT NULL,
  block_num       BIGINT NOT NULL,
  tx_id           TEXT NOT NULL,
  timestamp       TIMESTAMPTZ NOT NULL
);

-- Supply tracking
CREATE TABLE supply_counters (
  rarity          TEXT PRIMARY KEY,
  cap             INTEGER NOT NULL,
  minted          INTEGER NOT NULL DEFAULT 0
);

-- Seal state
CREATE TABLE genesis_state (
  version         TEXT PRIMARY KEY,
  sealed          BOOLEAN NOT NULL DEFAULT false,
  sealed_at_block BIGINT,
  final_supply    INTEGER
);
```

### 4.4 Reader API

```
GET /owner/:nft_id              → { owner, card_id, rarity, minted_at_block }
GET /collection/:hive_account   → [{ nft_id, card_id, rarity }, ...]
GET /card/:card_id/supply       → { cap, minted, remaining }
GET /genesis                    → { version, sealed, final_supply, reader_hash }
GET /verify/:nft_id/:account    → { owns: true/false }
```

All endpoints are read-only. The reader never writes to Hive — it only reads.

### 4.5 Redundancy

Run multiple reader instances (community-operated nodes welcome). The game client can be configured to query any reader, or fall back to a list. Since all readers process the same immutable chain, they all converge to the same state. Disagreement between readers = one is behind on block sync, not a data conflict.

---

## 5. Player-Signed Transfers

Once a card is in a player's account, only they can move it. No third party signature is involved.

### 5.1 Transfer

Player signs and broadcasts directly via Hive Keychain:

```json
{
  "app": "ragnarok-cards",
  "action": "transfer",
  "nft_id": "gen1-rare-000001",
  "from": "player_alice",
  "to": "player_bob",
  "memo": "traded for einherjar-warrior"
}
```

The operation must be broadcast from `player_alice`'s account (Hive verifies the signature). The reader updates ownership to `player_bob`.

### 5.2 Burn (optional)

```json
{
  "app": "ragnarok-cards",
  "action": "burn",
  "nft_id": "gen1-common-000042",
  "reason": "dust_conversion"
}
```

Burned cards are removed from circulation permanently. Total circulating supply decreases. This could be used for crafting mechanics.

### 5.3 Deck Verification Before Match

Before a P2P match begins, both players prove they own the cards in their deck:

```
For each card in player's deck:
  Query reader: GET /verify/:nft_id/:hive_account → { owns: true }

If any card returns owns: false → deck is invalid → match refused
```

This happens at match handshake, enforced by both clients. A player cannot use cards they don't own.

---

## 6. WASM Game Logic Module

### 6.1 Why WASM

JavaScript can be modified by the player. WASM compiled from source has a content hash — modify one byte and the hash changes. Both clients verify they're running identical game logic before accepting moves from each other.

### 6.2 What Goes in WASM

The WASM module contains all **deterministic game rules**:

```
ragnarok-engine.wasm:
  - Card effect resolution
  - Attack/damage calculation
  - Poker hand evaluation
  - Mana cost validation
  - Legal move checking
  - State transition function: (GameState, Move) → GameState
```

What stays in React/TypeScript (UI only):
- Rendering
- Animations
- Sound
- User input handling
- Network messaging

### 6.3 WASM Hash Verification at Handshake

```typescript
// At P2P connection
async function verifyEngineVersion(peer: DataConnection) {
  const myHash = await computeWasmHash('/ragnarok-engine.wasm');

  // Fetch canonical hash from Hive (or HAF reader)
  const canonicalHash = await reader.getGenesisField('wasm_hash');

  if (myHash !== canonicalHash) {
    throw new Error('Game engine mismatch — update your client');
  }

  // Exchange hashes with peer
  peer.send({ type: 'engine_handshake', wasm_hash: myHash });

  const peerHash = await waitForPeerHash(peer);
  if (peerHash !== myHash) {
    throw new Error('Peer running different engine version');
  }
}
```

### 6.4 Existing Code Migration

The following files in the current codebase are candidates for WASM extraction:

| Current file | WASM candidate |
|---|---|
| `game/utils/gameUtils.ts` | Core state machine |
| `game/stores/combat/pokerCombatSlice.ts` | Poker resolution |
| `game/combat/modules/BettingEngine.ts` | Betting rules |
| `game/combat/modules/SmartAI.ts` | AI (for offline play) |

The React stores (`gameStore.ts`, `pokerCombatSlice.ts`) become thin wrappers that call into WASM and reflect the returned state.

---

## 7. Cryptographic Match Protocol

This eliminates the 1v1 consensus problem. Neither player can fake a game result without the other's cryptographic cooperation.

### 7.1 Deck Commitment (before cards are revealed)

```
Step 1: Each player commits to their deck seed before the match

  Alice: H(seed_A) = sha256("alice_random_salt_12345")
  Bob:   H(seed_B) = sha256("bob_random_salt_67890")

  Alice broadcasts H(seed_A) to Bob (and optionally to Hive)
  Bob broadcasts H(seed_B) to Alice

Step 2: Both players reveal their seeds

  Alice reveals: seed_A = "alice_random_salt_12345"
  Bob reveals:   seed_B = "bob_random_salt_67890"

  Bob verifies: sha256(seed_A) == H(seed_A) they received
  Alice verifies: sha256(seed_B) == H(seed_B) they received

Step 3: Final game seed = sha256(seed_A + seed_B)

  Neither player could have predicted this before the reveal.
  Neither player can manipulate it without the other detecting the fraud.
```

This determines the card draw order. Neither player controls randomness.

### 7.2 Move Signing (during gameplay)

Every game action is signed by the acting player and countersigned by the opponent:

```typescript
interface SignedMove {
  move_id:        number;              // Sequential
  player:         'alice' | 'bob';
  action:         GameAction;          // play_card, attack, end_turn, etc.
  prev_state_hash: string;             // sha256 of state before this move
  new_state_hash:  string;             // sha256 of state after this move
  player_sig:     string;              // Acting player's signature
  opponent_sig?:  string;              // Opponent confirms state transition
}
```

Opponent signs only after their local WASM produces the same `new_state_hash`. If hashes disagree, a cheating attempt is detected and the match is terminated.

### 7.3 Match Transcript

The complete ordered list of `SignedMove` objects is the match transcript. It is:
- Self-verifying (each move references the previous hash)
- Mutually authenticated (both signatures on every state)
- Replay-auditable (anyone can reconstruct the full game)

### 7.4 Result Broadcast to Hive

At game end, both players co-sign the result:

```json
{
  "app": "ragnarok-cards",
  "action": "match_result",
  "match_id": "match-20240101-alice-bob-001",
  "winner": "alice",
  "loser": "bob",
  "final_state_hash": "sha256:0xABCDEF...",
  "transcript_hash": "sha256:0x123456...",
  "transcript_ipfs": "ipfs://Qm...",
  "alice_sig": "...",
  "bob_sig": "...",
  "played_at_block": 89234600
}
```

This goes on Hive as an immutable record. Ladder rankings, ban systems, and reward distributions read from this log. A result without both signatures is ignored by the reader.

### 7.5 Dispute: One Player Disconnects

If a player disconnects mid-match:
- The partial transcript proves who was winning and who disconnected
- The remaining player broadcasts the partial transcript
- The reader awards a win to the player who stayed
- The disconnector's Hive account is flagged (configurable penalty system)

---

## 8. Anti-Cheat Design

### 8.1 Threat Model

| Attack | Defense |
|---|---|
| Modified client accepts illegal moves | Opponent's WASM rejects → refuses to countersign → match stalls |
| Client reports false match result | Requires opponent's co-signature → impossible without collusion |
| Replay attack (reuse old transcript) | match_id includes block hash + timestamp, unique per match |
| Sybil attack (fake accounts) | Hive account creation has PoW cost; karma/RC system |
| Deck cheating (using unowned cards) | Deck verified against reader at handshake before match starts |
| Randomness manipulation | Commit-reveal scheme — neither player controls the seed |

### 8.2 What Client-Side Checks Still Do

Client-side SHA checks on the WASM module are **not a security guarantee** — a determined attacker can modify them. They serve a different purpose:

- **Deterrence**: Most players won't bother modifying their client
- **Accident prevention**: Detects outdated clients automatically
- **UX**: Gives a clear error message when the client is wrong version

Security comes from the **cryptographic protocol** (opponent won't countersign illegal moves), not from the hash check.

### 8.3 Ban System

```json
{
  "app": "ragnarok-cards",
  "action": "flag_account",
  "account": "cheater_hive",
  "reason": "invalid_transcript_submitted",
  "evidence_tx": "abc123def456",
  "banned_by": "ragnarok-account"
}
```

The game client reads the ban list from Hive at startup. Banned accounts cannot find matches. Ban evidence is public and auditable — anyone can verify the proof.

---

## 9. P2P Integration with Existing Architecture

The game currently uses PeerJS (WebRTC) for P2P. The Hive layer adds:

```
Current flow:
  Player A ←──── WebRTC (PeerJS) ────→ Player B

New flow:
  Player A ←──── WebRTC (PeerJS) ────→ Player B
       │                                      │
       └──── Hive L1 (match result) ──────────┘
       │                                      │
       └──── HAF Reader (deck verify) ────────┘
```

### 9.1 Matchmaking Integration

Add to existing `matchmakingRoutes.ts`:

```typescript
// Before allowing a match to start, verify both players' decks
async function verifyDecksOnChain(
  playerAccount: string,
  deck: CardInstance[]
): Promise<boolean> {
  for (const card of deck) {
    if (!card.nft_id) continue; // Skip non-NFT cards (dev mode)
    const owned = await readerApi.verify(card.nft_id, playerAccount);
    if (!owned) return false;
  }
  return true;
}
```

### 9.2 P2P Message Protocol Extension

Add to existing `useP2PSync.ts` message types:

```typescript
type P2PMessage =
  | { type: 'engine_handshake'; wasm_hash: string; hive_account: string }
  | { type: 'deck_commit';      deck_hash: string }
  | { type: 'seed_commit';      seed_hash: string }
  | { type: 'seed_reveal';      seed: string }
  | { type: 'signed_move';      move: SignedMove }
  | { type: 'match_result';     result: SignedResult }
  // ... existing message types
```

### 9.3 Non-Breaking: NFT Cards Alongside Normal Cards

During the transition period, not all cards need to be NFTs. Add `nft_id?: string` to the card instance type:

```typescript
interface CardInstance {
  // ... existing fields
  nft_id?: string;  // Present if this is a Hive NFT card; absent for demo/dev cards
}
```

The deck verifier skips cards without `nft_id`. This lets the game run in both modes:
- **Dev/demo mode**: All cards, no blockchain
- **NFT mode**: Deck must be verified on-chain before ranked matches

---

## 10. Pack Sales & Economy

### 10.1 Purchase Flow

```
1. Player connects Hive Keychain
2. Player selects pack type and quantity
3. Client shows pack price in HIVE or HBD
4. Player approves transfer via Keychain:
     Transfer X HIVE from player_account to ragnarok-account
     Memo: "pack:genesis:3"  ← 3 genesis packs
5. Server detects the transfer on Hive
6. Server broadcasts mint transaction for each pack:
     { "action": "mint", "to": "player_account", "cards": [...] }
7. Client queries reader: collection updated
8. Pack opening animation plays with the actual NFT card IDs
```

### 10.2 Pricing

Prices are set in HIVE/HBD (stableish pegged asset). No new token needed. No speculation on a game token. Players just use their existing Hive wallets.

### 10.3 Supply Scarcity by Design

```
Genesis pack contents (example):
  5 cards per pack
  Guaranteed rarity distribution per pack:
    3 commons    (from 295,000 total)
    1 rare       (from 150,000 total)
    1 epic/legendary (1-in-20 chance legendary, from 50,000 / 5,000 total)

Once 50,000 epics are minted: no more epic packs possible
Once 5,000 legendaries are minted: no more legendary drops possible

This is enforced by the reader — Ragnarok cannot override it.
```

---

## 11. Implementation Phases

### Phase 2A — Foundation (est. 2-4 weeks)

- [ ] Set up Ragnarok Hive account
- [ ] Write and publish genesis design doc as Hive post (public commitment)
- [ ] Build reader v1.0 (Node.js + PostgreSQL + HAF)
- [ ] Implement reader API endpoints
- [ ] Add `nft_id` field to card types (non-breaking)
- [ ] Build Hive Keychain connection in client (`useHiveKeychain.ts`)
- [ ] Test mint/transfer/verify on Hive testnet

### Phase 2B — Match Protocol (est. 3-5 weeks)

- [ ] Extract game rule engine to pure TypeScript module (no React deps)
- [ ] Implement commit-reveal deck seeding
- [ ] Implement `SignedMove` protocol in P2P layer
- [ ] Add WASM hash check at P2P handshake
- [ ] Test full match with transcript generation
- [ ] Implement match result broadcast to Hive

### Phase 2C — Genesis Launch (est. 2-3 weeks)

- [ ] Compile game engine to WASM
- [ ] Pin WASM hash in genesis broadcast
- [ ] Deploy HAF reader to production (minimum 2 instances)
- [ ] Broadcast genesis transaction on Hive mainnet
- [ ] Open pack sales

### Phase 2D — Anti-Cheat & Ladder (est. ongoing)

- [ ] Ban system (on-chain evidence, reader-enforced)
- [ ] Ranked ladder using on-chain match results
- [ ] Community reader nodes (documentation + Docker image)
- [ ] Dispute resolution process

---

## 12. File Structure

New files to create:

```
client/src/
├── blockchain/
│   ├── HiveKeychainProvider.tsx     # Keychain context + auth
│   ├── useHiveKeychain.ts           # Hook for signing operations
│   ├── useNFTCollection.ts          # Query reader for player's cards
│   ├── useDeckVerification.ts       # Verify deck ownership before match
│   └── types.ts                     # NFT, Transfer, MatchResult types

├── game/
│   ├── engine/
│   │   ├── ragnarok-engine.wasm     # Compiled game logic
│   │   ├── wasmLoader.ts            # WASM init + hash verification
│   │   └── engineBridge.ts          # TypeScript ↔ WASM interface
│   └── protocol/
│       ├── matchProtocol.ts          # SignedMove, commit-reveal logic
│       ├── transcriptBuilder.ts      # Assemble + verify transcripts
│       └── resultBroadcaster.ts     # Publish match_result to Hive

server/
├── blockchain/
│   ├── hiveMintService.ts           # Detect HIVE transfers, broadcast mints
│   ├── packOpeningService.ts        # Assign cards to packs, call mint
│   └── genesisManager.ts            # Track supply, enforce seal

reader/ (separate service)
├── index.ts                         # HAF stream processor
├── rules.ts                         # Ownership rules (v1.0, immutable)
├── db/
│   ├── schema.sql
│   └── queries.ts
├── api/
│   └── routes.ts                    # Read-only HTTP API
└── Dockerfile
```

---

## 13. Key Design Invariants

These rules must never be violated, regardless of future development:

1. **The genesis broadcast is final.** Total supply, rarity caps, and reader version are set once and never changed.

2. **The reader is append-only.** It reads chain history and builds state. It never writes to Hive.

3. **Card transfers require the owner's key.** The Ragnarok account cannot move a card after it has been distributed. Only the holder's Hive private key can sign a transfer.

4. **Match results require both signatures.** A result signed by only one player is invalid and ignored by all readers.

5. **The WASM module hash is the version.** Two clients with different hashes cannot play each other. There is no fallback.

6. **Mints after the seal are ignored, always.** No exception, no admin override. The reader code that enforces this is pinned by hash at genesis.

7. **All rules are public.** The reader source code, the genesis broadcast, the WASM module, and this design document are all publicly accessible. Security comes from cryptography, not obscurity.

---

## References

- Hive custom JSON documentation: https://developers.hive.io/
- HAF (Hive Application Framework): https://gitlab.syncad.com/hive/haf
- dhive (Hive JS library): https://github.com/openhive-network/dhive
- Hive Keychain API: https://github.com/hive-keychain/hive-keychain-extension
- Mental poker (commit-reveal): Shamir, Rivest, Adleman (1979)
- Splinterlands architecture (reference implementation on Hive): https://splinterlands.com

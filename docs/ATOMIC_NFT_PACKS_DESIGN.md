# Atomic NFT Packs & Transfer Design

**Status**: Draft — Pre-Implementation Design
**Date**: 2026-03-17
**Authors**: Claude Opus 4.6, informed by NFTLox protocol audit
**Affects**: `protocol-core/apply.ts`, `replayDB.ts`, `HiveSync.ts`, `opSchemas.ts`, `hiveConfig.ts`

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current Architecture Recap](#2-current-architecture-recap)
3. [Upgrade 1: Atomic Transfers](#3-upgrade-1-atomic-transfers)
4. [Upgrade 2: Packs as NFTs (Functional DNA)](#4-upgrade-2-packs-as-nfts-functional-dna)
5. [New Op Types](#5-new-op-types)
6. [IndexedDB Schema Changes](#6-indexeddb-schema-changes)
7. [Replay Engine Changes](#7-replay-engine-changes)
8. [HiveSync Broadcast Changes](#8-hivesync-broadcast-changes)
9. [UI Flow Changes](#9-ui-flow-changes)
10. [Security Analysis](#10-security-analysis)
11. [Migration & Backward Compatibility](#11-migration--backward-compatibility)
12. [Vector Micro-Indexer (Future)](#12-vector-micro-indexer-future)
13. [Implementation Phases](#13-implementation-phases)
14. [Open Questions](#14-open-questions)

---

## 1. Executive Summary

Two protocol-level upgrades inspired by the NFTLox comparison audit:

| Upgrade | Impact | Risk | Effort |
|---------|--------|------|--------|
| **Atomic Transfers** | L1 visibility, anti-spam, explorer-native provenance | Low | ~3-5 files |
| **Packs as NFTs** | Tradeable sealed packs, functional DNA, richer secondary economy | Medium | ~8-12 files |

**Design philosophy**: An NFT should not be a static receipt of ownership — it should be a **functional component** whose DNA can alter game mechanics, be traded, and serve multiple purposes (card source, tournament key, collectible).

---

## 2. Current Architecture Recap

### How Transfers Work Today

```
User → HiveSync.transferCard(uid, recipient)
     → Keychain signs custom_json (Active key)
     → Hive includes in block
     → replayEngine polls, finds op
     → apply.ts: applyCardTransfer()
       - validates ownership, cooldown, nonce
       - card.owner = recipient
       - card.lastTransferBlock = blockNum
       - appends ProvenanceStamp
     → IndexedDB updated
     → UI refreshed
```

**Problem**: The transfer is a `custom_json` only. Standard Hive explorers (PeakD, HiveScan) show the raw JSON but don't register it as a value transfer. The card's provenance is only visible through our indexer.

### How Pack Opening Works Today

```
Phase 1: User → pack_commit (salt_commit, pack_type, quantity)
Phase 2: Wait for entropy block (commit_block + 3) to reach LIB
Phase 3: User → pack_reveal (commit_trx_id, user_salt)
         → seed = sha256(salt || commitTrxId || entropyBlockId || "1")
         → LCG draws N cards deterministically
         → Cards minted directly to user's account
```

**Problem**: The pack never exists as a transferable object. Users can't:
- Buy a sealed pack and sell it unopened
- Gift sealed packs to friends
- Use sealed packs as tournament entry tickets
- Collect rare sealed packs (factory-sealed premium)

---

## 3. Upgrade 1: Atomic Transfers

### Concept

Bundle every value-transfer `custom_json` with a **0.001 HIVE native transfer** to the recipient in a single atomic Hive transaction. This dual-anchors the operation in both the Ragnarok indexer AND Hive's financial ledger.

### Hive Transaction Format

Hive supports multi-operation transactions natively. A single signed transaction can contain both:

```json
{
  "operations": [
    ["custom_json", {
      "required_auths": ["alice"],
      "required_posting_auths": [],
      "id": "ragnarok-cards",
      "json": "{\"action\":\"card_transfer\",\"card_uid\":\"abc123\",\"to\":\"bob\"}"
    }],
    ["transfer", {
      "from": "alice",
      "to": "bob",
      "amount": "0.001 HIVE",
      "memo": "ragnarok:card_transfer:abc123"
    }]
  ]
}
```

Both operations succeed or fail atomically — Hive's transaction processing guarantees this.

### Which Ops Get Atomic Anchoring

| Op | Gets 0.001 HIVE transfer? | Recipient | Rationale |
|----|--------------------------|-----------|-----------|
| `card_transfer` | **YES** | Card recipient | Custody change = value transfer |
| `pack_mint` (new) | **YES** | Pack buyer | Pack purchase = value transfer |
| `pack_transfer` (new) | **YES** | Pack recipient | Sealed pack custody change |
| `pack_burn` (new) | **NO** | N/A | Burn is self-action, no recipient |
| `burn` | **NO** | N/A | Destruction, no recipient |
| `match_result` | **NO** | N/A | Game outcome, no HIVE transfer |
| `reward_claim` | **NO** | N/A | Self-serve mint, no counterparty |
| `level_up` | **NO** | N/A | XP acknowledgement only |

### Transfer Memo Format

```
ragnarok:{action}:{primary_id}
```

Examples:
- `ragnarok:card_transfer:a1b2c3d4` — card UID
- `ragnarok:pack_transfer:pack_e5f6g7` — pack UID
- `ragnarok:pack_mint:standard:3` — pack type + quantity

The memo is **not parsed by the replay engine** — it's purely for L1 explorer readability. The `custom_json` payload remains the canonical data source.

### Replay Engine Validation

The replay engine gains one new validation rule for atomic ops:

```typescript
// In applyCardTransfer, applyPackTransfer, applyPackMint:
if (genesis.sealed) {
  // Post-seal: require companion HIVE transfer in same transaction
  const companionTransfer = await state.getCompanionTransfer(op.trxId);
  if (!companionTransfer) {
    return { status: 'rejected', reason: 'missing atomic HIVE transfer' };
  }
  if (companionTransfer.amount !== '0.001 HIVE') {
    return { status: 'rejected', reason: 'wrong atomic transfer amount' };
  }
  if (companionTransfer.to !== payload.to) {
    return { status: 'rejected', reason: 'atomic transfer recipient mismatch' };
  }
}
```

**Pre-seal ops are exempt** — backward compatibility with existing chain history.

### StateAdapter Extension

```typescript
interface StateAdapter {
  // ... existing methods ...

  // NEW: Look up companion transfer in same Hive transaction
  getCompanionTransfer(trxId: string): Promise<{
    from: string;
    to: string;
    amount: string;
    memo: string;
  } | null>;
}
```

### Implementation in clientStateAdapter.ts

The replay engine already receives full transaction data from `get_account_history`. Each history entry contains ALL operations in that transaction. The adapter needs to scan sibling operations for a `transfer` op in the same `trxId`.

```typescript
// clientStateAdapter.ts
async getCompanionTransfer(trxId: string): Promise<CompanionTransfer | null> {
  // During replay, the engine can store sibling ops per trxId
  // Alternatively, fetch the full transaction once via condenser_api
  const cached = this.trxSiblingCache.get(trxId);
  if (!cached) return null;

  const transfer = cached.find(op => op[0] === 'transfer');
  if (!transfer) return null;

  return {
    from: transfer[1].from,
    to: transfer[1].to,
    amount: transfer[1].amount,
    memo: transfer[1].memo,
  };
}
```

### Cost to Users

- **0.001 HIVE per transfer** (~$0.0003 USD at current prices)
- Plus Hive RC cost (already exists for custom_json)
- Negligible for legitimate users; meaningful barrier for spam bots at scale

### Benefits Summary

| Benefit | Before | After |
|---------|--------|-------|
| PeakD visibility | Raw JSON blob | Clear 0.001 HIVE transfer with memo |
| HiveScan tracking | Not indexed | Indexed as financial transfer |
| Explorer provenance | Only via our viewer | Any Hive explorer shows history |
| Anti-spam | RC only | RC + 0.001 HIVE economic cost |
| Wallet integration | Custom indexer needed | Standard wallet shows transfers |

---

## 4. Upgrade 2: Packs as NFTs (Functional DNA)

### Concept

A pack is no longer a protocol event — it becomes a **first-class NFT** with a deterministic DNA hash that mathematically encodes its contents. The pack exists as a transferable, tradeable, burnable object.

### Pack Lifecycle

```
              ┌────────────────────────┐
              │  PACK SEED DEFINITION  │
              │  (admin creates via    │
              │   genesis/mint)        │
              └──────────┬─────────────┘
                         │ pack_mint op
                         ↓
              ┌────────────────────────┐
              │   SEALED PACK NFT     │
              │  uid: "pack_{trxId}"  │
              │  dna: sha256(seed)     │
              │  owner: buyer          │
              │  packType: "standard"  │
              │  sealed: true          │
              │  tradeable: true       │
              └──────────┬─────────────┘
                         │
              ┌──────────┼──────────────┐
              │          │              │
              ↓          ↓              ↓
         ┌─────────┐ ┌────────┐  ┌──────────┐
         │ TRADE   │ │ GIFT   │  │  OPEN    │
         │ on      │ │ via    │  │  (burn)  │
         │ market  │ │ atomic │  │          │
         │         │ │ xfer   │  │          │
         └─────────┘ └────────┘  └────┬─────┘
                                      │ pack_burn op
                                      ↓
              ┌────────────────────────┐
              │  DETERMINISTIC UNPACK  │
              │  seed = sha256(        │
              │    packDna ||          │
              │    burnTrxId ||        │
              │    entropyBlockId      │
              │  )                     │
              │  LCG draws N cards     │
              └──────────┬─────────────┘
                         │ N new CardAssets
                         ↓
              ┌────────────────────────┐
              │   CARDS IN COLLECTION  │
              │  owner: pack opener    │
              │  mintSource: 'pack'    │
              │  mintTrxId: burnTrxId  │
              └────────────────────────┘
```

### Pack NFT Data Model

```typescript
interface PackAsset {
  // Identity
  uid: string;                    // "pack_{mintTrxId}:{index}"
  packType: PackType;             // 'starter' | 'standard' | 'premium' | 'mythic' | 'mega'

  // DNA — deterministic content identifier
  // The pack's DNA does NOT reveal its contents until burned.
  // Contents depend on: dna + burnTrxId + entropyBlockId (unknowable until burn)
  dna: string;                    // sha256(mintTrxId + ":" + index + ":" + packType)

  // Ownership
  ownerId: string;                // Current Hive account owner
  sealed: boolean;                // true = unopened, false = burned/opened

  // Provenance
  mintTrxId: string;              // Transaction that created this pack
  mintBlockNum: number;           // Block of creation
  lastTransferBlock: number;      // For 10-block cooldown
  provenanceChain: ProvenanceStamp[];
  officialMint?: OfficialMint;    // Proves @ragnarok minted it

  // Metadata
  cardCount: number;              // How many cards inside (5 for standard, 7 for premium, etc.)
  edition: string;                // 'alpha' | 'beta'

  // Polymorphic utility (future extensibility)
  utility?: PackUtility[];        // e.g., [{ type: 'tournament_ticket', tournamentId: '...' }]
}

type PackType = 'starter' | 'standard' | 'premium' | 'mythic' | 'mega';

interface PackUtility {
  type: 'tournament_ticket' | 'access_token' | 'crafting_reagent';
  metadata: Record<string, unknown>;
}
```

### DNA Derivation (Deterministic, Self-Describing)

The pack's DNA is computed at mint time and is immutable:

```typescript
function computePackDna(mintTrxId: string, index: number, packType: string): string {
  const input = `${mintTrxId}:${index}:${packType}`;
  return sha256(input);
}
```

The DNA alone does NOT reveal the cards inside. Card derivation requires the **burn transaction ID** and **entropy block ID**, which don't exist until the pack is opened. This prevents anyone from pre-computing pack contents.

### Card Derivation on Burn

When a pack is burned (opened), the cards are derived deterministically:

```typescript
function derivePackCards(
  packDna: string,
  burnTrxId: string,
  entropyBlockId: string,
  packType: PackType,
): DerivedCard[] {
  // Seed combines pack identity + burn entropy + block entropy
  const seed = sha256(`${packDna}|${burnTrxId}|${entropyBlockId}`);

  // Same LCG algorithm as current drawPackCards()
  const cardCount = PACK_SIZES[packType];
  const idRanges = PACK_ID_RANGES[packType];
  const cards: DerivedCard[] = [];

  let rng = lcgSeed(seed);
  for (let i = 0; i < cardCount; i++) {
    const { cardId, rarity } = drawOneCard(rng, idRanges);
    cards.push({
      uid: `${burnTrxId}:${i}`,
      cardId,
      rarity,
      mintSource: 'pack',
    });
    rng = lcgNext(rng);
  }

  return cards;
}
```

### Why This Is Better

| Feature | Current (Protocol Event) | New (Pack NFT) |
|---------|------------------------|----------------|
| Pack exists as NFT | No | Yes — uid, owner, provenance |
| Tradeable while sealed | No | Yes — atomic transfer like cards |
| Visible on Hive explorers | No | Yes — with 0.001 HIVE anchor |
| Deterministic contents | Yes (commit-reveal seed) | Yes (DNA + burn entropy) |
| Unpredictable before open | Yes (3-block delay) | Yes (burn trxId unknowable) |
| Secondary market | Impossible | Native — sell sealed packs |
| Polymorphic utility | N/A | Tournament tickets, access tokens |
| Collector value | N/A | Factory-sealed packs as collectibles |

---

## 5. New Op Types

### 5.1 `pack_mint` — Create Sealed Pack NFTs

**Broadcaster**: `@ragnarok` (admin) or any account purchasing from the store
**Auth**: Active (involves 0.001 HIVE transfer)
**Atomic**: YES — includes 0.001 HIVE transfer to pack recipient

```typescript
// Payload
interface PackMintPayload {
  action: 'pack_mint';
  pack_type: PackType;
  quantity: number;           // 1-10 packs per op
  to: string;                // Recipient Hive account
  // DNA is auto-computed, not in payload
}

// Validation
- Genesis must exist and be sealed
- pack_type must be valid
- quantity must be 1-10
- Companion 0.001 HIVE transfer must exist to `to` account
- Pack supply cap check (per pack_type)

// State mutations
for (let i = 0; i < quantity; i++) {
  const uid = `pack_${trxId}:${i}`;
  const dna = sha256(`${trxId}:${i}:${packType}`);
  putPack({
    uid,
    packType,
    dna,
    ownerId: payload.to,
    sealed: true,
    mintTrxId: trxId,
    mintBlockNum: blockNum,
    lastTransferBlock: blockNum,
    cardCount: PACK_SIZES[packType],
    edition: 'alpha',
    provenanceChain: [buildStampWithUrls(...)],
    officialMint: buildOfficialMint(...),
  });
  incrementPackSupply(packType);
}
```

### 5.2 `pack_transfer` — Transfer Sealed Pack

**Broadcaster**: Pack owner
**Auth**: Active
**Atomic**: YES — includes 0.001 HIVE transfer to recipient

```typescript
interface PackTransferPayload {
  action: 'pack_transfer';
  pack_uid: string;
  to: string;                // Recipient
  nonce?: number;            // Anti-replay
  memo?: string;
}

// Validation
- Pack must exist and be sealed
- Broadcaster must be current owner
- Recipient != sender
- Transfer cooldown (10 blocks)
- Nonce must advance (if provided)
- Companion 0.001 HIVE transfer must exist

// State mutations
pack.ownerId = payload.to;
pack.lastTransferBlock = blockNum;
pack.provenanceChain.push(buildStampWithUrls(...));
```

### 5.3 `pack_burn` — Open Pack (Burn + Derive Cards)

**Broadcaster**: Pack owner
**Auth**: Active (destructive — burns the pack NFT)
**Atomic**: NO — self-action, no counterparty

This replaces the old `pack_commit`/`pack_reveal` two-phase for NFT packs. The entropy comes from the burn transaction itself.

```typescript
interface PackBurnPayload {
  action: 'pack_burn';
  pack_uid: string;
  salt: string;              // User entropy contribution
  salt_commit?: string;      // Optional: pre-committed salt for extra security
}

// Validation
- Pack must exist and be sealed
- Broadcaster must be owner
- If salt_commit provided, sha256(salt) must match
- Entropy block (burnBlock + 3) must be ≤ LIB (same finality rule as pack_reveal)

// State mutations (two-phase internally)
// Phase 1: Record burn intent (on seeing the op)
pack.sealed = false;
pack.burnTrxId = trxId;
pack.burnBlock = blockNum;

// Phase 2: Derive cards (when entropy block is irreversible)
// This can happen in the same replay pass if the entropy block is already past LIB
const entropyBlockId = await getBlockId(blockNum + 3);
const cards = derivePackCards(pack.dna, trxId, entropyBlockId, pack.packType);

for (const card of cards) {
  // Same supply checks as current drawPackCards
  await putCard({
    uid: card.uid,
    cardId: card.cardId,
    ownerId: op.broadcaster,
    rarity: card.rarity,
    level: 1,
    xp: 0,
    edition: pack.edition,
    foil: 'standard',
    mintTrxId: trxId,
    mintBlockNum: blockNum,
    mintSource: 'pack',
    provenanceChain: [buildStampWithUrls(...)],
    officialMint: pack.officialMint, // Inherits from pack
  });
  incrementPackCardSupply(card.rarity, card.cardId);
}

// Delete the pack NFT (burned)
await deletePack(pack.uid);
```

### 5.4 Summary of All Ops (v1.1)

| Op | New? | Auth | Atomic? | Purpose |
|----|------|------|---------|---------|
| `genesis` | No | Active | No | Protocol init |
| `seal` | No | Active | No | Freeze admin |
| `mint_batch` | No | Active | No | Admin card mint |
| `card_transfer` | **Modified** | Active | **YES** | Card custody change |
| `burn` | No | Active | No | Card destruction |
| `level_up` | No | Posting | No | XP acknowledgement |
| `match_anchor` | No | Posting | No | Dual-sig session |
| `match_result` | No | Posting | No | Game outcome |
| `queue_join` | No | Posting | No | Enter queue |
| `queue_leave` | No | Posting | No | Leave queue |
| `reward_claim` | No | Posting | No | Self-serve reward |
| `pack_commit` | **Deprecated** | Posting | No | *(legacy, pre-NFT packs)* |
| `pack_reveal` | **Deprecated** | Posting | No | *(legacy, pre-NFT packs)* |
| `legacy_pack_open` | No | Posting | No | Pre-seal compat |
| `pack_mint` | **NEW** | Active | **YES** | Create sealed pack NFT |
| `pack_transfer` | **NEW** | Active | **YES** | Transfer sealed pack |
| `pack_burn` | **NEW** | Active | No | Open pack (burn + derive) |

---

## 6. IndexedDB Schema Changes

### New Store: `packs`

```typescript
// replayDB.ts — add to IDB schema (version bump: v6 → v7)
const db = await openDB('ragnarok-chain', 7, {
  upgrade(db, oldVersion) {
    // ... existing stores ...

    if (oldVersion < 7) {
      const packStore = db.createObjectStore('packs', { keyPath: 'uid' });
      packStore.createIndex('by_owner', 'ownerId');
      packStore.createIndex('by_sealed', 'sealed');

      const packSupplyStore = db.createObjectStore('pack_supply', { keyPath: 'packType' });
    }
  }
});
```

### Pack Store Schema

| Field | Type | Indexed | Description |
|-------|------|---------|-------------|
| `uid` | string | Primary key | `"pack_{trxId}:{index}"` |
| `packType` | string | No | Pack tier |
| `dna` | string | No | Deterministic content hash |
| `ownerId` | string | `by_owner` | Current Hive account |
| `sealed` | boolean | `by_sealed` | true = unopened |
| `mintTrxId` | string | No | Origin transaction |
| `mintBlockNum` | number | No | Origin block |
| `lastTransferBlock` | number | No | Cooldown tracker |
| `cardCount` | number | No | Cards inside |
| `edition` | string | No | 'alpha' / 'beta' |
| `provenanceChain` | ProvenanceStamp[] | No | Transfer history |
| `officialMint` | OfficialMint | No | Mint proof |
| `burnTrxId` | string? | No | Set on burn |
| `burnBlock` | number? | No | Set on burn |
| `utility` | PackUtility[]? | No | Polymorphic uses |

### Pack Supply Store Schema

| Field | Type | Description |
|-------|------|-------------|
| `packType` | string | Primary key |
| `minted` | number | Total packs minted |
| `burned` | number | Total packs opened |
| `cap` | number | Supply limit (0 = unlimited) |

### StateAdapter Extensions

```typescript
interface StateAdapter {
  // ... existing ...

  // Pack operations (NEW)
  getPack(uid: string): Promise<PackAsset | null>;
  putPack(pack: PackAsset): Promise<void>;
  deletePack(uid: string): Promise<void>;
  getPacksByOwner(owner: string): Promise<PackAsset[]>;
  getSealedPacksByOwner(owner: string): Promise<PackAsset[]>;

  // Pack supply tracking (NEW)
  getPackSupply(packType: string): Promise<PackSupplyRecord | null>;
  incrementPackSupply(packType: string): Promise<void>;
  incrementPackBurned(packType: string): Promise<void>;

  // Companion transfer lookup (NEW)
  getCompanionTransfer(trxId: string): Promise<CompanionTransfer | null>;
}
```

---

## 7. Replay Engine Changes

### Transaction Sibling Caching

The replay engine needs to see ALL operations in a transaction, not just the `custom_json`. Currently, `get_account_history` returns one entry per operation, but operations in the same transaction share a `trx_id`.

```typescript
// replayEngine.ts — collect sibling ops per transaction
const trxSiblingMap = new Map<string, HiveOperation[]>();

for (const [idx, entry] of historyPage) {
  const trxId = entry.trx_id;
  if (!trxSiblingMap.has(trxId)) {
    trxSiblingMap.set(trxId, []);
  }
  trxSiblingMap.get(trxId)!.push(entry.op);
}

// Pass to state adapter for companion transfer lookups
stateAdapter.setTrxSiblings(trxSiblingMap);
```

### Op Registration

```typescript
// protocol-core/apply.ts — add new cases
switch (op.action) {
  // ... existing 14 cases ...
  case 'pack_mint': return applyPackMint(op, ctx, deps);
  case 'pack_transfer': return applyPackTransfer(op, ctx, deps);
  case 'pack_burn': return applyPackBurn(op, ctx, deps);
}
```

### Zod Schemas (opSchemas.ts)

```typescript
export const PackMintPayload = z.object({
  pack_type: z.enum(['starter', 'standard', 'premium', 'mythic', 'mega']),
  quantity: z.number().int().min(1).max(10),
  to: HiveUsername,
});

export const PackTransferPayload = z.object({
  pack_uid: z.string().min(1),
  to: HiveUsername,
  nonce: z.number().int().optional(),
  memo: z.string().max(256).optional(),
});

export const PackBurnPayload = z.object({
  pack_uid: z.string().min(1),
  salt: z.string().min(32),
  salt_commit: z.string().optional(),
});
```

---

## 8. HiveSync Broadcast Changes

### Multi-Operation Transaction Builder

```typescript
// HiveSync.ts — new method for atomic transactions
async broadcastAtomicTransaction(
  customJsonPayload: Record<string, unknown>,
  transfer: { to: string; amount: string; memo: string },
): Promise<HiveBroadcastResult> {
  // Build multi-op transaction
  const operations = [
    ['custom_json', {
      required_auths: [this.username],
      required_posting_auths: [],
      id: RAGNAROK_APP_ID,
      json: JSON.stringify({
        ...customJsonPayload,
        app: RAGNAROK_APP_ID,
      }),
    }],
    ['transfer', {
      from: this.username,
      to: transfer.to,
      amount: transfer.amount,
      memo: transfer.memo,
    }],
  ];

  // Keychain supports multi-op broadcasts via requestBroadcast
  return new Promise((resolve, reject) => {
    window.hive_keychain.requestBroadcast(
      this.username,
      operations,
      'Active',  // Active key required for transfers
      (response) => {
        if (response.success) resolve(response);
        else reject(new Error(response.message));
      }
    );
  });
}
```

### Updated transferCard()

```typescript
async transferCard(cardUid: string, toUser: string, memo?: string) {
  return this.broadcastAtomicTransaction(
    {
      action: 'card_transfer',
      card_uid: cardUid,
      to: toUser,
      memo,
    },
    {
      to: toUser,
      amount: '0.001 HIVE',
      memo: `ragnarok:card_transfer:${cardUid}`,
    }
  );
}
```

### New Pack Methods

```typescript
async mintPack(packType: PackType, quantity: number, toUser: string) {
  return this.broadcastAtomicTransaction(
    {
      action: 'pack_mint',
      pack_type: packType,
      quantity,
      to: toUser,
    },
    {
      to: toUser,
      amount: '0.001 HIVE',
      memo: `ragnarok:pack_mint:${packType}:${quantity}`,
    }
  );
}

async transferPack(packUid: string, toUser: string, memo?: string) {
  return this.broadcastAtomicTransaction(
    {
      action: 'pack_transfer',
      pack_uid: packUid,
      to: toUser,
      memo,
    },
    {
      to: toUser,
      amount: '0.001 HIVE',
      memo: `ragnarok:pack_transfer:${packUid}`,
    }
  );
}

async burnPack(packUid: string, salt: string, saltCommit?: string) {
  // Burns are NOT atomic (no counterparty)
  return this.broadcastCustomJson('rp_pack_burn', {
    pack_uid: packUid,
    salt,
    salt_commit: saltCommit,
  }, true); // Active key — destructive
}
```

---

## 9. UI Flow Changes

### Pack Store Page (PacksPage.tsx)

**Before**: User clicks "Open Pack" → commit-reveal two-phase → cards appear
**After**: User clicks "Buy Pack" → receives sealed pack NFT → can trade OR open it

```
┌─────────────────────────────────────────────┐
│                 PACK STORE                   │
│                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ Standard │  │ Premium  │  │  Mythic  │  │
│  │ 5 cards  │  │ 7 cards  │  │  7 cards │  │
│  │          │  │          │  │          │  │
│  │ [Buy 1]  │  │ [Buy 1]  │  │ [Buy 1]  │  │
│  └──────────┘  └──────────┘  └──────────┘  │
│                                              │
│  ─── YOUR SEALED PACKS ───                  │
│                                              │
│  ┌────────┐ ┌────────┐ ┌────────┐           │
│  │ Std ×2 │ │ Prm ×1 │ │ Mth ×1 │           │
│  │ [Open] │ │ [Open] │ │ [Open] │           │
│  │ [Gift] │ │ [Gift] │ │ [Gift] │           │
│  └────────┘ └────────┘ └────────┘           │
└─────────────────────────────────────────────┘
```

### Collection Page — Pack Inventory Section

A new tab or section showing sealed packs the user owns, with:
- Pack type and card count
- DNA hash (truncated, clickable to explorer)
- Mint date and provenance
- [Open Pack] button → pack_burn flow
- [Send Pack] button → pack_transfer flow

### Send Pack Modal

Identical to `SendCardModal.tsx` but for packs:
- Recipient username input
- Double-confirm safety
- Keychain Active key signing
- Atomic transfer (pack_transfer + 0.001 HIVE)

---

## 10. Security Analysis

### Attack: Front-Running Pack Burns

**Threat**: A node operator sees a `pack_burn` in the mempool and tries to front-run it to predict cards.

**Mitigation**: Cards derive from `sha256(packDna || burnTrxId || entropyBlockId)`. The `burnTrxId` is unique to the specific burn transaction and the `entropyBlockId` is 3 blocks in the future. Even if a front-runner sees the burn intent, they can't derive the cards because:
1. They don't know the burn's final `trxId` (assigned by the block producer)
2. They don't know the entropy block ID (3 blocks away)

### Attack: Pack DNA Rainbow Table

**Threat**: Someone pre-computes all possible card derivations for known pack DNAs.

**Mitigation**: The derivation includes `burnTrxId` (unique per burn) and `entropyBlockId` (unknowable at mint time). A rainbow table would need to enumerate all possible `(burnTrxId, entropyBlockId)` pairs — computationally infeasible.

### Attack: Pack Transfer Spam

**Threat**: Someone ping-pongs packs between accounts to bloat the provenance chain.

**Mitigation**:
1. 10-block transfer cooldown (same as cards)
2. 0.001 HIVE economic cost per transfer
3. Hive RC cost per operation
4. Provenance compaction after 50 stamps (same as cards)

### Attack: Fake Pack Minting

**Threat**: Non-admin account broadcasts `pack_mint`.

**Mitigation**: `pack_mint` requires broadcaster to be `@ragnarok` (admin account check in apply.ts). Or, if we allow user-initiated purchases, the atomic transfer is to `@ragnarok-treasury` (not the user), and the replay engine validates the transfer direction.

### Attack: Burning Someone Else's Pack

**Threat**: Account A tries to burn a pack owned by account B.

**Mitigation**: `applyPackBurn` checks `pack.ownerId === op.broadcaster`. Rejected if not owner.

---

## 11. Migration & Backward Compatibility

### Protocol Version

This is a **v1.1 extension**, not a breaking change. All existing v1 ops continue to work identically.

| Scenario | Behavior |
|----------|----------|
| Old `pack_commit` + `pack_reveal` | Still valid for pre-v1.1 chain history |
| New `pack_mint` + `pack_burn` | New pack flow for post-v1.1 |
| Old `card_transfer` (no HIVE anchor) | Still valid for pre-v1.1 chain history |
| New `card_transfer` (with HIVE anchor) | Required post-v1.1 seal update |
| Existing cards in IDB | Unchanged, no migration needed |
| Existing pack_commit records | Unchanged, old flow still processes |

### Activation Strategy

1. **Phase 1**: Deploy code that can READ both old and new ops
2. **Phase 2**: Admin broadcasts a `protocol_upgrade` op (new op type) specifying the activation block
3. **Phase 3**: After activation block, new rules enforced:
   - `card_transfer` requires companion HIVE transfer
   - `pack_commit`/`pack_reveal` deprecated (rejected)
   - `pack_mint`/`pack_transfer`/`pack_burn` accepted

### IndexedDB Migration

```typescript
// replayDB.ts — non-destructive upgrade
if (oldVersion < 7) {
  db.createObjectStore('packs', { keyPath: 'uid' });
  // ... indexes ...
  db.createObjectStore('pack_supply', { keyPath: 'packType' });
}
// Existing stores (cards, matches, etc.) are untouched
```

---

## 12. Vector Micro-Indexer (Future)

Not part of this implementation but designed to be compatible:

### Concept

A lightweight, Dockerized indexer node (Bun + Redis/Typesense) that:
- Replays the same `protocol-core/apply.ts` handlers
- Stores state in Redis for <50ms query latency
- Exposes WebSocket API for real-time state subscriptions
- Deployable for $5/month per node
- Open-source, community-operated

### Interface

```typescript
// Micro-indexer WebSocket API
ws.send(JSON.stringify({
  type: 'query',
  method: 'getPacksByOwner',
  params: { owner: 'alice' },
}));

// Response in <50ms
ws.onmessage = (event) => {
  const { packs } = JSON.parse(event.data);
  // [{ uid: 'pack_abc', sealed: true, dna: '...', packType: 'standard' }]
};
```

### How It Fits

```
Browser → WebSocket → Micro-Indexer (Bun + Redis)
                          ↓ (on startup)
                      Hive RPC → apply.ts → Redis
                          ↓ (live)
                      Hive RPC polling → apply.ts → Redis → push to WS clients
```

The micro-indexer runs the SAME `apply.ts` handlers as the browser replay engine. This guarantees state consistency across all nodes. The `StateAdapter` interface makes this trivial — Redis implements `StateAdapter` just like IndexedDB does.

---

## 13. Implementation Phases

### Phase 1: Atomic Transfers (Low Risk, High Value)

**Files changed**: ~5
**Estimated effort**: 1 session

1. Add `broadcastAtomicTransaction()` to `HiveSync.ts`
2. Update `transferCard()` to use atomic broadcast
3. Add `getCompanionTransfer()` to `StateAdapter` + `clientStateAdapter.ts`
4. Add companion transfer validation to `applyCardTransfer()` in `apply.ts`
5. Add transaction sibling caching to `replayEngine.ts`
6. Add `PackTransferPayload` schema to `opSchemas.ts`
7. Update `SendCardModal.tsx` to show "0.001 HIVE transfer included" info

### Phase 2: Pack NFTs (Medium Risk, High Value)

**Files changed**: ~10-12
**Estimated effort**: 2-3 sessions

1. Add `packs` + `pack_supply` stores to `replayDB.ts` (IDB v7)
2. Add `PackAsset` type to `HiveTypes.ts`
3. Add pack methods to `StateAdapter` + `clientStateAdapter.ts`
4. Implement `applyPackMint`, `applyPackTransfer`, `applyPackBurn` in `apply.ts`
5. Add Zod schemas to `opSchemas.ts`
6. Add `mintPack()`, `transferPack()`, `burnPack()` to `HiveSync.ts`
7. Add pack methods to `INFTBridge.ts` + both implementations
8. Add `packs` to `useHiveDataStore.ts` (Zustand)
9. Update `PacksPage.tsx` — buy packs → sealed inventory → open/gift
10. Create `SendPackModal.tsx` (clone of SendCardModal)
11. Add pack provenance viewer
12. Update `replayEngine.ts` hydration to include packs

### Phase 3: Micro-Indexer (Future, Separate Repo)

Not in scope for this sprint. Designed for compatibility — `StateAdapter` abstraction ensures drop-in Redis backend.

---

## 14. Open Questions

### Q1: Who Can Mint Packs?

**Option A**: Admin-only (`@ragnarok` broadcasts `pack_mint`, distributes to buyers)
**Option B**: Self-serve (user broadcasts `pack_mint` + sends HIVE to `@ragnarok-treasury`)

Option B is more decentralized but requires the replay engine to validate the HIVE transfer goes to the right account. Recommendation: **Start with Option A**, add Option B post-launch.

### Q2: Pack Supply Caps?

Should we cap the total number of packs per type? Recommendation: Yes — the same supply cap philosophy as cards. Suggested limits:

| Pack Type | Max Supply | Cards Per | Total Cards |
|-----------|------------|-----------|-------------|
| Starter | 100,000 | 5 | 500,000 |
| Standard | 500,000 | 5 | 2,500,000 |
| Premium | 100,000 | 7 | 700,000 |
| Mythic | 25,000 | 7 | 175,000 |
| Mega | 10,000 | 15 | 150,000 |

### Q3: Pack Pricing?

The 0.001 HIVE atomic anchor is a protocol fee. Should packs have an additional HIVE price? This would make the `transfer` amount larger (e.g., 5 HIVE for a standard pack instead of 0.001). The replay engine would validate the transfer amount matches the pack price.

Recommendation: **Defer pricing to the game economy design.** The protocol should support any price (validate `transfer.amount >= PACK_PRICES[packType]`), but the actual prices are a business decision.

### Q4: Can Packs Have Expiration?

Should sealed packs expire? This could drive urgency in the secondary market.

Recommendation: **No expiration.** Sealed packs should be eternal collectibles. This maximizes secondary market value and simplifies the protocol.

### Q5: Deprecation Timeline for pack_commit/pack_reveal?

The old two-phase flow can coexist with the new NFT flow indefinitely. Recommendation: Deprecate at the v1.1 activation block — all new pack operations must use `pack_mint`/`pack_burn`. Old `pack_commit`/`pack_reveal` records already in the chain are still processed normally during replay.

---

## Appendix A: Hive Transaction Example

### Atomic Card Transfer (Real Hive JSON)

```json
{
  "ref_block_num": 12345,
  "ref_block_prefix": 1234567890,
  "expiration": "2026-03-17T12:00:00",
  "operations": [
    [
      "custom_json",
      {
        "required_auths": ["alice"],
        "required_posting_auths": [],
        "id": "ragnarok-cards",
        "json": "{\"action\":\"card_transfer\",\"card_uid\":\"abc123def456\",\"to\":\"bob\",\"app\":\"ragnarok-cards\"}"
      }
    ],
    [
      "transfer",
      {
        "from": "alice",
        "to": "bob",
        "amount": "0.001 HIVE",
        "memo": "ragnarok:card_transfer:abc123def456"
      }
    ]
  ],
  "extensions": [],
  "signatures": ["2045a1b2c3..."]
}
```

### What PeakD Shows

```
alice → bob: 0.001 HIVE
Memo: ragnarok:card_transfer:abc123def456
+ custom_json: ragnarok-cards
```

Any Hive user can see this transfer happened, who sent what to whom, without running our indexer.

---

## Appendix B: Pack DNA Verification Tool

A standalone CLI tool for verifying pack contents (trustless):

```bash
# Given a burned pack, verify its derived cards
$ ragnarok-verify-pack \
    --pack-dna "a1b2c3d4e5f6..." \
    --burn-trx-id "f7e8d9c0b1a2..." \
    --entropy-block-id "0000001234abcdef..." \
    --pack-type "standard"

Pack DNA:        a1b2c3d4e5f6...
Burn TrxId:      f7e8d9c0b1a2...
Entropy Block:   0000001234abcdef...
Seed:            sha256(a1b2c3...|f7e8d9...|00000012...) = 9876543210...

Derived Cards:
  1. Card #20145 (Odin's Raven) — Epic
  2. Card #31023 (Fenrir's Packleader) — Common
  3. Card #20801 (Mjolnir's Echo) — Rare
  4. Card #50123 (Young Fenrir) — Common
  5. Card #30201 (Einherjar Hadding) — Rare

All cards verified against on-chain state. ✓
```

This tool runs `derivePackCards()` — the same function the replay engine uses. Anyone can verify any pack's contents independently.

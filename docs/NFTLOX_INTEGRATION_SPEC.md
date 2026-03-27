# Ragnarok x NFTLox Integration Specification

## Overview

Ragnarok uses NFTLox as its **NFT birth layer** — all card minting, pack creation, and pack opening happen through the NFTLox protocol on Hive L1. Everything after birth (gameplay, ELO, tournaments, rewards, anti-cheat) runs on Ragnarok's own `ragnarok-cards` protocol.

**Separation of concerns:**
- **NFTLox** = NFT factory (create collection, mint seeds, distribute instances, open packs)
- **Ragnarok** = game engine (deck building, matches, ELO, marketplace, rewards)

The Ragnarok indexer watches BOTH `nftlox_testnet` (for ownership changes) AND `ragnarok-cards` (for game state) custom_json operations.

---

## 1. Collection Setup

### Create Ragnarok Collection

One-time operation by the Ragnarok admin account.

```json
{
  "protocol": "nftlox_testnet",
  "version": "0.3.0",
  "action": "create_collection",
  "data": {
    "name": "Ragnarok Cards",
    "symbol": "RGNRK",
    "creator": "<ragnarok-admin>",
    "totalPotential": 2134,
    "metadata": {
      "description": "Norse Mythos Card Game — 2,134 collectible cards across 5 mythological factions",
      "image": "https://dhenz14.github.io/norse-mythos-card-game/icons/icon-512.webp",
      "externalUrl": "https://dhenz14.github.io/norse-mythos-card-game"
    },
    "rules": {
      "transferable": true,
      "burnable": true,
      "replicable": false,
      "royaltyPct": 0,
      "royaltyRecipient": "<ragnarok-admin>"
    },
    "schema": {
      "immutable": [
        { "name": "card_id", "type": "uint32" },
        { "name": "name", "type": "string" },
        { "name": "type", "type": "string" },
        { "name": "rarity", "type": "string" },
        { "name": "class", "type": "string" },
        { "name": "mana_cost", "type": "uint8" },
        { "name": "attack", "type": "uint8" },
        { "name": "health", "type": "uint8" },
        { "name": "race", "type": "string" },
        { "name": "set", "type": "string" }
      ],
      "mutable": [
        { "name": "level", "type": "uint8" },
        { "name": "xp", "type": "uint32" },
        { "name": "foil", "type": "string" }
      ]
    }
  }
}
```

**Notes:**
- `totalPotential: 2134` = total number of unique card templates (seeds)
- `replicable: false` — Ragnarok manages its own DNA/replication system
- `royaltyPct: 0` — no protocol fee, Ragnarok handles its own marketplace
- Schema includes immutable card stats + mutable game progression (level, xp, foil)

---

## 2. Seed Minting (Card Templates)

Each of the 2,134 collectible cards becomes one NFTLox seed. Seeds are templates — they define the card type and supply cap. Players never own seeds directly; they own instances distributed from seeds.

### Seed Data Mapping

| Ragnarok Field | NFTLox Seed Field | Notes |
|---------------|-------------------|-------|
| `card.id` | `artId` | Unique card identifier (e.g., "20001") |
| `card.name` | `metadata.name` | Card display name |
| `card.description` | `metadata.description` | Card text (truncated to 1000 chars) |
| Art URL | `metadata.imageUrl` | `https://dhenz14.github.io/norse-mythos-card-game/art/{artId}.webp` |
| Supply cap | `maxReplicas` | Per-rarity: mythic=250, epic=500, rare=1000, common=2000 |

### Seed Mint Payload (per card)

```json
{
  "protocol": "nftlox_testnet",
  "version": "0.3.0",
  "action": "mint",
  "data": {
    "collectionId": "<ragnarok-collection-id>",
    "edition": 1,
    "owner": "<ragnarok-admin>",
    "metadata": {
      "name": "Echo of the Allfather",
      "description": "Battlecry: Draw 2 cards. Your hero power costs (0) this turn.",
      "imageUrl": "https://dhenz14.github.io/norse-mythos-card-game/art/20001.webp"
    },
    "maxReplicas": 250,
    "tags": ["mythic", "minion", "neutral"],
    "immutableData": {
      "card_id": 20001,
      "name": "Echo of the Allfather",
      "type": "minion",
      "rarity": "mythic",
      "class": "Neutral",
      "mana_cost": 8,
      "attack": 7,
      "health": 7,
      "race": "Einherjar",
      "set": "norse"
    }
  }
}
```

### Batch Seed Minting Plan

| Rarity | Seeds | maxReplicas | Total Instances | Batches (50/batch) |
|--------|-------|-------------|-----------------|---------------------|
| Mythic | 160 | 250 | 40,000 | 4 |
| Epic | 363 | 500 | 181,500 | 8 |
| Rare | 687 | 1,000 | 687,000 | 14 |
| Common | 924 | 2,000 | 1,848,000 | 19 |
| **Total** | **2,134** | — | **2,756,500** | **43 batches** |

Each batch requires one Hive Keychain signature. At ~4s per signature, full mint takes ~3 minutes.

**artId format:** Card ID as string, zero-padded to 5 digits (e.g., `"20001"`, `"01000"`, `"50376"`). Max 14 chars, alphanumeric + hyphens per NFTLox validation.

---

## 3. Pack System

### Pack Definitions

Ragnarok has 6 pack types. Each maps to one NFTLox pack with weighted drop tables.

| Pack Type | Cards Per Pack | Drop Table Weights |
|-----------|---------------|-------------------|
| Starter | 5 | 70% common, 20% rare, 8% epic, 2% mythic |
| Booster | 5 | 60% common, 25% rare, 12% epic, 3% mythic |
| Standard | 5 | 55% common, 27% rare, 14% epic, 4% mythic |
| Premium | 7 | 40% common, 30% rare, 22% epic, 8% mythic |
| Mythic | 7 | 20% common, 30% rare, 35% epic, 15% mythic |
| Mega | 15 | 30% common, 30% rare, 28% epic, 12% mythic |

### Pack Create Payload (example: Standard Pack)

```json
{
  "protocol": "nftlox_testnet",
  "version": "0.3.0",
  "action": "pack_create",
  "data": {
    "collectionId": "<ragnarok-collection-id>",
    "name": "Ragnarok Standard Pack",
    "description": "5 cards with guaranteed rare or better",
    "imageUrl": "https://dhenz14.github.io/norse-mythos-card-game/art/pack-standard.webp",
    "dropTable": [
      { "seedId": "seed_<common1>", "weight": 55 },
      { "seedId": "seed_<common2>", "weight": 55 },
      { "seedId": "seed_<rare1>", "weight": 27 },
      { "seedId": "seed_<epic1>", "weight": 14 },
      { "seedId": "seed_<mythic1>", "weight": 4 }
    ],
    "itemsPerPack": 5,
    "maxSupply": 100000
  }
}
```

**Drop table construction:** Each seed in the drop table gets a weight proportional to its rarity tier. Within each rarity tier, all seeds share equal weight. For example, if there are 924 common seeds at weight 55 total, each common seed gets `55/924 ≈ 0.06` weight. NFTLox uses integer weights (1-10000), so we scale accordingly.

### Pack Opening

Player broadcasts via Hive Keychain:
```json
{
  "protocol": "nftlox_testnet",
  "version": "0.3.0",
  "action": "pack_open",
  "data": {
    "packId": "<ragnarok-standard-pack-id>",
    "quantity": 1
  }
}
```

NFTLox deterministically generates 5 card instances. Ragnarok's indexer picks up the new NFTs from the nftlox protocol ops and adds them to the player's collection.

---

## 4. Ragnarok Indexer Integration

### Dual-Protocol Watching

The Ragnarok replay engine watches two protocol IDs:

```
Protocol 1: "nftlox_testnet" (or production ID when launched)
  — Monitors: mint, transfer, burn, bulk_distribute, pack_open
  — Purpose: Track card ownership (who has what)

Protocol 2: "ragnarok-cards"
  — Monitors: match_anchor, match_result, queue_join/leave, reward_claim, etc.
  — Purpose: Game state (ELO, matches, rewards, tournaments)
```

### NFTLox Op → Ragnarok State Mapping

| NFTLox Op | Ragnarok Action |
|-----------|----------------|
| `mint` (seed) | Register new card template in local registry |
| `bulk_distribute` | Add instances to player's collection |
| `pack_open` | Add opened cards to player's collection |
| `transfer` | Update card ownership |
| `burn` | Remove card from player's collection |

### Ownership Resolution

When Ragnarok needs to check if a player owns a card (e.g., deck building):

1. Query local IndexedDB (fast, client-side)
2. IndexedDB is populated by replaying NFTLox `custom_json` ops filtered to our collection ID
3. No dependency on NFTLox's server API — fully self-sovereign

### Art Resolution

NFT instances carry `metadata.imageUrl` pointing to GitHub Pages. The Ragnarok client resolves art locally via `getCardArtPath(name, cardId)` — the NFT metadata URL is for external tools/explorers only.

---

## 5. What NFTLox Provides

| Feature | NFTLox Handles | Ragnarok Handles |
|---------|---------------|-----------------|
| Collection creation | Yes | — |
| Seed minting | Yes | — |
| Instance distribution | Yes | — |
| Pack creation | Yes | — |
| Pack opening (RNG) | Yes | — |
| NFT transfers | Yes (also Ragnarok marketplace) | Yes (own marketplace) |
| NFT burns | Yes | — |
| Card ownership query | Yes (API) | Yes (IndexedDB replay) |
| Marketplace listings | — | Yes (`ragnarok-cards` ops) |
| Match results | — | Yes |
| ELO / leaderboards | — | Yes |
| Tournament rewards | — | Yes |
| Anti-cheat (PoW, WASM) | — | Yes |
| Provenance stamps | — | Yes (extends NFTLox birth data) |
| DNA lineage | Yes (originDna, instanceDna) | Uses NFTLox DNA |
| Level / XP progression | — | Yes (mutable data or own ops) |

---

## 6. What We Need From NFTLox

### Required (Launch Blockers)

1. **Production protocol ID** — currently `nftlox_testnet`, need production `nftlox` (or equivalent)
2. **Collection creation** — we create one collection: "Ragnarok Cards" / RGNRK
3. **Seed minting** — 2,134 seeds via `buildSeedBatch()`, 43 Keychain-signed batches
4. **Pack creation** — 6 pack definitions with drop tables
5. **Pack opening** — deterministic RNG (already built)
6. **Bulk distribute** — for initial distribution / DUAT airdrop

### Nice to Have

7. **Schema support** — typed immutable/mutable fields on our cards (card_id, rarity, level, xp)
8. **Zero royalty/fee** — confirmed: `royaltyPct: 0`, no protocol fee for our collection
9. **Large drop tables** — we have 2,134 seeds; drop tables max 50 entries, so we'd need grouped rarity-tier entries, not per-card entries

### Not Needed

- NFTLox marketplace (we have our own)
- NFTLox lending/allowances (future consideration)
- NFTLox data operators (could use later for cross-game composability)
- NFTLox multisig buy (we handle our own marketplace)

---

## 7. Drop Table Strategy

NFTLox drop tables max out at 50 entries. We have 2,134 seeds. Two approaches:

### Option A: Rarity-Tier Pools (Recommended)

Create 4 "pool seeds" — one per rarity tier. Each pool seed represents all cards of that rarity. When a pack opens and selects a pool seed, Ragnarok's indexer uses a second deterministic pass (seeded from the NFTLox instance DNA) to select the specific card within that rarity tier.

```
Drop table (4 entries):
  pool_common  → weight 5500  (55%)
  pool_rare    → weight 2700  (27%)
  pool_epic    → weight 1400  (14%)
  pool_mythic  → weight 400   (4%)
```

**Pro:** Simple, fits within 50-entry limit, easy to maintain.
**Con:** Requires Ragnarok-side logic to resolve pool → specific card.

### Option B: Multiple Pack Variants

Create many pack variants, each with different 50-card subsets. Player randomly gets assigned a pack variant.

**Pro:** Pure NFTLox, no Ragnarok-side resolution needed.
**Con:** Massive operational complexity (43+ pack types per pack tier).

### Recommendation: Option A

Use rarity pool seeds. NFTLox handles the rarity selection. Ragnarok's indexer deterministically maps `instanceDna` → specific card ID within the rarity pool. This keeps the drop table small and the card selection deterministic and verifiable.

---

## 8. Migration Timeline

### Phase 1: Setup (Day 1)
- Create "Ragnarok Cards" collection on NFTLox
- Mint all 2,134 seeds (43 batch transactions)
- Verify seeds via NFTLox API

### Phase 2: Packs (Day 1-2)
- Create 6 pack definitions with drop tables
- Test pack opening with test account
- Verify deterministic card resolution

### Phase 3: Integration (Day 2-3)
- Update Ragnarok replay engine to watch `nftlox_testnet` ops
- Map NFTLox instance ownership → Ragnarok IndexedDB `cards` store
- Test deck building with NFTLox-derived ownership

### Phase 4: Launch (Day 3+)
- DUAT airdrop via `bulk_distribute` (164,460 packs to 3,511 holders)
- Pack sales via NFTLox `pack_buy`
- Secondary trading via Ragnarok marketplace (`ragnarok-cards` ops)

---

## 9. Technical Integration Points

### Ragnarok Files That Need Changes

| File | Change |
|------|--------|
| `replayEngine.ts` | Add `nftlox_testnet` as second protocol filter |
| `replayRules.ts` | Add handlers for NFTLox mint/transfer/burn/pack_open |
| `replayDB.ts` | No change (cards store already handles ownership) |
| `hiveConfig.ts` | Add `NFTLOX_PROTOCOL_ID` constant |
| `HiveSync.ts` | Add NFTLox SDK import for pack_open/transfer broadcasts |
| `genesisAdmin.ts` | Replace custom genesis with NFTLox collection creation |
| `AdminPanel.tsx` | Update UI to use NFTLox SDK builders |
| `PacksPage.tsx` | Wire pack_open to NFTLox protocol |

### New Dependencies

```json
{
  "@nftlox/sdk": "^0.3.0"
}
```

Or vendor the SDK builders directly (they're pure functions with zero dependencies beyond Zod).

---

## 10. Prompt for NFTLox Team

> We're building Ragnarok, a Norse mythology card game on Hive with 2,134 collectible cards. We want to use NFTLox as our NFT birth layer — you handle collection creation, seed minting, pack creation, and pack opening. Everything after (gameplay, marketplace, anti-cheat) runs on our own `ragnarok-cards` protocol.
>
> What we need:
> 1. One collection: "Ragnarok Cards" / RGNRK, 2,134 seeds, typed schema, 0% royalty
> 2. 43 batch seed mints (50 cards per batch) with per-seed maxReplicas (250/500/1000/2000 by rarity)
> 3. 6 pack types with weighted drop tables (4 rarity-pool entries each)
> 4. Our indexer replays your `nftlox_testnet` ops alongside our own — no API dependency
> 5. No fee on our collection (we'll run our own marketplace)
>
> Total NFT supply: ~2.76M instances across 2,134 unique cards.
> Art hosted on GitHub Pages. Schema: card_id, name, type, rarity, class, mana_cost, attack, health, race, set (immutable) + level, xp, foil (mutable).
>
> Are there any constraints we should know about? Can we do a test mint on the current testnet protocol?

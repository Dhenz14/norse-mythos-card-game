# Card Soul Audit — Outstanding TODO

Generated from deep card audit (2026-03-14). All flavor text + IP renames completed. These are the deeper lore, mechanic, and identity fixes remaining.

---

## Phase 1: Lore-Inaccurate Mechanics ✅ COMPLETED

### 1.1 Helheim Realm Effect (30304) ✅
- Changed `return_to_hand_on_death` → `banish_on_death` (new realm effect type)
- Early return in `zoneUtils.ts` `destroyCard()` skips ALL death effects (deathrattle, reborn, einherjar, chain)
- Added `'banish_on_death'` to `RealmEffect.type` union in `types.ts`

### 1.2 Eitri the Unmaker → Eitri, Forge-Breaker (31922) ✅
### 1.3 Horn of Gjallarhorn → Gjallarhorn (31919) ✅
### 1.4 Norn's Bargain → Norn's Demand (30004) ✅
- Originally "Norn's Decree" but collided with prophecy 30101
### 1.5 Einherjar's Price → Valkyrie's Tithe (30007) ✅
### 1.6 Skoll/Hati Already Swapped ✅
### 1.7 Kara Kazham Tokens Already Renamed ✅ (Candle/Broom/Teapot → Spark Wisp/Straw Golem/Cauldron Imp)

---

## Phase 2: Soulless Card Renames ✅ COMPLETED

### 2.1 Norse Mechanic Payoff Renames ✅
- 31906: Wound-Drinker → Geirskögul, Spear-Shaker
- 31911: Doom-Reader → Gróa's Vision (ID was 31911 not 31909)
- 31908: Sanguine Rune → Blóðrún (ID was 31908 not 31910)
- 31914: Wanderer of the Nine → Veðrfölnir's Flight (ID was 31914 not 31913)

### 2.2 Ragnarok Herald → Heimdall's Warning (30102) ✅
### 2.3 Einherjar Named Warriors (30201-30206) ✅
- Hadding the Twice-Born, Hervor Shield-Maiden, Bödvar Bjarki, Helgi Hundingsbane, Sigmund the Völsung
### 2.4 Svartalfheim Titan → Svartalfheim Construct (1906) ✅
- Also changed race from Giant → Automaton

---

## Phase 3: Super Minion Mechanic-Lore Alignment ✅ COMPLETED

All 9 broken battlecries remapped to working handler types (were silently failing).

| ID | Old Name | New Name | Old Handler (broken) | New Handler (working) |
|----|----------|----------|---------------------|----------------------|
| 95045 | Tears of the Faithful | Sigyn's Vigil | `heal_grant_deathrattle` | `give_divine_shield` |
| 95037 | Breath of the Creator | Hoenir's Gift of Spirit | `grant_deathrattle_draw` | `buff` (+2/+2) |
| 95038 | Eros's Bow of Enchantment | Aphrodite's Cestus | `mind_control_conditional_buff` | `mind_control_random` |
| 95039 | Peacock Throne of Olympus | Hera's Jealous Claim | `silence_buff_discount` | `mind_control_random` |
| 95040 | Arrow of True Love | Eros's Golden Arrow | `mind_control_highest` | `freeze` |
| 95033 | Dawn's First Light | Skinfaxi's Mane | `buff_divine_shield_damage` | `give_divine_shield` |
| 95047 | Colossus of the Dark Forge | Blainn's Masterwork | `buff_self_summon_from_enemies` | `fill_board` |
| 95068 | Moonlit Palace | Tsukuyomi's Exile | `stealth_all_buff_draw` | `grant_stealth` |
| 95070 | Crossroads Guardian | Sarutahiko's Guidance | `loatheb_effect` | `discover` |

---

## Phase 4: Elder Titan Text Rework ✅ COMPLETED

### 4.1 File Rename ✅
- `oldGods.ts` → `elderTitans.ts`, `oldGodsCards` → `elderTitanCards`
- Updated all imports/exports in `neutrals/index.ts`

### 4.2-4.5 Support Card Renames + Titan Flavor Updates ✅
- 60002: Seidr Acolyte → Ember of Gullveig
- 60005: Gullveig's Ember-Keeper → Keeper of the Thrice-Flame
- 60008: Jotun Shieldbearer → Gullveig's Ash Guardian
- 60010: Thrall of Gullveig → Risen from the Pyre
- All 4 titans (Gullveig, Hyrrokkin, Utgarda-Loki, Fornjot) got Eddic-sourced flavor text
- Internal effect keys preserved (`cthun_damage`, `buff_cthun`, `yogg_saron`, `resurrect_deathrattle`)

---

## Phase 5: Generic Artifact Renames ✅ COMPLETED

### 5.1 Direct Renames (14 artifacts) ✅
All renamed to mythology-accurate names with updated descriptions and flavor text.
Lævateinn, The Aegis, Enyalios, Cap of Invisibility, Seidstafr, Delling's Shard,
The Mammen Axe, Gleipnir, Gnipahellir's Tooth, Máni's Thread, Veðrfölnir's Talon,
Naglfar's Keel, Gleipnir's Fang. Vault of Ouranos heroId skipped (no matching hero exists).

### 5.2 Master Bolt Category Fix ✅
- 29801: `norse_artifact` → `greek_artifact`

### 5.3 Megingjord — Kept as-is (Magni is Thor's son, intentional)

---

## Phase 6: Artifact Cost Diversity ✅ COMPLETED

### 6.1 Cost Redistribution ✅
- 35 artifacts re-costed from uniform 5 mana to 4-7 mana range
- 4 mana: ~4 simple stat-stick artifacts
- 5 mana: ~42 standard power level (majority kept here)
- 6 mana: ~21 named mythological weapons with strong effects
- 7 mana: ~10 game-warping artifacts (Gungnir, Mjolnir, etc.)

---

## Phase 7: Pet Evolution Variety (High Effort)

### 7.1 Diversify Evolution Triggers
- **Current**: Only 11 unique triggers across 38 families, `on_deal_damage` and `on_survive_turn` everywhere
- **Fix**: Add 5-8 new evolution triggers:
  - `on_spell_cast` — evolve when you cast a spell
  - `on_hero_damaged` — evolve when your hero takes damage
  - `on_friendly_death` — evolve when an ally dies
  - `on_heal` — evolve when healed
  - `on_discard` — evolve when a card is discarded
  - `on_draw` — evolve after drawing N cards
  - `on_opponent_spell` — evolve when enemy casts spell
  - `on_board_full` — evolve when battlefield is full

### 7.2 Diversify Stage 3 Stats
- **Current**: All cluster at 5-7/5-8 — no wild outliers
- **Fix**: Some Stage 3 pets should be extreme:
  - Glass cannons: 12/3 (massive attack, fragile)
  - Walls: 1/15 with Taunt
  - Board-warping: 0/0 with "Set all other minions' stats to 1/1"
  - Token generators: 3/3 that fills board with 1/1s

### 7.3 Fix Stage 3 Description Repetition
- **Current**: Every Stage 3 says "The final form depends on its evolution path"
- **Fix**: Each Stage 3 should have a unique description referencing its specific power

### 7.4 Fix Element Assignments
- Bifrost pets: electric → light (Bifrost is a rainbow bridge of light)
- Fylgja: random elements → match their animal form's nature
- Einherjar Warriors: fire → light (holy warriors of Valhalla)

---

## Phase 8: Class Identity Fixes (High Effort, Low Priority)

### 8.1 Warlock Norse Identity (Grade C → B+)
- **Problem**: Generic "Void/Shadow" naming, weakest Norse identity
- **Direction**: Lean into Muspelheim fire pacts, Loki's forbidden bargains, or Hel's domain
- **Scope**: Rename 10-15 cards, adjust flavor text to reference Surtr's flames or Hel's bargains
- **Key renames**: All "Void" → "Ginnungagap" or "Muspel" prefixes

### 8.2 Priest Norse Identity (Grade C+ → B+)
- **Problem**: Overwhelmingly Greek (Selene, Persephone, Asclepius, Chronos, Moirai, Styx)
- **Direction**: Should be the Hel/Norn/Baldur class — death, fate, and light
- **Scope**: This is a multi-mythology game, so Greek cards are fine, but need more Norse representation
- **Fix**: Add 4-6 Norse priest cards (Baldur's Light, Norn's Weaving, Hel's Judgment) to balance the Greek dominance

### 8.3 Hunter Pick a Lane (Grade B- → B+)
- **Problem**: Split between Artemis (Greek) and Skadi (Norse) with no coherent identity
- **Direction**: Both are valid hunt goddesses — lean into "divine hunt" as the unifying theme
- **Fix**: Rename generic cards ("Stealthy Jaguar," "Pack Alpha," "Timber Wolf Alpha") to mythology-specific names
- **Scope**: 5-8 renames

### 8.4 Rogue Card Count Trim
- **Current**: 48 cards (largest class, others 33-41)
- **Fix**: Identify 5-8 weakest/most generic rogue cards, consider moving to neutral or cutting
- **Low priority**: Doesn't affect player experience much

---

## Phase 9: Remaining Greek Card Gaps

### 9.1 Missing Greek Mythic Minions
- **Current**: Only 6 Greek mythic minions (Cerberus, Typhon, Porphyrion, Atlas, Campe, Medusa)
- **Missing obvious creatures**: Hydra, Minotaur, Sphinx, Chimera, Scylla, Charybdis, Pegasus, the Furies, Argus Panoptes
- **Scope**: Add 6-10 Greek mythic minions with mechanics matching their myths
- **Priority**: Low — Greek is secondary mythology, but mythology fans will notice the gaps

### 9.2 Typhon/Porphyrion Race Fix
- **Current**: Both listed as "Elemental" race
- **Fix**: Both should be "Titan" — Typhon is Father of Monsters, Porphyrion is king of the Gigantes

---

## Verification Checklist (Run After Each Phase)

1. `npx tsc --noEmit` — zero errors
2. `npm run build` — production build succeeds
3. Spot-check renamed cards appear correctly in deck builder
4. Verify no broken `effectHandler` references if battlecry keys changed
5. Search for old names in all files to catch stale references

---

## Phase 10: NFT SDK Architecture (Future — Separate Engineer)

Decouple game domain from NFT/blockchain domain so another engineer can develop the SDK independently.

### 10.1 Core Problem
Game code has 15+ direct imports from blockchain layer (`HiveDataLayer`, `HiveSync`, `HiveEvents`, `HiveTypes`). Changes to `HiveCardAsset` require updates in 9+ game files. Trade execution chains 7 components for a single operation.

### 10.2 Architecture Principles
- **Screaming Architecture**: folders named by use case (ownership, trading, rewards), not technology
- **Zod contracts**: shared types validated at boundary, inferred via `z.infer<>`
- **Adapter pattern**: game depends on interfaces, never concrete Hive implementations
- **Source of truth per data type**: card definitions = game, ownership = chain, ELO = chain, deck builds = game, match state = game+chain (dual-signed)

### 10.3 Key Interfaces to Extract

```typescript
// IOwnershipValidator — decouples heroDeckStore from HiveDataLayer
interface IOwnershipValidator {
  getOwnedCopies(cardId: number): number;
  canAddCard(cardId: number, heroClass: string, deck: HeroDeck): boolean;
}

// ICardTransferManager — decouples tradeStore from HiveSync+HiveDataStore+HiveEvents
interface ICardTransferManager {
  transferCard(nftUid: string, toUser: string): Promise<Result>;
  transferMultiple(nftUids: string[], toUser: string): Promise<Result>;
}

// IRewardClaimer — decouples campaignStore/dailyQuestStore from HiveSync
interface IRewardClaimer {
  claimReward(rewardId: string, metadata: Record<string, unknown>): Promise<Result>;
}

// IMatchResultBroadcaster — decouples useP2PSync from blockchain
interface IMatchResultBroadcaster {
  broadcastResult(result: MatchResult): Promise<Result>;
  signResultHash(hash: string): Promise<SignatureResult>;
}
```

### 10.4 Zod Contract Strategy
- Define contracts in `shared/contracts/` (one file per domain: ownership, trading, rewards, matches)
- Game code imports only Zod schemas + inferred types (never HiveCardAsset directly)
- SDK implements adapters that satisfy the contracts
- Server validates all API inputs with `.safeParse()`

### 10.5 File Structure (Target)
```
sdk/
├── contracts/           # Zod schemas (source of truth for shared types)
│   ├── ownership.ts     # CardOwnership, CollectionSnapshot
│   ├── trading.ts       # TradeOffer, TradeResult
│   ├── rewards.ts       # RewardClaim, RewardResult
│   ├── matches.ts       # MatchResult, MatchSignature
│   └── identity.ts      # UserIdentity, AuthCredentials
├── adapters/
│   ├── hive/            # Hive-specific implementations
│   │   ├── HiveOwnershipAdapter.ts
│   │   ├── HiveTransferAdapter.ts
│   │   ├── HiveRewardAdapter.ts
│   │   └── HiveMatchAdapter.ts
│   └── local/           # Local/test implementations
│       ├── LocalOwnershipAdapter.ts
│       └── LocalTransferAdapter.ts
├── ports/               # Interface definitions (game-facing API)
│   ├── IOwnershipValidator.ts
│   ├── ICardTransferManager.ts
│   ├── IRewardClaimer.ts
│   └── IMatchResultBroadcaster.ts
└── index.ts             # Public SDK API
```

### 10.6 Migration Path
1. Extract interfaces from current coupling points (18 files)
2. Create Hive adapters that wrap existing HiveSync/HiveDataLayer/HiveEvents
3. Inject adapters at app initialization (replace direct imports)
4. Move Hive-specific code into `sdk/adapters/hive/`
5. Game code imports only from `sdk/ports/` and `sdk/contracts/`

### 10.7 Risks
- **Migration scope**: 15+ game files need injection refactoring
- **Type proliferation**: DTO conversion layer adds boilerplate
- **Event bus unification**: HiveEvents + GameEventBus should merge into one system
- **Testing**: Need mock adapters for all interfaces (local mode already works as template)

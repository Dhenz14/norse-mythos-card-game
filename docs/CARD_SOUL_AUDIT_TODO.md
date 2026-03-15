# Card Soul Audit — Outstanding TODO

Generated from deep card audit (2026-03-14). All flavor text + IP renames completed. These are the deeper lore, mechanic, and identity fixes remaining.

---

## Phase 1: Lore-Inaccurate Mechanics (High Priority)

These are cards where the mechanic actively contradicts the mythology. Players who know the source material will notice.

### 1.1 Helheim Realm Effect (30307)
- **File**: `cardRegistry/sets/core/neutrals/realmShiftCards.ts`
- **Current**: Returns minions to hand on death
- **Problem**: Helheim's defining trait is the dead DON'T return (Gylfaginning 34, Baldur's failed return)
- **Fix**: Change to "Deathrattles don't trigger" or "Minions that die are banished (removed from game)" — captures the finality of Helheim
- **Also update**: `gameUtils.ts` realm effect handler, `RULEBOOK.md` Helheim description

### 1.2 Eitri the Unmaker (31922)
- **File**: `cardRegistry/sets/core/neutrals/norseMechanicPayoffCards.ts`
- **Current**: "Eitri, the Unmaker" — destroys enemy weapon or artifact
- **Problem**: Eitri is one of the greatest makers/smiths in Norse myth (forged Mjolnir, Gungnir, Draupnir). "Unmaker" is the opposite of his identity
- **Fix**: Rename to "Eitri, Master Smith" or "Eitri, Forge-Breaker" — keep the destroy mechanic but frame it as "he knows how weapons are made, so he knows how to unmake them"
- **Update**: Name, description, flavorText

### 1.3 Horn of Gjallarhorn (31919)
- **File**: `cardRegistry/sets/core/neutrals/norseMechanicPayoffCards.ts`
- **Current**: "Horn of Gjallarhorn" — "Horn of Horn" is redundant (Gjallarhorn literally means "yelling horn")
- **Fix**: Rename to just "Gjallarhorn" or "Heimdall's Gjallarhorn"
- **Update**: Name only

### 1.4 Norn's Bargain (30004)
- **File**: `cardRegistry/sets/core/neutrals/bloodPriceCards.ts`
- **Current**: Blood Price card implying Norns make deals
- **Problem**: Norns weave fate at Urd's Well — they don't bargain, they decree. Mortals cannot negotiate with fate in Norse cosmology
- **Fix**: Rename to "Norn's Decree" or "Thread of the Norns" — change description to frame the blood payment as fate demanding its price, not a negotiation
- **Update**: Name, description, flavorText

### 1.5 Einherjar's Price (30007)
- **File**: `cardRegistry/sets/core/neutrals/bloodPriceCards.ts`
- **Current**: Blood Price card where Einherjar "pay with blood to stand beside the gods"
- **Problem**: Einherjar were chosen by Valkyries based on valor in death — they don't pay a price, they're honored. The "price" was already paid (dying in battle)
- **Fix**: Rename to "Valkyrie's Tithe" or "Blood of the Chosen" — frame as the Valkyrie demanding proof of warrior spirit (health sacrifice = proving worth)
- **Update**: Name, description, flavorText

### 1.6 Skoll/Hati Already Swapped ✅
- Completed in previous session

### 1.7 Kara Kazham Tokens Already Renamed ✅
- Completed in previous session (Candle/Broom/Teapot → Spark Wisp/Straw Golem/Cauldron Imp)

---

## Phase 2: Soulless Card Renames (Medium Priority)

Cards with generic fantasy names that have obvious Norse/Greek equivalents. Text-only changes, no mechanic alterations.

### 2.1 Norse Mechanic Payoff Renames
- **File**: `cardRegistry/sets/core/neutrals/norseMechanicPayoffCards.ts`

| ID | Current | Problem | Suggested |
|----|---------|---------|-----------|
| 31906 | Wound-Drinker | Generic vampire name | Geirskögul (Valkyrie name meaning "spear-shaker") or Mead of Valhalla |
| 31909 | Doom-Reader | No Norse connection | Völva of the Pyre or Gróa's Vision (named seeress from Svipdagsmál) |
| 31910 | Sanguine Rune | "Sanguine" is Latin | Blóðrún (Old Norse: "blood rune") |
| 31913 | Wanderer of the Nine | Generic; Odin IS the Wanderer | Veðrfölnir's Flight (the hawk on Yggdrasil) or Bifrost Wayfarer |

### 2.2 Ragnarok Herald → Specific Heimdall Reference
- **File**: `cardRegistry/sets/core/neutrals/prophecyCards.ts`
- **ID**: 30102
- **Current**: "Ragnarok Herald" — generic
- **Fix**: "Heimdall's Warning" or "Blast of Gjallarhorn" — it's specifically Heimdall who signals Ragnarok

### 2.3 Einherjar Named Warriors
- **File**: `cardRegistry/sets/core/neutrals/einherjarCards.ts`
- **Current**: 5/6 cards use "Einherjar [Rank]" pattern (Recruit, Shieldmaiden, Berserker, Champion, Valhalla's Chosen)
- **Fix**: Use actual named Norse warriors from the Eddas and sagas:

| ID | Current | Suggested | Source |
|----|---------|-----------|--------|
| 30201 | Einherjar Recruit | Hadding the Twice-Born | Saxo Grammaticus, raised by Odin |
| 30202 | Einherjar Shieldmaiden | Hervor Shield-Maiden | Hervarar saga, demanded Tyrfing from her father's barrow |
| 30203 | Einherjar Berserker | Bödvar Bjarki | Hrólfs saga kraka, bear-warrior |
| 30205 | Einherjar Champion | Helgi Hundingsbane | Poetic Edda, greatest of Odin's chosen |
| 30206 | Valhalla's Chosen | Sigmund the Völsung | Völsunga saga, father of Sigurd |

- Keep Einherjar keyword mechanics, just give them actual names and updated descriptions/flavor

### 2.4 Svartalfheim Titan → Svartalfheim Construct
- **File**: `cardRegistry/sets/core/neutrals/vanillaMinions.ts` (or wherever vanilla minions live)
- **ID**: Check — vanilla minion with "Svartalfheim Titan" name
- **Problem**: Dwarves are small. A Titan from the dwarf realm is oxymoronic
- **Fix**: "Svartalfheim Construct" or "Svartalfheim Golem" — dwarves are master builders

---

## Phase 3: Super Minion Mechanic-Lore Alignment (Medium Priority)

Super minions where the battlecry doesn't match the mythology. Each needs both a name and mechanic review.

### 3.1 Tears of the Faithful (Sigyn's super minion)
- **File**: `cardRegistry/sets/superMinions/heroSuperMinions.ts`
- **Current**: Generic heal
- **Problem**: Sigyn's mythology is specific — she holds a bowl to catch Loki's venom, enduring suffering
- **Fix**: Rework to "Sigyn's Vigil" — battlecry could be "Choose a friendly minion. Absorb all damage dealt to it this turn" (captures the bowl-catching-venom). Or: "Give a friendly minion Immune this turn. Deal 3 damage to your hero" (self-sacrifice)

### 3.2 Breath of the Creator (Hoenir's super minion)
- **Current**: Summon copy
- **Problem**: Hoenir gave önd (spirit/breath of life) to Ask and Embla. "Summon copy" has nothing to do with giving life
- **Fix**: Rework to "Hoenir's Gift of Spirit" — "Give a friendly minion +3/+3 and Reborn" (giving life/spirit). Or: "Transform a friendly minion into a copy of a random mythic minion" (breath of divine inspiration)

### 3.3 Peacock Throne of Olympus (Hera's super minion)
- **Current**: Silence + buff (generic)
- **Problem**: Hera is the queen of jealousy and vengeance. She punished Zeus's lovers (Io turned to cow, Echo cursed, Heracles driven mad)
- **Fix**: Rework to "Hera's Jealous Wrath" — "Choose an enemy minion. Take control of it, but it has -3 Attack" (jealous possession). Or: "Transform all enemy minions that were summoned (not played) into 1/1 creatures" (punishing illegitimate children metaphor)

### 3.4 Arrow of True Love (Eros's super minion)
- **Current**: Mind control
- **Problem**: Eros's arrows cause love, not domination. Mind control is more Circe/Aphrodite's cestus
- **Fix**: "Eros's Golden Arrow" — "Choose an enemy minion. It can't attack your hero or minions for 2 turns" (smitten, not controlled). Or: give it to your side but it "loves" the enemy and can't attack them specifically

### 3.5 Eros's Bow of Enchantment (Aphrodite's super minion)
- **Current**: Named after her son's weapon
- **Problem**: Aphrodite has her own symbols — golden apple, magic girdle (Cestus), sea foam, doves, roses
- **Fix**: Rename to "Aphrodite's Cestus" or "The Golden Apple of Discord" — adjust mechanic to match (Cestus = charm/enchant, Golden Apple = cause enemies to fight each other)

### 3.6 Crossroads Guardian (Sarutahiko's super minion)
- **Current**: Loatheb effect (spells cost more)
- **Problem**: Sarutahiko is the kami of crossroads who guides travelers. Spell-cost-increase has no connection
- **Fix**: "Sarutahiko's Guidance" — "Foresee 3 cards. Choose one to add to your hand, shuffle the rest into your opponent's deck" (guiding/redirecting travelers at crossroads)

### 3.7 Moonlit Palace (Tsukuyomi's super minion)
- **Current**: Give Stealth + draw (generic shadow card)
- **Problem**: Tsukuyomi killed Uke Mochi (food goddess) in rage, was banished to night by Amaterasu. His mythology is about exile, rage, and separation from the sun
- **Fix**: "Tsukuyomi's Exile" — "Destroy a random enemy minion. Your opponent draws 2 cards" (the killing and the price). Or: "Both heroes can't use Hero Powers next turn" (separation from divine power)

### 3.8 Dawn's First Light (Solvi's super minion)
- **Current**: Extremely generic name
- **Fix**: "Dagr's Chariot" (Dagr is the Norse personification of day, rides horse Skinfaxi) or "Skinfaxi's Mane" (Skinfaxi's mane lights the sky)

### 3.9 Colossus of the Dark Forge (Blainn's super minion)
- **Current**: A "Colossus" from a dwarf
- **Problem**: Blainn is a dwarf — dwarves are small master smiths, not colossus-builders
- **Fix**: "Blainn's Masterwork" or "The Dark Forge's Finest" — keep big stats but frame as a crafted construct, not a colossus

---

## Phase 4: Elder Titan Mechanical Rework (High Effort)

The Elder Titans (ex-Old Gods) are transparent C'Thun/Yogg/N'Zoth reskins. The support ecosystem is copy-pasted. Making them feel Norse requires reworking how their support cards interact.

### 4.1 Rename `oldGods.ts` → `elderTitans.ts`
- **File**: `cardRegistry/sets/core/neutrals/oldGods.ts`
- Rename file and all exports (`oldGodsCards` → `elderTitanCards`)
- Update imports in `cardRegistry/sets/core/neutrals/index.ts`

### 4.2 Gullveig the Thrice-Burned — Rebirth Mechanic
- **Current**: C'Thun clone (buff stats from hand, deal split damage on play)
- **Problem**: Gullveig's mythology is about being burned three times and reborn each time, sparking the Aesir-Vanir war
- **Ideal**: Support cards "burn" Gullveig (deal damage to her in hand? discard and re-draw with buffs?). Battlecry relates to rebirth cycle count
- **Minimum**: Change support card names/flavor to reference burning and rebirth, not generic "cultist" buffs
- **Internal key**: Can keep `cthun_damage`/`buff_cthun` for backwards compat, just change the surface

### 4.3 Hyrrokkin Launcher of the Dead — Push/Launch Mechanic
- **Current**: N'Zoth clone (resurrect deathrattle minions)
- **Problem**: Hyrrokkin was the giantess who launched Baldur's funeral ship (Hringhorni) when no one else was strong enough. Her thing is force/launching, not resurrection
- **Ideal**: Battlecry "Launch" all friendly deathrattle minions (destroy them, trigger deathrattles, deal their attack as damage to random enemies). Or: "Push" enemy minions back to hand
- **Minimum**: Change flavor text and support card names to reference launching/force

### 4.4 Utgarda-Loki Lord of Illusions — Illusion Mechanic
- **Current**: Yogg-Saron clone (cast random spells)
- **Problem**: Utgarda-Loki is the master of illusions from Thor's journey to Utgard (Gylfaginning 44-47). He made Thor's companions fail impossible tests through trickery
- **Ideal**: Battlecry creates "illusion" copies of enemy minions on your side (0 attack but same health/text, vanish when attacked). Or: "Replace all spells in both hands with random spells of the same cost" (nothing is what it seems)
- **Minimum**: Change support card flavor to reference illusion/trickery, not random chaos

### 4.5 Fornjot the Primordial — Keep As-Is?
- **Current**: Y'Shaarj clone (pull minions from deck)
- **Assessment**: Fornjot is the primordial ancestor of the jötnar (frost/fire/sea). Pulling things forth from the deck (creation/emergence) actually fits reasonably well
- **Fix**: Just improve support card naming to reference primordial emergence

---

## Phase 5: Generic Artifact Renames (Low Priority)

Artifacts with made-up names when real mythological equivalents exist. Text-only, no mechanic changes.

### 5.1 Direct Renames
- **File**: `cardRegistry/sets/norse/artifactCards.ts` (or wherever artifacts live)

| ID | Current | Suggested | Reason |
|----|---------|-----------|--------|
| 29803 | Dagger of Deceit (Loki) | Lævateinn (Loki's actual sword/wand in Fjölsvinnsmál) | Has a real name |
| 29804 | Aegis of Strategy (Athena) | The Aegis | The Aegis is THE artifact, no modifier needed |
| 29805 | Blade of Carnage (Ares) | Enyalios (Ares's war name) or Sword of Ares | Generic → specific |
| 29806 | Helm of the Underworld (Hades) | Cap of Invisibility | Correct name from myths |
| 29909 | Seidr Staff of the Volva | Seidstafr | Actual Old Norse word, cleaner |
| 29918 | Eldrin's Dawn Shard | Delling's Shard | Delling = Norse dawn god, "Eldrin" is made up |
| 29908 | Thorgrim's Runic Battleaxe | The Mammen Axe | Real 10th-c Viking artifact referenced in its own flavor text |
| 29932 | Gormr's Shadow Fang | Gnipahellir's Tooth | Gnipahellir = cave at Helheim's gate where Garmr is chained |
| 29933 | Lirien's Moonthread Garrote | Máni's Thread | Máni = Norse moon god, "Lirien" is D&D elvish |
| 29937 | Fjora's Stormhawk Talon | Veðrfölnir's Talon | Veðrfölnir = hawk on Yggdrasil, mentioned in flavor text |
| 29912 | Brakki's Frostbound Chains | Gleipnir | Flavor text literally references Gleipnir |
| 29938 | Myrka's Void Scythe | Naglfar's Keel | Naglfar = ship of dead men's nails, "Myrka" is invented |
| 29939 | Ylva's Fang of Fenrir | Gleipnir's Fang | "Ylva" is a modern name, not mythological |
| 29941 | Vault of Ouranos | — (also missing `heroId` field) | Fix `heroId`, rename TBD |

### 5.2 Master Bolt Category Fix
- **ID**: 29801
- **Current**: Categorized as `'norse_artifact'`
- **Fix**: Change to `'greek_artifact'` — it's Zeus's weapon

### 5.3 Megingjord Hero Assignment
- **ID**: 29911
- **Current**: Assigned to hero-magni as DeathKnight
- **Problem**: Megingjord is Thor's belt of strength — should it be assigned to a Thor-related hero instead?
- **Decision needed**: Might be intentional (Magni is Thor's son), just verify

---

## Phase 6: Artifact Cost Diversity (Medium Effort)

### 6.1 Break the "Everything Costs 5" Pattern
- **All 68 artifacts cost exactly 5 mana** — no curve variety
- **Fix**: Redistribute across 3-8 mana based on power level:
  - Minor artifacts (stat sticks, simple effects): 3-4 mana
  - Standard artifacts (current power level): 5 mana (keep most here)
  - Legendary artifacts (Gungnir, Mjolnir, Brisingamen): 6-7 mana
  - World-ending artifacts (Ragnarok-tier): 8 mana
- **Scope**: Review all 68, re-cost ~30 of them
- **Risk**: Affects game balance — needs playtesting consideration

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

# Implementation Gap Analysis - Ragnarok Poker

This document identifies features that are scaffolding, stubs, or not fully integrated.

**Last Updated:** January 2026

## RECENTLY COMPLETED INTEGRATIONS

### 1. Shared Deck Store - ✅ INTEGRATED
**File:** `client/src/game/stores/sharedDeckStore.ts`

**Status:** Store is wired into combat flow via `PokerCombatStore.ts`

**Integration Points:**
- Imported in PokerCombatStore
- Reset on `endCombat()` - clears deck state when combat ends
- Norse context tracking via `norseIntegration.ts`

**Remaining Work:** Full deck lifecycle (draw/play/burn cards) not yet wired.

---

### 2. King Passives - ✅ WIRED INTO GAME LOOP
**Files:** 
- `client/src/game/utils/kingPassiveUtils.ts` (execution functions)
- `client/src/game/utils/norseIntegration.ts` (integration layer)
- `client/src/game/utils/gameUtils.ts` (game loop calls)

**Status:** All 9 kings defined with dual passives. Game loop now calls:
- `executeNorseStartOfTurnPassives()` at turn start
- `executeNorseEndOfTurnPassives()` at turn end
- `executeNorseMinionPlayPassives()` on minion play
- `executeNorseSpellCastPassives()` on spell cast

**Impact:** King passive abilities now trigger during gameplay.

---

### 3. Hero Passives - ✅ WIRED INTO GAME LOOP
**File:** `client/src/game/utils/norseHeroPowerUtils.ts`, `norseIntegration.ts`

**Status:** `executeHeroPassive()` is now called via `norseIntegration` wrappers.

**Integration Points:**
- Minion play events
- Spell cast events
- Start/end of turn events

**Impact:** Hero passives like "Fire minions have +1 Attack" now activate.

---

### 4. Norse Context Management - ✅ NEW
**File:** `client/src/game/utils/norseIntegration.ts`

**Status:** Central context manager for tracking active kings/heroes during combat.

**Key Functions:**
- `initializeNorseContext()` - called in PokerCombatStore.initializeCombat()
- `resetNorseContext()` - called in PokerCombatStore.endCombat()
- `isNorseActive()` - guard to prevent errors when systems not initialized

---

### 5. Hero Fixed Cards Helper - ✅ NEW
**File:** `client/src/game/data/norseHeroes/index.ts`

**Status:** Helper functions to retrieve hero signature cards from ChessPieceConfig.

**Key Functions:**
- `getHeroFixedCardIds()` - get cards by heroKey
- `getFixedCardsForNorseHero()` - get cards by norseHeroId with fallbacks
- `HERO_ID_TO_CONFIG_KEY` - mapping between hero systems

---

## REMAINING GAPS (Priority Order)

### 1. Weapon Upgrades - NOT PLAYABLE
**File:** `client/src/game/utils/norseHeroPowerUtils.ts`

**Status:** `applyWeaponUpgrade()` function exists. All 36 weapon upgrade cards defined.

**Missing Integration:**
- No UI button to trigger weapon upgrade (needs 5-mana button next to hero power)
- No "play weapon" handler wired

**Impact:** Players cannot upgrade hero powers via 5-mana weapon spells.

**To Fix:** Add weapon upgrade button to BattlefieldHero component, wire to `applyWeaponUpgrade()`.

---

### 2. Minion Death Trigger - ✅ NOW WIRED
**File:** `client/src/game/utils/zoneUtils.ts`

**Status:** `processAllOnMinionDeathEffects()` is now called in `destroyCard()` function.

**Impact:** King and Hero passives that trigger on minion death now activate.

---

### 3. Heal Trigger - PARTIALLY WIRED
**File:** `client/src/game/utils/norseIntegration.ts`

**Status:** `processKingOnHeal()` and `processHeroOnHeal()` functions exist but not wired into heal event handlers.

**To Fix:** Wire into heal processing functions when they exist.

---

### 4. Effect Handler Stubs - NOT IMPLEMENTED
**Files:** `client/src/game/effects/handlers/spellEffect/*.ts`

**Status:** Many effect handlers (aoe_damage, buff, summon, etc.) are stub placeholders.

**Impact:** Many card effects don't execute their intended behavior.

**To Fix:** Implement each effect handler with proper game logic.

---

### 5. Norse Hero Power Utility - IMPORTED BUT NOT USED
**File:** `client/src/game/combat/RagnarokCombatArena.tsx`

**Status:** 
- `executeNorseHeroPower` and `canUseHeroPower` are **imported** (line 34)
- But **never called** (0 usages)
- Hero power logic is **duplicated inline** (lines 1755-1874)

**Impact:** Code duplication, inconsistent behavior, harder to maintain.

**To Fix:** Refactor to use the utility function instead of inline implementation.

---

### 6. Fixed Card IDs - EMPTY IN HERO DEFINITIONS
**Files:**
- `client/src/game/data/norseHeroes/heroDefinitions.ts`
- `client/src/game/data/norseHeroes/additionalHeroes.ts`

**Status:** All 36 heroes have `fixedCardIds: []` (empty arrays).

**ChessPieceConfig.ts Status:** Has `HERO_FIXED_CARDS` with actual card ID arrays.

**Gap:** Norse hero definitions don't reference the card IDs. The linking happens through:
```typescript
fixedCardIds: HERO_FIXED_CARDS['priest-anduin']
```
But this is in ChessPieceConfig, not in the hero definitions themselves.

**Impact:** If code uses `norseHero.fixedCardIds`, it gets empty arrays.

**To Fix:** Either populate hero definition fixedCardIds OR always use ChessPieceConfig lookups.

---

## STUB EFFECT HANDLERS (TODO Comments)

### Spell Effect Handlers with TODO
These handlers exist but contain only stub implementations:

| Handler File | Effect Type | Status |
|--------------|-------------|--------|
| `equip_special_weapon.ts` | Equip weapon | TODO stub |
| `armor_based_on_missing_health.ts` | Armor scaling | TODO stub |
| `cleave_damage.ts` | Cleave damage | TODO stub |
| `gain_armor_reduce_hero_power.ts` | Armor + cost reduction | TODO stub |
| `draw_weapon_gain_armor.ts` | Draw + armor | TODO stub |
| `buff_and_enchantHandler.ts` | Buff + enchant | TODO stub |
| `buff_damaged_minions.ts` | Conditional buff | TODO stub |
| `buff_weapon.ts` | Weapon buff | TODO stub |
| `resurrectRandomHandler.ts` | Resurrect random | TODO stub |
| `damage_based_on_armor.ts` | Armor-based damage | TODO stub |
| `damage_with_self_damage.ts` | Self-damage spell | TODO stub |
| `buffAndImmuneHandler.ts` | Buff + immune | TODO stub |
| `gain_armor_reduce_cost.ts` | Armor + discount | TODO stub |
| `mindControlTemporaryHandler.ts` | Temp mind control | TODO stub |
| `summonHandler.ts` | Summon minions | TODO stub |
| `aoe_damageHandler.ts` | AoE damage | Partial |
| `buffHandler.ts` | Generic buff | Partial |
| `gainArmorAndImmunityHandler.ts` | Armor + immunity | TODO stub |
| `armorHandler.ts` | Basic armor | TODO stub |

**Impact:** Many spell cards won't work correctly when played.

---

## OTHER STUBS

### 1. Fatigue Damage
**File:** `client/src/game/GameContext.ts:231`
```typescript
// TODO: Implement fatigue damage
```

### 2. Highlander Utils
**File:** `client/src/game/utils/highlanderUtils.ts:534`
```typescript
// TODO: Implement actual effect logic
```

### 3. Combo Effect - Buff Self
**File:** `client/src/game/effects/handlers/combo/buffSelfHandler.ts:36`
```typescript
// TODO: Implement the buff_self combo effect
```

---

## FULLY IMPLEMENTED FEATURES

| Feature | Status | Location |
|---------|--------|----------|
| All 36 Norse Hero definitions | ✅ Complete | heroDefinitions.ts, additionalHeroes.ts |
| All 9 King definitions | ✅ Complete | kingDefinitions.ts |
| Hero Power execution logic | ✅ Complete | norseHeroPowerUtils.ts |
| King Passive execution logic | ✅ Complete | kingPassiveUtils.ts |
| Fixed Card mappings | ✅ Complete | ChessPieceConfig.ts |
| Poker combat system | ✅ Complete | PokerCombatStore.ts |
| Element weakness buffs | ✅ Complete | ChessTypes.ts, PokerCombatStore.ts |
| Mana system | ✅ Complete | gameStore.ts |
| STA betting cap | ✅ Complete | PokerCombatStore.ts |
| Basic hero power UI | ✅ Working | RagnarokCombatArena.tsx |

---

## PRIORITY FIXES

### High Priority (Core Gameplay)
1. **Wire King Passives** - Call execution functions from game loop
2. **Wire Hero Passives** - Call execution functions from game loop  
3. **Integrate Shared Deck Store** - Enable deck shrinking mechanic

### Medium Priority (Feature Complete)
4. **Implement Weapon Upgrades** - Add to deck and create play handler
5. **Fix Norse Hero fixedCardIds** - Populate arrays or unify lookup

### Low Priority (Polish)
6. **Refactor Hero Power** - Use utility instead of inline code
7. **Complete Spell Stubs** - Implement remaining effect handlers

---

## SUMMARY

| Category | Count |
|----------|-------|
| Critical gaps (defined but not wired) | 6 |
| Stub effect handlers | 18+ |
| Other TODO stubs | 3 |
| Fully implemented features | 10+ |

The codebase has comprehensive **data definitions** and **execution logic**, but the **integration layer** connecting them to the game loop is largely missing. The poker combat and basic card game work, but Norse-specific features (king passives, hero passives, weapon upgrades, deck shrinking) are not functional.

# Lessons Learned

Patterns and rules captured from mistakes and corrections to prevent recurrence.

---

## Art Mapping

### Bulk art assignment without visual verification causes mismatches
- **Pattern**: 119 VERCEL_CARD_ART entries were alphabetically mapped to CHARACTER_ART_IDS without checking what each image depicts
- **Result**: Bears showed raptor images, dragons showed wolves, boars showed snakes
- **Rule**: Never bulk-assign art by ID ordering. Every art→card mapping must be verified thematically (creature type must match card name/description)
- **Rule**: MINION_CARD_TO_ART uses 1:1 curated mappings with comments — this is the correct pattern

### Character art in VERCEL_CARD_ART gets silently blocked or mismatched
- **Pattern**: VERCEL entries using hero/god art IDs are blocked by `getCardArtPath()` filter (returns null). Entries using creature art IDs bypass the filter but show wrong images.
- **Rule**: VERCEL_CARD_ART should only contain unique AI-generated art IDs (not from CHARACTER_ART_IDS). Creature art belongs exclusively in MINION_CARD_TO_ART.

---

## Health System

### heroHealth vs health dual-field trap
- **Pattern**: Player type has `health` (legacy) and `heroHealth` (canonical). Code that writes to `.health` instead of `.heroHealth` silently fails — damage appears to do nothing.
- **Rule**: ALL hero damage must go through `dealDamage()` in `damageUtils.ts`. Never write `.health -=` directly.

### .armor vs .heroArmor field mismatch
- **Pattern**: `dealDamageToHero()` reads `.heroArmor` but 8+ places wrote to `.armor` (different field). Armor was silently dropped.
- **Rule**: Always use `.heroArmor` for armor grants. Search codebase for `.armor` if adding armor logic.

### Hardcoded maxHealth=30
- **Pattern**: Multiple heal functions capped at 30 HP, breaking Prince Renathal (40) and Lord Jaraxxus (15).
- **Rule**: Always use `(player as any).maxHealth || 30` for heal caps.

---

## State Management

### Shallow copy leaks mutations
- **Pattern**: `{ ...gameState }` only copies top-level. Mutations to `.secrets[]` or `.battlefield[]` leak into original state.
- **Rule**: Use `JSON.parse(JSON.stringify(state))` for deep copies when mutating nested arrays/objects.

### Zustand store re-entry
- **Pattern**: `selectAttacker` could be called twice for the same card, creating duplicate targeting state and freezing poker combat.
- **Rule**: Add re-entry guards for actions that start multi-step flows (targeting, combat resolution).

---

## Poker Combat

### Timer expiry should be conservative (fold/check, not call)
- **Pattern**: Auto-calling on timeout punishes players who step away. Bad UX.
- **Rule**: Timer expiry = auto-fold (if bet pending) or auto-check (if no bet). Never auto-call.

### RESOLUTION phase can get stuck
- **Pattern**: If `isReady` flags aren't set, `resolveCombat()` never fires and no backup timer triggers.
- **Rule**: Always have an independent escape timer for RESOLUTION phase (12s) that doesn't depend on showdown state.

---

## CSS/UI

### Fixed-position root breaks page scrolling
- **Pattern**: `#root { position: fixed; height: 100% }` means child pages need `h-full overflow-y-auto`, not `min-h-screen`.
- **Rule**: For scrollable pages inside a fixed root, use `h-full overflow-y-auto pb-16`.

### Overlapping fixed elements
- **Pattern**: `.phase-timer` (fixed, top:20px, z-8000) overlapped `.hud-turn-counter` (absolute, top:8px).
- **Rule**: Check z-index tiers in tokens.css and vertical stacking before positioning new HUD elements.

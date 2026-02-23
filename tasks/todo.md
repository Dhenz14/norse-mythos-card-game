# Task Tracker

## Completed (This Session)
- [x] Fix timer expiry: auto-fold/check instead of auto-call
- [x] Raise poker timer from 40s to 60s
- [x] Art QC sweep: removed 119 mismatched VERCEL_CARD_ART entries (83 showing wrong images, 36 dead code)
- [x] Verified MINION_CARD_TO_ART: all 84 entries correctly matched
- [x] Verified remaining 356 VERCEL entries: zero missing files, zero duplicates
- [x] TypeScript compiles clean (0 errors)

## Backlog
- [ ] ~21 creature-themed cards have no art (tokens/transforms — using gradient fallback, acceptable)
- [ ] ~287 non-creature cards have no art mapping (using gradient fallback)
- [ ] Packs page overhaul plan exists (see plan file) — not yet implemented

## Review
All changes verified via `npx tsc --noEmit` (0 errors). Art integrity check passed: all file references valid, no duplicates.

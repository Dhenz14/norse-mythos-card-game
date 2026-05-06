# Beta-Testnet Scope

## Objective

Validate Ragnarok's full shared architecture before mainnet: gameplay, P2P, match results, rewards, NFT ownership, packs, replay, indexing, and economy flows.

Beta-testnet state is temporary. Progress, rankings, rewards, packs, and NFTs created during testnet are reset before mainnet.

## Environment Model

| Stage | Purpose | Persistence | Economic risk |
|-------|---------|-------------|---------------|
| `local` | Private development, mocks, full catalog access, fast iteration. | Resettable. | None. |
| `testnet` | Shared beta network for real users and full architecture validation. | Resettable at beta wipe. | No permanent value. |
| `mainnet` | Production economy, final supply, permanent ownership. | Permanent. | Real. |

`VITE_NETWORK_STAGE` is the source of truth for permanence:

- `local`: private development.
- `testnet`: shared resettable beta.
- `mainnet`: permanent economic environment.

`VITE_DATA_LAYER_MODE` only defines where data comes from:

- `local`: browser/dev data.
- `test`: mock/test server data.
- `hive`: Hive L1 replay or indexed data.

Network constants live in `client/src/game/config/networkConfig.ts`. They define protocol namespace, collection id, admin/index accounts, indexer endpoints, art endpoints, NFTLox protocol id, and reset/economic policy per stage.

The active frontend config is resolved once as `RAGNAROK_NETWORK_CONFIG`, so runtime consumers should import constants/helpers instead of rebuilding env-derived strings.

Operational startup lives in `docs/TESTNET_RUNBOOK.md`. The canonical local command is:

```bash
npm run dev:testnet
```

The expected testnet shape is mainnet-like:

- Same gameplay, replay, P2P and reward validation rules as mainnet.
- Different `custom_json` protocol id: `rk_game_testnet`.
- Different collection id.
- Different indexer and art endpoints when available.
- Different admin/index accounts when needed.
- Resettable state with no permanent economic value.

## Current Status — 2026-05-06

- Central network config exists in `client/src/game/config/networkConfig.ts`.
- Testnet protocol id is `rk_game_testnet`.
- Testnet collection id is `ragnarok-testnet`.
- `npm run dev:testnet` starts the app with `.env.testnet`.
- The UI shows a persistent `TESTNET` header badge.
- The resettable testnet banner is dismissible.
- Client broadcasters and replay filters consume `RAGNAROK_APP_ID` / protocol constants instead of hardcoded testnet strings.
- Server/indexer protocol filters accept the configured protocol namespace through shared constants.
- P2P wire layer validated at the trust boundary: every inbound envelope passes through `parseWireMessage` (zod) before the bridge dispatch (TD-24a, 2026-05-05). The bridge no longer accepts unverified shapes.
- Per-command divergence detection uses WASM canonical state hashes for both wire paths: cards `game_command` envelopes carry `prevStateHash` over `computeStateHashSync` (TD-27c-cards, 2026-05-05), and chess `chess_command` envelopes carry a dual hash `prevChessStateHash` + `prevCardsStateHash` over canonical chess snapshot + cards GameState (TD-27c-chess, 2026-05-06). Domain-specific reject codes (`prev_chess_state_hash_mismatch` / `prev_cards_state_hash_mismatch`) localize forensics to the diverging slice.
- Periodic 2s `hash_check` beacon broadcasts both cards and chess hashes (TD-27c-chess F3, 2026-05-06); cross-peer divergence is detected per-envelope at move time and per-beacon while idle. Slash evidence trxIds carry `cards_` / `chess_` infix for slice attribution.
- Match modes are physically separated under `client/src/game/match/modes/{single,campaign,p2p}/` with ESLint-enforced isolation; gameplay routes split as `/game/single` and `/game/campaign`, while legacy `/game` redirects to `/game/single`.

## Next Gate

Perform the first Hive smoke test:

1. Start with `npm run dev:testnet`.
2. Connect Hive Keychain.
3. Broadcast a low-risk op, preferably queue join/leave or match anchor.
4. Verify Hive shows `custom_json` id `rk_game_testnet`.
5. Verify client replay sees the same op.

## Beta Modes

- Single (PvE practice) — no reward.
- Campaign (PvE) — ~10% xpRunes per mission (multiplier overridable per mission).
- Multiplayer P2P manual host/join — 100% xpRunes + ELO ranking.
- Quick Match P2P as experimental matchmaking, not official ranked.

## Not Permanent In Beta

- Official ranked rewards.
- Final genesis assets or supply.
- Mainnet reward claims.
- Production marketplace value.
- Irreversible production seal.

## Runtime Rules

- `local` can bypass shared-network checks for development speed.
- `testnet` should behave like a shared network: verify ownership, detect duplicate/conflicting results, and produce replayable evidence where possible.
- `mainnet` is the only economic environment.

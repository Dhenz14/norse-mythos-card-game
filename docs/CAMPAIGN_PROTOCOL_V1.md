# Campaign Protocol V1

Campaign progress is derived from Hive `custom_json` operations, not from
client-local `completedMissions`. The server indexer is a convenience reader:
any compatible indexer should be able to derive the same state from chain ops,
the campaign registry hash, and deterministic replay.

## Operation

V1 introduces `rp_campaign_result`, normalized by `protocol-core` to
`campaign_result`.

Payload:

```json
{
  "v": 1,
  "m": "norse-1",
  "d": "normal",
  "n": 12,
  "sb": 12345678,
  "rh": "ruleset_hash",
  "tr": "transcript_root",
  "tc": "ipfs://optional-transcript-cid",
  "fh": "final_state_hash",
  "t": 9
}
```

Field notes:

- `m`: mission id.
- `d`: `normal`, `heroic`, or `mythic`.
- `n`: campaign-specific monotonic nonce for the broadcaster.
- `sb`: start block used for seed derivation.
- `rh`: campaign registry hash.
- `tr`: transcript Merkle root.
- `tc`: optional transcript CID.
- `fh`: final state hash.
- `t`: turn count. Stars are recalculated by the indexer.

The Hive broadcaster is the authoritative account. Payload usernames are not
trusted and are intentionally omitted.

## Seed

The campaign seed is derived by the indexer:

```txt
sha256(canonical({
  domain: "ragnarok:campaign:v1",
  account: op.broadcaster,
  missionId,
  difficulty,
  nonce,
  startBlockId,
  rulesetHash
}))
```

This binds a result to the signing Hive account, mission, difficulty, nonce,
start block, and campaign ruleset.

## V1 State

The testnet server persists derived campaign state in `data/chain-state.json`
through the existing `StateAdapter` path:

- `campaignNonces`
- `campaignResults`
- `campaignProgress`

`campaignResults` are stored as `pending_verification` until deterministic
campaign replay is implemented. `campaignProgress` is only written by a verifier
that can replay and confirm the result.

## Rewards

`reward_claim campaign:{missionId}` is gated by verified campaign progress.
Pending results do not unlock economic rewards.

## Registry

The verification registry lives at:

```txt
shared/campaign/campaign-registry.v1.json
```

It intentionally contains only replay/progression-relevant mission data, not
narrative copy, music, visuals, or layout. The current canonical hash is exposed
by `shared/campaign/registry.ts`.

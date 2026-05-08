/**
 * playerIdentity.ts — Map P2P session identities to transcript playerId strings.
 *
 * Why this exists: the transcript is the evidentiary record submitted to the
 * server arbitrator (and ultimately the Hive chain via match_result custom_json).
 * For arbitration to work, every move must carry an identifier that maps back
 * to a real Hive account. Pre-Option-B the transcript stored viewer-relative
 * literals ('player' / 'opponent') which are meaningless to a third-party
 * arbitrator: both peers wrote 'player' for their own moves, so the same
 * identifier referred to two different humans.
 *
 * Resolution: prefer the Hive username (announced via `seed_reveal.hiveUsername`
 * for the remote peer, `getNFTBridge().getUsername()` for the local one). When
 * absent — guest/dev sessions where the user never logged in with Keychain —
 * fall back to a `'guest:'`-prefixed peerId slice. The prefix is the explicit
 * marker that tells any downstream consumer this move is NOT arbitrable on
 * Hive (no signed match_result possible without a Hive account).
 *
 * Pure functions, no IO, no store reads. Callers pass the raw inputs they
 * already hold; the module owns the fallback policy in one place.
 */

const GUEST_PREFIX = 'guest:';
const PEER_ID_FALLBACK_LENGTH = 8;

function guestSentinel(peerId: string | null): string {
	const slice = (peerId ?? 'unknown').slice(0, PEER_ID_FALLBACK_LENGTH);
	return GUEST_PREFIX + slice;
}

/**
 * Build the playerId for a move executed by the LOCAL peer.
 * `myPeerId` is consulted only when no Hive username is available.
 */
export function localPlayerId(input: {
	readonly hiveUsername: string | null;
	readonly myPeerId: string | null;
}): string {
	if (input.hiveUsername && input.hiveUsername.length > 0) return input.hiveUsername;
	return guestSentinel(input.myPeerId);
}

/**
 * Build the playerId for a move executed by the REMOTE peer (received over
 * the wire). `opponentUsername` is captured during `seed_reveal`; if the
 * remote peer didn't announce one, fall back to their peerId.
 */
export function remotePlayerId(input: {
	readonly opponentUsername: string | null;
	readonly remotePeerId: string | null;
}): string {
	if (input.opponentUsername && input.opponentUsername.length > 0) return input.opponentUsername;
	return guestSentinel(input.remotePeerId);
}

/**
 * Predicate: is this id the guest sentinel? Useful for arbitrator-side
 * logic that wants to filter out non-arbitrable matches before processing.
 */
export function isGuestPlayerId(playerId: string): boolean {
	return playerId.startsWith(GUEST_PREFIX);
}

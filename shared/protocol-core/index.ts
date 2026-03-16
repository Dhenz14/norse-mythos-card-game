/**
 * Ragnarok Protocol Core — Public API
 *
 * Single entry point for protocol op processing.
 * Both client and server call this with their own StateAdapter implementation.
 */

export { normalizeRawOp } from './normalize';
export type { NormalizeResult } from './normalize';
export { applyOp, autoFinalizeExpiredCommits } from './apply';
export type { ProtocolCoreDeps } from './apply';
export { canonicalStringify, sha256Hash } from './hash';
export { verifyPoW, deriveChallenge, POW_CONFIG } from './pow';
export type { PoWConfig, PoWResult } from './pow';
export * from './types';

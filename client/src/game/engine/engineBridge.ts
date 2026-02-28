/**
 * engineBridge.ts - TypeScript ↔ WASM bridge
 *
 * Provides a unified interface for game state transitions and verification.
 * After each action (applied via the TS game engine), the state is
 * canonically serialized and hashed through the WASM module for P2P
 * anti-cheat verification.
 *
 * Anti-cheat mechanism:
 * 1. Both peers verify identical WASM binary hash at handshake
 * 2. After each action, both independently hash game state via WASM
 * 3. Hash mismatch → cheat detected (modified game logic)
 */

import { isWasmAvailable } from './wasmLoader';
import { isWasmReady, hashGameState } from './wasmInterface';
import { serializeGameState } from './stateSerializer';
import type { GameState } from '../types';

export type EngineAction =
	| { type: 'playCard'; cardIndex: number; target?: string }
	| { type: 'attack'; attackerId: string; defenderId: string }
	| { type: 'endTurn' }
	| { type: 'heroPower'; target?: string };

export interface EngineResult {
	state: GameState;
	hash: string;
	engine: 'wasm' | 'typescript';
}

async function hashStateTypescript(state: GameState): Promise<string> {
	const serialized = serializeGameState(state);
	const encoded = new TextEncoder().encode(serialized);
	const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
	const hashArray = new Uint8Array(hashBuffer);
	return Array.from(hashArray).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function applyAction(
	state: GameState,
	action: EngineAction,
): Promise<EngineResult> {
	// Game logic runs via the existing TS engine (gameStore actions).
	// This function computes the post-action state hash for P2P verification.
	// When WASM is available, hash is computed through the tamper-proof WASM
	// SHA-256 implementation. Otherwise, falls back to browser crypto.
	const hash = await computeStateHash(state);
	const engine = isWasmReady() ? 'wasm' as const : 'typescript' as const;

	return { state, hash, engine };
}

export async function computeStateHash(state: GameState): Promise<string> {
	if (isWasmReady()) {
		try {
			return hashGameState(state);
		} catch {
			// WASM hash failed — fall back to TS
		}
	}
	return hashStateTypescript(state);
}

export function getEngineType(): 'wasm' | 'typescript' {
	return isWasmAvailable() ? 'wasm' : 'typescript';
}

export function computeStateHashSync(state: GameState): string | null {
	if (!isWasmReady()) return null;
	try {
		return hashGameState(state);
	} catch {
		return null;
	}
}

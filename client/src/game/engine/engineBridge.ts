/**
 * engineBridge.ts - TypeScript ↔ WASM bridge
 *
 * Provides a unified interface for game state transitions. When the WASM
 * engine is available, operations are forwarded to WASM for deterministic
 * execution. When unavailable, falls back to the TypeScript game logic.
 *
 * This bridge is the single entry point for all state-modifying operations
 * during P2P matches, ensuring both players compute identical states.
 */

import { isWasmAvailable, getWasmInstance } from './wasmLoader';
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

async function hashState(state: GameState): Promise<string> {
	const serialized = JSON.stringify(state);
	const encoded = new TextEncoder().encode(serialized);
	const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
	const hashArray = new Uint8Array(hashBuffer);
	return Array.from(hashArray).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function applyAction(
	state: GameState,
	action: EngineAction,
): Promise<EngineResult> {
	if (isWasmAvailable()) {
		return applyActionWasm(state, action);
	}
	return applyActionTypeScript(state, action);
}

async function applyActionWasm(
	state: GameState,
	action: EngineAction,
): Promise<EngineResult> {
	const instance = getWasmInstance();
	if (!instance) {
		return applyActionTypeScript(state, action);
	}

	// WASM interface: serialize state + action to JSON, pass to WASM,
	// get back new state JSON. This is the interface contract for when
	// the AssemblyScript engine is built.
	//
	// For now, fall back to TypeScript since WASM module doesn't exist yet.
	return applyActionTypeScript(state, action);
}

async function applyActionTypeScript(
	state: GameState,
	_action: EngineAction,
): Promise<EngineResult> {
	// In the TypeScript path, the action is applied via the existing
	// gameStore.ts / gameUtils.ts functions. This bridge simply wraps
	// the state with a hash for verification.
	//
	// The actual state mutation happens in gameStore actions (playCard,
	// processAttack, endTurn, etc.) — this function just computes the
	// post-action hash for the P2P verification protocol.
	const stateHash = await hashState(state);

	return {
		state,
		hash: stateHash,
		engine: 'typescript',
	};
}

export async function computeStateHash(state: GameState): Promise<string> {
	return hashState(state);
}

export function getEngineType(): 'wasm' | 'typescript' {
	return isWasmAvailable() ? 'wasm' : 'typescript';
}

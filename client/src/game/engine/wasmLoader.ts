/**
 * wasmLoader.ts - WASM module loader with hash verification
 *
 * Loads the deterministic game engine WASM module, initializes it with
 * card data, and verifies its hash. Both P2P players must have matching
 * WASM hashes to ensure deterministic gameplay.
 */

import {
	initializeWasm,
	getWasmBinaryHash,
	isWasmReady,
	getWasmLoadError as getInterfaceError,
	loadCardDataIntoWasm,
} from './wasmInterface';

let initialized = false;
let cardCount = 0;

export async function loadWasmEngine(): Promise<boolean> {
	if (initialized && isWasmReady()) return true;

	const success = await initializeWasm();
	if (!success) return false;

	try {
		const { cardRegistry } = await import('../data/cardRegistry');
		cardCount = await loadCardDataIntoWasm(cardRegistry);
	} catch {
		// Card data loading is non-fatal — hashing still works
	}

	initialized = true;
	return true;
}

export function getWasmHash(): string {
	if (isWasmReady()) return getWasmBinaryHash();
	if (typeof __BUILD_HASH__ !== 'undefined') return __BUILD_HASH__;
	return 'dev';
}

declare const __BUILD_HASH__: string;

export function isWasmAvailable(): boolean {
	return isWasmReady();
}

export function getWasmLoadError(): string | null {
	return getInterfaceError();
}

export function getLoadedCardCount(): number {
	return cardCount;
}

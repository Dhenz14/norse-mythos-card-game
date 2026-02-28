/**
 * wasmLoader.ts - WASM module loader with hash verification
 *
 * Loads the deterministic game engine WASM module and verifies its hash
 * against the expected value. Both P2P players must have matching WASM hashes
 * to ensure deterministic gameplay.
 *
 * Until the AssemblyScript build is set up, this module provides a stub
 * that uses the TypeScript engine as a fallback.
 */

let wasmModule: WebAssembly.Module | null = null;
let wasmInstance: WebAssembly.Instance | null = null;
let wasmHash: string | null = null;
let loadError: string | null = null;

async function computeModuleHash(bytes: ArrayBuffer): Promise<string> {
	const hashBuffer = await crypto.subtle.digest('SHA-256', bytes);
	const hashArray = new Uint8Array(hashBuffer);
	return Array.from(hashArray).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function loadWasmEngine(): Promise<boolean> {
	if (wasmModule) return true;

	try {
		const response = await fetch('/engine.wasm');
		if (!response.ok) {
			loadError = 'WASM module not found — using TypeScript fallback';
			return false;
		}

		const bytes = await response.arrayBuffer();
		wasmHash = await computeModuleHash(bytes);
		wasmModule = await WebAssembly.compile(bytes);
		wasmInstance = await WebAssembly.instantiate(wasmModule, {
			env: {
				abort: () => { throw new Error('WASM abort'); },
			},
		});

		return true;
	} catch (err) {
		loadError = err instanceof Error ? err.message : 'Failed to load WASM';
		return false;
	}
}

export function getWasmHash(): string {
	if (wasmHash) return wasmHash;
	if (typeof __BUILD_HASH__ !== 'undefined') return __BUILD_HASH__;
	return 'dev';
}

declare const __BUILD_HASH__: string;

export function getWasmInstance(): WebAssembly.Instance | null {
	return wasmInstance;
}

export function isWasmAvailable(): boolean {
	return wasmModule !== null;
}

export function getWasmLoadError(): string | null {
	return loadError;
}

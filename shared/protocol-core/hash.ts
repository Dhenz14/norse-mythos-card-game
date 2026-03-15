/**
 * Ragnarok Protocol Core — Canonical Hashing
 *
 * Isomorphic: works in both browser (crypto.subtle) and Node.js (node:crypto).
 * Matches the spec's canonical serialization rules exactly.
 */

function sortKeys(obj: unknown): unknown {
	if (obj === null || obj === undefined) return obj;
	if (Array.isArray(obj)) return obj.map(sortKeys);
	if (typeof obj === 'object') {
		const sorted: Record<string, unknown> = {};
		for (const key of Object.keys(obj as Record<string, unknown>).sort()) {
			sorted[key] = sortKeys((obj as Record<string, unknown>)[key]);
		}
		return sorted;
	}
	return obj;
}

export function canonicalStringify(obj: unknown): string {
	return JSON.stringify(sortKeys(obj));
}

export async function sha256Hash(data: string): Promise<string> {
	if (typeof globalThis.crypto?.subtle?.digest === 'function') {
		// Browser or Node 20+ with Web Crypto
		const encoder = new TextEncoder();
		const buffer = encoder.encode(data);
		const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', buffer);
		return Array.from(new Uint8Array(hashBuffer))
			.map(b => b.toString(16).padStart(2, '0'))
			.join('');
	}

	// Node.js fallback
	const { createHash } = await import('node:crypto');
	return createHash('sha256').update(data, 'utf8').digest('hex');
}

import { describe, it, expect } from 'vitest';
import { sha256Hash, canonicalStringify } from './hashUtils';

describe('hashUtils', () => {
	describe('sha256Hash', () => {
		it('produces a 64-char hex string', async () => {
			const hash = await sha256Hash('hello');
			expect(hash).toHaveLength(64);
			expect(hash).toMatch(/^[0-9a-f]{64}$/);
		});

		it('is deterministic', async () => {
			const a = await sha256Hash('test-input');
			const b = await sha256Hash('test-input');
			expect(a).toBe(b);
		});

		it('produces different hashes for different inputs', async () => {
			const a = await sha256Hash('input-a');
			const b = await sha256Hash('input-b');
			expect(a).not.toBe(b);
		});

		it('handles empty string', async () => {
			const hash = await sha256Hash('');
			expect(hash).toHaveLength(64);
		});
	});

	describe('canonicalStringify', () => {
		it('sorts keys deterministically', () => {
			const a = canonicalStringify({ z: 1, a: 2, m: 3 });
			const b = canonicalStringify({ a: 2, m: 3, z: 1 });
			expect(a).toBe(b);
		});

		it('handles nested objects', () => {
			const result = canonicalStringify({ b: { d: 1, c: 2 }, a: 3 });
			const parsed = JSON.parse(result);
			expect(parsed.a).toBe(3);
			expect(parsed.b.c).toBe(2);
			expect(parsed.b.d).toBe(1);
		});

		it('handles arrays (order preserved)', () => {
			const result = canonicalStringify({ items: [3, 1, 2] });
			const parsed = JSON.parse(result);
			expect(parsed.items).toEqual([3, 1, 2]);
		});
	});
});

import { describe, it, expect } from 'vitest';
import { computePoW, verifyPoW, deriveChallenge } from './proofOfWork';
import type { PoWConfig } from './proofOfWork';

const LIGHT_CONFIG: PoWConfig = { count: 4, difficulty: 2 };

describe('proofOfWork', () => {
	describe('deriveChallenge', () => {
		it('produces deterministic challenges', async () => {
			const a = await deriveChallenge('abc123', 0);
			const b = await deriveChallenge('abc123', 0);
			expect(a).toBe(b);
		});

		it('produces different challenges for different indices', async () => {
			const a = await deriveChallenge('abc123', 0);
			const b = await deriveChallenge('abc123', 1);
			expect(a).not.toBe(b);
		});

		it('produces different challenges for different payloads', async () => {
			const a = await deriveChallenge('payload-a', 0);
			const b = await deriveChallenge('payload-b', 0);
			expect(a).not.toBe(b);
		});
	});

	describe('computePoW + verifyPoW', () => {
		it('produces valid PoW that passes verification', async () => {
			const hash = 'deadbeef1234567890abcdef';
			const result = await computePoW(hash, LIGHT_CONFIG);
			expect(result.nonces).toHaveLength(LIGHT_CONFIG.count);
			const valid = await verifyPoW(hash, result, LIGHT_CONFIG);
			expect(valid).toBe(true);
		});

		it('fails verification with wrong payload hash', async () => {
			const result = await computePoW('correct-hash', LIGHT_CONFIG);
			const valid = await verifyPoW('wrong-hash', result, LIGHT_CONFIG);
			expect(valid).toBe(false);
		});

		it('fails verification with wrong nonce count', async () => {
			const hash = 'test-hash';
			const result = await computePoW(hash, LIGHT_CONFIG);
			result.nonces.pop();
			const valid = await verifyPoW(hash, result, LIGHT_CONFIG);
			expect(valid).toBe(false);
		});

		it('fails verification with tampered nonce', async () => {
			const hash = 'tamper-test';
			const result = await computePoW(hash, LIGHT_CONFIG);
			result.nonces[0] = result.nonces[0] + 999999;
			const valid = await verifyPoW(hash, result, LIGHT_CONFIG);
			expect(valid).toBe(false);
		});

		it('all nonces are non-negative integers', async () => {
			const result = await computePoW('nonce-check', LIGHT_CONFIG);
			for (const nonce of result.nonces) {
				expect(Number.isInteger(nonce)).toBe(true);
				expect(nonce).toBeGreaterThanOrEqual(0);
			}
		});
	});
});

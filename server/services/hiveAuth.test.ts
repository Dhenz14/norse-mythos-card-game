import { describe, it, expect } from 'vitest';
import { isValidHiveUsername, isTimestampFresh } from './hiveAuth';

describe('hiveAuth', () => {
	describe('isValidHiveUsername', () => {
		it('accepts valid Hive usernames', () => {
			expect(isValidHiveUsername('alice')).toBe(true);
			expect(isValidHiveUsername('bob123')).toBe(true);
			expect(isValidHiveUsername('user.name')).toBe(true);
			expect(isValidHiveUsername('my-account')).toBe(true);
			expect(isValidHiveUsername('abc')).toBe(true);
		});

		it('rejects too-short usernames', () => {
			expect(isValidHiveUsername('ab')).toBe(false);
			expect(isValidHiveUsername('a')).toBe(false);
			expect(isValidHiveUsername('')).toBe(false);
		});

		it('rejects too-long usernames', () => {
			expect(isValidHiveUsername('a'.repeat(17))).toBe(false);
		});

		it('rejects usernames starting with non-letter', () => {
			expect(isValidHiveUsername('1user')).toBe(false);
			expect(isValidHiveUsername('.user')).toBe(false);
			expect(isValidHiveUsername('-user')).toBe(false);
		});

		it('rejects uppercase characters', () => {
			expect(isValidHiveUsername('Alice')).toBe(false);
			expect(isValidHiveUsername('BOB')).toBe(false);
		});

		it('rejects special characters', () => {
			expect(isValidHiveUsername('user@name')).toBe(false);
			expect(isValidHiveUsername('user name')).toBe(false);
			expect(isValidHiveUsername('user_name')).toBe(false);
		});
	});

	describe('isTimestampFresh', () => {
		it('accepts current timestamp', () => {
			expect(isTimestampFresh(Date.now())).toBe(true);
		});

		it('accepts timestamp within 5 minute window', () => {
			expect(isTimestampFresh(Date.now() - 4 * 60 * 1000)).toBe(true);
		});

		it('rejects timestamp older than 5 minutes', () => {
			expect(isTimestampFresh(Date.now() - 6 * 60 * 1000)).toBe(false);
		});

		it('rejects future timestamp beyond 5 minutes', () => {
			expect(isTimestampFresh(Date.now() + 6 * 60 * 1000)).toBe(false);
		});
	});
});

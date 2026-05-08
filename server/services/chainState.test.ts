import { describe, it, expect } from 'vitest';
import {
	getPlayer,
	getOrCreatePlayer,
	getLeaderboard,
	recordMatch,
	getMatchHistory,
	registerAccount,
	isAccountKnown,
	advanceNonce,
	getStats,
} from './chainState';

describe('chainState', () => {
	describe('getOrCreatePlayer', () => {
		it('creates a player with default ELO 1000', () => {
			const p = getOrCreatePlayer('test-new-player');
			expect(p.elo).toBe(1000);
			expect(p.wins).toBe(0);
			expect(p.losses).toBe(0);
		});

		it('returns the same player on repeated calls', () => {
			const a = getOrCreatePlayer('test-repeat-player');
			const b = getOrCreatePlayer('test-repeat-player');
			expect(a).toBe(b);
		});
	});

	describe('recordMatch', () => {
		it('updates ELO for winner and loser', () => {
			const w = getOrCreatePlayer('elo-winner');
			const l = getOrCreatePlayer('elo-loser');
			const eloBefore = w.elo;

			recordMatch('match-elo-1', 'elo-winner', 'elo-loser', 'fp', Date.now(), 1);

			expect(w.elo).toBeGreaterThan(eloBefore);
			expect(l.elo).toBeLessThan(1000);
			expect(w.wins).toBe(1);
			expect(l.losses).toBe(1);
		});

		it('rejects duplicate matchIds', () => {
			getOrCreatePlayer('dup-a');
			getOrCreatePlayer('dup-b');
			recordMatch('match-dup', 'dup-a', 'dup-b', 'fp', Date.now(), 1);
			const eloAfterFirst = getPlayer('dup-a')!.elo;

			recordMatch('match-dup', 'dup-a', 'dup-b', 'fp', Date.now(), 2);
			expect(getPlayer('dup-a')!.elo).toBe(eloAfterFirst);
		});

		it('ELO never goes below 0', () => {
			getOrCreatePlayer('weak-player');
			getOrCreatePlayer('strong-player');
			// Record many losses for weak-player
			for (let i = 0; i < 100; i++) {
				recordMatch(`match-loss-${i}`, 'strong-player', 'weak-player', 'fp', Date.now(), i);
			}
			expect(getPlayer('weak-player')!.elo).toBeGreaterThanOrEqual(0);
		});
	});

	describe('getLeaderboard', () => {
		it('returns players sorted by ELO descending', () => {
			getOrCreatePlayer('lb-a');
			getOrCreatePlayer('lb-b');
			recordMatch('match-lb-1', 'lb-a', 'lb-b', 'fp', Date.now(), 1);

			const { players } = getLeaderboard(10, 0);
			if (players.length >= 2) {
				for (let i = 1; i < players.length; i++) {
					expect(players[i].elo).toBeLessThanOrEqual(players[i - 1].elo);
				}
			}
		});

		it('only includes players with matches', () => {
			getOrCreatePlayer('lb-no-matches');
			const { players } = getLeaderboard(1000, 0);
			const noMatch = players.find(p => p.username === 'lb-no-matches');
			expect(noMatch).toBeUndefined();
		});
	});

	describe('getMatchHistory', () => {
		it('returns matches for a player', () => {
			getOrCreatePlayer('hist-a');
			getOrCreatePlayer('hist-b');
			recordMatch('match-hist-1', 'hist-a', 'hist-b', 'fp', Date.now(), 1);

			const matches = getMatchHistory('hist-a', 10);
			expect(matches.length).toBeGreaterThanOrEqual(1);
			expect(matches.some(m => m.matchId === 'match-hist-1')).toBe(true);
		});
	});

	describe('registerAccount / isAccountKnown', () => {
		it('registers and detects accounts', () => {
			expect(isAccountKnown('reg-test')).toBe(false);
			const isNew = registerAccount('reg-test');
			expect(isNew).toBe(true);
			expect(isAccountKnown('reg-test')).toBe(true);
		});

		it('returns false for duplicate registration', () => {
			registerAccount('reg-dup');
			expect(registerAccount('reg-dup')).toBe(false);
		});
	});

	describe('advanceNonce', () => {
		it('accepts higher nonce', () => {
			expect(advanceNonce('nonce-test', 1)).toBe(true);
			expect(advanceNonce('nonce-test', 2)).toBe(true);
		});

		it('rejects equal or lower nonce', () => {
			advanceNonce('nonce-reject', 5);
			expect(advanceNonce('nonce-reject', 5)).toBe(false);
			expect(advanceNonce('nonce-reject', 3)).toBe(false);
		});
	});

	describe('getStats', () => {
		it('returns aggregate stats', () => {
			const stats = getStats();
			expect(stats).toHaveProperty('totalPlayers');
			expect(stats).toHaveProperty('totalCards');
			expect(stats).toHaveProperty('totalMatches');
			expect(stats).toHaveProperty('knownAccounts');
			expect(stats).toHaveProperty('lastSyncedAt');
		});
	});
});

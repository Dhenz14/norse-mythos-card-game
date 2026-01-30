/**
 * CombatResolver - Pure TypeScript combat resolution logic
 * 
 * Handles damage calculation, HP updates, and combat outcomes.
 * No React dependencies.
 */

import { PokerCard, getCombinedHandName } from '../../types/PokerCombatTypes';

export interface HandEvaluation {
	rank: number;
	cards: PokerCard[];
	name: string;
}

export interface CombatResolution {
	winner: 'player' | 'opponent' | 'draw';
	resolutionType: 'showdown' | 'fold';
	playerHand: HandEvaluation;
	opponentHand: HandEvaluation;
	playerDamage: number;
	opponentDamage: number;
	playerFinalHealth: number;
	opponentFinalHealth: number;
	whoFolded?: 'player' | 'opponent';
}

export interface DamageMultiplier {
	handRank: number;
	multiplier: number;
}

const HAND_DAMAGE_MULTIPLIERS: Record<number, number> = {
	10: 3.0,  // Royal Flush
	9: 2.5,   // Straight Flush
	8: 2.0,   // Four of a Kind
	7: 1.75,  // Full House
	6: 1.5,   // Flush
	5: 1.25,  // Straight
	4: 1.0,   // Three of a Kind
	3: 0.75,  // Two Pair
	2: 0.5,   // One Pair
	1: 0.25,  // High Card
};

export function getDamageMultiplier(handRank: number): number {
	return HAND_DAMAGE_MULTIPLIERS[handRank] || 1.0;
}

export function calculateDamage(
	baseDamage: number,
	handRank: number,
	elementAdvantage: boolean = false
): number {
	let damage = Math.floor(baseDamage * getDamageMultiplier(handRank));
	if (elementAdvantage) {
		damage += 2;
	}
	return Math.max(0, damage);
}

export function resolveShowdown(
	playerHand: HandEvaluation,
	opponentHand: HandEvaluation,
	playerHpCommitted: number,
	opponentHpCommitted: number,
	playerCurrentHp: number,
	opponentCurrentHp: number
): CombatResolution {
	const pot = playerHpCommitted + opponentHpCommitted;
	
	let winner: 'player' | 'opponent' | 'draw';
	let playerDamage = 0;
	let opponentDamage = 0;
	
	if (playerHand.rank > opponentHand.rank) {
		winner = 'player';
		opponentDamage = pot;
	} else if (opponentHand.rank > playerHand.rank) {
		winner = 'opponent';
		playerDamage = pot;
	} else {
		winner = 'draw';
	}
	
	return {
		winner,
		resolutionType: 'showdown',
		playerHand,
		opponentHand,
		playerDamage,
		opponentDamage,
		playerFinalHealth: Math.max(0, playerCurrentHp - playerDamage),
		opponentFinalHealth: Math.max(0, opponentCurrentHp - opponentDamage)
	};
}

export function resolveFold(
	whoFolded: 'player' | 'opponent',
	playerHpCommitted: number,
	opponentHpCommitted: number,
	playerCurrentHp: number,
	opponentCurrentHp: number,
	foldPenalty: number
): CombatResolution {
	const winner = whoFolded === 'player' ? 'opponent' : 'player';
	const emptyHand: HandEvaluation = { rank: 0, cards: [], name: 'Folded' };
	
	const playerDamage = whoFolded === 'player' ? foldPenalty : 0;
	const opponentDamage = whoFolded === 'opponent' ? foldPenalty : 0;
	
	return {
		winner,
		resolutionType: 'fold',
		playerHand: emptyHand,
		opponentHand: emptyHand,
		playerDamage,
		opponentDamage,
		playerFinalHealth: Math.max(0, playerCurrentHp - playerDamage),
		opponentFinalHealth: Math.max(0, opponentCurrentHp - opponentDamage),
		whoFolded
	};
}

export function isHeroDead(hp: number): boolean {
	return hp <= 0;
}

export function getWinnerFromHealth(
	playerHp: number,
	opponentHp: number
): 'player' | 'opponent' | 'draw' | null {
	if (playerHp <= 0 && opponentHp <= 0) return 'draw';
	if (playerHp <= 0) return 'opponent';
	if (opponentHp <= 0) return 'player';
	return null;
}

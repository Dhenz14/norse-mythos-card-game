import type {
	CardXPConfig,
	CardXPReward,
	CardLevelBonus,
	CardUidMapping,
	XPConfigMap,
	HiveCardAsset
} from './types';

export const XP_CONFIG: XPConfigMap = {
	free:      { rarity: 'free',      xpPerWin: 5,  xpPerMvp: 0,  maxLevel: 5,  thresholds: [0, 20, 50, 100, 180] },
	basic:     { rarity: 'basic',     xpPerWin: 5,  xpPerMvp: 0,  maxLevel: 5,  thresholds: [0, 20, 50, 100, 180] },
	common:    { rarity: 'common',    xpPerWin: 10, xpPerMvp: 3,  maxLevel: 10, thresholds: [0, 25, 60, 110, 180, 270, 380, 510, 660, 830] },
	rare:      { rarity: 'rare',      xpPerWin: 15, xpPerMvp: 5,  maxLevel: 8,  thresholds: [0, 40, 100, 190, 310, 460, 640, 850] },
	epic:      { rarity: 'epic',      xpPerWin: 20, xpPerMvp: 8,  maxLevel: 6,  thresholds: [0, 60, 160, 320, 540, 820] },
	legendary: { rarity: 'legendary', xpPerWin: 25, xpPerMvp: 10, maxLevel: 4,  thresholds: [0, 100, 300, 600] },
};

const LEVEL_BONUSES: Record<string, CardLevelBonus[]> = {
	common: [
		{ level: 1, attackBonus: 0, healthBonus: 0 },
		{ level: 2, attackBonus: 0, healthBonus: 1 },
		{ level: 3, attackBonus: 1, healthBonus: 1 },
		{ level: 4, attackBonus: 1, healthBonus: 2 },
		{ level: 5, attackBonus: 1, healthBonus: 2 },
		{ level: 6, attackBonus: 2, healthBonus: 3 },
		{ level: 7, attackBonus: 2, healthBonus: 3 },
		{ level: 8, attackBonus: 2, healthBonus: 4 },
		{ level: 9, attackBonus: 3, healthBonus: 4 },
		{ level: 10, attackBonus: 3, healthBonus: 5 },
	],
	rare: [
		{ level: 1, attackBonus: 0, healthBonus: 0 },
		{ level: 2, attackBonus: 0, healthBonus: 1 },
		{ level: 3, attackBonus: 1, healthBonus: 1 },
		{ level: 4, attackBonus: 1, healthBonus: 2 },
		{ level: 5, attackBonus: 2, healthBonus: 2 },
		{ level: 6, attackBonus: 2, healthBonus: 3 },
		{ level: 7, attackBonus: 3, healthBonus: 3 },
		{ level: 8, attackBonus: 3, healthBonus: 4 },
	],
	epic: [
		{ level: 1, attackBonus: 0, healthBonus: 0 },
		{ level: 2, attackBonus: 1, healthBonus: 1 },
		{ level: 3, attackBonus: 1, healthBonus: 2 },
		{ level: 4, attackBonus: 2, healthBonus: 2 },
		{ level: 5, attackBonus: 2, healthBonus: 3 },
		{ level: 6, attackBonus: 3, healthBonus: 4 },
	],
	legendary: [
		{ level: 1, attackBonus: 0, healthBonus: 0 },
		{ level: 2, attackBonus: 1, healthBonus: 2 },
		{ level: 3, attackBonus: 2, healthBonus: 3 },
		{ level: 4, attackBonus: 3, healthBonus: 5 },
	],
};

function getConfig(rarity: string): CardXPConfig {
	return XP_CONFIG[rarity.toLowerCase()] || XP_CONFIG.common;
}

export function getLevelForXP(rarity: string, xp: number): number {
	const config = getConfig(rarity);
	let level = 1;
	for (let i = config.thresholds.length - 1; i >= 0; i--) {
		if (xp >= config.thresholds[i]) {
			level = i + 1;
			break;
		}
	}
	return Math.min(level, config.maxLevel);
}

export function getXPForLevel(rarity: string, level: number): number {
	const config = getConfig(rarity);
	const idx = Math.max(0, Math.min(level - 1, config.thresholds.length - 1));
	return config.thresholds[idx];
}

export function getXPToNextLevel(rarity: string, currentXP: number): number | null {
	const config = getConfig(rarity);
	const currentLevel = getLevelForXP(rarity, currentXP);
	if (currentLevel >= config.maxLevel) return null;
	const nextThreshold = config.thresholds[currentLevel];
	return nextThreshold - currentXP;
}

export function isMaxLevel(rarity: string, level: number): boolean {
	const config = getConfig(rarity);
	return level >= config.maxLevel;
}

export function calculateXPGain(rarity: string, isWin: boolean, isMvp: boolean): number {
	if (!isWin) return 0;
	const config = getConfig(rarity);
	let xp = config.xpPerWin;
	if (isMvp) xp += config.xpPerMvp;
	return xp;
}

export function getLevelBonuses(rarity: string, level: number): CardLevelBonus {
	const key = rarity.toLowerCase();
	const bonuses = LEVEL_BONUSES[key] || LEVEL_BONUSES.common;
	const idx = Math.max(0, Math.min(level - 1, bonuses.length - 1));
	return bonuses[idx];
}

export function calculateXPRewards(
	cardUids: CardUidMapping[],
	cardCollection: HiveCardAsset[] | null | undefined,
	cardRarities: Map<number, string>,
	mvpCardUid: string | null
): CardXPReward[] {
	const rewards: CardXPReward[] = [];

	for (const mapping of cardUids) {
		const rarity = cardRarities.get(mapping.cardId) || 'common';
		const isMvp = mapping.uid === mvpCardUid;
		const xpGained = calculateXPGain(rarity, true, isMvp);

		if (xpGained === 0) continue;

		// Default xp=0 when card isn't in the collection yet (new card, first time earning XP)
		const asset = cardCollection?.find(c => c.uid === mapping.uid);
		const xpBefore = asset?.xp ?? 0;
		const xpAfter = xpBefore + xpGained;
		const levelBefore = getLevelForXP(rarity, xpBefore);
		const levelAfter = getLevelForXP(rarity, xpAfter);

		rewards.push({
			cardUid: mapping.uid,
			cardId: mapping.cardId,
			xpBefore,
			xpGained,
			xpAfter,
			levelBefore,
			levelAfter,
			didLevelUp: levelAfter > levelBefore,
		});
	}

	return rewards;
}

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Difficulty } from './campaignTypes';
import { getNFTBridge } from '../nft';
import { debug } from '../config/debugConfig';
import { triggerAutoSave } from '../stores/saveStateManager';
import { CAMPAIGN_ID } from '@shared/campaign/constants';
import { createCampaignRunDraft, saveCampaignRunDraft } from './campaignResultAdapter';

const STAGED_CAMPAIGN_SESSION_KEY = 'ragnarok-campaign-staged-mission';

export type StagedCampaignMission = {
	missionId: string;
	difficulty: Difficulty;
	localRunId: string | null;
};

function writeStagedCampaignMission(staged: StagedCampaignMission): void {
	if (typeof window === 'undefined') return;
	try {
		window.sessionStorage.setItem(STAGED_CAMPAIGN_SESSION_KEY, JSON.stringify(staged));
	} catch {
		// Session storage can be unavailable in private/locked-down contexts.
	}
}

export function readStagedCampaignMission(): StagedCampaignMission | null {
	if (typeof window === 'undefined') return null;
	try {
		const raw = window.sessionStorage.getItem(STAGED_CAMPAIGN_SESSION_KEY);
		if (!raw) return null;
		const parsed = JSON.parse(raw) as Partial<StagedCampaignMission>;
		if (typeof parsed.missionId !== 'string') return null;
		if (parsed.difficulty !== 'normal' && parsed.difficulty !== 'heroic' && parsed.difficulty !== 'mythic') {
			return null;
		}
		return {
			missionId: parsed.missionId,
			difficulty: parsed.difficulty,
			localRunId: typeof parsed.localRunId === 'string' ? parsed.localRunId : null,
		};
	} catch {
		return null;
	}
}

function clearStagedCampaignMission(): void {
	if (typeof window === 'undefined') return;
	try {
		window.sessionStorage.removeItem(STAGED_CAMPAIGN_SESSION_KEY);
	} catch {
		// Non-fatal; the in-memory store remains authoritative.
	}
}

interface MissionCompletion {
	difficulty: Difficulty;
	completedAt: number;
	bestTurns: number;
	bestDifficulty: Difficulty;
}

interface CampaignState {
	completedMissions: Record<string, MissionCompletion>;
	currentMission: string | null;
	currentRunId: string | null;
	currentDifficulty: Difficulty;
	rewardsClaimed: string[];
	seenCinematics: string[];
	// Transient per-mission runtime state — never persisted. Resets on
	// startMission/clearCurrent so a fresh mission boots clean.
	bossRulesApplied: boolean;
}

interface CampaignActions {
	startMission: (missionId: string, difficulty: Difficulty) => void;
	completeMission: (missionId: string, difficulty: Difficulty, turns: number) => void;
	claimReward: (missionId: string) => void;
	isMissionCompleted: (missionId: string) => boolean;
	isMissionUnlocked: (missionId: string, prerequisites: string[]) => boolean;
	getChapterProgress: (chapterId: string, missionIds: string[]) => number;
	isAllBaseChaptersComplete: (chapterMissionIds: Record<string, string[]>) => boolean;
	markCinematicSeen: (chapterId: string) => void;
	hasCinematicBeenSeen: (chapterId: string) => boolean;
	clearCurrent: () => void;
	reset: () => void;
	markBossRulesApplied: () => void;
	resetBossRulesApplied: () => void;
}

export const useCampaignStore = create<CampaignState & CampaignActions>()(
	persist(
		(set, get) => ({
			completedMissions: {},
			currentMission: null,
			currentRunId: null,
			currentDifficulty: 'normal',
			rewardsClaimed: [],
			seenCinematics: [],
			bossRulesApplied: false,

				startMission: (missionId, difficulty) => {
					const account = getNFTBridge().getUsername();
					const run = createCampaignRunDraft({ account, missionId, difficulty });
					saveCampaignRunDraft(run)
						.catch(err => debug.warn('[campaignStore] Failed to record campaign run:', err));
					writeStagedCampaignMission({
						missionId,
						difficulty,
						localRunId: run.localRunId,
					});
					set({
						currentMission: missionId,
						currentRunId: run.localRunId,
					currentDifficulty: difficulty,
					bossRulesApplied: false,
				});
			},

				completeMission: (missionId, difficulty, turns) => {
					const existing = get().completedMissions[missionId];
					const better = !existing || turns < existing.bestTurns;
					const diffOrder: Record<Difficulty, number> = { normal: 0, heroic: 1, mythic: 2 };
					const existingDiff = existing?.bestDifficulty ?? existing?.difficulty ?? 'normal';
					const bestDiff = diffOrder[difficulty] > diffOrder[existingDiff] ? difficulty : existingDiff;
					clearStagedCampaignMission();
					set(state => ({
						completedMissions: {
						...state.completedMissions,
						[missionId]: {
							difficulty,
							completedAt: Date.now(),
							bestTurns: better ? turns : (existing?.bestTurns ?? turns),
							bestDifficulty: bestDiff,
						},
					},
					currentMission: null,
					currentRunId: null,
				}));
				triggerAutoSave();
			},

			claimReward: (missionId) => {
				if (get().rewardsClaimed.includes(missionId)) return;
				set(state => ({
					rewardsClaimed: [...state.rewardsClaimed, missionId],
				}));
				if (getNFTBridge().isHiveMode()) {
					getNFTBridge().claimReward(`campaign:${CAMPAIGN_ID}:${missionId}`)
					.then(r => { if (r.success && r.trxId) getNFTBridge().emitTransactionConfirmed(r.trxId); })
					.catch(err => debug.warn('[campaignStore] Reward claim failed:', err));
				}
			},

			isMissionCompleted: (missionId) => {
				return !!get().completedMissions[missionId];
			},

			isMissionUnlocked: (missionId, prerequisites) => {
				if (prerequisites.length === 0) return true;
				const completed = get().completedMissions;
				return prerequisites.every(id => !!completed[id]);
			},

			getChapterProgress: (_chapterId, missionIds) => {
				const completed = get().completedMissions;
				return missionIds.filter(id => !!completed[id]).length;
			},

			isAllBaseChaptersComplete: (chapterMissionIds) => {
				const completed = get().completedMissions;
				return Object.values(chapterMissionIds).every(
					ids => ids.every(id => !!completed[id])
				);
			},

			markCinematicSeen: (chapterId) => {
				if (get().seenCinematics.includes(chapterId)) return;
				set(state => ({ seenCinematics: [...state.seenCinematics, chapterId] }));
			},

			hasCinematicBeenSeen: (chapterId) => {
				return get().seenCinematics.includes(chapterId);
			},

				clearCurrent: () => {
					clearStagedCampaignMission();
					set({
						currentMission: null,
						currentRunId: null,
						bossRulesApplied: false,
					});
				},
	
				reset: () => {
					clearStagedCampaignMission();
					set({
						completedMissions: {},
						currentMission: null,
						currentRunId: null,
						currentDifficulty: 'normal',
						rewardsClaimed: [],
						seenCinematics: [],
						bossRulesApplied: false,
					});
				},

			markBossRulesApplied: () => set({ bossRulesApplied: true }),
			resetBossRulesApplied: () => set({ bossRulesApplied: false }),
		}),
		{
			name: 'ragnarok-campaign',
			partialize: (state) => ({
				completedMissions: state.completedMissions,
				rewardsClaimed: state.rewardsClaimed,
				seenCinematics: state.seenCinematics,
			}),
		}
	)
);

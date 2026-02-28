import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Difficulty } from './campaignTypes';

interface MissionCompletion {
	difficulty: Difficulty;
	completedAt: number;
	bestTurns: number;
}

interface CampaignState {
	completedMissions: Record<string, MissionCompletion>;
	currentMission: string | null;
	currentDifficulty: Difficulty;
	rewardsClaimed: string[];
}

interface CampaignActions {
	startMission: (missionId: string, difficulty: Difficulty) => void;
	completeMission: (missionId: string, difficulty: Difficulty, turns: number) => void;
	claimReward: (missionId: string) => void;
	isMissionCompleted: (missionId: string) => boolean;
	isMissionUnlocked: (missionId: string, prerequisites: string[]) => boolean;
	getChapterProgress: (chapterId: string, missionIds: string[]) => number;
	clearCurrent: () => void;
	reset: () => void;
}

export const useCampaignStore = create<CampaignState & CampaignActions>()(
	persist(
		(set, get) => ({
			completedMissions: {},
			currentMission: null,
			currentDifficulty: 'normal',
			rewardsClaimed: [],

			startMission: (missionId, difficulty) => {
				set({ currentMission: missionId, currentDifficulty: difficulty });
			},

			completeMission: (missionId, difficulty, turns) => {
				const existing = get().completedMissions[missionId];
				const better = !existing || turns < existing.bestTurns;
				set(state => ({
					completedMissions: {
						...state.completedMissions,
						[missionId]: {
							difficulty,
							completedAt: Date.now(),
							bestTurns: better ? turns : (existing?.bestTurns ?? turns),
						},
					},
					currentMission: null,
				}));
			},

			claimReward: (missionId) => {
				if (get().rewardsClaimed.includes(missionId)) return;
				set(state => ({
					rewardsClaimed: [...state.rewardsClaimed, missionId],
				}));
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

			clearCurrent: () => set({ currentMission: null }),

			reset: () => set({
				completedMissions: {},
				currentMission: null,
				currentDifficulty: 'normal',
				rewardsClaimed: [],
			}),
		}),
		{
			name: 'ragnarok-campaign',
			partialize: (state) => ({
				completedMissions: state.completedMissions,
				rewardsClaimed: state.rewardsClaimed,
			}),
		}
	)
);

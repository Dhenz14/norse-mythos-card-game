import React, { useEffect } from 'react';
import { useDailyQuestStore, type DailyQuest } from '../../stores/dailyQuestStore';

function QuestCard({ quest, onClaim, onReroll, canReroll }: {
	quest: DailyQuest;
	onClaim: () => void;
	onReroll: () => void;
	canReroll: boolean;
}) {
	const pct = Math.min((quest.progress / quest.goal) * 100, 100);

	return (
		<div className="bg-gray-800/60 border border-gray-700/50 rounded-lg p-3 space-y-2">
			<div className="flex items-start justify-between">
				<div>
					<p className="text-sm font-semibold text-gray-200">{quest.title}</p>
					<p className="text-xs text-gray-400">{quest.description}</p>
				</div>
				<span className="text-xs text-amber-400 font-bold whitespace-nowrap ml-2">
					+{quest.reward.rune} RUNE
				</span>
			</div>

			<div className="relative h-2 bg-gray-700 rounded-full overflow-hidden">
				<div
					className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${quest.completed ? 'bg-green-500' : 'bg-amber-500'}`}
					style={{ width: `${pct}%` }}
				/>
			</div>

			<div className="flex items-center justify-between">
				<span className="text-xs text-gray-500">
					{quest.progress}/{quest.goal}
				</span>
				<div className="flex gap-2">
					{!quest.completed && !quest.claimed && canReroll && (
						<button
							onClick={onReroll}
							className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
						>
							Reroll
						</button>
					)}
					{quest.completed && !quest.claimed && (
						<button
							onClick={onClaim}
							className="px-2 py-0.5 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-semibold transition-colors"
						>
							Claim
						</button>
					)}
					{quest.claimed && (
						<span className="text-xs text-green-400 font-medium">Claimed</span>
					)}
				</div>
			</div>
		</div>
	);
}

export default function DailyQuestPanel() {
	const quests = useDailyQuestStore(s => s.quests);
	const rerollsUsed = useDailyQuestStore(s => s.rerollsUsedToday);
	const refreshIfNeeded = useDailyQuestStore(s => s.refreshIfNeeded);
	const claimReward = useDailyQuestStore(s => s.claimReward);
	const rerollQuest = useDailyQuestStore(s => s.rerollQuest);

	useEffect(() => { refreshIfNeeded(); }, [refreshIfNeeded]);

	if (quests.length === 0) return null;

	return (
		<div className="w-72 space-y-2">
			<h3 className="text-xs font-bold uppercase tracking-wider text-amber-400/70">
				Daily Quests
			</h3>
			{quests.map(quest => (
				<QuestCard
					key={quest.id}
					quest={quest}
					onClaim={() => claimReward(quest.id)}
					onReroll={() => rerollQuest(quest.id)}
					canReroll={rerollsUsed < 1}
				/>
			))}
		</div>
	);
}

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { routes } from '../../../lib/routes';
import { ALL_CHAPTERS, useCampaignStore, getMission } from '../../campaign';
import type { CampaignChapter, CampaignMission, Difficulty } from '../../campaign/campaignTypes';

const FACTION_COLORS: Record<string, string> = {
	norse: 'from-blue-900/80 to-cyan-900/60 border-cyan-600/40',
	greek: 'from-amber-900/80 to-yellow-900/60 border-amber-600/40',
	egyptian: 'from-orange-900/80 to-red-900/60 border-orange-600/40',
	celtic: 'from-green-900/80 to-emerald-900/60 border-green-600/40',
};

const FACTION_ACCENT: Record<string, string> = {
	norse: 'text-cyan-400',
	greek: 'text-amber-400',
	egyptian: 'text-orange-400',
	celtic: 'text-green-400',
};

function MissionNode({ mission, chapter, onSelect }: {
	mission: CampaignMission;
	chapter: CampaignChapter;
	onSelect: (m: CampaignMission) => void;
}) {
	const completed = useCampaignStore(s => s.isMissionCompleted(mission.id));
	const unlocked = useCampaignStore(s => s.isMissionUnlocked(mission.id, mission.prerequisiteIds));

	return (
		<button
			onClick={() => unlocked && onSelect(mission)}
			disabled={!unlocked}
			className={`w-full text-left p-3 rounded-lg border transition-all ${
				completed
					? 'bg-gray-800/40 border-green-600/40 hover:bg-gray-800/60'
					: unlocked
						? 'bg-gray-800/60 border-gray-600/40 hover:bg-gray-700/60 hover:border-gray-500/60'
						: 'bg-gray-900/40 border-gray-800/30 opacity-50 cursor-not-allowed'
			}`}
		>
			<div className="flex items-center gap-3">
				<div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
					completed ? 'bg-green-600 text-white' : unlocked ? 'bg-gray-700 text-gray-300' : 'bg-gray-800 text-gray-600'
				}`}>
					{completed ? '\u2713' : mission.missionNumber}
				</div>
				<div className="flex-1 min-w-0">
					<p className={`text-sm font-semibold ${completed ? 'text-green-300' : unlocked ? 'text-gray-200' : 'text-gray-600'}`}>
						{mission.name}
					</p>
					<p className="text-xs text-gray-500 truncate">{mission.description}</p>
				</div>
				{mission.bossRules.length > 0 && (
					<span className="text-xs bg-red-900/60 text-red-300 px-2 py-0.5 rounded border border-red-700/40">
						Boss
					</span>
				)}
			</div>
		</button>
	);
}

function MissionBriefing({ mission, chapter, onStart, onBack }: {
	mission: CampaignMission;
	chapter: CampaignChapter;
	onStart: (difficulty: Difficulty) => void;
	onBack: () => void;
}) {
	const [difficulty, setDifficulty] = useState<Difficulty>('normal');
	const completed = useCampaignStore(s => s.completedMissions[mission.id]);

	return (
		<div className="max-w-2xl mx-auto">
			<button onClick={onBack} className="text-gray-500 hover:text-gray-300 text-sm mb-4 transition-colors">
				&larr; Back to chapter
			</button>

			<h2 className={`text-2xl font-bold mb-2 ${FACTION_ACCENT[chapter.faction]}`}>
				{mission.name}
			</h2>

			<div className="bg-gray-900/60 border border-gray-800/60 rounded-xl p-5 mb-4">
				<p className="text-gray-300 text-sm leading-relaxed italic">
					"{mission.narrativeBefore}"
				</p>
			</div>

			{mission.bossRules.length > 0 && (
				<div className="bg-red-950/30 border border-red-800/40 rounded-lg p-4 mb-4">
					<h4 className="text-xs font-bold uppercase tracking-wider text-red-400 mb-2">Boss Rules</h4>
					{mission.bossRules.map((rule, i) => (
						<p key={i} className="text-sm text-red-300">{rule.description}</p>
					))}
				</div>
			)}

			<div className="flex items-center gap-3 mb-4">
				<span className="text-sm text-gray-400">Difficulty:</span>
				{(['normal', 'heroic', 'legendary'] as Difficulty[]).map(d => (
					<button
						key={d}
						onClick={() => setDifficulty(d)}
						className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
							difficulty === d
								? 'bg-amber-600 border-amber-500 text-white'
								: 'bg-gray-800 border-gray-700 text-gray-400 hover:text-gray-200'
						}`}
					>
						{d.charAt(0).toUpperCase() + d.slice(1)}
					</button>
				))}
			</div>

			{completed && (
				<p className="text-xs text-green-400 mb-4">
					Completed in {completed.bestTurns} turns ({completed.difficulty})
				</p>
			)}

			<div className="flex items-center gap-2 mb-4">
				<span className="text-sm text-gray-400">Rewards:</span>
				{mission.rewards.map((r, i) => (
					<span key={i} className="text-xs bg-amber-900/40 text-amber-300 px-2 py-1 rounded border border-amber-700/40">
						{r.type === 'rune' ? `${r.amount} RUNE` : r.type === 'card' ? `Card #${r.cardId}` : r.type === 'pack' ? `${r.amount} Packs` : `${r.amount} Dust`}
					</span>
				))}
			</div>

			<button
				onClick={() => onStart(difficulty)}
				className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-lg font-bold transition-colors"
			>
				Begin Mission
			</button>
		</div>
	);
}

export default function CampaignPage() {
	const [selectedChapter, setSelectedChapter] = useState<CampaignChapter | null>(null);
	const [selectedMission, setSelectedMission] = useState<CampaignMission | null>(null);
	const navigate = useNavigate();
	const startMission = useCampaignStore(s => s.startMission);

	const handleStartMission = (difficulty: Difficulty) => {
		if (!selectedMission) return;
		startMission(selectedMission.id, difficulty);
		navigate(routes.game);
	};

	return (
		<div className="min-h-screen bg-gray-950 text-white">
			<div className="max-w-4xl mx-auto px-4 py-8">
				<div className="flex items-center justify-between mb-8">
					<h1 className="text-3xl font-bold text-amber-400 tracking-wide">Campaign</h1>
					<Link
						to={routes.home}
						className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm border border-gray-700 transition-colors"
					>
						Back to Menu
					</Link>
				</div>

				{selectedMission && selectedChapter ? (
					<MissionBriefing
						mission={selectedMission}
						chapter={selectedChapter}
						onStart={handleStartMission}
						onBack={() => setSelectedMission(null)}
					/>
				) : selectedChapter ? (
					<div>
						<button
							onClick={() => setSelectedChapter(null)}
							className="text-gray-500 hover:text-gray-300 text-sm mb-4 transition-colors"
						>
							&larr; Back to chapters
						</button>
						<h2 className={`text-xl font-bold mb-2 ${FACTION_ACCENT[selectedChapter.faction]}`}>
							{selectedChapter.name}
						</h2>
						<p className="text-sm text-gray-400 mb-6">{selectedChapter.description}</p>
						<div className="space-y-2">
							{selectedChapter.missions.map(mission => (
								<MissionNode
									key={mission.id}
									mission={mission}
									chapter={selectedChapter}
									onSelect={(m) => setSelectedMission(m)}
								/>
							))}
						</div>
					</div>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{ALL_CHAPTERS.map(chapter => {
							const missionIds = chapter.missions.map(m => m.id);
							const progress = useCampaignStore.getState().getChapterProgress(chapter.id, missionIds);
							return (
								<button
									key={chapter.id}
									onClick={() => setSelectedChapter(chapter)}
									className={`p-6 rounded-xl border bg-gradient-to-br ${FACTION_COLORS[chapter.faction]} hover:scale-[1.02] transition-all text-left`}
								>
									<h3 className={`text-lg font-bold mb-1 ${FACTION_ACCENT[chapter.faction]}`}>
										{chapter.name}
									</h3>
									<p className="text-sm text-gray-400 mb-3">{chapter.description}</p>
									<div className="flex items-center gap-2">
										<div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
											<div
												className="h-full bg-amber-500 rounded-full transition-all"
												style={{ width: `${(progress / chapter.missions.length) * 100}%` }}
											/>
										</div>
										<span className="text-xs text-gray-500">{progress}/{chapter.missions.length}</span>
									</div>
								</button>
							);
						})}
					</div>
				)}
			</div>
		</div>
	);
}

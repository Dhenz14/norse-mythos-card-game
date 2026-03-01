import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { routes } from '../../../lib/routes';
import {
	ALL_CHAPTERS, useCampaignStore,
	NINE_REALMS, REALM_MAP, getMissionsForRealm, getRealmProgress,
} from '../../campaign';
import type { CampaignChapter, CampaignMission, Difficulty } from '../../campaign/campaignTypes';
import type { Realm } from '../../campaign/nineRealms';
import './constellation-map.css';

const FACTION_COLORS: Record<string, string> = {
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
				&larr; Back
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

const RUNE_CORNERS = ['\u16A0\u16B7\u16C1', '\u16DE\u16D7\u16D2', '\u16C7\u16BA\u16A0', '\u16D2\u16C1\u16DE'];

function StarField() {
	const stars = useMemo(() =>
		Array.from({ length: 100 }, (_, i) => ({
			id: i,
			x: Math.random() * 100,
			y: Math.random() * 100,
			duration: 2 + Math.random() * 4,
			delay: Math.random() * 3,
			opacity: 0.3 + Math.random() * 0.5,
			size: Math.random() > 0.9 ? 3 : Math.random() > 0.7 ? 2 : 1,
		})),
	[]);

	return (
		<>
			{stars.map(s => (
				<div
					key={s.id}
					className="constellation-star"
					style={{
						left: `${s.x}%`,
						top: `${s.y}%`,
						width: s.size,
						height: s.size,
						'--twinkle-duration': `${s.duration}s`,
						'--twinkle-delay': `${s.delay}s`,
						'--star-opacity': s.opacity,
					} as React.CSSProperties}
				/>
			))}
		</>
	);
}

function ConstellationLines({ realms, completedMissions }: {
	realms: Realm[];
	completedMissions: Record<string, unknown>;
}) {
	const lines = useMemo(() => {
		const seen = new Set<string>();
		const result: { x1: number; y1: number; x2: number; y2: number; active: boolean }[] = [];
		for (const realm of realms) {
			for (const connId of realm.connections) {
				const key = [realm.id, connId].sort().join('-');
				if (seen.has(key)) continue;
				seen.add(key);
				const other = REALM_MAP.get(connId);
				if (!other) continue;
				const norseChapter = ALL_CHAPTERS.find(c => c.faction === 'norse');
				const missions = norseChapter?.missions ?? [];
				const r1 = getRealmProgress(realm.id, missions, completedMissions);
				const r2 = getRealmProgress(connId, missions, completedMissions);
				const active = r1.completed > 0 && r2.completed > 0;
				result.push({
					x1: realm.position.x, y1: realm.position.y,
					x2: other.position.x, y2: other.position.y,
					active,
				});
			}
		}
		return result;
	}, [realms, completedMissions]);

	return (
		<svg className="constellation-lines" viewBox="0 0 100 100" preserveAspectRatio="none">
			{lines.map((l, i) => (
				<line
					key={i}
					x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
					className={l.active ? 'constellation-line-active' : 'constellation-line'}
				/>
			))}
		</svg>
	);
}

function RealmNode({ realm, selected, onClick }: {
	realm: Realm;
	selected: boolean;
	onClick: () => void;
}) {
	const completedMissions = useCampaignStore(s => s.completedMissions);
	const norseChapter = ALL_CHAPTERS.find(c => c.faction === 'norse');
	const missions = norseChapter?.missions ?? [];
	const progress = getRealmProgress(realm.id, missions, completedMissions);
	const hasMissions = progress.total > 0;

	return (
		<div
			className={`realm-node ${!hasMissions ? 'realm-node-locked' : ''} ${selected ? 'realm-node-selected' : ''}`}
			style={{ left: `${realm.position.x}%`, top: `${realm.position.y}%` }}
			onClick={() => hasMissions && onClick()}
		>
			{hasMissions && progress.total > 0 && (
				<div className="realm-progress">{progress.completed}/{progress.total}</div>
			)}
			<div
				className="realm-glow"
				style={{
					'--realm-color': realm.color,
					'--realm-glow': realm.glowColor,
				} as React.CSSProperties}
			>
				<span className="realm-rune">{realm.runeSymbol}</span>
			</div>
			<span className="realm-name" style={{ color: realm.color }}>{realm.name}</span>
			{!hasMissions && <span className="realm-locked-label">Locked</span>}
		</div>
	);
}

function RealmMissionPanel({ realm, onSelectMission, onClose }: {
	realm: Realm;
	onSelectMission: (m: CampaignMission) => void;
	onClose: () => void;
}) {
	const norseChapter = ALL_CHAPTERS.find(c => c.faction === 'norse')!;
	const missions = getMissionsForRealm(realm.id, norseChapter.missions);

	return (
		<div className="realm-mission-panel" style={{ '--realm-color': realm.color } as React.CSSProperties}>
			<button className="realm-panel-back" onClick={onClose}>&larr; Back to Map</button>
			<div className="realm-panel-header">
				<div className="realm-panel-name" style={{ color: realm.color }}>{realm.name}</div>
				<div className="realm-panel-description">{realm.description}</div>
				<div className="realm-panel-effect">
					<span>{realm.runeSymbol}</span>
					<span>{realm.environmentEffect} &mdash; {realm.environmentDescription}</span>
				</div>
			</div>
			<div className="space-y-2">
				{missions.map(mission => (
					<MissionNode
						key={mission.id}
						mission={mission}
						chapter={norseChapter}
						onSelect={onSelectMission}
					/>
				))}
			</div>
		</div>
	);
}

type View = 'norse' | 'beyond';

export default function CampaignPage() {
	const [view, setView] = useState<View>('norse');
	const [selectedRealm, setSelectedRealm] = useState<Realm | null>(null);
	const [selectedMission, setSelectedMission] = useState<CampaignMission | null>(null);
	const [selectedChapter, setSelectedChapter] = useState<CampaignChapter | null>(null);
	const navigate = useNavigate();
	const startMission = useCampaignStore(s => s.startMission);
	const completedMissions = useCampaignStore(s => s.completedMissions);

	const norseChapter = ALL_CHAPTERS.find(c => c.faction === 'norse')!;
	const beyondChapters = ALL_CHAPTERS.filter(c => c.faction !== 'norse');

	const handleStartMission = (difficulty: Difficulty) => {
		if (!selectedMission) return;
		startMission(selectedMission.id, difficulty);
		navigate(routes.game);
	};

	if (selectedMission) {
		const chapter = selectedChapter ?? norseChapter;
		return (
			<div className="constellation-container">
				<div className="max-w-4xl mx-auto px-4 py-8">
					<MissionBriefing
						mission={selectedMission}
						chapter={chapter}
						onStart={handleStartMission}
						onBack={() => setSelectedMission(null)}
					/>
				</div>
			</div>
		);
	}

	return (
		<div className="constellation-container">
			{/* Corner rune decorations */}
			<div className="rune-border-decoration rune-border-top-left">{RUNE_CORNERS[0]}</div>
			<div className="rune-border-decoration rune-border-top-right">{RUNE_CORNERS[1]}</div>
			<div className="rune-border-decoration rune-border-bottom-left">{RUNE_CORNERS[2]}</div>
			<div className="rune-border-decoration rune-border-bottom-right">{RUNE_CORNERS[3]}</div>

			{/* Top nav */}
			<div className="constellation-nav">
				<div className="flex items-center gap-4">
					<Link to={routes.home}>
						<button className="text-gray-400 hover:text-white transition-colors text-sm">
							&larr; Back
						</button>
					</Link>
					<h1 className="constellation-title">Campaign</h1>
				</div>
			</div>

			{/* Tabs */}
			<div className="constellation-tabs">
				<button
					className={`constellation-tab ${view === 'norse' ? 'constellation-tab-active' : ''}`}
					onClick={() => { setView('norse'); setSelectedChapter(null); }}
				>
					Nine Realms
				</button>
				<button
					className={`constellation-tab ${view === 'beyond' ? 'constellation-tab-active' : ''}`}
					onClick={() => { setView('beyond'); setSelectedRealm(null); }}
				>
					Beyond the Realms
				</button>
			</div>

			{view === 'norse' ? (
				<div className="constellation-map-area">
					<StarField />
					<ConstellationLines realms={NINE_REALMS} completedMissions={completedMissions} />
					{NINE_REALMS.map(realm => (
						<RealmNode
							key={realm.id}
							realm={realm}
							selected={selectedRealm?.id === realm.id}
							onClick={() => setSelectedRealm(
								selectedRealm?.id === realm.id ? null : realm,
							)}
						/>
					))}
					{selectedRealm && (
						<RealmMissionPanel
							realm={selectedRealm}
							onSelectMission={(m) => {
								setSelectedMission(m);
								setSelectedChapter(norseChapter);
							}}
							onClose={() => setSelectedRealm(null)}
						/>
					)}
				</div>
			) : selectedChapter ? (
				<div className="max-w-4xl mx-auto px-6">
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
								onSelect={(m) => {
									setSelectedMission(m);
									setSelectedChapter(selectedChapter);
								}}
							/>
						))}
					</div>
				</div>
			) : (
				<div className="beyond-grid">
					{beyondChapters.map(chapter => {
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
	);
}

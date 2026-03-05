import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { routes } from '../../../lib/routes';
import {
	ALL_CHAPTERS, EASTERN_CHAPTER, BASE_CHAPTER_MISSION_IDS, useCampaignStore,
	NINE_REALMS, REALM_MAP, getMissionsForRealm, getRealmProgress,
	GREEK_REALMS, GREEK_REALM_MAP, getGreekMissionsForRealm, getGreekRealmProgress,
} from '../../campaign';
import type { CampaignChapter, CampaignMission, Difficulty } from '../../campaign/campaignTypes';
import type { Realm } from '../../campaign/nineRealms';
import type { GreekRealm } from '../../campaign/greekRealms';
import './constellation-map.css';

const FACTION_COLORS: Record<string, string> = {
	egyptian: 'from-orange-900/80 to-red-900/60 border-orange-600/40',
	celtic: 'from-green-900/80 to-emerald-900/60 border-green-600/40',
	eastern: 'from-red-900/80 to-yellow-900/60 border-red-600/40',
};

const FACTION_ACCENT: Record<string, string> = {
	norse: 'text-cyan-400',
	greek: 'text-amber-400',
	egyptian: 'text-orange-400',
	celtic: 'text-green-400',
	eastern: 'text-red-400',
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
				{(['normal', 'heroic', 'mythic'] as Difficulty[]).map(d => (
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
						{r.type === 'rune' ? `${r.amount} RUNE` : r.type === 'card' ? `Card #${r.cardId}` : r.type === 'pack' ? `${r.amount} Packs` : `${r.amount} Eitr`}
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

function NorseConstellationLines({ completedMissions }: { completedMissions: Record<string, unknown> }) {
	const lines = useMemo(() => {
		const seen = new Set<string>();
		const result: { x1: number; y1: number; x2: number; y2: number; active: boolean }[] = [];
		const norseChapter = ALL_CHAPTERS.find(c => c.faction === 'norse');
		const missions = norseChapter?.missions ?? [];
		for (const realm of NINE_REALMS) {
			for (const connId of realm.connections) {
				const key = [realm.id, connId].sort().join('-');
				if (seen.has(key)) continue;
				seen.add(key);
				const other = REALM_MAP.get(connId);
				if (!other) continue;
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
	}, [completedMissions]);

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

function GreekConstellationLines({ completedMissions }: { completedMissions: Record<string, unknown> }) {
	const lines = useMemo(() => {
		const seen = new Set<string>();
		const result: { x1: number; y1: number; x2: number; y2: number; active: boolean }[] = [];
		const greekChapter = ALL_CHAPTERS.find(c => c.faction === 'greek');
		const missions = greekChapter?.missions ?? [];
		for (const realm of GREEK_REALMS) {
			for (const connId of realm.connections) {
				const key = [realm.id, connId].sort().join('-');
				if (seen.has(key)) continue;
				seen.add(key);
				const other = GREEK_REALM_MAP.get(connId);
				if (!other) continue;
				const r1 = getGreekRealmProgress(realm.id, missions, completedMissions);
				const r2 = getGreekRealmProgress(connId, missions, completedMissions);
				const active = r1.completed > 0 && r2.completed > 0;
				result.push({
					x1: realm.position.x, y1: realm.position.y,
					x2: other.position.x, y2: other.position.y,
					active,
				});
			}
		}
		return result;
	}, [completedMissions]);

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

function NorseRealmNode({ realm, selected, onClick }: {
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

function GreekRealmNode({ realm, selected, onClick }: {
	realm: GreekRealm;
	selected: boolean;
	onClick: () => void;
}) {
	const completedMissions = useCampaignStore(s => s.completedMissions);
	const greekChapter = ALL_CHAPTERS.find(c => c.faction === 'greek');
	const missions = greekChapter?.missions ?? [];
	const progress = getGreekRealmProgress(realm.id, missions, completedMissions);
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
				<span className="realm-rune">{realm.symbol}</span>
			</div>
			<span className="realm-name" style={{ color: realm.color }}>{realm.name}</span>
			{!hasMissions && <span className="realm-locked-label">Locked</span>}
		</div>
	);
}

function RealmMissionPanel({ realm, chapter, missions, onSelectMission, onClose }: {
	realm: Realm | GreekRealm;
	chapter: CampaignChapter;
	missions: CampaignMission[];
	onSelectMission: (m: CampaignMission) => void;
	onClose: () => void;
}) {
	const desc = 'description' in realm ? realm.description : '';
	const effect = 'environmentEffect' in realm ? realm.environmentEffect : '';
	const effectDesc = 'environmentDescription' in realm ? realm.environmentDescription : '';
	const symbol = 'runeSymbol' in realm ? realm.runeSymbol : ('symbol' in realm ? (realm as GreekRealm).symbol : '');

	return (
		<div className="realm-mission-panel" style={{ '--realm-color': realm.color } as React.CSSProperties}>
			<button className="realm-panel-back" onClick={onClose}>&larr; Back to Map</button>
			<div className="realm-panel-header">
				<div className="realm-panel-name" style={{ color: realm.color }}>{realm.name}</div>
				<div className="realm-panel-description">{desc}</div>
				{effect && (
					<div className="realm-panel-effect">
						<span>{symbol}</span>
						<span>{effect} &mdash; {effectDesc}</span>
					</div>
				)}
			</div>
			<div className="space-y-2">
				{missions.map(mission => (
					<MissionNode
						key={mission.id}
						mission={mission}
						chapter={chapter}
						onSelect={onSelectMission}
					/>
				))}
			</div>
		</div>
	);
}

type View = 'norse' | 'greek' | 'beyond';

export default function CampaignPage() {
	const [view, setView] = useState<View>('norse');
	const [selectedRealm, setSelectedRealm] = useState<string | null>(null);
	const [selectedMission, setSelectedMission] = useState<CampaignMission | null>(null);
	const [selectedChapter, setSelectedChapter] = useState<CampaignChapter | null>(null);
	const navigate = useNavigate();
	const startMission = useCampaignStore(s => s.startMission);
	const completedMissions = useCampaignStore(s => s.completedMissions);
	const isAllComplete = useCampaignStore(s => s.isAllBaseChaptersComplete(BASE_CHAPTER_MISSION_IDS));

	const norseChapter = ALL_CHAPTERS.find(c => c.faction === 'norse')!;
	const greekChapter = ALL_CHAPTERS.find(c => c.faction === 'greek')!;
	const beyondChapters = ALL_CHAPTERS.filter(c => c.faction !== 'norse' && c.faction !== 'greek');

	const selectedNorseRealm = view === 'norse' && selectedRealm ? REALM_MAP.get(selectedRealm) ?? null : null;
	const selectedGreekRealm = view === 'greek' && selectedRealm ? GREEK_REALM_MAP.get(selectedRealm) ?? null : null;

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
			<div className="rune-border-decoration rune-border-top-left">{RUNE_CORNERS[0]}</div>
			<div className="rune-border-decoration rune-border-top-right">{RUNE_CORNERS[1]}</div>
			<div className="rune-border-decoration rune-border-bottom-left">{RUNE_CORNERS[2]}</div>
			<div className="rune-border-decoration rune-border-bottom-right">{RUNE_CORNERS[3]}</div>

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

			<div className="constellation-tabs">
				<button
					className={`constellation-tab ${view === 'norse' ? 'constellation-tab-active' : ''}`}
					onClick={() => { setView('norse'); setSelectedRealm(null); setSelectedChapter(null); }}
				>
					Nine Realms
				</button>
				<button
					className={`constellation-tab ${view === 'greek' ? 'constellation-tab-active' : ''}`}
					onClick={() => { setView('greek'); setSelectedRealm(null); setSelectedChapter(null); }}
				>
					Olympus
				</button>
				<button
					className={`constellation-tab ${view === 'beyond' ? 'constellation-tab-active' : ''}`}
					onClick={() => { setView('beyond'); setSelectedRealm(null); }}
				>
					Beyond
				</button>
			</div>

			{view === 'norse' ? (
				<div className="constellation-map-area">
					<StarField />
					<NorseConstellationLines completedMissions={completedMissions} />
					{NINE_REALMS.map(realm => (
						<NorseRealmNode
							key={realm.id}
							realm={realm}
							selected={selectedRealm === realm.id}
							onClick={() => setSelectedRealm(selectedRealm === realm.id ? null : realm.id)}
						/>
					))}
					{selectedNorseRealm && (
						<RealmMissionPanel
							realm={selectedNorseRealm}
							chapter={norseChapter}
							missions={getMissionsForRealm(selectedNorseRealm.id, norseChapter.missions)}
							onSelectMission={(m) => {
								setSelectedMission(m);
								setSelectedChapter(norseChapter);
							}}
							onClose={() => setSelectedRealm(null)}
						/>
					)}
				</div>
			) : view === 'greek' ? (
				<div className="constellation-map-area" style={{ background: 'radial-gradient(ellipse at 50% 30%, #0f1225 0%, #0a0d1a 40%, #050710 100%)' }}>
					<StarField />
					<GreekConstellationLines completedMissions={completedMissions} />
					{GREEK_REALMS.map(realm => (
						<GreekRealmNode
							key={realm.id}
							realm={realm}
							selected={selectedRealm === realm.id}
							onClick={() => setSelectedRealm(selectedRealm === realm.id ? null : realm.id)}
						/>
					))}
					{selectedGreekRealm && (
						<RealmMissionPanel
							realm={selectedGreekRealm}
							chapter={greekChapter}
							missions={getGreekMissionsForRealm(selectedGreekRealm.id, greekChapter.missions)}
							onSelectMission={(m) => {
								setSelectedMission(m);
								setSelectedChapter(greekChapter);
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

					{isAllComplete && (
						<button
							onClick={() => setSelectedChapter(EASTERN_CHAPTER)}
							className="p-6 rounded-xl border bg-gradient-to-br from-red-900/80 to-yellow-900/60 border-red-600/40 hover:scale-[1.02] transition-all text-left relative overflow-hidden"
						>
							<div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-500/5 to-transparent animate-pulse" />
							<h3 className="text-lg font-bold mb-1 text-red-400">
								The Celestial Gate
							</h3>
							<p className="text-sm text-gray-400 mb-1">Secret Chapter Unlocked</p>
							<p className="text-xs text-yellow-500/80 mb-3">Chinese, Japanese & Hindu mythology await...</p>
							<div className="flex items-center gap-2">
								<div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
									<div
										className="h-full bg-red-500 rounded-full transition-all"
										style={{ width: `${(useCampaignStore.getState().getChapterProgress(EASTERN_CHAPTER.id, EASTERN_CHAPTER.missions.map(m => m.id)) / EASTERN_CHAPTER.missions.length) * 100}%` }}
									/>
								</div>
								<span className="text-xs text-gray-500">
									{useCampaignStore.getState().getChapterProgress(EASTERN_CHAPTER.id, EASTERN_CHAPTER.missions.map(m => m.id))}/{EASTERN_CHAPTER.missions.length}
								</span>
							</div>
						</button>
					)}

					{!isAllComplete && (
						<div className="p-6 rounded-xl border border-dashed border-gray-700/40 bg-gray-900/20 text-center">
							<div className="text-2xl mb-2 opacity-30">?</div>
							<p className="text-sm text-gray-600">Complete all four chapters to unlock a secret mythology...</p>
						</div>
					)}
				</div>
			)}
		</div>
	);
}

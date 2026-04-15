import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { routes } from '../../../lib/routes';
import {
	ALL_CHAPTERS, EASTERN_CHAPTER, BASE_CHAPTER_MISSION_IDS, useCampaignStore,
	NINE_REALMS, REALM_MAP, MISSION_REALM_MAP, getMissionsForRealm, getRealmProgress,
	GREEK_REALMS, GREEK_REALM_MAP, GREEK_MISSION_REALM_MAP, getGreekMissionsForRealm, getGreekRealmProgress, getMission,
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
				&larr; Back to map
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

			<div className="grid gap-4 md:grid-cols-[1.35fr,0.85fr] mb-4">
				<div className="bg-gray-950/60 border border-gray-800/70 rounded-xl p-4">
					<p className="text-[11px] font-bold uppercase tracking-[0.22em] text-amber-400/80 mb-2">Battle Route</p>
					<p className="text-base font-semibold text-gray-100 mb-2">
						Choose a difficulty, confirm the omen, and move directly into the board.
					</p>
					<p className="text-sm text-gray-400 leading-relaxed">
						This briefing is the final staging step. Once you confirm, the mission launches immediately into the authored chess and poker flow for this realm.
					</p>
				</div>
				<div className="bg-gray-950/45 border border-gray-800/60 rounded-xl p-4">
					<p className="text-[11px] font-bold uppercase tracking-[0.22em] text-cyan-300/80 mb-2">Campaign Record</p>
					{completed ? (
						<>
							<p className="text-sm text-gray-200">Best clear: {completed.bestTurns} turns</p>
							<p className="text-sm text-gray-400 mt-1">Highest finish: {completed.bestDifficulty}</p>
						</>
					) : (
						<>
							<p className="text-sm text-gray-200">First clear pending</p>
							<p className="text-sm text-gray-400 mt-1">Normal is the recommended first route.</p>
						</>
					)}
				</div>
			</div>

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

				<p className="text-xs text-gray-500 mb-4">
					Normal is the cleanest first clear. Heroic and Mythic are best when you want a tighter boss pass after learning the board.
				</p>

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
					Enter Battle
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

function NorseRealmNode({ realm, selected, onClick, hasUnlockedMission }: {
	realm: Realm;
	selected: boolean;
	onClick: () => void;
	hasUnlockedMission: boolean;
}) {
	const completedMissions = useCampaignStore(s => s.completedMissions);
	const norseChapter = ALL_CHAPTERS.find(c => c.faction === 'norse');
	const missions = norseChapter?.missions ?? [];
	const progress = getRealmProgress(realm.id, missions, completedMissions);
	const hasMissions = progress.total > 0;
	const allDone = progress.completed === progress.total && progress.total > 0;

	return (
		<div
			className={`realm-node ${!hasMissions ? 'realm-node-locked' : ''} ${selected ? 'realm-node-selected' : ''} ${hasUnlockedMission && !allDone ? 'realm-node-available' : ''}`}
			style={{ left: `${realm.position.x}%`, top: `${realm.position.y}%` }}
			onClick={() => hasMissions && onClick()}
		>
			{hasMissions && progress.total > 0 && (
				<div className="realm-progress">{progress.completed}/{progress.total}</div>
			)}
			{hasUnlockedMission && !allDone && (
				<div className="realm-start-hint">Start Here</div>
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

function GreekRealmNode({ realm, selected, onClick, hasUnlockedMission }: {
	realm: GreekRealm;
	selected: boolean;
	onClick: () => void;
	hasUnlockedMission: boolean;
}) {
	const completedMissions = useCampaignStore(s => s.completedMissions);
	const greekChapter = ALL_CHAPTERS.find(c => c.faction === 'greek');
	const missions = greekChapter?.missions ?? [];
	const progress = getGreekRealmProgress(realm.id, missions, completedMissions);
	const hasMissions = progress.total > 0;
	const allDone = progress.completed === progress.total && progress.total > 0;

	return (
		<div
			className={`realm-node ${!hasMissions ? 'realm-node-locked' : ''} ${selected ? 'realm-node-selected' : ''} ${hasUnlockedMission && !allDone ? 'realm-node-available' : ''}`}
			style={{ left: `${realm.position.x}%`, top: `${realm.position.y}%` }}
			onClick={() => hasMissions && onClick()}
		>
			{hasMissions && progress.total > 0 && (
				<div className="realm-progress">{progress.completed}/{progress.total}</div>
			)}
			{hasUnlockedMission && !allDone && (
				<div className="realm-start-hint">Start Here</div>
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
	const completedMissions = useCampaignStore(s => s.completedMissions);
	const allLocked = missions.length > 0 && missions.every(m => {
		if (m.prerequisiteIds.length === 0) return false;
		return !m.prerequisiteIds.every(id => !!completedMissions[id]);
	});

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
			{allLocked && (
				<div className="realm-panel-locked-hint">
					All missions here require completing earlier ones first. Look for the glowing "Start Here" node on the map.
				</div>
			)}
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
	const currentMissionId = useCampaignStore(s => s.currentMission);
	const completedMissions = useCampaignStore(s => s.completedMissions);
	const isAllComplete = useCampaignStore(s => s.isAllBaseChaptersComplete(BASE_CHAPTER_MISSION_IDS));

	const norseChapter = ALL_CHAPTERS.find(c => c.faction === 'norse')!;
	const greekChapter = ALL_CHAPTERS.find(c => c.faction === 'greek')!;
	const beyondChapters = ALL_CHAPTERS.filter(c => c.faction !== 'norse' && c.faction !== 'greek');
	const totalCampaignMissions = useMemo(
		() => ALL_CHAPTERS.reduce((sum, chapter) => sum + chapter.missions.length, 0),
		[],
	);
	const totalClearedMissions = Object.keys(completedMissions).length;
	const currentMissionData = useMemo(
		() => (currentMissionId ? getMission(currentMissionId) : null),
		[currentMissionId],
	);

	const selectedNorseRealm = view === 'norse' && selectedRealm ? REALM_MAP.get(selectedRealm) ?? null : null;
	const selectedGreekRealm = view === 'greek' && selectedRealm ? GREEK_REALM_MAP.get(selectedRealm) ?? null : null;

	const norseRealmsWithUnlocked = useMemo(() => {
		const result = new Set<string>();
		for (const m of norseChapter.missions) {
			const realm = MISSION_REALM_MAP[m.id];
			if (!realm) continue;
			const unlocked = m.prerequisiteIds.length === 0 || m.prerequisiteIds.every(id => !!completedMissions[id]);
			const done = !!completedMissions[m.id];
			if (unlocked && !done) result.add(realm);
		}
		return result;
	}, [norseChapter.missions, completedMissions]);

	const greekRealmsWithUnlocked = useMemo(() => {
		const result = new Set<string>();
		for (const m of greekChapter.missions) {
			const realm = GREEK_MISSION_REALM_MAP[m.id];
			if (!realm) continue;
			const unlocked = m.prerequisiteIds.length === 0 || m.prerequisiteIds.every(id => !!completedMissions[id]);
			const done = !!completedMissions[m.id];
			if (unlocked && !done) result.add(realm);
		}
		return result;
	}, [greekChapter.missions, completedMissions]);

	const nextNorseMission = useMemo(
		() => norseChapter.missions.find(m =>
			!completedMissions[m.id] &&
			(m.prerequisiteIds.length === 0 || m.prerequisiteIds.every(id => !!completedMissions[id])),
		) ?? null,
		[norseChapter.missions, completedMissions],
	);

	const nextGreekMission = useMemo(
		() => greekChapter.missions.find(m =>
			!completedMissions[m.id] &&
			(m.prerequisiteIds.length === 0 || m.prerequisiteIds.every(id => !!completedMissions[id])),
		) ?? null,
		[greekChapter.missions, completedMissions],
	);

	const campaignLead = useMemo<{
		view: View;
		chapter: CampaignChapter;
		mission: CampaignMission;
		title: string;
		copy: string;
		cta: string;
	} | null>(() => {
		if (currentMissionData) {
			const leadView: View = currentMissionData.chapter.faction === 'norse'
				? 'norse'
				: currentMissionData.chapter.faction === 'greek'
					? 'greek'
					: 'beyond';
			return {
				view: leadView,
				chapter: currentMissionData.chapter,
				mission: currentMissionData.mission,
				title: 'Active Mission',
				copy: 'This mission is already staged. Resume the briefing, confirm the difficulty, and go straight back into battle.',
				cta: 'Resume briefing',
			};
		}

		if (view === 'norse' && nextNorseMission) {
			return {
				view: 'norse' as const,
				chapter: norseChapter,
				mission: nextNorseMission,
				title: 'Next Battle',
				copy: 'Open the next Norse mission directly from here instead of hunting around the map for the right node.',
				cta: 'Stage next battle',
			};
		}

		if (view === 'greek' && nextGreekMission) {
			return {
				view: 'greek' as const,
				chapter: greekChapter,
				mission: nextGreekMission,
				title: 'Next Battle',
				copy: 'Push forward through the Greek line with one clean move into the next unlocked mission.',
				cta: 'Stage next battle',
			};
		}

		return null;
	}, [currentMissionData, greekChapter, nextGreekMission, nextNorseMission, norseChapter, view]);

	const stageMission = (mission: CampaignMission, chapter: CampaignChapter, nextView?: View) => {
		if (nextView) {
			setView(nextView);
		}
		setSelectedRealm(null);
		setSelectedChapter(chapter);
		setSelectedMission(mission);
	};

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

				<div className="mx-4 mb-5 rounded-2xl border border-white/10 bg-gray-950/55 px-4 py-4 shadow-[0_22px_70px_rgba(0,0,0,0.24)] backdrop-blur-md">
					<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
						<div className="min-w-0">
							<p className="text-[11px] font-bold uppercase tracking-[0.22em] text-amber-400/80">
								{campaignLead?.title ?? 'Campaign Status'}
							</p>
							<h2 className="mt-1 text-xl font-semibold text-gray-100">
								{campaignLead ? campaignLead.mission.name : 'Choose a mythology and stage the next battle'}
							</h2>
							<p className="mt-1 text-sm text-gray-400 leading-relaxed">
								{campaignLead
									? `${campaignLead.chapter.name} · Mission ${campaignLead.mission.missionNumber}. ${campaignLead.copy}`
									: view === 'beyond'
										? 'Beyond opens into the later mythologies and the secret gate. Finish the base chapters first, then push into the deeper arcs.'
										: 'Use the highlighted path when you want the cleanest authored route into the next mission.'}
							</p>
						</div>
						<div className="flex flex-col gap-3 md:items-end">
							<div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-gray-300">
								<span>{totalClearedMissions}/{totalCampaignMissions} cleared</span>
							</div>
							{campaignLead && (
								<button
									type="button"
									onClick={() => stageMission(campaignLead.mission, campaignLead.chapter, campaignLead.view)}
									className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-amber-400/30 bg-amber-500/12 px-5 text-sm font-semibold text-amber-100 transition-colors hover:bg-amber-500/20"
								>
									{campaignLead.cta}
								</button>
							)}
						</div>
					</div>
				</div>

				{view === 'norse' ? (
					<div className="constellation-map-area">
					<StarField />
					<NorseConstellationLines completedMissions={completedMissions} />
					{!selectedNorseRealm && (
						<div className="constellation-intro absolute inset-0 flex items-center justify-center pointer-events-none z-10">
							<div className="constellation-intro-copy text-center max-w-md px-6 opacity-70">
								<p className="text-cyan-400 text-xl font-bold mb-2 tracking-wide">{norseChapter.name}</p>
								<p className="text-gray-400 text-sm leading-relaxed italic">
									{norseChapter.missions[0]?.narrativeBefore?.slice(0, 150) || 'Journey through the Nine Realms of Norse mythology...'}...
								</p>
								<p className="text-gray-600 text-xs mt-3">Select a realm to begin</p>
							</div>
						</div>
					)}
					{NINE_REALMS.map(realm => (
						<NorseRealmNode
							key={realm.id}
							realm={realm}
							selected={selectedRealm === realm.id}
							onClick={() => setSelectedRealm(selectedRealm === realm.id ? null : realm.id)}
							hasUnlockedMission={norseRealmsWithUnlocked.has(realm.id)}
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
					{!selectedGreekRealm && (
						<div className="constellation-intro absolute inset-0 flex items-center justify-center pointer-events-none z-10">
							<div className="constellation-intro-copy text-center max-w-md px-6 opacity-70">
								<p className="text-amber-400 text-xl font-bold mb-2 tracking-wide">{greekChapter.name}</p>
								<p className="text-gray-400 text-sm leading-relaxed italic">
									{greekChapter.missions[0]?.narrativeBefore?.slice(0, 150) || 'Echoes of Chaos rise from the depths of Tartarus...'}...
								</p>
								<p className="text-gray-600 text-xs mt-3">Select a realm to begin</p>
							</div>
						</div>
					)}
					{GREEK_REALMS.map(realm => (
						<GreekRealmNode
							key={realm.id}
							realm={realm}
							selected={selectedRealm === realm.id}
							onClick={() => setSelectedRealm(selectedRealm === realm.id ? null : realm.id)}
							hasUnlockedMission={greekRealmsWithUnlocked.has(realm.id)}
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

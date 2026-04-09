/**
 * useBossPhases.ts
 *
 * Mid-combat escalation runner. Watches the opponent hero's HP during
 * combat and fires the next campaign mission BossPhase whenever HP
 * crosses below the phase's `hpPercent` threshold.
 *
 * Each phase fires AT MOST ONCE per combat. Phases are sorted in
 * descending order so a phase at 75% always fires before a phase at
 * 50% (regardless of authoring order).
 *
 * Phase effects available:
 *   - heal_self N        — opponent restores N HP (uses applyDirectDamage
 *                           with negative damage to reuse the existing
 *                           clamp/log path)
 *   - damage_player N    — player hero takes N immediate damage
 *   - buff_attack N      — TODO: buffs all opponent minions (requires
 *                           battlefield mutation, deferred)
 *   - summon_minion id   — TODO: spawns a card (requires card system,
 *                           deferred)
 *   - add_armor N        — TODO: opponent gains N armor (requires armor
 *                           field on opponent, deferred)
 *   - enrage N           — TODO: opponent +N max mana (requires mana
 *                           system change, deferred)
 *
 * The unsupported effects don't fail loudly — they just log a warning
 * so missions can author them without crashing the game. As the framework
 * expands, the runner will pick them up automatically.
 *
 * Outputs (state setters from caller):
 *   - setQuipText: drives the BossQuipBubble overlay
 *   - setQuipKey: forces re-trigger if same line repeats
 *   - setFlash: drives a screen-flash overlay (red/gold/blue/etc.)
 */

import { useEffect, useRef } from 'react';
import { useCampaignStore, getMission } from '../../campaign';
import type { BossPhase, BossPhaseFlash } from '../../campaign/campaignTypes';
import { usePokerCombatAdapter } from '../../hooks/usePokerCombatAdapter';
import { debug } from '../../config/debugConfig';

interface UseBossPhasesParams {
	opponentCurrentHP: number;
	opponentMaxHP: number;
	setQuipText: (text: string | null) => void;
	setQuipKey: (updater: (k: number) => number) => void;
	setFlash: (flash: BossPhaseFlash | null) => void;
}

export function useBossPhases({
	opponentCurrentHP,
	opponentMaxHP,
	setQuipText,
	setQuipKey,
	setFlash,
}: UseBossPhasesParams): void {
	const currentMissionId = useCampaignStore(s => s.currentMission);
	const { applyDirectDamage } = usePokerCombatAdapter();

	// Stable ref to phases so they can be re-sorted once per mission
	// without re-running the watch effect every render.
	const phasesRef = useRef<BossPhase[]>([]);
	const firedRef = useRef<Set<number>>(new Set());

	// Load + sort phases when the mission changes.
	useEffect(() => {
		firedRef.current = new Set();
		phasesRef.current = [];
		if (!currentMissionId) return;
		const found = getMission(currentMissionId);
		if (!found?.mission?.bossPhases || found.mission.bossPhases.length === 0) return;
		// Sort descending so 75% fires before 50% fires before 25%.
		phasesRef.current = [...found.mission.bossPhases].sort(
			(a, b) => b.hpPercent - a.hpPercent
		);
		debug.combat?.(
			`[BossPhases] Loaded ${phasesRef.current.length} phases for mission ${currentMissionId}`
		);
	}, [currentMissionId]);

	// Watch opponent HP and fire phases when crossed.
	useEffect(() => {
		if (phasesRef.current.length === 0) return;
		if (opponentMaxHP <= 0) return;
		const hpPct = (opponentCurrentHP / opponentMaxHP) * 100;
		// Fire all phases the HP has crossed since the last update.
		// Iterate in sorted (descending) order so 75 fires before 50 etc.
		for (let i = 0; i < phasesRef.current.length; i++) {
			const phase = phasesRef.current[i];
			if (firedRef.current.has(i)) continue;
			if (hpPct > phase.hpPercent) continue;
			firedRef.current.add(i);
			runPhase(phase, applyDirectDamage, setQuipText, setQuipKey, setFlash);
		}
	}, [opponentCurrentHP, opponentMaxHP, applyDirectDamage, setQuipText, setQuipKey, setFlash]);
}

/*
  Runs a single phase: shows the quip, flashes the screen, applies the
  effect. Pulled out as a free function to keep the hook body small and
  to make unit-testing easier later.
*/
function runPhase(
	phase: BossPhase,
	applyDirectDamage: (target: 'player' | 'opponent', damage: number, source?: string) => void,
	setQuipText: (text: string | null) => void,
	setQuipKey: (updater: (k: number) => number) => void,
	setFlash: (flash: BossPhaseFlash | null) => void,
): void {
	debug.combat?.(`[BossPhases] Phase fire: ${phase.description}`);

	if (phase.quip) {
		setQuipText(phase.quip);
		setQuipKey(k => k + 1);
	}
	if (phase.flash) {
		setFlash(phase.flash);
		// Auto-clear after 700ms so the next phase can fire its own flash.
		setTimeout(() => setFlash(null), 700);
	}
	if (phase.effect) {
		switch (phase.effect.type) {
			case 'heal_self':
				// Negative damage = heal. applyDirectDamage already does
				// `Math.max(0, currentHealth - damage)` which becomes
				// `Math.max(0, currentHealth + N)` = currentHealth + N.
				applyDirectDamage('opponent', -phase.effect.value, `${phase.description} (heal)`);
				break;
			case 'damage_player':
				applyDirectDamage('player', phase.effect.value, phase.description);
				break;
			case 'buff_attack':
			case 'summon_minion':
			case 'add_armor':
			case 'enrage':
				// TODO: implement when battlefield/mana/armor mutations are
				// plumbed through. For now, log so missions can author them.
				debug.warn?.(
					`[BossPhases] Effect type "${phase.effect.type}" not yet implemented`
				);
				break;
		}
	}
}

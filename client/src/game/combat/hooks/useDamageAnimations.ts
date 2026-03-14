import { useState, useCallback, useRef, useEffect } from 'react';
import { playSound } from '../../utils/soundUtils';

export interface DamageAnimation {
	id: string;
	damage: number;
	targetId: string;
	x: number;
	y: number;
	timestamp: number;
	isHeal?: boolean;
}

export interface HealthSnapshot {
	playerHeroHealth: number;
	playerHeroArmor: number;
	opponentHeroHealth: number;
	opponentHeroArmor: number;
	playerMinions: Map<string, number>;
	opponentMinions: Map<string, number>;
}

export function useDamageAnimations() {
	const [damageAnimations, setDamageAnimations] = useState<DamageAnimation[]>([]);
	const [shakingTargets, setShakingTargets] = useState<Set<string>>(new Set());
	const [screenShakeClass, setScreenShakeClass] = useState('');
	const screenShakeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const prevHealthRef = useRef<HealthSnapshot | null>(null);

	useEffect(() => {
		return () => {
			if (screenShakeTimeoutRef.current) clearTimeout(screenShakeTimeoutRef.current);
		};
	}, []);

	const triggerScreenShake = useCallback((damage: number) => {
		if (damage < 5) return;
		const shakeClass = damage >= 8 ? 'screen-shake-strong' : 'screen-shake-mild';
		setScreenShakeClass(shakeClass);
		if (screenShakeTimeoutRef.current) clearTimeout(screenShakeTimeoutRef.current);
		screenShakeTimeoutRef.current = setTimeout(() => setScreenShakeClass(''), 350);
	}, []);

	const triggerDamageAnimation = useCallback((targetId: string, damage: number, x: number, y: number, isHeal = false) => {
		const animId = `dmg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
		setDamageAnimations(prev => [...prev, { id: animId, damage, targetId, x, y, timestamp: Date.now(), isHeal }]);
		if (!isHeal) {
			setShakingTargets(prev => new Set(prev).add(targetId));
			setTimeout(() => {
				setShakingTargets(prev => {
					const next = new Set(prev);
					next.delete(targetId);
					return next;
				});
			}, 300);
			triggerScreenShake(damage);
			if (targetId === 'player-hero' || targetId === 'opponent-hero') {
				playSound('damage');
			}
		} else if (targetId === 'player-hero' || targetId === 'opponent-hero') {
			playSound('heal');
		}
	}, [triggerScreenShake]);

	const removeDamageAnimation = useCallback((id: string) => {
		setDamageAnimations(prev => prev.filter(a => a.id !== id));
	}, []);

	const addShakingTarget = useCallback((targetId: string, duration = 500) => {
		setShakingTargets(prev => new Set(prev).add(targetId));
		setTimeout(() => setShakingTargets(prev => { const n = new Set(prev); n.delete(targetId); return n; }), duration);
	}, []);

	return {
		damageAnimations,
		shakingTargets,
		screenShakeClass,
		prevHealthRef,
		triggerScreenShake,
		triggerDamageAnimation,
		removeDamageAnimation,
		addShakingTarget,
	};
}

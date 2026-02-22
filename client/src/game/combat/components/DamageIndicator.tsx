/**
 * DamageIndicator - Floating damage/heal number animation
 *
 * Shows rising, fading numbers on hit. Scales up for big damage.
 * Green for heals, red for damage, gold outline for critical (8+).
 */

import React, { useEffect, useMemo } from 'react';

export interface DamageAnimation {
	id: string;
	damage: number;
	targetId: string;
	x: number;
	y: number;
	timestamp: number;
	isHeal?: boolean;
}

interface DamageIndicatorProps {
	damage: number;
	x: number;
	y: number;
	isHeal?: boolean;
	onComplete: () => void;
}

export const DamageIndicator: React.FC<DamageIndicatorProps> = ({
	damage,
	x,
	y,
	isHeal = false,
	onComplete
}) => {
	useEffect(() => {
		const timer = setTimeout(onComplete, 1200);
		return () => clearTimeout(timer);
	}, [onComplete]);

	const isBig = damage >= 5;
	const isCritical = damage >= 8;
	const jitterX = useMemo(() => (Math.random() - 0.5) * 20, []);

	const className = [
		'damage-indicator',
		isHeal ? 'damage-heal' : '',
		isBig ? 'damage-big' : '',
		isCritical ? 'damage-critical' : '',
	].filter(Boolean).join(' ');

	return (
		<div
			className={className}
			style={{ left: x + jitterX, top: y }}
		>
			{isHeal ? '+' : '-'}{damage}
		</div>
	);
};

export default DamageIndicator;

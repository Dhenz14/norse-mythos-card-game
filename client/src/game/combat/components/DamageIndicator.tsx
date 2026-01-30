/**
 * DamageIndicator - Floating damage number animation
 * 
 * Extracted from RagnarokCombatArena.tsx for modular UI
 */

import React, { useEffect } from 'react';

export interface DamageAnimation {
	id: string;
	damage: number;
	targetId: string;
	x: number;
	y: number;
	timestamp: number;
}

interface DamageIndicatorProps {
	damage: number;
	x: number;
	y: number;
	onComplete: () => void;
}

export const DamageIndicator: React.FC<DamageIndicatorProps> = ({ 
	damage, 
	x, 
	y, 
	onComplete 
}) => {
	useEffect(() => {
		const timer = setTimeout(onComplete, 1000);
		return () => clearTimeout(timer);
	}, [onComplete]);

	return (
		<div 
			className="damage-indicator"
			style={{ left: x, top: y }}
		>
			-{damage}
		</div>
	);
};

export default DamageIndicator;

/**
 * BattlefieldHero - Hero display component for combat arena
 * 
 * Extracted from RagnarokCombatArena.tsx for modular UI
 */

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { ALL_NORSE_HEROES } from '../../data/norseHeroes';

interface BattlefieldHeroProps {
	pet: any;
	hpCommitted: number;
	level: number;
	onClick?: () => void;
	isTargetable?: boolean;
	isOpponent?: boolean;
	secrets?: any[];
	heroClass?: string;
	element?: string;
	mana?: number;
	maxMana?: number;
	onHeroPowerClick?: () => void;
	onWeaponUpgradeClick?: () => void;
	isWeaponUpgraded?: boolean;
}

export const BattlefieldHero: React.FC<BattlefieldHeroProps> = ({ 
	pet, hpCommitted, level, onClick, isTargetable = false, isOpponent = false,
	secrets = [], heroClass = 'neutral', element: elementProp, mana = 0, maxMana = 10, onHeroPowerClick,
	onWeaponUpgradeClick, isWeaponUpgraded = false
}) => {
	const heroElement = useMemo(() => {
		if (elementProp) return elementProp;
		if (pet.norseHeroId && ALL_NORSE_HEROES[pet.norseHeroId]) {
			return ALL_NORSE_HEROES[pet.norseHeroId].element || 'neutral';
		}
		return 'neutral';
	}, [pet.norseHeroId, elementProp]);
	
	const currentHP = pet.stats.currentHealth;
	const maxHP = pet.stats.maxHealth;
	const armor = pet.stats.armor || 0;
	const attack = pet.stats.attack || 0;
	const healthPercent = Math.max(0, (currentHP / maxHP) * 100);
	const currentSta = pet.stats.currentStamina;
	const maxSta = pet.stats.maxStamina;
	const staminaPercent = maxSta > 0 ? Math.max(0, (currentSta / maxSta) * 100) : 0;
	const [showSecretTooltip, setShowSecretTooltip] = useState(false);
	const [showHeroPowerTooltip, setShowHeroPowerTooltip] = useState(false);
	const [tooltipPosition, setTooltipPosition] = useState<{ top: number; left: number } | null>(null);
	const lastClickRef = useRef<number>(0);
	const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const portraitRef = useRef<HTMLDivElement>(null);
	
	const elementClass = heroElement ? `element-${heroElement.toLowerCase()}` : '';
	
	const norseHero = pet.norseHeroId ? ALL_NORSE_HEROES[pet.norseHeroId] : null;
	const heroPower = norseHero?.heroPower;
	const weaponUpgrade = norseHero?.weaponUpgrade;
	
	const WEAPON_COST = 5;
	const canAffordPower = heroPower ? mana >= heroPower.cost : false;
	const canAffordUpgrade = mana >= WEAPON_COST;
	const canUpgrade = canAffordUpgrade && !isOpponent && !isWeaponUpgraded;
	const isPowerDisabled = !canAffordPower || isOpponent;
	
	const handlePortraitClick = useCallback((e: React.MouseEvent) => {
		if (isOpponent) return;
		e.stopPropagation();
		
		if (onHeroPowerClick) {
			onHeroPowerClick();
		}
	}, [isOpponent, onHeroPowerClick]);
	
	useEffect(() => {
		return () => {
			if (clickTimeoutRef.current) {
				clearTimeout(clickTimeoutRef.current);
			}
		};
	}, []);
	
	const getSecretColor = (heroClass: string) => {
		switch (heroClass) {
			case 'mage': return '#3b82f6';
			case 'hunter': return '#22c55e';
			case 'paladin': return '#eab308';
			case 'rogue': return '#6b7280';
			default: return '#a855f7';
		}
	};

	return (
		<div 
			className={`battlefield-hero ${isOpponent ? 'opponent' : 'player'} ${isTargetable ? 'targetable' : ''} ${elementClass}`}
			onClick={onClick}
		>
			<div className="hero-level">Lv.{level}</div>
			
			<div 
				ref={portraitRef}
				className={`hero-portrait ${!isPowerDisabled ? 'has-power' : ''}`}
				onClick={handlePortraitClick}
				onMouseEnter={() => setShowHeroPowerTooltip(true)}
				onMouseLeave={() => setShowHeroPowerTooltip(false)}
			>
				<span className="hero-letter">{pet.name.charAt(0)}</span>
				{heroPower && !isOpponent && (
					<div className={`hero-power-indicator ${canAffordPower ? 'affordable' : 'too-expensive'}`}>
						<span className="power-cost">{heroPower.cost}</span>
					</div>
				)}
			</div>
			
			<div className="hero-name">{pet.name}</div>
			
			<div className="hero-stats-row">
				{attack > 0 && (
					<div className="hero-attack">
						<span className="attack-icon">⚔</span>
						<span className="attack-value">{attack}</span>
					</div>
				)}
				<div className="hero-hp">
					<div className="hp-bar">
						<div className="hp-fill" style={{ width: `${healthPercent}%` }} />
					</div>
					<span className="hp-text">{currentHP}/{maxHP}</span>
				</div>
				{armor > 0 && (
					<div className="hero-armor">
						<span className="armor-icon">🛡</span>
						<span className="armor-value">{armor}</span>
					</div>
				)}
			</div>
			
			{hpCommitted > 0 && (
				<div className="hero-bet-indicator">
					<span className="bet-label">Bet:</span>
					<span className="bet-value">{hpCommitted} HP</span>
				</div>
			)}
			
			{secrets.length > 0 && (
				<div 
					className="hero-secrets"
					onMouseEnter={() => setShowSecretTooltip(true)}
					onMouseLeave={() => setShowSecretTooltip(false)}
				>
					{secrets.map((_, idx) => (
						<div 
							key={idx} 
							className="secret-icon"
							style={{ backgroundColor: getSecretColor(heroClass) }}
						>
							?
						</div>
					))}
				</div>
			)}
		</div>
	);
};

export default BattlefieldHero;

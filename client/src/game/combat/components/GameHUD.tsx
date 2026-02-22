import React from 'react';
import { getElementColor, getElementIcon, ELEMENT_LABELS, type ElementType } from '../../utils/elements/elementAdvantage';
import '../styles/game-hud.css';

interface GameHUDProps {
	turnNumber: number;
	playerDeckCount: number;
	opponentDeckCount: number;
	opponentHandCount: number;
	playerElement?: ElementType;
	opponentElement?: ElementType;
	playerHasAdvantage?: boolean;
	opponentHasAdvantage?: boolean;
}

export const GameHUD: React.FC<GameHUDProps> = ({
	turnNumber,
	playerDeckCount,
	opponentDeckCount,
	opponentHandCount,
	playerElement,
	opponentElement,
	playerHasAdvantage = false,
	opponentHasAdvantage = false,
}) => {
	const showMatchup = playerElement && opponentElement && playerElement !== 'neutral' && opponentElement !== 'neutral';

	return (
		<div className="game-hud">
			<div className="hud-turn-counter">Turn {turnNumber}</div>

			{showMatchup && (
				<div
					className={`hud-matchup-badge ${playerHasAdvantage ? 'advantage' : opponentHasAdvantage ? 'disadvantage' : 'neutral-matchup'}`}
					title={
						playerHasAdvantage
							? `Your ${ELEMENT_LABELS[playerElement!]} beats their ${ELEMENT_LABELS[opponentElement!]} — +2 ATK, +2 HP per minion, +20 Armor`
							: opponentHasAdvantage
								? `Their ${ELEMENT_LABELS[opponentElement!]} beats your ${ELEMENT_LABELS[playerElement!]} — Enemy gets +2/+2 per minion, +20 Armor`
								: `${ELEMENT_LABELS[playerElement!]} vs ${ELEMENT_LABELS[opponentElement!]} — No elemental advantage`
					}
				>
					<span className="hud-matchup-icon" style={{ color: getElementColor(playerElement!) }}>
						{getElementIcon(playerElement!)}
					</span>
					<span className="hud-matchup-arrow">
						{playerHasAdvantage ? '\u25B2' : opponentHasAdvantage ? '\u25BC' : '\u2014'}
					</span>
					<span className="hud-matchup-icon" style={{ color: getElementColor(opponentElement!) }}>
						{getElementIcon(opponentElement!)}
					</span>
				</div>
			)}

			<div className={`hud-deck-badge hud-player-deck ${playerDeckCount <= 0 ? 'fatigue' : playerDeckCount <= 5 ? 'low-deck' : ''}`}>
				<span className="hud-icon">{'\uD83C\uDCA0'}</span>
				<span className="hud-count">{playerDeckCount}</span>
			</div>

			<div className={`hud-deck-badge hud-opponent-deck ${opponentDeckCount <= 0 ? 'fatigue' : opponentDeckCount <= 5 ? 'low-deck' : ''}`}>
				<span className="hud-icon">{'\uD83C\uDCA0'}</span>
				<span className="hud-count">{opponentDeckCount}</span>
			</div>

			<div className="hud-deck-badge hud-opponent-hand">
				<span className="hud-icon">{'\u270B'}</span>
				<span className="hud-count">{opponentHandCount}</span>
			</div>
		</div>
	);
};

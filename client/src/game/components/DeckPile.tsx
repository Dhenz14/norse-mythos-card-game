import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './DeckPile.css';

interface DeckPileProps {
	count: number;
	isOpponent?: boolean;
	onClick?: () => void;
}

export const DeckPile: React.FC<DeckPileProps> = ({ count, isOpponent = false, onClick }) => {
	const maxVisibleCards = 5;
	const visibleCards = Math.min(count, maxVisibleCards);
	const isFatigue = count <= 0;
	const isLow = count > 0 && count <= 5;

	return (
		<div
			className={`deck-pile ${isOpponent ? 'opponent' : 'player'} ${isFatigue ? 'fatigue' : ''} ${isLow ? 'low' : ''}`}
			onClick={onClick}
			title={isFatigue ? 'FATIGUE - No cards remaining!' : `${count} cards remaining`}
		>
			<div className="deck-pile-stack">
				{Array.from({ length: visibleCards }).map((_, i) => (
					<div
						key={i}
						className="deck-pile-card"
						style={{
							transform: `translateY(${-i * 2}px) translateX(${i * 0.5}px)`,
							zIndex: i
						}}
					>
						<div className="deck-card-back">
							<span className="deck-rune">{'\u16B1'}</span>
						</div>
					</div>
				))}
				{isFatigue && (
					<div className="deck-pile-empty">
						<span className="fatigue-icon">{'\uD83D\uDD25'}</span>
					</div>
				)}
			</div>

			<div className={`deck-count-badge ${isFatigue ? 'fatigue' : ''} ${isLow ? 'low' : ''}`}>
				<AnimatePresence mode="wait">
					<motion.span
						key={count}
						className="deck-count-number"
						initial={{ y: -10, opacity: 0 }}
						animate={{ y: 0, opacity: 1 }}
						exit={{ y: 10, opacity: 0 }}
						transition={{ duration: 0.15 }}
					>
						{count}
					</motion.span>
				</AnimatePresence>
			</div>
		</div>
	);
};

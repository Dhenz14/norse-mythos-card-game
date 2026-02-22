import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import '../styles/game-over.css';

interface GameOverScreenProps {
	isVisible: boolean;
	winner: 'player' | 'opponent' | 'draw';
	turnNumber: number;
	playerHeroName?: string;
	opponentHeroName?: string;
	onPlayAgain?: () => void;
	onMainMenu?: () => void;
}

const PARTICLE_COLORS = ['#fbbf24', '#f59e0b', '#d97706', '#fcd34d', '#fef08a', '#22c55e'];

export const GameOverScreen: React.FC<GameOverScreenProps> = ({
	isVisible,
	winner,
	turnNumber,
	playerHeroName = 'You',
	opponentHeroName = 'Opponent',
	onPlayAgain,
	onMainMenu,
}) => {
	const isVictory = winner === 'player';
	const isDraw = winner === 'draw';

	const particles = useMemo(() => {
		if (!isVictory) return [];
		return Array.from({ length: 30 }, (_, i) => ({
			id: i,
			left: `${Math.random() * 100}%`,
			delay: Math.random() * 2,
			color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
			size: 4 + Math.random() * 6,
		}));
	}, [isVictory]);

	return (
		<AnimatePresence>
			{isVisible && (
				<motion.div
					className={`game-over-overlay ${isVictory ? 'victory' : 'defeat'}`}
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					transition={{ duration: 0.5 }}
				>
					{isVictory && (
						<div className="victory-particles">
							{particles.map(p => (
								<div
									key={p.id}
									className="victory-particle"
									style={{
										left: p.left,
										top: '-10px',
										width: p.size,
										height: p.size,
										background: p.color,
										animationDelay: `${p.delay}s`,
									}}
								/>
							))}
						</div>
					)}

					<motion.div
						className="game-over-panel"
						initial={{ scale: 0.8, opacity: 0, y: 20 }}
						animate={{ scale: 1, opacity: 1, y: 0 }}
						transition={{ delay: 0.2, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
					>
						<motion.div
							className="game-over-title"
							initial={{ scale: 1.4, opacity: 0 }}
							animate={{ scale: 1, opacity: 1 }}
							transition={{ delay: 0.4, type: 'spring', stiffness: 300, damping: 20 }}
						>
							{isDraw ? 'DRAW' : isVictory ? 'VICTORY' : 'DEFEAT'}
						</motion.div>

						<motion.div
							className="game-over-subtitle"
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.6, duration: 0.3 }}
						>
							{isDraw ? 'The battle ends in a stalemate' : isVictory ? 'Glory to the victor' : 'The enemy prevails'}
						</motion.div>

						<motion.div
							className="game-over-heroes"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							transition={{ delay: 0.7, duration: 0.3 }}
						>
							<div className="game-over-hero">
								<div className={`game-over-hero-portrait ${isVictory ? 'winner' : 'loser'}`}>
									<div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #334155, #1e293b)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
										{isVictory ? '\u2655' : '\u265B'}
									</div>
								</div>
								<span className="game-over-hero-name">{playerHeroName}</span>
							</div>
							<span className="game-over-vs">VS</span>
							<div className="game-over-hero">
								<div className={`game-over-hero-portrait ${!isVictory && !isDraw ? 'winner' : 'loser'}`}>
									<div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #334155, #1e293b)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
										{!isVictory ? '\u2655' : '\u265B'}
									</div>
								</div>
								<span className="game-over-hero-name">{opponentHeroName}</span>
							</div>
						</motion.div>

						<motion.div
							className="game-over-stats"
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.8, duration: 0.3 }}
						>
							<div className="game-over-stat">
								<span className="game-over-stat-value">{turnNumber}</span>
								<span className="game-over-stat-label">Turns</span>
							</div>
							<div className="game-over-stat">
								<span className="game-over-stat-value">{isVictory ? '\u2655' : '\u265B'}</span>
								<span className="game-over-stat-label">Result</span>
							</div>
							<div className="game-over-stat">
								<span className="game-over-stat-value">{isDraw ? '—' : isVictory ? 'Won' : 'Lost'}</span>
								<span className="game-over-stat-label">Outcome</span>
							</div>
						</motion.div>

						<motion.div
							className="game-over-actions"
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 1, duration: 0.3 }}
						>
							{onPlayAgain && (
								<button type="button" className="game-over-btn primary" onClick={onPlayAgain}>
									Play Again
								</button>
							)}
							{onMainMenu && (
								<button type="button" className="game-over-btn secondary" onClick={onMainMenu}>
									Main Menu
								</button>
							)}
						</motion.div>
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>
	);
};

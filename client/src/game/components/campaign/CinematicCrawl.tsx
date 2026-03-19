/**
 * CinematicCrawl.tsx — AAA chapter intro cinematic
 *
 * Star Wars-inspired story crawl with Norse atmosphere.
 * Letterbox bars, ambient particles, "A long time ago" prelude,
 * scene-by-scene narration with visual cues, progress tracking.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { CinematicIntro } from '../../campaign/campaignTypes';
import './cinematic-crawl.css';

interface CinematicCrawlProps {
	intro: CinematicIntro;
	onComplete: () => void;
}

const CinematicCrawl: React.FC<CinematicCrawlProps> = ({ intro, onComplete }) => {
	const [phase, setPhase] = useState<'prelude' | 'title' | 'scenes' | 'done'>('prelude');
	const [sceneIndex, setSceneIndex] = useState(0);

	const advanceScene = useCallback(() => {
		setSceneIndex(prev => {
			const next = prev + 1;
			if (next >= intro.scenes.length) {
				setPhase('done');
				setTimeout(onComplete, 500);
				return prev;
			}
			return next;
		});
	}, [intro.scenes.length, onComplete]);

	// Prelude → Title → Scenes
	useEffect(() => {
		if (phase === 'prelude') {
			const t = setTimeout(() => setPhase('title'), 2500);
			return () => clearTimeout(t);
		}
		if (phase === 'title') {
			const t = setTimeout(() => setPhase('scenes'), 4000);
			return () => clearTimeout(t);
		}
		return undefined;
	}, [phase]);

	// Auto-advance scenes
	useEffect(() => {
		if (phase !== 'scenes') return;
		if (sceneIndex >= intro.scenes.length) return;
		const scene = intro.scenes[sceneIndex];
		const duration = (scene.durationHint ?? 8) * 1000;
		const timer = setTimeout(advanceScene, duration);
		return () => clearTimeout(timer);
	}, [phase, sceneIndex, intro.scenes, advanceScene]);

	const handleSkip = useCallback((e: React.MouseEvent) => {
		e.stopPropagation();
		onComplete();
	}, [onComplete]);

	const handleClick = useCallback(() => {
		if (phase === 'prelude' || phase === 'title') {
			setPhase('scenes');
		} else if (phase === 'scenes') {
			advanceScene();
		}
	}, [phase, advanceScene]);

	const currentScene = phase === 'scenes' && sceneIndex < intro.scenes.length
		? intro.scenes[sceneIndex]
		: null;

	return (
		<div className="cinematic-crawl-overlay" onClick={handleClick}>
			{/* Letterbox bars */}
			<div className="cinematic-letterbox-top" />
			<div className="cinematic-letterbox-bottom" />

			<AnimatePresence mode="wait">
				{/* Phase 1: "A long time ago..." prelude */}
				{phase === 'prelude' && (
					<motion.div
						key="prelude"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 1.5 }}
						className="cinematic-prelude"
					>
						<p className="cinematic-prelude-text">In the age before ages...</p>
					</motion.div>
				)}

				{/* Phase 2: Title card */}
				{phase === 'title' && (
					<motion.div
						key="title"
						initial={{ opacity: 0, scale: 0.7 }}
						animate={{ opacity: 1, scale: 1 }}
						exit={{ opacity: 0, scale: 1.2 }}
						transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
						className="cinematic-title-card"
					>
						<motion.div
							className="cinematic-title-rune"
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 0.7, y: 0 }}
							transition={{ delay: 0.3, duration: 0.8 }}
						>
							&#x16A0;
						</motion.div>
						<h1 className="cinematic-title-text">{intro.title}</h1>
						<motion.p
							className="cinematic-title-subtitle"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							transition={{ delay: 0.8 }}
						>
							{intro.style?.includes('Norse') ? 'A Norse Saga' :
							 intro.style?.includes('Greek') ? 'An Olympian Epic' :
							 intro.style?.includes('Egypt') ? 'A Tale of the Sands' :
							 intro.style?.includes('Celtic') ? 'A Celtic Legend' :
							 intro.style?.includes('Eastern') ? 'An Eastern Chronicle' :
							 'A Mythological Saga'}
						</motion.p>
						<motion.div
							className="cinematic-title-line"
							initial={{ scaleX: 0 }}
							animate={{ scaleX: 1 }}
							transition={{ delay: 1, duration: 0.6 }}
						/>
					</motion.div>
				)}

				{/* Phase 3: Scene narration */}
				{currentScene && (
					<motion.div
						key={`scene-${sceneIndex}`}
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 1.5 }}
						className="cinematic-scene"
					>
						<motion.p
							className="cinematic-narration"
							initial={{ y: 50, opacity: 0 }}
							animate={{ y: 0, opacity: 1 }}
							transition={{ duration: 1.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
						>
							{currentScene.narration}
						</motion.p>

						{currentScene.visualCue && (
							<motion.p
								className="cinematic-visual-cue"
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 1, delay: 1.5 }}
							>
								{currentScene.visualCue}
							</motion.p>
						)}
					</motion.div>
				)}
			</AnimatePresence>

			{/* Scene counter */}
			{phase === 'scenes' && (
				<div className="cinematic-scene-counter">
					{sceneIndex + 1} / {intro.scenes.length}
				</div>
			)}

			{/* Skip button */}
			<button className="cinematic-skip-btn" onClick={handleSkip}>
				Skip
			</button>

			{/* Progress dots */}
			{phase === 'scenes' && (
				<div className="cinematic-progress">
					{intro.scenes.map((_, i) => (
						<div
							key={i}
							className={`cinematic-progress-dot ${i === sceneIndex ? 'active' : i < sceneIndex ? 'done' : ''}`}
						/>
					))}
				</div>
			)}
		</div>
	);
};

export default CinematicCrawl;

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { CinematicIntro } from '../../campaign/campaignTypes';
import './cinematic-crawl.css';

interface CinematicCrawlProps {
	intro: CinematicIntro;
	onComplete: () => void;
}

const CinematicCrawl: React.FC<CinematicCrawlProps> = ({ intro, onComplete }) => {
	const [sceneIndex, setSceneIndex] = useState(-1);
	const [showTitle, setShowTitle] = useState(true);

	const advanceScene = useCallback(() => {
		setSceneIndex(prev => {
			const next = prev + 1;
			if (next >= intro.scenes.length) {
				onComplete();
				return prev;
			}
			return next;
		});
	}, [intro.scenes.length, onComplete]);

	useEffect(() => {
		const titleTimer = setTimeout(() => {
			setShowTitle(false);
			setSceneIndex(0);
		}, 3000);
		return () => clearTimeout(titleTimer);
	}, []);

	useEffect(() => {
		if (sceneIndex < 0 || sceneIndex >= intro.scenes.length) return;
		const scene = intro.scenes[sceneIndex];
		const duration = (scene.durationHint ?? 8) * 1000;
		const timer = setTimeout(advanceScene, duration);
		return () => clearTimeout(timer);
	}, [sceneIndex, intro.scenes, advanceScene]);

	const handleSkip = useCallback(() => {
		onComplete();
	}, [onComplete]);

	const currentScene = sceneIndex >= 0 && sceneIndex < intro.scenes.length
		? intro.scenes[sceneIndex]
		: null;

	return (
		<div className="cinematic-crawl-overlay" onClick={handleSkip}>
			<AnimatePresence mode="wait">
				{showTitle && (
					<motion.div
						key="title"
						initial={{ opacity: 0, scale: 0.8 }}
						animate={{ opacity: 1, scale: 1 }}
						exit={{ opacity: 0, scale: 1.1 }}
						transition={{ duration: 0.8 }}
						className="cinematic-title-card"
					>
						<div className="cinematic-title-rune">&#x16A0;</div>
						<h1 className="cinematic-title-text">{intro.title}</h1>
						<div className="cinematic-title-line" />
					</motion.div>
				)}

				{currentScene && (
					<motion.div
						key={`scene-${sceneIndex}`}
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 1.2 }}
						className="cinematic-scene"
					>
						<motion.p
							className="cinematic-narration"
							initial={{ y: 40, opacity: 0 }}
							animate={{ y: 0, opacity: 1 }}
							transition={{ duration: 1.5, delay: 0.3 }}
						>
							{currentScene.narration}
						</motion.p>

						{currentScene.visualCue && (
							<motion.p
								className="cinematic-visual-cue"
								initial={{ opacity: 0 }}
								animate={{ opacity: 0.5 }}
								transition={{ duration: 1, delay: 1 }}
							>
								{currentScene.visualCue}
							</motion.p>
						)}
					</motion.div>
				)}
			</AnimatePresence>

			<button className="cinematic-skip-btn" onClick={handleSkip}>
				Skip
			</button>

			<div className="cinematic-progress">
				{intro.scenes.map((_, i) => (
					<div
						key={i}
						className={`cinematic-progress-dot ${i === sceneIndex ? 'active' : i < sceneIndex ? 'done' : ''}`}
					/>
				))}
			</div>
		</div>
	);
};

export default CinematicCrawl;

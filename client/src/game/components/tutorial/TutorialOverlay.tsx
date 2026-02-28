import React from 'react';
import { useTutorialStore, TUTORIAL_STEPS } from '../../tutorial/tutorialStore';

export default function TutorialOverlay() {
	const tutorialDismissed = useTutorialStore(s => s.tutorialDismissed);
	const currentStepIndex = useTutorialStore(s => s.currentStepIndex);
	const nextStep = useTutorialStore(s => s.nextStep);
	const prevStep = useTutorialStore(s => s.prevStep);
	const dismissTutorial = useTutorialStore(s => s.dismissTutorial);

	if (tutorialDismissed) return null;

	const step = TUTORIAL_STEPS[currentStepIndex];
	if (!step) return null;

	const isLast = currentStepIndex === TUTORIAL_STEPS.length - 1;
	const isFirst = currentStepIndex === 0;

	return (
		<div className="fixed inset-0 z-[9990] flex items-center justify-center bg-black/60 backdrop-blur-sm">
			<div className="bg-gray-900 border border-amber-700/50 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
				{/* Step indicator */}
				<div className="flex items-center justify-between mb-4">
					<span className="text-xs text-gray-500">
						{currentStepIndex + 1} / {TUTORIAL_STEPS.length}
					</span>
					<button
						onClick={dismissTutorial}
						className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
					>
						Skip Tutorial
					</button>
				</div>

				{/* Progress bar */}
				<div className="w-full h-1 bg-gray-800 rounded-full mb-4 overflow-hidden">
					<div
						className="h-full bg-amber-500 rounded-full transition-all duration-300"
						style={{ width: `${((currentStepIndex + 1) / TUTORIAL_STEPS.length) * 100}%` }}
					/>
				</div>

				{/* Content */}
				<h3 className="text-lg font-bold text-amber-400 mb-2">{step.title}</h3>
				<p className="text-sm text-gray-300 leading-relaxed mb-6">{step.description}</p>

				{/* Navigation */}
				<div className="flex gap-3">
					{!isFirst && (
						<button
							onClick={prevStep}
							className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition-colors"
						>
							Previous
						</button>
					)}
					<button
						onClick={nextStep}
						className="flex-1 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-sm font-semibold transition-colors"
					>
						{isLast ? 'Start Playing!' : 'Next'}
					</button>
				</div>
			</div>
		</div>
	);
}

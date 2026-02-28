import React, { useState, useEffect } from 'react';

const LORE_QUOTES = [
	'The World Tree trembles as the age of Ragnarok draws near...',
	'In the halls of Valhalla, the Einherjar prepare for the final battle.',
	'Odin sacrificed his eye at the Well of Wisdom. What will you sacrifice?',
	'The Norns weave the threads of fate. Your destiny awaits.',
	'From the fire of Muspelheim and the ice of Niflheim, all worlds were born.',
	'Fenrir strains against his bonds. The twilight of the gods approaches.',
	'The Bifrost bridge shimmers between realms. Choose your path wisely.',
	'Yggdrasil stands eternal, its roots reaching into all nine worlds.',
	'The ravens Huginn and Muninn fly forth, seeking knowledge across the realms.',
	'Thor wields Mjolnir. Zeus commands lightning. Ra rides the solar barque.',
	'The Morrigan watches from the battlefield. Celtic fury stirs.',
	'Anubis weighs the hearts of fallen warriors. May yours prove worthy.',
];

function getRandomQuote(): string {
	return LORE_QUOTES[Math.floor(Math.random() * LORE_QUOTES.length)];
}

export default function LoadingScreen({ message }: { message?: string }) {
	const [quote, setQuote] = useState(getRandomQuote);
	const [dots, setDots] = useState('');

	useEffect(() => {
		const quoteInterval = setInterval(() => setQuote(getRandomQuote()), 5000);
		const dotInterval = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 400);
		return () => {
			clearInterval(quoteInterval);
			clearInterval(dotInterval);
		};
	}, []);

	return (
		<div className="fixed inset-0 z-[9999] bg-gray-950 flex flex-col items-center justify-center">
			{/* Rune spinner */}
			<div className="relative w-24 h-24 mb-8">
				<div className="absolute inset-0 rounded-full border-2 border-amber-500/30 animate-spin"
					style={{ animationDuration: '3s' }} />
				<div className="absolute inset-2 rounded-full border-2 border-amber-400/50 animate-spin"
					style={{ animationDuration: '2s', animationDirection: 'reverse' }} />
				<div className="absolute inset-4 rounded-full border-2 border-amber-300/70 animate-spin"
					style={{ animationDuration: '1.5s' }} />
				<div className="absolute inset-0 flex items-center justify-center">
					<span className="text-3xl text-amber-400 font-bold">R</span>
				</div>
			</div>

			{/* Loading text */}
			<p className="text-amber-400 text-lg font-semibold mb-2">
				{message || 'Loading'}{dots}
			</p>

			{/* Lore quote */}
			<p className="text-gray-500 text-sm italic max-w-md text-center px-4 transition-opacity duration-500">
				"{quote}"
			</p>
		</div>
	);
}

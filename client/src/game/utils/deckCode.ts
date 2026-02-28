import type { HeroDeck } from '../stores/heroDeckStore';
import { cardRegistry } from '../data/cardRegistry';

const DECK_CODE_VERSION = 1;

const HERO_CLASSES = [
	'mage', 'hunter', 'warrior', 'priest', 'rogue',
	'paladin', 'warlock', 'druid', 'shaman',
	'death_knight', 'demon_hunter', 'monk',
] as const;

export function encodeDeck(deck: HeroDeck): string {
	const bytes: number[] = [];

	bytes.push(DECK_CODE_VERSION);

	const classIndex = HERO_CLASSES.indexOf(deck.heroClass as typeof HERO_CLASSES[number]);
	bytes.push(classIndex >= 0 ? classIndex : 255);

	const heroIdBytes = new TextEncoder().encode(deck.heroId);
	bytes.push(heroIdBytes.length);
	for (const b of heroIdBytes) bytes.push(b);

	const counts = new Map<number, number>();
	for (const id of deck.cardIds) {
		counts.set(id, (counts.get(id) || 0) + 1);
	}

	const singles: number[] = [];
	const doubles: number[] = [];
	for (const [id, count] of counts) {
		if (count === 1) singles.push(id);
		else doubles.push(id);
	}

	singles.sort((a, b) => a - b);
	doubles.sort((a, b) => a - b);

	bytes.push(singles.length);
	for (const id of singles) {
		bytes.push((id >> 8) & 0xFF);
		bytes.push(id & 0xFF);
	}

	bytes.push(doubles.length);
	for (const id of doubles) {
		bytes.push((id >> 8) & 0xFF);
		bytes.push(id & 0xFF);
	}

	return btoa(String.fromCharCode(...bytes));
}

export function decodeDeck(code: string): { heroId: string; heroClass: string; cardIds: number[] } | null {
	try {
		const raw = atob(code);
		const bytes = new Uint8Array(raw.length);
		for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);

		let offset = 0;

		const version = bytes[offset++];
		if (version !== DECK_CODE_VERSION) return null;

		const classIndex = bytes[offset++];
		const heroClass = classIndex < HERO_CLASSES.length ? HERO_CLASSES[classIndex] : 'mage';

		const heroIdLen = bytes[offset++];
		const heroIdBytes = bytes.slice(offset, offset + heroIdLen);
		offset += heroIdLen;
		const heroId = new TextDecoder().decode(heroIdBytes);

		const cardIds: number[] = [];

		const singlesCount = bytes[offset++];
		for (let i = 0; i < singlesCount; i++) {
			const id = (bytes[offset] << 8) | bytes[offset + 1];
			offset += 2;
			cardIds.push(id);
		}

		const doublesCount = bytes[offset++];
		for (let i = 0; i < doublesCount; i++) {
			const id = (bytes[offset] << 8) | bytes[offset + 1];
			offset += 2;
			cardIds.push(id);
			cardIds.push(id);
		}

		return { heroId, heroClass, cardIds };
	} catch {
		return null;
	}
}

export function validateDeckCode(code: string): boolean {
	const result = decodeDeck(code);
	if (!result) return false;
	for (const id of result.cardIds) {
		if (!cardRegistry.find(c => Number(c.id) === id)) return false;
	}
	return true;
}

export function deckCodeToUrl(code: string): string {
	return `${window.location.origin}?deck=${encodeURIComponent(code)}`;
}

export function deckCodeFromUrl(): string | null {
	const params = new URLSearchParams(window.location.search);
	return params.get('deck');
}

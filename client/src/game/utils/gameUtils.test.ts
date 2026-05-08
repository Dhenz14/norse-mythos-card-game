import { describe, it, expect } from 'vitest';
import type { Player } from '../../game/types';

describe('Player type contract', () => {
	it('maxHealth is a required field on the Player interface', () => {
		const player: Player = {
			id: 'test',
			name: 'Test',
			hand: [],
			battlefield: [],
			deck: [],
			graveyard: [],
			secrets: [],
			mana: { current: 1, max: 1, overloaded: 0, pendingOverload: 0 },
			health: 30,
			maxHealth: 30,
			heroClass: 'warrior' as any,
			heroPower: {} as any,
			cardsPlayedThisTurn: 0,
			attacksPerformedThisTurn: 0,
		};

		expect(player.maxHealth).toBe(30);
		expect(typeof player.maxHealth).toBe('number');
	});

	it('maxHealth can be modified for Prince Renathal (40hp)', () => {
		const player: Player = {
			id: 'test',
			name: 'Test',
			hand: [],
			battlefield: [],
			deck: [],
			graveyard: [],
			secrets: [],
			mana: { current: 1, max: 1, overloaded: 0, pendingOverload: 0 },
			health: 40,
			maxHealth: 40,
			heroHealth: 40,
			heroClass: 'warrior' as any,
			heroPower: {} as any,
			cardsPlayedThisTurn: 0,
			attacksPerformedThisTurn: 0,
		};

		expect(player.maxHealth).toBe(40);
		expect(player.heroHealth).toBe(40);
	});

	it('maxHealth can be reduced for Lord Jaraxxus (15hp)', () => {
		const player: Player = {
			id: 'test',
			name: 'Test',
			hand: [],
			battlefield: [],
			deck: [],
			graveyard: [],
			secrets: [],
			mana: { current: 1, max: 1, overloaded: 0, pendingOverload: 0 },
			health: 15,
			maxHealth: 15,
			heroHealth: 15,
			heroClass: 'warlock' as any,
			heroPower: {} as any,
			cardsPlayedThisTurn: 0,
			attacksPerformedThisTurn: 0,
		};

		expect(player.maxHealth).toBe(15);
	});

	it('heal cannot exceed maxHealth', () => {
		const player: Player = {
			id: 'test',
			name: 'Test',
			hand: [],
			battlefield: [],
			deck: [],
			graveyard: [],
			secrets: [],
			mana: { current: 1, max: 1, overloaded: 0, pendingOverload: 0 },
			health: 20,
			maxHealth: 30,
			heroHealth: 20,
			heroClass: 'priest' as any,
			heroPower: {} as any,
			cardsPlayedThisTurn: 0,
			attacksPerformedThisTurn: 0,
		};

		const healAmount = 15;
		const newHealth = Math.min(player.heroHealth! + healAmount, player.maxHealth);
		expect(newHealth).toBe(30);
	});
});

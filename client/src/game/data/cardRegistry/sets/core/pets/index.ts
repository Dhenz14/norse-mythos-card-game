/**
 * Pet Cards — Element-based minions with evolution
 *
 * ~112 pet cards organized by element:
 * - Fire (50000-50099)
 * - Water (50100-50199)
 * - Grass (50200-50299)
 * - Electric (50300-50399)
 * - Dark (50400-50499)
 * - Light (50500-50599)
 * - Neutral (50600-50699)
 * - Tokens (9200-9249)
 */
import { CardData } from '../../../../../types';
import { firePets } from './firePets';
import { waterPets } from './waterPets';
import { grassPets } from './grassPets';
import { electricPets } from './electricPets';
import { darkPets } from './darkPets';
import { lightPets } from './lightPets';
import { neutralPets } from './neutralPets';
import { petTokens } from './petTokens';

export const allPetCards: CardData[] = [
	...firePets,
	...waterPets,
	...grassPets,
	...electricPets,
	...darkPets,
	...lightPets,
	...neutralPets,
	...petTokens
];

export {
	firePets,
	waterPets,
	grassPets,
	electricPets,
	darkPets,
	lightPets,
	neutralPets,
	petTokens
};

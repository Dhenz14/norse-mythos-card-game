import type { NFTMetadata, MintInfo } from './types';
import { hashNFTMetadata } from './hashUtils';

interface CardDefinition {
	id: number;
	name: string;
	type: string;
	rarity: string;
	heroClass?: string;
	class?: string;
	attack?: number;
	health?: number;
	manaCost?: number;
	keywords?: string[];
	description?: string;
}

const TEMPLATE_VERSION = 1;

export async function generateNFTMetadata(
	cardDef: CardDefinition,
	mintInfo: MintInfo
): Promise<NFTMetadata> {
	const metadataWithoutHash: Omit<NFTMetadata, 'hash'> = {
		uid: mintInfo.uid,
		cardId: cardDef.id,
		templateVersion: TEMPLATE_VERSION,
		name: cardDef.name,
		type: cardDef.type,
		rarity: cardDef.rarity,
		heroClass: cardDef.heroClass || cardDef.class || 'neutral',
		stats: {
			attack: cardDef.attack,
			health: cardDef.health,
			manaCost: cardDef.manaCost,
		},
		keywords: cardDef.keywords || [],
		description: cardDef.description || '',
		edition: mintInfo.edition,
		foil: mintInfo.foil,
		mintNumber: mintInfo.mintNumber,
		maxSupply: mintInfo.maxSupply,
		mintedAt: Date.now(),
		mintedBy: mintInfo.mintedBy,
	};

	const hash = await hashNFTMetadata(metadataWithoutHash);

	return { ...metadataWithoutHash, hash };
}

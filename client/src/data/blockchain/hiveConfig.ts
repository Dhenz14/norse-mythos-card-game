export const HIVE_NODES = [
	'https://api.hive.blog',
	'https://api.deathwing.me',
	'https://api.openhive.network',
] as const;

export const RAGNAROK_ACCOUNT = 'ragnarok';

// On-chain NFT metadata URLs (ERC-1155 standard for blockchain explorers/marketplaces).
// NOT used for in-game art rendering — all runtime art loads via assetPath() from local files.
// Players download all art; each player is their own CDN. No centralized servers.
export const NFT_ART_BASE_URL = 'https://ragnarok.cards/art';

export const EXTERNAL_URL_BASE = 'https://ragnarok.cards/card';

export const DEFAULT_ELO_RATING = 1000;

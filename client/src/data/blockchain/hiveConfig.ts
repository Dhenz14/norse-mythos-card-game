export const HIVE_NODES = [
	'https://api.hive.blog',
	'https://api.deathwing.me',
	'https://api.openhive.network',
] as const;

export const RAGNAROK_ACCOUNT = 'ragnarok';
export const RAGNAROK_GENESIS_ACCOUNT = 'ragnarok-genesis';
export const RAGNAROK_TREASURY_ACCOUNT = 'ragnarok-treasury';

// On-chain NFT metadata URLs (ERC-1155 standard for blockchain explorers/marketplaces).
// NOT used for in-game art rendering — all runtime art loads via assetPath() from local files.
// Players download all art; each player is their own CDN. No centralized servers.
// Points to GitHub Pages deployment — permanent, decentralized hosting.
export const NFT_ART_BASE_URL = 'https://dhenz14.github.io/norse-mythos-card-game';

export const EXTERNAL_URL_BASE = 'https://dhenz14.github.io/norse-mythos-card-game';

export const HIVE_EXPLORER_URL = 'https://hivehub.dev/tx/';
export const HIVE_BLOCK_EXPLORER_URL = 'https://hivehub.dev/b/';

export const DEFAULT_ELO_RATING = 1000;

// Edition boundary: cards minted before this Hive block number are 'alpha', after are 'beta'.
// Set to a future block; update before beta launch.
export const ALPHA_EDITION_CUTOFF_BLOCK = 100_000_000;

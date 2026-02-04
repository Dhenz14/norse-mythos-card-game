export interface RarityOdds {
  common: number;
  rare: number;
  epic: number;
  legendary: number;
  mythic: number;
}

export interface PackType {
  id: number;
  name: string;
  description: string;
  price: number;
  cardCount: number;
  rarityOdds: RarityOdds;
  imageUrl?: string;
}

export interface PackTypeResponse {
  packs: PackType[];
}

export interface RarityStats {
  nft_rarity: string;
  max_supply: string | number;
  remaining_supply: string | number;
  card_count: string | number;
}

export interface SupplyStatsResponse {
  overall: {
    total_cards: string | number;
    total_max_supply: string | number;
    total_remaining_supply: string | number;
  };
  byRarity: RarityStats[];
}

export interface OpenedCard {
  cardId: number;
  cardName: string;
  nftRarity: string;
  cardType: string;
  heroClass: string;
  imageUrl?: string;
}

export interface PackOpenResponse {
  success: boolean;
  cards: OpenedCard[];
  packType: string;
}

export interface PaginationData {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
}

export interface InventoryCard {
  id?: number;
  card_id: number;
  card_name: string;
  nft_rarity: string;
  card_type: string;
  hero_class: string;
  quantity: number;
  imageUrl?: string;
}

export interface InventoryResponse {
  inventory: InventoryCard[];
  pagination: PaginationData;
}

export interface RevealedCard {
  id: number;
  name: string;
  rarity: string;
  type: string;
  heroClass: string;
  imageUrl?: string;
}

export interface OwnedCard {
  id: number;
  name: string;
  rarity: string;
  type: string;
  heroClass: string;
  quantity: number;
  description?: string;
  attack?: number;
  health?: number;
  manaCost?: number;
  imageUrl?: string;
}

export interface SupplyStats {
  totalCardsOpened: number;
  totalPacksOpened: number;
  legendaryDropRate: number;
  mythicDropRate: number;
}

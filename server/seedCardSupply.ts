/**
 * Seed Card Supply Script
 * 
 * This script populates the card_supply table with all collectible cards,
 * mapping game rarities to NFT scarcity tiers.
 * 
 * Run with: npx tsx server/seedCardSupply.ts
 */

import { db, directDb } from './db';
import { cardSupply } from '../shared/schema';
import { eq } from 'drizzle-orm';

// NFT Rarity tiers with supply ranges (rarer = lower supply)
// 4 tiers matching game rarities for intuitive pack opening
const NFT_RARITY_CONFIG = {
  mythic: { minSupply: 50, maxSupply: 100 },        // Legendary game cards + Heroes (ultra-rare)
  legendary: { minSupply: 200, maxSupply: 500 },    // Epic game cards (very rare)
  rare: { minSupply: 1500, maxSupply: 3000 },       // Rare game cards (uncommon)
  common: { minSupply: 5000, maxSupply: 10000 },    // Common/Basic game cards (most common)
} as const;

type NftRarity = keyof typeof NFT_RARITY_CONFIG;

interface CardData {
  id: number | string;
  name: string;
  type: string;
  rarity?: string;
  class?: string;
  heroClass?: string;
  collectible?: boolean;
}

/**
 * Maps game rarity to NFT rarity tier
 * 
 * Game Rarity → NFT Tier (supply in parentheses)
 * - legendary → mythic (50-100 copies, ultra-rare)
 * - epic → legendary (200-500 copies, very rare)
 * - rare → rare (3000-5000 copies, uncommon)
 * - common/basic/free → common (8000-12000 copies, most common)
 */
function mapToNftRarity(card: CardData): NftRarity | null {
  // Skip non-collectible cards (tokens)
  if (card.collectible === false) {
    return null;
  }

  const rarity = (card.rarity || 'common').toLowerCase();
  const type = (card.type || '').toLowerCase();

  // Hero cards and legendary rarity -> mythic (ultra-rare)
  if (type === 'hero' || rarity === 'legendary') {
    return 'mythic';
  }

  // Epic rarity -> legendary (very rare)
  if (rarity === 'epic') {
    return 'legendary';
  }

  // Rare rarity -> rare (uncommon)
  if (rarity === 'rare') {
    return 'rare';
  }

  // Common, basic, or free -> common (most common)
  if (rarity === 'common' || rarity === 'basic' || rarity === 'free') {
    return 'common';
  }

  // Default to common for unknown rarities
  return 'common';
}

/**
 * Generates a random supply count within the tier's range
 */
function generateSupply(nftRarity: NftRarity): number {
  const config = NFT_RARITY_CONFIG[nftRarity];
  return Math.floor(Math.random() * (config.maxSupply - config.minSupply + 1)) + config.minSupply;
}

/**
 * Load card data from the card registry
 * Since the card registry is in the client folder, we'll dynamically import the data
 */
async function loadCardRegistry(): Promise<CardData[]> {
  // Load card data directly from the JSON-like structure
  // We'll use a simple file-based approach to avoid ESM/CJS issues
  const fs = await import('fs');
  const path = await import('path');
  
  const registryPath = path.join(process.cwd(), 'client/src/game/data/cardRegistry');
  
  const allCards: CardData[] = [];
  
  // Helper to recursively find all .ts files
  async function findTsFiles(dir: string): Promise<string[]> {
    const files: string[] = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...await findTsFiles(fullPath));
      } else if (entry.name.endsWith('.ts') && !entry.name.includes('index') && !entry.name.includes('validation')) {
        files.push(fullPath);
      }
    }
    return files;
  }
  
  // Parse card objects from TypeScript files
  function extractCards(content: string): CardData[] {
    const cards: CardData[] = [];
    
    // Match card object patterns - simplified regex
    const cardPattern = /\{\s*id:\s*(\d+),\s*name:\s*['"]([^'"]+)['"]/g;
    let match;
    
    while ((match = cardPattern.exec(content)) !== null) {
      const cardId = parseInt(match[1], 10);
      const cardName = match[2];
      
      // Extract more properties from the surrounding context
      const startIndex = match.index;
      const endIndex = content.indexOf('},', startIndex) || content.indexOf('}]', startIndex);
      if (endIndex === -1) continue;
      
      const cardBlock = content.substring(startIndex, endIndex + 1);
      
      // Extract type
      const typeMatch = cardBlock.match(/type:\s*['"]([^'"]+)['"]/);
      const type = typeMatch ? typeMatch[1] : 'minion';
      
      // Extract rarity
      const rarityMatch = cardBlock.match(/rarity:\s*['"]([^'"]+)['"]/);
      const rarity = rarityMatch ? rarityMatch[1] : 'common';
      
      // Extract class
      const classMatch = cardBlock.match(/class:\s*['"]([^'"]+)['"]/);
      const heroClass = classMatch ? classMatch[1] : 'Neutral';
      
      // Extract collectible
      const collectibleMatch = cardBlock.match(/collectible:\s*(true|false)/);
      const collectible = collectibleMatch ? collectibleMatch[1] === 'true' : true;
      
      cards.push({
        id: cardId,
        name: cardName,
        type,
        rarity,
        heroClass,
        collectible,
      });
    }
    
    return cards;
  }
  
  try {
    const tsFiles = await findTsFiles(registryPath);
    console.log(`Found ${tsFiles.length} TypeScript files in card registry`);
    
    for (const file of tsFiles) {
      try {
        const content = fs.readFileSync(file, 'utf-8');
        const cards = extractCards(content);
        allCards.push(...cards);
      } catch (err) {
        console.error(`Error reading file ${file}:`, err);
      }
    }
    
    // Also check the cardSets directory
    const cardSetsPath = path.join(process.cwd(), 'client/src/game/data/cardSets');
    if (fs.existsSync(cardSetsPath)) {
      const cardSetFiles = await findTsFiles(cardSetsPath);
      console.log(`Found ${cardSetFiles.length} TypeScript files in cardSets`);
      
      for (const file of cardSetFiles) {
        try {
          const content = fs.readFileSync(file, 'utf-8');
          const cards = extractCards(content);
          allCards.push(...cards);
        } catch (err) {
          console.error(`Error reading file ${file}:`, err);
        }
      }
    }
    
  } catch (err) {
    console.error('Error loading card registry:', err);
  }
  
  // Remove duplicates by ID
  const uniqueCards = new Map<number, CardData>();
  for (const card of allCards) {
    const id = typeof card.id === 'string' ? parseInt(card.id, 10) : card.id;
    if (!isNaN(id) && !uniqueCards.has(id)) {
      uniqueCards.set(id, { ...card, id });
    }
  }
  
  console.log(`Loaded ${uniqueCards.size} unique cards`);
  return Array.from(uniqueCards.values());
}

/**
 * Main seed function
 */
async function seedCardSupply() {
  console.log('Starting card supply seed...');
  
  // Load cards from registry
  const cards = await loadCardRegistry();
  console.log(`Processing ${cards.length} cards...`);
  
  // Track statistics (4 tiers: mythic, legendary, rare, common)
  const stats = {
    total: 0,
    byRarity: {
      mythic: { count: 0, supply: 0 },
      legendary: { count: 0, supply: 0 },
      rare: { count: 0, supply: 0 },
      common: { count: 0, supply: 0 },
    } as Record<string, { count: number; supply: number }>,
    skipped: 0,
  };
  
  // First, clear existing data
  try {
    await directDb.query('DELETE FROM card_supply');
    console.log('Cleared existing card_supply data');
  } catch (err) {
    console.error('Error clearing card_supply:', err);
  }
  
  // Process each card
  const insertBatch: any[] = [];
  
  for (const card of cards) {
    const nftRarity = mapToNftRarity(card);
    
    if (!nftRarity) {
      stats.skipped++;
      continue;
    }
    
    const supply = generateSupply(nftRarity);
    const cardId = typeof card.id === 'string' ? parseInt(card.id, 10) : card.id;
    
    insertBatch.push({
      cardId,
      cardName: card.name,
      nftRarity,
      maxSupply: supply,
      remainingSupply: supply,
      cardType: card.type || 'minion',
      heroClass: (card.heroClass || card.class || 'Neutral').toLowerCase(),
    });
    
    stats.total++;
    stats.byRarity[nftRarity].count++;
    stats.byRarity[nftRarity].supply += supply;
  }
  
  // Insert in batches using raw SQL for better compatibility
  const batchSize = 50;
  for (let i = 0; i < insertBatch.length; i += batchSize) {
    const batch = insertBatch.slice(i, i + batchSize);
    try {
      // Build VALUES clause
      const values: any[] = [];
      const valuePlaceholders: string[] = [];
      let paramIndex = 1;
      
      for (const item of batch) {
        valuePlaceholders.push(`($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3}, $${paramIndex + 4}, $${paramIndex + 5}, $${paramIndex + 6})`);
        values.push(
          item.cardId,
          item.cardName,
          item.nftRarity,
          item.maxSupply,
          item.remainingSupply,
          item.cardType,
          item.heroClass
        );
        paramIndex += 7;
      }
      
      const query = `
        INSERT INTO card_supply (card_id, card_name, nft_rarity, max_supply, remaining_supply, card_type, hero_class)
        VALUES ${valuePlaceholders.join(', ')}
        ON CONFLICT (card_id) DO UPDATE SET
          card_name = EXCLUDED.card_name,
          nft_rarity = EXCLUDED.nft_rarity,
          max_supply = EXCLUDED.max_supply,
          remaining_supply = EXCLUDED.remaining_supply,
          card_type = EXCLUDED.card_type,
          hero_class = EXCLUDED.hero_class
      `;
      
      await directDb.query(query, values);
      console.log(`Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(insertBatch.length / batchSize)}`);
    } catch (err: any) {
      console.error('Error inserting batch:', err.message);
    }
  }
  
  // Calculate total supply
  const totalSupply = Object.values(stats.byRarity).reduce((sum, r) => sum + r.supply, 0);
  
  console.log('\n=== Seed Complete ===');
  console.log(`Total cards: ${stats.total}`);
  console.log(`Skipped (tokens): ${stats.skipped}`);
  console.log(`Total supply: ${totalSupply.toLocaleString()}`);
  console.log('\nBy NFT Rarity:');
  for (const [rarity, data] of Object.entries(stats.byRarity)) {
    console.log(`  ${rarity}: ${data.count} cards, ${data.supply.toLocaleString()} total supply`);
  }
  
  // Close the connection
  await directDb.end();
  process.exit(0);
}

// Run if executed directly
seedCardSupply().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});

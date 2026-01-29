/**
 * Pack Routes
 * 
 * Endpoints for pack types, supply stats, and pack opening.
 */

import express, { Request, Response } from 'express';
import { directDb } from '../db';

const router = express.Router();

/**
 * GET /api/packs/types
 * Returns all active pack types
 */
router.get('/types', async (_req: Request, res: Response) => {
  try {
    const result = await directDb.query(`
      SELECT * FROM pack_types WHERE is_active = true ORDER BY price ASC
    `);
    
    res.json({ success: true, packs: result.rows });
  } catch (error: any) {
    console.error('Error fetching pack types:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/packs/supply-stats
 * Returns summary stats (total cards, remaining, by rarity)
 */
router.get('/supply-stats', async (_req: Request, res: Response) => {
  try {
    // Get overall stats
    const overallStats = await directDb.query(`
      SELECT 
        COUNT(*) as total_cards,
        SUM(max_supply) as total_max_supply,
        SUM(remaining_supply) as total_remaining_supply
      FROM card_supply
    `);
    
    // Get stats by NFT rarity
    const rarityStats = await directDb.query(`
      SELECT 
        nft_rarity,
        COUNT(*) as card_count,
        SUM(max_supply) as max_supply,
        SUM(remaining_supply) as remaining_supply
      FROM card_supply
      GROUP BY nft_rarity
      ORDER BY 
        CASE nft_rarity 
          WHEN 'mythic' THEN 1 
          WHEN 'legendary' THEN 2 
          WHEN 'epic' THEN 3 
          WHEN 'rare' THEN 4 
          WHEN 'common' THEN 5 
        END
    `);
    
    // Get stats by card type
    const typeStats = await directDb.query(`
      SELECT 
        card_type,
        COUNT(*) as card_count,
        SUM(max_supply) as max_supply,
        SUM(remaining_supply) as remaining_supply
      FROM card_supply
      GROUP BY card_type
    `);
    
    res.json({
      success: true,
      overall: overallStats.rows[0],
      byRarity: rarityStats.rows,
      byType: typeStats.rows,
    });
  } catch (error: any) {
    console.error('Error fetching supply stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/packs/open
 * Opens a pack and returns the cards pulled
 */
router.post('/open', async (req: Request, res: Response) => {
  const { packTypeId, userId } = req.body;
  
  if (!packTypeId || !userId) {
    return res.status(400).json({ 
      success: false, 
      error: 'packTypeId and userId are required' 
    });
  }
  
  const client = await directDb.connect();
  
  try {
    await client.query('BEGIN');
    
    // Get pack type configuration with lock
    const packResult = await client.query(`
      SELECT * FROM pack_types WHERE id = $1 AND is_active = true FOR UPDATE
    `, [packTypeId]);
    
    if (packResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'Pack type not found or inactive' });
    }
    
    const pack = packResult.rows[0];
    const pulledCards: any[] = [];
    
    // Rarity fallback order (4-tier system: common, rare, legendary, mythic)
    // If requested rarity is unavailable, upgrade to next tier
    const rarityFallback: Record<string, string[]> = {
      common: ['common', 'rare', 'legendary', 'mythic'],
      rare: ['rare', 'legendary', 'mythic'],
      epic: ['legendary', 'mythic'], // epic slot = legendary tier in 4-tier system
      legendary: ['legendary', 'mythic'],
      mythic: ['mythic', 'legendary'],
    };
    
    // Helper function to pull a card of a specific rarity with fallback
    async function pullCard(nftRarity: string): Promise<any | null> {
      const fallbackOrder = rarityFallback[nftRarity] || [nftRarity];
      
      for (const rarity of fallbackOrder) {
        // Select a random card with remaining supply
        const cardResult = await client.query(`
          SELECT * FROM card_supply 
          WHERE nft_rarity = $1 AND remaining_supply > 0 
          ORDER BY RANDOM() 
          LIMIT 1 
          FOR UPDATE
        `, [rarity]);
        
        if (cardResult.rows.length > 0) {
          const card = cardResult.rows[0];
          
          // Decrement remaining supply
          await client.query(`
            UPDATE card_supply 
            SET remaining_supply = remaining_supply - 1 
            WHERE id = $1
          `, [card.id]);
          
          return card;
        }
      }
      
      return null;
    }
    
    // Helper function to determine wildcard rarity based on chances
    function determineWildcardRarity(legendaryChance: number, mythicChance: number): string {
      const roll = Math.random() * 100;
      
      if (roll < mythicChance) {
        return 'mythic';
      } else if (roll < mythicChance + legendaryChance) {
        return 'legendary';
      } else if (roll < mythicChance + legendaryChance + 20) {
        return 'epic';
      } else {
        return 'rare';
      }
    }
    
    // Pull common cards (will fall back to rare if no commons exist)
    for (let i = 0; i < pack.common_slots; i++) {
      const card = await pullCard('common');
      if (card) pulledCards.push(card);
    }
    
    // Pull rare cards
    for (let i = 0; i < pack.rare_slots; i++) {
      const card = await pullCard('rare');
      if (card) pulledCards.push(card);
    }
    
    // Pull epic cards
    for (let i = 0; i < pack.epic_slots; i++) {
      const card = await pullCard('epic');
      if (card) pulledCards.push(card);
    }
    
    // Pull wildcard slots (can upgrade to legendary/mythic)
    for (let i = 0; i < pack.wildcard_slots; i++) {
      const rarity = determineWildcardRarity(pack.legendary_chance, pack.mythic_chance);
      const card = await pullCard(rarity);
      if (card) pulledCards.push(card);
    }
    
    // Add cards to user inventory
    for (const card of pulledCards) {
      // Check if user already has this card
      const existingResult = await client.query(`
        SELECT * FROM user_inventory 
        WHERE user_id = $1 AND card_id = $2 
        FOR UPDATE
      `, [userId, card.card_id]);
      
      if (existingResult.rows.length > 0) {
        // Update quantity
        await client.query(`
          UPDATE user_inventory 
          SET quantity = quantity + 1 
          WHERE user_id = $1 AND card_id = $2
        `, [userId, card.card_id]);
      } else {
        // Insert new inventory entry
        await client.query(`
          INSERT INTO user_inventory (user_id, card_id, quantity) 
          VALUES ($1, $2, 1)
        `, [userId, card.card_id]);
      }
    }
    
    // Record pack history
    const cardIds = pulledCards.map(c => c.card_id);
    await client.query(`
      INSERT INTO pack_history (user_id, pack_type_id, cards_received) 
      VALUES ($1, $2, $3)
    `, [userId, packTypeId, JSON.stringify(cardIds)]);
    
    await client.query('COMMIT');
    
    res.json({
      success: true,
      packType: pack.name,
      cards: pulledCards.map(c => ({
        cardId: c.card_id,
        cardName: c.card_name,
        nftRarity: c.nft_rarity,
        cardType: c.card_type,
        heroClass: c.hero_class,
        remainingSupply: c.remaining_supply - 1,
        maxSupply: c.max_supply,
      })),
      totalPulled: pulledCards.length,
    });
    
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Error opening pack:', error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    client.release();
  }
});

/**
 * GET /api/packs/history/:userId
 * Returns pack opening history for a user
 */
router.get('/history/:userId', async (req: Request, res: Response) => {
  const { userId } = req.params;
  
  try {
    const historyResult = await directDb.query(`
      SELECT ph.*, pt.name as pack_name 
      FROM pack_history ph
      JOIN pack_types pt ON ph.pack_type_id = pt.id
      WHERE ph.user_id = $1
      ORDER BY ph.opened_at DESC
      LIMIT 50
    `, [userId]);
    
    res.json({
      success: true,
      history: historyResult.rows.map(row => ({
        ...row,
        cards_received: JSON.parse(row.cards_received),
      })),
    });
  } catch (error: any) {
    console.error('Error fetching pack history:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;

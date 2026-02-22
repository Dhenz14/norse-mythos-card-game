/**
 * Pack Routes
 *
 * Endpoints for pack types, supply stats, and pack opening.
 */

import express, { Request, Response } from 'express';
import { directDb as _directDb } from '../db';

// This file is only imported when DATABASE_URL is set (see server/routes.ts)
const directDb = _directDb!;

const router = express.Router();

// In-memory TTL cache for read-heavy endpoints
const cache = new Map<string, { data: any; expiry: number }>();

function getCached<T>(key: string, ttlMs: number, fetcher: () => Promise<T>): Promise<T> {
	const entry = cache.get(key);
	if (entry && Date.now() < entry.expiry) return Promise.resolve(entry.data as T);
	return fetcher().then(data => {
		cache.set(key, { data, expiry: Date.now() + ttlMs });
		return data;
	});
}

const FIVE_MINUTES = 5 * 60 * 1000;
const THIRTY_SECONDS = 30 * 1000;

/**
 * GET /api/packs/types
 * Returns all active pack types (cached 5 min)
 */
router.get('/types', async (_req: Request, res: Response) => {
	try {
		const packs = await getCached('pack-types', FIVE_MINUTES, async () => {
			const result = await directDb.query(`
				SELECT * FROM pack_types WHERE is_active = true ORDER BY price ASC
			`);
			return result.rows;
		});

		res.json({ success: true, packs });
	} catch (error: any) {
		console.error('Error fetching pack types:', error);
		res.status(500).json({ success: false, error: error.message });
	}
});

/**
 * GET /api/packs/supply-stats
 * Returns summary stats (cached 30s)
 */
router.get('/supply-stats', async (_req: Request, res: Response) => {
	try {
		const stats = await getCached('supply-stats', THIRTY_SECONDS, async () => {
			const overallStats = await directDb.query(`
				SELECT
					COUNT(*) as total_cards,
					SUM(max_supply) as total_max_supply,
					SUM(remaining_supply) as total_remaining_supply,
					SUM(reward_reserve) as total_reward_reserve,
					SUM(max_supply - reward_reserve) as total_pack_supply,
					SUM(GREATEST(remaining_supply - reward_reserve, 0)) as total_pack_remaining
				FROM card_supply
			`);

			const rarityStats = await directDb.query(`
				SELECT
					nft_rarity,
					COUNT(*) as card_count,
					SUM(max_supply) as max_supply,
					SUM(remaining_supply) as remaining_supply,
					SUM(reward_reserve) as reward_reserve,
					SUM(max_supply - reward_reserve) as pack_supply,
					SUM(GREATEST(remaining_supply - reward_reserve, 0)) as pack_remaining
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

			const typeStats = await directDb.query(`
				SELECT
					card_type,
					COUNT(*) as card_count,
					SUM(max_supply) as max_supply,
					SUM(remaining_supply) as remaining_supply,
					SUM(reward_reserve) as reward_reserve,
					SUM(max_supply - reward_reserve) as pack_supply,
					SUM(GREATEST(remaining_supply - reward_reserve, 0)) as pack_remaining
				FROM card_supply
				GROUP BY card_type
			`);

			return {
				overall: overallStats.rows[0],
				byRarity: rarityStats.rows,
				byType: typeStats.rows,
			};
		});

		res.json({ success: true, ...stats });
	} catch (error: any) {
		console.error('Error fetching supply stats:', error);
		res.status(500).json({ success: false, error: error.message });
	}
});

// Type cycling patterns for slot diversity
const COMMON_TYPES = ['minion', 'spell'];
const RARE_TYPES = ['minion', 'spell'];
const WILDCARD_TYPES = ['hero', 'spell', 'minion'];

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

		const packResult = await client.query(`
			SELECT * FROM pack_types WHERE id = $1 AND is_active = true FOR UPDATE
		`, [packTypeId]);

		if (packResult.rows.length === 0) {
			await client.query('ROLLBACK');
			return res.status(404).json({ success: false, error: 'Pack type not found or inactive' });
		}

		const pack = packResult.rows[0];
		const pulledCards: any[] = [];

		const rarityFallback: Record<string, string[]> = {
			common: ['common', 'rare', 'legendary', 'mythic'],
			rare: ['rare', 'legendary', 'mythic'],
			epic: ['legendary', 'mythic'],
			legendary: ['legendary', 'mythic'],
			mythic: ['mythic', 'legendary'],
		};

		async function pullCard(nftRarity: string, preferredType?: string): Promise<any | null> {
			const fallbackOrder = rarityFallback[nftRarity] || [nftRarity];

			for (const rarity of fallbackOrder) {
				// Try preferred type first
				if (preferredType) {
					const typedResult = await client.query(`
						SELECT * FROM card_supply
						WHERE nft_rarity = $1 AND card_type = $2 AND remaining_supply > reward_reserve
						ORDER BY RANDOM()
						LIMIT 1
						FOR UPDATE
					`, [rarity, preferredType]);

					if (typedResult.rows.length > 0) {
						const card = typedResult.rows[0];
						await client.query(`
							UPDATE card_supply
							SET remaining_supply = remaining_supply - 1
							WHERE id = $1
						`, [card.id]);
						return card;
					}
				}

				// Fallback: any type of this rarity
				const cardResult = await client.query(`
					SELECT * FROM card_supply
					WHERE nft_rarity = $1 AND remaining_supply > reward_reserve
					ORDER BY RANDOM()
					LIMIT 1
					FOR UPDATE
				`, [rarity]);

				if (cardResult.rows.length > 0) {
					const card = cardResult.rows[0];
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

		// Pull common slots — cycle minion/spell for diversity
		for (let i = 0; i < pack.common_slots; i++) {
			const preferredType = COMMON_TYPES[i % COMMON_TYPES.length];
			const card = await pullCard('common', preferredType);
			if (card) pulledCards.push(card);
		}

		// Pull rare slots — cycle minion/spell
		for (let i = 0; i < pack.rare_slots; i++) {
			const preferredType = RARE_TYPES[i % RARE_TYPES.length];
			const card = await pullCard('rare', preferredType);
			if (card) pulledCards.push(card);
		}

		// Pull epic slots — prefer spells
		for (let i = 0; i < pack.epic_slots; i++) {
			const card = await pullCard('epic', 'spell');
			if (card) pulledCards.push(card);
		}

		// Pull wildcard slots — first prefers hero, rest cycle spell/minion
		for (let i = 0; i < pack.wildcard_slots; i++) {
			const rarity = determineWildcardRarity(pack.legendary_chance, pack.mythic_chance);
			const preferredType = WILDCARD_TYPES[i % WILDCARD_TYPES.length];
			const card = await pullCard(rarity, preferredType);
			if (card) pulledCards.push(card);
		}

		// Add cards to user inventory with mint numbers
		for (const card of pulledCards) {
			// Mint number = how many of this card have been pulled (including this one)
			const mintNumber = card.max_supply - card.remaining_supply + 1;

			const existingResult = await client.query(`
				SELECT * FROM user_inventory
				WHERE user_id = $1 AND card_id = $2
				FOR UPDATE
			`, [userId, card.card_id]);

			if (existingResult.rows.length > 0) {
				// Duplicate — keep first copy's mint number, just increment quantity
				await client.query(`
					UPDATE user_inventory
					SET quantity = quantity + 1
					WHERE user_id = $1 AND card_id = $2
				`, [userId, card.card_id]);
			} else {
				// New card — record the mint serial number
				await client.query(`
					INSERT INTO user_inventory (user_id, card_id, quantity, mint_number)
					VALUES ($1, $2, 1, $3)
				`, [userId, card.card_id, mintNumber]);
			}
		}

		const cardIds = pulledCards.map(c => c.card_id);
		await client.query(`
			INSERT INTO pack_history (user_id, pack_type_id, cards_received)
			VALUES ($1, $2, $3)
		`, [userId, packTypeId, JSON.stringify(cardIds)]);

		await client.query('COMMIT');

		// Invalidate supply-stats cache after successful open
		cache.delete('supply-stats');

		return res.json({
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
				mintNumber: c.max_supply - c.remaining_supply + 1,
			})),
			totalPulled: pulledCards.length,
		});

	} catch (error: any) {
		await client.query('ROLLBACK');
		console.error('Error opening pack:', error);
		return res.status(500).json({ success: false, error: error.message });
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

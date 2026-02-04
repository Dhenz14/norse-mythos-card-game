import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { routes } from '../../../lib/routes';
import PackOpeningAnimation from './PackOpeningAnimation';
import { getRarityColor, getRarityBgColor } from '../../utils/rarityUtils';
import type { 
  PackType, 
  PackTypeResponse, 
  SupplyStatsResponse, 
  SupplyStats, 
  RevealedCard, 
  PackOpenResponse,
  OpenedCard,
  RarityStats 
} from './types';

export default function PacksPage() {
  const [packTypes, setPackTypes] = useState<PackType[]>([]);
  const [supplyStats, setSupplyStats] = useState<SupplyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openingPack, setOpeningPack] = useState<PackType | null>(null);
  const [revealedCards, setRevealedCards] = useState<RevealedCard[]>([]);
  const [isOpening, setIsOpening] = useState(false);
  const [packError, setPackError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [typesRes, statsRes] = await Promise.all([
        fetch('/api/packs/types'),
        fetch('/api/packs/supply-stats')
      ]);

      if (typesRes.ok) {
        const typesData: PackTypeResponse = await typesRes.json();
        const mappedPacks = (typesData.packs || []).map((pack: any) => ({
          id: pack.id,
          name: pack.name,
          description: pack.description || '',
          price: pack.price,
          cardCount: pack.card_count,
          rarityOdds: {
            common: pack.common_slots * 10,
            rare: pack.rare_slots * 10,
            epic: pack.epic_slots * 10,
            legendary: pack.legendary_chance,
            mythic: pack.mythic_chance,
          }
        }));
        setPackTypes(mappedPacks);
      } else {
        setError('Failed to load packs. Please try again.');
        setPackTypes([]);
      }

      if (statsRes.ok) {
        const statsData: SupplyStatsResponse = await statsRes.json();
        const overall = statsData.overall || { total_max_supply: 0, total_remaining_supply: 0, unique_cards: 0 };
        const rarityStats = statsData.byRarity || [];
        
        const legendaryStats = rarityStats.find((r: RarityStats) => r.nft_rarity === 'legendary');
        const mythicStats = rarityStats.find((r: RarityStats) => r.nft_rarity === 'mythic');
        
        const totalMaxSupply = parseInt(String(overall.total_max_supply || 0), 10);
        const totalRemainingSupply = parseInt(String(overall.total_remaining_supply || 0), 10);
        const totalPulled = totalMaxSupply - totalRemainingSupply;
        
        const legendaryPulled = legendaryStats 
          ? parseInt(String(legendaryStats.max_supply || 0), 10) - parseInt(String(legendaryStats.remaining_supply || 0), 10)
          : 0;
        const mythicPulled = mythicStats
          ? parseInt(String(mythicStats.max_supply || 0), 10) - parseInt(String(mythicStats.remaining_supply || 0), 10)
          : 0;
        
        const legendaryRate = totalPulled > 0 ? ((legendaryPulled / totalPulled) * 100).toFixed(1) : '0';
        const mythicRate = totalPulled > 0 ? ((mythicPulled / totalPulled) * 100).toFixed(1) : '0';
        
        setSupplyStats({
          totalCardsOpened: totalPulled,
          totalPacksOpened: Math.floor(totalPulled / 5),
          legendaryDropRate: parseFloat(legendaryRate),
          mythicDropRate: parseFloat(mythicRate),
        });
      } else {
        setSupplyStats(null);
      }
    } catch (err) {
      console.error('Error fetching pack data:', err);
      setError('Failed to load packs. Please try again.');
      setPackTypes([]);
      setSupplyStats(null);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPack = async (pack: PackType) => {
    setOpeningPack(pack);
    setIsOpening(true);
    setPackError(null);

    try {
      const res = await fetch('/api/packs/open', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packTypeId: pack.id, userId: 1 })
      });

      if (res.ok) {
        const data: PackOpenResponse = await res.json();
        const mappedCards: RevealedCard[] = (data.cards || []).map((card: OpenedCard) => ({
          id: card.cardId,
          name: card.cardName,
          rarity: card.nftRarity,
          type: card.cardType,
          heroClass: card.heroClass,
          imageUrl: card.imageUrl,
        }));
        if (mappedCards.length > 0) {
          setRevealedCards(mappedCards);
        } else {
          setPackError('No cards received from the server. Please try again.');
          setIsOpening(false);
          setOpeningPack(null);
        }
      } else {
        setPackError('Failed to open pack. Please try again.');
        setIsOpening(false);
        setOpeningPack(null);
      }
    } catch (err) {
      console.error('Error opening pack:', err);
      setPackError('Failed to open pack. Please try again.');
      setIsOpening(false);
      setOpeningPack(null);
    }
  };

  const handleCloseAnimation = () => {
    setOpeningPack(null);
    setRevealedCards([]);
    setIsOpening(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-950 to-gray-900 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-950 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-xl mb-4">{error}</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={fetchData}
            className="px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition-colors"
          >
            Retry
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-950 to-gray-900 p-8">
      {isOpening && openingPack && revealedCards.length > 0 && (
        <PackOpeningAnimation
          packName={openingPack.name}
          cards={revealedCards}
          onClose={handleCloseAnimation}
          onOpenAnother={() => handleOpenPack(openingPack)}
        />
      )}

      {packError && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg"
        >
          {packError}
          <button
            onClick={() => setPackError(null)}
            className="ml-4 text-white/80 hover:text-white"
          >
            ✕
          </button>
        </motion.div>
      )}

      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <Link to={routes.home}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 bg-gray-800/80 hover:bg-gray-700/80 text-white rounded-lg border border-gray-600 flex items-center gap-2 transition-colors"
            >
              <span>←</span>
              <span>Back to Home</span>
            </motion.button>
          </Link>
          
          <Link to={routes.collection}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg border border-indigo-400 transition-colors"
            >
              View Collection →
            </motion.button>
          </Link>
        </div>

        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl font-bold text-center mb-4 text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400"
          style={{ textShadow: '0 0 40px rgba(251, 191, 36, 0.4)' }}
        >
          Card Packs
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-gray-400 text-center mb-12 text-lg"
        >
          Unlock powerful Norse cards and build your collection
        </motion.p>

        {supplyStats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12"
          >
            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700 text-center">
              <div className="text-2xl font-bold text-amber-400">{supplyStats.totalPacksOpened.toLocaleString()}</div>
              <div className="text-gray-400 text-sm">Packs Opened</div>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700 text-center">
              <div className="text-2xl font-bold text-blue-400">{supplyStats.totalCardsOpened.toLocaleString()}</div>
              <div className="text-gray-400 text-sm">Cards Collected</div>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700 text-center">
              <div className="text-2xl font-bold text-yellow-400">{supplyStats.legendaryDropRate}%</div>
              <div className="text-gray-400 text-sm">Legendary Rate</div>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700 text-center">
              <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500">{supplyStats.mythicDropRate}%</div>
              <div className="text-gray-400 text-sm">Mythic Rate</div>
            </div>
          </motion.div>
        )}

        {packTypes.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <p className="text-gray-400 text-xl mb-4">No packs available at the moment.</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={fetchData}
              className="px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition-colors"
            >
              Refresh
            </motion.button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {packTypes.map((pack, index) => (
              <motion.div
                key={pack.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                whileHover={{ scale: 1.03, y: -5 }}
                className="relative bg-gradient-to-b from-gray-800 to-gray-900 rounded-2xl overflow-hidden border border-gray-700 hover:border-amber-500/50 transition-all duration-300"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-amber-900/20 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity" />
                
                <div className="relative p-6">
                  <div className="w-full h-40 bg-gradient-to-br from-purple-900/50 to-amber-900/50 rounded-xl mb-4 flex items-center justify-center border border-gray-600">
                    <motion.div
                      animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.05, 1] }}
                      transition={{ duration: 3, repeat: Infinity }}
                      className="text-6xl"
                    >
                      📦
                    </motion.div>
                  </div>

                  <h3 className="text-xl font-bold text-white mb-2">{pack.name}</h3>
                  <p className="text-gray-400 text-sm mb-4 h-12">{pack.description}</p>

                  <div className="flex justify-between items-center mb-4">
                    <span className="text-amber-400 font-bold text-lg">💰 {pack.price}</span>
                    <span className="text-gray-400 text-sm">📦 {pack.cardCount} cards</span>
                  </div>

                  {pack.rarityOdds && (
                    <div className="space-y-1 mb-4">
                      <div className="text-xs text-gray-500 mb-2">Rarity Odds:</div>
                      <div className="grid grid-cols-5 gap-1 text-xs">
                        {Object.entries(pack.rarityOdds).map(([rarity, odds]) => (
                          <div key={rarity} className={`${getRarityBgColor(rarity)} rounded px-1 py-0.5 text-center`}>
                            <div className={`font-semibold ${getRarityColor(rarity)}`}>{odds}%</div>
                            <div className="text-gray-500 capitalize text-[10px]">{rarity.slice(0, 3)}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleOpenPack(pack)}
                    className="w-full py-3 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-bold rounded-xl transition-all shadow-lg shadow-amber-900/30"
                  >
                    Open Pack
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

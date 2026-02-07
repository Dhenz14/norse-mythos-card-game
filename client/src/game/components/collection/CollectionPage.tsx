import { debug } from '../../config/debugConfig';
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { routes } from '../../../lib/routes';
import { getRarityColor, getRarityBorder, getRarityGlow, getTypeIcon } from '../../utils/rarityUtils';
import type { OwnedCard, InventoryResponse, PaginationData, InventoryCard } from '../packs/types';

type FilterRarity = 'all' | 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
type FilterType = 'all' | 'minion' | 'spell' | 'weapon';
type FilterClass = 'all' | 'neutral' | 'warrior' | 'mage' | 'priest' | 'paladin' | 'hunter' | 'druid' | 'warlock' | 'shaman' | 'rogue';

export default function CollectionPage() {
  const [cards, setCards] = useState<OwnedCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterRarity, setFilterRarity] = useState<FilterRarity>('all');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [filterClass, setFilterClass] = useState<FilterClass>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCard, setSelectedCard] = useState<OwnedCard | null>(null);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCards, setTotalCards] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    fetchInventory(1);
  }, []);

  const fetchInventory = async (pageNum: number) => {
    try {
      if (pageNum === 1) {
        setLoading(true);
      } else {
        setIsLoadingMore(true);
      }
      setError(null);
      
      const res = await fetch(`/api/inventory/1?page=${pageNum}&limit=30`);
      
      if (res.ok) {
        const data: InventoryResponse = await res.json();
        const mappedCards = (data.inventory || []).map((card: InventoryCard) => ({
          id: card.card_id,
          name: card.card_name,
          rarity: card.nft_rarity,
          type: card.card_type,
          heroClass: card.hero_class,
          quantity: card.quantity,
          imageUrl: card.imageUrl,
        }));
        setCards(mappedCards);
        
        if (data.pagination) {
          setPage(data.pagination.page);
          setTotalPages(data.pagination.totalPages);
          setTotalCards(data.pagination.total);
        } else {
          setPage(1);
          setTotalPages(1);
          setTotalCards(mappedCards.reduce((sum: number, card: OwnedCard) => sum + card.quantity, 0));
        }
      } else {
        setError('Failed to load collection.');
        setCards([]);
      }
    } catch (err) {
      debug.error('Error fetching inventory:', err);
      setError('Failed to load collection.');
      setCards([]);
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
    }
  };

  const handlePreviousPage = () => {
    if (page > 1) {
      fetchInventory(page - 1);
    }
  };

  const handleNextPage = () => {
    if (page < totalPages) {
      fetchInventory(page + 1);
    }
  };

  const filteredCards = cards.filter(card => {
    if (filterRarity !== 'all' && card.rarity !== filterRarity) return false;
    if (filterType !== 'all' && card.type !== filterType) return false;
    if (filterClass !== 'all' && card.heroClass !== filterClass) return false;
    if (searchQuery && !card.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const displayTotalCards = totalCards > 0 ? totalCards : cards.reduce((sum, card) => sum + card.quantity, 0);
  const uniqueCards = cards.length;

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-950 to-gray-900 p-8">
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

          <Link to={routes.packs}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white rounded-lg transition-colors"
            >
              Open Packs →
            </motion.button>
          </Link>
        </div>

        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl font-bold text-center mb-4 text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400"
          style={{ textShadow: '0 0 40px rgba(99, 102, 241, 0.4)' }}
        >
          My Collection
        </motion.h1>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex justify-center gap-8 mb-8 text-gray-400"
        >
          <span className="flex items-center gap-2">
            <span className="text-2xl font-bold text-white">{uniqueCards}</span> unique cards
          </span>
          <span className="flex items-center gap-2">
            <span className="text-2xl font-bold text-white">{displayTotalCards}</span> total cards
          </span>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-8 mb-8"
          >
            <p className="text-red-400 text-lg mb-4">{error}</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => fetchInventory(1)}
              className="px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition-colors"
            >
              Retry
            </motion.button>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gray-800/50 rounded-xl p-4 mb-8 border border-gray-700"
        >
          <div className="flex flex-wrap gap-4 items-center">
            <input
              type="text"
              placeholder="Search cards..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 min-w-[200px] px-4 py-2 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
            />

            <select
              value={filterRarity}
              onChange={(e) => setFilterRarity(e.target.value as FilterRarity)}
              className="px-4 py-2 bg-gray-900/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-amber-500"
            >
              <option value="all">All Rarities</option>
              <option value="common">Common</option>
              <option value="rare">Rare</option>
              <option value="epic">Epic</option>
              <option value="legendary">Legendary</option>
              <option value="mythic">Mythic</option>
            </select>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as FilterType)}
              className="px-4 py-2 bg-gray-900/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-amber-500"
            >
              <option value="all">All Types</option>
              <option value="minion">Minions</option>
              <option value="spell">Spells</option>
              <option value="weapon">Weapons</option>
            </select>

            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value as FilterClass)}
              className="px-4 py-2 bg-gray-900/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-amber-500"
            >
              <option value="all">All Classes</option>
              <option value="neutral">Neutral</option>
              <option value="warrior">Warrior</option>
              <option value="mage">Mage</option>
              <option value="priest">Priest</option>
              <option value="paladin">Paladin</option>
              <option value="hunter">Hunter</option>
              <option value="druid">Druid</option>
              <option value="warlock">Warlock</option>
              <option value="shaman">Shaman</option>
              <option value="rogue">Rogue</option>
            </select>
          </div>
        </motion.div>

        {cards.length === 0 && !error ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <p className="text-gray-400 text-xl mb-4">Your collection is empty</p>
            <p className="text-gray-500 mb-8">Open some packs to start building your collection!</p>
            <Link to={routes.packs}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-gradient-to-r from-amber-600 to-amber-500 text-white font-bold rounded-xl"
              >
                Open Packs to Get Cards
              </motion.button>
            </Link>
          </motion.div>
        ) : filteredCards.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <p className="text-gray-400 text-xl mb-4">No cards match your filters</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setFilterRarity('all');
                setFilterType('all');
                setFilterClass('all');
                setSearchQuery('');
              }}
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Clear Filters
            </motion.button>
          </motion.div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {filteredCards.map((card, index) => (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.03 }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  onClick={() => setSelectedCard(card)}
                  className={`relative cursor-pointer bg-gradient-to-b from-gray-800 to-gray-900 rounded-xl border-2 ${getRarityBorder(card.rarity)} ${getRarityGlow(card.rarity)} overflow-hidden transition-all`}
                >
                  <div className="p-3">
                    {card.manaCost !== undefined && (
                      <div className="absolute top-2 left-2 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm border-2 border-blue-400">
                        {card.manaCost}
                      </div>
                    )}

                    {card.quantity > 1 && (
                      <div className="absolute top-2 right-2 w-6 h-6 bg-amber-600 rounded-full flex items-center justify-center text-white font-bold text-xs border border-amber-400">
                        x{card.quantity}
                      </div>
                    )}

                    <div className="w-full aspect-square bg-black/30 rounded-lg mb-2 mt-6 flex items-center justify-center border border-white/10">
                      <span className="text-4xl">{getTypeIcon(card.type)}</span>
                    </div>

                    <h3 className="text-sm font-bold text-white text-center truncate mb-1">{card.name}</h3>
                    
                    <div className="flex justify-center items-center gap-1">
                      <span className={`text-xs font-semibold uppercase ${getRarityColor(card.rarity)}`}>
                        {card.rarity}
                      </span>
                    </div>

                    {card.type === 'minion' && card.attack !== undefined && card.health !== undefined && (
                      <div className="flex justify-between mt-2 text-sm">
                        <span className="text-amber-400 font-bold">⚔️ {card.attack}</span>
                        <span className="text-red-400 font-bold">❤️ {card.health}</span>
                      </div>
                    )}
                  </div>

                  {(card.rarity === 'legendary' || card.rarity === 'mythic') && (
                    <motion.div
                      animate={{ opacity: [0.2, 0.4, 0.2] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute inset-0 bg-gradient-to-t from-transparent via-white/5 to-transparent pointer-events-none"
                    />
                  )}
                </motion.div>
              ))}
            </div>

            {totalPages > 1 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-center items-center gap-4 mt-8"
              >
                <motion.button
                  whileHover={{ scale: page === 1 ? 1 : 1.05 }}
                  whileTap={{ scale: page === 1 ? 1 : 0.95 }}
                  onClick={handlePreviousPage}
                  disabled={page === 1 || isLoadingMore}
                  className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                    page === 1
                      ? 'bg-gray-700/50 text-gray-500 cursor-not-allowed'
                      : 'bg-gray-700 hover:bg-gray-600 text-white'
                  }`}
                >
                  ← Previous
                </motion.button>

                <div className="flex items-center gap-2 text-gray-300">
                  {isLoadingMore ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full"
                    />
                  ) : (
                    <span className="text-lg font-semibold">
                      Page <span className="text-amber-400">{page}</span> of <span className="text-amber-400">{totalPages}</span>
                    </span>
                  )}
                </div>

                <motion.button
                  whileHover={{ scale: page === totalPages ? 1 : 1.05 }}
                  whileTap={{ scale: page === totalPages ? 1 : 0.95 }}
                  onClick={handleNextPage}
                  disabled={page === totalPages || isLoadingMore}
                  className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                    page === totalPages
                      ? 'bg-gray-700/50 text-gray-500 cursor-not-allowed'
                      : 'bg-gray-700 hover:bg-gray-600 text-white'
                  }`}
                >
                  Next →
                </motion.button>
              </motion.div>
            )}
          </>
        )}
      </div>

      <AnimatePresence>
        {selectedCard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedCard(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className={`w-80 bg-gradient-to-b from-gray-800 to-gray-900 rounded-2xl border-2 ${getRarityBorder(selectedCard.rarity)} ${getRarityGlow(selectedCard.rarity)} p-6`}
            >
              {selectedCard.manaCost !== undefined && (
                <div className="absolute -top-4 -left-4 w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl border-4 border-blue-400">
                  {selectedCard.manaCost}
                </div>
              )}

              <div className="text-center mb-4">
                <span className={`text-sm font-bold uppercase ${getRarityColor(selectedCard.rarity)}`}>
                  {selectedCard.rarity} {selectedCard.type}
                </span>
              </div>

              <div className="w-full aspect-square bg-black/30 rounded-xl mb-4 flex items-center justify-center border border-white/20">
                <span className="text-8xl">{getTypeIcon(selectedCard.type)}</span>
              </div>

              <h2 className="text-2xl font-bold text-white text-center mb-2">{selectedCard.name}</h2>
              <p className="text-gray-400 text-sm text-center capitalize mb-4">{selectedCard.heroClass}</p>

              {selectedCard.description && (
                <p className="text-gray-300 text-sm text-center mb-4 italic">"{selectedCard.description}"</p>
              )}

              {selectedCard.type === 'minion' && (
                <div className="flex justify-center gap-8 mb-4">
                  <div className="text-center">
                    <span className="text-3xl font-bold text-amber-400">⚔️ {selectedCard.attack}</span>
                    <p className="text-xs text-gray-500">Attack</p>
                  </div>
                  <div className="text-center">
                    <span className="text-3xl font-bold text-red-400">❤️ {selectedCard.health}</span>
                    <p className="text-xs text-gray-500">Health</p>
                  </div>
                </div>
              )}

              <div className="text-center text-gray-400">
                Owned: <span className="text-white font-bold">{selectedCard.quantity}</span>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedCard(null)}
                className="w-full mt-4 py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-xl transition-all"
              >
                Close
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

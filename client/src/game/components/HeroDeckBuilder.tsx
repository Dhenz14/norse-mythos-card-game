import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CardData } from '../types';
import { cardRegistry } from '../data/cardRegistry';
import { useHeroDeckStore, HeroDeck, PieceType } from '../stores/heroDeckStore';
import { useAudio } from '../../lib/stores/useAudio';
import { HeroPortrait } from './ui/HeroPortrait';

const MAX_LEGENDARY_COPIES = 1;

interface HeroDeckBuilderProps {
  pieceType: PieceType;
  heroId: string;
  heroClass: string;
  heroName: string;
  heroPortrait?: string;
  onClose: () => void;
  onSave?: () => void;
}

type SortOption = 'cost' | 'name' | 'type';
type FilterType = 'all' | 'minion' | 'spell' | 'weapon';

const RARITY_COLORS: Record<string, string> = {
  free: 'text-gray-300 border-gray-400',
  common: 'text-gray-100 border-gray-300',
  rare: 'text-blue-400 border-blue-500',
  epic: 'text-purple-400 border-purple-500',
  legendary: 'text-orange-400 border-orange-500',
};

const RARITY_BG: Record<string, string> = {
  free: 'bg-gray-700',
  common: 'bg-gray-700',
  rare: 'bg-blue-900/50',
  epic: 'bg-purple-900/50',
  legendary: 'bg-orange-900/50',
};

const DECK_SIZE = 30;
const MAX_COPIES = 2;

export const HeroDeckBuilder: React.FC<HeroDeckBuilderProps> = ({
  pieceType,
  heroId,
  heroClass,
  heroName,
  heroPortrait,
  onClose,
  onSave,
}) => {
  const { playSoundEffect } = useAudio();
  const { getDeck, setDeck, validateDeck } = useHeroDeckStore();
  
  const [saveError, setSaveError] = useState<string | null>(null);
  
  const existingDeck = getDeck(pieceType);
  const [deckCardIds, setDeckCardIds] = useState<number[]>(
    existingDeck?.cardIds || []
  );
  
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('cost');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [selectedCard, setSelectedCard] = useState<CardData | null>(null);
  const [minCost, setMinCost] = useState<number | null>(null);
  const [maxCost, setMaxCost] = useState<number | null>(null);

  const normalizedHeroClass = heroClass.toLowerCase();

  const validCards = useMemo(() => {
    return cardRegistry.filter(card => {
      if (card.collectible === false || card.type === 'hero') return false;
      const cardClass = (card.class || card.heroClass || 'neutral').toLowerCase();
      return cardClass === 'neutral' || cardClass === normalizedHeroClass;
    });
  }, [normalizedHeroClass]);

  const filteredAndSortedCards = useMemo(() => {
    let filtered = validCards;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(card => 
        card.name.toLowerCase().includes(term) ||
        (card.description || '').toLowerCase().includes(term)
      );
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(card => card.type === filterType);
    }

    if (minCost !== null) {
      filtered = filtered.filter(card => (card.manaCost ?? 0) >= minCost);
    }
    if (maxCost !== null) {
      filtered = filtered.filter(card => (card.manaCost ?? 0) <= maxCost);
    }

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'cost':
          return (a.manaCost ?? 0) - (b.manaCost ?? 0);
        case 'name':
          return a.name.localeCompare(b.name);
        case 'type':
          return a.type.localeCompare(b.type);
        default:
          return 0;
      }
    });
  }, [validCards, searchTerm, filterType, sortBy, minCost, maxCost]);

  const deckCardCounts = useMemo(() => {
    const counts: Record<number, number> = {};
    for (const id of deckCardIds) {
      counts[id] = (counts[id] || 0) + 1;
    }
    return counts;
  }, [deckCardIds]);

  const deckCards = useMemo(() => {
    const uniqueIds = [...new Set(deckCardIds)];
    return uniqueIds
      .map(id => cardRegistry.find(c => Number(c.id) === id))
      .filter((c): c is CardData => c !== undefined)
      .sort((a, b) => (a.manaCost ?? 0) - (b.manaCost ?? 0));
  }, [deckCardIds]);

  const canAddCard = useCallback((cardId: number): boolean => {
    if (deckCardIds.length >= DECK_SIZE) return false;
    const currentCount = deckCardCounts[cardId] || 0;
    const card = cardRegistry.find(c => Number(c.id) === cardId);
    const isLegendary = (card?.rarity || '').toLowerCase() === 'legendary';
    const maxCopies = isLegendary ? MAX_LEGENDARY_COPIES : MAX_COPIES;
    return currentCount < maxCopies;
  }, [deckCardIds.length, deckCardCounts]);

  const handleAddCard = useCallback((card: CardData) => {
    const cardId = Number(card.id);
    if (!canAddCard(cardId)) return;
    
    setDeckCardIds(prev => [...prev, cardId]);
    playSoundEffect('card_play');
  }, [canAddCard, playSoundEffect]);

  const handleRemoveCard = useCallback((card: CardData) => {
    const cardId = Number(card.id);
    const index = deckCardIds.indexOf(cardId);
    if (index === -1) return;
    
    setDeckCardIds(prev => {
      const newIds = [...prev];
      newIds.splice(index, 1);
      return newIds;
    });
    playSoundEffect('button_click');
  }, [deckCardIds, playSoundEffect]);

  const handleAutoFill = useCallback(() => {
    const remaining = DECK_SIZE - deckCardIds.length;
    if (remaining <= 0) return;

    const currentCounts = { ...deckCardCounts };
    const newCards: number[] = [];
    
    const shuffled = [...validCards].sort(() => Math.random() - 0.5);
    
    for (const card of shuffled) {
      if (newCards.length >= remaining) break;
      
      const cardId = Number(card.id);
      const currentCount = currentCounts[cardId] || 0;
      
      const isLegendary = (card.rarity || '').toLowerCase() === 'legendary';
      const maxAllowed = isLegendary ? MAX_LEGENDARY_COPIES : MAX_COPIES;
      if (currentCount < maxAllowed) {
        const toAdd = Math.min(maxAllowed - currentCount, remaining - newCards.length);
        for (let i = 0; i < toAdd; i++) {
          newCards.push(cardId);
          currentCounts[cardId] = (currentCounts[cardId] || 0) + 1;
        }
      }
    }

    setDeckCardIds(prev => [...prev, ...newCards]);
    playSoundEffect('card_draw');
  }, [deckCardIds, deckCardCounts, validCards, playSoundEffect]);

  const handleClearDeck = useCallback(() => {
    setDeckCardIds([]);
    playSoundEffect('button_click');
  }, [playSoundEffect]);

  const handleSave = useCallback(() => {
    setSaveError(null);
    
    const deck: HeroDeck = {
      pieceType,
      heroId,
      heroClass: normalizedHeroClass,
      cardIds: deckCardIds,
    };
    
    setDeck(pieceType, deck);
    
    const validation = validateDeck(pieceType);
    if (!validation.valid) {
      setSaveError(validation.errors.join('\n'));
      playSoundEffect('error' as any);
      return;
    }
    
    playSoundEffect('button_click');
    onSave?.();
    onClose();
  }, [pieceType, heroId, normalizedHeroClass, deckCardIds, setDeck, validateDeck, playSoundEffect, onSave, onClose]);

  const isDeckComplete = deckCardIds.length === DECK_SIZE;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-[95vw] max-w-7xl h-[90vh] bg-gradient-to-b from-gray-900 to-gray-800 rounded-xl border border-gray-700 shadow-2xl flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex-shrink-0 border-b border-gray-700 flex items-stretch">
          {heroPortrait ? (
            <div className="w-32 h-28 flex-shrink-0 relative overflow-hidden">
              <img 
                src={heroPortrait} 
                alt={heroName}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-gray-900/80" />
            </div>
          ) : (
            <div className="w-28 h-28 flex-shrink-0 bg-gradient-to-br from-yellow-900/50 to-gray-800 flex items-center justify-center">
              <span className="text-5xl font-bold text-yellow-400">{heroName.charAt(0)}</span>
            </div>
          )}
          <div className="flex-1 p-4 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-yellow-400">
                Build Deck: {heroName}
              </h2>
              <p className="text-sm text-gray-400 capitalize">
                {pieceType} • {heroClass} Class
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className={`text-xl font-bold ${isDeckComplete ? 'text-green-400' : 'text-yellow-400'}`}>
                {deckCardIds.length}/{DECK_SIZE} Cards
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white text-3xl leading-none"
              >
                ×
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 flex min-h-0">
          <div className="flex-1 flex flex-col border-r border-gray-700 min-w-0">
            <div className="flex-shrink-0 p-3 border-b border-gray-700 space-y-3">
              <div className="flex gap-3 flex-wrap">
                <input
                  type="text"
                  placeholder="Search cards..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="flex-1 min-w-48 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500"
                />
                <select
                  value={filterType}
                  onChange={e => setFilterType(e.target.value as FilterType)}
                  className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-yellow-500"
                >
                  <option value="all">All Types</option>
                  <option value="minion">Minions</option>
                  <option value="spell">Spells</option>
                  <option value="weapon">Weapons</option>
                </select>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as SortOption)}
                  className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-yellow-500"
                >
                  <option value="cost">Sort by Cost</option>
                  <option value="name">Sort by Name</option>
                  <option value="type">Sort by Type</option>
                </select>
              </div>
              <div className="flex gap-2 items-center">
                <span className="text-sm text-gray-400">Mana:</span>
                {[0, 1, 2, 3, 4, 5, 6, 7].map(cost => (
                  <button
                    key={cost}
                    onClick={() => {
                      if (minCost === cost && maxCost === cost) {
                        setMinCost(null);
                        setMaxCost(null);
                      } else {
                        setMinCost(cost === 7 ? 7 : cost);
                        setMaxCost(cost === 7 ? 99 : cost);
                      }
                    }}
                    className={`w-8 h-8 rounded-full text-sm font-bold transition-all ${
                      (minCost === cost || (cost === 7 && minCost === 7))
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {cost === 7 ? '7+' : cost}
                  </button>
                ))}
                {(minCost !== null || maxCost !== null) && (
                  <button
                    onClick={() => { setMinCost(null); setMaxCost(null); }}
                    className="text-xs text-gray-400 hover:text-white ml-2"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                {filteredAndSortedCards.map(card => {
                  const cardId = Number(card.id);
                  const inDeckCount = deckCardCounts[cardId] || 0;
                  const canAdd = canAddCard(cardId);
                  const rarityColor = RARITY_COLORS[card.rarity || 'common'] || RARITY_COLORS.common;
                  const rarityBg = RARITY_BG[card.rarity || 'common'] || RARITY_BG.common;
                  const isMinion = card.type === 'minion';
                  const cardClass = (card.class || card.heroClass || 'neutral').toLowerCase();
                  const isClassCard = cardClass !== 'neutral';

                  return (
                    <motion.div
                      key={card.id}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => canAdd && handleAddCard(card)}
                      onContextMenu={e => {
                        e.preventDefault();
                        setSelectedCard(card);
                      }}
                      className={`
                        relative rounded-lg overflow-hidden cursor-pointer transition-all border-2
                        ${rarityBg} ${canAdd ? 'opacity-100' : 'opacity-50'}
                        ${rarityColor}
                      `}
                      style={{ minHeight: '140px' }}
                    >
                      <div className="absolute top-1 left-1 w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm border border-blue-400 z-10">
                        {card.manaCost ?? 0}
                      </div>

                      {inDeckCount > 0 && (
                        <div className="absolute top-1 right-1 w-6 h-6 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-xs border border-green-400 z-10">
                          {inDeckCount}
                        </div>
                      )}

                      <div className="pt-9 px-2 pb-1">
                        <p className="text-white font-semibold text-xs leading-tight truncate text-center" title={card.name}>
                          {card.name}
                        </p>
                        <div className="flex items-center justify-center gap-1 mt-0.5">
                          <span className="text-xs text-gray-400 capitalize">{card.type}</span>
                          {isClassCard && (
                            <span className="text-xs text-yellow-500">★</span>
                          )}
                        </div>
                        {card.description && (
                          <p className="text-gray-400 text-xs mt-1 text-center leading-tight break-words">
                            {card.description}
                          </p>
                        )}
                      </div>

                      {isMinion && (
                        <div className="absolute bottom-1 left-0 right-0 flex justify-between px-2">
                          <div className="w-6 h-6 rounded-full bg-yellow-600 flex items-center justify-center text-white font-bold text-xs border border-yellow-400">
                            {(card as any).attack ?? 0}
                          </div>
                          <div className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center text-white font-bold text-xs border border-red-400">
                            {(card as any).health ?? 0}
                          </div>
                        </div>
                      )}

                      {!canAdd && inDeckCount >= MAX_COPIES && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <span className="text-xs text-gray-300 font-bold">MAX</span>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
              
              {filteredAndSortedCards.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  No cards found matching your filters
                </div>
              )}
            </div>
          </div>

          <div className="w-72 flex flex-col bg-gray-800/50">
            <div className="flex-shrink-0 p-3 border-b border-gray-700">
              <h3 className="font-bold text-white mb-2">Your Deck</h3>
              <div className="flex gap-2">
                <button
                  onClick={handleAutoFill}
                  disabled={isDeckComplete}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                    isDeckComplete
                      ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-500 text-white'
                  }`}
                >
                  Auto-fill
                </button>
                <button
                  onClick={handleClearDeck}
                  disabled={deckCardIds.length === 0}
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                    deckCardIds.length === 0
                      ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                      : 'bg-red-600 hover:bg-red-500 text-white'
                  }`}
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              {deckCards.length === 0 ? (
                <div className="text-center text-gray-500 py-8 text-sm">
                  Click cards to add them to your deck
                </div>
              ) : (
                <div className="space-y-1">
                  {deckCards.map(card => {
                    const count = deckCardCounts[Number(card.id)] || 0;
                    const rarityColor = RARITY_COLORS[card.rarity || 'common'] || RARITY_COLORS.common;
                    
                    return (
                      <motion.div
                        key={card.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        onClick={() => handleRemoveCard(card)}
                        className={`
                          flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all
                          bg-gray-700 hover:bg-gray-600 border-l-4 ${rarityColor.split(' ')[1]}
                        `}
                      >
                        <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
                          {card.manaCost ?? 0}
                        </div>
                        <span className="flex-1 text-sm text-white truncate">{card.name}</span>
                        {count > 1 && (
                          <span className="w-6 h-6 rounded-full bg-yellow-600 flex items-center justify-center text-white font-bold text-xs">
                            {count}
                          </span>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex-shrink-0 p-3 border-t border-gray-700">
              {saveError && (
                <div className="mb-2 p-2 bg-red-900/50 border border-red-500 rounded-lg text-red-300 text-xs whitespace-pre-wrap">
                  {saveError}
                </div>
              )}
              <button
                onClick={handleSave}
                className={`w-full py-3 rounded-lg font-bold transition-all ${
                  isDeckComplete
                    ? 'bg-green-600 hover:bg-green-500 text-white'
                    : 'bg-yellow-600 hover:bg-yellow-500 text-white'
                }`}
              >
                {isDeckComplete ? 'Save Complete Deck' : `Save Deck (${deckCardIds.length}/30)`}
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {selectedCard && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[60] w-80 p-4 bg-gray-900 rounded-xl border border-gray-600 shadow-2xl"
            onClick={() => setSelectedCard(null)}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold border border-blue-400">
                {selectedCard.manaCost ?? 0}
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-white text-lg">{selectedCard.name}</h4>
                <p className="text-sm text-gray-400 capitalize">{selectedCard.type} • {selectedCard.rarity || 'common'}</p>
              </div>
            </div>
            {selectedCard.type === 'minion' && (
              <div className="flex gap-4 mt-3">
                <div className="flex items-center gap-1">
                  <span className="text-yellow-400 font-bold">{(selectedCard as any).attack ?? 0}</span>
                  <span className="text-gray-400 text-sm">Attack</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-red-400 font-bold">{(selectedCard as any).health ?? 0}</span>
                  <span className="text-gray-400 text-sm">Health</span>
                </div>
              </div>
            )}
            {selectedCard.description && (
              <p className="mt-3 text-gray-300 text-sm">{selectedCard.description}</p>
            )}
            <p className="mt-2 text-xs text-gray-500 text-center">Click to close</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default HeroDeckBuilder;

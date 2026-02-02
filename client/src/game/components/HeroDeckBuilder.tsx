/**
 * HeroDeckBuilder.tsx
 * Main deck builder component - presentation layer only.
 * All state and logic lives in useDeckBuilder hook.
 * 
 * Following Feature-First architecture:
 * - Hook: ./deckbuilder/useDeckBuilder.ts
 * - Utils: ./deckbuilder/utils.ts
 * - Tokens: ./deckbuilder/tokens.css
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PieceType } from '../stores/heroDeckStore';
import { useDeckBuilder, DECK_SIZE, isClassCard, getMaxCopies } from './deckbuilder';
import { ArtGallery } from './art';
import './deckbuilder/tokens.css';

type ViewTab = 'cards' | 'art';

interface HeroDeckBuilderProps {
  pieceType: PieceType;
  heroId: string;
  heroClass: string;
  heroName: string;
  heroPortrait?: string;
  onClose: () => void;
  onSave?: () => void;
}

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

export const HeroDeckBuilder: React.FC<HeroDeckBuilderProps> = ({
  pieceType,
  heroId,
  heroClass,
  heroName,
  heroPortrait,
  onClose,
  onSave,
}) => {
  const db = useDeckBuilder({ pieceType, heroId, heroClass, onClose, onSave });
  const [viewTab, setViewTab] = useState<ViewTab>('cards');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="deck-builder fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-[95vw] max-w-7xl h-[90vh] bg-gradient-to-b from-gray-900 to-gray-800 rounded-xl border border-gray-700 shadow-2xl flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex-shrink-0 border-b border-gray-700 flex items-stretch">
          {heroPortrait ? (
            <div className="w-32 h-28 flex-shrink-0 relative overflow-hidden">
              <img src={heroPortrait} alt={heroName} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-gray-900/80" />
            </div>
          ) : (
            <div className="w-28 h-28 flex-shrink-0 bg-gradient-to-br from-yellow-900/50 to-gray-800 flex items-center justify-center">
              <span className="text-5xl font-bold text-yellow-400">{heroName.charAt(0)}</span>
            </div>
          )}
          <div className="flex-1 p-4 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-yellow-400">Build Deck: {heroName}</h2>
              <p className="text-sm text-gray-400 capitalize">{pieceType} • {heroClass} Class</p>
            </div>
            <div className="flex items-center gap-4">
              <div className={`text-xl font-bold ${db.isDeckComplete ? 'text-green-400' : 'text-yellow-400'}`}>
                {db.deckCardIds.length}/{DECK_SIZE} Cards
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-white text-3xl leading-none">×</button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex min-h-0">
          {/* Card Collection / Art Gallery */}
          <div className="flex-1 flex flex-col border-r border-gray-700 min-w-0">
            {/* Tab Toggle */}
            <div className="flex-shrink-0 px-3 pt-3 flex gap-2">
              <button
                onClick={() => setViewTab('cards')}
                className={`px-4 py-2 rounded-t-lg text-sm font-semibold transition-all ${
                  viewTab === 'cards'
                    ? 'bg-gray-700 text-yellow-400 border-b-2 border-yellow-400'
                    : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                Cards
              </button>
              <button
                onClick={() => setViewTab('art')}
                className={`px-4 py-2 rounded-t-lg text-sm font-semibold transition-all ${
                  viewTab === 'art'
                    ? 'bg-gray-700 text-yellow-400 border-b-2 border-yellow-400'
                    : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                Artwork (406)
              </button>
            </div>

            {/* Art Gallery View */}
            {viewTab === 'art' ? (
              <ArtGallery compact />
            ) : (
            <>
            {/* Filters */}
            <div className="flex-shrink-0 p-3 border-b border-gray-700 space-y-3">
              <div className="flex gap-3 flex-wrap">
                <input
                  type="text"
                  placeholder="Search cards..."
                  value={db.searchTerm}
                  onChange={e => db.setSearchTerm(e.target.value)}
                  className="flex-1 min-w-48 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500"
                />
                <select
                  value={db.filterType}
                  onChange={e => db.setFilterType(e.target.value as any)}
                  className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-yellow-500"
                >
                  <option value="all">All Types</option>
                  <option value="minion">Minions</option>
                  <option value="spell">Spells</option>
                  <option value="weapon">Weapons</option>
                </select>
                <select
                  value={db.sortBy}
                  onChange={e => db.setSortBy(e.target.value as any)}
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
                    onClick={() => db.handleManaFilter(cost)}
                    className={`w-8 h-8 rounded-full text-sm font-bold transition-all ${
                      (db.minCost === cost || (cost === 7 && db.minCost === 7))
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {cost === 7 ? '7+' : cost}
                  </button>
                ))}
                {db.minCost !== null && (
                  <button onClick={db.handleClearManaFilter} className="text-xs text-gray-400 hover:text-white ml-2">
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Card Grid */}
            <div className="flex-1 overflow-y-auto p-3">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                {db.filteredAndSortedCards.map(card => {
                  const cardId = Number(card.id);
                  const inDeckCount = db.deckCardCounts[cardId] || 0;
                  const canAdd = db.canAddCard(cardId);
                  const rarityKey = (card.rarity || 'common').toLowerCase();
                  const rarityColor = RARITY_COLORS[rarityKey] || RARITY_COLORS.common;
                  const rarityBg = RARITY_BG[rarityKey] || RARITY_BG.common;
                  const isMinion = card.type === 'minion';
                  const maxCopies = getMaxCopies(card);

                  return (
                    <motion.div
                      key={card.id}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => canAdd && db.handleAddCard(card)}
                      onContextMenu={e => { e.preventDefault(); db.setSelectedCard(card); }}
                      className={`relative rounded-lg overflow-hidden cursor-pointer transition-all border-2 ${rarityBg} ${canAdd ? 'opacity-100' : 'opacity-50'} ${rarityColor}`}
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
                          {isClassCard(card) && <span className="text-xs text-yellow-500">★</span>}
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
                      {!canAdd && inDeckCount >= maxCopies && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <span className="text-xs text-gray-300 font-bold">MAX</span>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
              {db.filteredAndSortedCards.length === 0 && (
                <div className="text-center text-gray-500 py-8">No cards found matching your filters</div>
              )}
            </div>
            </>
            )}
          </div>

          {/* Deck Sidebar */}
          <div className="w-72 flex flex-col bg-gray-800/50">
            <div className="flex-shrink-0 p-3 border-b border-gray-700">
              <h3 className="font-bold text-white mb-2">Your Deck</h3>
              <div className="flex gap-2">
                <button
                  onClick={db.handleAutoFill}
                  disabled={db.isDeckComplete}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                    db.isDeckComplete ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 text-white'
                  }`}
                >
                  Auto-fill
                </button>
                <button
                  onClick={db.handleClearDeck}
                  disabled={db.deckCardIds.length === 0}
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                    db.deckCardIds.length === 0 ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-red-600 hover:bg-red-500 text-white'
                  }`}
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              {db.deckCardsWithCounts.length === 0 ? (
                <div className="text-center text-gray-500 py-8 text-sm">Click cards to add them to your deck</div>
              ) : (
                <div className="space-y-1">
                  {db.deckCardsWithCounts.map(({ card, count }) => {
                    const rarityColor = RARITY_COLORS[(card.rarity || 'common').toLowerCase()] || RARITY_COLORS.common;
                    return (
                      <motion.div
                        key={card.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        onClick={() => db.handleRemoveCard(card)}
                        className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all bg-gray-700 hover:bg-gray-600 border-l-4 ${rarityColor.split(' ')[1]}`}
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
              {db.saveError && (
                <div className="mb-2 p-2 bg-red-900/50 border border-red-500 rounded-lg text-red-300 text-xs whitespace-pre-wrap">
                  {db.saveError}
                </div>
              )}
              <button
                onClick={db.handleSave}
                className={`w-full py-3 rounded-lg font-bold transition-all ${
                  db.isDeckComplete ? 'bg-green-600 hover:bg-green-500 text-white' : 'bg-yellow-600 hover:bg-yellow-500 text-white'
                }`}
              >
                {db.isDeckComplete ? 'Save Complete Deck' : `Save Deck (${db.deckCardIds.length}/30)`}
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Card Detail Modal */}
      <AnimatePresence>
        {db.selectedCard && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[60] w-80 p-4 bg-gray-900 rounded-xl border border-gray-600 shadow-2xl"
            onClick={() => db.setSelectedCard(null)}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold border border-blue-400">
                {db.selectedCard.manaCost ?? 0}
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-white text-lg">{db.selectedCard.name}</h4>
                <p className="text-sm text-gray-400 capitalize">{db.selectedCard.type} • {db.selectedCard.rarity || 'common'}</p>
              </div>
            </div>
            {db.selectedCard.type === 'minion' && (
              <div className="flex gap-4 mt-3">
                <div className="flex items-center gap-1">
                  <span className="text-yellow-400 font-bold">{(db.selectedCard as any).attack ?? 0}</span>
                  <span className="text-gray-400 text-sm">Attack</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-red-400 font-bold">{(db.selectedCard as any).health ?? 0}</span>
                  <span className="text-gray-400 text-sm">Health</span>
                </div>
              </div>
            )}
            {db.selectedCard.description && (
              <p className="mt-3 text-gray-300 text-sm">{db.selectedCard.description}</p>
            )}
            <p className="mt-2 text-xs text-gray-500 text-center">Click to close</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default HeroDeckBuilder;

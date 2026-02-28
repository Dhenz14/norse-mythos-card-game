import { debug } from '../../config/debugConfig';
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { routes } from '../../../lib/routes';
import { getRarityColor, getRarityBackground, getTypeIcon } from '../../utils/rarityUtils';
import type { OwnedCard, InventoryResponse, InventoryCard } from '../packs/types';
import { useHiveDataStore } from '../../../data/HiveDataLayer';
import { getMasteryTier } from '../../../data/blockchain/cardXPSystem';
import { useCraftingStore } from '../../crafting/craftingStore';
import { getDustValue, getCraftCost } from '../../crafting/craftingConstants';
import './collection.css';

type FilterRarity = 'all' | 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
type FilterType = 'all' | 'hero' | 'minion' | 'spell' | 'weapon';
type SortBy = 'recent' | 'name' | 'rarity' | 'mint';

interface CollectionStats {
	uniqueCards: number;
	totalCards: number;
	completionPercentage: number;
	totalInGame: number;
	byRarity: { rarity: string; uniqueCards: number; totalCards: number }[];
	byType: { type: string; uniqueCards: number; totalCards: number }[];
}

const RARITY_ORDER: Record<string, number> = { mythic: 0, legendary: 1, epic: 2, rare: 3, common: 4 };

const RARITY_PILLS: { value: FilterRarity; label: string; color: string; activeColor: string }[] = [
	{ value: 'all', label: 'All', color: 'rgba(255,255,255,0.06)', activeColor: 'rgba(139,92,246,0.5)' },
	{ value: 'mythic', label: 'Mythic', color: 'rgba(236,72,153,0.15)', activeColor: 'rgba(236,72,153,0.6)' },
	{ value: 'legendary', label: 'Legendary', color: 'rgba(251,191,36,0.15)', activeColor: 'rgba(251,191,36,0.5)' },
	{ value: 'epic', label: 'Epic', color: 'rgba(147,51,234,0.15)', activeColor: 'rgba(147,51,234,0.5)' },
	{ value: 'rare', label: 'Rare', color: 'rgba(59,130,246,0.15)', activeColor: 'rgba(59,130,246,0.5)' },
	{ value: 'common', label: 'Common', color: 'rgba(107,114,128,0.15)', activeColor: 'rgba(107,114,128,0.5)' },
];

const TYPE_PILLS: { value: FilterType; label: string; icon: string }[] = [
	{ value: 'all', label: 'All', icon: '' },
	{ value: 'hero', label: 'Heroes', icon: '👑' },
	{ value: 'minion', label: 'Minions', icon: '⚔️' },
	{ value: 'spell', label: 'Spells', icon: '✨' },
	{ value: 'weapon', label: 'Weapons', icon: '🗡️' },
];

function getClassGradient(heroClass: string): string {
	switch (heroClass) {
		case 'warrior': return 'linear-gradient(135deg, #92400e 0%, #78350f 100%)';
		case 'mage': return 'linear-gradient(135deg, #1e3a5f 0%, #172554 100%)';
		case 'priest': return 'linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%)';
		case 'paladin': return 'linear-gradient(135deg, #a16207 0%, #854d0e 100%)';
		case 'hunter': return 'linear-gradient(135deg, #166534 0%, #14532d 100%)';
		case 'druid': return 'linear-gradient(135deg, #713f12 0%, #422006 100%)';
		case 'warlock': return 'linear-gradient(135deg, #581c87 0%, #3b0764 100%)';
		case 'shaman': return 'linear-gradient(135deg, #1e3a5f 0%, #0c4a6e 100%)';
		case 'rogue': return 'linear-gradient(135deg, #1c1917 0%, #292524 100%)';
		case 'death_knight': case 'deathknight': return 'linear-gradient(135deg, #164e63 0%, #0e7490 100%)';
		case 'demon_hunter': case 'demonhunter': return 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)';
		default: return 'linear-gradient(135deg, #374151 0%, #1f2937 100%)';
	}
}

function getFrameClass(rarity: string): string {
	if (rarity === 'mythic') return 'card-frame card-frame-mythic mythic-card-frame';
	return `card-frame card-frame-${rarity}`;
}

function getShimmerClass(rarity: string): string {
	switch (rarity) {
		case 'rare': return 'foil-shimmer foil-shimmer-rare';
		case 'epic': return 'foil-shimmer foil-shimmer-epic';
		case 'legendary': return 'foil-shimmer foil-shimmer-legendary';
		case 'mythic': return 'foil-shimmer foil-shimmer-mythic';
		default: return '';
	}
}

export default function CollectionPage() {
	const hiveCards = useHiveDataStore((s) => s.cardCollection);
	const dust = useCraftingStore(s => s.dust);
	const addDust = useCraftingStore(s => s.addDust);
	const spendDust = useCraftingStore(s => s.spendDust);
	const [craftConfirm, setCraftConfirm] = useState<'craft' | 'disenchant' | null>(null);

	const [cards, setCards] = useState<OwnedCard[]>([]);
	const [stats, setStats] = useState<CollectionStats | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [filterRarity, setFilterRarity] = useState<FilterRarity>('all');
	const [filterType, setFilterType] = useState<FilterType>('all');
	const [searchQuery, setSearchQuery] = useState('');
	const [sortBy, setSortBy] = useState<SortBy>('rarity');
	const [selectedCard, setSelectedCard] = useState<OwnedCard | null>(null);
	const [page, setPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [totalCards, setTotalCards] = useState(0);
	const [isLoadingMore, setIsLoadingMore] = useState(false);

	useEffect(() => {
		fetchInventory(1);
		fetchStats();
	}, []);

	const fetchInventory = async (pageNum: number) => {
		try {
			if (pageNum === 1) setLoading(true);
			else setIsLoadingMore(true);
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
					mintNumber: card.mint_number,
					maxSupply: card.max_supply,
					imageUrl: card.imageUrl,
				}));
				setCards(mappedCards);

				if (data.pagination) {
					setPage(data.pagination.page);
					setTotalPages(data.pagination.totalPages);
					setTotalCards(data.pagination.total);
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

	const fetchStats = async () => {
		try {
			const res = await fetch('/api/inventory/1/stats');
			if (res.ok) {
				const data = await res.json();
				if (data.success && data.stats) {
					const s = data.stats;
					setStats({
						uniqueCards: s.overall.uniqueCards,
						totalCards: s.overall.totalCards,
						completionPercentage: s.overall.completionPercentage,
						totalInGame: Math.round(s.overall.uniqueCards / (s.overall.completionPercentage / 100)) || 0,
						byRarity: s.byRarity || [],
						byType: s.byType || [],
					});
				}
			}
		} catch (err) {
			debug.error('Error fetching stats:', err);
		}
	};

	const hiveCardMap = useMemo(
		() => new Map(hiveCards.map(c => [c.cardId, c])),
		[hiveCards],
	);

	const filteredAndSorted = useMemo(() => {
		let result = cards.filter(card => {
			if (filterRarity !== 'all' && card.rarity !== filterRarity) return false;
			if (filterType !== 'all' && card.type !== filterType) return false;
			if (searchQuery && !card.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
			return true;
		});

		result.sort((a, b) => {
			switch (sortBy) {
				case 'name': return a.name.localeCompare(b.name);
				case 'rarity': return (RARITY_ORDER[a.rarity] ?? 5) - (RARITY_ORDER[b.rarity] ?? 5);
				case 'mint': return (a.mintNumber ?? 99999) - (b.mintNumber ?? 99999);
				case 'recent': default: return 0;
			}
		});

		return result;
	}, [cards, filterRarity, filterType, searchQuery, sortBy]);

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
		<div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-950 to-gray-900 p-6 md:p-8">
			<div className="max-w-7xl mx-auto">
				{/* Header Nav */}
				<div className="flex justify-between items-center mb-6">
					<Link to={routes.home}>
						<motion.button
							whileHover={{ scale: 1.05 }}
							whileTap={{ scale: 0.95 }}
							className="px-5 py-2.5 bg-gray-800/80 hover:bg-gray-700/80 text-white rounded-lg border border-gray-600 flex items-center gap-2 text-sm transition-colors"
						>
							<span>←</span> Back to Home
						</motion.button>
					</Link>
					<div className="flex items-center gap-2 px-4 py-2 bg-blue-900/30 border border-blue-700/40 rounded-lg">
						<span className="text-blue-400 font-bold text-sm">{dust}</span>
						<span className="text-gray-400 text-xs">Dust</span>
					</div>
					<Link to={routes.packs}>
						<motion.button
							whileHover={{ scale: 1.05 }}
							whileTap={{ scale: 0.95 }}
							className="px-5 py-2.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white rounded-lg text-sm font-semibold transition-colors"
						>
							Open Packs →
						</motion.button>
					</Link>
				</div>

				{/* Title */}
				<motion.h1
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					className="text-4xl md:text-5xl font-bold text-center mb-2 text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400"
					style={{ textShadow: '0 0 40px rgba(99, 102, 241, 0.4)' }}
				>
					My Collection
				</motion.h1>

				{/* Stats Dashboard */}
				{stats && (
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.1 }}
						className="mt-6 mb-8"
					>
						{/* Completion Bar */}
						<div className="mb-4">
							<div className="flex justify-between items-baseline mb-2">
								<span className="text-gray-400 text-sm">Collection Progress</span>
								<span className="text-white font-bold text-lg">
									{stats.uniqueCards}
									<span className="text-gray-500 font-normal text-sm"> / {stats.totalInGame || '???'}</span>
									<span className="text-purple-400 ml-2 text-sm font-semibold">({stats.completionPercentage}%)</span>
								</span>
							</div>
							<div className="completion-bar">
								<div
									className="completion-bar-fill"
									style={{ width: `${Math.min(stats.completionPercentage, 100)}%` }}
								/>
							</div>
						</div>

						{/* Rarity + Type Breakdown */}
						<div className="grid grid-cols-2 gap-4">
							{/* Rarity Breakdown */}
							<div className="bg-gray-800/40 rounded-xl p-4 border border-gray-700/50">
								<div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3">By Rarity</div>
								<div className="flex flex-wrap gap-2">
									{(['mythic', 'legendary', 'epic', 'rare', 'common'] as const).map(rarity => {
										const rs = stats.byRarity.find(r => r.rarity === rarity);
										return (
											<div key={rarity} className="rarity-stat-card" style={{ background: `rgba(255,255,255,0.03)` }}>
												<div className={`text-lg font-bold ${getRarityColor(rarity)}`}>
													{rs?.uniqueCards ?? 0}
												</div>
												<div className="text-gray-500 text-[10px] uppercase">{rarity}</div>
											</div>
										);
									})}
								</div>
							</div>

							{/* Type Breakdown */}
							<div className="bg-gray-800/40 rounded-xl p-4 border border-gray-700/50">
								<div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3">By Type</div>
								<div className="flex flex-wrap gap-2">
									{(['hero', 'minion', 'spell', 'weapon'] as const).map(type => {
										const ts = stats.byType.find(t => t.type === type);
										return (
											<div key={type} className="rarity-stat-card" style={{ background: `rgba(255,255,255,0.03)` }}>
												<div className="text-lg font-bold text-white">
													{getTypeIcon(type)} {ts?.uniqueCards ?? 0}
												</div>
												<div className="text-gray-500 text-[10px] uppercase">{type}s</div>
											</div>
										);
									})}
								</div>
							</div>
						</div>
					</motion.div>
				)}

				{/* Filter Bar */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.2 }}
					className="bg-gray-800/40 rounded-xl p-4 mb-6 border border-gray-700/50"
				>
					{/* Search + Sort Row */}
					<div className="flex gap-3 mb-3">
						<div className="flex-1 relative">
							<span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">🔍</span>
							<input
								type="text"
								placeholder="Search cards..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="w-full pl-9 pr-4 py-2 bg-gray-900/60 border border-gray-600/50 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-purple-500/50"
							/>
						</div>
						<select
							value={sortBy}
							onChange={(e) => setSortBy(e.target.value as SortBy)}
							title="Sort cards by"
							className="px-3 py-2 bg-gray-900/60 border border-gray-600/50 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500/50"
						>
							<option value="rarity">Sort: Rarity</option>
							<option value="name">Sort: Name A-Z</option>
							<option value="mint">Sort: Mint # (Low)</option>
							<option value="recent">Sort: Recent</option>
						</select>
					</div>

					{/* Rarity Pills */}
					<div className="flex flex-wrap gap-2 mb-2">
						{RARITY_PILLS.map(pill => (
							<button
								key={pill.value}
								onClick={() => setFilterRarity(pill.value)}
								className={`filter-pill ${filterRarity === pill.value ? 'filter-pill-active' : 'filter-pill-inactive'}`}
								style={filterRarity === pill.value ? { background: pill.activeColor, borderColor: pill.activeColor } : {}}
							>
								{pill.label}
							</button>
						))}
					</div>

					{/* Type Pills */}
					<div className="flex flex-wrap gap-2">
						{TYPE_PILLS.map(pill => (
							<button
								key={pill.value}
								onClick={() => setFilterType(pill.value)}
								className={`filter-pill ${filterType === pill.value ? 'filter-pill-active' : 'filter-pill-inactive'}`}
								style={filterType === pill.value ? { background: 'rgba(139,92,246,0.5)', borderColor: 'rgba(139,92,246,0.5)' } : {}}
							>
								{pill.icon && <span className="mr-1">{pill.icon}</span>}
								{pill.label}
							</button>
						))}
					</div>
				</motion.div>

				{/* Error State */}
				{error && (
					<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-8 mb-8">
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

				{/* Empty Collection */}
				{cards.length === 0 && !error ? (
					<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
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
				) : filteredAndSorted.length === 0 ? (
					<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
						<p className="text-gray-400 text-xl mb-4">No cards match your filters</p>
						<motion.button
							whileHover={{ scale: 1.05 }}
							whileTap={{ scale: 0.95 }}
							onClick={() => { setFilterRarity('all'); setFilterType('all'); setSearchQuery(''); }}
							className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
						>
							Clear Filters
						</motion.button>
					</motion.div>
				) : (
					<>
						{/* Card Grid */}
						<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
							{filteredAndSorted.map((card, index) => {
								const hiveAsset = hiveCardMap.get(card.id);
								const masteryTier = hiveAsset ? getMasteryTier(hiveAsset.xp, card.rarity) : 0;
								return (
								<motion.div
									key={`${card.id}-${index}`}
									initial={{ opacity: 0, scale: 0.9 }}
									animate={{ opacity: 1, scale: 1 }}
									transition={{ delay: index * 0.02 }}
									onClick={() => setSelectedCard(card)}
									className={`relative cursor-pointer rounded-xl overflow-hidden ${getFrameClass(card.rarity)}`}
									style={{ background: 'linear-gradient(180deg, #1a1a2e 0%, #16162a 100%)' }}
								>
									{/* Foil Shimmer */}
									{card.rarity !== 'common' && (
										<div className={getShimmerClass(card.rarity)} />
									)}

									{/* Mastery Badge */}
									{masteryTier >= 2 && (
										<div className={`mastery-badge mastery-tier-${masteryTier}`}>
											{'★'.repeat(masteryTier)}
										</div>
									)}

									<div className="relative p-3">
										{/* Type Icon + Quantity */}
										<div className="flex justify-between items-start mb-1">
											<span className="text-lg" title={card.type}>{getTypeIcon(card.type)}</span>
											{card.quantity > 1 && (
												<div className="w-6 h-6 bg-amber-600 rounded-full flex items-center justify-center text-white font-bold text-[10px] border border-amber-400">
													x{card.quantity}
												</div>
											)}
										</div>

										{/* Art Area */}
										<div
											className="w-full aspect-square rounded-lg mb-2 flex items-center justify-center border border-white/10"
											style={{ background: getClassGradient(card.heroClass) }}
										>
											<span className="text-4xl opacity-80">
												{card.rarity === 'mythic' ? '🌟' :
												 card.rarity === 'legendary' ? '⚡' :
												 card.type === 'hero' ? '👑' :
												 card.type === 'spell' ? '✨' :
												 card.type === 'weapon' ? '🗡️' : '⚔️'}
											</span>
										</div>

										{/* Card Name */}
										<h3 className="text-xs font-bold text-white text-center truncate mb-0.5">{card.name}</h3>

										{/* Rarity Label */}
										<div className="text-center mb-1.5">
											<span className={`text-[10px] font-semibold uppercase ${getRarityColor(card.rarity)}`}>
												{card.rarity}
											</span>
										</div>

										{/* Mint Number Badge */}
										<div className="text-center">
											<span className="mint-badge">
												{card.mintNumber ? `#${card.mintNumber}` : '—'}
												<span className="text-gray-500 mx-0.5">/</span>
												{card.maxSupply?.toLocaleString() ?? '???'}
											</span>
										</div>
									</div>
								</motion.div>
							);
							})}
						</div>

						{/* Pagination */}
						{totalPages > 1 && (
							<motion.div
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								className="flex justify-center items-center gap-4 mt-8"
							>
								<motion.button
									whileHover={{ scale: page === 1 ? 1 : 1.05 }}
									whileTap={{ scale: page === 1 ? 1 : 0.95 }}
									onClick={() => page > 1 && fetchInventory(page - 1)}
									disabled={page === 1 || isLoadingMore}
									className={`px-5 py-2.5 rounded-lg font-semibold text-sm transition-all ${
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
										<span className="text-sm font-semibold">
											Page <span className="text-purple-400">{page}</span> of <span className="text-purple-400">{totalPages}</span>
										</span>
									)}
								</div>

								<motion.button
									whileHover={{ scale: page === totalPages ? 1 : 1.05 }}
									whileTap={{ scale: page === totalPages ? 1 : 0.95 }}
									onClick={() => page < totalPages && fetchInventory(page + 1)}
									disabled={page === totalPages || isLoadingMore}
									className={`px-5 py-2.5 rounded-lg font-semibold text-sm transition-all ${
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

			{/* Card Detail Modal */}
			<AnimatePresence>
				{selectedCard && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						onClick={() => { setSelectedCard(null); setCraftConfirm(null); }}
						className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm"
					>
						<motion.div
							initial={{ scale: 0.8, opacity: 0 }}
							animate={{ scale: 1, opacity: 1 }}
							exit={{ scale: 0.8, opacity: 0 }}
							onClick={(e) => e.stopPropagation()}
							className={`w-[380px] rounded-2xl overflow-hidden ${getFrameClass(selectedCard.rarity)}`}
							style={{ background: 'linear-gradient(180deg, #1a1a2e 0%, #0f0f1a 100%)' }}
						>
							{/* Foil Shimmer */}
							{selectedCard.rarity !== 'common' && (
								<div className={getShimmerClass(selectedCard.rarity)} />
							)}

							<div className="relative p-6">
								{/* Rarity + Type Header */}
								<div className="flex justify-between items-center mb-4">
									<span className="text-3xl">{getTypeIcon(selectedCard.type)}</span>
									<span className={`text-sm font-bold uppercase tracking-wider ${getRarityColor(selectedCard.rarity)}`}>
										{selectedCard.rarity} {selectedCard.type}
									</span>
								</div>

								{/* Art Area */}
								<div
									className="w-full aspect-square rounded-xl mb-4 flex items-center justify-center border border-white/15"
									style={{ background: getClassGradient(selectedCard.heroClass) }}
								>
									<span className="text-7xl opacity-80">
										{selectedCard.rarity === 'mythic' ? '🌟' :
										 selectedCard.rarity === 'legendary' ? '⚡' :
										 selectedCard.type === 'hero' ? '👑' :
										 selectedCard.type === 'spell' ? '✨' :
										 selectedCard.type === 'weapon' ? '🗡️' : '⚔️'}
									</span>
								</div>

								{/* Card Name */}
								<h2 className="text-2xl font-bold text-white text-center mb-1">{selectedCard.name}</h2>
								<p className="text-gray-400 text-sm text-center capitalize mb-4">{selectedCard.heroClass}</p>

								{/* Mint Number Plate */}
								<div className="text-center mb-4">
									<div className="mint-badge-modal inline-block">
										<span className="text-white/90">
											{selectedCard.mintNumber ? `# ${selectedCard.mintNumber}` : '—'}
										</span>
										<span className="text-gray-500 mx-2">of</span>
										<span className="text-white/90">
											{selectedCard.maxSupply?.toLocaleString() ?? '???'}
										</span>
									</div>
									<div className={`text-xs mt-1 font-semibold uppercase tracking-widest ${getRarityColor(selectedCard.rarity)}`}>
										{selectedCard.rarity} Edition
									</div>
								</div>

								{/* Supply Meter */}
								{selectedCard.maxSupply && (
									<div className="mb-4">
										<div className="flex justify-between text-xs text-gray-500 mb-1">
											<span>Supply Claimed</span>
											<span>
												{selectedCard.mintNumber
													? `~${selectedCard.mintNumber} pulled`
													: 'Unknown'}
												{' / '}{selectedCard.maxSupply.toLocaleString()}
											</span>
										</div>
										<div className="supply-meter">
											<div
												className={`supply-meter-fill supply-meter-fill-${selectedCard.rarity}`}
												style={{
													width: selectedCard.mintNumber
														? `${Math.min((selectedCard.mintNumber / selectedCard.maxSupply) * 100, 100)}%`
														: '0%'
												}}
											/>
										</div>
									</div>
								)}

								{/* Minion Stats */}
								{selectedCard.type === 'minion' && selectedCard.attack !== undefined && selectedCard.health !== undefined && (
									<div className="flex justify-center gap-8 mb-4">
										<div className="text-center">
											<div className="stat-gem stat-gem-attack mb-1">{selectedCard.attack}</div>
											<p className="text-[10px] text-gray-500 uppercase">ATK</p>
										</div>
										<div className="text-center">
											<div className="stat-gem stat-gem-health mb-1">{selectedCard.health}</div>
											<p className="text-[10px] text-gray-500 uppercase">HP</p>
										</div>
									</div>
								)}

								{/* Mastery Tier */}
								{(() => {
									const a = hiveCardMap.get(selectedCard.id);
									const mt = a ? getMasteryTier(a.xp, selectedCard.rarity) : 0;
									if (mt < 2) return null;
									return (
										<div className="text-center mb-3">
											<span className={`mastery-badge-modal mastery-tier-${mt}`}>
												{'★'.repeat(mt)} {mt === 3 ? 'Divine' : 'Ascended'}
											</span>
											<div className="text-[10px] text-gray-500 mt-1">NFT Mastery</div>
										</div>
									);
								})()} 

								{/* Owned Count */}
								<div className="text-center text-gray-400 text-sm mb-4">
									Owned: <span className="text-white font-bold">{selectedCard.quantity}</span>
									{selectedCard.quantity > 1 && <span className="text-gray-500"> copies</span>}
								</div>

								{/* Crafting Actions */}
								{(() => {
									const dustVal = getDustValue(selectedCard.rarity);
									const craftCostVal = getCraftCost(selectedCard.rarity);
									const canAfford = dust >= craftCostVal && craftCostVal > 0;

									if (craftConfirm) {
										return (
											<div className="bg-gray-800/60 border border-gray-700/50 rounded-lg p-3 mb-3">
												<p className="text-xs text-gray-400 mb-2 text-center">
													{craftConfirm === 'disenchant'
														? `Disenchant ${selectedCard.name} for ${dustVal} dust?`
														: `Craft ${selectedCard.name} for ${craftCostVal} dust?`}
												</p>
												<div className="flex gap-2">
													<button
														onClick={() => {
															if (craftConfirm === 'disenchant') {
																addDust(dustVal);
															} else {
																spendDust(craftCostVal);
															}
															setCraftConfirm(null);
														}}
														className="flex-1 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-semibold transition-colors"
													>
														Confirm
													</button>
													<button
														onClick={() => setCraftConfirm(null)}
														className="flex-1 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded text-xs transition-colors"
													>
														Cancel
													</button>
												</div>
											</div>
										);
									}

									return (
										<div className="flex gap-2 mb-3">
											{selectedCard.quantity > 0 && dustVal > 0 && (
												<button
													onClick={() => setCraftConfirm('disenchant')}
													className="flex-1 px-3 py-2 bg-red-900/50 hover:bg-red-800/60 text-red-300 rounded-lg text-xs font-medium border border-red-700/40 transition-colors"
												>
													Disenchant ({dustVal} dust)
												</button>
											)}
											{craftCostVal > 0 && (
												<button
													onClick={() => canAfford && setCraftConfirm('craft')}
													disabled={!canAfford}
													className="flex-1 px-3 py-2 bg-blue-900/50 hover:bg-blue-800/60 disabled:bg-gray-800/40 disabled:text-gray-600 text-blue-300 rounded-lg text-xs font-medium border border-blue-700/40 transition-colors"
												>
													Craft ({craftCostVal} dust)
												</button>
											)}
										</div>
									);
								})()}

								{/* Close Button */}
								<motion.button
									whileHover={{ scale: 1.02 }}
									whileTap={{ scale: 0.98 }}
									onClick={() => { setSelectedCard(null); setCraftConfirm(null); }}
									className="w-full py-3 bg-gray-700/80 hover:bg-gray-600/80 text-white font-semibold rounded-xl transition-all text-sm"
								>
									Close
								</motion.button>
							</div>
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}

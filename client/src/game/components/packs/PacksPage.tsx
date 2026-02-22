import { debug } from '../../config/debugConfig';
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { routes } from '../../../lib/routes';
import PackOpeningAnimation from './PackOpeningAnimation';
import { getRarityColor } from '../../utils/rarityUtils';
import type {
	PackType,
	PackTypeResponse,
	SupplyStatsResponse,
	SupplyStats,
	ProcessedRarityStats,
	RevealedCard,
	PackOpenResponse,
	OpenedCard,
	RarityStats
} from './types';
import './packs.css';

const RARITY_ORDER = ['mythic', 'legendary', 'epic', 'rare', 'common'] as const;

const RARITY_COLORS: Record<string, string> = {
	mythic: '#ec4899',
	legendary: '#fbbf24',
	epic: '#a855f7',
	rare: '#3b82f6',
	common: '#9ca3af',
};

const PACK_THEMES: Record<string, { seal: string; btn: string; card: string; icon: string }> = {
	'Starter Pack': { seal: 'pack-seal-starter', btn: 'open-btn-starter', card: 'pack-card-starter', icon: '石' },
	'Booster Pack': { seal: 'pack-seal-booster', btn: 'open-btn-booster', card: 'pack-card-booster', icon: '盾' },
	'Premium Pack': { seal: 'pack-seal-premium', btn: 'open-btn-premium', card: 'pack-card-premium', icon: '冠' },
	'Legendary Pack': { seal: 'pack-seal-legendary', btn: 'open-btn-legendary', card: 'pack-card-legendary', icon: '龍' },
};

function getPackTheme(name: string) {
	return PACK_THEMES[name] || PACK_THEMES['Starter Pack'];
}

function getScarcityInfo(percentRemaining: number): { label: string; class: string } {
	if (percentRemaining <= 0) return { label: 'SOLD OUT', class: 'scarcity-badge-soldout' };
	if (percentRemaining <= 10) return { label: 'ALMOST GONE', class: 'scarcity-badge-critical' };
	if (percentRemaining <= 25) return { label: 'LOW SUPPLY', class: 'scarcity-badge-low' };
	return { label: 'AVAILABLE', class: 'scarcity-badge-fresh' };
}

function formatNumber(n: number): string {
	if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
	if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
	return n.toLocaleString();
}

function getPackGuarantees(pack: any): string[] {
	const guarantees: string[] = [];
	if (pack.rarityOdds.epic > 0) guarantees.push('Epic');
	if (pack.cardCount >= 7) guarantees.push(`${pack.cardCount} Cards`);
	return guarantees;
}

function parseNum(v: string | number): number {
	return typeof v === 'string' ? parseInt(v, 10) || 0 : v || 0;
}

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
				const overall = statsData.overall || {
					total_max_supply: 0, total_remaining_supply: 0,
					total_reward_reserve: 0, total_pack_supply: 0, total_pack_remaining: 0
				};
				const rarityList = statsData.byRarity || [];

				const totalMaxSupply = parseNum(overall.total_max_supply);
				const totalPackSupply = parseNum(overall.total_pack_supply);
				const totalPackRemaining = parseNum(overall.total_pack_remaining);
				const totalRewardReserve = parseNum(overall.total_reward_reserve);
				const totalPulled = totalPackSupply - totalPackRemaining;

				const legendaryStats = rarityList.find((r: RarityStats) => r.nft_rarity === 'legendary');
				const mythicStats = rarityList.find((r: RarityStats) => r.nft_rarity === 'mythic');

				const legendaryPulled = legendaryStats
					? parseNum(legendaryStats.pack_supply) - parseNum(legendaryStats.pack_remaining)
					: 0;
				const mythicPulled = mythicStats
					? parseNum(mythicStats.pack_supply) - parseNum(mythicStats.pack_remaining)
					: 0;

				const legendaryRate = totalPulled > 0 ? ((legendaryPulled / totalPulled) * 100) : 0;
				const mythicRate = totalPulled > 0 ? ((mythicPulled / totalPulled) * 100) : 0;

				const byRarity: ProcessedRarityStats[] = [];
				for (const rarity of RARITY_ORDER) {
					const stat = rarityList.find((r: RarityStats) => r.nft_rarity === rarity);
					if (!stat) continue;
					const ps = parseNum(stat.pack_supply);
					const pr = parseNum(stat.pack_remaining);
					const claimed = ps - pr;
					byRarity.push({
						rarity,
						packSupply: ps,
						packRemaining: pr,
						percentClaimed: ps > 0 ? (claimed / ps) * 100 : 0,
						uniqueCards: parseNum(stat.card_count),
					});
				}

				setSupplyStats({
					totalMaxSupply: totalMaxSupply,
					totalPackSupply: totalPackSupply,
					totalPackRemaining: totalPackRemaining,
					totalRewardReserve: totalRewardReserve,
					totalCardsOpened: totalPulled,
					totalPacksOpened: Math.floor(totalPulled / 5),
					legendaryDropRate: parseFloat(legendaryRate.toFixed(1)),
					mythicDropRate: parseFloat(mythicRate.toFixed(1)),
					byRarity,
				});
			} else {
				setSupplyStats(null);
			}
		} catch (err) {
			debug.error('Error fetching pack data:', err);
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
			debug.error('Error opening pack:', err);
			setPackError('Failed to open pack. Please try again.');
			setIsOpening(false);
			setOpeningPack(null);
		}
	};

	const handleCloseAnimation = () => {
		setOpeningPack(null);
		setRevealedCards([]);
		setIsOpening(false);
		fetchData();
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

	const packPercentRemaining = supplyStats && supplyStats.totalPackSupply > 0
		? (supplyStats.totalPackRemaining / supplyStats.totalPackSupply) * 100
		: 100;
	const scarcity = getScarcityInfo(packPercentRemaining);

	return (
		<div className="h-full overflow-y-auto bg-gradient-to-b from-gray-900 via-purple-950 to-gray-900 p-8 pb-16">
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
						type="button"
						onClick={() => setPackError(null)}
						className="ml-4 text-white/80 hover:text-white"
					>
						✕
					</button>
				</motion.div>
			)}

			<div className="max-w-7xl mx-auto">
				{/* Navigation */}
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

				{/* Title */}
				<motion.h1
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					className="text-5xl font-bold text-center mb-2 text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400"
					style={{ textShadow: '0 0 40px rgba(251, 191, 36, 0.4)' }}
				>
					Norse Mythos Card Packs
				</motion.h1>
				<motion.p
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 0.2 }}
					className="text-gray-400 text-center mb-8 text-lg"
				>
					Limited supply — once they're gone, they're gone forever
				</motion.p>

				{/* ========== GLOBAL SUPPLY BANNER ========== */}
				{supplyStats && (
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.3 }}
						className="supply-banner mb-8"
					>
						<div className="relative z-10">
							{/* Main supply numbers */}
							<div className="flex items-center justify-between mb-4">
								<div>
									<div className="text-xs uppercase tracking-widest text-gray-500 mb-1">Pack Supply</div>
									<div className="flex items-baseline gap-3">
										<span className="supply-number supply-number-large text-amber-400">
											{supplyStats.totalPackRemaining.toLocaleString()}
										</span>
										<span className="text-gray-500 text-lg">/</span>
										<span className="supply-number supply-number-medium text-gray-400">
											{supplyStats.totalPackSupply.toLocaleString()}
										</span>
										<span className="text-gray-500 text-sm ml-1">available in packs</span>
									</div>
								</div>
								<div className="text-right">
									<div className={`scarcity-badge ${scarcity.class} mb-1`}>
										{scarcity.label}
									</div>
									<div className="text-gray-400 text-sm">
										{packPercentRemaining.toFixed(1)}% remaining
									</div>
								</div>
							</div>

							{/* Supply progress bar */}
							<div className="supply-bar mb-5">
								<div
									className="supply-bar-fill"
									style={{ width: `${packPercentRemaining}%` }}
								/>
							</div>

							{/* Rarity breakdown */}
							<div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
								{supplyStats.byRarity.map(rs => {
									const color = RARITY_COLORS[rs.rarity] || '#9ca3af';
									const percentRemaining = rs.packSupply > 0
										? (rs.packRemaining / rs.packSupply) * 100
										: 0;
									return (
										<div
											key={rs.rarity}
											className="bg-white/[0.03] rounded-lg p-3 border border-white/[0.06]"
										>
											<div className="flex items-center justify-between mb-1">
												<span
													className={`text-xs font-bold uppercase ${getRarityColor(rs.rarity)}`}
												>
													{rs.rarity}
												</span>
												<span className="text-gray-500 text-[10px]">
													{rs.uniqueCards} cards
												</span>
											</div>
											<div className="supply-number text-sm mb-1" style={{ color }}>
												{formatNumber(rs.packRemaining)}
												<span className="text-gray-500 text-xs ml-1">
													/ {formatNumber(rs.packSupply)}
												</span>
											</div>
											<div className="rarity-meter">
												<div
													className={`rarity-meter-fill rarity-meter-fill-${rs.rarity}`}
													style={{ width: `${percentRemaining}%` }}
												/>
											</div>
										</div>
									);
								})}
							</div>

							{/* Reward reserve info */}
							<div className="reward-reserve-badge">
								<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
									<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
								</svg>
								<span>
									{supplyStats.totalRewardReserve.toLocaleString()} cards reserved for in-game rewards
								</span>
								<span className="text-teal-400/50 text-xs ml-1">(not available in packs)</span>
							</div>
						</div>
					</motion.div>
				)}

				{/* ========== PACK GRID ========== */}
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
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
						{packTypes.map((pack, index) => {
							const theme = getPackTheme(pack.name);
							const guarantees = getPackGuarantees(pack);

							return (
								<motion.div
									key={pack.id}
									initial={{ opacity: 0, y: 30 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: 0.1 * index }}
									className={`pack-card ${theme.card}`}
								>
									<div className="p-6">
										{/* Pack Seal */}
										<div className={`pack-seal ${theme.seal} mb-4 rounded-xl`}>
											<div className="pack-seal-glow" />
											<div className="pack-seal-icon">
												<span className="text-3xl font-black text-white/90 select-none">
													{theme.icon}
												</span>
											</div>
										</div>

										{/* Pack Info */}
										<h3 className="text-xl font-bold text-white mb-1">{pack.name}</h3>
										<p className="text-gray-400 text-sm mb-3 h-10 leading-tight">{pack.description}</p>

										{/* Guarantees */}
										{guarantees.length > 0 && (
											<div className="flex flex-wrap gap-1.5 mb-3">
												{guarantees.map(g => (
													<span key={g} className="guarantee-tag">{g}</span>
												))}
											</div>
										)}

										{/* Price + Card Count */}
										<div className="flex justify-between items-center mb-4">
											<span className="pack-price text-amber-400">
												{pack.price.toLocaleString()}
											</span>
											<span className="text-gray-400 text-sm font-medium">
												{pack.cardCount} cards
											</span>
										</div>

										{/* Rarity Odds Bars */}
										<div className="space-y-1.5 mb-5">
											<div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">
												Rarity Odds
											</div>
											{Object.entries(pack.rarityOdds)
												.filter(([, odds]) => odds > 0)
												.map(([rarity, odds]) => (
													<div key={rarity} className="flex items-center gap-2">
														<span className={`text-[10px] w-14 text-right capitalize ${getRarityColor(rarity)}`}>
															{rarity}
														</span>
														<div className="odds-bar flex-1">
															<div
																className={`odds-bar-fill odds-bar-fill-${rarity}`}
																style={{ width: `${Math.min(odds, 100)}%` }}
															/>
														</div>
														<span className="text-gray-400 text-[10px] w-8 text-right">
															{odds}%
														</span>
													</div>
												))
											}
										</div>

										{/* Open Button */}
										<motion.button
											whileHover={{ scale: 1.02 }}
											whileTap={{ scale: 0.98 }}
											onClick={() => handleOpenPack(pack)}
											className={`open-btn ${theme.btn}`}
										>
											Open Pack
										</motion.button>
									</div>
								</motion.div>
							);
						})}
					</div>
				)}

				{/* ========== COMMUNITY STATS (only when packs opened) ========== */}
				{supplyStats && supplyStats.totalCardsOpened > 0 && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ delay: 0.5 }}
					>
						<h2 className="text-lg font-bold text-gray-300 mb-4 text-center uppercase tracking-wider">
							Community Stats
						</h2>
						<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
							<div className="bg-gray-800/40 rounded-xl p-4 border border-gray-700/50 text-center">
								<div className="text-2xl font-bold text-amber-400">
									{supplyStats.totalPacksOpened.toLocaleString()}
								</div>
								<div className="text-gray-400 text-sm">Packs Opened</div>
							</div>
							<div className="bg-gray-800/40 rounded-xl p-4 border border-gray-700/50 text-center">
								<div className="text-2xl font-bold text-blue-400">
									{supplyStats.totalCardsOpened.toLocaleString()}
								</div>
								<div className="text-gray-400 text-sm">Cards Collected</div>
							</div>
							<div className="bg-gray-800/40 rounded-xl p-4 border border-gray-700/50 text-center">
								<div className="text-2xl font-bold text-yellow-400">
									{supplyStats.legendaryDropRate}%
								</div>
								<div className="text-gray-400 text-sm">Legendary Rate</div>
							</div>
							<div className="bg-gray-800/40 rounded-xl p-4 border border-gray-700/50 text-center">
								<div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500">
									{supplyStats.mythicDropRate}%
								</div>
								<div className="text-gray-400 text-sm">Mythic Rate</div>
							</div>
						</div>
					</motion.div>
				)}
			</div>
		</div>
	);
}

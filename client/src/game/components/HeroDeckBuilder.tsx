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

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PieceType } from '../stores/heroDeckStore';
import { useDeckBuilder, DECK_SIZE, isClassCard, getMaxCopies } from './deckbuilder';
import type { CardGroup } from './deckbuilder';
import { ArtGallery } from './art';
import { getCardArtPath } from '../utils/art/artMapping';
import { CardData } from '../types';
import { getSuperMinionForHero, getAllSuperMinionsForHero, isSuperMinion } from '../data/sets/superMinions/heroSuperMinions';
import './deckbuilder/tokens.css';
import './deckbuilder/deckbuilder.css';

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

const TYPE_ICONS: Record<string, string> = {
	minion: '\u2694',
	spell: '\u2728',
	weapon: '\uD83D\uDDE1',
	artifact: '\uD83D\uDD31',
	armor: '\uD83D\uDEE1',
};

function getClassColor(heroClass: string): string {
	const colors: Record<string, string> = {
		warrior: '#c2410c',
		mage: '#2563eb',
		hunter: '#16a34a',
		priest: '#e5e7eb',
		rogue: '#6b7280',
		paladin: '#eab308',
		warlock: '#7c3aed',
		druid: '#854d0e',
		shaman: '#0891b2',
		'berserker': '#15803d',
		'death knight': '#6366f1',
		monk: '#65a30d',
	};
	return colors[heroClass.toLowerCase()] || '#6b7280';
}

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
	const classColor = getClassColor(heroClass);

	const manaCurve = useMemo(() => {
		const curve: number[] = new Array(8).fill(0);
		for (const { card, count } of db.deckCardsWithCounts) {
			const cost = Math.min(card.manaCost ?? 0, 7);
			curve[cost] += count;
		}
		return curve;
	}, [db.deckCardsWithCounts]);

	const maxCurveValue = Math.max(...manaCurve, 1);

	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			className="deck-builder fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
			onClick={onClose}
		>
			<motion.div
				initial={{ scale: 0.95, opacity: 0 }}
				animate={{ scale: 1, opacity: 1 }}
				exit={{ scale: 0.95, opacity: 0 }}
				transition={{ duration: 0.2 }}
				className="db-main-container w-[96vw] max-w-[1400px] h-[92vh] rounded-xl shadow-2xl flex flex-col overflow-hidden"
				onClick={e => e.stopPropagation()}
			>
				{/* Header */}
				<div className="db-header flex-shrink-0">
					<div className="db-header-portrait">
						{heroPortrait ? (
							<>
								<img src={heroPortrait} alt={heroName} loading="lazy" />
								<div className="db-header-portrait-overlay" />
							</>
						) : (
							<div className="db-header-fallback" style={{ background: `linear-gradient(135deg, ${classColor}40, ${classColor}15)` }}>
								<span className="db-header-fallback-letter" style={{ color: classColor }}>{heroName.charAt(0)}</span>
							</div>
						)}
					</div>
					<div className="db-header-info">
						<div>
							<div className="db-header-title">Build Deck: {heroName}</div>
							<div className="db-header-subtitle">{pieceType} &bull; {heroClass} Class</div>
						</div>
						<div className="db-header-actions">
							<div className={`db-header-counter ${db.isDeckComplete ? 'complete' : 'incomplete'}`}>
								{db.deckCardIds.length}/{DECK_SIZE} Cards
							</div>
							<button type="button" onClick={onClose} className="db-close-btn">&times;</button>
						</div>
					</div>
				</div>

				{/* Main Content */}
				<div className="db-main-split">
					{/* Card Collection / Art Gallery */}
					<div className="db-collection-pane">
						{/* Tab Toggle */}
						<div className="db-tab-bar">
							<button
								type="button"
								onClick={() => setViewTab('cards')}
								className={`db-tab ${viewTab === 'cards' ? 'active' : ''}`}
							>
								Cards
							</button>
							<button
								type="button"
								onClick={() => setViewTab('art')}
								className={`db-tab ${viewTab === 'art' ? 'active' : ''}`}
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
						<div className="db-filter-bar">
							<div className="db-filter-row">
								<input
									type="text"
									placeholder="Search cards..."
									value={db.searchTerm}
									onChange={e => db.setSearchTerm(e.target.value)}
									className="db-search-input"
								/>
								<select
									value={db.filterType}
									onChange={e => db.setFilterType(e.target.value as any)}
									className="db-filter-select"
									title="Filter by card type"
								>
									<option value="all">All Types</option>
									<option value="minion">Minions</option>
									<option value="spell">Spells</option>
									<option value="weapon">Weapons</option>
									<option value="artifact">Artifacts</option>
									<option value="armor">Armor</option>
								</select>
								<select
									value={db.sortBy}
									onChange={e => db.setSortBy(e.target.value as any)}
									className="db-filter-select"
									title="Sort cards"
								>
									<option value="cost">Sort by Cost</option>
									<option value="name">Sort by Name</option>
									<option value="type">Sort by Type</option>
								</select>
							</div>
							<div className="db-filter-mana-row">
								<div className="db-mana-filter">
									{[0, 1, 2, 3, 4, 5, 6, 7].map(cost => (
										<button
											type="button"
											key={cost}
											onClick={() => db.handleManaFilter(cost)}
											className={`db-mana-btn ${(db.minCost === cost || (cost === 7 && db.minCost === 7)) ? 'active' : ''}`}
										>
											{cost === 7 ? '7+' : cost}
										</button>
									))}
								</div>
								{db.minCost !== null && (
									<button type="button" onClick={db.handleClearManaFilter} className="db-clear-mana-btn">
										Clear
									</button>
								)}
								<span className="db-showing-count" style={{ marginLeft: 'auto' }}>
									{db.totalFilteredCards} of {db.totalValidCards} cards
								</span>
							</div>
						</div>

						{/* Card Grid - Grouped by Class */}
						<div className="db-card-scroll">
							{db.groupedCards.length === 0 && (
								<div className="db-no-results">No cards found matching your filters</div>
							)}
							{db.groupedCards.map(group => (
								<div key={group.label} className="db-card-group">
									<div className="db-group-header">
										<span className="db-group-label">{group.label}</span>
										<span className="db-group-count">{group.cards.length}</span>
									</div>
									<div className="db-card-grid">
										{group.cards.map(card => {
											const cardId = Number(card.id);
											const inDeckCount = db.deckCardCounts[cardId] || 0;
											const canAdd = db.canAddCard(cardId);
											const rarityKey = (card.rarity || 'common').toLowerCase();
											const isMinion = card.type === 'minion';
											const maxCopies = getMaxCopies(card);
											const cardArtPath = getCardArtPath(card.name);
											const isMaxed = !canAdd && inDeckCount >= maxCopies;
											const isSuper = isSuperMinion(cardId);
											const isLinkedSuper = isSuper && getAllSuperMinionsForHero(db.heroId).includes(cardId);

											return (
												<div
													key={card.id}
													onClick={() => db.setSelectedCard(card)}
													onContextMenu={e => e.preventDefault()}
													className={`db-card rarity-${rarityKey} ${isMaxed ? 'not-playable' : ''} ${isLinkedSuper ? 'super-minion-linked' : ''}`}
												>
													{/* Art Section */}
													<div className="db-card-art">
														{cardArtPath ? (
															<>
																<img src={cardArtPath} alt="" loading="lazy" />
																<div className="db-card-art-overlay" />
															</>
														) : (
															<div className="db-card-art-fallback" style={{ background: `linear-gradient(135deg, ${classColor}25 0%, ${classColor}08 100%)` }}>
																{TYPE_ICONS[card.type] || '\u2726'}
															</div>
														)}

														<div className={`db-foil-overlay rarity-${rarityKey}`} />

														{/* Mana Badge */}
														<div className="db-mana-badge">{card.manaCost ?? 0}</div>

														{rarityKey !== 'common' && rarityKey !== 'basic' && (
															<span className={`db-rarity-badge rarity-${rarityKey}`}>
																{rarityKey === 'mythic' ? 'MYTHIC' : rarityKey === 'epic' ? 'EPIC' : 'RARE'}
															</span>
														)}

														{/* Super Minion Badge */}
														{isLinkedSuper && (
															<div className="db-super-badge" title="Your Super Minion! Gets +2/+2 when played by this hero">
																{'\u2B50'}
															</div>
														)}

														{/* Count Badge */}
														{inDeckCount > 0 && (
															<div className="db-count-badge">{inDeckCount}</div>
														)}
													</div>

													{/* Info Section */}
													<div className="db-card-info">
														<div className="db-card-name">{card.name}</div>
														<div className="db-card-meta">
															<div className="db-card-meta-left">
																<span className="db-card-type">{card.type}</span>
																{isClassCard(card) && <span className="db-class-star">{'\u2605'}</span>}
																{isLinkedSuper && <span className="db-super-tag">SUPER</span>}
															</div>
															{isMinion && (
																<div className="db-stat-row">
																	<span className="db-stat db-stat-attack">
																		<span className="db-stat-icon">{'\u2694'}</span>
																		{(card as any).attack ?? 0}
																	</span>
																	<span className="db-stat db-stat-health">
																		<span className="db-stat-icon">{'\u2665'}</span>
																		{(card as any).health ?? 0}
																	</span>
																</div>
															)}
															{card.type === 'artifact' && (
																<div className="db-stat-row">
																	<span className="db-stat db-stat-attack">
																		<span className="db-stat-icon">{'\u2694'}</span>
																		{(card as any).attack ?? 0}
																	</span>
																</div>
															)}
															{card.type === 'armor' && (
																<div className="db-stat-row">
																	<span className="db-stat db-stat-health">
																		<span className="db-stat-icon">{'\uD83D\uDEE1'}</span>
																		{(card as any).armorValue ?? 0}
																	</span>
																</div>
															)}
														</div>
													</div>

													{/* MAX Overlay */}
													{isMaxed && (
														<div className="db-max-overlay">
															<span className="db-max-text">MAX</span>
														</div>
													)}
												</div>
											);
										})}
									</div>
								</div>
							))}
						</div>
						</>
						)}
					</div>

					{/* Deck Sidebar */}
					<div className="db-sidebar">
						<div className="db-sidebar-header">
							<div className="db-sidebar-title">Your Deck</div>
							<div className="db-sidebar-actions">
								<button
									type="button"
									onClick={db.handleAutoFill}
									disabled={db.isDeckComplete}
									className="db-sidebar-btn auto-fill"
								>
									Auto-fill
								</button>
								<button
									type="button"
									onClick={db.handleClearDeck}
									disabled={db.deckCardIds.length === 0}
									className="db-sidebar-btn clear"
								>
									Clear
								</button>
							</div>
						</div>

						{/* Mana Curve */}
						{db.deckCardIds.length > 0 && (
							<div className="db-mana-curve">
								{manaCurve.map((count, i) => (
									<div key={i} className="db-mana-bar-wrap">
										<div className="db-mana-bar-track">
											<div
												className="db-mana-bar"
												style={{ height: count > 0 ? `${Math.max((count / maxCurveValue) * 100, 8)}%` : '0%', opacity: count > 0 ? 1 : 0.15 }}
											/>
										</div>
										<span className="db-mana-bar-label">{i === 7 ? '7+' : i}</span>
									</div>
								))}
							</div>
						)}

						<div className="db-sidebar-list">
							{db.deckCardsWithCounts.length === 0 ? (
								<div className="db-sidebar-empty">Click a card, then use Add to Deck</div>
							) : (
								db.deckCardsWithCounts.map(({ card, count }) => {
									const rarityKey = (card.rarity || 'common').toLowerCase();
									return (
										<div
											key={card.id}
											onClick={() => db.handleRemoveCard(card)}
											className={`db-deck-card rarity-${rarityKey}`}
										>
											<div className="db-deck-mana">{card.manaCost ?? 0}</div>
											<span className="db-deck-name">{card.name}</span>
											{count > 1 && (
												<div className="db-deck-count">{count}</div>
											)}
										</div>
									);
								})
							)}
						</div>

						<div className="db-sidebar-footer">
							{db.saveError && (
								<div className="db-save-error">{db.saveError}</div>
							)}
							<button
								type="button"
								onClick={db.handleSave}
								className={`db-save-btn ${db.isDeckComplete ? 'complete' : 'incomplete'}`}
							>
								{db.isDeckComplete ? 'Save Complete Deck' : `Save Deck (${db.deckCardIds.length}/30)`}
							</button>
						</div>
					</div>
				</div>
			</motion.div>

			{/* Card Detail Flip (left-click) */}
			<AnimatePresence>
				{db.selectedCard && (
					<CardDetailFlip
						card={db.selectedCard}
						classColor={classColor}
						onClose={() => db.setSelectedCard(null)}
						canAdd={db.canAddCard(Number(db.selectedCard.id))}
						inDeckCount={db.deckCardCounts[Number(db.selectedCard.id)] || 0}
						maxCopies={getMaxCopies(db.selectedCard)}
						onAddCard={() => db.handleAddCard(db.selectedCard!)}
						onRemoveCard={() => db.handleRemoveCard(db.selectedCard!)}
					/>
				)}
			</AnimatePresence>
		</motion.div>
	);
};

const RARITY_LABELS: Record<string, string> = {
	mythic: 'MYTHIC',
	epic: 'EPIC',
	rare: 'RARE',
	common: 'COMMON',
	basic: 'BASIC',
};

const CardDetailFlip: React.FC<{
	card: CardData;
	classColor: string;
	onClose: () => void;
	canAdd: boolean;
	inDeckCount: number;
	maxCopies: number;
	onAddCard: () => void;
	onRemoveCard: () => void;
}> = ({ card, classColor, onClose, canAdd, inDeckCount, maxCopies, onAddCard, onRemoveCard }) => {
	const [isFlipped, setIsFlipped] = useState(false);
	const [isFlipping, setIsFlipping] = useState(false);

	const rarityKey = (card.rarity || 'common').toLowerCase();
	const cardArtPath = getCardArtPath(card.name);
	const isMinion = card.type === 'minion';
	const keywords = (card as any).keywords as string[] | undefined;
	const flavorText = (card as any).flavorText as string | undefined;

	const handleFlip = useCallback((e: React.MouseEvent) => {
		e.stopPropagation();
		e.preventDefault();
		if (isFlipping) return;
		setIsFlipping(true);
		setIsFlipped(prev => !prev);
		setTimeout(() => setIsFlipping(false), 700);
	}, [isFlipping]);

	const flipTransition = isFlipping
		? 'transform 0.7s cubic-bezier(0.4, 0, 0.2, 1)'
		: 'none';

	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			className="fixed inset-0 z-[55] db-detail-backdrop"
			onClick={onClose}
		>
			<div className="cd-scene">
				<div
					className="cd-inner"
					style={{
						transform: `rotateY(${isFlipped ? 180 : 0}deg)`,
						transition: flipTransition,
					}}
					onClick={e => e.stopPropagation()}
					onContextMenu={handleFlip}
				>
					{/* FRONT FACE */}
					<div className={`cd-front rarity-${rarityKey}`}>
						<div className="cd-front-art">
							{cardArtPath ? (
								<img src={cardArtPath} alt="" loading="lazy" />
							) : (
								<div className="cd-front-art-fallback" style={{ background: `linear-gradient(135deg, ${classColor}25, ${classColor}08)` }}>
									{TYPE_ICONS[card.type] || '\u2726'}
								</div>
							)}

							<div className={`cd-front-foil rarity-${rarityKey}`} />
						</div>

						{/* Mana gem */}
						<div className="cd-front-mana"><span>{card.manaCost ?? 0}</span></div>

						{/* Rarity badge */}
						{rarityKey !== 'common' && rarityKey !== 'basic' && (
							<span className={`cd-front-badge rarity-${rarityKey}`}>
								{RARITY_LABELS[rarityKey] || rarityKey.toUpperCase()}
							</span>
						)}

						{/* Name plate */}
						<div className="cd-front-plate">
							<div className="cd-front-name">{card.name}</div>
							<div className="cd-front-type">
								{card.type}{isClassCard(card) ? ` \u2605 Class` : ''}
							</div>
						</div>

						{/* Stat gems for minions */}
						{isMinion && (
							<>
								<div className="cd-front-stat attack">{(card as any).attack ?? 0}</div>
								<div className="cd-front-stat health">{(card as any).health ?? 0}</div>
							</>
						)}

						{/* Flip hint */}
						<div className="cd-front-hint">Right-click to flip</div>

						{/* Deck action buttons */}
						<div className="cd-deck-actions" onClick={e => e.stopPropagation()}>
							{canAdd && (
								<button
									type="button"
									className="cd-add-btn"
									onClick={onAddCard}
								>
									+ Add to Deck {inDeckCount > 0 ? `(${inDeckCount}/${maxCopies})` : ''}
								</button>
							)}
							{!canAdd && inDeckCount > 0 && (
								<span className="cd-maxed-label">{inDeckCount}/{maxCopies} in deck</span>
							)}
							{inDeckCount > 0 && (
								<button
									type="button"
									className="cd-remove-btn"
									onClick={onRemoveCard}
								>
									- Remove
								</button>
							)}
						</div>
					</div>

					{/* BACK FACE */}
					<div className="cd-back">
						<div className="cd-back-header">
							<div>
								<div className="cd-back-name">{card.name}</div>
								<div className="cd-back-subtitle">
									{card.type}{(card as any).race ? ` \u2022 ${(card as any).race}` : ''}
									{isClassCard(card) ? ' \u2022 Class Card' : ''}
								</div>
							</div>
							<button type="button" className="cd-back-flip-btn" onClick={handleFlip} title="Flip back">
								&#x21BB;
							</button>
						</div>

						<div className="cd-back-scroll">
							{/* Stats */}
							{isMinion && (
								<div className="cd-back-stats">
									<div className="cd-back-stat">
										<span className="cd-back-stat-val" style={{ color: '#2563eb' }}>{card.manaCost ?? 0}</span>
										<span className="cd-back-stat-label">Mana</span>
									</div>
									<div className="cd-back-stat">
										<span className="cd-back-stat-val" style={{ color: '#fbbf24' }}>{(card as any).attack ?? 0}</span>
										<span className="cd-back-stat-label">Attack</span>
									</div>
									<div className="cd-back-stat">
										<span className="cd-back-stat-val" style={{ color: '#f87171' }}>{(card as any).health ?? 0}</span>
										<span className="cd-back-stat-label">Health</span>
									</div>
								</div>
							)}

							{card.type === 'spell' && (
								<div className="cd-back-stats">
									<div className="cd-back-stat">
										<span className="cd-back-stat-val" style={{ color: '#2563eb' }}>{card.manaCost ?? 0}</span>
										<span className="cd-back-stat-label">Mana</span>
									</div>
									<div className="cd-back-stat">
										<span className={`cd-back-rarity rarity-${rarityKey}`}>{RARITY_LABELS[rarityKey] || rarityKey}</span>
									</div>
								</div>
							)}

							{card.type === 'artifact' && (
								<div className="cd-back-stats">
									<div className="cd-back-stat">
										<span className="cd-back-stat-val" style={{ color: '#2563eb' }}>{card.manaCost ?? 0}</span>
										<span className="cd-back-stat-label">Mana</span>
									</div>
									<div className="cd-back-stat">
										<span className="cd-back-stat-val" style={{ color: '#fbbf24' }}>{(card as any).attack ?? 0}</span>
										<span className="cd-back-stat-label">Attack</span>
									</div>
								</div>
							)}

							{card.type === 'armor' && (
								<div className="cd-back-stats">
									<div className="cd-back-stat">
										<span className="cd-back-stat-val" style={{ color: '#60a5fa' }}>{(card as any).armorValue ?? 0}</span>
										<span className="cd-back-stat-label">Armor</span>
									</div>
									<div className="cd-back-stat">
										<span className="cd-back-stat-val" style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{(card as any).armorSlot || '?'}</span>
										<span className="cd-back-stat-label">Slot</span>
									</div>
								</div>
							)}

							{/* Description */}
							{card.description && (
								<>
									<div className="cd-back-divider">Effect</div>
									<div className="cd-back-desc">{card.description}</div>
								</>
							)}

							{/* Keywords */}
							{keywords && keywords.length > 0 && (
								<>
									<div className="cd-back-divider">Keywords</div>
									<div className="cd-back-keywords">
										{keywords.map((kw: string) => (
											<span key={kw} className="cd-back-keyword">{kw}</span>
										))}
									</div>
								</>
							)}

							{/* Flavor text */}
							{flavorText && (
								<div className="cd-back-flavor">"{flavorText}"</div>
							)}
						</div>
					</div>
				</div>

				{/* Close button */}
				<button
					type="button"
					className="cd-close"
					onClick={(e) => { e.stopPropagation(); onClose(); }}
					title="Close"
				>
					&#x2715;
				</button>
			</div>
		</motion.div>
	);
};

export default HeroDeckBuilder;

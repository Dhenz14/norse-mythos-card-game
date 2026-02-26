import React, { useState, useMemo, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChessPieceType, ArmySelection as ArmySelectionType, ChessPieceHero } from '../types/ChessTypes';
import { CHESS_PIECE_HEROES, getDefaultArmySelection, pieceHasSpells } from '../data/ChessPieceConfig';
import { useAudio } from '../../lib/stores/useAudio';
import useGame from '../../lib/stores/useGame';
import { DeckInfo, CardData } from '../types';
import { getCardById as getRegistryCardById, getAllCards } from '../data/cardManagement/cardRegistry';
import { initializeCardDatabase } from '../data/cardManagement/initializeCards';
import { ElementBadge } from './ElementIndicator';
import { HeroDeckBuilder } from './HeroDeckBuilder';
import { useHeroDeckStore, PieceType } from '../stores/heroDeckStore';
import { HeroDetailPopup } from './HeroDetailPopup';
import { ALL_NORSE_HEROES } from '../data/norseHeroes';
import { HeroPortrait } from './ui/HeroPortrait';
import { HeroArtImage } from './ui/HeroArtImage';
import { resolveHeroPortrait } from '../utils/art/artMapping';
import './styles/ArmySelectionNorse.css';
import { debug } from '../config/debugConfig';
import { useMatchmaking } from '../hooks/useMatchmaking';
import { usePeerStore } from '../stores/peerStore';
import { toast } from 'sonner';

interface ArmySelectionProps {
  onComplete: (army: ArmySelectionType) => void;
  onQuickStart?: (army: ArmySelectionType, deckCardIds: number[]) => void;
  onBack?: () => void;
  isMultiplayer?: boolean;
  onMatchmakingStart?: (army: ArmySelectionType) => void;
}

const PIECE_ORDER: ChessPieceType[] = ['king', 'queen', 'rook', 'bishop', 'knight'];

const PIECE_DISPLAY_INFO: Record<ChessPieceType, { name: string; icon: string; color: string; domain: string; rune: string }> = {
  king: { name: 'Protogenoi', icon: '♔', color: '#FFD700', domain: "Odin's Domain", rune: 'ᚲ' },
  queen: { name: 'Sovereign', icon: '♕', color: '#69CCF0', domain: "Freya's Domain", rune: 'ᛗ' },
  rook: { name: 'Shaper', icon: '♖', color: '#C79C6E', domain: "Thor's Domain", rune: 'ᚦ' },
  bishop: { name: 'Luminary', icon: '♗', color: '#FFFFFF', domain: "Frigg's Domain", rune: 'ᛒ' },
  knight: { name: 'Ethereal', icon: '♘', color: '#FFF569', domain: "Loki's Domain", rune: 'ᛚ' },
  pawn: { name: 'Demigod', icon: '♙', color: '#999999', domain: 'Common Folk', rune: 'ᛈ' }
};

const MAJOR_PIECES: PieceType[] = ['queen', 'rook', 'bishop', 'knight'];

const ArmySelection: React.FC<ArmySelectionProps> = ({ onComplete, onQuickStart, onBack, isMultiplayer = false, onMatchmakingStart }) => {
  const { playSoundEffect } = useAudio();
  const { setupStage, selectedHero, setSelectedHero, setSelectedDeck, startGame, savedDecks } = useGame();
  const [army, setArmy] = useState<ArmySelectionType>(getDefaultArmySelection());
  const [selectedPieceType, setSelectedPieceType] = useState<ChessPieceType>('king');
  const [hoveredHero, setHoveredHero] = useState<ChessPieceHero | null>(null);
  const [cardsLoaded, setCardsLoaded] = useState(false);
  const [deckBuilderOpen, setDeckBuilderOpen] = useState<PieceType | null>(null);
  const [popupHero, setPopupHero] = useState<ChessPieceHero | null>(null);
  
  const { getDeck, validateDeck, isArmyComplete: areAllDecksComplete, loadFromStorage } = useHeroDeckStore();
  
  const { myPeerId, host } = usePeerStore();
  const { status: matchmakingStatus, queuePosition, joinQueue, leaveQueue, error: matchmakingError } = useMatchmaking();
  
  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);
  
  useEffect(() => {
    initializeCardDatabase();
    const allCards = getAllCards();
    debug.log(`[ArmySelection] Card registry has ${allCards.length} cards`);
    setCardsLoaded(allCards.length > 0);
  }, []);
  
  const getCardById = (id: number): CardData | undefined => {
    return getRegistryCardById(id);
  };

  const validDecks = useMemo(() => {
    return Array.isArray(savedDecks) ? savedDecks.filter(d => d && typeof d === 'object') : [];
  }, [savedDecks]);

  const handleQuickStart = (deck: DeckInfo) => {
    if (!onQuickStart || !isArmyComplete) return;
    const cardIds: number[] = [];
    for (const [id, count] of Object.entries(deck.cards || {})) {
      const cardId = parseInt(id, 10);
      const cardCount = typeof count === 'number' ? Math.floor(count) : 0;
      if (!isNaN(cardId) && cardCount > 0) {
        for (let i = 0; i < cardCount; i++) {
          cardIds.push(cardId);
        }
      }
    }
    playSoundEffect('game_start');
    onQuickStart(army, cardIds);
  };

  const currentHeroOptions = useMemo(() => {
    return CHESS_PIECE_HEROES[selectedPieceType] || [];
  }, [selectedPieceType]);

  const currentSelection = useMemo(() => {
    return army[selectedPieceType as keyof ArmySelectionType];
  }, [army, selectedPieceType]);

  const handlePieceTypeClick = (pieceType: ChessPieceType) => {
    setSelectedPieceType(pieceType);
    playSoundEffect('button_click');
  };

  const handleHeroSelect = (hero: ChessPieceHero) => {
    setArmy(prev => ({
      ...prev,
      [selectedPieceType]: hero
    }));
    playSoundEffect('card_click');
  };

  const handleConfirm = () => {
    playSoundEffect('button_click');
    
    // Sync selected king hero to global store to ensure correct hero state
    const kingHero = army.king;
    if (kingHero) {
      debug.log(`[ArmySelection] Syncing King hero: ${kingHero.name} (${kingHero.id})`);
      setSelectedHero(kingHero.heroClass, kingHero.id);
    }
    
    onComplete(army);
  };

  const handleMatchmaking = async () => {
    if (!canProceedToBattle) {
      toast.error('Please complete all decks before starting matchmaking');
      return;
    }

    playSoundEffect('button_click');
    
    // Sync selected king hero to global store
    const kingHero = army.king;
    if (kingHero) {
      debug.log(`[ArmySelection] Syncing King hero: ${kingHero.name} (${kingHero.id})`);
      setSelectedHero(kingHero.heroClass, kingHero.id);
    }

    // Initialize peer connection if needed
    if (!myPeerId) {
      try {
        await host();
      } catch (err) {
        toast.error('Failed to initialize connection. Please try again.');
        return;
      }
    }

    // Start matchmaking
    if (onMatchmakingStart) {
      onMatchmakingStart(army);
    } else {
      await joinQueue();
    }
  };

  const isArmyComplete = PIECE_ORDER.every(pieceType => 
    army[pieceType as keyof ArmySelectionType] !== undefined
  );
  
  const getDeckStatus = (pieceType: PieceType): { cardCount: number; isComplete: boolean } => {
    const deck = getDeck(pieceType);
    if (!deck) return { cardCount: 0, isComplete: false };
    return { cardCount: deck.cardIds.length, isComplete: deck.cardIds.length === 30 };
  };
  
  const allDecksComplete = MAJOR_PIECES.every(piece => {
    const hero = army[piece as keyof ArmySelectionType];
    if (!hero) return false;
    const status = getDeckStatus(piece);
    return status.isComplete;
  });
  
  const canProceedToBattle = isArmyComplete && allDecksComplete;
  
  const handleOpenDeckBuilder = (pieceType: PieceType) => {
    setDeckBuilderOpen(pieceType);
    playSoundEffect('button_click');
  };
  
  const handleCloseDeckBuilder = () => {
    setDeckBuilderOpen(null);
  };

  const getClassBadgeClass = (heroClass: string): string => {
    return `class-${heroClass.toLowerCase()}`;
  };

  // Render the entire ArmySelection as a PORTAL to document.body
  // Uses CSS Grid layout - no inline style overrides needed
  return ReactDOM.createPortal(
    <div className="norse-army-selection">
      <div className="norse-army-bg" />
      <div className="norse-lightning-overlay" />
      
      {/* TOP BAR */}
      <div className="norse-top-bar">
        <h1 className="norse-top-title">ASSEMBLE YOUR ARMY</h1>
        
        <div className="norse-top-bar-actions">
          {validDecks.length > 0 && onQuickStart && !isMultiplayer && (
            <div className="norse-quick-decks">
              {validDecks.slice(0, 3).map((deck) => {
                const cardCount = Object.values(deck.cards || {}).reduce((sum: number, count) => sum + (typeof count === 'number' ? count : 0), 0);
                return (
                  <button
                    key={deck.id || deck.name}
                    onClick={() => handleQuickStart(deck)}
                    disabled={!isArmyComplete}
                    className="norse-quick-deck-btn"
                  >
                    ⚡ {deck.name || 'Quick Deck'} ({cardCount}/30)
                  </button>
                );
              })}
            </div>
          )}
          
          {/* DEV TOOL: START BATTLE (Solo AI) - Only show in non-multiplayer mode */}
          {!isMultiplayer && (
            <button
              onClick={handleConfirm}
              disabled={!canProceedToBattle}
              className="norse-dev-tool-btn"
              title="[DEV] Start solo game with AI"
            >
              {canProceedToBattle ? '⚔ START BATTLE' : 'Complete All Decks'}
            </button>
          )}
        </div>
      </div>

      {/* LEFT SIDEBAR - PIECE SELECTOR */}
      <div className="norse-piece-sidebar norse-stone-panel norse-rune-border">
        {PIECE_ORDER.map((pieceType) => {
          const info = PIECE_DISPLAY_INFO[pieceType];
          const isSelected = selectedPieceType === pieceType;
          const hero = army[pieceType as keyof ArmySelectionType];
          
          return (
            <motion.button
              key={pieceType}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handlePieceTypeClick(pieceType)}
              className={`norse-piece-btn ${isSelected ? 'selected' : ''}`}
            >
              <span className="norse-piece-icon" style={{ color: info.color }}>
                {info.icon}
              </span>
              <div className="norse-piece-info">
                <div className="norse-piece-name">{info.name}</div>
                <div className="norse-piece-hero">
                  {hero?.name || 'Select Hero'}
                </div>
              </div>
              {hero && (
                <div className="norse-piece-check">✓</div>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* CENTER PANEL - HERO GRID */}
      <div className="norse-hero-panel norse-stone-panel norse-rune-border">
        <div className="norse-panel-header">
          <div>
            <div className="norse-panel-title">
              <span style={{ color: PIECE_DISPLAY_INFO[selectedPieceType].color }}>
                {PIECE_DISPLAY_INFO[selectedPieceType].icon}
              </span>
              {PIECE_DISPLAY_INFO[selectedPieceType].name} Heroes
            </div>
            <div className="norse-panel-subtitle">
              {PIECE_DISPLAY_INFO[selectedPieceType].domain}
            </div>
          </div>
          <span className={`norse-spell-badge ${pieceHasSpells(selectedPieceType) ? 'has-spells' : 'no-spells'}`}>
            {pieceHasSpells(selectedPieceType) ? '10 Signature Cards' : 'No Spells (Protogenoi)'}
          </span>
        </div>
        
        <div className="norse-hero-grid">
          {currentHeroOptions.map((hero) => {
            const isCurrentSelection = currentSelection?.id === hero.id;
            
            return (
              <motion.div
                key={hero.id}
                whileHover={{ y: -4 }}
                onClick={() => {
                  setPopupHero(hero);
                  playSoundEffect('button_click');
                }}
                className={`norse-hero-card ${isCurrentSelection ? 'selected' : ''}`}
              >
                <div className="norse-hero-media">
                  <HeroArtImage
                    heroId={hero.id}
                    heroName={hero.name}
                    portrait={hero.portrait}
                    className="norse-hero-image"
                    fallbackIcon={
                      <div className="norse-hero-placeholder">
                        <span className="norse-hero-placeholder-icon" style={{ color: PIECE_DISPLAY_INFO[selectedPieceType].color }}>
                          {PIECE_DISPLAY_INFO[selectedPieceType].icon}
                        </span>
                      </div>
                    }
                  />
                  <div className="norse-hero-gradient-overlay" />
                  <div className="norse-hero-name-overlay">
                    <div className="norse-hero-name">{hero.name}</div>
                    {hero.heroClass.toLowerCase() !== 'neutral' && (
                      <span className={`norse-hero-class-badge ${getClassBadgeClass(hero.heroClass)}`}>
                        {hero.heroClass}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="norse-hero-rune">
                  {PIECE_DISPLAY_INFO[selectedPieceType].rune}
                </div>
                
                <div className="norse-hero-info-panel">
                  <div className="norse-hero-stats">
                    {selectedPieceType !== 'king' && (
                      <>
                        <span className="norse-stat-hp">❤ 100</span>
                        <span className="norse-stat-sta">⚡ 10</span>
                      </>
                    )}
                    {hero.element && hero.element.toLowerCase() !== 'neutral' && (
                      <span className={`norse-element-badge element-${hero.element.toLowerCase()}`}>
                        {hero.element}
                      </span>
                    )}
                  </div>
                  {hero.description && (
                    <div className="norse-hero-desc-preview">{hero.description}</div>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleHeroSelect(hero);
                    }}
                    className={`norse-select-btn ${isCurrentSelection ? 'selected' : ''}`}
                  >
                    {isCurrentSelection ? '✓ Selected' : '⚔ Select Hero'}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* RIGHT SIDEBAR - YOUR ARMY & DECKS */}
      <div className="norse-army-sidebar norse-stone-panel norse-rune-border">
        <div className="norse-army-header">
          <div className="norse-army-title">Your Army & Decks</div>
        </div>
        
        <div className="norse-army-list">
          {PIECE_ORDER.map((pieceType) => {
            const info = PIECE_DISPLAY_INFO[pieceType];
            const hero = army[pieceType as keyof ArmySelectionType];
            const isMajorPiece = MAJOR_PIECES.includes(pieceType as PieceType);
            const deckStatus = isMajorPiece ? getDeckStatus(pieceType as PieceType) : null;
            
            return (
              <div key={pieceType} className="norse-army-item">
                <div className="norse-army-item-row">
                  <div className="norse-army-portrait">
                    {hero ? (
                      <HeroArtImage
                        heroId={hero.id}
                        heroName={hero.name}
                        portrait={hero.portrait}
                        fallbackIcon={<span style={{ color: info.color }}>{info.icon}</span>}
                      />
                    ) : (
                      <span style={{ color: info.color }}>{info.icon}</span>
                    )}
                  </div>
                  <div className="norse-army-item-info">
                    <div className="norse-army-item-name">
                      {hero?.name || <span className="norse-empty-text">Empty</span>}
                    </div>
                    <div className="norse-army-item-deck">
                      {pieceType === 'king' ? 'No deck required' : info.name}
                    </div>
                  </div>
                  {isMajorPiece && deckStatus && (
                    <span className={`norse-deck-count ${deckStatus.isComplete ? 'complete' : 'incomplete'}`}>
                      {deckStatus.cardCount}/30
                    </span>
                  )}
                </div>
                
                {isMajorPiece && hero && pieceType !== 'king' && (
                  <button
                    onClick={() => handleOpenDeckBuilder(pieceType as PieceType)}
                    className="norse-edit-deck-btn"
                  >
                    {deckStatus?.isComplete ? '✓ Edit Deck' : '⚡ Build Deck'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
        
        <div className="norse-army-footer">
          <div className="norse-deck-status">
            <span className="norse-deck-status-label">Deck Status</span>
            <span className={`norse-deck-status-value ${allDecksComplete ? 'complete' : 'incomplete'}`}>
              {allDecksComplete ? '✓ All Complete' : 'Incomplete'}
            </span>
          </div>
          
          {MAJOR_PIECES.map(piece => {
            const hero = army[piece as keyof ArmySelectionType];
            const status = getDeckStatus(piece);
            return (
              <div key={piece} className="norse-deck-breakdown">
                <span className="norse-deck-breakdown-label">{piece}:</span>
                <span className={`norse-deck-breakdown-value ${status.isComplete ? 'complete' : hero ? 'has-hero' : 'no-hero'}`}>
                  {hero ? `${status.cardCount}/30` : 'No hero'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* BOTTOM BAR */}
      <div className="norse-bottom-bar">
        <div className="norse-bottom-bar-left">
          <div className="norse-user-avatar">👤</div>
          {onBack && (
            <button onClick={onBack} className="norse-back-btn">
              ← Back
            </button>
          )}
        </div>

        {!allDecksComplete && isArmyComplete && (
          <div className="norse-deck-warning">
            Build 30-card decks for all heroes to continue
          </div>
        )}

        {/* Matchmaking status for multiplayer */}
        {isMultiplayer && matchmakingStatus === 'queued' && (
          <div className="norse-matchmaking-status">
            <div>🔍 Searching for opponent...</div>
            {queuePosition !== null && (
              <div className="norse-queue-position">
                Position in queue: {queuePosition}
              </div>
            )}
          </div>
        )}

        {isMultiplayer && matchmakingError && (
          <div className="norse-matchmaking-error">
            {matchmakingError}
          </div>
        )}
        
        {/* Main action button - Matchmaking for multiplayer, Start Battle for solo */}
        {isMultiplayer ? (
          <motion.button
            whileHover={canProceedToBattle && matchmakingStatus !== 'queued' ? { scale: 1.02 } : undefined}
            whileTap={canProceedToBattle && matchmakingStatus !== 'queued' ? { scale: 0.98 } : undefined}
            onClick={matchmakingStatus === 'queued' ? leaveQueue : handleMatchmaking}
            disabled={!canProceedToBattle && matchmakingStatus !== 'queued'}
            className="norse-battle-btn"
          >
            {matchmakingStatus === 'queued' ? 'CANCEL SEARCH' : canProceedToBattle ? 'MATCH MAKING' : 'Complete All Decks'}
          </motion.button>
        ) : (
          <motion.button
            whileHover={canProceedToBattle ? { scale: 1.02 } : undefined}
            whileTap={canProceedToBattle ? { scale: 0.98 } : undefined}
            onClick={handleConfirm}
            disabled={!canProceedToBattle}
            className="norse-battle-btn"
          >
            {canProceedToBattle ? 'START BATTLE' : 'Complete All Decks'}
          </motion.button>
        )}
      </div>
      
      {/* DECK BUILDER MODAL */}
      <AnimatePresence>
        {deckBuilderOpen && army[deckBuilderOpen as keyof ArmySelectionType] && (
          <HeroDeckBuilder
            pieceType={deckBuilderOpen}
            heroId={army[deckBuilderOpen as keyof ArmySelectionType]!.id}
            heroClass={army[deckBuilderOpen as keyof ArmySelectionType]!.heroClass}
            heroName={army[deckBuilderOpen as keyof ArmySelectionType]!.name}
            heroPortrait={resolveHeroPortrait(army[deckBuilderOpen as keyof ArmySelectionType]!.id, army[deckBuilderOpen as keyof ArmySelectionType]!.portrait)}
            onClose={handleCloseDeckBuilder}
            onSave={() => {
              playSoundEffect('card_draw');
            }}
          />
        )}
      </AnimatePresence>
      
      {/* HERO DETAIL POPUP */}
      <HeroDetailPopup
        hero={popupHero}
        isOpen={!!popupHero}
        onClose={() => setPopupHero(null)}
        onSelect={() => {
          if (popupHero) {
            handleHeroSelect(popupHero);
          }
        }}
      />
    </div>,
    document.body
  );
};

export default ArmySelection;

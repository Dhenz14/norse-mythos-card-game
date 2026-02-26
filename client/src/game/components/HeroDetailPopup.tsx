import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { NorseHero, NorseKing } from '../types/NorseTypes';
import { ChessPieceHero } from '../types/ChessTypes';
import { ALL_NORSE_HEROES } from '../data/norseHeroes';
import { NORSE_KINGS } from '../data/norseKings/kingDefinitions';
import { useKingDivineCommandDisplay } from '../hooks/useKingDivineCommandDisplay';
import { resolveHeroPortrait } from '../utils/art/artMapping';

interface HeroDetailPopupProps {
  hero: ChessPieceHero | null;
  isOpen: boolean;
  onClose: () => void;
  onSelect?: () => void;
}

const RUNE_CHARS = ['ᚠ', 'ᚢ', 'ᚦ', 'ᚨ', 'ᚱ', 'ᚲ', 'ᚷ', 'ᚹ', 'ᚺ', 'ᚾ', 'ᛁ', 'ᛃ', 'ᛇ', 'ᛈ', 'ᛉ', 'ᛊ', 'ᛏ', 'ᛒ', 'ᛚ', 'ᛗ', 'ᛞ', 'ᛟ'];

const getRunesForText = (text: string, count: number = 3): string[] => {
  const hash = text.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  const result = [];
  for (let i = 0; i < count; i++) {
    result.push(RUNE_CHARS[(hash + i * 7) % RUNE_CHARS.length]);
  }
  return result;
};

const PORTRAIT_POSITIONS: Record<string, string> = {
  'king-ymir': 'center 20%',
  'king-surtr': 'center 20%',
  'king-buri': 'center 15%',
};

const ELEMENT_ACCENT_COLORS: Record<string, { primary: string; glow: string }> = {
	fire: { primary: '#ff6a00', glow: 'rgba(255, 106, 0, 0.5)' },
	water: { primary: '#4a9eff', glow: 'rgba(74, 158, 255, 0.5)' },
	ice: { primary: '#88d8ff', glow: 'rgba(136, 216, 255, 0.5)' },
	grass: { primary: '#4aff6a', glow: 'rgba(74, 255, 106, 0.5)' },
	light: { primary: '#ffe066', glow: 'rgba(255, 224, 102, 0.5)' },
	dark: { primary: '#b87aff', glow: 'rgba(184, 122, 255, 0.5)' },
	electric: { primary: '#ffee58', glow: 'rgba(255, 238, 88, 0.5)' },
	neutral: { primary: '#c8b8a0', glow: 'rgba(200, 184, 160, 0.4)' },
};

const getAccentColor = (hero: ChessPieceHero): { primary: string; glow: string } => {
	const el = hero.element || 'neutral';
	return ELEMENT_ACCENT_COLORS[el] || ELEMENT_ACCENT_COLORS.neutral;
};

const styles = `
  .hero-popup-portal {
    position: fixed;
    inset: 0;
    z-index: 99999;
    pointer-events: auto;
  }

  .hero-popup-backdrop {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.88);
  }

  .hero-popup-container {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: row;
    overflow: hidden;
  }

  /* ========== PORTRAIT SIDE ========== */
  .hero-popup-portrait {
    position: relative;
    flex: 0 0 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #1a1614 0%, #0c0a08 100%);
    overflow: hidden;
  }

  .hero-popup-portrait img {
    max-width: 100%;
    max-height: 100%;
    width: auto;
    height: auto;
    object-fit: contain;
  }

  /* Soft glow bleeding from portrait into content side */
  .hero-popup-portrait::after {
    content: '';
    position: absolute;
    top: 0;
    right: -60px;
    width: 120px;
    height: 100%;
    background: linear-gradient(90deg,
      var(--accent-glow, rgba(200, 184, 160, 0.15)) 0%,
      transparent 100%
    );
    pointer-events: none;
    z-index: 5;
  }

  .hero-popup-close {
    position: absolute;
    top: 20px;
    right: 20px;
    z-index: 100;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.5);
    border: 2px solid rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    cursor: pointer;
    transition: all 0.2s;
  }

  .hero-popup-close:hover {
    background: rgba(0, 0, 0, 0.8);
    border-color: rgba(255, 255, 255, 0.5);
    transform: scale(1.1);
  }

  /* ========== CONTENT SIDE ========== */
  .hero-popup-content {
    flex: 0 0 50%;
    display: flex;
    flex-direction: column;
    z-index: 10;
    padding: 32px 24px;
    overflow-y: auto;
    background:
      /* Subtle noise texture */
      url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E"),
      linear-gradient(180deg, #1a1614 0%, #0c0a08 100%);
  }

  .hero-popup-inner {
    max-width: 560px;
    width: 100%;
  }

  /* ========== SECTION HEADERS ========== */
  .abilities-section-title,
  .divine-command-title {
    font-size: 15px;
    font-weight: 700;
    color: var(--accent-color, #c8b8a0);
    margin: 24px 0 14px 0;
    text-transform: uppercase;
    letter-spacing: 3px;
    display: flex;
    align-items: center;
    gap: 12px;
    text-shadow: 0 0 12px var(--accent-glow, rgba(200, 184, 160, 0.3));
  }

  .abilities-section-title::before,
  .abilities-section-title::after,
  .divine-command-title::before,
  .divine-command-title::after {
    content: '';
    flex: 1;
    height: 1px;
    background: linear-gradient(90deg,
      transparent 0%,
      var(--accent-color, #c8b8a0) 50%,
      transparent 100%
    );
    opacity: 0.4;
  }

  /* ========== STONE PANEL FRAME ========== */
  .stone-panel-frame {
    position: relative;
    margin-bottom: 12px;
    background: linear-gradient(180deg,
      #4a4038 0%,
      #3a352e 30%,
      #2e2a24 70%,
      #252220 100%
    );
    border-radius: 6px;
    padding: 16px 20px;
    display: flex;
    gap: 16px;
    border: 5px solid;
    border-color: #6a5a4a #3a3028 #3a3028 #6a5a4a;
    box-shadow:
      0 4px 12px rgba(0, 0, 0, 0.6),
      inset 0 2px 0 rgba(255, 255, 255, 0.08),
      inset 3px 0 6px rgba(0, 0, 0, 0.3),
      inset -3px 0 6px rgba(0, 0, 0, 0.3),
      inset 0 -3px 6px rgba(0, 0, 0, 0.4);
  }

  .stone-panel-frame::before {
    content: '';
    position: absolute;
    inset: 2px;
    border: 1px solid rgba(100, 85, 70, 0.4);
    border-radius: 3px;
    pointer-events: none;
  }

  /* Corner ornaments on panels */
  .stone-panel-frame::after {
    content: '⟐';
    position: absolute;
    top: -2px;
    left: 12px;
    font-size: 10px;
    color: var(--accent-color, #8a7a6a);
    opacity: 0.6;
    letter-spacing: 4px;
  }

  .panel-content {
    flex: 1;
  }

  .panel-title-origins {
    font-size: 13px;
    font-weight: 700;
    color: var(--accent-color, #c8b8a0);
    margin-bottom: 8px;
    text-transform: uppercase;
    letter-spacing: 2px;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  }

  .panel-title-playstyle {
    font-size: 13px;
    font-weight: 700;
    color: var(--accent-color, #c8b8a0);
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    gap: 8px;
    text-transform: uppercase;
    letter-spacing: 2px;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  }

  .playstyle-dot {
    width: 10px;
    height: 10px;
    background: var(--accent-color, #c8b8a0);
    border-radius: 50%;
    box-shadow: 0 0 6px var(--accent-glow, rgba(200, 184, 160, 0.5));
  }

  .panel-lore-text {
    font-size: 15px;
    font-style: italic;
    color: #d8d0c8;
    line-height: 1.6;
    border-left: 2px solid var(--accent-color, #6a5a4a);
    padding-left: 12px;
  }

  .panel-body-text {
    font-size: 15px;
    color: #c8c0b8;
    line-height: 1.55;
  }

  /* ========== RUNE COLUMN ========== */
  .rune-column {
    display: flex;
    flex-direction: column;
    gap: 6px;
    flex-shrink: 0;
  }

  .rune-tablet {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(145deg,
      #4a4238 0%,
      #3a3630 50%,
      #2e2a26 100%
    );
    border: 3px solid;
    border-color: #5a4a3a #3a302a #3a302a #5a4a3a;
    border-radius: 4px;
    font-size: 20px;
    color: #a09080;
    box-shadow:
      inset 2px 2px 4px rgba(0, 0, 0, 0.5),
      inset -1px -1px 2px rgba(255, 255, 255, 0.05),
      0 2px 4px rgba(0, 0, 0, 0.4);
    text-shadow:
      1px 1px 2px rgba(0, 0, 0, 0.8),
      -1px -1px 1px rgba(255, 255, 255, 0.08);
  }

  /* ========== ABILITY CARDS ========== */
  .ability-card {
    position: relative;
    margin-bottom: 10px;
    background: linear-gradient(180deg,
      #3e3830 0%,
      #322e28 50%,
      #282420 100%
    );
    border-radius: 6px;
    padding: 14px 18px;
    display: flex;
    gap: 14px;
    border: 4px solid;
    border-color: #5a4a3a #3a302a #3a302a #5a4a3a;
    box-shadow:
      0 3px 8px rgba(0, 0, 0, 0.5),
      inset 0 1px 0 rgba(255, 255, 255, 0.06),
      inset 2px 0 4px rgba(0, 0, 0, 0.25),
      inset -2px 0 4px rgba(0, 0, 0, 0.25),
      inset 0 -2px 4px rgba(0, 0, 0, 0.3);
    transition: border-color 0.3s ease;
  }

  .ability-card:hover {
    border-color: #6a5a4a #4a3a2a #4a3a2a #6a5a4a;
  }

  .ability-name {
    font-size: 16px;
    font-weight: 700;
    color: #f0c868;
    margin-bottom: 4px;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  }

  .ability-description {
    font-size: 14px;
    color: #b8b0a8;
    line-height: 1.45;
  }

  /* ========== DIVINE COMMAND ========== */
  .divine-command-section {
    margin-top: 8px;
  }

  .divine-command-card {
    position: relative;
    margin-bottom: 10px;
    border-radius: 6px;
    padding: 16px 18px;
    display: flex;
    gap: 14px;
    border: 4px solid;
    border-color: #5a4a3a #3a302a #3a302a #5a4a3a;
    box-shadow:
      0 3px 8px rgba(0, 0, 0, 0.5),
      inset 0 1px 0 rgba(255, 255, 255, 0.06),
      inset 2px 0 4px rgba(0, 0, 0, 0.25),
      inset -2px 0 4px rgba(0, 0, 0, 0.25),
      inset 0 -2px 4px rgba(0, 0, 0, 0.3);
  }

  .divine-command-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
  }

  .divine-command-name {
    font-size: 16px;
    font-weight: 700;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  }

  /* Rarity badge — stamped metal seal */
  .divine-command-rarity {
    font-size: 10px;
    font-weight: 800;
    padding: 4px 10px;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    border-radius: 2px;
    position: relative;
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.15),
      inset 0 -1px 0 rgba(0, 0, 0, 0.3),
      0 2px 4px rgba(0, 0, 0, 0.4);
  }

  .divine-command-description {
    font-size: 14px;
    color: #c8c0b8;
    line-height: 1.45;
    margin-bottom: 12px;
  }

  .divine-command-stats {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    font-size: 13px;
    padding-top: 10px;
    border-top: 1px solid rgba(100, 85, 70, 0.3);
  }

  .divine-command-stat {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .stat-icon {
    font-size: 14px;
  }

  .stat-label {
    color: #9ca3af;
  }

  .stat-value {
    font-weight: 600;
  }

  /* ========== SELECT BUTTON — Forged Metal ========== */
  .ornate-btn-container {
    position: relative;
    margin-top: 28px;
    display: flex;
    justify-content: center;
    padding-bottom: 12px;
  }

  .ornate-btn {
    position: relative;
    min-width: 320px;
    padding: 0;
    background: none;
    border: none;
    cursor: pointer;
    transition: transform 0.2s ease, filter 0.2s ease;
  }

  .ornate-btn-inner {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px 48px;
    background: linear-gradient(180deg,
      #3a3530 0%,
      #2a2520 40%,
      #1a1815 100%
    );
    border: 3px solid;
    border-color: #6a5a4a #3a3028 #3a3028 #6a5a4a;
    border-radius: 4px;
    box-shadow:
      0 4px 16px rgba(0, 0, 0, 0.6),
      inset 0 1px 0 rgba(255, 255, 255, 0.1),
      inset 0 -2px 4px rgba(0, 0, 0, 0.4);
    overflow: hidden;
  }

  /* Metallic top edge highlight */
  .ornate-btn-inner::before {
    content: '';
    position: absolute;
    top: 0;
    left: 10%;
    right: 10%;
    height: 1px;
    background: linear-gradient(90deg,
      transparent,
      rgba(255, 220, 160, 0.4),
      transparent
    );
  }

  /* Decorative corner runes */
  .ornate-btn-corner-l,
  .ornate-btn-corner-r {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    font-size: 16px;
    color: var(--accent-color, #8a7a6a);
    opacity: 0.5;
    text-shadow: 0 0 8px var(--accent-glow, rgba(200, 184, 160, 0.3));
    pointer-events: none;
    transition: opacity 0.3s;
  }
  .ornate-btn-corner-l { left: 14px; }
  .ornate-btn-corner-r { right: 14px; }

  .ornate-btn-text {
    position: relative;
    font-size: 16px;
    font-weight: 800;
    color: var(--accent-color, #e8e0d8);
    text-transform: uppercase;
    letter-spacing: 4px;
    text-shadow:
      0 0 12px var(--accent-glow, rgba(200, 184, 160, 0.4)),
      0 2px 4px rgba(0, 0, 0, 0.6);
    z-index: 1;
  }

  /* Element glow line under button */
  .ornate-btn-glow-outer {
    position: absolute;
    bottom: -12px;
    left: 50%;
    transform: translateX(-50%);
    width: 70%;
    height: 24px;
    background: radial-gradient(ellipse at center,
      var(--accent-glow, rgba(200, 184, 160, 0.4)) 0%,
      transparent 70%
    );
    filter: blur(8px);
    pointer-events: none;
    transition: filter 0.3s, width 0.3s;
  }

  .ornate-btn-glow-inner {
    position: absolute;
    bottom: -4px;
    left: 50%;
    transform: translateX(-50%);
    width: 50%;
    height: 2px;
    background: var(--accent-color, #c8b8a0);
    opacity: 0.6;
    pointer-events: none;
    border-radius: 1px;
    box-shadow: 0 0 8px var(--accent-glow, rgba(200, 184, 160, 0.5));
    transition: width 0.3s, opacity 0.3s;
  }

  .ornate-btn:hover {
    transform: translateY(-2px);
  }

  .ornate-btn:hover .ornate-btn-inner {
    border-color: #7a6a5a #4a3a2a #4a3a2a #7a6a5a;
  }

  .ornate-btn:hover .ornate-btn-corner-l,
  .ornate-btn:hover .ornate-btn-corner-r {
    opacity: 0.9;
  }

  .ornate-btn:hover .ornate-btn-glow-outer {
    width: 90%;
    filter: blur(10px) brightness(1.4);
  }

  .ornate-btn:hover .ornate-btn-glow-inner {
    width: 60%;
    opacity: 0.9;
  }

  .ornate-btn:active {
    transform: translateY(0px);
  }

  .ornate-btn:active .ornate-btn-inner {
    box-shadow:
      0 2px 8px rgba(0, 0, 0, 0.6),
      inset 0 2px 4px rgba(0, 0, 0, 0.4);
  }

  /* ========== ELEMENT BADGE ========== */
  .hero-element-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    margin-bottom: 16px;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 2px;
    color: var(--accent-color, #c8b8a0);
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid var(--accent-color, #6a5a4a);
    border-radius: 3px;
    box-shadow: 0 0 8px var(--accent-glow, rgba(200, 184, 160, 0.2));
  }

  .hero-element-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--accent-color, #c8b8a0);
    box-shadow: 0 0 6px var(--accent-glow, rgba(200, 184, 160, 0.6));
  }

  /* Scrollbar styling */
  .hero-popup-content::-webkit-scrollbar {
    width: 6px;
  }
  .hero-popup-content::-webkit-scrollbar-track {
    background: transparent;
  }
  .hero-popup-content::-webkit-scrollbar-thumb {
    background: #4a4038;
    border-radius: 3px;
  }
  .hero-popup-content::-webkit-scrollbar-thumb:hover {
    background: #5a5048;
  }
`;

export function HeroDetailPopup({ hero, isOpen, onClose, onSelect }: HeroDetailPopupProps) {
  const [mounted, setMounted] = useState(false);
  
  const { isKingWithAbility, abilityInfo } = useKingDivineCommandDisplay(hero?.id);
  
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);
  
  if (!hero || !mounted) return null;

  const isKing = hero.id?.startsWith('king-') || false;
  const norseHero: NorseHero | undefined = hero.norseHeroId && !isKing ? ALL_NORSE_HEROES[hero.norseHeroId] : undefined;
  const norseKing: NorseKing | undefined = isKing && hero.id ? NORSE_KINGS[hero.id] : undefined;
  
  const lore = norseKing?.description || norseHero?.lore;
  const designIntent = norseKing?.designIntent;
  const role = norseKing?.role || (norseHero ? norseHero.heroClass : 'Hero');
  const portraitPos = hero.id ? (PORTRAIT_POSITIONS[hero.id] || 'center 20%') : 'center 20%';
  const resolvedPortrait = resolveHeroPortrait(hero.id, hero.portrait);
  const heroRunes = getRunesForText(hero.name, 3);

  const popupContent = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="hero-popup-portal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <style>{styles}</style>
          
          <div className="hero-popup-backdrop" onClick={onClose} />
          
          <div
            className="hero-popup-container"
            style={{
              '--accent-color': getAccentColor(hero).primary,
              '--accent-glow': getAccentColor(hero).glow,
            } as React.CSSProperties}
          >
            <div className="hero-popup-portrait">
              {resolvedPortrait && (
                <img
                  src={resolvedPortrait}
                  alt={hero.name}
                  style={{ objectPosition: portraitPos }}
                />
              )}
            </div>
            
            <button className="hero-popup-close" onClick={onClose}>
              <X size={20} color="white" />
            </button>
            
            <div className="hero-popup-content">
              <div className="hero-popup-inner">
                {hero.element && (
                  <div className="hero-element-badge">
                    <span className="hero-element-dot" />
                    <span>{hero.element.toUpperCase()}</span>
                  </div>
                )}

                {lore && (
                  <div className="stone-panel-frame">
                    <div className="panel-content">
                      <div className="panel-title-origins">Origins</div>
                      <p className="panel-lore-text">"{lore}"</p>
                    </div>
                    <div className="rune-column">
                      {heroRunes.map((rune, i) => (
                        <div key={i} className="rune-tablet">{rune}</div>
                      ))}
                    </div>
                  </div>
                )}
                
                {(designIntent || role) && (
                  <div className="stone-panel-frame">
                    <div className="panel-content">
                      <div className="panel-title-playstyle">
                        <span className="playstyle-dot" />
                        <span>Playstyle: {role}</span>
                      </div>
                      <p className="panel-body-text">
                        {designIntent || `${hero.name} forces combat. He compresses the game timeline and punishes slow setups. If you hesitate, ${hero.name} wins.`}
                      </p>
                    </div>
                    <div className="rune-column">
                      {getRunesForText(role || 'Hero', 2).map((rune, i) => (
                        <div key={i} className="rune-tablet">{rune}</div>
                      ))}
                    </div>
                  </div>
                )}
                
                {((norseKing?.passives && norseKing.passives.length > 0) || norseHero?.passive || norseHero?.heroPower) && (
                  <>
                    <div className="abilities-section-title">Passive Abilities</div>
                    
                    {norseKing?.passives?.map((passive) => (
                      <div key={passive.id} className="ability-card">
                        <div className="panel-content">
                          <div className="ability-name">{passive.name}</div>
                          <p className="ability-description">{passive.description}</p>
                        </div>
                        <div className="rune-column">
                          {getRunesForText(passive.name, 2).map((rune, i) => (
                            <div key={i} className="rune-tablet">{rune}</div>
                          ))}
                        </div>
                      </div>
                    ))}
                    
                    {norseHero?.passive && (
                      <div className="ability-card">
                        <div className="panel-content">
                          <div className="ability-name">{norseHero.passive.name}</div>
                          <p className="ability-description">{norseHero.passive.description}</p>
                        </div>
                        <div className="rune-column">
                          {getRunesForText(norseHero.passive.name, 2).map((rune, i) => (
                            <div key={i} className="rune-tablet">{rune}</div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {norseHero?.heroPower && (
                      <div className="ability-card">
                        <div className="panel-content">
                          <div className="ability-name">{norseHero.heroPower.name}</div>
                          <p className="ability-description">{norseHero.heroPower.description}</p>
                        </div>
                        <div className="rune-column">
                          {getRunesForText(norseHero.heroPower.name, 2).map((rune, i) => (
                            <div key={i} className="rune-tablet">{rune}</div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
                
                {isKingWithAbility && abilityInfo && (
                  <div className="divine-command-section">
                    <div className="divine-command-title">Divine Command - Chess Ability</div>
                    <div 
                      className="divine-command-card"
                      style={{
                        background: `linear-gradient(180deg, ${abilityInfo.rarityColor}15 0%, #322e28 30%, #282420 100%)`
                      }}
                    >
                      <div className="panel-content">
                        <div className="divine-command-header">
                          <span 
                            className="divine-command-name"
                            style={{ color: abilityInfo.rarityColor }}
                          >
                            {abilityInfo.abilityName}
                          </span>
                          <span 
                            className="divine-command-rarity"
                            style={{ 
                              backgroundColor: `${abilityInfo.rarityColor}30`,
                              color: abilityInfo.rarityColor,
                              border: `1px solid ${abilityInfo.rarityColor}50`
                            }}
                          >
                            {abilityInfo.rarityLabel}
                          </span>
                        </div>
                        <p className="divine-command-description">{abilityInfo.description}</p>
                        <div className="divine-command-stats">
                          <div className="divine-command-stat">
                            <span className="stat-icon">⏱️</span>
                            <span className="stat-label">Duration:</span>
                            <span className="stat-value" style={{ color: '#22d3ee' }}>
                              {abilityInfo.turnDuration} turn{abilityInfo.turnDuration > 1 ? 's' : ''}
                            </span>
                          </div>
                          <div className="divine-command-stat">
                            <span className="stat-icon">✨</span>
                            <span className="stat-label">Mana Reward:</span>
                            <span className="stat-value" style={{ color: '#22d3ee' }}>
                              +{abilityInfo.manaBoost}
                            </span>
                          </div>
                          <div className="divine-command-stat">
                            <span className="stat-icon">💀</span>
                            <span className="stat-label">STA Penalty:</span>
                            <span className="stat-value" style={{ color: '#ef4444' }}>
                              -{abilityInfo.staPenalty}
                            </span>
                          </div>
                          <div className="divine-command-stat">
                            <span className="stat-icon">🎯</span>
                            <span className="stat-label">Shape:</span>
                            <span className="stat-value" style={{ color: '#fbbf24' }}>
                              {abilityInfo.shapeName}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="rune-column">
                        {getRunesForText(abilityInfo.abilityName, 3).map((rune, i) => (
                          <div key={i} className="rune-tablet">{rune}</div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                
                {onSelect && (
                  <div className="ornate-btn-container">
                    <button
                      className="ornate-btn"
                      onClick={() => {
                        onSelect();
                        onClose();
                      }}
                    >
                      <div className="ornate-btn-inner">
                        <span className="ornate-btn-corner-l">ᚠ</span>
                        <span className="ornate-btn-text">Select {hero.name}</span>
                        <span className="ornate-btn-corner-r">ᚠ</span>
                      </div>
                    </button>
                    <div className="ornate-btn-glow-outer" />
                    <div className="ornate-btn-glow-inner" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(popupContent, document.body);
}

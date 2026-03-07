import React, { useEffect, useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { NorseHero, NorseKing } from '../types/NorseTypes';
import { ChessPieceHero } from '../types/ChessTypes';
import { ALL_NORSE_HEROES } from '../data/norseHeroes';
import { NORSE_KINGS } from '../data/norseKings/kingDefinitions';
import { useKingDivineCommandDisplay } from '../hooks/useKingDivineCommandDisplay';
import { resolveHeroPortrait } from '../utils/art/artMapping';
import { getEditionInfo } from '../utils/heroRarity';

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

const CORNER_RUNES = ['ᚠ', 'ᚦ', 'ᛉ', 'ᛟ'];

const styles = `
  @property --border-angle {
    syntax: '<angle>';
    initial-value: 0deg;
    inherits: false;
  }

  @keyframes border-rotate {
    to { --border-angle: 360deg; }
  }

  @keyframes frame-pulse {
    0%, 100% { opacity: 0.3; }
    50% { opacity: 0.6; }
  }

  @keyframes float-particle {
    0% { transform: translateY(0) translateX(0) scale(1); opacity: 0; }
    10% { opacity: 1; }
    90% { opacity: 0.8; }
    100% { transform: translateY(-120px) translateX(var(--drift-x, 10px)) scale(0.3); opacity: 0; }
  }

  @keyframes seal-rotate {
    to { transform: rotate(360deg); }
  }

  @keyframes gold-shimmer {
    0%, 100% { background-position: -200% center; }
    50% { background-position: 200% center; }
  }

  @keyframes flip-hint-pulse {
    0%, 100% { opacity: 0.4; }
    50% { opacity: 0.7; }
  }

  .hero-popup-portal {
    position: fixed;
    inset: 0;
    z-index: 99999;
    pointer-events: auto;
  }

  .hero-popup-backdrop {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.92);
  }

  /* ========== CARD SCENE — centered perspective container ========== */
  .card-scene {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    perspective: 1200px;
    z-index: 10;
    gap: 0;
  }

  /* ========== CARD INNER — 3D transform container ========== */
  .card-inner {
    position: relative;
    width: min(460px, 88vw);
    aspect-ratio: 5/7;
    max-height: 92vh;
    transform-style: preserve-3d;
    will-change: transform;
  }

  /* ========== CARD FACES ========== */
  .card-front,
  .card-back {
    position: absolute;
    inset: 0;
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
    border: 8px solid;
    border-color: #7a6a5a #3a302a #3a302a #7a6a5a;
    border-radius: 8px;
    box-shadow:
      inset 0 4px 12px rgba(0, 0, 0, 0.6),
      inset 0 -4px 8px rgba(0, 0, 0, 0.4),
      inset 4px 0 8px rgba(0, 0, 0, 0.3),
      inset -4px 0 8px rgba(0, 0, 0, 0.3),
      0 8px 32px rgba(0, 0, 0, 0.8),
      0 0 60px rgba(0, 0, 0, 0.5);
    overflow: hidden;
  }

  .card-front {
    background: #0a0908;
    cursor: pointer;
  }

  .card-front::before {
    content: '';
    position: absolute;
    inset: 3px;
    border: 2px solid rgba(100, 85, 70, 0.5);
    border-radius: 4px;
    pointer-events: none;
    z-index: 20;
  }

  .card-back {
    transform: rotateY(180deg);
    background:
      url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E"),
      linear-gradient(180deg, #1a1614 0%, #0c0a08 100%);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    padding: 12px 14px;
  }

  .card-back::before {
    content: '';
    position: absolute;
    inset: 3px;
    border: 2px solid rgba(100, 85, 70, 0.5);
    border-radius: 4px;
    pointer-events: none;
    z-index: 20;
  }

  /* ========== PORTRAIT — fills card front ========== */
  .hero-popup-portrait {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: #0a0908;
  }

  .hero-popup-portrait img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  /* Rotating conic-gradient border glow */
  .portrait-border-glow {
    position: absolute;
    inset: -12px;
    border-radius: 14px;
    padding: 12px;
    background: conic-gradient(
      from var(--border-angle),
      var(--glow-c1, #92400E),
      var(--glow-c2, #B45309),
      var(--glow-c3, #F59E0B),
      var(--glow-c4, #FDE68A),
      var(--glow-c5, #FFFBEB),
      var(--glow-c4, #FDE68A),
      var(--glow-c3, #F59E0B),
      var(--glow-c2, #B45309),
      var(--glow-c1, #92400E)
    );
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    mask-composite: exclude;
    animation: border-rotate 6s linear infinite;
    pointer-events: none;
    z-index: 1;
    opacity: 0.7;
  }

  /* Frame heartbeat pulse */
  .portrait-frame-pulse {
    position: absolute;
    inset: -4px;
    border-radius: 12px;
    box-shadow: 0 0 30px 8px var(--accent-glow, rgba(200, 184, 160, 0.3));
    animation: frame-pulse 3s ease-in-out infinite;
    pointer-events: none;
    z-index: 0;
  }

  /* ========== HOLOGRAPHIC SYSTEM (Pokemon-style) ========== */
  /*
   * Architecture from simeydotme/pokemon-cards-css:
   * 1. Shine layer: color-dodge blend with LOW brightness + HIGH contrast
   *    → rainbow only tints bright highlights, dark areas stay dark
   * 2. Foil layer: soft-light blend with texture image
   *    → adds shimmer without washing out art
   * 3. Glare layer: overlay blend with tight radial spotlight
   *    → cursor hotspot, dark surround preserves art
   * 4. All layers use --card-opacity (0 when idle, 1 when hovering)
   */

  .card-front {
    --card-opacity: 0;
    --pointer-x: 50%;
    --pointer-y: 50%;
    --pointer-from-center: 0;
    --pointer-from-top: 0.5;
    --pointer-from-left: 0.5;
    --bg-x: 50%;
    --bg-y: 50%;
  }

  /* --- Layer 1: SHINE — rainbow spectrum, color-dodge blend --- */
  .portrait-holo-shine {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 11;
    border-radius: 4px;
    overflow: hidden;

    /* Pokemon's key insight: LOW brightness darkens the gradient,
       HIGH contrast makes only spectral peaks survive,
       LOW saturation prevents garish colors */
    filter: brightness(0.7) contrast(2.75) saturate(0.5);
    mix-blend-mode: color-dodge;

    /* Rainbow sunpillar gradient — cursor-tracked position */
    background-image:
      repeating-linear-gradient(
        0deg,
        hsl(2, 100%, 73%) calc(5% * 1),
        hsl(53, 100%, 69%) calc(5% * 2),
        hsl(93, 100%, 69%) calc(5% * 3),
        hsl(176, 100%, 76%) calc(5% * 4),
        hsl(228, 100%, 74%) calc(5% * 5),
        hsl(283, 100%, 73%) calc(5% * 6),
        hsl(2, 100%, 73%) calc(5% * 7)
      ),
      repeating-linear-gradient(
        90deg,
        hsl(0, 0%, 0%) 0, hsl(0, 0%, 0%) 1.5px,
        hsl(0, 0%, 40%) 1.5px, hsl(0, 0%, 40%) 3px
      );

    background-size: 400% 400%, cover;
    background-position:
      calc(((50% - var(--bg-x)) * 2.6) + 50%)
      calc(((50% - var(--bg-y)) * 3.5) + 50%),
      center center;
    background-blend-mode: overlay;

    opacity: 0;
    transition: opacity 0.3s ease;
  }

  /* Shine ::before — secondary angled bars (depth illusion) */
  .portrait-holo-shine::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 4px;

    background-image:
      repeating-linear-gradient(
        90deg,
        hsl(0, 0%, 0%) 0%, hsl(0, 0%, 0%) 6%,
        hsl(0, 0%, 70%) 9%, hsl(0, 0%, 0%) 10.5%,
        hsl(0, 0%, 70%) 12%, hsl(0, 0%, 0%) 15%,
        hsl(0, 0%, 0%) 42%
      ),
      repeating-linear-gradient(
        90deg,
        hsl(0, 0%, 0%) 0%, hsl(0, 0%, 0%) 6%,
        hsl(0, 0%, 70%) 9%, hsl(0, 0%, 0%) 10.5%,
        hsl(0, 0%, 70%) 12%, hsl(0, 0%, 0%) 15%,
        hsl(0, 0%, 0%) 30%
      );

    background-position:
      calc((((50% - var(--bg-x)) * 1.65) + 50%) + (var(--bg-y) * 0.5)) var(--bg-x),
      calc((((50% - var(--bg-x)) * -0.9) + 50%) - (var(--bg-y) * 0.75)) var(--bg-y);
    background-size: 200% 200%, 200% 200%;
    background-blend-mode: screen;
    filter: brightness(1.15) contrast(1.1);
    mix-blend-mode: hard-light;
  }

  /* Shine ::after — luminosity mask (focus light near cursor) */
  .portrait-holo-shine::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 4px;

    background-image: radial-gradient(
      farthest-corner circle at var(--pointer-x) var(--pointer-y),
      hsla(0, 0%, 90%, 0.8) 0%,
      hsla(0, 0%, 78%, 0.1) 25%,
      hsl(0, 0%, 0%) 90%
    );
    background-size: cover;
    mix-blend-mode: luminosity;
    filter: brightness(0.6) contrast(4);
  }

  /* Per-rarity shine opacity — driven by --card-opacity */
  .card-front.rarity-common .portrait-holo-shine { opacity: 0; }
  .card-front.rarity-rare .portrait-holo-shine {
    opacity: calc(var(--card-opacity) * 0.5);
  }
  .card-front.rarity-epic .portrait-holo-shine {
    opacity: calc(var(--card-opacity) * 0.65);
  }
  .card-front.rarity-mythic .portrait-holo-shine {
    opacity: calc(var(--card-opacity) * 0.8);
  }

  /* --- Layer 2: FOIL — texture overlay, soft-light blend --- */
  .portrait-foil-overlay {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 10;
    border-radius: 4px;
    overflow: hidden;

    background-size: 150% 150%;
    background-position: var(--pointer-x, 50%) var(--pointer-y, 50%);

    /* soft-light only affects midtones — preserves darks and lights */
    mix-blend-mode: soft-light;
    filter: brightness(1.2) contrast(1.2);

    opacity: 0;
    transition: opacity 0.3s ease;
  }

  .card-front.rarity-common .portrait-foil-overlay { background-image: none; }
  .card-front.rarity-rare .portrait-foil-overlay {
    background-image: url('/textures/epic_holographic2.png');
  }
  .card-front.rarity-epic .portrait-foil-overlay {
    background-image: url('/textures/foil_epic.png');
  }
  .card-front.rarity-mythic .portrait-foil-overlay {
    background-image: url('/textures/foil_mythic.png');
  }

  /* Foil opacity — much lower than before; texture, not wash */
  .card-front.rarity-rare .portrait-foil-overlay {
    opacity: calc(var(--card-opacity) * 0.25);
  }
  .card-front.rarity-epic .portrait-foil-overlay {
    opacity: calc(var(--card-opacity) * 0.35);
  }
  .card-front.rarity-mythic .portrait-foil-overlay {
    opacity: calc(var(--card-opacity) * 0.45);
  }

  /* --- Layer 3: GLARE — spotlight, overlay blend --- */
  .portrait-holo-glare {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 12;
    border-radius: 4px;
    overflow: hidden;

    /* Pokemon-style radial: bright center, dark surround
       Much tighter bright area than before (10%/20% not 15%/35%) */
    background-image: radial-gradient(
      farthest-corner circle at var(--pointer-x, 50%) var(--pointer-y, 50%),
      hsla(0, 0%, 100%, 0.8) 10%,
      hsla(0, 0%, 100%, 0.65) 20%,
      hsla(0, 0%, 0%, 0.5) 90%
    );

    mix-blend-mode: overlay;
    filter: brightness(0.8) contrast(1.5);

    opacity: 0;
    transition: opacity 0.3s ease;
  }

  /* Glare ::after — edge highlight ring */
  .portrait-holo-glare::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 4px;
    background-image: radial-gradient(
      farthest-corner circle at var(--pointer-x, 50%) var(--pointer-y, 50%),
      hsl(180, 100%, 95%) 5%,
      hsla(0, 0%, 39%, 0.25) 55%,
      hsla(0, 0%, 0%, 0.36) 110%
    );
    mix-blend-mode: overlay;
    filter: brightness(0.6) contrast(3);
  }

  /* Glare opacity — intensity rises near card edges */
  .card-front.rarity-common .portrait-holo-glare { opacity: 0; }
  .card-front.rarity-rare .portrait-holo-glare {
    opacity: calc(var(--card-opacity) * 0.5);
  }
  .card-front.rarity-epic .portrait-holo-glare {
    opacity: calc(var(--card-opacity) * 0.6);
  }
  .card-front.rarity-mythic .portrait-holo-glare {
    opacity: calc(var(--card-opacity) * 0.7);
  }

  /* --- Layer 4: GLOSS — subtle cursor-following highlight --- */
  .portrait-gloss-overlay {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 13;
    border-radius: 4px;
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  .card-front.rarity-rare .portrait-gloss-overlay,
  .card-front.rarity-epic .portrait-gloss-overlay,
  .card-front.rarity-mythic .portrait-gloss-overlay {
    opacity: var(--card-opacity);
  }

  /* Vignette */
  .portrait-vignette {
    position: absolute;
    inset: 0;
    box-shadow: inset 0 0 80px 20px rgba(0, 0, 0, 0.5);
    pointer-events: none;
    z-index: 13;
    border-radius: 4px;
  }

  /* Corner rune ornaments */
  .portrait-corner-rune {
    position: absolute;
    font-size: 18px;
    color: var(--accent-color, #8a7a6a);
    opacity: 0.5;
    text-shadow:
      0 0 8px var(--accent-glow, rgba(200, 184, 160, 0.4)),
      1px 1px 2px rgba(0, 0, 0, 0.8);
    pointer-events: none;
    z-index: 21;
    transition: opacity 0.3s, text-shadow 0.3s;
  }

  .hero-popup-portrait:hover .portrait-corner-rune {
    opacity: 0.9;
    text-shadow:
      0 0 14px var(--accent-glow, rgba(200, 184, 160, 0.6)),
      1px 1px 2px rgba(0, 0, 0, 0.8);
  }

  .portrait-corner-rune.top-left { top: 10px; left: 12px; }
  .portrait-corner-rune.top-right { top: 10px; right: 12px; }
  .portrait-corner-rune.bottom-left { bottom: 10px; left: 12px; }
  .portrait-corner-rune.bottom-right { bottom: 10px; right: 12px; }

  /* Floating particles */
  .portrait-particles {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 14;
    overflow: hidden;
    border-radius: 4px;
  }

  .portrait-particle {
    position: absolute;
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: var(--accent-color, #c8b8a0);
    box-shadow: 0 0 6px var(--accent-glow, rgba(200, 184, 160, 0.6));
    animation: float-particle var(--float-duration, 4s) ease-in-out var(--float-delay, 0s) infinite;
    left: var(--start-x, 50%);
    bottom: 5%;
  }

  /* ========== SCARCITY BADGE ========== */
  .scarcity-badge {
    position: absolute;
    bottom: 16px;
    left: 16px;
    z-index: 22;
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px;
    background: linear-gradient(180deg, #2a2520 0%, #1a1815 100%);
    border: 3px solid;
    border-color: #5a4a3a #3a302a #3a302a #5a4a3a;
    border-radius: 4px;
    box-shadow:
      0 3px 10px rgba(0, 0, 0, 0.7),
      inset 0 1px 0 rgba(255, 255, 255, 0.1),
      inset 0 -1px 0 rgba(0, 0, 0, 0.4),
      0 0 12px var(--accent-glow, rgba(200, 184, 160, 0.15));
    font-family: 'Courier New', monospace;
    font-variant-numeric: tabular-nums;
  }

  .scarcity-number {
    font-size: 16px;
    font-weight: 800;
    color: var(--accent-color, #f0c868);
    text-shadow:
      0 0 10px var(--accent-glow, rgba(200, 184, 160, 0.5)),
      0 1px 2px rgba(0, 0, 0, 0.8);
    letter-spacing: 1px;
  }

  .scarcity-separator {
    font-size: 14px;
    color: #6a5a4a;
    font-weight: 400;
  }

  .scarcity-max {
    font-size: 14px;
    font-weight: 600;
    color: #8a7a6a;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  }

  /* ========== EDITION STAMP ========== */
  .edition-stamp {
    position: absolute;
    top: 16px;
    left: 16px;
    z-index: 22;
    padding: 4px 12px;
    font-size: 10px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 2px;
    border-radius: 3px;
    border: 2px solid;
    box-shadow:
      0 2px 8px rgba(0, 0, 0, 0.6),
      inset 0 1px 0 rgba(255, 255, 255, 0.12),
      inset 0 -1px 0 rgba(0, 0, 0, 0.3);
  }

  .edition-stamp.edition-mythic {
    background: linear-gradient(90deg,
      #92400E, #B45309, #F59E0B, #FDE68A, #F59E0B, #B45309, #92400E
    );
    background-size: 200% 100%;
    animation: gold-shimmer 4s ease-in-out infinite;
    border-color: #F59E0B #92400E;
    color: #1a1008;
    text-shadow: 0 1px 0 rgba(255, 220, 100, 0.4);
  }

  .edition-stamp.edition-epic {
    background: linear-gradient(90deg,
      #581c87, #7e22ce, #a855f7, #c084fc, #a855f7, #7e22ce, #581c87
    );
    background-size: 200% 100%;
    animation: gold-shimmer 4s ease-in-out infinite;
    border-color: #a855f7 #581c87;
    color: #faf5ff;
    text-shadow: 0 1px 0 rgba(168, 85, 247, 0.4);
  }

  .edition-stamp.edition-rare {
    background: linear-gradient(90deg,
      #1e3a5f, #1d4ed8, #3b82f6, #93c5fd, #3b82f6, #1d4ed8, #1e3a5f
    );
    background-size: 200% 100%;
    animation: gold-shimmer 4s ease-in-out infinite;
    border-color: #3b82f6 #1e3a5f;
    color: #eff6ff;
    text-shadow: 0 1px 0 rgba(59, 130, 246, 0.4);
  }

  .edition-stamp.edition-common {
    background: linear-gradient(180deg, #3a3530 0%, #252220 100%);
    border-color: #5a4a3a #3a302a;
    color: #c8b8a0;
  }

  /* ========== CARD NAME PLATE — bottom of front face ========== */
  .card-name-plate {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 22;
    padding: 24px 20px 16px;
    background: linear-gradient(180deg,
      transparent 0%,
      rgba(0, 0, 0, 0.6) 25%,
      rgba(0, 0, 0, 0.85) 100%
    );
    text-align: center;
    pointer-events: none;
  }

  .card-name-plate-name {
    font-size: 22px;
    font-weight: 800;
    color: #f0e8d8;
    text-transform: uppercase;
    letter-spacing: 3px;
    text-shadow:
      0 0 12px var(--accent-glow, rgba(200, 184, 160, 0.5)),
      0 2px 4px rgba(0, 0, 0, 0.8);
    margin-bottom: 2px;
  }

  .card-name-plate-title {
    font-size: 11px;
    font-weight: 600;
    color: var(--accent-color, #c8b8a0);
    text-transform: uppercase;
    letter-spacing: 2px;
    opacity: 0.8;
  }

  /* ========== FLIP HINT ========== */
  .card-flip-hint {
    position: absolute;
    bottom: 14px;
    right: 14px;
    z-index: 23;
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 10px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.5);
    letter-spacing: 1px;
    text-transform: uppercase;
    animation: flip-hint-pulse 3s ease-in-out infinite;
    pointer-events: none;
  }

  .card-flip-hint-icon {
    font-size: 14px;
  }

  /* ========== BACK FACE HEADER ========== */
  .card-back-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 8px;
    padding-bottom: 6px;
    border-bottom: 1px solid rgba(100, 85, 70, 0.4);
    flex-shrink: 0;
  }

  .card-back-hero-info {
    flex: 1;
    min-width: 0;
  }

  .card-back-hero-name {
    font-size: 16px;
    font-weight: 800;
    color: #f0e8d8;
    text-transform: uppercase;
    letter-spacing: 2px;
    text-shadow:
      0 0 12px var(--accent-glow, rgba(200, 184, 160, 0.5)),
      0 2px 4px rgba(0, 0, 0, 0.8);
  }

  .card-back-hero-title {
    font-size: 10px;
    font-weight: 600;
    color: var(--accent-color, #c8b8a0);
    text-transform: uppercase;
    letter-spacing: 2px;
    opacity: 0.8;
    margin-top: 1px;
  }

  .card-back-flip-btn {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 4px;
    cursor: pointer;
    font-size: 16px;
    color: rgba(255, 255, 255, 0.6);
    transition: background 0.2s, border-color 0.2s, color 0.2s;
    flex-shrink: 0;
    margin-left: 10px;
  }

  .card-back-flip-btn:hover {
    background: rgba(255, 255, 255, 0.15);
    border-color: rgba(255, 255, 255, 0.3);
    color: rgba(255, 255, 255, 0.9);
  }

  /* ========== CLOSE BUTTON ========== */
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
    transition: background 0.2s, border-color 0.2s, transform 0.2s;
  }

  .hero-popup-close:hover {
    background: rgba(0, 0, 0, 0.8);
    border-color: rgba(255, 255, 255, 0.5);
    transform: scale(1.1);
  }

  /* ========== BACK FACE — COMPACT SECTIONS ========== */
  .back-section-divider {
    font-size: 9px;
    font-weight: 700;
    color: var(--accent-color, #c8b8a0);
    text-transform: uppercase;
    letter-spacing: 2px;
    margin: 6px 0 4px;
    display: flex;
    align-items: center;
    gap: 6px;
    text-shadow: 0 0 8px var(--accent-glow, rgba(200, 184, 160, 0.2));
  }

  .back-section-divider::before,
  .back-section-divider::after {
    content: '';
    flex: 1;
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--accent-color, #c8b8a0), transparent);
    opacity: 0.3;
  }

  .back-lore {
    font-size: 11px;
    font-style: italic;
    color: #d8d0c8;
    line-height: 1.35;
    border-left: 2px solid var(--accent-color, rgba(100, 85, 70, 0.6));
    padding-left: 8px;
    margin-bottom: 4px;
  }

  .back-playstyle-label {
    font-size: 9px;
    font-weight: 700;
    color: var(--accent-color, #c8b8a0);
    text-transform: uppercase;
    letter-spacing: 1.5px;
    margin-bottom: 2px;
    opacity: 0.8;
  }

  .back-playstyle-text {
    font-size: 11px;
    color: #c8c0b8;
    line-height: 1.35;
    margin-bottom: 2px;
  }

  .back-ability-row {
    padding: 4px 8px;
    margin-bottom: 3px;
    background: rgba(40, 36, 32, 0.5);
    border-radius: 4px;
    border-left: 3px solid var(--accent-color, #f0c868);
  }

  .back-ability-name {
    font-size: 11px;
    font-weight: 700;
    color: #f0c868;
    margin-bottom: 1px;
  }

  .back-ability-desc {
    font-size: 10px;
    color: #b8b0a8;
    line-height: 1.3;
  }

  /* ========== DIVINE COMMAND — compact ========== */
  .back-dc-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 3px;
  }

  .back-dc-name {
    font-size: 11px;
    font-weight: 700;
  }

  .back-dc-rarity {
    font-size: 8px;
    font-weight: 800;
    padding: 2px 6px;
    text-transform: uppercase;
    letter-spacing: 1px;
    border-radius: 2px;
  }

  .back-dc-desc {
    font-size: 10px;
    color: #c8c0b8;
    line-height: 1.3;
    margin-bottom: 4px;
  }

  .back-dc-stats {
    display: flex;
    gap: 10px;
    font-size: 10px;
    padding-top: 4px;
    border-top: 1px solid rgba(100, 85, 70, 0.25);
  }

  .back-dc-stat-value {
    font-weight: 600;
  }

  /* ========== SELECT BUTTON ========== */
  .ornate-btn-container {
    position: relative;
    margin-top: 16px;
    display: flex;
    justify-content: center;
    flex-shrink: 0;
  }

  .ornate-btn {
    position: relative;
    min-width: 200px;
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
    padding: 10px 28px;
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

  .ornate-btn-corner-l,
  .ornate-btn-corner-r {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    font-size: 14px;
    color: var(--accent-color, #8a7a6a);
    opacity: 0.5;
    text-shadow: 0 0 8px var(--accent-glow, rgba(200, 184, 160, 0.3));
    pointer-events: none;
    transition: opacity 0.3s;
  }
  .ornate-btn-corner-l { left: 12px; }
  .ornate-btn-corner-r { right: 12px; }

  .ornate-btn-text {
    position: relative;
    font-size: 13px;
    font-weight: 800;
    color: var(--accent-color, #e8e0d8);
    text-transform: uppercase;
    letter-spacing: 3px;
    text-shadow:
      0 0 12px var(--accent-glow, rgba(200, 184, 160, 0.4)),
      0 2px 4px rgba(0, 0, 0, 0.6);
    z-index: 1;
  }

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
    gap: 5px;
    padding: 2px 7px;
    margin-bottom: 6px;
    font-size: 10px;
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
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--accent-color, #c8b8a0);
    box-shadow: 0 0 6px var(--accent-glow, rgba(200, 184, 160, 0.6));
  }

  /* Element badge — tighter for back face */
  .hero-element-badge {
    margin-bottom: 4px;
  }
`;

const KING_GLOW_COLORS = {
	c1: '#92400E', c2: '#B45309', c3: '#F59E0B', c4: '#FDE68A', c5: '#FFFBEB'
};

const getGlowColors = (hero: ChessPieceHero, isKing: boolean) => {
	if (isKing) return KING_GLOW_COLORS;
	const accent = getAccentColor(hero);
	const p = accent.primary;
	return { c1: `${p}40`, c2: `${p}80`, c3: p, c4: `${p}cc`, c5: '#ffffff' };
};

export function HeroDetailPopup({ hero, isOpen, onClose, onSelect }: HeroDetailPopupProps) {
	const [mounted, setMounted] = useState(false);
	const [rotation, setRotation] = useState({ x: 0, y: 0 });
	const [position, setPosition] = useState({ x: 0, y: 0 });
	const [mousePercent, setMousePercent] = useState({ x: 50, y: 50 });
	const [isHovering, setIsHovering] = useState(false);
	const [isFlipped, setIsFlipped] = useState(false);
	const [isFlipping, setIsFlipping] = useState(false);
	const cardRef = useRef<HTMLDivElement>(null);
	const returnAnimationRef = useRef<number | null>(null);

	const { isKingWithAbility, abilityInfo } = useKingDivineCommandDisplay(hero?.id);

	useEffect(() => {
		setMounted(true);
		return () => setMounted(false);
	}, []);

	useEffect(() => {
		setIsFlipped(false);
	}, [hero?.id]);

	const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
		if (!cardRef.current || isFlipping) return;
		if (returnAnimationRef.current) {
			cancelAnimationFrame(returnAnimationRef.current);
			returnAnimationRef.current = null;
		}
		const rect = cardRef.current.getBoundingClientRect();
		const centerX = rect.left + rect.width / 2;
		const centerY = rect.top + rect.height / 2;
		const distX = e.clientX - centerX;
		const distY = e.clientY - centerY;
		const rotY = Math.max(-12, Math.min(12, distX / rect.width * 24));
		const rotX = Math.max(-12, Math.min(12, -distY / rect.height * 24));
		const dampingFactor = 1.618;
		setRotation({ x: rotX / dampingFactor, y: rotY / dampingFactor });
		setPosition({ x: distX / 20, y: distY / 20 });
		const mx = ((e.clientX - rect.left) / rect.width) * 100;
		const my = ((e.clientY - rect.top) / rect.height) * 100;
		setMousePercent({ x: mx, y: my });
		if (!isHovering) setIsHovering(true);
	}, [isFlipping, isHovering]);

	const handleMouseLeave = useCallback(() => {
		setIsHovering(false);
		const startRotation = { ...rotation };
		const startPosition = { ...position };
		const startTime = performance.now();
		const duration = 800;
		const easeOutBack = (t: number) => {
			const c1 = 1.70158, c3 = c1 + 1;
			return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
		};
		const animateReturn = (now: number) => {
			const progress = Math.min((now - startTime) / duration, 1);
			const easedProgress = progress >= 1 ? 1 : easeOutBack(1 - progress);
			setRotation({ x: startRotation.x * easedProgress, y: startRotation.y * easedProgress });
			setPosition({ x: startPosition.x * easedProgress, y: startPosition.y * easedProgress });
			if (progress < 1) {
				returnAnimationRef.current = requestAnimationFrame(animateReturn);
			} else {
				setRotation({ x: 0, y: 0 });
				setPosition({ x: 0, y: 0 });
				setMousePercent({ x: 50, y: 50 });
			}
		};
		returnAnimationRef.current = requestAnimationFrame(animateReturn);
	}, [rotation, position]);

	const handleFlip = useCallback((e: React.MouseEvent) => {
		e.stopPropagation();
		if (isFlipping) return;
		setIsFlipping(true);
		setIsFlipped(prev => !prev);
		setTimeout(() => setIsFlipping(false), 700);
	}, [isFlipping]);

	useEffect(() => {
		return () => {
			if (returnAnimationRef.current) cancelAnimationFrame(returnAnimationRef.current);
		};
	}, []);

	if (!hero || !mounted) return null;

	const isKing = hero.id?.startsWith('king-') || false;
	const norseHero: NorseHero | undefined = hero.norseHeroId && !isKing ? ALL_NORSE_HEROES[hero.norseHeroId] : undefined;
	const norseKing: NorseKing | undefined = isKing && hero.id ? NORSE_KINGS[hero.id] : undefined;

	const lore = norseKing?.description || norseHero?.lore;
	const designIntent = norseKing?.designIntent;
	const role = norseKing?.role || (norseHero ? norseHero.heroClass : 'Hero');
	const title = norseKing?.title || norseHero?.title;
	const portraitPos = hero.id ? (PORTRAIT_POSITIONS[hero.id] || 'center 20%') : 'center 20%';
	const resolvedPortrait = resolveHeroPortrait(hero.id, hero.portrait);
	const heroRunes = getRunesForText(hero.name, 3);
	const edition = getEditionInfo(hero.id || hero.name, isKing);
	const glowColors = getGlowColors(hero, isKing);

	const particles = Array.from({ length: 14 }, (_, i) => ({
		id: i,
		startX: `${10 + (i * 67 + 13) % 80}%`,
		driftX: `${(i % 2 === 0 ? 1 : -1) * (8 + (i * 3) % 20)}px`,
		duration: `${3 + (i * 7) % 5}s`,
		delay: `${(i * 0.4) % 3}s`,
	}));

	const effectiveRotY = isFlipped ? -rotation.y : rotation.y;
	const flipTransition = isFlipping
		? 'transform 0.7s cubic-bezier(0.4, 0, 0.2, 1)'
		: (rotation.x === 0 && rotation.y === 0 ? 'transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)' : 'none');

	const popupContent = (
		<AnimatePresence>
			{isOpen && (
				<motion.div
					className="hero-popup-portal"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					transition={{ duration: 0.25 }}
				>
					<style>{styles}</style>

					<div className="hero-popup-backdrop" onClick={onClose} />

					<div
						className="card-scene"
						onClick={onClose}
						style={{
							'--accent-color': getAccentColor(hero).primary,
							'--accent-glow': getAccentColor(hero).glow,
						} as React.CSSProperties}
					>
						<div
							ref={cardRef}
							className="card-inner"
							onMouseMove={handleMouseMove}
							onMouseLeave={handleMouseLeave}
							onClick={(e) => e.stopPropagation()}
							style={{
								transform: `rotateX(${rotation.x}deg) rotateY(${effectiveRotY + (isFlipped ? 180 : 0)}deg) translateZ(0)`,
								transition: flipTransition,
							}}
						>
							<div className="portrait-frame-pulse" />
							<div
								className="portrait-border-glow"
								style={{
									'--glow-c1': glowColors.c1,
									'--glow-c2': glowColors.c2,
									'--glow-c3': glowColors.c3,
									'--glow-c4': glowColors.c4,
									'--glow-c5': glowColors.c5,
								} as React.CSSProperties}
							/>

							{/* ===== FRONT FACE — Portrait ===== */}
							<div
								className={`card-front rarity-${edition.rarity}`}
								onClick={handleFlip}
								style={{
									'--pointer-x': `${mousePercent.x}%`,
									'--pointer-y': `${mousePercent.y}%`,
									'--pointer-from-center': Math.min(Math.sqrt(Math.pow((mousePercent.y - 50) / 50, 2) + Math.pow((mousePercent.x - 50) / 50, 2)), 1),
									'--pointer-from-top': mousePercent.y / 100,
									'--pointer-from-left': mousePercent.x / 100,
									'--card-opacity': isHovering ? 1 : 0,
									'--bg-x': `${37 + ((mousePercent.x - 50) / 50) * 13}%`,
									'--bg-y': `${37 + ((mousePercent.y - 50) / 50) * 13}%`,
								} as React.CSSProperties}
							>
								<div className="hero-popup-portrait">
									{resolvedPortrait && (
										<img
											src={resolvedPortrait}
											alt={hero.name}
											style={{
												objectPosition: portraitPos,
											}}
											loading="lazy"
										/>
									)}

									<div className="portrait-foil-overlay" />
									<div className="portrait-holo-shine" />
									<div className="portrait-holo-glare" />
									<div
										className="portrait-gloss-overlay"
										style={{
											background: `radial-gradient(circle at ${mousePercent.x}% ${mousePercent.y}%, rgba(255,255,255,0.12) 0%, transparent 60%)`,
										}}
									/>
									<div className="portrait-vignette" />

									<div className="portrait-particles">
										{particles.map(p => (
											<div
												key={p.id}
												className="portrait-particle"
												style={{
													'--start-x': p.startX,
													'--drift-x': p.driftX,
													'--float-duration': p.duration,
													'--float-delay': p.delay,
												} as React.CSSProperties}
											/>
										))}
									</div>

									{CORNER_RUNES.map((rune, i) => (
										<span
											key={i}
											className={`portrait-corner-rune ${['top-left', 'top-right', 'bottom-left', 'bottom-right'][i]}`}
										>
											{rune}
										</span>
									))}

									<motion.div
										className={`edition-stamp edition-${edition.rarity}`}
										initial={{ opacity: 0, y: -8 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ delay: 0.3, duration: 0.4 }}
									>
										{edition.editionLabel} EDITION
									</motion.div>

									<motion.div
										className="scarcity-badge"
										initial={{ opacity: 0, y: 8 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ delay: 0.4, duration: 0.4 }}
									>
										<span className="scarcity-number" style={{ color: edition.colors.primary }}>
											#{String(edition.mintNumber).padStart(edition.maxSupply >= 10000 ? 5 : edition.maxSupply >= 1000 ? 4 : 3, '0')}
										</span>
										<span className="scarcity-separator">/</span>
										<span className="scarcity-max">{edition.maxSupply.toLocaleString()}</span>
									</motion.div>

									<div className="card-name-plate">
										<div className="card-name-plate-name">{hero.name}</div>
										{title && <div className="card-name-plate-title">{title}</div>}
									</div>

									<div className="card-flip-hint">
										<span className="card-flip-hint-icon">&#x21BB;</span>
										<span>Flip</span>
									</div>
								</div>
							</div>

							{/* ===== BACK FACE — Info ===== */}
							<div className="card-back">
								<div className="card-back-header">
									<div className="card-back-hero-info">
										<div className="card-back-hero-name">{hero.name}</div>
										{title && <div className="card-back-hero-title">{title}</div>}
									</div>
									<button
										className="card-back-flip-btn"
										onClick={handleFlip}
										type="button"
										title="Flip back"
									>
										&#x21BB;
									</button>
								</div>

								{hero.element && (
									<div className="hero-element-badge">
										<span className="hero-element-dot" />
										<span>{hero.element.toUpperCase()}</span>
									</div>
								)}

								{lore && (
									<>
										<div className="back-section-divider">Origins</div>
										<p className="back-lore">"{lore}"</p>
									</>
								)}

								{(designIntent || role) && (
									<>
										<div className="back-playstyle-label">Playstyle: {role}</div>
										<p className="back-playstyle-text">
											{designIntent || `${hero.name} forces combat and punishes slow setups. If you hesitate, ${hero.name} wins.`}
										</p>
									</>
								)}

								{((norseKing?.passives && norseKing.passives.length > 0) || norseHero?.passive || norseHero?.heroPower) && (
									<>
										<div className="back-section-divider">Abilities</div>

										{norseKing?.passives?.map((passive) => (
											<div key={passive.id} className="back-ability-row">
												<div className="back-ability-name">{passive.name}</div>
												<div className="back-ability-desc">{passive.description}</div>
											</div>
										))}

										{norseHero?.passive && (
											<div className="back-ability-row">
												<div className="back-ability-name">{norseHero.passive.name}</div>
												<div className="back-ability-desc">{norseHero.passive.description}</div>
											</div>
										)}

										{norseHero?.heroPower && (
											<div className="back-ability-row">
												<div className="back-ability-name">{norseHero.heroPower.name}</div>
												<div className="back-ability-desc">{norseHero.heroPower.description}</div>
											</div>
										)}
									</>
								)}

								{isKingWithAbility && abilityInfo && (
									<>
										<div className="back-section-divider">Divine Command</div>
										<div className="back-ability-row" style={{ borderLeftColor: abilityInfo.rarityColor }}>
											<div className="back-dc-header">
												<span className="back-dc-name" style={{ color: abilityInfo.rarityColor }}>
													{abilityInfo.abilityName}
												</span>
												<span
													className="back-dc-rarity"
													style={{
														backgroundColor: `${abilityInfo.rarityColor}25`,
														color: abilityInfo.rarityColor,
													}}
												>
													{abilityInfo.rarityLabel}
												</span>
											</div>
											<div className="back-dc-desc">{abilityInfo.description}</div>
											<div className="back-dc-stats">
												<span><span className="back-dc-stat-value" style={{ color: '#22d3ee' }}>{abilityInfo.turnDuration}T</span> dur</span>
												<span><span className="back-dc-stat-value" style={{ color: '#22d3ee' }}>+{abilityInfo.manaBoost}</span> mana</span>
												<span><span className="back-dc-stat-value" style={{ color: '#ef4444' }}>-{abilityInfo.staPenalty}</span> STA</span>
												<span><span className="back-dc-stat-value" style={{ color: '#fbbf24' }}>{abilityInfo.shapeName}</span></span>
											</div>
										</div>
									</>
								)}

							</div>
						</div>

						{onSelect && (
							<div className="ornate-btn-container" onClick={(e) => e.stopPropagation()}>
								<button
									type="button"
									className="ornate-btn"
									onClick={(e) => {
										e.stopPropagation();
										onSelect();
										onClose();
									}}
								>
									<div className="ornate-btn-inner">
										<span className="ornate-btn-corner-l">&#x16A0;</span>
										<span className="ornate-btn-text">Select {hero.name}</span>
										<span className="ornate-btn-corner-r">&#x16A0;</span>
									</div>
								</button>
								<div className="ornate-btn-glow-outer" />
								<div className="ornate-btn-glow-inner" />
							</div>
						)}

						<button className="hero-popup-close" onClick={(e) => { e.stopPropagation(); onClose(); }} type="button" title="Close">
							<X size={20} color="white" />
						</button>
					</div>
				</motion.div>
			)}
		</AnimatePresence>
	);

	return createPortal(popupContent, document.body);
}

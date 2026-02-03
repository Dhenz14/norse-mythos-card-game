import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { NorseHero, NorseKing } from '../types/NorseTypes';
import { ChessPieceHero } from '../types/ChessTypes';
import { ALL_NORSE_HEROES } from '../data/norseHeroes';
import { NORSE_KINGS } from '../data/norseKings/kingDefinitions';
import { useKingDivineCommandDisplay } from '../hooks/useKingDivineCommandDisplay';

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
    background: rgba(0, 0, 0, 0.85);
  }
  
  .hero-popup-container {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: row;
    overflow: hidden;
  }
  
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
  
  .hero-popup-content {
    flex: 0 0 50%;
    display: flex;
    flex-direction: column;
    z-index: 10;
    padding: 32px 24px;
    overflow-y: auto;
    background: linear-gradient(180deg, #1a1614 0%, #0c0a08 100%);
  }
  
  .hero-popup-inner {
    max-width: 560px;
    width: 100%;
  }
  
  /* Stone Panel Frame - Exact match to reference */
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
    
    /* Thick 3D beveled border */
    border: 5px solid;
    border-color: #6a5a4a #3a3028 #3a3028 #6a5a4a;
    
    box-shadow:
      /* Outer frame shadow */
      0 4px 12px rgba(0, 0, 0, 0.6),
      /* Inner top highlight */
      inset 0 2px 0 rgba(255, 255, 255, 0.08),
      /* Inner side shadows */
      inset 3px 0 6px rgba(0, 0, 0, 0.3),
      inset -3px 0 6px rgba(0, 0, 0, 0.3),
      /* Inner bottom shadow */
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
  
  .panel-content {
    flex: 1;
  }
  
  .panel-title-origins {
    font-size: 14px;
    font-weight: 700;
    color: #f0b8c8;
    margin-bottom: 8px;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  }
  
  .panel-title-playstyle {
    font-size: 14px;
    font-weight: 700;
    color: #f0b8c8;
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    gap: 8px;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  }
  
  .playstyle-dot {
    width: 14px;
    height: 14px;
    background: radial-gradient(circle, #ff6060 30%, #c04040 100%);
    border-radius: 50%;
    box-shadow: 0 0 4px rgba(255, 80, 80, 0.5);
  }
  
  .panel-lore-text {
    font-size: 15px;
    font-style: italic;
    color: #d8d0c8;
    line-height: 1.55;
  }
  
  .panel-body-text {
    font-size: 15px;
    color: #c8c0b8;
    line-height: 1.55;
  }
  
  /* Rune Column - Carved stone tablets */
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
    
    /* Carved stone effect */
    box-shadow:
      inset 2px 2px 4px rgba(0, 0, 0, 0.5),
      inset -1px -1px 2px rgba(255, 255, 255, 0.05),
      0 2px 4px rgba(0, 0, 0, 0.4);
    
    text-shadow: 
      1px 1px 2px rgba(0, 0, 0, 0.8),
      -1px -1px 1px rgba(255, 255, 255, 0.08);
  }
  
  /* Passive Abilities Section */
  .abilities-section-title {
    font-size: 18px;
    font-weight: 700;
    color: #ffffff;
    margin: 20px 0 14px 0;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  }
  
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
  
  /* Divine Command Section */
  .divine-command-section {
    margin-top: 20px;
  }
  
  .divine-command-title {
    font-size: 18px;
    font-weight: 700;
    color: #ffffff;
    margin-bottom: 14px;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
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
  
  .divine-command-rarity {
    font-size: 11px;
    font-weight: 700;
    padding: 3px 8px;
    border-radius: 4px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
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
  
  /* Ornate Select Button */
  .ornate-btn-container {
    position: relative;
    margin-top: 24px;
    display: flex;
    justify-content: center;
    padding-bottom: 8px;
  }
  
  .ornate-btn {
    position: relative;
    min-width: 280px;
    padding: 18px 48px;
    background: linear-gradient(180deg, 
      #4a4540 0%, 
      #3a3530 40%, 
      #2a2620 100%
    );
    border: none;
    cursor: pointer;
    transition: transform 0.15s ease;
    
    /* Ornate hexagonal shape */
    clip-path: polygon(
      10% 0%, 90% 0%,
      100% 35%, 100% 65%,
      90% 100%, 10% 100%,
      0% 65%, 0% 35%
    );
  }
  
  .ornate-btn-border {
    position: absolute;
    inset: -4px;
    background: linear-gradient(135deg, 
      #7a6a58 0%, 
      #5a4a3a 30%,
      #3a3028 50%,
      #5a4a3a 70%,
      #7a6a58 100%
    );
    clip-path: polygon(
      10% 0%, 90% 0%,
      100% 35%, 100% 65%,
      90% 100%, 10% 100%,
      0% 65%, 0% 35%
    );
    z-index: -1;
  }
  
  .ornate-btn-text {
    position: relative;
    font-size: 18px;
    font-weight: 800;
    color: #e8e0d8;
    text-transform: uppercase;
    letter-spacing: 3px;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.6);
    z-index: 1;
  }
  
  /* Bright green glow effect under button */
  .ornate-btn-glow-outer {
    position: absolute;
    bottom: -16px;
    left: 50%;
    transform: translateX(-50%);
    width: 120%;
    height: 32px;
    background: radial-gradient(ellipse at center, 
      rgba(0, 255, 100, 0.6) 0%,
      rgba(0, 255, 100, 0.3) 40%,
      transparent 70%
    );
    filter: blur(10px);
    pointer-events: none;
  }
  
  .ornate-btn-glow-inner {
    position: absolute;
    bottom: -8px;
    left: 50%;
    transform: translateX(-50%);
    width: 80%;
    height: 16px;
    background: radial-gradient(ellipse at center, 
      rgba(0, 255, 100, 0.8) 0%,
      rgba(0, 255, 100, 0.4) 50%,
      transparent 80%
    );
    filter: blur(6px);
    pointer-events: none;
  }
  
  .ornate-btn:hover {
    transform: translateY(-3px);
  }
  
  .ornate-btn:hover ~ .ornate-btn-glow-outer,
  .ornate-btn:hover ~ .ornate-btn-glow-inner {
    filter: blur(8px) brightness(1.3);
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
          
          <div className="hero-popup-container">
            <div className="hero-popup-portrait">
              {hero.portrait && (
                <img 
                  src={hero.portrait} 
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
                    <div className="ornate-btn-border" />
                    <button
                      className="ornate-btn"
                      onClick={() => {
                        onSelect();
                        onClose();
                      }}
                    >
                      <span className="ornate-btn-text">Select {hero.name}</span>
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

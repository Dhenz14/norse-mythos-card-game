/**
 * BattlefieldHero - Enhanced hero display component for the combat arena battlefield
 * 
 * Features:
 * - Hero portraits with elemental effects and particle systems
 * - Interactive hero power activation via portrait click
 * - Tooltips rendered via portal to escape overflow:hidden containers
 * - HP and Stamina bars with visual feedback
 * - Secret indicators with hover tooltips
 * - Weapon upgrade system display
 * 
 * @module combat/components/BattlefieldHero
 */

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { ALL_NORSE_HEROES } from '../../data/norseHeroes';

/**
 * Props for the BattlefieldHero component
 */
export interface BattlefieldHeroProps {
  /** The pet/hero data object containing name, stats, and norseHeroId */
  pet: any;
  /** Amount of HP committed to the current bet */
  hpCommitted: number;
  /** Hero level */
  level: number;
  /** Click handler for the hero card */
  onClick?: () => void;
  /** Whether the hero is currently targetable */
  isTargetable?: boolean;
  /** Whether this is the opponent's hero */
  isOpponent?: boolean;
  /** Array of active secrets */
  secrets?: any[];
  /** Hero class for secret color styling */
  heroClass?: string;
  /** Element type for visual effects (fire, ice, etc.) */
  element?: string;
  /** Current mana available */
  mana?: number;
  /** Maximum mana capacity */
  maxMana?: number;
  /** Handler for hero power activation */
  onHeroPowerClick?: () => void;
  /** Handler for weapon upgrade activation */
  onWeaponUpgradeClick?: () => void;
  /** Whether the weapon has been upgraded */
  isWeaponUpgraded?: boolean;
}

/**
 * BattlefieldHero displays an enhanced hero card on the battlefield
 * with interactive hero powers, elemental effects, and detailed stats
 */
export const BattlefieldHero: React.FC<BattlefieldHeroProps> = ({ 
  pet, 
  hpCommitted, 
  level, 
  onClick, 
  isTargetable = false, 
  isOpponent = false,
  secrets = [], 
  heroClass = 'neutral', 
  element: elementProp, 
  mana = 0, 
  maxMana = 10, 
  onHeroPowerClick,
  onWeaponUpgradeClick, 
  isWeaponUpgraded = false
}) => {
  const heroElement = useMemo(() => {
    if (elementProp) return elementProp;
    if (pet.norseHeroId && ALL_NORSE_HEROES[pet.norseHeroId]) {
      return ALL_NORSE_HEROES[pet.norseHeroId].element || 'neutral';
    }
    return 'neutral';
  }, [pet.norseHeroId, elementProp]);
  
  const currentHP = pet.stats.currentHealth;
  const maxHP = pet.stats.maxHealth;
  const armor = pet.stats.armor || 0;
  const healthPercent = Math.max(0, (currentHP / maxHP) * 100);
  const currentSta = pet.stats.currentStamina;
  const maxSta = pet.stats.maxStamina;
  const staminaPercent = maxSta > 0 ? Math.max(0, (currentSta / maxSta) * 100) : 0;
  const [showSecretTooltip, setShowSecretTooltip] = useState(false);
  const [showHeroPowerTooltip, setShowHeroPowerTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState<{ top: number; left: number } | null>(null);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const portraitRef = useRef<HTMLDivElement>(null);
  
  const elementClass = heroElement ? `element-${heroElement.toLowerCase()}` : '';
  
  const norseHero = pet.norseHeroId ? ALL_NORSE_HEROES[pet.norseHeroId] : null;
  const heroPower = norseHero?.heroPower;
  const weaponUpgrade = norseHero?.weaponUpgrade;
  
  const WEAPON_COST = 5;
  const canAffordPower = heroPower ? mana >= heroPower.cost : false;
  const canAffordUpgrade = mana >= WEAPON_COST;
  const canUpgrade = canAffordUpgrade && !isOpponent && !isWeaponUpgraded;
  const isPowerDisabled = !canAffordPower || isOpponent;
  
  const handlePortraitClick = useCallback((e: React.MouseEvent) => {
    if (isOpponent) return;
    e.stopPropagation();
    
    if (onHeroPowerClick) {
      onHeroPowerClick();
    }
  }, [isOpponent, onHeroPowerClick]);
  
  useEffect(() => {
    return () => {
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
    };
  }, []);
  
  const getSecretColor = (heroClass: string) => {
    switch (heroClass) {
      case 'mage': return '#3b82f6';
      case 'hunter': return '#22c55e';
      case 'paladin': return '#eab308';
      case 'rogue': return '#6b7280';
      default: return '#a855f7';
    }
  };

  return (
    <div 
      className={`battlefield-hero-square ${isOpponent ? 'opponent' : 'player'} ${isTargetable ? 'targetable' : ''} ${onClick ? 'clickable' : ''}`}
      onClick={onClick}
    >
      <div className={`hero-card-wrapper ${elementClass} premium-glow`}>
        <div className={`hero-elemental-aura ${elementClass} premium-glow`} />
        
        <div className={`hero-card-frame ${elementClass} premium-glow`}>
          <div className={`hero-particles ${elementClass} premium-glow`}>
            <div className="particle particle-1" />
            <div className="particle particle-2" />
            <div className="particle particle-3" />
            <div className="particle particle-4" />
            <div className="particle particle-5" />
            <div className="particle particle-6" />
            <div className="particle particle-7" />
            <div className="particle particle-8" />
            <div className="particle particle-9" />
            <div className="particle particle-10" />
          </div>
          <div 
            ref={portraitRef}
            className={`hero-portrait hero-portrait-interactive ${!isOpponent && heroPower ? 'has-power' : ''} ${!isPowerDisabled ? 'power-ready' : ''} ${canUpgrade ? 'upgrade-ready' : ''} ${isWeaponUpgraded ? 'upgraded' : ''}`}
            style={{
              backgroundImage: `url('/portraits/heroes/${pet.name.split(' ')[0].toLowerCase()}.png')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center top',
              cursor: !isOpponent ? 'pointer' : 'default',
              pointerEvents: 'auto'
            }}
            onClick={(e) => {
              e.stopPropagation();
              handlePortraitClick(e);
            }}
            onMouseEnter={(e) => {
              e.stopPropagation();
              if (portraitRef.current) {
                const rect = portraitRef.current.getBoundingClientRect();
                setTooltipPosition({
                  top: isOpponent ? rect.bottom + 8 : rect.top - 8,
                  left: rect.left + rect.width / 2
                });
              }
              setShowHeroPowerTooltip(true);
            }}
            onMouseLeave={(e) => {
              e.stopPropagation();
              setShowHeroPowerTooltip(false);
              setTooltipPosition(null);
            }}
          >
            {!isOpponent && heroPower && (
              <div className={`portrait-power-badge ${canAffordPower ? 'affordable' : 'expensive'} ${isWeaponUpgraded ? 'upgraded' : ''}`}>
                <span className="power-cost">{heroPower.cost}</span>
                {isWeaponUpgraded && <span className="upgraded-icon">⚔</span>}
              </div>
            )}
          </div>
          
          {showHeroPowerTooltip && heroPower && tooltipPosition && createPortal(
            <div 
              className="hero-portrait-tooltip-portal"
              style={{
                position: 'fixed',
                top: tooltipPosition.top,
                left: tooltipPosition.left,
                transform: isOpponent ? 'translateX(-50%)' : 'translateX(-50%) translateY(-100%)',
                zIndex: 10000,
                pointerEvents: 'none',
                animation: 'tooltip-fade-in 0.15s ease-out'
              }}
            >
              <div className="portrait-tooltip-content">
                <div className="tooltip-power-header">
                  <span className="power-name">⚡ {heroPower.name}</span>
                  <span className="power-cost-display">{heroPower.cost} Mana</span>
                </div>
                <div className="tooltip-power-desc">{heroPower.description}</div>
                
                {weaponUpgrade && !isOpponent && (
                  <div className={`tooltip-upgrade-section ${canUpgrade ? 'can-upgrade' : ''} ${isWeaponUpgraded ? 'is-upgraded' : ''}`}>
                    <div className="upgrade-header">
                      {isWeaponUpgraded ? '✓ WEAPON UPGRADED' : `⚔ UPGRADE: ${weaponUpgrade.name} (${WEAPON_COST} Mana)`}
                    </div>
                    <div className="upgrade-effect">
                      {isWeaponUpgraded 
                        ? `Upgraded effect active: ${weaponUpgrade.immediateEffect.description}`
                        : `Upgrade for: ${weaponUpgrade.immediateEffect.description}`}
                    </div>
                    {!isWeaponUpgraded && (
                      canUpgrade ? (
                        <div className="upgrade-hint">Double-click portrait to upgrade!</div>
                      ) : (
                        <div className="upgrade-hint disabled">Need {WEAPON_COST - mana} more mana to upgrade</div>
                      )
                    )}
                  </div>
                )}

                {!isOpponent && !isWeaponUpgraded && (
                  <div className="tooltip-power-hint">
                    {isPowerDisabled 
                      ? `Need ${heroPower.cost - mana} more mana` 
                      : 'Single-click to activate'}
                  </div>
                )}
              </div>
            </div>,
            document.body
          )}
          <div className="hero-name-plate">
            <span className="hero-name">{pet.name.split(' ')[0]}</span>
          </div>
        
          <div className="hero-stat-bar hp-bar">
            <div className="stat-bar-fill hp-fill" style={{ width: `${healthPercent}%` }} />
            <span className="stat-bar-text">{Math.round(currentHP)}/{Math.round(maxHP)}</span>
          </div>
        
          <div className="hero-stat-bar sta-bar">
            <div className="stat-bar-fill sta-fill" style={{ width: `${staminaPercent}%` }} />
            <span className="stat-bar-text">⚡{currentSta}/{maxSta}</span>
          </div>
        
          {armor > 0 && (
            <div className="hero-armor-badge" title="Armor">{armor}</div>
          )}
        
          {secrets && secrets.length > 0 && (
            <div 
              className="hero-secret-indicator"
              onMouseEnter={() => setShowSecretTooltip(true)}
              onMouseLeave={() => setShowSecretTooltip(false)}
              style={{ 
                backgroundColor: getSecretColor(heroClass),
                position: 'absolute',
                top: isOpponent ? 'auto' : '-12px',
                bottom: isOpponent ? '-12px' : 'auto',
                right: '50%',
                transform: 'translateX(50%)',
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid white',
                boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                cursor: 'help',
                zIndex: 10
              }}
            >
              <span style={{ color: 'white', fontWeight: 'bold', fontSize: '16px' }}>?</span>
              {secrets.length > 1 && (
                <span style={{
                  position: 'absolute',
                  bottom: '-4px',
                  right: '-4px',
                  backgroundColor: '#dc2626',
                  color: 'white',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid white'
                }}>
                  {secrets.length}
                </span>
              )}
            </div>
          )}
        
          {showSecretTooltip && secrets && secrets.length > 0 && (
            <div 
              className="secret-tooltip"
              style={{
                position: 'absolute',
                top: isOpponent ? '100%' : 'auto',
                bottom: isOpponent ? 'auto' : '100%',
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: 'rgba(0,0,0,0.9)',
                color: 'white',
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                whiteSpace: 'nowrap',
                zIndex: 100,
                marginTop: isOpponent ? '8px' : '0',
                marginBottom: isOpponent ? '0' : '8px',
                border: `2px solid ${getSecretColor(heroClass)}`,
                boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
              }}
            >
              <div style={{ fontWeight: 'bold', marginBottom: '4px', color: getSecretColor(heroClass) }}>
                Secret Active
              </div>
              <div style={{ opacity: 0.8 }}>
                {secrets.length === 1 ? '1 secret in play' : `${secrets.length} secrets in play`}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BattlefieldHero;

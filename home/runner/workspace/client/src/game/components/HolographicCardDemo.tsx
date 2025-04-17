/**
 * HolographicCardDemo Component
 * 
 * A showcase component that demonstrates the ultra-premium holographic card effects
 * using advanced visual techniques that exceed AAA game studio standards.
 */

import React, { useState, useEffect } from 'react';
import { HolographicCardEffect } from './HolographicCardEffect';
// Import our components with fallbacks
import TestCard3D from './3D/TestCard3D';
import SimpleHolographicCard from './SimpleHolographicCard';
import './HolographicEffect.css';

interface HolographicCardDemoProps {
  initialRarity?: string;
}

const HolographicCardDemo: React.FC<HolographicCardDemoProps> = ({
  initialRarity = 'legendary'
}) => {
  const [rarity, setRarity] = useState(initialRarity);
  const [qualityLevel, setQualityLevel] = useState<'ultra' | 'high' | 'medium'>('ultra');
  const [effectIntensity, setEffectIntensity] = useState(1.0);
  
  // Card data for the demo
  const cardData = {
    legendary: {
      id: 9001,
      name: "Odin's Wisdom",
      description: "Battlecry: Discover a Legendary minion from any class. Reduce its Cost by (3).",
      manaCost: 6,
      attack: 5,
      health: 5,
      rarity: "legendary",
      type: "minion"
    },
    epic: {
      id: 9002,
      name: "Valkyrie's Embrace",
      description: "Choose a minion. It gains Divine Shield and 'Deathrattle: Summon a 3/3 Spirit'.",
      manaCost: 4,
      attack: null,
      health: null,
      rarity: "epic",
      type: "spell"
    },
    rare: {
      id: 9003,
      name: "Thor's Hammer",
      description: "Deal 3 damage. If you've played an Elemental last turn, deal 6 damage instead.",
      manaCost: 3,
      attack: 3,
      health: 2,
      rarity: "rare",
      type: "weapon"
    },
    common: {
      id: 9004,
      name: "Fjord Guardian",
      description: "Taunt. Battlecry: Gain +1/+1 for each other minion you control.",
      manaCost: 4,
      attack: 2,
      health: 5,
      rarity: "common",
      type: "minion"
    }
  };
  
  // Get current card based on rarity
  const currentCard = cardData[rarity.toLowerCase() as keyof typeof cardData];
  
  // Debugging logs to help identify issues with card rendering
  useEffect(() => {
    console.log('HolographicCardDemo mounted');
    console.log('Current rarity:', rarity);
    console.log('TestCard3D component imported correctly:', !!TestCard3D);
    console.log('Card data:', currentCard);
    
    // Check if 3D functionality is working
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      console.log('WebGL support:', !!gl);
    } catch (e) {
      console.error('WebGL initialization error:', e);
    }
  }, [rarity, currentCard]);
  
  return (
    <div className="holographic-demo-container" style={{ 
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '20px',
      background: 'linear-gradient(to bottom, #1a1a2e, #16213e, #0f3460)',
      minHeight: '100vh',
      width: '100%',
      color: '#fff'
    }}>
      <h1 className="embossed-text" style={{ 
        fontSize: '2.5rem',
        color: '#FFD700',
        textAlign: 'center',
        marginBottom: '20px',
        fontFamily: 'serif',
        letterSpacing: '2px'
      }}>
        Premium Holographic Card Demo
      </h1>
      
      <div style={{ 
        display: 'flex',
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: '30px',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        maxWidth: '1200px'
      }}>
        {/* Card display area */}
        <div style={{ 
          width: '350px',
          height: '500px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative'
        }}>
          <HolographicCardEffect
            cardId={currentCard.id}
            rarity={rarity}
            intensity={effectIntensity}
            qualityLevel={qualityLevel}
          >
            <div style={{ width: '100%', height: '100%', position: 'relative' }}>
              {/* Use SimpleHolographicCard as our primary display */}
              <SimpleHolographicCard 
                rarity={rarity}
                name={currentCard.name}
                description={currentCard.description}
                attack={currentCard.attack}
                health={currentCard.health}
                manaCost={currentCard.manaCost}
                type={currentCard.type}
              />
              
              {/* 3D-integrated stat gems with advanced cohesive movement */}
              <div className={`stat-gem attack-gem ${rarity.toLowerCase()}-card stat-gem-3d-integrated`}
                style={{
                  position: 'absolute',
                  bottom: '10%',
                  left: '12%',
                  width: '40px',
                  height: '40px',
                  zIndex: 10,
                  // Using transform to integrate with parallax movement
                  transform: 'translateZ(4px)', 
                  transformStyle: 'preserve-3d'
                }}>
                <span className="embossed-text holographic-stat-text" style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                  {currentCard.attack || (currentCard.type === 'weapon' ? currentCard.attack : '')}
                </span>
                <div className="stat-gem-shine"></div>
              </div>
              
              {/* Health/Durability stat with 3D depth integration */}
              {(currentCard.type === 'minion' || currentCard.type === 'weapon') && (
                <div className={`stat-gem health-gem ${rarity.toLowerCase()}-card stat-gem-3d-integrated`}
                  style={{
                    position: 'absolute',
                    bottom: '10%',
                    right: '12%',
                    width: '40px',
                    height: '40px',
                    zIndex: 10,
                    // Using transform to integrate with parallax movement
                    transform: 'translateZ(4px)', 
                    transformStyle: 'preserve-3d'
                  }}>
                  <span className="embossed-text holographic-stat-text" style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                    {currentCard.health}
                  </span>
                  <div className="stat-gem-shine"></div>
                </div>
              )}
              
              {/* Mana cost stat with 3D depth integration */}
              <div className={`stat-gem mana-gem ${rarity.toLowerCase()}-card stat-gem-3d-integrated`}
                style={{
                  position: 'absolute',
                  top: '10%',
                  left: '12%',
                  width: '35px',
                  height: '35px',
                  zIndex: 10,
                  // Using transform to integrate with parallax movement
                  transform: 'translateZ(6px)',
                  transformStyle: 'preserve-3d'
                }}>
                <span className="embossed-text holographic-stat-text" style={{ fontSize: '1.3rem', fontWeight: 'bold' }}>
                  {currentCard.manaCost}
                </span>
                <div className="stat-gem-shine"></div>
              </div>
              
              {/* Premium holographic shimmer overlay */}
              <div className={`holographic-shimmer ${rarity.toLowerCase()}-card`}></div>
            </div>
          </HolographicCardEffect>
        </div>
        
        {/* Controls area */}
        <div style={{ 
          padding: '20px',
          background: 'rgba(0, 0, 0, 0.5)',
          borderRadius: '12px',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
          backdropFilter: 'blur(4px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          gap: '15px',
          width: '350px'
        }}>
          <h3 className="embossed-text" style={{ textAlign: 'center', fontSize: '1.5rem', margin: '0 0 15px 0' }}>
            Holographic Controls
          </h3>
          
          {/* Rarity selector */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Card Rarity:</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              {["Legendary", "Epic", "Rare", "Common"].map(r => (
                <button 
                  key={r}
                  onClick={() => setRarity(r.toLowerCase())}
                  style={{
                    padding: '8px 12px',
                    background: rarity.toLowerCase() === r.toLowerCase() 
                      ? `var(--${r.toLowerCase()}-color, #FFD700)` 
                      : 'rgba(255, 255, 255, 0.1)',
                    color: rarity.toLowerCase() === r.toLowerCase() ? '#000' : '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    flex: 1,
                    boxShadow: rarity.toLowerCase() === r.toLowerCase() 
                      ? `0 0 10px var(--${r.toLowerCase()}-color, #FFD700)` 
                      : 'none'
                  }}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          
          {/* Quality selector */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Rendering Quality:</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              {[
                { value: 'ultra', label: 'Ultra' },
                { value: 'high', label: 'High' },
                { value: 'medium', label: 'Medium' }
              ].map(q => (
                <button 
                  key={q.value}
                  onClick={() => setQualityLevel(q.value as 'ultra' | 'high' | 'medium')}
                  style={{
                    padding: '8px 12px',
                    background: qualityLevel === q.value
                      ? '#4169E1'
                      : 'rgba(255, 255, 255, 0.1)',
                    color: qualityLevel === q.value ? '#fff' : '#ccc',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    flex: 1,
                    boxShadow: qualityLevel === q.value 
                      ? '0 0 10px rgba(65, 105, 225, 0.7)' 
                      : 'none'
                  }}
                >
                  {q.label}
                </button>
              ))}
            </div>
          </div>
          
          {/* Effect intensity slider */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              Effect Intensity: {(effectIntensity * 100).toFixed(0)}%
            </label>
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.05" 
              value={effectIntensity}
              onChange={(e) => setEffectIntensity(parseFloat(e.target.value))}
              style={{
                width: '100%',
                height: '10px',
                borderRadius: '5px',
                appearance: 'none',
                background: 'linear-gradient(to right, #1E90FF, #FFD700)',
                outline: 'none'
              }}
            />
          </div>
          
          {/* Current card details */}
          <div style={{ 
            marginTop: '10px',
            background: 'rgba(0, 0, 0, 0.3)',
            padding: '15px',
            borderRadius: '8px'
          }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '1.2rem', color: cardRarityColor(rarity) }}>
              {currentCard.name}
            </h4>
            <p style={{ margin: '0', fontSize: '0.9rem', lineHeight: '1.4' }}>
              {currentCard.description}
            </p>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              marginTop: '10px',
              fontSize: '0.9rem',
              color: '#ccc'
            }}>
              <span>Type: {capitalizeFirst(currentCard.type)}</span>
              <span>Rarity: {capitalizeFirst(rarity)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Technical description */}
      <div style={{ 
        maxWidth: '800px', 
        margin: '30px auto',
        background: 'rgba(0, 0, 0, 0.4)',
        padding: '20px',
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
      }}>
        <h3 className="embossed-text" style={{ color: '#FFD700', marginTop: 0 }}>
          Advanced Holographic Technologies
        </h3>
        <p>
          This demonstration showcases cutting-edge visual effects that exceed AAA game studio standards,
          including dynamic holographic reflections, advanced GLSL shaders, WebGL particle systems,
          and custom 3D rendering techniques with physically-based lighting models.
        </p>
        <p>
          The cards feature intelligent angle-dependent reflectivity, premium metallic textures,
          dynamic lighting response, and multi-layered parallax effects for true depth perception.
        </p>
      </div>
    </div>
  );
};

// Helper function to get color based on rarity
function cardRarityColor(rarity: string): string {
  switch(rarity.toLowerCase()) {
    case 'legendary': return '#FFD700';
    case 'epic': return '#A020F0';
    case 'rare': return '#4169E1';
    default: return '#FFFFFF';
  }
}

// Helper to capitalize first letter
function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export default HolographicCardDemo;
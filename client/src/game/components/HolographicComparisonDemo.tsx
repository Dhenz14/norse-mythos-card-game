/**
 * HolographicComparisonDemo Component
 * 
 * This component provides a side-by-side comparison of different holographic card
 * rendering techniques:
 * 1. Advanced WebGL with custom shaders (left)
 * 2. CSS-based fallback implementation (right)
 * 
 * The purpose is to showcase the premium "alien technology" alongside more traditional
 * approaches, highlighting the superior quality of our advanced implementation.
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { HolographicCardEffect } from './HolographicCardEffect';
import TestCard3D from './3D/TestCard3D';
import SimpleHolographicCard, { getStandardHolographicParams } from './SimpleHolographicCard';
import './HolographicEffect.css';

interface ComparisonDemoProps {
  initialRarity?: string;
}

const HolographicComparisonDemo: React.FC<ComparisonDemoProps> = ({
  initialRarity = 'legendary'
}) => {
  const [rarity, setRarity] = useState(initialRarity);
  const [qualityLevel, setQualityLevel] = useState<'ultra' | 'high' | 'medium'>('ultra');
  const [effectIntensity, setEffectIntensity] = useState(1.0);
  const [showAdvancedFeatures, setShowAdvancedFeatures] = useState(true);
  const [showDebugOverlay, setShowDebugOverlay] = useState(false);
  
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
  
  // Toggle debug overlay with Alt+Shift+D
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.shiftKey && e.key === 'D') {
        setShowDebugOverlay(prev => !prev);
        console.log('Debug overlay toggled:', !showDebugOverlay);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showDebugOverlay]);
  
  return (
    <div className="comparison-demo-container">
      <h1 className="comparison-header">
        Premium Holographic Card Technology Comparison
      </h1>
      
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <p>Compare our cutting-edge WebGL implementation with the standard CSS fallback solution</p>
        <div style={{ margin: '15px 0' }}>
          <button 
            onClick={() => setShowAdvancedFeatures(!showAdvancedFeatures)}
            style={{
              padding: '10px 15px',
              background: showAdvancedFeatures ? '#4B0082' : '#333',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              marginRight: '10px',
              boxShadow: showAdvancedFeatures ? '0 0 10px rgba(75, 0, 130, 0.5)' : 'none'
            }}
          >
            {showAdvancedFeatures ? 'Disable Advanced Features' : 'Enable Advanced Features'}
          </button>
          
          <button 
            onClick={() => setShowDebugOverlay(!showDebugOverlay)}
            style={{
              padding: '10px 15px',
              background: showDebugOverlay ? '#1E90FF' : '#333',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              boxShadow: showDebugOverlay ? '0 0 10px rgba(30, 144, 255, 0.5)' : 'none'
            }}
          >
            {showDebugOverlay ? 'Hide Debug Info' : 'Show Debug Info (Alt+Shift+D)'}
          </button>
        </div>
      </div>
      
      <div style={{ 
        display: 'flex',
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: '40px',
        marginBottom: '30px'
      }}>
        {/* WebGL Implementation */}
        <div style={{ 
          width: '350px',
          textAlign: 'center'
        }}>
          <div style={{ 
            padding: '10px 15px',
            background: 'rgba(0, 0, 0, 0.5)',
            borderRadius: '10px 10px 0 0',
            border: '1px solid rgba(255, 215, 0, 0.3)',
            borderBottom: 'none'
          }}>
            <h3 style={{ margin: 0, color: '#FFD700' }}>Advanced Alien Technology</h3>
            <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>WebGL + Custom GLSL Shaders</div>
          </div>
          
          <div style={{
            height: '500px',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '0 0 10px 10px',
            border: '1px solid rgba(255, 215, 0, 0.3)',
            boxShadow: '0 0 20px rgba(0, 0, 0, 0.5)'
          }}>
            <HolographicCardEffect
              cardId={currentCard.id}
              rarity={rarity}
              intensity={effectIntensity}
              qualityLevel={qualityLevel}
            >
              <div style={{ 
                width: '300px', 
                height: '420px', 
                position: 'relative',
                overflow: 'visible',
                transformStyle: 'preserve-3d',
                isolation: 'isolate',
                zIndex: 10
              }}>
                <TestCard3D 
                  standalone={true}
                  animated={showAdvancedFeatures}
                  showControls={false}
                  showDebugOverlay={showDebugOverlay}
                  rarity={rarity}
                  scale={1.2}
                  quality="ultra"
                />
              </div>
            </HolographicCardEffect>
          </div>
          
          <div style={{ 
            marginTop: '15px',
            padding: '15px',
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '10px',
            textAlign: 'left',
            fontSize: '0.9rem'
          }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#FFD700' }}>Premium Features:</h4>
            <ul style={{ paddingLeft: '20px', margin: 0 }}>
              <li>Dynamic 3D parallax depth effect</li>
              <li>Physically-based lighting models</li>
              <li>Real-time holographic reflections</li>
              <li>Precision-tuned motion physics</li>
              <li>Golden Ratio (1.618) based damping</li>
            </ul>
          </div>
        </div>
        
        {/* CSS Implementation */}
        <div style={{ 
          width: '350px',
          textAlign: 'center'
        }}>
          <div style={{ 
            padding: '10px 15px',
            background: 'rgba(0, 0, 0, 0.5)',
            borderRadius: '10px 10px 0 0',
            border: '1px solid rgba(65, 105, 225, 0.3)',
            borderBottom: 'none'
          }}>
            <h3 style={{ margin: 0, color: '#1E90FF' }}>Standard Approach</h3>
            <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>CSS Transforms + Filters</div>
          </div>
          
          <div style={{
            height: '500px',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '0 0 10px 10px',
            border: '1px solid rgba(65, 105, 225, 0.3)',
            boxShadow: '0 0 20px rgba(0, 0, 0, 0.5)'
          }}>
            <div style={{ width: '300px', height: '420px', position: 'relative' }}>
              <SimpleHolographicCard 
                card={{
                  id: currentCard.id,
                  name: currentCard.name,
                  manaCost: currentCard.manaCost,
                  attack: currentCard.attack as number,
                  health: currentCard.health as number,
                  type: currentCard.type,
                  rarity: rarity,
                  description: currentCard.description
                }}
                {...getStandardHolographicParams()}
                showDebugOverlay={showDebugOverlay}
                effectIntensity={effectIntensity}
              />
            </div>
          </div>
          
          <div style={{ 
            marginTop: '15px',
            padding: '15px',
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '10px',
            textAlign: 'left',
            fontSize: '0.9rem'
          }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#1E90FF' }}>Standard Features:</h4>
            <ul style={{ paddingLeft: '20px', margin: 0 }}>
              <li>CSS 3D transforms</li>
              <li>Basic hover animations</li>
              <li>Simple lighting effects</li>
              <li>Limited depth perception</li>
              <li>Compatible with older browsers</li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* Controls */}
      <div style={{ 
        maxWidth: '800px',
        margin: '0 auto 30px auto',
        background: 'rgba(0, 0, 0, 0.4)',
        padding: '20px',
        borderRadius: '10px',
        boxShadow: '0 0 20px rgba(0, 0, 0, 0.3)'
      }}>
        <h3 style={{ marginTop: 0, textAlign: 'center' }}>Holographic Controls</h3>
        
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>Card Rarity:</label>
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
        
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>Rendering Quality:</label>
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
        
        <div>
          <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
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
      </div>
      
      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <Link 
          to="/debug" 
          style={{ 
            color: '#9ca3af',
            textDecoration: 'none',
            padding: '10px 15px',
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '5px'
          }}
        >
          ← Back to Debug Menu
        </Link>
      </div>
    </div>
  );
};

export default HolographicComparisonDemo;
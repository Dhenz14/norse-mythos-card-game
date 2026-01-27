/**
 * AnimationDemo.tsx
 * 
 * A demo page to showcase all the available animations in the game.
 * This page allows developers to preview and test animations
 * without having to set up a full game.
 */

import React, { useState, useCallback } from 'react';
import { Button } from '../../components/ui/button';
import { Position } from '../animations/AnimationManager';
import { useAnimationStore } from '../animations/AnimationManager';
import EnhancedAttackAnimation from '../components/EnhancedAttackAnimation';
import EnhancedDeathAnimation from '../animations/EnhancedDeathAnimation';
import ParticleEffectsLayer from '../components/ParticleEffectsLayer';
import { CardData } from '../types';

const AnimationDemo: React.FC = () => {
  const [showAttackAnimation, setShowAttackAnimation] = useState(false);
  const [showDeathAnimation, setShowDeathAnimation] = useState(false);
  const [showParticleEffect, setShowParticleEffect] = useState<string | null>(null);
  
  const centerPosition: Position = { x: window.innerWidth / 2, y: window.innerHeight / 2 - 50 };
  const leftPosition: Position = { x: centerPosition.x - 200, y: centerPosition.y };
  const rightPosition: Position = { x: centerPosition.x + 200, y: centerPosition.y };
  
  // Sample card data for animations
  const sampleCard: CardData = {
    id: 999,
    name: "Ancient Watcher",
    type: "minion",
    manaCost: 2,
    attack: 4,
    health: 5,
    rarity: "rare",
    description: "Can't attack.",
    class: "Neutral"
  };
  
  const triggerAnimation = useCallback((type: string) => {
    const { addAnimation } = useAnimationStore.getState();
    
    switch (type) {
      case 'attack':
        addAnimation({
          id: `attack-${Date.now()}`,
          type: 'attack',
          sourcePosition: leftPosition,
          targetPosition: rightPosition,
          startTime: Date.now(),
          duration: 800
        });
        break;
      case 'damage':
        addAnimation({
          id: `damage-${Date.now()}`,
          type: 'damage',
          position: rightPosition,
          startTime: Date.now(),
          duration: 800,
          damage: 5
        });
        break;
      case 'heal':
        addAnimation({
          id: `heal-${Date.now()}`,
          type: 'heal',
          position: rightPosition,
          startTime: Date.now(),
          duration: 1000,
          value: 4
        });
        break;
      case 'spell':
        addAnimation({
          id: `spell-${Date.now()}`,
          type: 'spell',
          sourcePosition: leftPosition,
          targetPosition: rightPosition,
          startTime: Date.now(),
          duration: 1000,
          spellType: 'arcane'
        });
        break;
      case 'death':
        addAnimation({
          id: `death-${Date.now()}`,
          type: 'death',
          position: rightPosition,
          startTime: Date.now(),
          duration: 1000
        });
        break;
      case 'battlecry':
        addAnimation({
          id: `battlecry-${Date.now()}`,
          type: 'battlecry',
          position: leftPosition,
          startTime: Date.now(),
          duration: 1000
        });
        break;
    }
  }, [leftPosition, rightPosition]);
  
  // Handlers for complex animations
  const handleEnhancedAttack = () => {
    setShowAttackAnimation(true);
    setTimeout(() => setShowAttackAnimation(false), 2000);
  };
  
  const handleEnhancedDeath = () => {
    setShowDeathAnimation(true);
    setTimeout(() => setShowDeathAnimation(false), 3000);
  };
  
  const handleParticleEffect = (type: string) => {
    setShowParticleEffect(type);
    setTimeout(() => setShowParticleEffect(null), 2000);
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-900 to-purple-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-6">Animation Demo</h1>
      
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg mb-8">
        <h2 className="text-xl font-semibold mb-4">Basic Game Animations</h2>
        <div className="flex flex-wrap gap-4">
          <Button 
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => triggerAnimation('attack')}
          >
            Attack Animation
          </Button>
          <Button 
            className="bg-red-600 hover:bg-red-700"
            onClick={() => triggerAnimation('damage')}
          >
            Damage Animation
          </Button>
          <Button 
            className="bg-green-600 hover:bg-green-700"
            onClick={() => triggerAnimation('heal')}
          >
            Heal Animation
          </Button>
          <Button 
            className="bg-purple-600 hover:bg-purple-700"
            onClick={() => triggerAnimation('spell')}
          >
            Spell Animation
          </Button>
          <Button 
            className="bg-gray-600 hover:bg-gray-700"
            onClick={() => triggerAnimation('death')}
          >
            Death Animation
          </Button>
          <Button 
            className="bg-yellow-600 hover:bg-yellow-700"
            onClick={() => triggerAnimation('battlecry')}
          >
            Battlecry Animation
          </Button>
        </div>
      </div>
      
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg mb-8">
        <h2 className="text-xl font-semibold mb-4">Enhanced Animations</h2>
        <div className="flex flex-wrap gap-4">
          <Button 
            className="bg-orange-600 hover:bg-orange-700"
            onClick={handleEnhancedAttack}
          >
            Enhanced Attack (Melee)
          </Button>
          <Button 
            className="bg-cyan-600 hover:bg-cyan-700"
            onClick={() => {
              setShowAttackAnimation(true);
              setTimeout(() => setShowAttackAnimation(false), 2000);
            }}
          >
            Enhanced Attack (Spell)
          </Button>
          <Button 
            className="bg-violet-600 hover:bg-violet-700"
            onClick={handleEnhancedDeath}
          >
            Enhanced Death Animation
          </Button>
        </div>
      </div>
      
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg mb-8">
        <h2 className="text-xl font-semibold mb-4">Particle Effects</h2>
        <div className="flex flex-wrap gap-4">
          <Button 
            className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
            onClick={() => handleParticleEffect('fire')}
          >
            Fire Particles
          </Button>
          <Button 
            className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
            onClick={() => handleParticleEffect('frost')}
          >
            Frost Particles
          </Button>
          <Button 
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            onClick={() => handleParticleEffect('arcane')}
          >
            Arcane Particles
          </Button>
          <Button 
            className="bg-gradient-to-r from-green-600 to-lime-600 hover:from-green-700 hover:to-lime-700"
            onClick={() => handleParticleEffect('nature')}
          >
            Nature Particles
          </Button>
          <Button 
            className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700"
            onClick={() => handleParticleEffect('shadow')}
          >
            Shadow Particles
          </Button>
          <Button 
            className="bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-700 hover:to-amber-700"
            onClick={() => handleParticleEffect('holy')}
          >
            Holy Particles
          </Button>
        </div>
      </div>
      
      <div className="mt-8 text-center">
        <Button 
          className="bg-gray-600 hover:bg-gray-700"
          onClick={() => window.history.back()}
        >
          Back to Debug Menu
        </Button>
      </div>
      
      {/* Animation display area */}
      <div className="fixed inset-0 pointer-events-none">
        {showAttackAnimation && (
          <EnhancedAttackAnimation 
            sourcePosition={leftPosition}
            targetPosition={rightPosition}
            attackValue={5}
            isSpell={true}
            spellType="fire"
            onComplete={() => setShowAttackAnimation(false)}
          />
        )}
        
        {showDeathAnimation && (
          <EnhancedDeathAnimation 
            position={rightPosition}
            card={sampleCard}
            onComplete={() => setShowDeathAnimation(false)}
          />
        )}
        
        {showParticleEffect && (
          <div className="particle-container">
            {/* We'll implement the particle effects here */}
          </div>
        )}
      </div>
    </div>
  );
};

export default AnimationDemo;
/**
 * LegendaryEntrance.tsx
 * 
 * Creates a cinematic camera movement and visual effect when legendary
 * cards are played. This adds dramatic impact to high-value cards.
 */

import React, { useEffect, useState, useRef } from 'react';
import { CardData, Position } from '../types';
import { useAudio } from '../../lib/stores/useAudio';
import gsap from 'gsap';

interface LegendaryEntranceProps {
  card: CardData;
  position: Position;
  onComplete?: () => void;
}

const LegendaryEntrance: React.FC<LegendaryEntranceProps> = ({
  card,
  position,
  onComplete
}) => {
  const [visible, setVisible] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const flareRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<HTMLDivElement>(null);
  const { playSoundEffect } = useAudio();
  
  // Get card-specific effects based on the card class
  const getCardSpecificEffects = (card: CardData) => {
    const className = (card.class || card.heroClass || 'Neutral').toLowerCase();
    
    const baseEffects = {
      glowColor: '#f39c12', // Default golden glow
      particleColor: '#f1c40f',
      soundEffect: 'legendary_entrance'
    };
    
    // Customize based on class
    switch (className) {
      case 'warrior':
        return {
          ...baseEffects,
          glowColor: '#e74c3c',
          particleColor: '#c0392b'
        };
      case 'mage':
        return {
          ...baseEffects,
          glowColor: '#3498db',
          particleColor: '#2980b9'
        };
      case 'priest':
        return {
          ...baseEffects,
          glowColor: '#f39c12',
          particleColor: '#f1c40f'
        };
      case 'warlock':
        return {
          ...baseEffects,
          glowColor: '#9b59b6',
          particleColor: '#8e44ad'
        };
      case 'rogue':
        return {
          ...baseEffects,
          glowColor: '#34495e',
          particleColor: '#2c3e50'
        };
      case 'druid':
        return {
          ...baseEffects,
          glowColor: '#2ecc71',
          particleColor: '#27ae60'
        };
      case 'hunter':
        return {
          ...baseEffects,
          glowColor: '#1abc9c',
          particleColor: '#16a085'
        };
      case 'shaman':
        return {
          ...baseEffects,
          glowColor: '#3498db',
          particleColor: '#2980b9'
        };
      case 'paladin':
        return {
          ...baseEffects,
          glowColor: '#f39c12',
          particleColor: '#f1c40f'
        };
      case 'necromancer':
        return {
          ...baseEffects,
          glowColor: '#95a5a6',
          particleColor: '#7f8c8d'
        };
      default:
        return baseEffects;
    }
  };
  
  const cardEffects = getCardSpecificEffects(card);
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Play legendary entrance sound
    playSoundEffect('legendary_entrance');
    
    // Create camera movement effect
    if (containerRef.current) {
      // First zoom out
      gsap.fromTo(containerRef.current,
        { 
          background: 'rgba(0,0,0,0)',
          backdropFilter: 'blur(0px)'
        },
        { 
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(5px)',
          duration: 0.8
        }
      );
    }
    
    // Animate the card
    if (cardRef.current) {
      gsap.timeline()
        .fromTo(cardRef.current,
          { 
            opacity: 0,
            scale: 0.7,
            x: position.x - window.innerWidth / 2,
            y: position.y - window.innerHeight / 2,
            rotation: -15
          },
          { 
            opacity: 1,
            scale: 1.8,
            x: 0,
            y: 0,
            rotation: 0,
            duration: 1,
            ease: 'power2.out'
          }
        )
        .to(cardRef.current, {
          scale: 0.9,
          opacity: 0,
          y: 100,
          duration: 0.8,
          delay: 1.5,
          ease: 'back.in'
        });
    }
    
    // Animate the light flare
    if (flareRef.current) {
      gsap.timeline()
        .fromTo(flareRef.current,
          { 
            opacity: 0,
            scale: 0.1
          },
          { 
            opacity: 0.8,
            scale: 1.5,
            duration: 0.7,
            delay: 0.3,
            ease: 'power2.out'
          }
        )
        .to(flareRef.current, {
          opacity: 0,
          scale: 2.5,
          duration: 1,
          delay: 0.2
        });
    }
    
    // Create particles
    if (particlesRef.current) {
      const particles = particlesRef.current;
      particles.innerHTML = '';
      
      // Create 40 particles
      for (let i = 0; i < 40; i++) {
        const particle = document.createElement('div');
        particle.classList.add('legendary-particle');
        
        // Randomize particle properties
        const size = Math.random() * 8 + 2;
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * 200 + 100;
        const duration = Math.random() * 2 + 1.5;
        const delay = Math.random() * 0.7;
        
        // Calculate position
        const x = Math.cos(angle) * 20;
        const y = Math.sin(angle) * 20;
        const finalX = Math.cos(angle) * distance;
        const finalY = Math.sin(angle) * distance;
        
        // Create particle
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.position = 'absolute';
        particle.style.borderRadius = '50%';
        particle.style.background = cardEffects.particleColor;
        particle.style.boxShadow = `0 0 ${size}px ${cardEffects.glowColor}`;
        particle.style.opacity = '0';
        particle.style.left = '50%';
        particle.style.top = '50%';
        particle.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px)`;
        
        particles.appendChild(particle);
        
        // Animate each particle
        gsap.timeline()
          .fromTo(particle, 
            { 
              opacity: 0,
              x,
              y
            },
            { 
              opacity: 0.7,
              x,
              y,
              duration: 0.3,
              delay: delay
            }
          )
          .to(particle, {
            opacity: 0,
            x: finalX,
            y: finalY,
            duration: duration,
            ease: 'power1.out'
          });
      }
    }
    
    // Close the effect after animation completes
    gsap.delayedCall(4, () => {
      if (containerRef.current) {
        gsap.to(containerRef.current, {
          background: 'rgba(0,0,0,0)',
          backdropFilter: 'blur(0px)',
          duration: 0.5,
          onComplete: () => {
            setVisible(false);
            if (onComplete) onComplete();
          }
        });
      }
    });
  }, [card, position, playSoundEffect, onComplete, cardEffects]);
  
  if (!visible) return null;
  
  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none transition-all duration-500"
      style={{ backdropFilter: 'blur(0px)' }}
    >
      {/* Card display */}
      <div ref={cardRef} className="relative">
        {/* Card image as a placeholder (you'll want to render your actual card component here) */}
        <div 
          className="w-72 h-96 rounded-lg overflow-hidden shadow-2xl"
          style={{ 
            background: `linear-gradient(135deg, ${cardEffects.glowColor}66, #2d3436)`,
            border: `2px solid ${cardEffects.glowColor}`,
            boxShadow: `0 0 30px ${cardEffects.glowColor}`
          }}
        >
          <div className="w-full h-full flex flex-col items-center justify-center text-center p-4">
            <div className="text-xl font-bold mb-2 text-white">{card.name}</div>
            {card.cost !== undefined && (
              <div className="text-lg mb-4 text-white">Cost: {card.cost}</div>
            )}
            {card.attack !== undefined && card.health !== undefined && (
              <div className="text-lg mb-4 text-white">ATK: {card.attack} / HP: {card.health}</div>
            )}
            {card.description && (
              <div className="text-sm text-gray-200 italic">{card.description}</div>
            )}
          </div>
        </div>
        
        {/* Light flare */}
        <div 
          ref={flareRef}
          className="absolute inset-0 opacity-0 rounded-lg"
          style={{ 
            background: `radial-gradient(circle, ${cardEffects.glowColor}66 0%, rgba(0,0,0,0) 70%)`,
            transform: 'scale(1.5)'
          }}
        />
      </div>
      
      {/* Particles container */}
      <div 
        ref={particlesRef}
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
      />
    </div>
  );
};

export default LegendaryEntrance;
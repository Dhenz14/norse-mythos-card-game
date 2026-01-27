/**
 * AnimationLayer.tsx
 * 
 * A specialized component for rendering all game animations including:
 * - Attack animations with class-specific elemental trails
 * - Damage/healing effects
 * - Buff/debuff indicators
 * - Spells with environmental effects
 * - Card draw animations
 * - Death sequences
 * - Battlecry effects
 * - Turn transitions
 * - Legendary card entrances
 * 
 * This component sits above the game board and provides high-quality
 * visual feedback for all game actions.
 */

import React, { useEffect, useState } from 'react';
import { useAnimation, Animation, useAnimationStore } from '../animations/AnimationManager';
import { motion, AnimatePresence } from 'framer-motion';
import EnhancedDeathAnimation from '../animations/EnhancedDeathAnimation';
import ElementalAttackTrail from '../animations/ElementalAttackTrail';
import TurnTransition from '../animations/TurnTransition';
import EnvironmentalEffect from '../animations/EnvironmentalEffect';
import LegendaryEntrance from '../animations/LegendaryEntrance';
import { useGameStore } from '../stores/gameStore';

// Animation components for different animation types
const AttackAnimation: React.FC<{ animation: Animation }> = ({ animation }) => {
  if (!animation.position) return null;
  
  const sourcePosition = animation.position;
  const targetPosition = animation.targetPosition || { x: 0, y: 0 };
  
  // Calculate the angle of attack for proper sword orientation
  const dx = targetPosition.x - sourcePosition.x;
  const dy = targetPosition.y - sourcePosition.y;
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);
  
  // Get card class type for elemental trail (if available)
  const classType = animation.card?.class || 'Neutral';
  
  return (
    <>
      {/* Elemental attack trail based on card class */}
      <ElementalAttackTrail 
        sourcePosition={sourcePosition}
        targetPosition={targetPosition}
        classType={classType}
        duration={0.8}
      />
    
      {/* Main attack swoosh */}
      <motion.div
        style={{
          position: 'absolute',
          width: 70,
          height: 20,
          left: sourcePosition.x - 10,
          top: sourcePosition.y - 10,
          background: 'linear-gradient(90deg, rgba(255,0,0,0) 0%, rgba(255,215,0,0.8) 50%, rgba(255,255,255,1) 100%)',
          boxShadow: '0 0 10px rgba(255, 255, 255, 0.8), 0 0 20px rgba(255, 215, 0, 0.6)',
          borderRadius: '50%',
          transformOrigin: 'left center',
          transform: `rotate(${angle}deg)`,
          zIndex: 110
        }}
        animate={{
          x: [0, dx * 0.6],
          y: [0, dy * 0.6],
          opacity: [0, 1, 0],
          scale: [0.5, 1.2, 0.8]
        }}
        transition={{
          duration: animation.duration ? animation.duration / 1000 : 0.5,
          ease: "easeInOut",
          times: [0, 0.5, 1]
        }}
      />
      
      {/* Impact effect at target */}
      <motion.div
        style={{
          position: 'absolute',
          width: 50,
          height: 50,
          left: targetPosition.x - 25,
          top: targetPosition.y - 25,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,215,0,0.6) 50%, rgba(255,0,0,0.3) 100%)',
          zIndex: 105
        }}
        initial={{ opacity: 0, scale: 0.2 }}
        animate={{
          opacity: [0, 1, 0],
          scale: [0.2, 1.2, 0]
        }}
        transition={{
          duration: 0.4,
          ease: "easeOut",
          delay: animation.duration ? (animation.duration / 1000) * 0.5 : 0.3
        }}
      />
      
      {/* Sharp impact lines */}
      <motion.div
        style={{
          position: 'absolute',
          width: 60,
          height: 60,
          left: targetPosition.x - 30,
          top: targetPosition.y - 30,
          zIndex: 105
        }}
        initial={{ opacity: 0, scale: 0.2, rotate: 0 }}
        animate={{
          opacity: [0, 1, 0],
          scale: [0.2, 1, 0.8],
          rotate: 15
        }}
        transition={{
          duration: 0.3,
          ease: "easeOut",
          delay: animation.duration ? (animation.duration / 1000) * 0.6 : 0.35
        }}
      >
        {/* Create 4 impact lines in different directions */}
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={i}
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: 4,
              height: 25,
              backgroundColor: '#ffffff',
              marginLeft: -2,
              marginTop: -12.5,
              borderRadius: '2px',
              boxShadow: '0 0 5px rgba(255, 255, 255, 0.8)',
              transform: `rotate(${i * 45}deg) translateY(-15px)`
            }}
            animate={{
              scaleY: [0, 1, 0],
              opacity: [0, 1, 0]
            }}
            transition={{
              duration: 0.3,
              delay: animation.duration ? (animation.duration / 1000) * 0.6 + (i * 0.03) : 0.35 + (i * 0.03),
              ease: "easeOut"
            }}
          />
        ))}
      </motion.div>
    </>
  );
};

const DamageAnimation: React.FC<{ animation: Animation }> = ({ animation }) => {
  if (!animation.position) return null;
  
  const damageValue = animation.damage !== undefined && animation.damage !== 0 ? animation.damage : 0;
  const showValue = damageValue > 0; // Only show value if it's greater than 0
  
  return (
    <>
      {/* Blood splatter background */}
      <motion.div
        style={{
          position: 'absolute',
          width: 60,
          height: 60,
          left: animation.position.x - 30,
          top: animation.position.y - 30,
          backgroundImage: 'radial-gradient(circle, rgba(200,0,0,0.7) 0%, rgba(180,0,0,0.5) 40%, rgba(120,0,0,0) 70%)',
          borderRadius: '50%',
          zIndex: 99
        }}
        initial={{ scale: 0.2, opacity: 0 }}
        animate={{
          scale: [0.2, 1.4, 1],
          opacity: [0, 0.8, 0]
        }}
        transition={{
          duration: animation.duration ? animation.duration / 1000 : 0.8,
          ease: "anticipate"
        }}
      />
      
      {/* Damage value text with drop shadow for better visibility */}
      {showValue && (
        <motion.div
          style={{
            position: 'absolute',
            width: 50,
            height: 50,
            left: animation.position.x - 25,
            top: animation.position.y - 25,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            fontWeight: 'bold',
            fontSize: damageValue > 9 ? '28px' : '32px',
            fontFamily: '"Helvetica Neue", Arial, sans-serif',
            color: '#FFFFFF',
            textShadow: '0 0 8px #FF0000, 2px 2px 2px rgba(0,0,0,0.7)',
            zIndex: 101
          }}
          initial={{ scale: 0.3, opacity: 0 }}
          animate={{
            scale: [0.3, 1.3, 1],
            opacity: [0, 1, 0],
            y: [5, -15, -30]
          }}
          transition={{
            duration: animation.duration ? animation.duration / 1000 : 1.2,
            ease: "easeOut"
          }}
        >
          -{damageValue}
        </motion.div>
      )}
      
      {/* Impact lines */}
      <motion.div
        style={{
          position: 'absolute',
          width: 70,
          height: 70,
          left: animation.position.x - 35,
          top: animation.position.y - 35,
          zIndex: 100
        }}
        initial={{ scale: 0.3, opacity: 0 }}
        animate={{
          scale: [0.3, 1, 0.8],
          opacity: [0, 1, 0],
          rotate: [0, -10, 0]
        }}
        transition={{
          duration: animation.duration ? animation.duration / 1000 * 0.6 : 0.7,
          ease: "easeOut"
        }}
      >
        {/* Create 6 impact lines in red with varying angles */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: 3,
              height: 20 + Math.random() * 10,
              backgroundColor: '#FF0000',
              marginLeft: -1.5,
              marginTop: -15,
              borderRadius: '2px',
              boxShadow: '0 0 4px rgba(255, 0, 0, 0.7)',
              transform: `rotate(${i * 60 + (Math.random() * 10 - 5)}deg) translateY(-20px)`
            }}
            animate={{
              scaleY: [0, 1, 0.8, 0],
              opacity: [0, 1, 0.8, 0]
            }}
            transition={{
              duration: 0.5,
              delay: i * 0.03,
              ease: "easeOut"
            }}
          />
        ))}
      </motion.div>
      
      {/* Small blood droplets */}
      {showValue && damageValue > 2 && [...Array(Math.min(damageValue, 8))].map((_, i) => {
        const angle = Math.random() * Math.PI * 2;
        const distance = 20 + Math.random() * 30;
        return (
          <motion.div
            key={`drop-${i}`}
            style={{
              position: 'absolute',
              width: 4 + Math.random() * 4,
              height: 4 + Math.random() * 4,
              borderRadius: '50%',
              backgroundColor: '#FF0000',
              left: animation.position.x,
              top: animation.position.y,
              zIndex: 98
            }}
            animate={{
              x: [0, Math.cos(angle) * distance],
              y: [0, Math.sin(angle) * distance + 15],
              opacity: [0.9, 0],
              scale: [1, 0.5]
            }}
            transition={{
              duration: 0.6 + Math.random() * 0.3,
              ease: "easeOut"
            }}
          />
        );
      })}
    </>
  );
};

// Main AnimationLayer component
export const AnimationLayer: React.FC = () => {
  const { animations } = useAnimation();
  const { animations: legacyAnimations, removeAnimation } = useAnimationStore();
  
  // Clean up animations when component unmounts
  useEffect(() => {
    // Cleanup function to remove stale animations
    const cleanupStaleAnimations = () => {
      legacyAnimations.forEach(animation => {
        if (animation.endTime) return;
        
        const duration = animation.duration || 1000;
        const endTime = animation.startTime + duration;
        
        if (Date.now() > endTime) {
          removeAnimation(animation.id);
        }
      });
    };
    
    // Run immediately to clean up any existing stale animations
    cleanupStaleAnimations();
    
    // Then set interval for ongoing cleanup
    const intervalId = setInterval(cleanupStaleAnimations, 100);
    
    // Clear all animations when component unmounts to prevent memory leaks
    return () => {
      clearInterval(intervalId);
      // Force cleanup of all animations on unmount
      useAnimationStore.getState().clearAnimations();
    };
  }, []);
  
  return (
    <div className="animation-layer" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
      <AnimatePresence>
        {/* Render legacy animations */}
        {legacyAnimations.map(animation => (
          <React.Fragment key={animation.id}>
            {animation.type === 'attack' && (
              <AttackAnimation animation={animation} />
            )}
            {animation.type === 'damage' && (
              <DamageAnimation animation={animation} />
            )}
            {(animation.type === 'death' || animation.type === 'enhanced_death') && (
              <DeathAnimation animation={animation} />
            )}
            {animation.type === 'spell_damage_popup' && (
              <SpellDamagePopup animation={animation} />
            )}
            {animation.type === 'card_burn' && (
              <CardBurnPopup animation={animation} />
            )}
          </React.Fragment>
        ))}
      </AnimatePresence>
    </div>
  );
};

// All necessary imports are now at the top of the file

// Spell Damage Popup - Hearthstone-style prominent notification
const SpellDamagePopup: React.FC<{ animation: Animation }> = ({ animation }) => {
  const damage = animation.damage || animation.value || 0;
  const spellName = animation.spellName || animation.card?.name || 'Spell';
  const targetName = animation.targetName || 'target';
  
  return (
    <motion.div
      style={{
        position: 'fixed',
        top: '35%',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        pointerEvents: 'none'
      }}
      initial={{ opacity: 0, scale: 0.5, y: 20 }}
      animate={{ 
        opacity: [0, 1, 1, 1, 0],
        scale: [0.5, 1.1, 1, 1, 0.9],
        y: [20, 0, 0, 0, -20]
      }}
      transition={{ 
        duration: 3,
        times: [0, 0.1, 0.2, 0.85, 1],
        ease: "easeOut"
      }}
    >
      <div style={{
        background: 'linear-gradient(180deg, rgba(180, 40, 40, 0.95) 0%, rgba(120, 20, 20, 0.95) 100%)',
        border: '3px solid #fbbf24',
        borderRadius: '12px',
        padding: '16px 32px',
        boxShadow: '0 0 30px rgba(255, 100, 100, 0.6), 0 8px 32px rgba(0, 0, 0, 0.5)',
        textAlign: 'center',
        minWidth: '280px'
      }}>
        {/* Damage value */}
        <div style={{
          fontSize: '48px',
          fontWeight: 800,
          color: '#ffffff',
          textShadow: '0 0 20px rgba(255, 50, 50, 0.8), 2px 2px 4px rgba(0, 0, 0, 0.8)',
          lineHeight: 1
        }}>
          {damage}
        </div>
        
        {/* Damage label */}
        <div style={{
          fontSize: '14px',
          fontWeight: 600,
          color: '#fbbf24',
          textTransform: 'uppercase',
          letterSpacing: '2px',
          marginTop: '4px'
        }}>
          DAMAGE
        </div>
        
        {/* Spell name */}
        <div style={{
          fontSize: '18px',
          fontWeight: 700,
          color: '#ffffff',
          marginTop: '8px',
          textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)'
        }}>
          from {spellName}
        </div>
        
        {/* Target */}
        {targetName && targetName !== 'target' && (
          <div style={{
            fontSize: '12px',
            color: 'rgba(255, 255, 255, 0.7)',
            marginTop: '4px'
          }}>
            → {targetName}
          </div>
        )}
      </div>
    </motion.div>
  );
};

const CardBurnPopup: React.FC<{ animation: Animation }> = ({ animation }) => {
  const cardName = animation.cardName || 'Card';
  const playerId = animation.playerId || 'player';
  
  return (
    <motion.div
      style={{
        position: 'fixed',
        top: '40%',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        pointerEvents: 'none'
      }}
      initial={{ opacity: 0, scale: 0.5, y: 30 }}
      animate={{ 
        opacity: [0, 1, 1, 1, 0],
        scale: [0.5, 1.1, 1, 1, 0.9],
        y: [30, 0, 0, 0, -30]
      }}
      transition={{ 
        duration: 2.5,
        times: [0, 0.1, 0.2, 0.8, 1],
        ease: "easeOut"
      }}
    >
      <div style={{
        background: 'linear-gradient(180deg, rgba(180, 100, 40, 0.95) 0%, rgba(120, 60, 20, 0.95) 100%)',
        border: '3px solid #ff6600',
        borderRadius: '12px',
        padding: '16px 32px',
        boxShadow: '0 0 30px rgba(255, 150, 50, 0.6), 0 8px 32px rgba(0, 0, 0, 0.5)',
        textAlign: 'center',
        minWidth: '280px'
      }}>
        <div style={{
          fontSize: '32px',
          marginBottom: '8px'
        }}>
          🔥
        </div>
        
        <div style={{
          fontSize: '14px',
          fontWeight: 600,
          color: '#ff6600',
          textTransform: 'uppercase',
          letterSpacing: '2px'
        }}>
          HAND FULL
        </div>
        
        <div style={{
          fontSize: '18px',
          fontWeight: 700,
          color: '#ffffff',
          marginTop: '8px',
          textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)'
        }}>
          {cardName}
        </div>
        
        <div style={{
          fontSize: '14px',
          fontWeight: 600,
          color: '#fbbf24',
          textTransform: 'uppercase',
          letterSpacing: '2px',
          marginTop: '4px'
        }}>
          BURNED!
        </div>
      </div>
    </motion.div>
  );
};

// Death animation component
const DeathAnimation: React.FC<{ animation: Animation }> = ({ animation }) => {
  if (!animation.position) return null;
  
  // If it's an enhanced death, use the enhanced version
  if (animation.type === 'enhanced_death') {
    return (
      <EnhancedDeathAnimation 
        position={animation.position}
        card={animation.card}
        duration={animation.duration || 2500}
      />
    );
  }
  
  // Basic death animation (fallback)
  return (
    <motion.div
      style={{
        position: 'absolute',
        width: 60,
        height: 60,
        left: animation.position ? animation.position.x - 30 : 0,
        top: animation.position ? animation.position.y - 30 : 0,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(50,50,50,0.7) 0%, rgba(30,30,30,0.5) 50%, rgba(0,0,0,0) 70%)',
        zIndex: 99
      }}
      initial={{ scale: 1, opacity: 0.7 }}
      animate={{
        scale: [1, 1.5, 0],
        opacity: [0.7, 0.5, 0]
      }}
      transition={{
        duration: animation.duration ? animation.duration / 1000 : 1,
        ease: "easeOut"
      }}
    />
  );
};

export default AnimationLayer;
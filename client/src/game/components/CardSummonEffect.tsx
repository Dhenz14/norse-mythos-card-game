/**
 * CardSummonEffect.tsx
 * 
 * @deprecated This component is deprecated. Use AnimationOverlay with 
 * UnifiedAnimationOrchestrator instead:
 * 
 * import { scheduleSummonEffect } from '../animations/UnifiedAnimationOrchestrator';
 * scheduleSummonEffect(position, cardName, rarity);
 * 
 * The AnimationOverlay component handles rendering via portal automatically.
 * 
 * A dramatic Hearthstone-style animation that plays when a minion is summoned
 * to the battlefield. Features burst effects, particles, and rarity-based styling.
 * 
 * Uses React Portal to render outside of transformed containers to ensure
 * correct fixed positioning.
 */

import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface CardSummonEffectProps {
  cardName: string;
  cardRarity: 'common' | 'rare' | 'epic' | 'legendary';
  position: { x: number; y: number };
  onComplete?: () => void;
}

const rarityColors = {
  common: { primary: '#9d9d9d', secondary: '#c4c4c4', glow: 'rgba(157, 157, 157, 0.6)' },
  rare: { primary: '#0070dd', secondary: '#4da6ff', glow: 'rgba(0, 112, 221, 0.6)' },
  epic: { primary: '#a335ee', secondary: '#c77dff', glow: 'rgba(163, 53, 238, 0.6)' },
  legendary: { primary: '#ff8000', secondary: '#ffb347', glow: 'rgba(255, 128, 0, 0.8)' }
};

const CardSummonEffect: React.FC<CardSummonEffectProps> = ({
  cardName,
  cardRarity,
  position,
  onComplete
}) => {
  const [visible, setVisible] = useState(true);
  const colors = rarityColors[cardRarity] || rarityColors.common;
  const isLegendary = cardRarity === 'legendary';
  const isEpic = cardRarity === 'epic';

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onComplete?.();
    }, isLegendary ? 2000 : 1200);
    
    return () => clearTimeout(timer);
  }, [isLegendary, onComplete]);

  const particleCount = isLegendary ? 16 : isEpic ? 12 : 8;

  const effectContent = (
    <AnimatePresence>
      {visible && (
        <div
          style={{
            position: 'fixed',
            left: position.x,
            top: position.y,
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
            zIndex: 9999
          }}
        >
          {/* Central burst ring */}
          <motion.div
            initial={{ scale: 0.2, opacity: 1 }}
            animate={{ scale: 3, opacity: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              width: 100,
              height: 100,
              left: -50,
              top: -50,
              borderRadius: '50%',
              border: `4px solid ${colors.primary}`,
              boxShadow: `0 0 30px ${colors.glow}, inset 0 0 20px ${colors.glow}`
            }}
          />

          {/* Secondary ring for legendary/epic */}
          {(isLegendary || isEpic) && (
            <motion.div
              initial={{ scale: 0.3, opacity: 0.8 }}
              animate={{ scale: 4, opacity: 0 }}
              transition={{ duration: 1, ease: 'easeOut', delay: 0.1 }}
              style={{
                position: 'absolute',
                width: 80,
                height: 80,
                left: -40,
                top: -40,
                borderRadius: '50%',
                border: `2px solid ${colors.secondary}`,
                boxShadow: `0 0 20px ${colors.glow}`
              }}
            />
          )}

          {/* Particles burst outward */}
          {Array.from({ length: particleCount }).map((_, i) => {
            const angle = (i / particleCount) * 360;
            const distance = isLegendary ? 150 : 100;
            const delay = i * 0.02;
            
            return (
              <motion.div
                key={i}
                initial={{ 
                  x: 0, 
                  y: 0, 
                  scale: 1, 
                  opacity: 1 
                }}
                animate={{ 
                  x: Math.cos(angle * Math.PI / 180) * distance,
                  y: Math.sin(angle * Math.PI / 180) * distance,
                  scale: 0,
                  opacity: 0
                }}
                transition={{ 
                  duration: 0.6, 
                  ease: 'easeOut',
                  delay 
                }}
                style={{
                  position: 'absolute',
                  width: isLegendary ? 12 : 8,
                  height: isLegendary ? 12 : 8,
                  left: isLegendary ? -6 : -4,
                  top: isLegendary ? -6 : -4,
                  borderRadius: '50%',
                  background: i % 2 === 0 ? colors.primary : colors.secondary,
                  boxShadow: `0 0 10px ${colors.glow}`
                }}
              />
            );
          })}

          {/* Card name flash for epic+ */}
          {(isLegendary || isEpic) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5, y: 20 }}
              animate={{ opacity: [0, 1, 1, 0], scale: [0.5, 1.1, 1, 0.9], y: [20, 0, 0, -10] }}
              transition={{ duration: 1.2, times: [0, 0.2, 0.7, 1] }}
              style={{
                position: 'absolute',
                left: '50%',
                top: -60,
                transform: 'translateX(-50%)',
                whiteSpace: 'nowrap',
                color: colors.primary,
                fontWeight: 'bold',
                fontSize: isLegendary ? '1.5rem' : '1.25rem',
                textShadow: `0 0 20px ${colors.glow}, 0 0 40px ${colors.glow}`,
                textTransform: 'uppercase',
                letterSpacing: '2px'
              }}
            >
              {cardName}
            </motion.div>
          )}

          {/* Legendary starburst */}
          {isLegendary && (
            <>
              <motion.div
                initial={{ rotate: 0, scale: 0, opacity: 0.8 }}
                animate={{ rotate: 180, scale: 2.5, opacity: 0 }}
                transition={{ duration: 1.5, ease: 'easeOut' }}
                style={{
                  position: 'absolute',
                  width: 120,
                  height: 120,
                  left: -60,
                  top: -60,
                  background: `conic-gradient(from 0deg, transparent, ${colors.primary}40, transparent, ${colors.secondary}40, transparent)`,
                  borderRadius: '50%'
                }}
              />
              <motion.div
                initial={{ rotate: 45, scale: 0, opacity: 0.6 }}
                animate={{ rotate: -135, scale: 3, opacity: 0 }}
                transition={{ duration: 1.8, ease: 'easeOut', delay: 0.2 }}
                style={{
                  position: 'absolute',
                  width: 100,
                  height: 100,
                  left: -50,
                  top: -50,
                  background: `conic-gradient(from 45deg, transparent, ${colors.secondary}30, transparent, ${colors.primary}30, transparent)`,
                  borderRadius: '50%'
                }}
              />
            </>
          )}

          {/* Central glow pulse */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0.8 }}
            animate={{ scale: [0.5, 1.5, 0.8], opacity: [0.8, 0.4, 0] }}
            transition={{ duration: 0.6, times: [0, 0.5, 1] }}
            style={{
              position: 'absolute',
              width: 60,
              height: 60,
              left: -30,
              top: -30,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${colors.primary}80 0%, transparent 70%)`
            }}
          />
        </div>
      )}
    </AnimatePresence>
  );

  // Use React Portal to render outside of transformed containers
  // This ensures position: fixed works correctly relative to viewport
  return ReactDOM.createPortal(effectContent, document.body);
};

export default CardSummonEffect;

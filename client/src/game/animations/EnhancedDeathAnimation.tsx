import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CardData, Position } from '../types';
import { Howl } from 'howler';
import { assetPath } from '../utils/assetPath';

interface EnhancedDeathAnimationProps {
  position: Position;
  card?: CardData;
  onComplete?: () => void;
  duration?: number;
}

const EnhancedDeathAnimation: React.FC<EnhancedDeathAnimationProps> = ({
  position,
  card,
  onComplete,
  duration = 4000, // Default to 4 seconds for slow-motion effect
}) => {
  const [cardImage, setCardImage] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(true);
  const particlesRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    
    // Play enhanced death sound with multiple layers for a more dramatic effect
    // Create sound instances
    const deathSound = new Howl({
      src: [assetPath('/sounds/death.mp3'), assetPath('/sounds/death.ogg')],
      volume: 0.8,
      rate: 0.85, // Slow down the sound for a dramatic effect
    });
    
    const impactSound = new Howl({
      src: [assetPath('/sounds/explosion.mp3'), assetPath('/sounds/explosion.ogg')],
      volume: 0.6,
      rate: 0.9,
    });
    
    const magicSound = new Howl({
      src: [assetPath('/sounds/spell_cast.mp3'), assetPath('/sounds/spell_cast.ogg')],
      volume: 0.4,
      rate: 0.7,
    });
    
    // Play all sounds with slight timing differences
    deathSound.play();
    
    // Delay the impact sound slightly
    const impactTimer = setTimeout(() => {
      impactSound.play();
    }, 100);
    
    // Delay the magic sound a bit more
    const magicTimer = setTimeout(() => {
      magicSound.play();
    }, 300);
    
    // Set timer to clean up animation
    const timer = setTimeout(() => {
      setIsAnimating(false);
      if (onComplete) onComplete();
    }, duration);
    
    return () => {
      // Clear all timers
      clearTimeout(timer);
      clearTimeout(impactTimer);
      clearTimeout(magicTimer);
      
      // Stop all sounds
      deathSound.stop();
      impactSound.stop();
      magicSound.stop();
    };
  }, [card, duration, onComplete]);
  
  // Generate particles when the component mounts
  useEffect(() => {
    if (!particlesRef.current) return;
    
    const particleCount = 80; // Increased number of particles for more dramatic effect
    const container = particlesRef.current;
    
    // Clear any existing particles
    container.innerHTML = '';
    
    // Create particles
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      const size = Math.random() * 10 + 4; // Larger particles (4-14px)
      
      // Position particles randomly near the center
      const xOffset = (Math.random() - 0.5) * 120; // Wider spread horizontally
      const yOffset = (Math.random() - 0.5) * 160; // Wider spread vertically
      
      // Apply styles
      particle.style.position = 'absolute';
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;
      
      // More varied colors for particles
      const colors = [
        `rgba(255, 215, 0, ${Math.random() * 0.7 + 0.3})`, // Gold
        `rgba(255, 140, 0, ${Math.random() * 0.7 + 0.3})`, // Dark orange
        `rgba(255, 245, 210, ${Math.random() * 0.7 + 0.3})`, // Light gold
        `rgba(210, 180, 140, ${Math.random() * 0.7 + 0.3})`, // Light brown
      ];
      particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      
      particle.style.borderRadius = '50%';
      particle.style.left = `${50 + xOffset}px`;
      particle.style.top = `${70 + yOffset}px`;
      
      // Enhanced glow
      particle.style.boxShadow = '0 0 15px rgba(255, 215, 0, 0.9)';
      
      // Apply animation with slower timing for slow-motion effect
      const animDuration = Math.random() * 2.5 + 2; // 2-4.5s (much slower)
      const delay = Math.random() * 1.2; // 0-1.2s delay (more staggered)
      
      particle.style.animation = `
        particle-fade ${animDuration}s ease-out ${delay}s forwards,
        particle-float ${animDuration * 1.5}s ease-out ${delay}s forwards
      `;
      
      // Add to container
      container.appendChild(particle);
    }
    
    // Add the CSS animation keyframes
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes particle-fade {
        0% { opacity: 1; transform: scale(1); }
        100% { opacity: 0; transform: scale(0); }
      }
      
      @keyframes particle-float {
        0% { transform: translate(0, 0) rotate(0deg); }
        25% { transform: translate(
          ${Math.random() > 0.5 ? '+' : '-'}${Math.random() * 50 + 20}px, 
          ${Math.random() > 0.5 ? '+' : '-'}${Math.random() * 50 + 20}px) 
          rotate(${Math.random() * 180}deg);
        }
        50% { transform: translate(
          ${Math.random() > 0.5 ? '+' : '-'}${Math.random() * 100 + 40}px, 
          ${Math.random() > 0.5 ? '+' : '-'}${Math.random() * 100 + 40}px) 
          rotate(${Math.random() * 240}deg);
        }
        75% { transform: translate(
          ${Math.random() > 0.5 ? '+' : '-'}${Math.random() * 150 + 60}px, 
          ${Math.random() > 0.5 ? '+' : '-'}${Math.random() * 150 + 60}px) 
          rotate(${Math.random() * 300}deg);
        }
        100% { transform: translate(
          ${Math.random() > 0.5 ? '+' : '-'}${Math.random() * 200 + 100}px, 
          ${Math.random() > 0.5 ? '+' : '-'}${Math.random() * 200 + 100}px) 
          rotate(${Math.random() * 360}deg); 
        }
      }
    `;
    
    document.head.appendChild(style);
    
    // Clean up
    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, []);
  
  return (
    <AnimatePresence>
      {isAnimating && (
        <div
          className="absolute z-50 pointer-events-none"
          style={{
            left: position.x - 120, // Center the effect on the card
            top: position.y - 170
          }}
        >
          {/* Card Dissolve Effect */}
          <motion.div
            ref={cardRef}
            initial={{ opacity: 1, scale: 1 }}
            animate={{
              opacity: 0,
              scale: 0.8,
              rotateZ: Math.random() > 0.5 ? 15 : -15
            }}
            exit={{ opacity: 0 }}
            transition={{ 
              duration: duration / 1000, 
              ease: "easeOut" 
            }}
            className="relative w-[240px] h-[340px] rounded-lg overflow-hidden"
          >
            {/* Card image */}
            {cardImage && (
              <div 
                className="absolute inset-0 bg-cover bg-center"
                style={{ 
                  backgroundImage: `url(${cardImage})`,
                  filter: 'brightness(1.5) contrast(1.2)' // Enhance the glow effect
                }}
              />
            )}
            
            {/* Overlay for the dissolve effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-t from-amber-500 to-amber-200"
              style={{ mixBlendMode: 'overlay', opacity: 0.7 }}
              animate={{
                opacity: [0.7, 0.9, 0]
              }}
              transition={{
                duration: (duration / 1000) * 0.8,
                ease: "easeOut"
              }}
            />
          </motion.div>
          
          {/* Particles container */}
          <div 
            ref={particlesRef}
            className="absolute top-0 left-0 w-[240px] h-[340px]"
            style={{ zIndex: 10 }}
          />
          
          {/* Enhanced Light burst with multiple layers */}
          <motion.div
            className="absolute inset-0 rounded-full bg-amber-100"
            style={{ 
              filter: 'blur(30px)',
              top: '50%',
              left: '50%',
              width: '10px',
              height: '10px',
              marginLeft: '-5px',
              marginTop: '-5px',
              zIndex: 5
            }}
            animate={{
              width: ['10px', '400px'],
              height: ['10px', '400px'],
              marginLeft: ['-5px', '-200px'],
              marginTop: ['-5px', '-200px'],
              opacity: [1, 0]
            }}
            transition={{
              duration: (duration / 1000) * 0.8,
              ease: "easeOut"
            }}
          />
          
          {/* Secondary burst - delayed and different color */}
          <motion.div
            className="absolute inset-0 rounded-full bg-orange-300"
            style={{ 
              filter: 'blur(25px)',
              top: '50%',
              left: '50%',
              width: '5px',
              height: '5px',
              marginLeft: '-2.5px',
              marginTop: '-2.5px',
              zIndex: 6
            }}
            animate={{
              width: ['5px', '350px'],
              height: ['5px', '350px'],
              marginLeft: ['-2.5px', '-175px'],
              marginTop: ['-2.5px', '-175px'],
              opacity: [0, 0.8, 0]
            }}
            transition={{
              duration: (duration / 1000) * 0.7,
              delay: 0.1,
              ease: "easeOut",
              times: [0, 0.3, 1]
            }}
          />
          
          {/* Inner core burst - fastest and brightest */}
          <motion.div
            className="absolute inset-0 rounded-full bg-white"
            style={{ 
              filter: 'blur(15px)',
              top: '50%',
              left: '50%',
              width: '3px',
              height: '3px',
              marginLeft: '-1.5px',
              marginTop: '-1.5px',
              zIndex: 7
            }}
            animate={{
              width: ['3px', '200px'],
              height: ['3px', '200px'],
              marginLeft: ['-1.5px', '-100px'],
              marginTop: ['-1.5px', '-100px'],
              opacity: [0, 1, 0]
            }}
            transition={{
              duration: (duration / 1000) * 0.5,
              delay: 0.05,
              ease: "easeOut",
              times: [0, 0.2, 1]
            }}
          />
          
          {/* Enhanced text effect - card name with dramatic animation */}
          {card && (
            <motion.div
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 white-space-nowrap z-20"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ 
                opacity: [0, 1, 0],
                scale: [0.5, 1.5, 2.0],
                y: [0, -50, -70]
              }}
              exit={{ opacity: 0 }}
              transition={{ 
                duration: (duration / 1000) * 0.9, 
                times: [0, 0.4, 1],
                ease: "easeOut" 
              }}
              style={{ width: '240px', textAlign: 'center' }}
            >
              {/* Name with enhanced glow */}
              <div 
                className="text-2xl font-bold text-amber-100 whitespace-normal text-center mb-1"
                style={{ 
                  textShadow: '0 0 15px #ffc700, 0 0 25px #ff7b00, 0 0 35px #ff5500',
                  filter: 'brightness(1.7)'
                }}
              >
                {card.name}
              </div>
              
              {/* Death announcement */}
              <motion.div
                className="text-lg text-red-200 font-semibold"
                initial={{ opacity: 0 }}
                animate={{ 
                  opacity: [0, 1, 0]
                }}
                transition={{
                  duration: (duration / 1000) * 0.85,
                  delay: 0.1,
                  times: [0, 0.3, 1]
                }}
                style={{
                  textShadow: '0 0 10px #ff0000, 0 0 15px #aa0000'
                }}
              >
                has perished
              </motion.div>
            </motion.div>
          )}
        </div>
      )}
    </AnimatePresence>
  );
};

export default EnhancedDeathAnimation;
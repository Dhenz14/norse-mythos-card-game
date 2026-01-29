import React, { useEffect, useRef } from 'react';

interface LegendaryCardEffectProps {
  intensity?: number;
  speed?: number;
}

export const LegendaryCardEffect: React.FC<LegendaryCardEffectProps> = ({ 
  intensity = 0.6, 
  speed = 1
}) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const shineRef = useRef<HTMLDivElement>(null);
  const foilRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const overlay = overlayRef.current;
    const shine = shineRef.current;
    const foil = foilRef.current;
    
    if (!overlay || !shine || !foil || !overlay.parentElement) return;
    
    let startTime = Date.now();
    let animationFrameId: number;
    
    const mouseMoveHandler = (e: MouseEvent) => {
      if (!overlay.parentElement) return;
      
      const rect = overlay.parentElement.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      
      // Update the shine position based on mouse
      const shineX = (x - 0.5) * 2; // -1 to 1
      const shineY = (y - 0.5) * 2; // -1 to 1
      
      // Calculate the angle based on mouse position
      const angle = Math.atan2(shineY, shineX) * (180 / Math.PI);
      const distance = Math.sqrt(shineX * shineX + shineY * shineY);
      
      // Update the shine gradient position
      shine.style.background = `linear-gradient(${angle}deg, 
                               rgba(255, 215, 0, ${0.8 * distance}) 0%, 
                               rgba(255, 255, 220, ${0.9 * distance}) 50%, 
                               rgba(255, 215, 0, ${0.8 * distance}) 100%)`;
      
      // Move the foil texture
      foil.style.backgroundPosition = `${x * 100}% ${y * 100}%`;
    };
    
    const animate = () => {
      const elapsedTime = (Date.now() - startTime) * speed * 0.001;
      
      // Update overlay opacity with sine wave for subtle pulse
      const pulseIntensity = (Math.sin(elapsedTime) * 0.1) + 0.9; // 0.8 to 1.0 range
      overlay.style.opacity = (intensity * pulseIntensity).toString();
      
      // Animate the shine
      if (!shine.parentElement) return;
      const shineAngle = (elapsedTime * 30) % 360;
      
      shine.style.transform = `rotate(${shineAngle}deg) translateX(${Math.sin(elapsedTime) * 50}%)`;
      
      animationFrameId = requestAnimationFrame(animate);
    };
    
    // Add event listener
    document.addEventListener('mousemove', mouseMoveHandler);
    
    // Start animation
    animate();
    
    // Cleanup
    return () => {
      document.removeEventListener('mousemove', mouseMoveHandler);
      cancelAnimationFrame(animationFrameId);
    };
  }, [intensity, speed]);
  
  return (
    <>
      {/* Base legendary effect */}
      <div 
        ref={overlayRef}
        className="absolute inset-0 rounded-lg overflow-hidden z-1"
        style={{ 
          opacity: intensity,
          filter: 'brightness(1.3)',
          pointerEvents: 'none'
        }}
      >
        {/* Gold foil texture */}
        <div 
          ref={foilRef}
          className="absolute inset-0 w-full h-full z-3"
          style={{
            background: 'url(/textures/foil.png)',
            backgroundSize: '200% 200%',
            opacity: 0.8,
            mixBlendMode: 'color-dodge'
          }}
        />
        
        {/* Gold shine effect */}
        <div 
          ref={shineRef}
          className="absolute inset-0 w-full h-full z-2"
          style={{
            background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.3) 0%, rgba(255, 255, 220, 0.6) 50%, rgba(255, 215, 0, 0.3) 100%)',
            opacity: 0.8,
            mixBlendMode: 'overlay',
            animation: 'shine-gold 8s infinite'
          }}
        />
      </div>
      
      <style jsx>{`
        @keyframes shine-gold {
          0% { transform: translateX(-100%) translateY(-100%); }
          25% { transform: translateX(100%) translateY(-100%); }
          50% { transform: translateX(100%) translateY(100%); }
          75% { transform: translateX(-100%) translateY(100%); }
          100% { transform: translateX(-100%) translateY(-100%); }
        }
      `}</style>
    </>
  );
};

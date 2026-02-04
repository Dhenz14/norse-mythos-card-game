import React, { useEffect, useRef } from 'react';

interface HolographicCardEffectProps {
  intensity?: number;
  speed?: number;
  color?: 'purple' | 'blue' | 'gold';
}

export const HolographicCardEffect: React.FC<HolographicCardEffectProps> = ({ 
  intensity = 0.75, 
  speed = 1,
  color = 'purple'
}) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const gradientRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const overlay = overlayRef.current;
    const gradient = gradientRef.current;
    
    if (!overlay || !gradient) return;
    
    let startTime = Date.now();
    let animationFrameId: number;
    
    const mouseMoveHandler = (e: MouseEvent) => {
      if (!overlay.parentElement) return;
      
      const rect = overlay.parentElement.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      
      // Update the gradient position based on mouse
      gradient.style.backgroundPosition = `${x * 100}% ${y * 100}%`;
    };
    
    const animate = () => {
      const elapsedTime = (Date.now() - startTime) * speed * 0.001;
      
      // Update overlay opacity with sine wave for subtle pulse
      const pulseIntensity = (Math.sin(elapsedTime) * 0.1) + 0.9; // 0.8 to 1.0 range
      overlay.style.opacity = (intensity * pulseIntensity).toString();
      
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
  }, [intensity, speed, color]);
  
  const getColorStyles = () => {
    switch (color) {
      case 'purple':
        return {
          background: `linear-gradient(45deg, 
                      rgba(128, 0, 128, 0.3) 0%, 
                      rgba(200, 100, 250, 0.5) 25%, 
                      rgba(128, 0, 255, 0.3) 50%, 
                      rgba(180, 100, 220, 0.5) 75%, 
                      rgba(128, 0, 128, 0.3) 100%)`,
          backgroundSize: '200% 200%',
          mixBlendMode: 'color-dodge' as const
        };
      case 'blue':
        return {
          background: `linear-gradient(45deg, 
                      rgba(0, 50, 128, 0.3) 0%, 
                      rgba(100, 150, 250, 0.5) 25%, 
                      rgba(0, 100, 255, 0.3) 50%, 
                      rgba(100, 180, 220, 0.5) 75%, 
                      rgba(0, 50, 128, 0.3) 100%)`,
          backgroundSize: '200% 200%',
          mixBlendMode: 'color-dodge' as const
        };
      case 'gold':
        return {
          background: `linear-gradient(45deg, 
                      rgba(128, 100, 0, 0.3) 0%, 
                      rgba(250, 220, 100, 0.5) 25%, 
                      rgba(255, 215, 0, 0.3) 50%, 
                      rgba(220, 180, 100, 0.5) 75%, 
                      rgba(128, 100, 0, 0.3) 100%)`,
          backgroundSize: '200% 200%',
          mixBlendMode: 'color-dodge' as const
        };
      default:
        return {
          background: `linear-gradient(45deg, 
                      rgba(128, 0, 128, 0.3) 0%, 
                      rgba(200, 100, 250, 0.5) 25%, 
                      rgba(128, 0, 255, 0.3) 50%, 
                      rgba(180, 100, 220, 0.5) 75%, 
                      rgba(128, 0, 128, 0.3) 100%)`,
          backgroundSize: '200% 200%',
          mixBlendMode: 'color-dodge' as const
        };
    }
  };
  
  return (
    <>
      {/* Base holographic effect */}
      <div 
        ref={overlayRef}
        className="absolute inset-0 rounded-lg overflow-hidden z-1"
        style={{ 
          opacity: intensity,
          filter: 'brightness(1.2)',
          pointerEvents: 'none'
        }}
      >
        {/* Dynamic gradient overlay */}
        <div 
          ref={gradientRef}
          className="absolute inset-0 w-full h-full z-3"
          style={getColorStyles()}
        />
        
        {/* Shimmer effect */}
        <div 
          className="absolute inset-0 w-full h-full z-2"
          style={{
            background: 'url(/textures/epic_holographic.png)',
            backgroundSize: 'cover',
            opacity: 0.5,
            mixBlendMode: 'overlay'
          }}
        />
      </div>
    </>
  );
};

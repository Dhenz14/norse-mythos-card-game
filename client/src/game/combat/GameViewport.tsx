import React, { useEffect, useState, useRef } from 'react';
import './GameViewport.css';

interface GameViewportProps {
  children: React.ReactNode;
  aspectRatio?: number;
  referenceWidth?: number;
  referenceHeight?: number;
}

export const GameViewport: React.FC<GameViewportProps> = ({
  children,
  aspectRatio = 16 / 9,
  referenceWidth = 1920,
  referenceHeight = 1080
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const calculateScale = () => {
      if (!containerRef.current) return;
      
      const parent = containerRef.current.parentElement;
      if (!parent) return;
      
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      const scaleX = viewportWidth / referenceWidth;
      const scaleY = viewportHeight / referenceHeight;
      
      const newScale = Math.min(scaleX, scaleY);
      
      const scaledWidth = referenceWidth * newScale;
      const scaledHeight = referenceHeight * newScale;
      
      const offsetX = (viewportWidth - scaledWidth) / 2;
      const offsetY = (viewportHeight - scaledHeight) / 2;
      
      setScale(newScale);
      setOffset({ x: offsetX, y: offsetY });
    };

    calculateScale();
    
    window.addEventListener('resize', calculateScale);
    window.addEventListener('orientationchange', calculateScale);
    
    const resizeObserver = new ResizeObserver(calculateScale);
    if (containerRef.current?.parentElement) {
      resizeObserver.observe(containerRef.current.parentElement);
    }
    
    return () => {
      window.removeEventListener('resize', calculateScale);
      window.removeEventListener('orientationchange', calculateScale);
      resizeObserver.disconnect();
    };
  }, [referenceWidth, referenceHeight]);

  return (
    <div className="game-viewport-wrapper">
      <div 
        ref={containerRef}
        className="game-viewport"
        style={{
          width: `${referenceWidth}px`,
          height: `${referenceHeight}px`,
          transform: `scale(${scale})`,
          left: `${offset.x}px`,
          top: `${offset.y}px`,
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default GameViewport;

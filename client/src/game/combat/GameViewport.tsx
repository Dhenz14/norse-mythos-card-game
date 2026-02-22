import React, { useEffect, useState, useRef } from 'react';
import './GameViewport.css';

interface GameViewportProps {
  children: React.ReactNode;
  aspectRatio?: number;
  referenceWidth?: number;
  referenceHeight?: number;
  extraClassName?: string;
}

export const GameViewport: React.FC<GameViewportProps> = ({
  children,
  aspectRatio = 16 / 9,
  referenceWidth = 1920,
  referenceHeight = 1080,
  extraClassName = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scaleX, setScaleX] = useState(1);
  const [scaleY, setScaleY] = useState(1);

  useEffect(() => {
    const calculateScale = () => {
      if (!containerRef.current) return;

      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      setScaleX(viewportWidth / referenceWidth);
      setScaleY(viewportHeight / referenceHeight);
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
        className={`game-viewport ${extraClassName}`.trim()}
        style={{
          '--vp-scale-x': scaleX,
          '--vp-scale-y': scaleY,
          '--vp-width': `${referenceWidth}px`,
          '--vp-height': `${referenceHeight}px`,
        } as React.CSSProperties}
      >
        {children}
      </div>
    </div>
  );
};

export default GameViewport;

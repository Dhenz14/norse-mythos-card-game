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
  const [scale, setScale] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);

  useEffect(() => {
    const calculateScale = () => {
      if (!containerRef.current) return;

      const vw = window.innerWidth;
      const vh = window.innerHeight;

      const uniformScale = Math.min(vw / referenceWidth, vh / referenceHeight);
      setScale(uniformScale);
      setOffsetX((vw - referenceWidth * uniformScale) / 2);
      setOffsetY((vh - referenceHeight * uniformScale) / 2);
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
          '--vp-scale-x': scale,
          '--vp-scale-y': scale,
          '--vp-width': `${referenceWidth}px`,
          '--vp-height': `${referenceHeight}px`,
          left: `${offsetX}px`,
          top: `${offsetY}px`,
        } as React.CSSProperties}
      >
        {children}
      </div>
    </div>
  );
};

export default GameViewport;

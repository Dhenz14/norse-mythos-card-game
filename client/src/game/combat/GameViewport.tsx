import React, { useLayoutEffect, useState, useRef, useCallback } from 'react';
import './GameViewport.css';

interface GameViewportProps {
  children: React.ReactNode;
  aspectRatio?: number;
  referenceWidth?: number;
  referenceHeight?: number;
  extraClassName?: string;
}

/**
 * Compute the canvas scale + center offsets for the current window size.
 * Pure function so we can call it from a useState initializer (synchronous,
 * no flash) AND from resize/observer callbacks.
 */
function computeViewportTransform(refW: number, refH: number) {
  // SSR / test environments may not have window — fall back to 1:1.
  if (typeof window === 'undefined') {
    return { scale: 1, offsetX: 0, offsetY: 0 };
  }
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const scale = Math.min(vw / refW, vh / refH);
  return {
    scale,
    offsetX: (vw - refW * scale) / 2,
    offsetY: (vh - refH * scale) / 2,
  };
}

export const GameViewport: React.FC<GameViewportProps> = ({
  children,
  aspectRatio = 16 / 9,
  referenceWidth = 1920,
  referenceHeight = 1080,
  extraClassName = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Initial state computed SYNCHRONOUSLY from window size — no flash period
  // where scale=1 is rendered before useEffect runs. This was the root of
  // the "the page does not scale, its not responsive" bug: useState(1)
  // shipped a stale value to the first render, and on slow page loads or
  // strict-mode double-mounts the corrected value didn't always land.
  const [transform, setTransform] = useState(() =>
    computeViewportTransform(referenceWidth, referenceHeight)
  );

  const recalculate = useCallback(() => {
    setTransform(computeViewportTransform(referenceWidth, referenceHeight));
  }, [referenceWidth, referenceHeight]);

  // useLayoutEffect runs synchronously after DOM mutations but BEFORE the
  // browser paints. Combined with the synchronous initial state above, the
  // canvas is guaranteed to be at the correct scale on the very first paint.
  useLayoutEffect(() => {
    // Recompute once on mount to catch any window size that changed between
    // module evaluation and component mount (rare but real).
    recalculate();

    // Belt-and-suspenders: requestAnimationFrame fallback for the next frame
    // in case fonts/images load late and reflow the parent container.
    const rafId = window.requestAnimationFrame(recalculate);

    window.addEventListener('resize', recalculate);
    window.addEventListener('orientationchange', recalculate);

    let resizeObserver: ResizeObserver | undefined;
    if (containerRef.current?.parentElement && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(recalculate);
      resizeObserver.observe(containerRef.current.parentElement);
    }

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener('resize', recalculate);
      window.removeEventListener('orientationchange', recalculate);
      resizeObserver?.disconnect();
    };
  }, [recalculate]);

  const { scale, offsetX, offsetY } = transform;

  // CSS custom property values must be strings for React to set them
  // reliably across browsers — passing a raw number for `--vp-scale-x`
  // works in Chrome but Firefox/Safari occasionally drop it. Always
  // String() it. Same applies to width/height vars.
  const scaleStr = String(scale);
  const widthStr = `${referenceWidth}px`;
  const heightStr = `${referenceHeight}px`;

  return (
    <div className="game-viewport-wrapper">
      <div
        ref={containerRef}
        className={`game-viewport ${extraClassName}`.trim()}
        style={{
          '--vp-scale-x': scaleStr,
          '--vp-scale-y': scaleStr,
          '--vp-width': widthStr,
          '--vp-height': heightStr,
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

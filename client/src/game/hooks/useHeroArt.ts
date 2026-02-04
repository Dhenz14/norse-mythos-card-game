/**
 * useHeroArt Hook
 * React hook for resolving hero/king artwork from the art mapping
 * Follows TSX → Hook → Utils architecture pattern
 */

import { useMemo } from 'react';
import { getCharacterArtPath } from '../utils/art';

interface UseHeroArtResult {
  artPath: string | null;
  hasArt: boolean;
}

/**
 * Hook to resolve artwork for a hero or king
 * @param heroId - The hero or king ID (e.g., 'hero-odin', 'king-ymir')
 * @param explicitPortrait - Optional explicit portrait path to override
 * @returns Art path and whether art is available
 */
export function useHeroArt(
  heroId?: string,
  explicitPortrait?: string
): UseHeroArtResult {
  return useMemo(() => {
    if (explicitPortrait) {
      return { artPath: explicitPortrait, hasArt: true };
    }
    
    if (!heroId) {
      return { artPath: null, hasArt: false };
    }
    
    const artPath = getCharacterArtPath(heroId);
    return { artPath, hasArt: artPath !== null };
  }, [heroId, explicitPortrait]);
}

/**
 * Get the resolved art source with fallback logic
 * Returns the best available image source
 */
export function useResolvedArtSrc(
  heroId?: string,
  explicitPortrait?: string
): string | null {
  const { artPath } = useHeroArt(heroId, explicitPortrait);
  return artPath;
}

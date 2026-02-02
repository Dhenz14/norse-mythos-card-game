/**
 * useArtManager Hook
 * Manages art metadata loading, filtering, and grouping by character
 * 
 * Architecture: Hook layer - uses utils for pure logic
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import type { ArtCard, ArtMetadata, CharacterGroup, ArtFilters } from '../utils/art';
import { 
  groupByCharacter, 
  filterArtCards, 
  getUniqueValues,
  findCardById,
  getCharacterCards,
  getArtImageUrl,
  parseMetadata 
} from '../utils/art';

interface UseArtManagerOptions {
  useLocalImages?: boolean;
}

interface UseArtManagerReturn {
  cards: ArtCard[];
  isLoading: boolean;
  error: string | null;
  filters: ArtFilters;
  setFilters: React.Dispatch<React.SetStateAction<ArtFilters>>;
  filteredCards: ArtCard[];
  characterGroups: CharacterGroup[];
  filterOptions: {
    factions: string[];
    elements: string[];
    pieces: string[];
    categories: string[];
  };
  getImageUrl: (card: ArtCard) => string;
  findCard: (id: string) => ArtCard | undefined;
  getCharacterArt: (character: string) => ArtCard[];
  metadata: ArtMetadata | null;
}

const defaultFilters: ArtFilters = {
  search: '',
  faction: 'all',
  element: 'all',
  piece: 'all',
  category: 'all',
};

export function useArtManager(options: UseArtManagerOptions = {}): UseArtManagerReturn {
  const { useLocalImages = true } = options;
  
  const [metadata, setMetadata] = useState<ArtMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ArtFilters>(defaultFilters);

  useEffect(() => {
    async function loadMetadata() {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch('/art/metadata.json');
        if (!response.ok) {
          throw new Error(`Failed to load art metadata: ${response.status}`);
        }
        
        const json = await response.json();
        const parsed = parseMetadata(json);
        
        if (!parsed) {
          throw new Error('Invalid metadata format');
        }
        
        setMetadata(parsed);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load art');
      } finally {
        setIsLoading(false);
      }
    }
    
    loadMetadata();
  }, []);

  const cards = useMemo(() => metadata?.cards ?? [], [metadata]);

  const filteredCards = useMemo(() => {
    return filterArtCards(cards, filters);
  }, [cards, filters]);

  const characterGroups = useMemo(() => {
    return groupByCharacter(filteredCards);
  }, [filteredCards]);

  const filterOptions = useMemo(() => {
    return getUniqueValues(cards);
  }, [cards]);

  const getImageUrl = useCallback((card: ArtCard) => {
    return getArtImageUrl(card, useLocalImages);
  }, [useLocalImages]);

  const findCard = useCallback((id: string) => {
    return findCardById(cards, id);
  }, [cards]);

  const getCharacterArt = useCallback((character: string) => {
    return getCharacterCards(cards, character);
  }, [cards]);

  return {
    cards,
    isLoading,
    error,
    filters,
    setFilters,
    filteredCards,
    characterGroups,
    filterOptions,
    getImageUrl,
    findCard,
    getCharacterArt,
    metadata,
  };
}

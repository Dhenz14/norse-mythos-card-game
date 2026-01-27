import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import './CardPreview.css';

interface CardPreviewData {
  id: number | string;
  name: string;
  manaCost: number;
  attack?: number;
  health?: number;
  type: string;
  rarity: string;
  description?: string;
  class?: string;
  race?: string;
  tribe?: string;
  keywords?: string[];
}

interface CardPreviewProps {
  card: CardPreviewData | null;
  isVisible: boolean;
  mousePosition: { x: number; y: number };
  onClose?: () => void;
}

const PREVIEW_WIDTH = 320;
const PREVIEW_HEIGHT = 450;
const VIEWPORT_PADDING = 20;
const HOVER_DELAY = 150;

const getRarityColor = (rarity: string): string => {
  switch (rarity?.toLowerCase()) {
    case 'legendary':
      return '#ff8c00';
    case 'epic':
      return '#a855f7';
    case 'rare':
      return '#3b82f6';
    default:
      return '#6b7280';
  }
};

const getRarityGlow = (rarity: string): string => {
  switch (rarity?.toLowerCase()) {
    case 'legendary':
      return '0 0 20px rgba(255, 140, 0, 0.6), 0 0 40px rgba(255, 140, 0, 0.3)';
    case 'epic':
      return '0 0 20px rgba(168, 85, 247, 0.6), 0 0 40px rgba(168, 85, 247, 0.3)';
    case 'rare':
      return '0 0 20px rgba(59, 130, 246, 0.6), 0 0 40px rgba(59, 130, 246, 0.3)';
    default:
      return '0 0 15px rgba(0, 0, 0, 0.5)';
  }
};

export const CardPreview: React.FC<CardPreviewProps> = ({
  card,
  isVisible,
  mousePosition,
}) => {
  const [cardImage, setCardImage] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isVisible && card) {
      hoverTimerRef.current = setTimeout(() => {
        setShowPreview(true);
      }, HOVER_DELAY);
    } else {
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
        hoverTimerRef.current = null;
      }
      setShowPreview(false);
    }

    return () => {
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
      }
    };
  }, [isVisible, card]);

  // Card preview images now use placeholder logic (Cloudinary service removed)

  if (!showPreview || !card) {
    return null;
  }

  const calculatePosition = () => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    let x = mousePosition.x + 20;
    let y = mousePosition.y - PREVIEW_HEIGHT / 2;

    if (x + PREVIEW_WIDTH + VIEWPORT_PADDING > viewportWidth) {
      x = mousePosition.x - PREVIEW_WIDTH - 20;
    }

    if (y < VIEWPORT_PADDING) {
      y = VIEWPORT_PADDING;
    } else if (y + PREVIEW_HEIGHT + VIEWPORT_PADDING > viewportHeight) {
      y = viewportHeight - PREVIEW_HEIGHT - VIEWPORT_PADDING;
    }

    return { x, y };
  };

  const position = calculatePosition();
  const rarityColor = getRarityColor(card.rarity);
  const rarityGlow = getRarityGlow(card.rarity);
  const isMinion = card.type?.toLowerCase() === 'minion';
  const raceText = card.race || card.tribe || '';

  const portalContent = (
    <div
      ref={containerRef}
      className="card-preview-portal"
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        width: PREVIEW_WIDTH,
        height: PREVIEW_HEIGHT,
        zIndex: 99999,
        pointerEvents: 'none',
      }}
    >
      <div
        className="card-preview-container"
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '16px',
          border: `4px solid ${rarityColor}`,
          boxShadow: rarityGlow,
          background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          animation: 'cardPreviewFadeIn 0.15s ease-out',
        }}
      >
        <div
          className="card-preview-mana"
          style={{
            position: 'absolute',
            top: -8,
            left: -8,
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: 'radial-gradient(circle at 40% 40%, #4169E1 0%, #1E40AF 60%, #0D2473 100%)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            boxShadow: '0 0 15px rgba(66, 153, 225, 0.8), inset 0 -2px 4px rgba(0,0,0,0.5)',
            border: '3px solid #1e3a8a',
            zIndex: 10,
          }}
        >
          <span style={{
            color: '#fff',
            fontSize: '24px',
            fontWeight: 800,
            textShadow: '0 2px 4px rgba(0,0,0,0.8)',
          }}>
            {card.manaCost}
          </span>
        </div>

        <div
          className="card-preview-art"
          style={{
            width: '100%',
            height: '55%',
            position: 'relative',
            overflow: 'hidden',
            background: '#0a0a1a',
          }}
        >
          {cardImage ? (
            <img
              src={cardImage}
              alt={card.name}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                opacity: imageLoaded ? 1 : 0,
                transition: 'opacity 0.2s ease',
              }}
              onLoad={() => setImageLoaded(true)}
            />
          ) : (
            <div style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#666',
              fontSize: '14px',
            }}>
              Loading...
            </div>
          )}
        </div>

        <div
          className="card-preview-name-banner"
          style={{
            width: '100%',
            padding: '8px 16px',
            background: `linear-gradient(180deg, ${rarityColor}22 0%, ${rarityColor}44 100%)`,
            borderTop: `2px solid ${rarityColor}`,
            borderBottom: `2px solid ${rarityColor}`,
            textAlign: 'center',
          }}
        >
          <span style={{
            color: '#fff',
            fontSize: '18px',
            fontWeight: 700,
            textShadow: '0 2px 4px rgba(0,0,0,0.8)',
            letterSpacing: '0.5px',
          }}>
            {card.name}
          </span>
        </div>

        <div
          className="card-preview-description"
          style={{
            flex: 1,
            padding: '12px 16px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            alignItems: 'center',
            textAlign: 'center',
          }}
        >
          <p style={{
            color: '#e2e8f0',
            fontSize: '14px',
            fontWeight: 500,
            lineHeight: 1.4,
            margin: 0,
            textShadow: '0 1px 2px rgba(0,0,0,0.5)',
          }}>
            {card.description || 'No description'}
          </p>
          
          {raceText && (
            <span style={{
              marginTop: '8px',
              color: '#94a3b8',
              fontSize: '12px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '1px',
            }}>
              {raceText}
            </span>
          )}
        </div>

        {isMinion && (
          <>
            <div
              className="card-preview-attack"
              style={{
                position: 'absolute',
                bottom: -8,
                left: -8,
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: 'radial-gradient(circle at 40% 40%, #fbbf24 0%, #b45309 60%, #78350f 100%)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                boxShadow: '0 0 15px rgba(251, 191, 36, 0.6), inset 0 -2px 4px rgba(0,0,0,0.5)',
                border: '3px solid #92400e',
                zIndex: 10,
              }}
            >
              <span style={{
                color: '#fff',
                fontSize: '24px',
                fontWeight: 800,
                textShadow: '0 2px 4px rgba(0,0,0,0.8)',
              }}>
                {card.attack ?? 0}
              </span>
            </div>

            <div
              className="card-preview-health"
              style={{
                position: 'absolute',
                bottom: -8,
                right: -8,
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: 'radial-gradient(circle at 40% 40%, #ef4444 0%, #b91c1c 60%, #7f1d1d 100%)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                boxShadow: '0 0 15px rgba(239, 68, 68, 0.6), inset 0 -2px 4px rgba(0,0,0,0.5)',
                border: '3px solid #991b1b',
                zIndex: 10,
              }}
            >
              <span style={{
                color: '#fff',
                fontSize: '24px',
                fontWeight: 800,
                textShadow: '0 2px 4px rgba(0,0,0,0.8)',
              }}>
                {card.health ?? 0}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );

  return createPortal(portalContent, document.body);
};

interface UseCardPreviewReturn {
  previewProps: {
    card: CardPreviewData | null;
    isVisible: boolean;
    mousePosition: { x: number; y: number };
  };
  showPreview: (card: CardPreviewData, e: React.MouseEvent) => void;
  hidePreview: () => void;
  updateMousePosition: (e: React.MouseEvent) => void;
}

export const useCardPreview = (): UseCardPreviewReturn => {
  const [previewCard, setPreviewCard] = useState<CardPreviewData | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const showPreview = (card: CardPreviewData, e: React.MouseEvent) => {
    setPreviewCard(card);
    setMousePosition({ x: e.clientX, y: e.clientY });
    setIsVisible(true);
  };

  const hidePreview = () => {
    setIsVisible(false);
  };

  const updateMousePosition = (e: React.MouseEvent) => {
    setMousePosition({ x: e.clientX, y: e.clientY });
  };

  return {
    previewProps: {
      card: previewCard,
      isVisible,
      mousePosition,
    },
    showPreview,
    hidePreview,
    updateMousePosition,
  };
};

export default CardPreview;

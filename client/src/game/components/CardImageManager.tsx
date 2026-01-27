import React, { useState, useEffect } from 'react';

interface CardImageManagerProps {
  cardId: string | number;
  cardName: string;
  rarity?: string;
  type?: string;
  isLegendary?: boolean;
  width?: number;
  height?: number;
  quality?: string | number;
  className?: string;
  fallbackStyles?: React.CSSProperties;
  onLoadSuccess?: (url: string) => void;
  onLoadError?: (error: string) => void;
}

/**
 * CardImageManager handles loading and displaying card images with proper fallbacks
 * 
 * This component manages its own loading state and error handling. It displays
 * a stylized fallback when the image fails to load, and allows parent components
 * to be notified of loading success/failure.
 */
const CardImageManager: React.FC<CardImageManagerProps> = ({
  cardId,
  cardName,
  rarity = 'common',
  type = 'minion',
  isLegendary = false,
  width = 250,
  height = 175,
  quality = 'auto',
  className = '',
  fallbackStyles = {},
  onLoadSuccess,
  onLoadError
}) => {
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);

  // Placeholder logic (Cloudinary service removed)
  const imageSrc: string | null = null;
  const isLoading = false;
  const error = null;

  // Notify parent component about load status changes
  useEffect(() => {
    if (!isLoading) {
      if (error) {
        console.error(`[CardImageManager] Failed to load image for card: ${cardName} (${cardId})`);
        if (onLoadError) onLoadError(error);
      } else if (imageSrc && imageLoaded) {
        console.log(`[CardImageManager] Successfully loaded image for card: ${cardName} (${cardId})`);
        if (onLoadSuccess) onLoadSuccess(imageSrc);
      }
    }
  }, [isLoading, error, imageSrc, imageLoaded, cardId, cardName, onLoadSuccess, onLoadError]);

  // Generate background gradient based on rarity
  const getBackgroundGradient = () => {
    switch (rarity) {
      case 'legendary':
        return 'linear-gradient(135deg, #331800 0%, #604000 100%)';
      case 'epic':
        return 'linear-gradient(135deg, #330066 0%, #660099 100%)';
      case 'rare':
        return 'linear-gradient(135deg, #003366 0%, #0066cc 100%)';
      default:
        return 'linear-gradient(135deg, #222222 0%, #444444 100%)';
    }
  };

  // Generate text color based on rarity
  const getTextColor = () => {
    switch (rarity) {
      case 'legendary':
        return '#ffde7a';
      case 'epic':
        return '#d8abff';
      default:
        return 'white';
    }
  };

  return (
    <div 
      className={`card-image-container ${className}`} 
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        borderRadius: '4px',
        backgroundColor: '#111',
        ...fallbackStyles
      }}
    >
      {/* Stylized fallback background */}
      <div 
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '8px',
          backgroundImage: getBackgroundGradient(),
          zIndex: 1
        }}
      >
        <div 
          style={{
            fontSize: '14px',
            fontWeight: 'bold',
            color: getTextColor(),
            textAlign: 'center',
            textTransform: 'uppercase',
            textShadow: '0px 1px 2px rgba(0,0,0,0.8)',
            letterSpacing: '0.5px'
          }}
        >
          {cardName}
        </div>
        <div 
          style={{
            marginTop: '4px',
            fontSize: '10px',
            color: 'rgba(255,255,255,0.7)',
            textAlign: 'center'
          }}
        >
          {type === 'minion' 
            ? 'Minion' 
            : type === 'spell' 
              ? 'Spell' 
              : type === 'weapon' 
                ? 'Weapon' 
                : 'Card'}
        </div>
      </div>

      {/* The actual card image */}
      {imageSrc && (
        <img 
          src={imageSrc} 
          alt={cardName}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            position: 'relative',
            zIndex: imageLoaded ? 2 : 0, // Show image only if loaded successfully
            transition: 'opacity 0.3s ease-in-out',
            opacity: imageLoaded ? 1 : 0
          }}
          onLoad={() => {
            console.log(`[CardImageManager] Image loaded for: ${cardName}`);
            setImageLoaded(true);
          }}
          onError={(e) => {
            console.error(`[CardImageManager] Failed to load image: ${imageSrc}`, e);
            setImageLoaded(false);
          }}
        />
      )}

      {/* Loading indicator */}
      {isLoading && !imageLoaded && (
        <div 
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0,0,0,0.3)',
            zIndex: 3
          }}
        >
          <div 
            style={{
              width: '20px',
              height: '20px',
              border: '2px solid rgba(255,255,255,0.3)',
              borderTopColor: getTextColor(),
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}
          />
        </div>
      )}
      
      {/* Add animation for the spinner */}
      <style>
        {`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default CardImageManager;
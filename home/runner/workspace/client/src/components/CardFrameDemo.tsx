import React, { useState, useEffect } from 'react';
import CardFrame from './CardFrame';

// Define our card type for the demo
interface DemoCard {
  id: number;
  name: string;
  attack: number;
  health: number;
  manaCost: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  keywords: string[];
  description: string;
}

/**
 * A demo component to showcase different card frames with various rarities and stats
 */
const CardFrameDemo: React.FC = () => {
  const [cardImages, setCardImages] = useState<Record<number, string>>({});
  
  // Sample card data to demonstrate different variations
  const demoCards: DemoCard[] = [
    {
      id: 20111, // Stalagg
      name: 'Stalagg',
      attack: 7,
      health: 4,
      manaCost: 5,
      rarity: 'legendary',
      keywords: ['Deathrattle'],
      description: 'Deathrattle: If Feugen also died this game, summon Thaddius.'
    },
    {
      id: 5016, // Arcanologist
      name: 'Arcanologist',
      attack: 2, 
      health: 3,
      manaCost: 2,
      rarity: 'common',
      keywords: ['Battlecry'],
      description: 'Battlecry: Draw a Secret from your deck.'
    },
    {
      id: 20030, // Malygos
      name: 'Malygos',
      attack: 4,
      health: 12,
      manaCost: 9,
      rarity: 'epic',
      keywords: ['Spell Damage +5'],
      description: 'Your spells deal 5 additional damage. The essence of magic flows through this ancient dragon.'
    },
    {
      id: 20007, // Felfire Deadeye
      name: 'Felfire Deadeye',
      attack: 2,
      health: 3,
      manaCost: 2,
      rarity: 'rare',
      keywords: ['Corrupt'],
      description: 'Your Hero Power costs (1) less. Corrupt: And costs (0) on your next turn.'
    }
  ];

  // Fetch card images from API
  useEffect(() => {
    const fetchCardImages = async () => {
      try {
        const imageData: Record<number, string> = {};
        
        // Fetch images for each card
        for (const card of demoCards) {
          const response = await fetch(`/api/cloudinary/card/${card.id}`);
          if (response.ok) {
            const data = await response.json();
            imageData[card.id] = data.url;
          }
        }
        
        setCardImages(imageData);
      } catch (error) {
        console.error('Failed to fetch card images:', error);
      }
    };
    
    fetchCardImages();
  }, []);

  // Default fallback image in case API fails
  const defaultCardImage = '/assets/card_back.png';
  
  // Rarity colors for labels
  const rarityColors: Record<string, string> = {
    common: '#8c8c8c', // gray
    rare: '#0070dd',   // blue
    epic: '#a335ee',   // purple
    legendary: '#ff8000' // orange
  };
  
  return (
    <div className="card-demo-container" style={{ 
      padding: '20px',
      display: 'flex',
      flexWrap: 'wrap',
      gap: '15px',
      justifyContent: 'center',
      background: '#2a3439', // Darker background for better contrast
      minHeight: '100vh',
      alignItems: 'center'
    }}>
      <h1 style={{ 
        width: '100%', 
        textAlign: 'center', 
        color: 'white',
        marginBottom: '20px'
      }}>
        Epic vs Legendary Card Comparison
      </h1>
      
      <div style={{ width: '100%', maxWidth: '800px', textAlign: 'center', color: '#aaa', marginBottom: '20px', fontSize: '14px' }}>
        Distinct holographic effects for different rarities with full-card coverage and unique color schemes
      </div>
      
      {Object.keys(cardImages).length === 0 ? (
        <div style={{ color: 'white', fontSize: '18px', textAlign: 'center' }}>
          Loading card images...
        </div>
      ) : (
        <div style={{ 
          display: 'flex',
          flexWrap: 'wrap',
          gap: '30px',
          justifyContent: 'center',
          maxWidth: '900px'
        }}>
          {demoCards
            .filter(card => card.rarity === 'legendary' || card.rarity === 'epic')
            .map(card => (
            <div key={card.id} style={{ 
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '10px',
              backgroundColor: 'rgba(0,0,0,0.2)',
              borderRadius: '8px',
              boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
            }}>
              <CardFrame
                name={card.name}
                attack={card.attack}
                health={card.health}
                rarity={card.rarity}
                imageSrc={cardImages[card.id] || defaultCardImage}
                keywords={card.keywords}
                description={card.description}
                onClick={() => console.log(`Clicked on ${card.name}`)}
              />
              <div style={{ 
                textAlign: 'center', 
                color: rarityColors[card.rarity] || 'white',
                marginTop: '8px',
                fontSize: '13px',
                fontWeight: 'bold'
              }}>
                {card.rarity.charAt(0).toUpperCase() + card.rarity.slice(1)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CardFrameDemo;
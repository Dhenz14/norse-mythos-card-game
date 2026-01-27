import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import CardImageUploader from '../components/CardImageUploader';
import { CardData } from '../types';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';

// Import the actual Card component for rendering full cards
import { Card } from '../components/Card';

// Component to handle displaying full card renders with proper error states
interface CardImageDisplayProps {
  cardId: string | number;
  cardName: string;
  cardData: CardData;
  width?: number;
  height?: number;
}

export const CardImageDisplay: React.FC<CardImageDisplayProps> = ({ 
  cardId, 
  cardName,
  cardData,
  width = 250,
  height = 350
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if the card image is available by making a request to the API
    const checkCardImage = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/cloudinary/card/${cardId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch image URL');
        }
        
        const data = await response.json();
        if (!data.url) {
          setError('No image available');
        }
      } catch (err) {
        console.error('Error checking card image:', err);
        setError('Error loading image');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkCardImage();
  }, [cardId]);

  // Loading state with animated gradient
  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="animate-pulse bg-gradient-to-r from-gray-200 to-gray-300 w-full h-full rounded-lg"></div>
      </div>
    );
  }

  // Error state with retry button
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full text-gray-500 gap-2">
        <p>No image available</p>
        <button 
          className="text-xs text-blue-500 hover:underline"
          onClick={() => {
            setIsLoading(true);
            setError(null);
            // Force a re-check of the image
            setTimeout(() => {
              setIsLoading(false);
            }, 1000);
          }}
        >
          Try again
        </button>
      </div>
    );
  }

  // Render the full card with proper styling
  return (
    <div className="w-full h-full flex justify-center items-center">
      <div style={{ transform: 'scale(0.85)', transformOrigin: 'center' }}>
        <Card 
          card={cardData} 
          scale={1}
          className="card-preview"
        />
      </div>
    </div>
  );
};

// Import card data files and card registry to get all registered cards
import { neutralMinions } from '../data/neutralMinions';
import { classMinions } from '../data/classMinions';
import finalLegendaryCards from '../data/finalLegendaryCards';
import { getAllCards } from '../data/cardManagement/cardRegistry';
import { initializeCardDatabase } from '../data/cardManagement/initializeCards';

const CardImageManager: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCard, setSelectedCard] = useState<CardData | null>(null);
  const [allCards, setAllCards] = useState<CardData[]>([]);
  const [filteredCards, setFilteredCards] = useState<CardData[]>([]);
  
  // Load all cards on mount
  useEffect(() => {
    // Initialize the card database to ensure all cards are registered
    initializeCardDatabase();
    
    // Combine cards from different sources
    const staticCards = [
      ...neutralMinions,
      ...classMinions,
      ...finalLegendaryCards
    ];
    
    // Get dynamically registered cards from the registry
    const registeredCards = getAllCards();
    
    // Combine all cards
    const cards = [...staticCards, ...registeredCards];
    
    // Remove duplicates based on card ID
    const uniqueCards = Array.from(
      new Map(cards.map(card => [card.id, card])).values()
    );
    
    setAllCards(uniqueCards);
    setFilteredCards(uniqueCards);
    
    console.log(`Loaded ${uniqueCards.length} unique cards for Card Image Manager`);
  }, []);
  
  // Filter cards when search term changes
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredCards(allCards);
      return;
    }
    
    const term = searchTerm.toLowerCase();
    const filtered = allCards.filter(card => 
      card.name.toLowerCase().includes(term) || 
      (card.id && card.id.toString().includes(term)) ||
      (card.class && card.class.toLowerCase().includes(term))
    );
    
    setFilteredCards(filtered);
  }, [searchTerm, allCards]);
  
  const handleCardSelect = (card: CardData) => {
    setSelectedCard(card);
  };
  
  const handleUploadSuccess = (imageUrl: string) => {
    // Force refresh the component to show the newly uploaded image
    setSelectedCard({...selectedCard!});
    // Show success message
    alert(`Image uploaded successfully!`);
  };
  
  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Card Image Manager</h1>
        <Link to="/">
          <Button variant="outline">Back to Home</Button>
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Left Column - Card Search */}
        <div className="border rounded p-4">
          <h2 className="text-xl font-semibold mb-3">Find a Card</h2>
          
          <Input
            placeholder="Search by name, ID, or class..."
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            className="mb-2"
          />
          
          {/* Quick search buttons */}
          <div className="flex flex-wrap gap-2 mb-4">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => setSearchTerm("jormungandr")}
              className="text-xs"
            >
              Find Jormungandr
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => setSearchTerm("norse")}
              className="text-xs"
            >
              Norse Cards
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => setSearchTerm("legendary")}
              className="text-xs"
            >
              Legendary Cards
            </Button>
          </div>
          
          <div className="h-[calc(100vh-250px)] overflow-y-auto border rounded">
            {filteredCards.length > 0 ? (
              <div className="divide-y">
                {filteredCards.map(card => (
                  <div 
                    key={card.id}
                    className={`p-2 cursor-pointer hover:bg-gray-100 ${selectedCard?.id === card.id ? 'bg-blue-100' : ''}`}
                    onClick={() => handleCardSelect(card)}
                  >
                    <div className="font-medium">{card.name}</div>
                    <div className="text-sm text-gray-600">
                      ID: {card.id} • {card.type || 'Unknown'} • {card.class || 'Neutral'}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-gray-500">
                No cards found matching "{searchTerm}"
              </div>
            )}
          </div>
        </div>
        
        {/* Middle Column - Selected Card Details */}
        <div className="border rounded p-4">
          <h2 className="text-xl font-semibold mb-3">Card Details</h2>
          
          {selectedCard ? (
            <div>
              <div className="mb-4">
                <h3 className="text-lg font-bold">{selectedCard.name}</h3>
                <div className="grid grid-cols-2 gap-2 text-sm mt-2">
                  <div><span className="font-medium">ID:</span> {selectedCard.id}</div>
                  <div><span className="font-medium">Type:</span> {selectedCard.type || 'Unknown'}</div>
                  <div><span className="font-medium">Class:</span> {selectedCard.class || 'Neutral'}</div>
                  <div><span className="font-medium">Rarity:</span> {selectedCard.rarity || 'Common'}</div>
                  <div><span className="font-medium">Attack:</span> {selectedCard.attack || 'N/A'}</div>
                  <div><span className="font-medium">Health:</span> {selectedCard.health || 'N/A'}</div>
                  <div className="col-span-2"><span className="font-medium">Race:</span> {selectedCard.race || 'None'}</div>
                  <div className="col-span-2">
                    <span className="font-medium">Description:</span> {selectedCard.description || 'None'}
                  </div>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h3 className="text-lg font-medium mb-2">Current Card Image</h3>
                <div className="w-full h-80 flex items-center justify-center border rounded bg-gray-100">
                  {/* Use the CardImageDisplay component to show the full card with all styling */}
                  <CardImageDisplay 
                    cardId={selectedCard.id} 
                    cardName={selectedCard.name}
                    cardData={selectedCard}
                    width={250}
                    height={350}
                    key={`img-${selectedCard.id}-${Date.now()}`}
                  />
                </div>
                
                {/* Show legendary status or rarity for the card */}
                {selectedCard.rarity === 'legendary' && (
                  <div className="mt-2 text-xs text-amber-600 font-medium flex items-center">
                    <span className="mr-1">✨</span> Legendary card - image will have enhanced effects
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[calc(100vh-250px)] text-gray-500">
              Select a card to view details
            </div>
          )}
        </div>
        
        {/* Right Column - Image Upload */}
        <div className="border rounded p-4">
          <h2 className="text-xl font-semibold mb-3">Upload Card Image</h2>
          
          {selectedCard ? (
            <CardImageUploader 
              cardId={selectedCard.id} 
              onUploadSuccess={handleUploadSuccess}
            />
          ) : (
            <div className="flex items-center justify-center h-[calc(100vh-250px)] text-gray-500">
              Select a card to upload an image
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CardImageManager;
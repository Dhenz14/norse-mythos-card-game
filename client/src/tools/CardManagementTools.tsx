import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import CardCollectionEditor from './CardCollectionEditor';
import EffectSimulator from './EffectSimulator';
import CardAnalyzer from './CardAnalyzer';
import CardTemplateSystem from './CardTemplateSystem';
import { CardData } from '../game/types';
import { Button } from '../components/ui/button';
import { Download, Upload, Save } from 'lucide-react';

export default function CardManagementTools() {
  const [cards, setCards] = useState<CardData[]>([]);
  const [activeTab, setActiveTab] = useState('collection-editor');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load cards from all relevant files when component mounts
    loadAllCards();
  }, []);

  const loadAllCards = async () => {
    setIsLoading(true);
    try {
      // In a real implementation, this would load cards from your actual data sources
      // For now, we'll simulate by fetching directly from the client-side imports
      
      // Combine cards from multiple data sources
      const loadedCards: CardData[] = [];
      
      // Import card data from game files
      try {
        // These imports would be dynamic in a real implementation
        const neutralMinions = (await import('../game/data/neutralMinions')).default;
        const classMinions = (await import('../game/data/classMinions')).default;
        const additionalClassMinions = (await import('../game/data/additionalClassMinions')).default;
        const spellCards = (await import('../game/data/spellCards')).default;
        const additionalSpellCards = (await import('../game/data/additionalSpellCards')).default;
        
        // Add all cards to our collection
        loadedCards.push(...neutralMinions);
        loadedCards.push(...classMinions);
        loadedCards.push(...additionalClassMinions);
        loadedCards.push(...spellCards);
        loadedCards.push(...additionalSpellCards);
        
        console.log(`Loaded ${loadedCards.length} cards`);
      } catch (error) {
        console.error('Error loading cards:', error);
        // If imports fail, we'll use an empty array
      }
      
      setCards(loadedCards);
    } catch (error) {
      console.error('Error loading card data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCardsUpdate = (updatedCards: CardData[]) => {
    setCards(updatedCards);
  };

  const exportCards = () => {
    // Create a JSON file for download
    const dataStr = JSON.stringify(cards, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'card_collection.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const importCards = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = (event: any) => {
      const file = event.target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (e: any) => {
        try {
          const importedCards = JSON.parse(e.target.result);
          if (Array.isArray(importedCards)) {
            setCards(importedCards);
          } else {
            alert('Invalid JSON format. Expected an array of card objects.');
          }
        } catch (error) {
          alert('Error parsing JSON file: ' + error);
        }
      };
      reader.readAsText(file);
    };
    
    input.click();
  };

  const saveChanges = async () => {
    try {
      // In a real implementation, this would save back to your data files
      // For now, we'll just show an alert
      alert(`Changes would be saved to card data files (${cards.length} cards)`);
      
      // Here you would implement the actual saving logic, possibly using an API
      // E.g., waiting for server processing
      // await fetch('/api/cards/save', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify(cards),
      // });
    } catch (error) {
      console.error('Error saving card data:', error);
      alert('Error saving card data: ' + error);
    }
  };

  return (
    <div className="p-4 h-screen flex flex-col">
      <header className="flex justify-between items-center mb-4 pb-4 border-b">
        <h1 className="text-2xl font-bold">Card Management Tools</h1>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={importCards}
            className="flex items-center gap-1"
          >
            <Upload size={16} />
            Import
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportCards}
            className="flex items-center gap-1"
          >
            <Download size={16} />
            Export
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={saveChanges}
            className="flex items-center gap-1"
          >
            <Save size={16} />
            Save All Changes
          </Button>
        </div>
      </header>
      
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div>
            <p className="mb-2 text-lg">Loading card collection...</p>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 animate-pulse" style={{ width: '100%' }}></div>
            </div>
          </div>
        </div>
      ) : (
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 flex flex-col"
        >
          <TabsList className="grid grid-cols-4 w-full max-w-4xl mx-auto">
            <TabsTrigger value="collection-editor">
              Collection Editor
            </TabsTrigger>
            <TabsTrigger value="effect-simulator">
              Effect Simulator
            </TabsTrigger>
            <TabsTrigger value="card-analyzer">
              Card Analyzer
            </TabsTrigger>
            <TabsTrigger value="template-system">
              Template System
            </TabsTrigger>
          </TabsList>
          
          <div className="flex-1 mt-4">
            <TabsContent value="collection-editor" className="flex-1 m-0">
              <CardCollectionEditor
                initialCards={cards}
                onSave={handleCardsUpdate}
              />
            </TabsContent>
            
            <TabsContent value="effect-simulator" className="flex-1 m-0">
              <EffectSimulator cards={cards} />
            </TabsContent>
            
            <TabsContent value="card-analyzer" className="flex-1 m-0">
              <CardAnalyzer cards={cards} />
            </TabsContent>
            
            <TabsContent value="template-system" className="flex-1 m-0">
              <CardTemplateSystem
                cards={cards}
                onCardsSave={handleCardsUpdate}
              />
            </TabsContent>
          </div>
        </Tabs>
      )}
    </div>
  );
}
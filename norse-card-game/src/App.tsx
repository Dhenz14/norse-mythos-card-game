import React from 'react';
import './index.css';
import CardFrame from './components/CardFrame';
import BattlefieldCardFrame from './components/BattlefieldCardFrame';

function App() {
  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center">
      <header className="w-full py-6 bg-gray-800 mb-8 text-center">
        <h1 className="text-4xl font-bold text-yellow-500">Norse Mythology Card Game</h1>
        <p className="text-gray-300 mt-2">Holographic Card Demo</p>
      </header>
      
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-bold text-center text-white mb-6">Full-Size Cards</h2>
        <div className="cards-showcase">
          <CardFrame 
            name="Fenrir, Devourer of Gods" 
            type="Minion" 
            rarity="legendary" 
            description="Battlecry: Consume an enemy minion and gain its Attack and Health."
            attack={6} 
            health={6} 
            cost={8} 
            cardClass="Warrior"
          />
          
          <CardFrame 
            name="Valkyrie's Chosen" 
            type="Minion" 
            rarity="epic" 
            description="Whenever a friendly minion dies, add a random Legendary minion to your hand."
            attack={4} 
            health={5} 
            cost={5} 
            cardClass="Paladin"
          />
          
          <CardFrame 
            name="Mjölnir's Wrath" 
            type="Spell" 
            rarity="rare" 
            description="Deal 5 damage to an enemy minion. If it survives, deal 2 damage to all enemy minions."
            cost={6} 
            cardClass="Shaman"
          />
          
          <CardFrame 
            name="Nordic Warrior" 
            type="Minion" 
            rarity="common" 
            description="Taunt. Battlecry: Gain +1/+1 for each other minion with Taunt."
            attack={3} 
            health={4} 
            cost={4} 
            cardClass="Neutral"
          />
        </div>
        
        <h2 className="text-2xl font-bold text-center text-white my-6">Battlefield Cards</h2>
        <div className="battlefield-showcase">
          <BattlefieldCardFrame 
            name="Fenrir, Devourer of Gods" 
            rarity="legendary" 
            attack={6} 
            health={6} 
            cost={8} 
            cardClass="Warrior"
          />
          
          <BattlefieldCardFrame 
            name="Valkyrie's Chosen" 
            rarity="epic" 
            attack={4} 
            health={5} 
            cost={5} 
            cardClass="Paladin"
          />
          
          <BattlefieldCardFrame 
            name="Mjölnir's Wrath" 
            type="Spell" 
            rarity="rare" 
            cost={6} 
            cardClass="Shaman"
          />
          
          <BattlefieldCardFrame 
            name="Nordic Warrior" 
            rarity="common" 
            attack={3} 
            health={4} 
            cost={4} 
            cardClass="Neutral"
          />
          
          <BattlefieldCardFrame 
            name="Heimdall, Guardian" 
            rarity="legendary" 
            attack={4} 
            health={8} 
            cost={7} 
            cardClass="Neutral"
            isActive={true}
          />
        </div>
        
        <div className="text-center mt-8 mb-12">
          <p className="text-gray-300 mb-4">This demo showcases the holographic effects for different card rarities.</p>
          <p className="text-gray-400 text-sm">Hover over cards to see animations. Toggle effects with the button below each card.</p>
        </div>
      </div>
    </div>
  );
}

export default App;

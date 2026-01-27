import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Select } from '../components/ui/select';
import { Input } from '../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Card, CardData } from '../game/types';
import { ScrollArea } from '../components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../components/ui/accordion';
import { Slider } from '../components/ui/slider';
import EffectRegistry from '../game/effects/EffectRegistry';
import { GameContext, Player } from '../game/GameContext';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';

interface EffectSimulatorProps {
  cards: CardData[];
}

export default function EffectSimulator({ cards }: EffectSimulatorProps) {
  const [selectedCard, setSelectedCard] = useState<CardData | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCards, setFilteredCards] = useState<CardData[]>([]);
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const [simulationLogs, setSimulationLogs] = useState<string[]>([]);
  const [gameState, setGameState] = useState<GameContext | null>(null);

  // Board state configuration for simulation
  const [boardState, setBoardState] = useState({
    currentPlayer: {
      health: 30,
      maxHealth: 30,
      armor: 0,
      mana: { current: 10, max: 10, overloaded: 0, pendingOverload: 0 },
      board: [] as CardData[],
      hand: [] as CardData[],
      deckSize: 20,
      cardsPlayedThisTurn: 0,
    },
    opponentPlayer: {
      health: 30,
      maxHealth: 30,
      armor: 0,
      mana: { current: 10, max: 10, overloaded: 0, pendingOverload: 0 },
      board: [] as CardData[],
      hand: [] as CardData[],
      deckSize: 15,
      cardsPlayedThisTurn: 0,
    },
    turnCount: 1,
  });

  // Target selection for effects that require targets
  const [selectedTarget, setSelectedTarget] = useState<string>('');
  const [possibleTargets, setPossibleTargets] = useState<{ id: string; name: string; type: string }[]>([]);

  useEffect(() => {
    let filtered = [...cards];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (card) =>
          card.name.toLowerCase().includes(term) ||
          card.description.toLowerCase().includes(term) ||
          (card.type && card.type.toLowerCase().includes(term)) ||
          (card.heroClass && card.heroClass.toLowerCase().includes(term))
      );
    }

    setFilteredCards(filtered);
  }, [cards, searchTerm]);

  const handleCardSelect = (card: CardData) => {
    setSelectedCard(card);
    setSimulationResult(null);
    setSimulationLogs([]);

    // Generate possible targets based on card effect
    generatePossibleTargets(card);
  };

  const generatePossibleTargets = (card: CardData) => {
    const targets = [];

    // Add player hero as possible target
    targets.push({ id: 'player-hero', name: 'Your Hero', type: 'hero' });
    
    // Add opponent hero as possible target
    targets.push({ id: 'opponent-hero', name: 'Opponent Hero', type: 'hero' });

    // Add player minions
    boardState.currentPlayer.board.forEach((minion, index) => {
      targets.push({
        id: `player-minion-${index}`,
        name: `Your ${minion.name}`,
        type: 'minion',
      });
    });

    // Add opponent minions
    boardState.opponentPlayer.board.forEach((minion, index) => {
      targets.push({
        id: `opponent-minion-${index}`,
        name: `Opponent's ${minion.name}`,
        type: 'minion',
      });
    });

    setPossibleTargets(targets);
    if (targets.length > 0) {
      setSelectedTarget(targets[0].id);
    } else {
      setSelectedTarget('');
    }
  };

  const addMinion = (player: 'currentPlayer' | 'opponentPlayer') => {
    if (!selectedCard || selectedCard.type !== 'minion') return;

    // Add the selected card to the player's board
    setBoardState({
      ...boardState,
      [player]: {
        ...boardState[player],
        board: [...boardState[player].board, selectedCard],
      },
    });

    // Update possible targets
    const updatedTargets = [...possibleTargets];
    const index = boardState[player].board.length;
    updatedTargets.push({
      id: `${player === 'currentPlayer' ? 'player' : 'opponent'}-minion-${index}`,
      name: `${player === 'currentPlayer' ? 'Your' : "Opponent's"} ${selectedCard.name}`,
      type: 'minion',
    });

    setPossibleTargets(updatedTargets);
  };

  const clearBoard = (player: 'currentPlayer' | 'opponentPlayer') => {
    setBoardState({
      ...boardState,
      [player]: {
        ...boardState[player],
        board: [],
      },
    });

    // Remove minion targets for this player
    const updatedTargets = possibleTargets.filter(
      (target) => !target.id.startsWith(`${player === 'currentPlayer' ? 'player' : 'opponent'}-minion-`)
    );
    setPossibleTargets(updatedTargets);
    if (updatedTargets.length > 0) {
      setSelectedTarget(updatedTargets[0].id);
    } else {
      setSelectedTarget('');
    }
  };

  const updatePlayerStat = (
    player: 'currentPlayer' | 'opponentPlayer',
    stat: 'health' | 'armor' | 'mana',
    value: number
  ) => {
    if (stat === 'mana') {
      setBoardState({
        ...boardState,
        [player]: {
          ...boardState[player],
          mana: {
            ...boardState[player].mana,
            current: value,
            max: value,
          },
        },
      });
    } else {
      setBoardState({
        ...boardState,
        [player]: {
          ...boardState[player],
          [stat]: value,
          ...(stat === 'health' ? { maxHealth: value } : {}),
        },
      });
    }
  };

  const simulateEffect = () => {
    if (!selectedCard) return;

    // Create GameContext with current board state
    const createPlayerInstance = (
      playerState: typeof boardState.currentPlayer,
      isOpponent: boolean
    ): Player => {
      return {
        id: isOpponent ? 'opponent' : 'player',
        health: playerState.health,
        maxHealth: playerState.maxHealth,
        armor: playerState.armor,
        mana: playerState.mana,
        hand: playerState.hand.map((card, i) => ({
          id: `hand-${i}`,
          card,
          position: i,
          zone: 'hand',
          owner: isOpponent ? 'opponent' : 'player',
          isSummoned: false,
          isTransformed: false,
        })),
        deck: Array(playerState.deckSize).fill(null).map((_, i) => ({
          id: `deck-${i}`,
          card: { id: 0, name: 'Unknown Card', type: 'minion', manaCost: 1 } as CardData,
          position: i,
          zone: 'deck',
          owner: isOpponent ? 'opponent' : 'player',
          isSummoned: false,
          isTransformed: false,
        })),
        board: playerState.board.map((card, i) => ({
          id: `board-${i}`,
          card,
          position: i,
          zone: 'board',
          owner: isOpponent ? 'opponent' : 'player',
          isSummoned: true,
          isTransformed: false,
          currentHealth: card.health || 1,
          canAttack: true,
          isPlayed: true,
          isSummoningSick: false,
          hasDivineShield: card.keywords?.includes('divine_shield') || false,
          attacksPerformed: 0,
          isPoisonous: card.keywords?.includes('poisonous') || false,
          hasLifesteal: card.keywords?.includes('lifesteal') || false,
          isRush: card.keywords?.includes('rush') || false,
          isMagnetic: card.keywords?.includes('magnetic') || false,
          mechAttachments: [],
        })),
        graveyard: [],
        hero: {
          id: 'hero',
          card: { id: 0, name: 'Hero', type: 'hero', manaCost: 0 } as CardData,
          position: 0,
          zone: 'hero',
          owner: isOpponent ? 'opponent' : 'player',
          isSummoned: true,
          isTransformed: false,
          currentHealth: playerState.health,
        },
        heroPower: {
          id: 'hero-power',
          card: { id: 0, name: 'Hero Power', type: 'hero_power', manaCost: 2 } as CardData,
          position: 0,
          zone: 'hero_power',
          owner: isOpponent ? 'opponent' : 'player',
          isSummoned: true,
          isTransformed: false,
        },
        cardsPlayedThisTurn: playerState.cardsPlayedThisTurn,
        cardsDrawnThisTurn: 0,
        minionsPlayedThisTurn: 0,
        damageDealtThisTurn: 0,
        healingDoneThisTurn: 0,
      };
    };

    const currentPlayer = createPlayerInstance(boardState.currentPlayer, false);
    const opponentPlayer = createPlayerInstance(boardState.opponentPlayer, true);

    const context = new GameContext(currentPlayer, opponentPlayer);
    context.turnCount = boardState.turnCount;

    setGameState(context);
    setSimulationLogs([]);

    // Custom log handler to capture logs
    const originalLogMethod = context.logGameEvent;
    context.logGameEvent = (message: string) => {
      setSimulationLogs((prevLogs) => [...prevLogs, message]);
      originalLogMethod.call(context, message);
    };

    // Create a card instance for the source card
    const sourceCardInstance = {
      id: 'source-card',
      card: selectedCard,
      position: 0,
      zone: 'hand',
      owner: 'player',
      isSummoned: false,
      isTransformed: false,
    };

    try {
      let result;

      // Determine the target if needed
      let targetInstance = null;
      if (selectedTarget) {
        const [targetOwner, targetZone, targetIndex] = selectedTarget.split('-');
        
        if (targetZone === 'hero') {
          targetInstance = targetOwner === 'player' ? currentPlayer.hero : opponentPlayer.hero;
        } else if (targetZone === 'minion') {
          const targetMinions = targetOwner === 'player' ? currentPlayer.board : opponentPlayer.board;
          targetInstance = targetMinions[parseInt(targetIndex)];
        }
      }

      // Execute the effect based on card type
      if (selectedCard.type === 'spell' && selectedCard.spellEffect) {
        result = EffectRegistry.executeSpellEffect(context, selectedCard.spellEffect, sourceCardInstance);
      } else if (selectedCard.keywords?.includes('battlecry') && selectedCard.battlecry) {
        result = EffectRegistry.executeBattlecry(context, selectedCard.battlecry, sourceCardInstance);
      } else if (selectedCard.keywords?.includes('deathrattle') && selectedCard.deathrattle) {
        result = EffectRegistry.executeDeathrattle(context, selectedCard.deathrattle, sourceCardInstance);
      } else {
        setSimulationLogs((prevLogs) => [
          ...prevLogs,
          'No simulatable effect found on this card.',
        ]);
        return;
      }

      // Update simulation result
      setSimulationResult(result);

      // Log the final game state
      setSimulationLogs((prevLogs) => [
        ...prevLogs,
        '--- Final Game State ---',
        `Your Health: ${context.currentPlayer.health} (Armor: ${context.currentPlayer.armor})`,
        `Opponent Health: ${context.opponentPlayer.health} (Armor: ${context.opponentPlayer.armor})`,
        `Your Mana: ${context.currentPlayer.mana.current}/${context.currentPlayer.mana.max}`,
        `Your Board: ${context.currentPlayer.board.length} minions`,
        `Opponent Board: ${context.opponentPlayer.board.length} minions`,
        `Cards in Hand: ${context.currentPlayer.hand.length}`,
        `Cards in Deck: ${context.currentPlayer.deck.length}`,
      ]);
    } catch (error) {
      console.error('Error simulating effect:', error);
      setSimulationLogs((prevLogs) => [
        ...prevLogs,
        'Error occurred while simulating effect:',
        error instanceof Error ? error.message : String(error),
      ]);
    }
  };

  return (
    <div className="grid grid-cols-12 gap-4 p-4 h-screen">
      {/* Left sidebar - Card selection */}
      <div className="col-span-3 bg-gray-100 rounded-lg p-4 flex flex-col">
        <h2 className="text-lg font-bold mb-2">Card Selection</h2>
        
        <Input
          placeholder="Search cards..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mb-4"
        />
        
        <ScrollArea className="flex-1 -mx-2">
          <div className="space-y-1">
            {filteredCards.map((card) => (
              <div
                key={card.id}
                className={`px-3 py-2 rounded cursor-pointer hover:bg-gray-200 ${
                  selectedCard?.id === card.id ? 'bg-blue-100 border-l-4 border-blue-500' : ''
                }`}
                onClick={() => handleCardSelect(card)}
              >
                <div className="flex justify-between">
                  <span className="font-medium">{card.name}</span>
                  <span className="text-sm text-gray-500">{card.manaCost}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-gray-600">
                  <span>{card.type}</span>
                  <span>{card.heroClass}</span>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main content - Simulation controls */}
      <div className="col-span-5 bg-white rounded-lg p-4 flex flex-col">
        <h2 className="text-lg font-bold mb-2">Effect Simulator</h2>
        
        {selectedCard ? (
          <>
            <div className="mb-4 p-3 bg-blue-50 rounded shadow">
              <h3 className="font-semibold">{selectedCard.name}</h3>
              <div className="flex justify-between items-center text-sm mt-1">
                <span>
                  {selectedCard.type} • {selectedCard.heroClass} • {selectedCard.rarity}
                </span>
                <span>Cost: {selectedCard.manaCost}</span>
              </div>
              <p className="mt-2 text-sm">{selectedCard.description}</p>
              
              {selectedCard.keywords && selectedCard.keywords.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {selectedCard.keywords.map((keyword) => (
                    <Badge key={keyword} variant="secondary" className="text-xs">
                      {keyword
                        .split('_')
                        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                        .join(' ')}
                    </Badge>
                  ))}
                </div>
              )}

              <div className="mt-3 text-xs text-gray-500">
                {selectedCard.battlecry && (
                  <div>
                    <strong>Battlecry:</strong> {JSON.stringify(selectedCard.battlecry)}
                  </div>
                )}
                {selectedCard.deathrattle && (
                  <div>
                    <strong>Deathrattle:</strong> {JSON.stringify(selectedCard.deathrattle)}
                  </div>
                )}
                {selectedCard.spellEffect && (
                  <div>
                    <strong>Spell Effect:</strong> {JSON.stringify(selectedCard.spellEffect)}
                  </div>
                )}
              </div>
            </div>

            <Tabs defaultValue="board-setup">
              <TabsList className="mb-4 w-full">
                <TabsTrigger value="board-setup" className="flex-1">Board Setup</TabsTrigger>
                <TabsTrigger value="player-stats" className="flex-1">Player Stats</TabsTrigger>
                <TabsTrigger value="target-selection" className="flex-1">Target Selection</TabsTrigger>
              </TabsList>

              <TabsContent value="board-setup">
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-2">Your Board</h3>
                    <div className="grid grid-cols-4 gap-2 mb-2">
                      {boardState.currentPlayer.board.map((minion, index) => (
                        <div
                          key={`player-minion-${index}`}
                          className="p-2 bg-green-100 border border-green-300 rounded text-xs text-center"
                        >
                          <div className="font-semibold truncate">{minion.name}</div>
                          <div>{minion.attack || 0}/{minion.health || 1}</div>
                        </div>
                      ))}
                      {boardState.currentPlayer.board.length === 0 && (
                        <div className="col-span-4 p-2 text-center text-gray-500 text-sm">No minions</div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => addMinion('currentPlayer')} 
                        size="sm" 
                        disabled={!selectedCard || selectedCard.type !== 'minion' || boardState.currentPlayer.board.length >= 7}
                      >
                        Add Minion
                      </Button>
                      <Button onClick={() => clearBoard('currentPlayer')} size="sm" variant="outline">
                        Clear Board
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2">Opponent's Board</h3>
                    <div className="grid grid-cols-4 gap-2 mb-2">
                      {boardState.opponentPlayer.board.map((minion, index) => (
                        <div
                          key={`opponent-minion-${index}`}
                          className="p-2 bg-red-100 border border-red-300 rounded text-xs text-center"
                        >
                          <div className="font-semibold truncate">{minion.name}</div>
                          <div>{minion.attack || 0}/{minion.health || 1}</div>
                        </div>
                      ))}
                      {boardState.opponentPlayer.board.length === 0 && (
                        <div className="col-span-4 p-2 text-center text-gray-500 text-sm">No minions</div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => addMinion('opponentPlayer')} 
                        size="sm" 
                        disabled={!selectedCard || selectedCard.type !== 'minion' || boardState.opponentPlayer.board.length >= 7}
                      >
                        Add Minion
                      </Button>
                      <Button onClick={() => clearBoard('opponentPlayer')} size="sm" variant="outline">
                        Clear Board
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="player-stats">
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-3">Your Stats</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="player-health">Health: {boardState.currentPlayer.health}</Label>
                        <Slider
                          id="player-health"
                          defaultValue={[boardState.currentPlayer.health]}
                          min={1}
                          max={30}
                          step={1}
                          onValueChange={(value) => updatePlayerStat('currentPlayer', 'health', value[0])}
                        />
                      </div>
                      <div>
                        <Label htmlFor="player-armor">Armor: {boardState.currentPlayer.armor}</Label>
                        <Slider
                          id="player-armor"
                          defaultValue={[boardState.currentPlayer.armor]}
                          min={0}
                          max={20}
                          step={1}
                          onValueChange={(value) => updatePlayerStat('currentPlayer', 'armor', value[0])}
                        />
                      </div>
                      <div>
                        <Label htmlFor="player-mana">Mana: {boardState.currentPlayer.mana.current}</Label>
                        <Slider
                          id="player-mana"
                          defaultValue={[boardState.currentPlayer.mana.current]}
                          min={0}
                          max={10}
                          step={1}
                          onValueChange={(value) => updatePlayerStat('currentPlayer', 'mana', value[0])}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-3">Opponent's Stats</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="opponent-health">Health: {boardState.opponentPlayer.health}</Label>
                        <Slider
                          id="opponent-health"
                          defaultValue={[boardState.opponentPlayer.health]}
                          min={1}
                          max={30}
                          step={1}
                          onValueChange={(value) => updatePlayerStat('opponentPlayer', 'health', value[0])}
                        />
                      </div>
                      <div>
                        <Label htmlFor="opponent-armor">Armor: {boardState.opponentPlayer.armor}</Label>
                        <Slider
                          id="opponent-armor"
                          defaultValue={[boardState.opponentPlayer.armor]}
                          min={0}
                          max={20}
                          step={1}
                          onValueChange={(value) => updatePlayerStat('opponentPlayer', 'armor', value[0])}
                        />
                      </div>
                      <div>
                        <Label htmlFor="opponent-mana">Mana: {boardState.opponentPlayer.mana.current}</Label>
                        <Slider
                          id="opponent-mana"
                          defaultValue={[boardState.opponentPlayer.mana.current]}
                          min={0}
                          max={10}
                          step={1}
                          onValueChange={(value) => updatePlayerStat('opponentPlayer', 'mana', value[0])}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="target-selection">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="target-select">Select Target (if required)</Label>
                    <Select
                      id="target-select"
                      value={selectedTarget}
                      onValueChange={setSelectedTarget}
                      disabled={possibleTargets.length === 0}
                      className="mt-1"
                    >
                      {possibleTargets.map((target) => (
                        <option key={target.id} value={target.id}>
                          {target.name} ({target.type})
                        </option>
                      ))}
                    </Select>
                    
                    {possibleTargets.length === 0 && (
                      <p className="text-sm text-gray-500 mt-2">
                        No targets available. Add minions to the board using the Board Setup tab.
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="turn-count">Turn Number: {boardState.turnCount}</Label>
                    <Slider
                      id="turn-count"
                      defaultValue={[boardState.turnCount]}
                      min={1}
                      max={15}
                      step={1}
                      onValueChange={(value) => 
                        setBoardState({
                          ...boardState,
                          turnCount: value[0]
                        })
                      }
                      className="mt-1"
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="mt-4 flex justify-center">
              <Button onClick={simulateEffect} variant="default" size="lg">
                Simulate Effect
              </Button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <p className="text-xl">Select a card from the list to simulate its effect</p>
          </div>
        )}
      </div>

      {/* Right sidebar - Simulation results */}
      <div className="col-span-4 bg-gray-100 rounded-lg p-4 flex flex-col">
        <h2 className="text-lg font-bold mb-2">Simulation Results</h2>
        
        {simulationResult ? (
          <div className="bg-white p-3 rounded mb-4">
            <h3 className="font-semibold">Effect Result</h3>
            <div className="mt-2">
              <div>Success: {simulationResult.success ? 'Yes' : 'No'}</div>
              {simulationResult.error && (
                <div className="text-red-600 mt-1">Error: {simulationResult.error}</div>
              )}
              {simulationResult.data && (
                <pre className="bg-gray-100 p-2 mt-2 text-xs rounded overflow-auto max-h-32">
                  {JSON.stringify(simulationResult.data, null, 2)}
                </pre>
              )}
            </div>
          </div>
        ) : (
          selectedCard && (
            <div className="bg-white p-3 rounded mb-4 text-gray-500 text-center">
              <p>Run the simulation to see results</p>
            </div>
          )
        )}
        
        <div className="flex-1 overflow-hidden flex flex-col">
          <h3 className="font-semibold mb-2">Simulation Logs</h3>
          <ScrollArea className="flex-1 -mx-2 bg-black text-green-400 p-2 rounded font-mono text-sm">
            <div className="p-2">
              {simulationLogs.length > 0 ? (
                simulationLogs.map((log, index) => (
                  <div key={index} className="py-0.5">
                    {log}
                  </div>
                ))
              ) : (
                <div className="opacity-50">No simulation logs yet</div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
/**
 * Simulation Engine
 * 
 * This service provides a server-side engine for running AI game simulations.
 * It implements game logic and AI decision making similar to the client-side
 * but optimized for headless server execution.
 */

import { v4 as uuidv4 } from 'uuid';
import { CardData } from '../models/cardData';
import CardService from './CardService';

// Types for simulation (matching client-side types)
interface DeckInfo {
  id: string;
  name: string;
  class: string;
  cards: Record<string, number>;
}

interface Player {
  id: string;
  health: number;
  mana: {
    current: number;
    max: number;
    overload: number;
    overloadNext: number;
  };
  deck: Array<{ id: number; count: number }>;
  hand: CardInstance[];
  graveyard: CardInstance[];
  battlefield: CardInstance[];
  hero: { id: string; name: string; health: number };
  secrets: any[];
  fatigue: number;
  deckSize: number;
}

interface CardInstance {
  instanceId: string;
  card: CardData;
  isPlayed: boolean;
  canAttack: boolean;
  isSummoningSick: boolean;
  attacksPerformed: number;
  currentHealth?: number;
}

interface GameState {
  currentTurn: string;
  turnNumber: number;
  gamePhase: string;
  players: {
    player: Player;
    opponent: Player;
  };
  selectedCards: Record<string, any>;
  discoverCards: any[];
}

// Simulation result type
interface SimulationResult {
  winner: string | null;
  totalTurns: number;
  gameLog: string[];
  finalState: GameState | null;
  error?: string;
}

// Simulation options type
interface SimulationOptions {
  speed: number;
  maxTurns: number;
  logLevel: 'minimal' | 'normal' | 'verbose';
  stopOnError: boolean;
  mode: 'visual' | 'text' | 'headless';
  enableRootCauseAnalysis?: boolean;
}

// Default simulation options
const DEFAULT_SIMULATION_OPTIONS: SimulationOptions = {
  speed: 1,
  maxTurns: 30,
  logLevel: 'normal',
  stopOnError: true,
  mode: 'headless',
  enableRootCauseAnalysis: false
};

/**
 * Server-side simulation engine
 */
class SimulationEngine {
  private gameState: GameState | null = null;
  private gameLog: string[] = [];
  private turnNumber: number = 0;
  private winner: string | null = null;
  private gameOver: boolean = false;
  private error: string | null = null;
  private cardService: typeof CardService;

  constructor() {
    this.cardService = CardService;
  }

  /**
   * Run a complete AI game simulation
   * 
   * @param deck1 First player's deck
   * @param deck2 Second player's deck
   * @param userOptions Optional simulation options
   * @returns Simulation result
   */
  public async runSimulation(
    deck1: DeckInfo,
    deck2: DeckInfo,
    userOptions?: Partial<SimulationOptions>
  ): Promise<SimulationResult> {
    // Merge default options with user options
    const options: SimulationOptions = {
      ...DEFAULT_SIMULATION_OPTIONS,
      ...userOptions
    };

    // Reset engine state
    this.gameState = null;
    this.gameLog = [];
    this.turnNumber = 0;
    this.winner = null;
    this.gameOver = false;
    this.error = null;

    try {
      // Initialize game
      await this.initializeGame(deck1, deck2, options);

      // Run game loop until game is over
      while (!this.gameOver && this.turnNumber < options.maxTurns) {
        await this.processGameTurn(options);
      }

      // Check for max turns
      if (this.turnNumber >= options.maxTurns && !this.gameOver) {
        // Determine winner by health
        const player1Health = this.gameState?.players.player.health ?? 0;
        const player2Health = this.gameState?.players.opponent.health ?? 0;

        if (player1Health > player2Health) {
          this.winner = 'Player 1';
        } else if (player2Health > player1Health) {
          this.winner = 'Player 2';
        } else {
          this.winner = 'Draw';
        }

        this.gameOver = true;
        this.gameLog.push(`Game Over! Maximum turns (${options.maxTurns}) reached. ${
          this.winner === 'Draw' ? 'The game is a draw!' : `${this.winner} wins with higher health!`
        }`);
      }

      // Return simulation result
      return {
        winner: this.winner,
        totalTurns: this.turnNumber,
        gameLog: this.gameLog,
        finalState: this.gameState,
        error: this.error || undefined
      };
    } catch (error) {
      console.error('Error running simulation:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error running simulation';
      
      return {
        winner: null,
        totalTurns: this.turnNumber,
        gameLog: [...this.gameLog, `Error: ${errorMsg}`],
        finalState: this.gameState,
        error: errorMsg
      };
    }
  }

  /**
   * Initialize game state with the selected decks
   */
  private async initializeGame(
    deck1: DeckInfo,
    deck2: DeckInfo,
    options: SimulationOptions
  ): Promise<void> {
    // Validate decks
    if (!deck1?.cards || Object.keys(deck1.cards).length === 0) {
      throw new Error("Player 1's deck has no cards");
    }
    
    if (!deck2?.cards || Object.keys(deck2.cards).length === 0) {
      throw new Error("Player 2's deck has no cards");
    }

    // Log initialization
    if (options.logLevel !== 'minimal') {
      console.log('[Simulation] Initializing game with:');
      console.log('[Simulation] Deck 1:', deck1.name, deck1.class, Object.keys(deck1.cards).length, 'cards');
      console.log('[Simulation] Deck 2:', deck2.name, deck2.class, Object.keys(deck2.cards).length, 'cards');
    }

    // Set up players with the selected decks
    const updatedPlayers = {
      player: {
        id: 'player',
        health: 30,
        mana: {
          current: 1, // First player starts with 1 mana
          max: 1,
          overload: 0,
          overloadNext: 0
        },
        deck: [...Object.keys(deck1.cards)].map(cardId => ({
          id: parseInt(cardId),
          count: deck1.cards[cardId] || 0
        })).filter(item => !isNaN(item.id) && item.count > 0),
        hand: [],
        graveyard: [],
        battlefield: [],
        hero: { id: 'hero1', name: deck1.class || 'Mage', health: 30 },
        secrets: [],
        fatigue: 0,
        deckSize: Object.values(deck1.cards).reduce((acc, val) => acc + val, 0)
      },
      opponent: {
        id: 'opponent',
        health: 30,
        mana: {
          current: 0, // Second player starts with 0 mana
          max: 0,
          overload: 0,
          overloadNext: 0
        },
        deck: [...Object.keys(deck2.cards)].map(cardId => ({
          id: parseInt(cardId),
          count: deck2.cards[cardId] || 0
        })).filter(item => !isNaN(item.id) && item.count > 0),
        hand: [],
        graveyard: [],
        battlefield: [],
        hero: { id: 'hero2', name: deck2.class || 'Warrior', health: 30 },
        secrets: [],
        fatigue: 0,
        deckSize: Object.values(deck2.cards).reduce((acc, val) => acc + val, 0)
      }
    };

    // Draw initial cards (3 for each player)
    const player1StartingHand: CardInstance[] = [];
    const player2StartingHand: CardInstance[] = [];

    // Get valid card IDs from each deck
    const validCardIds1 = [...Object.keys(deck1.cards)].filter(id => 
      deck1.cards[parseInt(id)] > 0 && !isNaN(parseInt(id))
    );
    
    const validCardIds2 = [...Object.keys(deck2.cards)].filter(id => 
      deck2.cards[parseInt(id)] > 0 && !isNaN(parseInt(id))
    );

    // Draw 3 cards for each player
    for (let i = 0; i < 3; i++) {
      // Player 1 card
      if (validCardIds1.length > 0) {
        const randomIndex1 = Math.floor(Math.random() * validCardIds1.length);
        const cardId1 = validCardIds1[randomIndex1];
        
        // Remove the card from available draw pool
        validCardIds1.splice(randomIndex1, 1);
        
        const card1 = await this.cardService.findCardById(parseInt(cardId1));
        if (card1) {
          player1StartingHand.push({
            instanceId: `p1-${i}`,
            card: card1,
            isPlayed: false,
            canAttack: false,
            isSummoningSick: true,
            attacksPerformed: 0,
            currentHealth: card1.health
          });
        }
      }
      
      // Player 2 card
      if (validCardIds2.length > 0) {
        const randomIndex2 = Math.floor(Math.random() * validCardIds2.length);
        const cardId2 = validCardIds2[randomIndex2];
        
        // Remove the card from available draw pool
        validCardIds2.splice(randomIndex2, 1);
        
        const card2 = await this.cardService.findCardById(parseInt(cardId2));
        if (card2) {
          player2StartingHand.push({
            instanceId: `p2-${i}`,
            card: card2,
            isPlayed: false,
            canAttack: false,
            isSummoningSick: true,
            attacksPerformed: 0,
            currentHealth: card2.health
          });
        }
      }
    }

    // Add the coin to player 2
    const coinCard = {
      id: 10000,
      name: "The Coin",
      description: "Gain 1 Mana Crystal this turn only.",
      type: "spell",
      manaCost: 0,
      class: "Neutral",
      rarity: "common",
      collectible: false,
      spellEffect: {
        type: "gain_mana",
        value: 1
      }
    };
    
    player2StartingHand.push({
      instanceId: 'p2-coin',
      card: coinCard as CardData,
      isPlayed: false,
      canAttack: false,
      isSummoningSick: true,
      attacksPerformed: 0
    });

    // Update player hands
    updatedPlayers.player.hand = player1StartingHand;
    updatedPlayers.opponent.hand = player2StartingHand;
    
    // Update deck size to reflect drawn cards
    updatedPlayers.player.deckSize -= player1StartingHand.length;
    updatedPlayers.opponent.deckSize -= (player2StartingHand.length - 1); // -1 because The Coin doesn't come from deck

    // Set up initial game state
    this.gameState = {
      currentTurn: 'player', // First player goes first
      turnNumber: 1,
      gamePhase: 'play', // Start in play phase (skip mulligan for simplicity)
      players: updatedPlayers,
      selectedCards: {},
      discoverCards: [],
    };

    // Set turn number
    this.turnNumber = 1;

    // Add initial game log entry
    this.gameLog.push(
      `Game started with ${deck1.name} (${deck1.class}) vs ${deck2.name} (${deck2.class})`
    );
  }

  /**
   * Process a single game turn
   */
  private async processGameTurn(options: SimulationOptions): Promise<void> {
    // Safety check
    if (!this.gameState) {
      throw new Error('Game state not initialized');
    }

    const currentPlayer = this.gameState.currentTurn as 'player' | 'opponent';
    const playerName = currentPlayer === 'player' ? 'Player 1' : 'Player 2';
    
    // Get current player state
    const playerState = this.gameState.players[currentPlayer];
    
    // Add turn start to game log
    this.gameLog.push(
      `Turn ${this.turnNumber}: ${playerName}'s turn starts (${playerState.mana.current}/${playerState.mana.max} mana, ${playerState.hand.length} cards)`
    );

    // 1. PLAY CARDS PHASE
    await this.processPlayCardsPhase(currentPlayer, options);
    
    // Check if game is over after playing cards
    if (this.gameOver) {
      return;
    }
    
    // 2. ATTACK PHASE
    await this.processAttackPhase(currentPlayer, options);
    
    // Check if game is over after attacks
    if (this.gameOver) {
      return;
    }
    
    // 3. END TURN
    this.gameLog.push(`${playerName} ends their turn.`);
    this.endTurn();
  }

  /**
   * Process the play cards phase of a turn
   */
  private async processPlayCardsPhase(
    currentPlayer: 'player' | 'opponent',
    options: SimulationOptions
  ): Promise<void> {
    // Safety check
    if (!this.gameState) {
      throw new Error('Game state not initialized');
    }

    const playerName = currentPlayer === 'player' ? 'Player 1' : 'Player 2';
    const playerState = this.gameState.players[currentPlayer];
    
    // Check if player has any cards they can actually play with current mana
    const hasPlayableCards = playerState.hand.some(
      card => (card.card?.manaCost || 999) <= playerState.mana.current
    );
    
    if (!hasPlayableCards) {
      if (options.logLevel !== 'minimal') {
        console.log(`[Simulation] ${playerName} has no playable cards with ${playerState.mana.current} mana.`);
      }
      this.gameLog.push(`${playerName} has no playable cards with ${playerState.mana.current} mana.`);
      return;
    }
    
    // Evaluate play options
    try {
      const playOptions = this.evaluatePlayOptions(currentPlayer);
      
      if (options.logLevel !== 'minimal') {
        console.log(`[Simulation] Found ${playOptions.length} possible play options for ${playerName}`);
      }
      
      // Check for full hand
      if (playerState.hand.length >= 10) {
        this.gameLog.push(`${playerName}'s hand is full (10 cards). New cards will be burned.`);
      }
      
      if (playOptions.length > 0) {
        // Sort options by score (highest first)
        playOptions.sort((a, b) => b.score - a.score);
        
        // Get the best play
        const bestPlay = playOptions[0];
        
        // Validate all required properties exist for the card to be played
        if (bestPlay.card && bestPlay.cardInstance?.instanceId && 
            playerState.mana.current >= (bestPlay.card.manaCost || 0)) {
          
          const cardName = bestPlay.card.name || 'Unnamed Card';
          const cardCost = bestPlay.card.manaCost || 0;
          
          // Log the play
          let targetDesc = bestPlay.target ? 
            (bestPlay.target.type === 'hero' ? 'opponent hero' : `${bestPlay.target.name || 'unknown minion'}`) : 
            'no target';
            
          this.gameLog.push(`${playerName} plays ${cardName} (${cardCost} mana)${
            bestPlay.target ? ` targeting ${targetDesc}` : ''
          }`);
          
          // Execute the play
          await this.playCard(
            currentPlayer, 
            bestPlay.cardInstance.instanceId, 
            bestPlay.target?.instanceId,
            bestPlay.target?.type
          );
          
          // Check if game is over after playing card
          if (this.checkGameOver()) {
            return;
          }
          
          // Recursively try to play more cards
          await this.processPlayCardsPhase(currentPlayer, options);
        }
      }
    } catch (error) {
      console.error('[Simulation] Error during play cards phase:', error);
      this.gameLog.push(`Error during play cards phase: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      if (options.stopOnError) {
        this.error = error instanceof Error ? error.message : 'Unknown error during play cards phase';
        this.gameOver = true;
      }
    }
  }
  
  /**
   * Process the attack phase of a turn
   */
  private async processAttackPhase(
    currentPlayer: 'player' | 'opponent',
    options: SimulationOptions
  ): Promise<void> {
    // Safety check
    if (!this.gameState) {
      throw new Error('Game state not initialized');
    }

    const playerName = currentPlayer === 'player' ? 'Player 1' : 'Player 2';
    const attackingSide = this.gameState.players[currentPlayer];
    const defendingSide = this.gameState.players[currentPlayer === 'player' ? 'opponent' : 'player'];
    
    // Find minions that can attack
    const attackingMinions = attackingSide.battlefield.filter(minion => 
      minion.canAttack && !minion.isSummoningSick
    );
    
    if (attackingMinions.length === 0) {
      if (options.logLevel !== 'minimal') {
        console.log(`[Simulation] ${playerName} has no minions that can attack.`);
      }
      return;
    }
    
    // Find valid targets
    const enemyMinions = defendingSide.battlefield || [];
    const hasEnemyTaunts = enemyMinions.some(minion => 
      minion.card?.keywords?.includes('taunt')
    );
    
    // Process each attacking minion
    for (const attacker of attackingMinions) {
      // Skip invalid attackers
      if (!attacker.instanceId || !attacker.card) continue;
      
      // Check if game is over
      if (this.gameOver) {
        return;
      }
      
      let target = null;
      
      // If there are enemy minions with taunt, we must attack those first
      if (hasEnemyTaunts) {
        const tauntMinions = enemyMinions.filter(minion => 
          minion.card?.keywords?.includes('taunt')
        );
        
        if (tauntMinions.length > 0) {
          // Find the taunt minion with lowest health as target
          target = tauntMinions.reduce((lowest, current) => 
            (current.currentHealth || 0) < (lowest.currentHealth || 0) ? current : lowest
          );
        }
      } 
      // No taunts, so target regular minions or the hero
      else if (enemyMinions.length > 0) {
        // Find minion with highest attack as target (priority threat)
        target = enemyMinions.reduce((highest, current) => 
          ((current.card?.attack || 0) > (highest.card?.attack || 0)) ? current : highest
        );
      } else {
        // Target the enemy hero if no minions
        target = {
          instanceId: currentPlayer === 'player' ? 'hero2' : 'hero1',
          type: 'hero'
        };
      }
      
      // Perform the attack if we have a valid target
      if (target && target.instanceId) {
        const targetType = target.type || 'minion';
        const targetName = targetType === 'hero' ? 'enemy hero' : (target.card?.name || 'unknown minion');
        
        this.gameLog.push(`${attacker.card.name} attacks ${targetName}`);
        
        try {
          // Execute the attack
          await this.attackWithMinion(
            currentPlayer,
            attacker.instanceId, 
            target.instanceId, 
            targetType
          );
          
          // Check if game is over after attack
          if (this.checkGameOver()) {
            return;
          }
        } catch (error) {
          console.error('[Simulation] Error during attack:', error);
          this.gameLog.push(`Error during attack: ${error instanceof Error ? error.message : 'Unknown error'}`);
          
          if (options.stopOnError) {
            this.error = error instanceof Error ? error.message : 'Unknown error during attack';
            this.gameOver = true;
            return;
          }
        }
      }
    }
  }

  /**
   * End the current turn and prepare for the next
   */
  private endTurn(): void {
    // Safety check
    if (!this.gameState) {
      throw new Error('Game state not initialized');
    }

    // Flip the current player
    const nextPlayer = this.gameState.currentTurn === 'player' ? 'opponent' : 'player';
    this.gameState.currentTurn = nextPlayer;
    
    // Increase turn number if it's the first player's turn next
    if (nextPlayer === 'player') {
      this.turnNumber++;
      this.gameState.turnNumber = this.turnNumber;
    }
    
    // Update mana for next player
    const nextPlayerState = this.gameState.players[nextPlayer];
    
    // Increase max mana (up to 10)
    if (nextPlayerState.mana.max < 10) {
      nextPlayerState.mana.max += 1;
    }
    
    // Reset current mana to max
    nextPlayerState.mana.current = nextPlayerState.mana.max;
    
    // Apply any overload
    if (nextPlayerState.mana.overloadNext > 0) {
      nextPlayerState.mana.overload = nextPlayerState.mana.overloadNext;
      nextPlayerState.mana.current -= nextPlayerState.mana.overload;
      nextPlayerState.mana.overloadNext = 0;
    } else {
      nextPlayerState.mana.overload = 0;
    }
    
    // Make sure mana doesn't go negative
    if (nextPlayerState.mana.current < 0) {
      nextPlayerState.mana.current = 0;
    }
    
    // Draw a card for the next player
    this.drawCard(nextPlayer);
    
    // Reset minion states for the next player
    for (const minion of nextPlayerState.battlefield) {
      minion.canAttack = true;
      minion.isSummoningSick = false;
      minion.attacksPerformed = 0;
    }
  }

  /**
   * Draw a card for the specified player
   */
  private async drawCard(player: 'player' | 'opponent'): Promise<void> {
    // Safety check
    if (!this.gameState) {
      throw new Error('Game state not initialized');
    }

    const playerState = this.gameState.players[player];
    const playerName = player === 'player' ? 'Player 1' : 'Player 2';
    
    // Check if deck is empty
    if (playerState.deckSize <= 0) {
      // Fatigue damage
      playerState.fatigue += 1;
      playerState.health -= playerState.fatigue;
      
      this.gameLog.push(`${playerName} has no cards left! Takes ${playerState.fatigue} fatigue damage.`);
      
      // Check for death from fatigue
      if (playerState.health <= 0) {
        const winner = player === 'player' ? 'Player 2' : 'Player 1';
        this.winner = winner;
        this.gameOver = true;
        this.gameLog.push(`Game Over! ${winner} wins! (${playerName} died from fatigue)`);
      }
      
      return;
    }
    
    // Check if hand is full
    if (playerState.hand.length >= 10) {
      // Burn the card
      playerState.deckSize -= 1;
      this.gameLog.push(`${playerName}'s hand is full. Card burned!`);
      return;
    }
    
    // Get a random card from the deck
    const availableCards = playerState.deck.filter(card => card.count > 0);
    
    if (availableCards.length === 0) {
      console.error('[Simulation] No cards available in deck, but deckSize > 0');
      playerState.deckSize = 0;
      return;
    }
    
    // Pick a random card
    const randomIndex = Math.floor(Math.random() * availableCards.length);
    const drawnCard = availableCards[randomIndex];
    
    // Reduce the count of this card in the deck
    const deckCardIndex = playerState.deck.findIndex(card => card.id === drawnCard.id);
    if (deckCardIndex >= 0) {
      playerState.deck[deckCardIndex].count -= 1;
    }
    
    // Reduce deck size
    playerState.deckSize -= 1;
    
    // Get the card data
    const cardData = await this.cardService.findCardById(drawnCard.id);
    
    if (!cardData) {
      console.error(`[Simulation] Card with ID ${drawnCard.id} not found`);
      return;
    }
    
    // Add card to hand
    const instanceId = `${player}-${uuidv4().substring(0, 8)}`;
    playerState.hand.push({
      instanceId,
      card: cardData,
      isPlayed: false,
      canAttack: false,
      isSummoningSick: true,
      attacksPerformed: 0,
      currentHealth: cardData.health
    });
    
    // Log the draw
    this.gameLog.push(`${playerName} draws ${cardData.name}.`);
  }

  /**
   * Play a card from hand
   */
  private async playCard(
    player: 'player' | 'opponent',
    cardInstanceId: string,
    targetInstanceId?: string,
    targetType?: string
  ): Promise<void> {
    // Safety check
    if (!this.gameState) {
      throw new Error('Game state not initialized');
    }

    const playerState = this.gameState.players[player];
    
    // Find the card in hand
    const cardIndex = playerState.hand.findIndex(card => card.instanceId === cardInstanceId);
    
    if (cardIndex === -1) {
      throw new Error(`Card with instance ID ${cardInstanceId} not found in hand`);
    }
    
    const cardInstance = playerState.hand[cardIndex];
    const cardData = cardInstance.card;
    
    // Check mana cost
    if ((cardData.manaCost || 0) > playerState.mana.current) {
      throw new Error(`Not enough mana to play ${cardData.name}`);
    }
    
    // Pay the mana cost
    playerState.mana.current -= (cardData.manaCost || 0);
    
    // Remove from hand
    playerState.hand.splice(cardIndex, 1);
    
    // Handle different card types
    if (cardData.type === 'minion') {
      // Add to battlefield
      cardInstance.isPlayed = true;
      cardInstance.isSummoningSick = true;
      cardInstance.canAttack = false;
      cardInstance.attacksPerformed = 0;
      cardInstance.currentHealth = cardData.health || 1;
      
      playerState.battlefield.push(cardInstance);
      
      // Handle battlecry if target is provided
      if (cardData.battlecry && targetInstanceId && targetType) {
        // Handle battlecry effects with target
        await this.processBattlecry(player, cardData, targetInstanceId, targetType);
      }
    } else if (cardData.type === 'spell') {
      // Handle spell effects
      await this.processSpellEffect(player, cardData, targetInstanceId, targetType);
      
      // Add to graveyard after playing
      playerState.graveyard.push(cardInstance);
    } else if (cardData.type === 'weapon') {
      // Equip weapon (replace any existing)
      // This is a simplified implementation
      playerState.graveyard.push(cardInstance);
    }
    
    // Check game state after playing the card
    this.checkGameOver();
  }

  /**
   * Process battlecry effects
   */
  private async processBattlecry(
    player: 'player' | 'opponent',
    cardData: CardData,
    targetInstanceId: string,
    targetType: string
  ): Promise<void> {
    // This is a simplified implementation that would need to be expanded
    // based on the specific battlecry effects in your game
    
    // For now, let's just handle damage battlecries as an example
    const battlecry = cardData.battlecry;
    
    if (!battlecry) {
      return;
    }
    
    if (battlecry.type === 'damage' && battlecry.value) {
      const opposingPlayer = player === 'player' ? 'opponent' : 'player';
      
      if (targetType === 'hero') {
        // Damage hero
        this.gameState!.players[opposingPlayer].health -= battlecry.value;
        this.gameLog.push(`${cardData.name}'s battlecry deals ${battlecry.value} damage to enemy hero.`);
      } else if (targetType === 'minion') {
        // Damage minion
        const targetMinion = this.gameState!.players[opposingPlayer].battlefield.find(
          minion => minion.instanceId === targetInstanceId
        );
        
        if (targetMinion) {
          targetMinion.currentHealth = (targetMinion.currentHealth || 0) - battlecry.value;
          this.gameLog.push(`${cardData.name}'s battlecry deals ${battlecry.value} damage to ${targetMinion.card.name}.`);
          
          // Check if minion died
          if ((targetMinion.currentHealth || 0) <= 0) {
            this.killMinion(opposingPlayer, targetMinion.instanceId);
          }
        }
      }
    }
  }

  /**
   * Process spell effects
   */
  private async processSpellEffect(
    player: 'player' | 'opponent',
    cardData: CardData,
    targetInstanceId?: string,
    targetType?: string
  ): Promise<void> {
    // This is a simplified implementation that would need to be expanded
    // based on the specific spell effects in your game
    
    const spellEffect = cardData.spellEffect;
    
    if (!spellEffect) {
      return;
    }
    
    if (spellEffect.type === 'damage' && spellEffect.value) {
      const opposingPlayer = player === 'player' ? 'opponent' : 'player';
      
      if (targetType === 'hero') {
        // Damage hero
        this.gameState!.players[opposingPlayer].health -= spellEffect.value;
        this.gameLog.push(`${cardData.name} deals ${spellEffect.value} damage to enemy hero.`);
      } else if (targetType === 'minion' && targetInstanceId) {
        // Damage minion
        const targetMinion = this.gameState!.players[opposingPlayer].battlefield.find(
          minion => minion.instanceId === targetInstanceId
        );
        
        if (targetMinion) {
          targetMinion.currentHealth = (targetMinion.currentHealth || 0) - spellEffect.value;
          this.gameLog.push(`${cardData.name} deals ${spellEffect.value} damage to ${targetMinion.card.name}.`);
          
          // Check if minion died
          if ((targetMinion.currentHealth || 0) <= 0) {
            this.killMinion(opposingPlayer, targetMinion.instanceId);
          }
        }
      }
    } else if (spellEffect.type === 'gain_mana' && spellEffect.value) {
      // Gain temporary mana
      this.gameState!.players[player].mana.current += spellEffect.value;
      this.gameLog.push(`${cardData.name} gives ${player === 'player' ? 'Player 1' : 'Player 2'} ${spellEffect.value} mana.`);
    } else if (spellEffect.type === 'heal' && spellEffect.value) {
      if (targetType === 'hero') {
        // Heal hero
        const targetPlayerKey = targetInstanceId === 'hero1' ? 'player' : 'opponent';
        const targetPlayer = this.gameState!.players[targetPlayerKey];
        
        targetPlayer.health = Math.min(30, targetPlayer.health + spellEffect.value);
        this.gameLog.push(`${cardData.name} heals ${targetPlayerKey === 'player' ? 'Player 1' : 'Player 2'} for ${spellEffect.value}.`);
      } else if (targetType === 'minion' && targetInstanceId) {
        // Determine which player owns the target minion
        const playerWithMinion = this.findPlayerWithMinion(targetInstanceId);
        
        if (playerWithMinion) {
          const targetMinion = this.gameState!.players[playerWithMinion].battlefield.find(
            minion => minion.instanceId === targetInstanceId
          );
          
          if (targetMinion && targetMinion.card) {
            const maxHealth = targetMinion.card.health || 1;
            targetMinion.currentHealth = Math.min(maxHealth, (targetMinion.currentHealth || 0) + spellEffect.value);
            this.gameLog.push(`${cardData.name} heals ${targetMinion.card.name} for ${spellEffect.value}.`);
          }
        }
      }
    }
    
    // Add more spell effect types here as needed
  }

  /**
   * Execute an attack with a minion
   */
  private async attackWithMinion(
    player: 'player' | 'opponent',
    attackerInstanceId: string,
    targetInstanceId: string,
    targetType: string
  ): Promise<void> {
    // Safety check
    if (!this.gameState) {
      throw new Error('Game state not initialized');
    }

    const attackingPlayer = this.gameState.players[player];
    const defendingPlayer = this.gameState.players[player === 'player' ? 'opponent' : 'player'];
    
    // Find the attacking minion
    const attacker = attackingPlayer.battlefield.find(
      minion => minion.instanceId === attackerInstanceId
    );
    
    if (!attacker) {
      throw new Error(`Attacker with instance ID ${attackerInstanceId} not found on battlefield`);
    }
    
    // Check if minion can attack
    if (!attacker.canAttack || attacker.isSummoningSick) {
      throw new Error(`Minion ${attacker.card.name} cannot attack this turn`);
    }
    
    // Get attacker attack value
    const attackValue = attacker.card.attack || 0;
    
    // Handle attack based on target type
    if (targetType === 'hero') {
      // Attack hero
      defendingPlayer.health -= attackValue;
      this.gameLog.push(`${attacker.card.name} attacks enemy hero for ${attackValue} damage.`);
    } else if (targetType === 'minion') {
      // Find target minion
      const target = defendingPlayer.battlefield.find(
        minion => minion.instanceId === targetInstanceId
      );
      
      if (!target) {
        throw new Error(`Target minion with instance ID ${targetInstanceId} not found on battlefield`);
      }
      
      // Get target attack value
      const targetAttackValue = target.card.attack || 0;
      
      // Deal damage to target
      target.currentHealth = (target.currentHealth || 0) - attackValue;
      
      // Deal damage to attacker (from target's counter-attack)
      attacker.currentHealth = (attacker.currentHealth || 0) - targetAttackValue;
      
      this.gameLog.push(`${attacker.card.name} (${attackValue}/${attacker.currentHealth}) attacks ${target.card.name} (${targetAttackValue}/${target.currentHealth}).`);
      
      // Check if target died
      if ((target.currentHealth || 0) <= 0) {
        this.killMinion(player === 'player' ? 'opponent' : 'player', target.instanceId);
      }
      
      // Check if attacker died
      if ((attacker.currentHealth || 0) <= 0) {
        this.killMinion(player, attacker.instanceId);
      }
    }
    
    // Mark minion as having attacked
    if (attacker) {
      attacker.attacksPerformed++;
      attacker.canAttack = false;
    }
    
    // Check game state after attack
    this.checkGameOver();
  }

  /**
   * Remove a dead minion from the battlefield
   */
  private killMinion(player: 'player' | 'opponent', minionInstanceId: string): void {
    // Safety check
    if (!this.gameState) {
      throw new Error('Game state not initialized');
    }

    const playerState = this.gameState.players[player];
    
    // Find the minion
    const minionIndex = playerState.battlefield.findIndex(
      minion => minion.instanceId === minionInstanceId
    );
    
    if (minionIndex === -1) {
      return;
    }
    
    const minion = playerState.battlefield[minionIndex];
    
    // Log death
    this.gameLog.push(`${minion.card.name} dies.`);
    
    // Move to graveyard
    playerState.graveyard.push(minion);
    
    // Remove from battlefield
    playerState.battlefield.splice(minionIndex, 1);
    
    // Process deathrattle effects
    if (minion.card.deathrattle) {
      this.processDeathrattle(player, minion.card);
    }
  }

  /**
   * Process deathrattle effects
   */
  private processDeathrattle(player: 'player' | 'opponent', cardData: CardData): void {
    // This is a simplified implementation that would need to be expanded
    // based on the specific deathrattle effects in your game
    
    const deathrattle = cardData.deathrattle;
    
    if (!deathrattle) {
      return;
    }
    
    if (deathrattle.type === 'draw_card' && deathrattle.value) {
      // Draw cards
      for (let i = 0; i < deathrattle.value; i++) {
        this.drawCard(player);
      }
      
      this.gameLog.push(`${cardData.name}'s deathrattle: Draw ${deathrattle.value} card${deathrattle.value > 1 ? 's' : ''}.`);
    } else if (deathrattle.type === 'summon' && deathrattle.minionId) {
      // Summon a minion
      this.summonMinion(player, deathrattle.minionId);
      
      this.gameLog.push(`${cardData.name}'s deathrattle: Summon a minion.`);
    }
    
    // Add more deathrattle types here as needed
  }

  /**
   * Summon a minion from a card ID
   */
  private async summonMinion(player: 'player' | 'opponent', cardId: number): Promise<void> {
    // Safety check
    if (!this.gameState) {
      throw new Error('Game state not initialized');
    }

    const playerState = this.gameState.players[player];
    
    // Check if battlefield is full
    if (playerState.battlefield.length >= 7) {
      this.gameLog.push(`${player === 'player' ? 'Player 1' : 'Player 2'}'s battlefield is full. Cannot summon more minions.`);
      return;
    }
    
    // Get card data
    const cardData = await this.cardService.findCardById(cardId);
    
    if (!cardData) {
      console.error(`[Simulation] Card with ID ${cardId} not found for summoning`);
      return;
    }
    
    // Create minion instance
    const instanceId = `${player}-${uuidv4().substring(0, 8)}`;
    const minionInstance: CardInstance = {
      instanceId,
      card: cardData,
      isPlayed: true,
      canAttack: false,
      isSummoningSick: true,
      attacksPerformed: 0,
      currentHealth: cardData.health || 1
    };
    
    // Add to battlefield
    playerState.battlefield.push(minionInstance);
    
    // Log summoning
    this.gameLog.push(`${player === 'player' ? 'Player 1' : 'Player 2'} summons ${cardData.name}.`);
  }

  /**
   * Check if the game is over
   * @returns true if game is now over, false otherwise
   */
  private checkGameOver(): boolean {
    // Safety check
    if (!this.gameState) {
      throw new Error('Game state not initialized');
    }

    // Check player health
    if (this.gameState.players.player.health <= 0) {
      this.winner = 'Player 2';
      this.gameOver = true;
      this.gameLog.push(`Game Over! Player 2 wins! (Player 1's health: ${this.gameState.players.player.health})`);
      return true;
    }
    
    if (this.gameState.players.opponent.health <= 0) {
      this.winner = 'Player 1';
      this.gameOver = true;
      this.gameLog.push(`Game Over! Player 1 wins! (Player 2's health: ${this.gameState.players.opponent.health})`);
      return true;
    }
    
    return false;
  }

  /**
   * Find which player has a minion with the given instance ID
   * @returns 'player', 'opponent', or null if not found
   */
  private findPlayerWithMinion(minionInstanceId: string): 'player' | 'opponent' | null {
    // Safety check
    if (!this.gameState) {
      throw new Error('Game state not initialized');
    }

    // Check player's battlefield
    if (this.gameState.players.player.battlefield.some(
      minion => minion.instanceId === minionInstanceId
    )) {
      return 'player';
    }
    
    // Check opponent's battlefield
    if (this.gameState.players.opponent.battlefield.some(
      minion => minion.instanceId === minionInstanceId
    )) {
      return 'opponent';
    }
    
    return null;
  }

  /**
   * Evaluate possible play options for a player
   * @returns Array of play options sorted by score
   */
  private evaluatePlayOptions(player: 'player' | 'opponent'): any[] {
    // Safety check
    if (!this.gameState) {
      throw new Error('Game state not initialized');
    }

    const playerState = this.gameState.players[player];
    const opposingPlayer = player === 'player' ? 'opponent' : 'player';
    const opposingPlayerState = this.gameState.players[opposingPlayer];
    
    const options: any[] = [];
    
    // Calculate available mana
    const availableMana = playerState.mana.current;
    
    // Evaluate each card in hand
    for (const cardInstance of playerState.hand) {
      if (!cardInstance || !cardInstance.card) {
        continue;
      }
      
      const card = cardInstance.card;
      const manaCost = card.manaCost || 0;
      
      // Skip if not enough mana
      if (manaCost > availableMana) continue;
      
      // Simple scoring based on card type and stats
      let score = 0;
      
      if (card.type === 'minion') {
        // Base score is attack + health
        const attack = card.attack || 0;
        const health = card.health || 0;
        score = attack + health;
        
        // Bonus for keywords
        if (card.keywords) {
          if (card.keywords.includes('taunt')) score += 2;
          if (card.keywords.includes('divine_shield')) score += 3;
          if (card.keywords.includes('charge')) score += 2;
          if (card.keywords.includes('windfury')) score += 2;
        }
        
        // Mana efficiency bonus (stats per mana)
        if (manaCost > 0) {
          score += (attack + health) / manaCost;
        }
      } else if (card.type === 'spell') {
        // Simple estimate for spells
        score = manaCost * 1.5; // Assume spells are slightly better than minions for same cost
      } else if (card.type === 'weapon') {
        // For weapons, consider durability and attack
        const attack = card.attack || 0;
        const durability = card.durability || 0;
        score = attack * durability;
      }
      
      // Adjust score based on board state
      const opponentMinionCount = opposingPlayerState.battlefield.length;
      const playerMinionCount = playerState.battlefield.length;
      
      // If opponent has many minions, prioritize boardclears and taunts
      if (opponentMinionCount > 3 && card.type === 'spell') {
        score += 5; // Assume it might be a board clear
      }
      
      // If we have few minions, prioritize playing minions
      if (playerMinionCount < 2 && card.type === 'minion') {
        score += 3;
      }
      
      // If the card costs all available mana, slightly penalize (prefer playing multiple cards)
      if (manaCost === availableMana && availableMana > 3) {
        score -= 1;
      }
      
      // Create the play option
      const option: any = {
        card,
        cardInstance,
        score,
        manaRemaining: availableMana - manaCost
      };
      
      // If the card requires a target, select one
      if (card.battlecry?.requiresTarget || card.targetType) {
        // For now just select first valid target or hero
        if (opposingPlayerState.battlefield.length > 0) {
          // Target the minion with the highest attack
          const targetMinion = [...opposingPlayerState.battlefield].sort((a, b) => 
            (b.card?.attack || 0) - (a.card?.attack || 0)
          )[0];
          
          if (targetMinion) {
            option.target = {
              instanceId: targetMinion.instanceId,
              name: targetMinion.card?.name || 'Unknown Minion',
              type: 'minion'
            };
          }
        } else {
          // Target enemy hero
          option.target = {
            instanceId: player === 'player' ? 'hero2' : 'hero1',
            name: 'Enemy Hero',
            type: 'hero'
          };
        }
      }
      
      options.push(option);
    }
    
    return options;
  }
}

export default SimulationEngine;
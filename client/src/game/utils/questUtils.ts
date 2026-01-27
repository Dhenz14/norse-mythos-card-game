/**
 * Utility functions for handling quests in the game
 */
import { 
  GameState, 
  CardInstance, 
  Player, 
  CardData,
  QuestData,
  QuestType,
  GameLogEventType
} from '../types';
import { getCardById } from '../data/allCards';
import { v4 as uuidv4 } from 'uuid';

// Inline implementation of addCardToHand to avoid circular dependency
function addCardToHand(
  state: GameState,
  playerType: 'player' | 'opponent',
  card: CardData
): GameState {
  const newState = JSON.parse(JSON.stringify(state));
  
  // Generate unique instance ID
  const instanceId = `card_${card.id}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  
  // Add card to hand
  newState.players[playerType].hand.push({
    instanceId,
    card,
    isPlayed: false,
    zone: 'hand',
    turnDrawn: state.turnNumber
  });
  
  return newState;
}

// Inline implementation of createGameLogEvent to avoid circular dependency
function createGameLogEvent(data: {
  type: GameLogEventType;
  player: 'player' | 'opponent';
  text: string;
  cardId?: string;
  cardName?: string;
  targetId?: string;
  value?: number;
  progress?: number;
  target?: number;
}): any {
  return {
    id: `event_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    type: data.type,
    turn: 0, // This would be filled in with the current turn
    timestamp: Date.now(),
    player: data.player,
    text: data.text,
    cardId: data.cardId,
    targetId: data.targetId,
    value: data.value,
    progress: data.progress,
    target: data.target,
    cardName: data.cardName
  };
}
import { questRewards } from '../data/questCards';

/**
 * Plays a quest card and activates its tracking
 * @param state Current game state
 * @param playerType Player playing the quest
 * @param cardInstance Quest card being played
 * @returns Updated game state with quest active
 */
export function playQuestCard(
  state: GameState,
  playerType: 'player' | 'opponent',
  cardInstance: CardInstance
): GameState {
  // Make sure it's a valid quest card with quest data
  if (
    !cardInstance.card || 
    !cardInstance.card.spellEffect || 
    cardInstance.card.spellEffect.type !== 'quest' ||
    !cardInstance.card.spellEffect.questData
  ) {
    console.error('Not a valid quest card:', cardInstance);
    return state;
  }

  // Get the quest data from the card
  const questData = cardInstance.card.spellEffect.questData;
  
  // Create a new state with deep copies to avoid mutation
  const newState = JSON.parse(JSON.stringify(state));
  
  // Set the quest as active for the player
  newState.players[playerType].activeQuest = {
    ...questData,
    cardId: cardInstance.card.id,
    cardName: cardInstance.card.name
  };
  
  // Add event to game log
  newState.gameLog.push(
    createGameLogEvent({
      type: 'quest_started',
      player: playerType,
      cardId: String(cardInstance.card.id),
      cardName: cardInstance.card.name,
      text: `${playerType === 'player' ? 'You' : 'Opponent'} started quest: ${cardInstance.card.name}`,
      progress: 0,
      target: questData.target
    })
  );
  
  return newState;
}

/**
 * Updates quest progress based on an action
 * @param state Current game state
 * @param playerType Player whose quest to update
 * @param type Type of action that occurred
 * @param value Additional value related to the action (optional)
 * @returns Updated game state with updated quest progress
 */
export function updateQuestProgress(
  state: GameState,
  playerType: 'player' | 'opponent',
  type: QuestType,
  value?: any
): GameState {
  // Make sure player has an active quest
  const activeQuest = state.players[playerType].activeQuest;
  if (!activeQuest) {
    return state;
  }

  // Make sure the action matches the quest type
  if (activeQuest.type !== type) {
    return state;
  }

  // Create a deep copy of the state to avoid mutation
  const newState = JSON.parse(JSON.stringify(state));
  const quest = newState.players[playerType].activeQuest;
  
  // Update quest progress based on type and value
  let progressIncrement = 1; // Default increment is 1
  let shouldUpdate = true;
  
  switch (type) {
    case 'play_minions_same_name':
      // The value here would be the name of the minion played
      // We would need a way to track which minions have been played
      // For simplicity, just increment by 1 for now
      break;
      
    case 'cast_generated_spells':
      // Check if spell was generated (not in original deck)
      // For simplicity, always increment
      break;
      
    case 'play_taunt_minions':
      // Check if the played minion has taunt
      // value should be a CardData object
      if (value && value.keywords && value.keywords.includes('taunt')) {
        // Increment for taunt minions
      } else {
        shouldUpdate = false;
      }
      break;
      
    case 'hero_power_uses':
      // Increment when hero power is used
      break;
      
    case 'summon_rush_minions':
      // Check if summoned minion has rush
      if (value && value.keywords && value.keywords.includes('rush')) {
        // Increment for rush minions
      } else {
        shouldUpdate = false;
      }
      break;
      
    case 'summon_minions':
      // Increment for any minion summoned
      break;
      
    case 'spend_mana_on_spells':
      // The value here would be the mana cost of the spell
      progressIncrement = value || 0;
      break;
      
    case 'hero_attacks':
      // Increment when hero attacks
      break;
      
    default:
      shouldUpdate = false;
      break;
  }
  
  // Update the progress if the action should count
  if (shouldUpdate && quest) {
    quest.progress += progressIncrement;
    
    // Add event to game log
    newState.gameLog.push(
      createGameLogEvent({
        type: 'quest_progress',
        player: playerType,
        cardId: String(quest.cardId),
        cardName: quest.cardName,
        text: `${playerType === 'player' ? 'Your' : 'Opponent\'s'} quest progress: ${quest.progress}/${quest.target}`,
        progress: quest.progress,
        target: quest.target
      })
    );
    
    // Check if quest is completed
    if (quest.progress >= quest.target) {
      return completeQuest(newState, playerType);
    }
  }
  
  return newState;
}

/**
 * Completes a quest and gives the player their reward
 * @param state Current game state
 * @param playerType Player whose quest is completed
 * @returns Updated game state with quest completed and reward added
 */
export function completeQuest(
  state: GameState,
  playerType: 'player' | 'opponent'
): GameState {
  // Make sure player has an active quest
  const activeQuest = state.players[playerType].activeQuest;
  if (!activeQuest || activeQuest.completed) {
    return state;
  }

  // Create a deep copy of the state to avoid mutation
  let updatedState = JSON.parse(JSON.stringify(state));
  
  // Mark the quest as completed
  updatedState.players[playerType].activeQuest.completed = true;
  
  // Add event to game log
  updatedState.gameLog.push(
    createGameLogEvent({
      type: 'quest_completed',
      player: playerType,
      cardId: String(activeQuest.cardId),
      cardName: activeQuest.cardName,
      text: `${playerType === 'player' ? 'You' : 'Opponent'} completed quest: ${activeQuest.cardName}!`,
      progress: activeQuest.progress,
      target: activeQuest.target
    })
  );
  
  // Get the reward card
  const rewardCard = getCardById(activeQuest.rewardCardId);
  
  if (rewardCard) {
    // Add the reward card to the player's hand
    updatedState = addCardToHand(updatedState, playerType, rewardCard);
    
    // Add event to game log
    updatedState.gameLog.push(
      createGameLogEvent({
        type: 'quest_reward_added',
        player: playerType,
        cardId: String(rewardCard.id),
        cardName: rewardCard.name,
        text: `${playerType === 'player' ? 'You' : 'Opponent'} received quest reward: ${rewardCard.name}!`
      })
    );
  }
  
  return updatedState;
}

/**
 * Get a player's active quest progress
 * @param state Current game state
 * @param playerType Player to check for
 * @returns Quest progress information or null if no active quest
 */
export function getQuestProgress(
  state: GameState,
  playerType: 'player' | 'opponent'
): { current: number; target: number; name: string } | null {
  const activeQuest = state.players[playerType].activeQuest;
  
  if (!activeQuest) {
    return null;
  }
  
  return {
    current: activeQuest.progress,
    target: activeQuest.target,
    name: activeQuest.cardName
  };
}

/**
 * Check if a card is a quest card
 * @param card Card to check
 * @returns True if it's a quest card
 */
export function isQuestCard(card: CardData): boolean {
  return (
    card.keywords?.includes('quest') &&
    card.spellEffect?.type === 'quest' &&
    !!card.spellEffect.questData
  );
}

/**
 * Handles quest progress update for various game actions
 * @param state Current game state
 * @param action Type of action that occurred
 * @param playerType Player who performed the action
 * @param value Additional data related to the action
 * @returns Updated game state
 */
export function handleQuestProgressForAction(
  state: GameState,
  action: string,
  playerType: 'player' | 'opponent',
  value?: any
): GameState {
  if (!state.players[playerType].activeQuest) {
    return state;
  }
  
  const questType = state.players[playerType].activeQuest?.type;
  
  // Map game actions to quest types
  switch (action) {
    case 'play_card':
      if (questType === 'cast_generated_spells' && value?.type === 'spell') {
        return updateQuestProgress(state, playerType, 'cast_generated_spells');
      } else if (questType === 'play_taunt_minions' && value?.keywords?.includes('taunt')) {
        return updateQuestProgress(state, playerType, 'play_taunt_minions', value);
      } else if (questType === 'play_minions_same_name' && value?.type === 'minion') {
        return updateQuestProgress(state, playerType, 'play_minions_same_name', value);
      }
      break;
      
    case 'summon':
      if (questType === 'summon_minions') {
        return updateQuestProgress(state, playerType, 'summon_minions');
      } else if (questType === 'summon_rush_minions' && value?.keywords?.includes('rush')) {
        return updateQuestProgress(state, playerType, 'summon_rush_minions', value);
      }
      break;
      
    case 'hero_power':
      if (questType === 'hero_power_uses') {
        return updateQuestProgress(state, playerType, 'hero_power_uses');
      }
      break;
      
    case 'hero_attack':
      if (questType === 'hero_attacks') {
        return updateQuestProgress(state, playerType, 'hero_attacks');
      }
      break;
  }
  
  return state;
}

/**
 * Helper function to create a log event for quest events
 * @param data Event data
 * @returns Game log event
 */
function createQuestLogEvent(data: {
  type: GameLogEventType,
  player: 'player' | 'opponent',
  cardId: string,
  text: string,
  progress?: number,
  target?: number
}) {
  return {
    id: `quest_${Date.now()}`,
    type: data.type,
    turn: 0, // This would be filled with current turn number
    timestamp: Date.now(),
    player: data.player,
    text: data.text,
    cardId: data.cardId,
    progress: data.progress,
    target: data.target
  };
}

// Function to get quest reward card by ID
export function getQuestRewardById(rewardId: number): CardData | undefined {
  return questRewards.find(card => card.id === rewardId);
}
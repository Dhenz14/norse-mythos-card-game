/**
 * AudioSubscriber.ts
 *
 * Subscribes to GameEventBus events and triggers appropriate audio.
 * This decouples audio logic from game logic.
 * 
 * Added by Enrique - Event-driven architecture integration
 */

import { GameEventBus } from '@/core/events/GameEventBus';
import type {
  CardPlayedEvent,
  CardDrawnEvent,
  MinionSummonedEvent,
  MinionDestroyedEvent,
  SpellCastEvent,
  BattlecryTriggeredEvent,
  DeathrattleTriggeredEvent,
  HeroPowerUsedEvent,
  SecretRevealedEvent,
  TurnStartedEvent,
  GameStartedEvent,
  GameEndedEvent,
  DiscoveryStartedEvent,
  PokerHandRevealedEvent,
  ShowdownResultEvent
} from '@/core/events/GameEvents';
import { useAudio, type SoundEffectType } from '@/lib/stores/useAudio';

type UnsubscribeFn = () => void;

/**
 * Audio mapping for card rarities
 */
const RARITY_SOUNDS: Record<string, SoundEffectType> = {
  legendary: 'legendary',
  epic: 'spell',
  rare: 'card_play',
  common: 'card_play',
  free: 'card_play'
};

/**
 * Audio mapping for card types
 */
const CARD_TYPE_SOUNDS: Record<string, SoundEffectType> = {
  minion: 'card_play',
  spell: 'spell',
  weapon: 'card_play',
  secret: 'card_play',
  hero: 'legendary'
};

/**
 * Initialize audio event subscriptions
 */
export function initializeAudioSubscriber(): UnsubscribeFn {
  const unsubscribes: UnsubscribeFn[] = [];

  // Card Played
  unsubscribes.push(
    GameEventBus.subscribe<CardPlayedEvent>('CARD_PLAYED', (event) => {
      const audioStore = useAudio.getState();

      // Play rarity-specific sound for legendaries
      if (event.rarity === 'legendary') {
        audioStore.playSoundEffect('legendary');
      } else {
        const sound = CARD_TYPE_SOUNDS[event.cardType] ?? 'card_play';
        audioStore.playSoundEffect(sound);
      }
    })
  );

  // Card Drawn
  unsubscribes.push(
    GameEventBus.subscribe<CardDrawnEvent>('CARD_DRAWN', (event) => {
      const audioStore = useAudio.getState();

      if (event.fromFatigue) {
        audioStore.playSoundEffect('damage');
      } else if (event.burned) {
        audioStore.playSoundEffect('error');
      } else {
        audioStore.playSoundEffect('card_draw');
      }
    })
  );

  // Minion Summoned
  unsubscribes.push(
    GameEventBus.subscribe<MinionSummonedEvent>('MINION_SUMMONED', (event) => {
      const audioStore = useAudio.getState();

      // Different sounds based on source
      if (event.source === 'battlecry' || event.source === 'deathrattle') {
        // Summoned by effect - subtle sound
        audioStore.playSoundEffect('battlecry');
      }
      // 'played' source already handled by CARD_PLAYED
    })
  );

  // Minion Destroyed
  unsubscribes.push(
    GameEventBus.subscribe<MinionDestroyedEvent>('MINION_DESTROYED', () => {
      const audioStore = useAudio.getState();
      audioStore.playSoundEffect('damage');
    })
  );

  // Spell Cast
  unsubscribes.push(
    GameEventBus.subscribe<SpellCastEvent>('SPELL_CAST', () => {
      const audioStore = useAudio.getState();
      audioStore.playSoundEffect('spell_cast');
    })
  );

  // Battlecry Triggered
  unsubscribes.push(
    GameEventBus.subscribe<BattlecryTriggeredEvent>('BATTLECRY_TRIGGERED', () => {
      const audioStore = useAudio.getState();
      audioStore.playSoundEffect('battlecry');
    })
  );

  // Deathrattle Triggered
  unsubscribes.push(
    GameEventBus.subscribe<DeathrattleTriggeredEvent>('DEATHRATTLE_TRIGGERED', () => {
      const audioStore = useAudio.getState();
      audioStore.playSoundEffect('deathrattle');
    })
  );

  // Hero Power Used
  unsubscribes.push(
    GameEventBus.subscribe<HeroPowerUsedEvent>('HERO_POWER_USED', () => {
      const audioStore = useAudio.getState();
      audioStore.playSoundEffect('hero_power');
    })
  );

  // Secret Revealed
  unsubscribes.push(
    GameEventBus.subscribe<SecretRevealedEvent>('SECRET_REVEALED', () => {
      const audioStore = useAudio.getState();
      audioStore.playSoundEffect('secret_trigger');
    })
  );

  // Turn Started
  unsubscribes.push(
    GameEventBus.subscribe<TurnStartedEvent>('TURN_STARTED', () => {
      const audioStore = useAudio.getState();
      audioStore.playSoundEffect('turn_start');
    })
  );

  // Game Started
  unsubscribes.push(
    GameEventBus.subscribe<GameStartedEvent>('GAME_STARTED', () => {
      const audioStore = useAudio.getState();
      audioStore.playSoundEffect('game_start');
      audioStore.playBackgroundMusic('battle_theme');
    })
  );

  // Game Ended
  unsubscribes.push(
    GameEventBus.subscribe<GameEndedEvent>('GAME_ENDED', (event) => {
      const audioStore = useAudio.getState();

      // Determine if player won
      if (event.winner === 'player') {
        audioStore.playSoundEffect('victory');
        audioStore.playBackgroundMusic('victory');
      } else if (event.winner === 'opponent') {
        audioStore.playSoundEffect('defeat');
        audioStore.playBackgroundMusic('defeat');
      }
    })
  );

  // Discovery Started
  unsubscribes.push(
    GameEventBus.subscribe<DiscoveryStartedEvent>('DISCOVERY_STARTED', () => {
      const audioStore = useAudio.getState();
      audioStore.playSoundEffect('discover');
    })
  );

  // Poker Hand Revealed
  unsubscribes.push(
    GameEventBus.subscribe<PokerHandRevealedEvent>('POKER_HAND_REVEALED', (event) => {
      const audioStore = useAudio.getState();
      // Higher value hands get more dramatic sound
      if (event.value >= 7) {
        audioStore.playSoundEffect('legendary');
      } else if (event.value >= 4) {
        audioStore.playSoundEffect('spell');
      } else {
        audioStore.playSoundEffect('card_play');
      }
    })
  );

  // Showdown Result
  unsubscribes.push(
    GameEventBus.subscribe<ShowdownResultEvent>('SHOWDOWN_RESULT', (event) => {
      const audioStore = useAudio.getState();
      if (event.winner === 'player') {
        audioStore.playSoundEffect('victory');
      } else if (event.winner === 'opponent') {
        audioStore.playSoundEffect('damage_hero');
      }
    })
  );

  // Return cleanup function
  return () => {
    unsubscribes.forEach(unsub => unsub());
  };
}

export default initializeAudioSubscriber;

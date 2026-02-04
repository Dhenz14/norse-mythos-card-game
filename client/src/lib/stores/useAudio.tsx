/**
 * useAudio.tsx
 * 
 * A custom store to manage all audio playback in the game,
 * including sound effects, background music, and voice lines.
 */

import { create } from 'zustand';
import { Howl } from 'howler';

// Define audio track types
export type BackgroundMusicTrack = 'main_menu' | 'battle_theme' | 'victory' | 'defeat';
export type SoundEffectType = 
  | 'card_play' 
  | 'card_draw' 
  | 'attack'
  | 'damage'
  | 'heal'
  | 'coin'
  | 'legendary'
  | 'spell'
  | 'freeze'
  | 'deathrattle'
  | 'battlecry'
  | 'discover'
  | 'secret_trigger'
  | 'game_start'
  | 'victory'
  | 'defeat'
  | 'card_hover'
  | 'card_click'
  | 'button_click'
  | 'error'
  | 'hero_power'
  // Add new sound effect types for enhanced animations
  | 'attack_prepare'
  | 'spell_charge'
  | 'spell_cast'
  | 'spell_impact'
  | 'fire_impact'
  | 'legendary_entrance'
  | 'turn_start'
  | 'turn_end'
  | 'damage_hero';

interface AudioState {
  // Sound settings
  soundEnabled: boolean;
  musicEnabled: boolean;
  soundVolume: number;
  musicVolume: number;
  
  // Current audio states
  currentMusic?: Howl;
  currentMusicTrack?: BackgroundMusicTrack;
  
  // Audio collections
  soundEffects: Record<SoundEffectType, Howl>;
  musicTracks: Record<BackgroundMusicTrack, Howl>;
  
  // Methods
  toggleSound: () => void;
  toggleMusic: () => void;
  setSoundVolume: (volume: number) => void;
  setMusicVolume: (volume: number) => void;
  playSoundEffect: (type: SoundEffectType) => void;
  playBackgroundMusic: (track: BackgroundMusicTrack) => void;
  stopBackgroundMusic: () => void;
}

// Create the audio store
export const useAudio = create<AudioState>((set, get) => ({
  soundEnabled: true,
  musicEnabled: true,
  soundVolume: 0.7,
  musicVolume: 0.5,
  
  // Initialize sound effects with Howl objects
  soundEffects: {
    card_play: new Howl({ src: ['/assets/audio/card_play.mp3'], volume: 0.7 }),
    card_draw: new Howl({ src: ['/assets/audio/card_draw.mp3'], volume: 0.6 }),
    attack: new Howl({ src: ['/assets/audio/attack.mp3'], volume: 0.7 }),
    damage: new Howl({ src: ['/assets/audio/damage.mp3'], volume: 0.7 }),
    heal: new Howl({ src: ['/assets/audio/heal.mp3'], volume: 0.6 }),
    coin: new Howl({ src: ['/assets/audio/coin.mp3'], volume: 0.7 }),
    legendary: new Howl({ src: ['/assets/audio/legendary.mp3'], volume: 0.8 }),
    spell: new Howl({ src: ['/assets/audio/spell.mp3'], volume: 0.7 }),
    freeze: new Howl({ src: ['/assets/audio/freeze.mp3'], volume: 0.7 }),
    deathrattle: new Howl({ src: ['/assets/audio/deathrattle.mp3'], volume: 0.7 }),
    battlecry: new Howl({ src: ['/assets/audio/battlecry.mp3'], volume: 0.7 }),
    discover: new Howl({ src: ['/assets/audio/discover.mp3'], volume: 0.6 }),
    secret_trigger: new Howl({ src: ['/assets/audio/secret_trigger.mp3'], volume: 0.8 }),
    game_start: new Howl({ src: ['/assets/audio/game_start.mp3'], volume: 0.7 }),
    victory: new Howl({ src: ['/assets/audio/victory.mp3'], volume: 0.8 }),
    defeat: new Howl({ src: ['/assets/audio/defeat.mp3'], volume: 0.8 }),
    card_hover: new Howl({ src: ['/assets/audio/card_hover.mp3'], volume: 0.4 }),
    card_click: new Howl({ src: ['/assets/audio/card_click.mp3'], volume: 0.5 }),
    button_click: new Howl({ src: ['/assets/audio/button_click.mp3'], volume: 0.5 }),
    error: new Howl({ src: ['/assets/audio/error.mp3'], volume: 0.5 }),
    hero_power: new Howl({ src: ['/assets/audio/hero_power.mp3'], volume: 0.7 }),
    
    // Enhanced animation sound effects
    attack_prepare: new Howl({ src: ['/assets/audio/attack_prepare.mp3'], volume: 0.6 }),
    spell_charge: new Howl({ src: ['/assets/audio/spell_charge.mp3'], volume: 0.6 }),
    spell_cast: new Howl({ src: ['/assets/audio/spell_cast.mp3'], volume: 0.7 }),
    spell_impact: new Howl({ src: ['/assets/audio/spell_impact.mp3'], volume: 0.7 }),
    fire_impact: new Howl({ src: ['/assets/audio/fire_impact.mp3'], volume: 0.7 }),
    // Add new animation sound effects for cinematics
    legendary_entrance: new Howl({ src: ['/assets/audio/legendary.mp3'], volume: 0.9 }), // Using legendary file for now
    turn_start: new Howl({ src: ['/assets/audio/spell_cast.mp3'], volume: 0.7 }), // Using spell cast for now
    turn_end: new Howl({ src: ['/assets/audio/spell_impact.mp3'], volume: 0.7 }), // Using spell impact for now
    damage_hero: new Howl({ src: ['/assets/audio/damage.mp3'], volume: 0.8 }), // Using damage for now
  },
  
  // Initialize music tracks
  musicTracks: {
    main_menu: new Howl({ 
      src: ['/assets/audio/main_menu.mp3'], 
      volume: 0.5, 
      loop: true 
    }),
    battle_theme: new Howl({ 
      src: ['/assets/audio/battle_theme.mp3'], 
      volume: 0.5, 
      loop: true 
    }),
    victory: new Howl({ 
      src: ['/assets/audio/victory_music.mp3'], 
      volume: 0.5, 
      loop: false 
    }),
    defeat: new Howl({ 
      src: ['/assets/audio/defeat_music.mp3'], 
      volume: 0.5, 
      loop: false 
    }),
  },
  
  // Method to toggle sound effects on/off
  toggleSound: () => {
    const enabled = !get().soundEnabled;
    
    // Update all sound effects volume
    Object.values(get().soundEffects).forEach(sound => {
      sound.volume(enabled ? get().soundVolume : 0);
    });
    
    set({ soundEnabled: enabled });
  },
  
  // Method to toggle background music on/off
  toggleMusic: () => {
    const enabled = !get().musicEnabled;
    const currentMusic = get().currentMusic;
    
    if (currentMusic) {
      currentMusic.volume(enabled ? get().musicVolume : 0);
    }
    
    set({ musicEnabled: enabled });
  },
  
  // Method to set sound effects volume
  setSoundVolume: (volume: number) => {
    // Update all sound effects volume if sound is enabled
    if (get().soundEnabled) {
      Object.values(get().soundEffects).forEach(sound => {
        sound.volume(volume);
      });
    }
    
    set({ soundVolume: volume });
  },
  
  // Method to set background music volume
  setMusicVolume: (volume: number) => {
    const currentMusic = get().currentMusic;
    
    // Update current music volume if music is enabled
    if (currentMusic && get().musicEnabled) {
      currentMusic.volume(volume);
    }
    
    set({ musicVolume: volume });
  },
  
  // Method to play a sound effect
  playSoundEffect: (type: SoundEffectType) => {
    // Only play sound if sound effects are enabled
    if (!get().soundEnabled) return;
    
    const sound = get().soundEffects[type];
    if (sound) {
      sound.play();
    } else {
      console.warn(`Sound effect ${type} not found.`);
    }
  },
  
  // Method to play background music
  playBackgroundMusic: (track: BackgroundMusicTrack) => {
    const current = get().currentMusic;
    const tracks = get().musicTracks;
    
    // Stop current music if playing
    if (current) {
      current.stop();
    }
    
    // Start playing new track
    const newTrack = tracks[track];
    if (newTrack) {
      newTrack.volume(get().musicEnabled ? get().musicVolume : 0);
      newTrack.play();
      set({ 
        currentMusic: newTrack,
        currentMusicTrack: track
      });
    } else {
      console.warn(`Music track ${track} not found.`);
    }
  },
  
  // Method to stop background music
  stopBackgroundMusic: () => {
    const current = get().currentMusic;
    
    if (current) {
      current.stop();
      set({ 
        currentMusic: undefined,
        currentMusicTrack: undefined
      });
    }
  }
}));

export default useAudio;
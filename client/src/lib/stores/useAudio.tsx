import { create } from 'zustand';
import { Howl } from 'howler';
import { proceduralAudio, type SoundType } from '../../game/audio/proceduralAudio';

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
	| 'attack_prepare'
	| 'spell_charge'
	| 'spell_cast'
	| 'spell_impact'
	| 'fire_impact'
	| 'legendary_entrance'
	| 'turn_start'
	| 'turn_end'
	| 'damage_hero'
	| 'mana_fill'
	| 'mana_spend'
	| 'fatigue'
	| 'emote';

function createMusicTrack(src: string, loop: boolean, volume: number): Howl | null {
	try {
		return new Howl({ src: [src], volume, loop, preload: false });
	} catch {
		return null;
	}
}

interface AudioState {
	soundEnabled: boolean;
	musicEnabled: boolean;
	soundVolume: number;
	musicVolume: number;
	currentMusic?: Howl | null;
	currentMusicTrack?: BackgroundMusicTrack;
	musicTracks: Record<BackgroundMusicTrack, Howl | null>;

	toggleSound: () => void;
	toggleMusic: () => void;
	setSoundVolume: (volume: number) => void;
	setMusicVolume: (volume: number) => void;
	playSoundEffect: (type: SoundEffectType) => void;
	playBackgroundMusic: (track: BackgroundMusicTrack) => void;
	stopBackgroundMusic: () => void;
}

export const useAudio = create<AudioState>((set, get) => ({
	soundEnabled: true,
	musicEnabled: true,
	soundVolume: 0.7,
	musicVolume: 0.5,

	musicTracks: {
		main_menu: createMusicTrack('/assets/audio/main_menu.mp3', true, 0.5),
		battle_theme: createMusicTrack('/assets/audio/battle_theme.mp3', true, 0.5),
		victory: createMusicTrack('/assets/audio/victory_music.mp3', false, 0.5),
		defeat: createMusicTrack('/assets/audio/defeat_music.mp3', false, 0.5),
	},

	toggleSound: () => {
		const enabled = !get().soundEnabled;
		proceduralAudio.setEnabled(enabled);
		set({ soundEnabled: enabled });
	},

	toggleMusic: () => {
		const enabled = !get().musicEnabled;
		const currentMusic = get().currentMusic;
		if (currentMusic) {
			try {
				currentMusic.volume(enabled ? get().musicVolume : 0);
			} catch {
				// music file may not exist
			}
		}
		set({ musicEnabled: enabled });
	},

	setSoundVolume: (volume: number) => {
		proceduralAudio.setVolume(volume);
		set({ soundVolume: volume });
	},

	setMusicVolume: (volume: number) => {
		const currentMusic = get().currentMusic;
		if (currentMusic && get().musicEnabled) {
			try {
				currentMusic.volume(volume);
			} catch {
				// music file may not exist
			}
		}
		set({ musicVolume: volume });
	},

	playSoundEffect: (type: SoundEffectType) => {
		if (!get().soundEnabled) return;
		proceduralAudio.play(type as SoundType);
	},

	playBackgroundMusic: (track: BackgroundMusicTrack) => {
		const current = get().currentMusic;
		const tracks = get().musicTracks;

		if (current) {
			try {
				current.stop();
			} catch {
				// ignore
			}
		}

		const newTrack = tracks[track];
		if (newTrack) {
			try {
				newTrack.volume(get().musicEnabled ? get().musicVolume : 0);
				newTrack.play();
				set({
					currentMusic: newTrack,
					currentMusicTrack: track,
				});
			} catch {
				set({
					currentMusic: null,
					currentMusicTrack: track,
				});
			}
		}
	},

	stopBackgroundMusic: () => {
		const current = get().currentMusic;
		if (current) {
			try {
				current.stop();
			} catch {
				// ignore
			}
			set({
				currentMusic: undefined,
				currentMusicTrack: undefined,
			});
		}
	},
}));

export default useAudio;

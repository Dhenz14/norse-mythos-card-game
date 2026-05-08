/**
 * AudioBusSubscriber.ts
 *
 * Subscribes to the audio event bus and forwards each emitted sound id to
 * the audio store. Mirrors the imperative subscriber pattern used by
 * AudioSubscriber, NotificationSubscriber, AnimationSubscriber, etc., and
 * is registered alongside them in `gameStoreIntegration`.
 *
 * Why a separate subscriber from AudioSubscriber: AudioSubscriber maps
 * domain events ('CARD_PLAYED', 'BATTLECRY_TRIGGERED', ...) to sounds.
 * AudioBusSubscriber serves direct "play this sound" commands emitted from
 * gameplay stores that historically called `useAudio.getState().playSoundEffect`
 * inline. Both subscribers feed the same audio store; they decouple
 * different concerns.
 */

import { audioEventBus } from '@/game/audio/audioEventBus';
import { useAudio } from '@/lib/stores/useAudio';

type UnsubscribeFn = () => void;

/**
 * Initialize the audio bus subscriber. Call once at app startup.
 * Returns a cleanup function that detaches the subscriber.
 */
export function initializeAudioBusSubscriber(): UnsubscribeFn {
	return audioEventBus.subscribe((soundId) => {
		const audioStore = useAudio.getState();
		audioStore.playSoundEffect(soundId);
	});
}

export default initializeAudioBusSubscriber;

/**
 * AudioEventBus - Decoupling layer for audio side-effects from gameplay stores.
 *
 * Why this exists: gameplay stores (mulliganStore, gameCommandStoreAdapter)
 * historically called `useAudio.getState().playSoundEffect(...)` directly,
 * leaking a UI side-effect into engine logic. That coupling blocks moving
 * those engines to `shared/protocol-core/` (SCOPE D of the layer-separation
 * plan) and conflicts with the principle that gameplay logic must be pure.
 *
 * The bus is a thin module-level singleton: stores `emit(soundId)` an event;
 * a subscriber registered at app startup (`AudioBusSubscriber`) listens and
 * dispatches the actual `playSoundEffect` call. The bus is intentionally
 * NOT a semantic abstraction — it carries the same `SoundEffectType` strings
 * the audio store accepts, so migration is mechanical (replace the call,
 * type stays identical).
 *
 * Buffer policy: emits before any subscriber is attached land in a small
 * ring (BUFFER_SIZE = 8) and drain to the first subscriber on attach. This
 * survives the boot-time gap between an early store action and the
 * `initializeGameStoreIntegration` call that wires the subscriber. Once a
 * subscriber is attached, the buffer stays empty — new emits go straight
 * to subscribers via `queueMicrotask` (non-blocking, but in-order on the
 * same tick).
 *
 * Coexists with `GameEventBus` (domain events for engine state changes).
 * The two have different purposes: GameEventBus carries "a card was played",
 * audioEventBus carries "play this sound now". A SoundEffectType emit is
 * not a domain event — it's a direct command from places that historically
 * had to know about audio.
 */

import type { SoundEffectType } from '../../lib/stores/useAudio';

type AudioBusHandler = (soundId: SoundEffectType) => void;

const BUFFER_SIZE = 8;

const handlers = new Set<AudioBusHandler>();
const pendingBuffer: SoundEffectType[] = [];

const dispatchToHandlers = (soundId: SoundEffectType): void => {
	for (const handler of handlers) {
		try {
			handler(soundId);
		} catch {
			// Subscribers must not break the bus. Audio is best-effort.
		}
	}
};

const drainBuffer = (handler: AudioBusHandler): void => {
	if (pendingBuffer.length === 0) return;
	const drained = pendingBuffer.splice(0, pendingBuffer.length);
	for (const soundId of drained) {
		try {
			handler(soundId);
		} catch {
			// Same rationale as dispatchToHandlers.
		}
	}
};

export const audioEventBus = {
	/**
	 * Emit a sound-effect request. If at least one subscriber is attached,
	 * delivery is queued via queueMicrotask. Otherwise the event lands in
	 * a small ring buffer and is delivered when the first subscriber attaches.
	 */
	emit(soundId: SoundEffectType): void {
		if (handlers.size === 0) {
			if (pendingBuffer.length >= BUFFER_SIZE) {
				pendingBuffer.shift();
			}
			pendingBuffer.push(soundId);
			return;
		}
		queueMicrotask(() => dispatchToHandlers(soundId));
	},

	/**
	 * Register a handler. Returns an unsubscribe function. On the FIRST
	 * subscribe call after a buffered period, the buffer drains synchronously
	 * to the new subscriber so no boot-time emits are lost.
	 */
	subscribe(handler: AudioBusHandler): () => void {
		const isFirst = handlers.size === 0;
		handlers.add(handler);
		if (isFirst) {
			drainBuffer(handler);
		}
		return () => {
			handlers.delete(handler);
		};
	},

	/**
	 * Test-only: reset bus state between unit tests so cases run in
	 * isolation. Production code should never call this.
	 */
	__resetForTests(): void {
		handlers.clear();
		pendingBuffer.length = 0;
	}
};

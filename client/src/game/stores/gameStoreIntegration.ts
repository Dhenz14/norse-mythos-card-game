/**
 * gameStoreIntegration.ts
 *
 * Integration layer that connects the legacy gameStore with the new
 * event-driven architecture. This allows gradual migration without
 * breaking existing functionality.
 *
 * Usage:
 * Call initializeGameStoreIntegration() once at app startup to:
 * 1. Initialize all UI subscribers (audio, notifications, animations)
 * 2. Set up event forwarding from legacy actions to GameEventBus
 * 
 * Added by Enrique - Event-driven architecture integration
 */

import { GameEventBus } from '@/core/events/GameEventBus';
import { initializeAudioSubscriber } from '@/game/subscribers/AudioSubscriber';
import { initializeNotificationSubscriber } from '@/game/subscribers/NotificationSubscriber';
import { initializeAnimationSubscriber } from '@/game/subscribers/AnimationSubscriber';
import { initializeBlockchainSubscriber } from '@/game/subscribers/BlockchainSubscriber';
import { startTransactionProcessor, stopTransactionProcessor } from '@/data/blockchain/transactionProcessor';
import { isBlockchainPackagingEnabled } from '../config/featureFlags';
import { debug } from '../config/debugConfig';

let isInitialized = false;
let cleanupFunctions: (() => void)[] = [];

/**
 * Initialize the game store integration layer.
 * This connects the new event-driven architecture with the existing stores.
 */
export function initializeGameStoreIntegration(): () => void {
  if (isInitialized) {
    debug.warn('[GameStoreIntegration] Already initialized, skipping');
    return () => {};
  }

  debug.log('[GameStoreIntegration] Initializing event-driven architecture...');

  // Initialize UI subscribers
  cleanupFunctions.push(initializeAudioSubscriber());
  cleanupFunctions.push(initializeNotificationSubscriber());
  cleanupFunctions.push(initializeAnimationSubscriber());

  // Initialize blockchain subscriber + transaction processor when enabled
  if (isBlockchainPackagingEnabled()) {
    cleanupFunctions.push(initializeBlockchainSubscriber());
    startTransactionProcessor();
    cleanupFunctions.push(stopTransactionProcessor);
    debug.log('[GameStoreIntegration] Blockchain subscriber + transaction processor started');
  }

  isInitialized = true;
  debug.log('[GameStoreIntegration] Initialization complete');

  // Return cleanup function
  return () => {
    cleanupFunctions.forEach(cleanup => cleanup());
    cleanupFunctions = [];
    isInitialized = false;
    GameEventBus.reset();
    debug.log('[GameStoreIntegration] Cleanup complete');
  };
}

/**
 * Check if integration is initialized
 */
export function isIntegrationInitialized(): boolean {
  return isInitialized;
}

/**
 * Get the GameEventBus for direct event emission
 */
export function getEventBus(): typeof GameEventBus {
  return GameEventBus;
}

export default initializeGameStoreIntegration;

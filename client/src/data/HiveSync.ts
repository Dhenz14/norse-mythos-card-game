/**
 * HiveSync - Blockchain Communication (Core 5 Only)
 * 
 * Handles Hive Keychain integration for the 5 core transaction types:
 * - rp_team_submit
 * - rp_match_result
 * - rp_card_transfer
 * - rp_pack_open
 * - rp_reward_claim
 * 
 * Status: BLUEPRINT ONLY - Ready for implementation when Hive integration begins.
 */

import {
  HiveMatchResult,
  RagnarokTransactionType,
  RAGNAROK_CUSTOM_JSON_PREFIX,
} from './schemas/HiveTypes';

export interface HiveBroadcastResult {
  success: boolean;
  trxId?: string;
  blockNum?: number;
  error?: string;
}

export interface HiveKeychainResponse {
  success: boolean;
  result?: {
    id: string;
    block_num: number;
    trx_num: number;
  };
  error?: string;
  message?: string;
}

declare global {
  interface Window {
    hive_keychain?: {
      requestCustomJson: (
        username: string,
        id: string,
        keyType: 'Active' | 'Posting',
        json: string,
        displayName: string,
        callback: (response: HiveKeychainResponse) => void
      ) => void;
      requestSignBuffer: (
        username: string,
        message: string,
        keyType: 'Active' | 'Posting' | 'Memo',
        callback: (response: HiveKeychainResponse) => void,
        rpc?: string,
        title?: string
      ) => void;
    };
  }
}

export class HiveSync {
  private username: string | null = null;

  isKeychainAvailable(): boolean {
    return typeof window !== 'undefined' && !!window.hive_keychain;
  }

  setUsername(username: string) {
    this.username = username;
  }

  getUsername(): string | null {
    return this.username;
  }

  private generateTrxId(): string {
    return `${RAGNAROK_CUSTOM_JSON_PREFIX}${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async broadcastCustomJson(
    type: RagnarokTransactionType,
    payload: Record<string, unknown>,
    useActiveKey: boolean = false
  ): Promise<HiveBroadcastResult> {
    if (!this.username) {
      return { success: false, error: 'No username set' };
    }

    if (!this.isKeychainAvailable()) {
      return { success: false, error: 'Hive Keychain not available' };
    }

    return new Promise((resolve) => {
      const jsonStr = JSON.stringify({
        ...payload,
        app: 'ragnarok-poker/1.0',
        timestamp: Date.now(),
      });

      window.hive_keychain!.requestCustomJson(
        this.username!,
        type,
        useActiveKey ? 'Active' : 'Posting',
        jsonStr,
        `Ragnarok Poker: ${type.replace(RAGNAROK_CUSTOM_JSON_PREFIX, '').replace(/_/g, ' ')}`,
        (response) => {
          resolve({
            success: response.success,
            trxId: response.result?.id,
            blockNum: response.result?.block_num,
            error: response.error || response.message,
          });
        }
      );
    });
  }

  async submitTeam(matchId: string, heroIds: string[], kingId: string, deckHash: string): Promise<HiveBroadcastResult> {
    return this.broadcastCustomJson('rp_team_submit', {
      match_id: matchId,
      hero_ids: heroIds,
      king_id: kingId,
      deck_hash: deckHash,
    });
  }

  async recordMatchResult(match: Omit<HiveMatchResult, 'trxId' | 'blockNum'>): Promise<HiveBroadcastResult> {
    return this.broadcastCustomJson('rp_match_result', match as unknown as Record<string, unknown>);
  }

  async transferCard(cardUid: string, toUser: string, memo?: string): Promise<HiveBroadcastResult> {
    return this.broadcastCustomJson('rp_card_transfer', {
      card_uid: cardUid,
      to: toUser,
      memo,
    }, true);
  }

  async openPack(packType: string, quantity: number = 1): Promise<HiveBroadcastResult> {
    return this.broadcastCustomJson('rp_pack_open', {
      pack_type: packType,
      quantity,
    });
  }

  async claimReward(rewardType: string, rewardId: string): Promise<HiveBroadcastResult> {
    return this.broadcastCustomJson('rp_reward_claim', {
      reward_type: rewardType,
      reward_id: rewardId,
    });
  }

  /**
   * Verify account ownership via Keychain requestSignBuffer.
   * Signs a timestamped message with the user's Posting key — no transaction posted.
   */
  async login(username: string): Promise<HiveBroadcastResult> {
    if (!this.isKeychainAvailable()) {
      return { success: false, error: 'Hive Keychain extension not installed' };
    }

    const message = `ragnarok-login:${username}:${Date.now()}`;

    return new Promise((resolve) => {
      window.hive_keychain!.requestSignBuffer(
        username,
        message,
        'Posting',
        (response) => {
          if (response.success) {
            this.username = username;
            resolve({ success: true });
          } else {
            resolve({ success: false, error: response.error || response.message });
          }
        },
        undefined,
        'Log in to Ragnarok Cards'
      );
    });
  }

  hashDeck(cardIds: number[]): string {
    const sorted = [...cardIds].sort((a, b) => a - b);
    return btoa(sorted.join(',')).replace(/=/g, '');
  }

  generateMatchSeed(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 16)}`;
  }
}

export const hiveSync = new HiveSync();

/**
 * HiveSync - Hive Keychain integration
 *
 * Handles broadcasting via Hive Keychain for core transaction types:
 * rp_team_submit, rp_match_result, rp_card_transfer, rp_pack_open, rp_level_up
 *
 * Also provides login (requestSignBuffer) and signResultHash (dual-sig).
 */

import {
  HiveMatchResult,
  RagnarokTransactionType,
  RAGNAROK_CUSTOM_JSON_PREFIX,
  RAGNAROK_APP_ID,
} from './schemas/HiveTypes';

export interface HiveBroadcastResult {
  success: boolean;
  trxId?: string;
  blockNum?: number;
  error?: string;
}

export interface HiveSignatureResult {
  success: boolean;
  signature?: string;
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

const KEYCHAIN_TIMEOUT_MS = 60_000;

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

    const action = type.replace(RAGNAROK_CUSTOM_JSON_PREFIX, '');
    const jsonStr = JSON.stringify({
      ...payload,
      app: RAGNAROK_APP_ID,
      action,
    });

    const keychainPromise = new Promise<HiveBroadcastResult>((resolve) => {
      window.hive_keychain!.requestCustomJson(
        this.username!,
        RAGNAROK_APP_ID,
        useActiveKey ? 'Active' : 'Posting',
        jsonStr,
        `Ragnarok: ${action.replace(/_/g, ' ')}`,
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

    const timeout = new Promise<HiveBroadcastResult>((resolve) =>
      setTimeout(() => resolve({ success: false, error: 'Keychain timeout (60s)' }), KEYCHAIN_TIMEOUT_MS)
    );

    return Promise.race([keychainPromise, timeout]);
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

  async transferCards(cardUids: string[], toUser: string, memo?: string): Promise<HiveBroadcastResult> {
    return this.broadcastCustomJson('rp_card_transfer', {
      cards: cardUids.map(uid => ({ card_uid: uid })),
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

  // ── v1.1: Pack NFT operations ──

  async mintPack(packType: string, quantity: number, toUser: string): Promise<HiveBroadcastResult> {
    return this.broadcastCustomJson('rp_pack_mint', {
      pack_type: packType,
      quantity,
      to: toUser,
    }, true);
  }

  async distributePacks(packUids: string[], toUser: string): Promise<HiveBroadcastResult> {
    return this.broadcastCustomJson('rp_pack_distribute', {
      pack_uids: packUids,
      to: toUser,
    }, true);
  }

  async transferPack(packUid: string, toUser: string, memo?: string): Promise<HiveBroadcastResult> {
    return this.broadcastCustomJson('rp_pack_transfer', {
      pack_uid: packUid,
      to: toUser,
      memo,
    }, true);
  }

  async burnPack(packUid: string, salt: string, saltCommit?: string): Promise<HiveBroadcastResult> {
    return this.broadcastCustomJson('rp_pack_burn', {
      pack_uid: packUid,
      salt,
      salt_commit: saltCommit,
    }, true);
  }

  // ── v1.1: DNA Lineage operations ──

  async replicateCard(sourceUid: string, foil?: 'standard' | 'gold'): Promise<HiveBroadcastResult> {
    return this.broadcastCustomJson('rp_card_replicate', {
      source_uid: sourceUid,
      foil,
    }, true);
  }

  async mergeCards(sourceUids: [string, string]): Promise<HiveBroadcastResult> {
    return this.broadcastCustomJson('rp_card_merge', {
      source_uids: sourceUids,
    }, true);
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

    const keychainPromise = new Promise<HiveBroadcastResult>((resolve) => {
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

    const timeout = new Promise<HiveBroadcastResult>((resolve) =>
      setTimeout(() => resolve({ success: false, error: 'Keychain timeout (60s)' }), KEYCHAIN_TIMEOUT_MS)
    );

    return Promise.race([keychainPromise, timeout]);
  }

  async stampLevelUp(cardUid: string, cardId: number, newLevel: number): Promise<HiveBroadcastResult> {
    return this.broadcastCustomJson('rp_level_up', {
      nft_id: cardUid,
      card_id: cardId,
      new_level: newLevel,
    });
  }

  async claimReward(rewardId: string): Promise<HiveBroadcastResult> {
    return this.broadcastCustomJson('rp_reward_claim', {
      reward_id: rewardId,
    });
  }

  async signMessage(
    message: string,
    options?: { username?: string; keyType?: 'Active' | 'Posting' | 'Memo'; title?: string }
  ): Promise<HiveSignatureResult> {
    const user = options?.username ?? this.username;
    if (!user) {
      return { success: false, error: 'No username set' };
    }
    if (!this.isKeychainAvailable()) {
      return { success: false, error: 'Hive Keychain not available' };
    }

    const keyType = options?.keyType ?? 'Posting';
    const title = options?.title ?? 'Sign message';

    const keychainPromise = new Promise<HiveSignatureResult>((resolve) => {
      window.hive_keychain!.requestSignBuffer(
        user,
        message,
        keyType,
        (response) => {
          if (response.success && response.result) {
            resolve({ success: true, signature: response.result.id });
          } else {
            resolve({ success: false, error: response.error || response.message });
          }
        },
        undefined,
        title
      );
    });

    const timeout = new Promise<HiveSignatureResult>((resolve) =>
      setTimeout(() => resolve({ success: false, error: 'Keychain timeout (60s)' }), KEYCHAIN_TIMEOUT_MS)
    );

    return Promise.race([keychainPromise, timeout]);
  }

  async signResultHash(hash: string): Promise<string> {
    if (!this.username) {
      throw new Error('No username set');
    }
    if (!this.isKeychainAvailable()) {
      throw new Error('Hive Keychain not available');
    }

    const keychainPromise = new Promise<string>((resolve, reject) => {
      window.hive_keychain!.requestSignBuffer(
        this.username!,
        hash,
        'Posting',
        (response) => {
          if (response.success && response.result) {
            resolve(String(response.result));
          } else {
            reject(new Error(response.error || response.message || 'Signing failed'));
          }
        },
        undefined,
        'Sign match result'
      );
    });

    const timeout = new Promise<string>((_, reject) =>
      setTimeout(() => reject(new Error('Keychain signing timeout (60s)')), KEYCHAIN_TIMEOUT_MS)
    );

    return Promise.race([keychainPromise, timeout]);
  }
}

export const hiveSync = new HiveSync();

export async function buildHiveAuthBody(
	username: string,
	action: string,
	bodyFields: Record<string, unknown> = {},
): Promise<Record<string, unknown>> {
	const timestamp = Date.now();
	const message = `ragnarok-${action}:${username}:${timestamp}`;
	const result = await hiveSync.signMessage(message, {
		title: `Ragnarok: ${action.replace(/-/g, ' ')}`,
	});
	return {
		...bodyFields,
		username,
		timestamp,
		signature: result.success ? result.signature : undefined,
	};
}

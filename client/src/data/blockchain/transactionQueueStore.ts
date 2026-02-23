import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
	TransactionEntry,
	BlockchainActionType,
	TransactionStatus
} from './types';
import {
	TX_EXPIRY_MS,
	MAX_QUEUE_SIZE,
	DEFAULT_MAX_RETRIES
} from './types';

interface TransactionQueueState {
	transactions: TransactionEntry[];
	isProcessing: boolean;
}

interface TransactionQueueActions {
	enqueue: <T>(actionType: BlockchainActionType, payload: T, hash: string) => string;
	dequeue: (id: string) => void;
	updateStatus: (id: string, status: TransactionStatus, meta?: Partial<TransactionEntry>) => void;
	retry: (id: string) => boolean;
	getByStatus: (status: TransactionStatus) => TransactionEntry[];
	getByType: (type: BlockchainActionType) => TransactionEntry[];
	getNext: () => TransactionEntry | null;
	cleanupExpired: () => number;
	cleanupConfirmed: (olderThanMs?: number) => number;
	clear: () => void;
	getQueueStats: () => {
		total: number;
		byStatus: Record<string, number>;
		byType: Record<string, number>;
	};
}

type TransactionQueueStore = TransactionQueueState & TransactionQueueActions;

function generateTxId(): string {
	return `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export const useTransactionQueueStore = create<TransactionQueueStore>()(
	persist(
		(set, get) => ({
			transactions: [],
			isProcessing: false,

			enqueue: <T>(actionType: BlockchainActionType, payload: T, hash: string): string => {
				const id = generateTxId();
				const now = Date.now();

				const entry: TransactionEntry<T> = {
					id,
					actionType,
					status: 'queued',
					payload,
					hash,
					createdAt: now,
					updatedAt: now,
					retryCount: 0,
					maxRetries: DEFAULT_MAX_RETRIES,
					error: null,
					trxId: null,
					blockNum: null,
					expiresAt: now + TX_EXPIRY_MS,
				};

				set((state) => {
					const txs = [entry as TransactionEntry, ...state.transactions];
					if (txs.length > MAX_QUEUE_SIZE) {
						txs.length = MAX_QUEUE_SIZE;
					}
					return { transactions: txs };
				});

				return id;
			},

			dequeue: (id: string) => {
				set((state) => ({
					transactions: state.transactions.filter(tx => tx.id !== id),
				}));
			},

			updateStatus: (id: string, status: TransactionStatus, meta?: Partial<TransactionEntry>) => {
				set((state) => ({
					transactions: state.transactions.map(tx =>
						tx.id === id
							? { ...tx, ...meta, status, updatedAt: Date.now() }
							: tx
					),
				}));
			},

			retry: (id: string): boolean => {
				const tx = get().transactions.find(t => t.id === id);
				if (!tx || tx.retryCount >= tx.maxRetries) return false;

				set((state) => ({
					transactions: state.transactions.map(t =>
						t.id === id
							? {
								...t,
								status: 'queued' as TransactionStatus,
								retryCount: t.retryCount + 1,
								error: null,
								updatedAt: Date.now(),
							}
							: t
					),
				}));

				return true;
			},

			getByStatus: (status: TransactionStatus): TransactionEntry[] => {
				return get().transactions.filter(tx => tx.status === status);
			},

			getByType: (type: BlockchainActionType): TransactionEntry[] => {
				return get().transactions.filter(tx => tx.actionType === type);
			},

			getNext: (): TransactionEntry | null => {
				const ready = get().transactions
					.filter(tx => tx.status === 'ready')
					.sort((a, b) => a.createdAt - b.createdAt);
				return ready[0] || null;
			},

			cleanupExpired: (): number => {
				const now = Date.now();
				const before = get().transactions.length;
				set((state) => ({
					transactions: state.transactions.filter(tx =>
						tx.expiresAt > now || tx.status === 'confirmed'
					),
				}));
				return before - get().transactions.length;
			},

			cleanupConfirmed: (olderThanMs = 60 * 60 * 1000): number => {
				const cutoff = Date.now() - olderThanMs;
				const before = get().transactions.length;
				set((state) => ({
					transactions: state.transactions.filter(tx =>
						tx.status !== 'confirmed' || tx.updatedAt > cutoff
					),
				}));
				return before - get().transactions.length;
			},

			clear: () => {
				set({ transactions: [] });
			},

			getQueueStats: () => {
				const txs = get().transactions;
				const byStatus: Record<string, number> = {};
				const byType: Record<string, number> = {};

				for (const tx of txs) {
					byStatus[tx.status] = (byStatus[tx.status] || 0) + 1;
					byType[tx.actionType] = (byType[tx.actionType] || 0) + 1;
				}

				return { total: txs.length, byStatus, byType };
			},
		}),
		{
			name: 'ragnarok-blockchain-queue',
			partialize: (state) => ({
				transactions: state.transactions.slice(0, MAX_QUEUE_SIZE),
			}),
		}
	)
);

useTransactionQueueStore.getState().cleanupExpired();

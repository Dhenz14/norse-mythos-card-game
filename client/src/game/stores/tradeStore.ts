import { create } from 'zustand';

export interface TradeOffer {
	id: string;
	fromUser: string;
	toUser: string;
	offeredCardIds: number[];
	requestedCardIds: number[];
	offeredDust: number;
	requestedDust: number;
	status: 'pending' | 'accepted' | 'declined' | 'cancelled';
	createdAt: number;
	expiresAt: number;
}

interface TradeState {
	offers: TradeOffer[];
	selectedOfferedCards: number[];
	selectedRequestedCards: number[];
	offeredDust: number;
	requestedDust: number;
	loading: boolean;
	error: string | null;
}

interface TradeActions {
	fetchOffers: (username: string) => Promise<void>;
	createOffer: (toUser: string) => Promise<boolean>;
	acceptOffer: (offerId: string) => Promise<boolean>;
	declineOffer: (offerId: string) => Promise<boolean>;
	cancelOffer: (offerId: string) => Promise<boolean>;
	toggleOfferedCard: (cardId: number) => void;
	toggleRequestedCard: (cardId: number) => void;
	setOfferedDust: (amount: number) => void;
	setRequestedDust: (amount: number) => void;
	clearSelections: () => void;
}

export const useTradeStore = create<TradeState & TradeActions>()((set, get) => ({
	offers: [],
	selectedOfferedCards: [],
	selectedRequestedCards: [],
	offeredDust: 0,
	requestedDust: 0,
	loading: false,
	error: null,

	fetchOffers: async (username) => {
		set({ loading: true, error: null });
		try {
			const res = await fetch(`/api/trades/${encodeURIComponent(username)}`);
			if (res.ok) {
				const data = await res.json();
				set({ offers: data.offers || [], loading: false });
			} else {
				set({ error: 'Failed to load trades', loading: false });
			}
		} catch {
			set({ error: 'Network error', loading: false });
		}
	},

	createOffer: async (toUser) => {
		const { selectedOfferedCards, selectedRequestedCards, offeredDust, requestedDust } = get();
		if (selectedOfferedCards.length === 0 && offeredDust === 0) return false;
		set({ loading: true, error: null });
		try {
			const res = await fetch('/api/trades', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					toUser,
					offeredCardIds: selectedOfferedCards,
					requestedCardIds: selectedRequestedCards,
					offeredDust,
					requestedDust,
				}),
			});
			if (res.ok) {
				const data = await res.json();
				set(s => ({ offers: [data.offer, ...s.offers], loading: false }));
				get().clearSelections();
				return true;
			}
			set({ error: 'Failed to create trade', loading: false });
			return false;
		} catch {
			set({ error: 'Network error', loading: false });
			return false;
		}
	},

	acceptOffer: async (offerId) => {
		try {
			const res = await fetch(`/api/trades/${offerId}/accept`, { method: 'POST' });
			if (res.ok) {
				set(s => ({
					offers: s.offers.map(o => o.id === offerId ? { ...o, status: 'accepted' as const } : o),
				}));
				return true;
			}
			return false;
		} catch {
			return false;
		}
	},

	declineOffer: async (offerId) => {
		try {
			const res = await fetch(`/api/trades/${offerId}/decline`, { method: 'POST' });
			if (res.ok) {
				set(s => ({
					offers: s.offers.map(o => o.id === offerId ? { ...o, status: 'declined' as const } : o),
				}));
				return true;
			}
			return false;
		} catch {
			return false;
		}
	},

	cancelOffer: async (offerId) => {
		try {
			const res = await fetch(`/api/trades/${offerId}/cancel`, { method: 'POST' });
			if (res.ok) {
				set(s => ({
					offers: s.offers.map(o => o.id === offerId ? { ...o, status: 'cancelled' as const } : o),
				}));
				return true;
			}
			return false;
		} catch {
			return false;
		}
	},

	toggleOfferedCard: (cardId) => {
		set(s => ({
			selectedOfferedCards: s.selectedOfferedCards.includes(cardId)
				? s.selectedOfferedCards.filter(id => id !== cardId)
				: [...s.selectedOfferedCards, cardId],
		}));
	},

	toggleRequestedCard: (cardId) => {
		set(s => ({
			selectedRequestedCards: s.selectedRequestedCards.includes(cardId)
				? s.selectedRequestedCards.filter(id => id !== cardId)
				: [...s.selectedRequestedCards, cardId],
		}));
	},

	setOfferedDust: (amount) => set({ offeredDust: Math.max(0, amount) }),
	setRequestedDust: (amount) => set({ requestedDust: Math.max(0, amount) }),

	clearSelections: () => set({
		selectedOfferedCards: [],
		selectedRequestedCards: [],
		offeredDust: 0,
		requestedDust: 0,
	}),
}));

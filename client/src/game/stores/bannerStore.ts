import { create } from 'zustand';

export type BannerType = 'info' | 'error' | 'success' | 'warning';

export interface BannerMessage {
	id: number;
	text: string;
	type: BannerType;
	duration: number;
}

interface BannerStore {
	messages: BannerMessage[];
	push: (text: string, type?: BannerType, duration?: number) => void;
	remove: (id: number) => void;
}

let nextId = 0;

export const useBannerStore = create<BannerStore>((set) => ({
	messages: [],
	push: (text, type = 'info', duration = 2800) => {
		const id = ++nextId;
		set(s => ({ messages: [...s.messages.slice(-2), { id, text, type, duration }] }));
		setTimeout(() => set(s => ({ messages: s.messages.filter(m => m.id !== id) })), duration);
	},
	remove: (id) => set(s => ({ messages: s.messages.filter(m => m.id !== id) })),
}));

export function showStatus(text: string, type: BannerType = 'info', duration = 2800) {
	useBannerStore.getState().push(text, type, duration);
}

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getDustValue, getCraftCost } from './craftingConstants';

interface CraftingState {
	dust: number;
}

interface CraftingActions {
	addDust: (amount: number) => void;
	spendDust: (amount: number) => boolean;
	canAfford: (rarity: string, golden?: boolean) => boolean;
	getDisenchantValue: (rarity: string) => number;
	getCraftingCost: (rarity: string, golden?: boolean) => number;
}

export const useCraftingStore = create<CraftingState & CraftingActions>()(
	persist(
		(set, get) => ({
			dust: 0,

			addDust: (amount) => {
				set(state => ({ dust: state.dust + amount }));
			},

			spendDust: (amount) => {
				if (get().dust < amount) return false;
				set(state => ({ dust: state.dust - amount }));
				return true;
			},

			canAfford: (rarity, golden = false) => {
				return get().dust >= getCraftCost(rarity, golden);
			},

			getDisenchantValue: (rarity) => {
				return getDustValue(rarity);
			},

			getCraftingCost: (rarity, golden = false) => {
				return getCraftCost(rarity, golden);
			},
		}),
		{
			name: 'ragnarok-crafting',
			partialize: (state) => ({ dust: state.dust }),
		}
	)
);
